"""
services/analytics_service.py
───────────────────────────────
Extended analytics: department-scoped KPIs + org-wide metrics.
"""

from __future__ import annotations
from collections import defaultdict
from datetime import datetime, timedelta, date
from typing import Optional

from sqlalchemy.orm import Session

from models.complaint import ComplaintORM
from models.department import DepartmentORM


def _resolution_time_days(c: ComplaintORM) -> Optional[float]:
    """Return days between submission and resolution (None if not resolved)."""
    if c.status != "Resolved":
        return None
    if not c.submitted_at:
        return None
    resolved_date = c.updated_at.date() if c.updated_at else date.today()
    return max(0.0, (resolved_date - c.submitted_at).days)


def get_department_stats(db: Session, dept_id: Optional[int] = None) -> dict:
    """
    Returns analytics for a specific department (dept_id) or all complaints
    (dept_id=None for org-wide).
    """
    q = db.query(ComplaintORM)
    if dept_id is not None:
        q = q.filter(ComplaintORM.dept_id == dept_id)

    all_c = q.all()
    total    = len(all_c)
    open_c   = sum(1 for c in all_c if c.status == "Open")
    critical = sum(1 for c in all_c if c.priority == "Critical")
    resolved = sum(1 for c in all_c if c.status == "Resolved")
    in_prog  = sum(1 for c in all_c if c.status == "In Progress")
    emergency_active = sum(1 for c in all_c if c.is_emergency and not c.demoted_by_admin)

    # Resolution rate
    resolution_rate = round((resolved / total * 100), 1) if total else 0.0

    # Average resolution time
    res_times = [_resolution_time_days(c) for c in all_c]
    res_times = [t for t in res_times if t is not None]
    avg_resolution_days = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

    cat_counts: dict[str, int]  = {}
    pri_counts: dict[str, int]  = {}
    zone_counts: dict[str, int] = {}
    status_counts: dict[str, int] = {}

    for c in all_c:
        cat_counts[c.category  or "Other"]   = cat_counts.get(c.category  or "Other",   0) + 1
        pri_counts[c.priority  or "Medium"]  = pri_counts.get(c.priority  or "Medium",  0) + 1
        zone_counts[c.location or "Unknown"] = zone_counts.get(c.location or "Unknown", 0) + 1
        status_counts[c.status]              = status_counts.get(c.status,              0) + 1

    # Daily trend (last 30 days)
    daily: dict[str, int] = defaultdict(int)
    for c in all_c:
        daily[str(c.submitted_at)] += 1

    # 7-day vs 30-day comparison
    today   = date.today()
    week_ago  = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    last_7  = sum(1 for c in all_c if c.submitted_at and c.submitted_at >= week_ago)
    last_30 = sum(1 for c in all_c if c.submitted_at and c.submitted_at >= month_ago)

    avg_urgency = round(
        sum(c.sentiment or 50 for c in all_c) / total, 1
    ) if total else 0

    return {
        "total":               total,
        "open":                open_c,
        "critical":            critical,
        "resolved":            resolved,
        "in_progress":         in_prog,
        "emergency_active":    emergency_active,
        "resolution_rate":     resolution_rate,
        "avg_resolution_days": avg_resolution_days,
        "avg_urgency":         avg_urgency,
        "last_7_days":         last_7,
        "last_30_days":        last_30,
        "by_category":    [{"name": k, "value": v} for k, v in sorted(cat_counts.items(),    key=lambda x: -x[1])],
        "by_priority":    [{"name": k, "value": v} for k, v in pri_counts.items()],
        "by_zone":        [{"name": k, "value": v} for k, v in sorted(zone_counts.items(),   key=lambda x: -x[1])],
        "by_status":      [{"name": k, "value": v} for k, v in status_counts.items()],
        "daily_trend":    [{"date": k, "count": v} for k, v in sorted(daily.items())[-30:]],
    }


def get_organization_stats(db: Session) -> dict:
    """
    Org-wide stats including per-department breakdown.
    For Super Admin use.
    """
    base_stats = get_department_stats(db, dept_id=None)

    departments = db.query(DepartmentORM).all()
    dept_breakdown = []
    for dept in departments:
        d_complaints = db.query(ComplaintORM).filter(
            ComplaintORM.dept_id == dept.id
        ).all()
        d_total    = len(d_complaints)
        d_resolved = sum(1 for c in d_complaints if c.status == "Resolved")
        d_open     = sum(1 for c in d_complaints if c.status == "Open")
        d_rate     = round((d_resolved / d_total * 100), 1) if d_total else 0.0
        dept_breakdown.append({
            "dept_id":         dept.id,
            "dept_name":       dept.name,
            "total":           d_total,
            "resolved":        d_resolved,
            "open":            d_open,
            "resolution_rate": d_rate,
        })

    # Unassigned complaints
    unassigned = db.query(ComplaintORM).filter(ComplaintORM.dept_id.is_(None)).count()

    base_stats["departments"] = dept_breakdown
    base_stats["unassigned"]  = unassigned
    return base_stats
