"""
routers/rca.py
───────────────
GET /api/complaints/{complaint_id}/analysis  – fetch RCA for a complaint
POST /api/complaints/{complaint_id}/analysis – re-run RCA and persist results
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import get_db
from models.complaint import ComplaintORM
from services.rca_service import analyze_complaint

router = APIRouter(prefix="/api/complaints", tags=["rca"])


@router.get("/{complaint_id}/analysis")
def get_analysis(complaint_id: int, db: Session = Depends(get_db)):
    """Return the stored RCA for a complaint (or run it on-demand if missing)."""
    record = db.query(ComplaintORM).filter(ComplaintORM.id == complaint_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    # Run on-demand if not yet stored
    if not record.root_cause:
        rca = analyze_complaint(record.text, record.category, record.location)
        record.root_cause       = rca["root_cause"]
        record.severity_factors = rca["severity_factors"]
        record.recommended_dept = rca["recommended_dept"]
        record.updated_at       = datetime.utcnow()
        db.commit()
        db.refresh(record)

    return {
        "complaint_id":    record.id,
        "root_cause":      record.root_cause,
        "severity_factors":record.severity_factors,
        "recommended_dept":record.recommended_dept,
        "category":        record.category,
        "priority":        record.priority,
    }


@router.post("/{complaint_id}/analysis")
def rerun_analysis(complaint_id: int, db: Session = Depends(get_db)):
    """Force re-run of RCA analysis and persist updated results."""
    record = db.query(ComplaintORM).filter(ComplaintORM.id == complaint_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    rca = analyze_complaint(record.text, record.category, record.location)
    record.root_cause       = rca["root_cause"]
    record.severity_factors = rca["severity_factors"]
    record.recommended_dept = rca["recommended_dept"]
    record.updated_at       = datetime.utcnow()
    db.commit()
    db.refresh(record)

    return {
        "complaint_id":    record.id,
        "root_cause":      record.root_cause,
        "severity_factors":record.severity_factors,
        "recommended_dept":record.recommended_dept,
        "confidence":      rca.get("confidence", "Medium"),
    }
