"""
routers/complaints.py
──────────────────────
POST   /api/complaints/           submit complaint
GET    /api/complaints/           list (filter by user_id / status / priority / emergency)
GET    /api/complaints/{id}       single
PATCH  /api/complaints/{id}       update status/action
PATCH  /api/complaints/{id}/demote  admin demotes emergency to general
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from db.database import get_db
from models.complaint import ComplaintCreate, ComplaintUpdate, ComplaintOut, AnalysisResult
from models.user import UserORM
from services import complaint_service

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


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
    return {**ComplaintOut.from_orm(record).model_dump(), "analysis": analysis}


@router.get("/", response_model=list[ComplaintOut])
def list_complaints(
    user_id:        Optional[str]  = Query(None),
    status:         Optional[str]  = Query(None),
    priority:       Optional[str]  = Query(None),
    emergency_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
):
    return complaint_service.get_all(
        db, user_id=user_id, status=status,
        priority=priority, emergency_only=emergency_only
    )


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    record = complaint_service.get_by_id(db, complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record


@router.patch("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(complaint_id: int, payload: ComplaintUpdate, db: Session = Depends(get_db)):
    record = complaint_service.update_complaint(db, complaint_id, payload)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record


@router.patch("/{complaint_id}/demote", response_model=ComplaintOut)
def demote_emergency(complaint_id: int, db: Session = Depends(get_db)):
    """Admin marks an emergency as not genuine — moves it to general list."""
    record = complaint_service.demote_complaint(db, complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record
