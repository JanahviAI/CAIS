"""
routers/analytics.py
─────────────────────
Endpoints consumed by the admin analytics dashboard.

  GET /api/analytics/stats                    – KPI cards + chart data (all-in-one, existing)
  GET /api/analytics/clusters                 – complaints grouped by cluster_id (existing)
  GET /api/analytics/organization             – org-wide metrics (super admin)
  GET /api/analytics/department/{dept_id}     – dept-scoped metrics (dept head)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from collections import defaultdict
from typing import Optional

from db.database import get_db
from models.complaint import ComplaintOut
from models.user import UserORM
from services import complaint_service
from services.analytics_service import get_department_stats, get_organization_stats

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _require_super_admin(user_id: str, db: Session):
    user = db.query(UserORM).filter(UserORM.user_id == user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    return user


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Returns a single JSON payload used to populate:
      - KPI cards (total, open, critical, resolved, in_progress, avg_urgency)
      - Bar chart  (by_category)
      - Pie chart  (by_priority)
      - Line chart (daily_trend)
      - Horizontal bar (by_zone)
    """
    return complaint_service.get_stats(db)


@router.get("/clusters", response_model=list[dict])
def get_clusters(db: Session = Depends(get_db)):
    """
    Returns complaints grouped by cluster_id.
    Each item: { cluster_id, count, top_category, complaints: [ComplaintOut] }
    """
    records = complaint_service.get_all(db)
    groups: dict[int, list] = defaultdict(list)
    for r in records:
        groups[r.cluster_id if r.cluster_id is not None else -1].append(r)

    result = []
    for cid, members in sorted(groups.items()):
        cats = [m.category for m in members if m.category]
        top_cat = max(set(cats), key=cats.count) if cats else "Unknown"
        result.append({
            "cluster_id":    cid,
            "count":         len(members),
            "top_category":  top_cat,
            "complaints":    [ComplaintOut.from_orm(m).model_dump() for m in members],
        })
    return result


@router.get("/organization")
def get_organization_analytics(
    user_id: str = Query(..., description="Super admin user_id"),
    db: Session = Depends(get_db),
):
    """Organization-wide analytics. Super admin only."""
    _require_super_admin(user_id, db)
    return get_organization_stats(db)


@router.get("/department/{dept_id}")
def get_department_analytics(
    dept_id: int,
    user_id: str = Query(..., description="Requesting user_id for permission check"),
    db: Session = Depends(get_db),
):
    """Department-scoped analytics. Super admin or the department's own head."""
    user = db.query(UserORM).filter(UserORM.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not user.is_super_admin and user.dept_id != dept_id:
        raise HTTPException(status_code=403,
                            detail="Access denied: not your department.")

    return get_department_stats(db, dept_id=dept_id)
