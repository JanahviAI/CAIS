"""
services/complaint_service.py
──────────────────────────────
Orchestration: NLP + decision engine + DB.
"""

from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models.complaint import ComplaintORM, ComplaintCreate, ComplaintUpdate, AnalysisResult
from models.user import UserORM
from services.nlp import score_urgency, find_similar, cluster_complaints
from services.decision_engine import classify
from services.email_service import notify_submitted, notify_status_changed


def create_complaint(db: Session, payload: ComplaintCreate, user_prn: str = None, user_branch: str = None, user_year: str = None) -> tuple[ComplaintORM, AnalysisResult]:
    urgency  = score_urgency(payload.text)
    decision = classify(payload.text, urgency, is_emergency=payload.is_emergency or False)

    existing    = db.query(ComplaintORM).all()
    corpus      = [c.text for c in existing]
    corpus_ids  = [c.id   for c in existing]
    similar_ids = find_similar(payload.text, corpus, corpus_ids, top_n=5)

    record = ComplaintORM(
        user_id          = payload.user_id,
        prn              = user_prn,
        branch           = user_branch,
        year             = user_year,
        text             = payload.text,
        category         = decision.category,
        priority         = decision.priority,
        status           = "Open",
        sentiment        = urgency,
        location         = payload.location or "Unknown",
        action_taken     = "",
        is_emergency     = payload.is_emergency or False,
        demoted_by_admin = False,
        submitted_at     = date.today(),
        updated_at       = datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    _recluster(db)

    # ── Email: notify user their complaint was received ──
    user = db.query(UserORM).filter(UserORM.user_id == payload.user_id).first()
    if user and user.email:
        notify_submitted(user.email, record.id, decision.category)

    result = AnalysisResult(
        category         = decision.category,
        priority         = decision.priority,
        sentiment        = urgency,
        summary          = decision.summary,
        suggested_action = decision.suggested_action,
        similar_ids      = similar_ids,
    )
    return record, result


def get_all(db: Session, user_id: Optional[str] = None, status: Optional[str] = None,
            priority: Optional[str] = None, emergency_only: bool = False,
            dept_id: Optional[int] = None) -> List[ComplaintORM]:
    q = db.query(ComplaintORM)
    if user_id:
        q = q.filter(ComplaintORM.user_id == user_id)
    if status:
        q = q.filter(ComplaintORM.status == status)
    if priority:
        q = q.filter(ComplaintORM.priority == priority)
    if emergency_only:
        q = q.filter(ComplaintORM.is_emergency == True, ComplaintORM.demoted_by_admin == False)
    if dept_id is not None:
        q = q.filter(ComplaintORM.dept_id == dept_id)
    return q.order_by(ComplaintORM.submitted_at.desc()).all()


def get_by_id(db: Session, complaint_id: int) -> Optional[ComplaintORM]:
    return db.query(ComplaintORM).filter(ComplaintORM.id == complaint_id).first()


def update_complaint(db: Session, complaint_id: int, payload: ComplaintUpdate) -> Optional[ComplaintORM]:
    record = get_by_id(db, complaint_id)
    if not record:
        return None
    if payload.status is not None:
        record.status = payload.status
    if payload.action_taken is not None:
        record.action_taken = payload.action_taken
    if payload.dept_id is not None:
        record.dept_id = payload.dept_id
    if payload.approved_by is not None:
        record.approved_by = payload.approved_by
    if payload.approval_notes is not None:
        record.approval_notes = payload.approval_notes
    record.updated_at = datetime.utcnow()
    db.commit()

    # ── Email: notify user their complaint status changed ──
    if payload.status is not None:
        user = db.query(UserORM).filter(UserORM.user_id == record.user_id).first()
        if user and user.email:
            notify_status_changed(user.email, complaint_id, "previous", payload.status)

    db.refresh(record)
    return record


def demote_complaint(db: Session, complaint_id: int) -> Optional[ComplaintORM]:
    """Admin marks an emergency complaint as not a real emergency."""
    record = get_by_id(db, complaint_id)
    if not record:
        return None
    record.demoted_by_admin = True
    record.priority         = "High"
    record.updated_at       = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


def get_stats(db: Session) -> dict:
    all_c    = db.query(ComplaintORM).all()
    total    = len(all_c)
    open_c   = sum(1 for c in all_c if c.status == "Open")
    critical = sum(1 for c in all_c if c.priority == "Critical")
    resolved = sum(1 for c in all_c if c.status == "Resolved")
    in_prog  = sum(1 for c in all_c if c.status == "In Progress")
    emergency_active = sum(1 for c in all_c if c.is_emergency and not c.demoted_by_admin)

    cat_counts: dict[str, int]  = {}
    pri_counts: dict[str, int]  = {}
    zone_counts: dict[str, int] = {}

    for c in all_c:
        cat_counts[c.category  or "Other"]   = cat_counts.get(c.category  or "Other",   0) + 1
        pri_counts[c.priority  or "Medium"]  = pri_counts.get(c.priority  or "Medium",  0) + 1
        zone_counts[c.location or "Unknown"] = zone_counts.get(c.location or "Unknown", 0) + 1

    from collections import defaultdict
    daily: dict[str, int] = defaultdict(int)
    for c in all_c:
        daily[str(c.submitted_at)] += 1

    avg_urgency = round(
        sum(c.sentiment or 50 for c in all_c) / total, 1
    ) if total else 0

    return {
        "total":            total,
        "open":             open_c,
        "critical":         critical,
        "resolved":         resolved,
        "in_progress":      in_prog,
        "emergency_active": emergency_active,
        "avg_urgency":      avg_urgency,
        "by_category":  [{"name": k, "value": v} for k, v in sorted(cat_counts.items(),  key=lambda x: -x[1])],
        "by_priority":  [{"name": k, "value": v} for k, v in pri_counts.items()],
        "by_zone":      [{"name": k, "value": v} for k, v in sorted(zone_counts.items(), key=lambda x: -x[1])],
        "daily_trend":  [{"date": k, "count": v} for k, v in sorted(daily.items())[-14:]],
    }


def _recluster(db: Session) -> None:
    records = db.query(ComplaintORM).all()
    if len(records) < 2:
        return
    labels = cluster_complaints([r.text for r in records])
    for record, label in zip(records, labels):
        record.cluster_id = int(label)
    db.commit()