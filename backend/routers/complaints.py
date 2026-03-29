"""
routers/complaints.py
──────────────────────
POST   /api/complaints/           submit complaint (triggers RCA automatically)
GET    /api/complaints/           list (filter by user_id / status / priority / emergency / dept)
GET    /api/complaints/{id}       single
PATCH  /api/complaints/{id}       update status/action (permission-checked)
PATCH  /api/complaints/{id}/demote  admin demotes emergency to general
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from db.database import get_db
from models.complaint import ComplaintCreate, ComplaintUpdate, ComplaintOut, AnalysisResult
from models.user import UserORM
from models.audit_log import AuditLogORM
from services import complaint_service
from services.rca_service import analyze_complaint
from services.anomaly_detection import detect_anomaly

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def _log_action(db: Session, user_id: str, action: str,
                complaint_id: Optional[int] = None,
                dept_id: Optional[int] = None,
                details: Optional[str] = None):
    log = AuditLogORM(
        user_id      = user_id,
        action       = action,
        complaint_id = complaint_id,
        dept_id      = dept_id,
        details      = details,
        created_at   = datetime.utcnow(),
    )
    db.add(log)
    db.commit()


def _check_modify_permission(user_id: str, complaint, db: Session):
    """
    Raise 403 if the user does not have permission to modify this complaint.
    Rules:
      - super_admin → always allowed
      - dept_head → only their department's complaints
      - user → only their own complaints
    """
    user = db.query(UserORM).filter(UserORM.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_super_admin:
        return user
    if user.role == "dept_head":
        if complaint.dept_id is None or complaint.dept_id != user.dept_id:
            raise HTTPException(status_code=403,
                                detail="Department heads can only modify their department's complaints.")
        return user
    # Regular user: only own complaints
    if complaint.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own complaints.")
    return user


class CreateResponse(ComplaintOut):
    analysis: AnalysisResult
    class Config:
        from_attributes = True


@router.post("/", response_model=CreateResponse, status_code=201)
def submit_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    # Fetch user details to attach PRN/branch/year to complaint
    user = db.query(UserORM).filter(UserORM.user_id == payload.user_id).first()
    prn    = user.prn    if user else None
    branch = user.branch if user else None
    year   = user.year   if user else None

    record, analysis = complaint_service.create_complaint(
        db, payload, user_prn=prn, user_branch=branch, user_year=year
    )

    # Run RCA and persist
    rca = analyze_complaint(record.text, record.category, record.location)
    record.root_cause       = rca["root_cause"]
    record.severity_factors = rca["severity_factors"]
    record.recommended_dept = rca["recommended_dept"]

    # Run Anomaly Detection
    anomaly_result = detect_anomaly(record, db)
    record.is_anomaly = anomaly_result['is_anomaly']

    db.commit()
    db.refresh(record)

    _log_action(db, payload.user_id, "submit_complaint",
                complaint_id=record.id, dept_id=record.dept_id,
                details=f"anomaly={record.is_anomaly}")
    return {**ComplaintOut.from_orm(record).model_dump(), "analysis": analysis}


@router.get("/", response_model=list[ComplaintOut])
def list_complaints(
    user_id:        Optional[str]  = Query(None),
    status:         Optional[str]  = Query(None),
    priority:       Optional[str]  = Query(None),
    emergency_only: Optional[bool] = Query(False),
    dept_id:        Optional[int]  = Query(None),
    viewer_id:      Optional[str]  = Query(None, description="ID of user viewing (for role-based filtering)"),
    db: Session = Depends(get_db),
):
    """
    List complaints with optional department-scoped filtering.
    If viewer_id is a dept_head, they see all complaints (read-only context)
    but the client should differentiate display.
    """
    return complaint_service.get_all(
        db, user_id=user_id, status=status,
        priority=priority, emergency_only=emergency_only,
        dept_id=dept_id,
    )


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    record = complaint_service.get_by_id(db, complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record


@router.patch("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    payload: ComplaintUpdate,
    actor_id: Optional[str] = Query(None, description="User making the change (for permission check & audit)"),
    db: Session = Depends(get_db),
):
    record = complaint_service.get_by_id(db, complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Permission check (optional: skip if actor_id not supplied for backward compat)
    if actor_id:
        _check_modify_permission(actor_id, record, db)

    updated = complaint_service.update_complaint(db, complaint_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if actor_id:
        _log_action(db, actor_id, "update_complaint",
                    complaint_id=complaint_id, dept_id=record.dept_id,
                    details=f"status={payload.status}")
    return updated


@router.patch("/{complaint_id}/demote", response_model=ComplaintOut)
def demote_emergency(
    complaint_id: int,
    actor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Admin marks an emergency as not genuine — moves it to general list."""
    record = complaint_service.demote_complaint(db, complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if actor_id:
        _log_action(db, actor_id, "demote_emergency",
                    complaint_id=complaint_id, dept_id=record.dept_id)
    return record
