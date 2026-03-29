"""
routers/anomaly.py
───────────────────
GET /api/anomalies                  – overall anomalies
GET /api/anomalies/by-category      – category-level anomalies
GET /api/anomalies/department/{id}  – anomalies for a specific department
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from db.database import get_db
from models.complaint import ComplaintORM
from services.anomaly_service import detect_anomalies, detect_category_anomalies

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.get("/")
def get_anomalies(
    dept_id: Optional[int] = Query(None, description="Filter by department (omit for org-wide)"),
    db: Session = Depends(get_db),
):
    """
    Detect complaint volume anomalies.
    Returns a list of anomaly records sorted by date (most recent first).
    """
    q = db.query(ComplaintORM)
    if dept_id is not None:
        q = q.filter(ComplaintORM.dept_id == dept_id)
    complaints = q.all()
    anomalies = detect_anomalies(complaints)
    return {
        "total_anomalies": len(anomalies),
        "anomalies":       anomalies,
    }


@router.get("/by-category")
def get_category_anomalies(
    dept_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Detect anomalies per complaint category."""
    q = db.query(ComplaintORM)
    if dept_id is not None:
        q = q.filter(ComplaintORM.dept_id == dept_id)
    complaints = q.all()
    anomalies = detect_category_anomalies(complaints)
    return {
        "total_anomalies": len(anomalies),
        "anomalies":       anomalies,
    }


@router.get("/department/{dept_id}")
def get_dept_anomalies(dept_id: int, db: Session = Depends(get_db)):
    """Anomalies for a specific department."""
    complaints = db.query(ComplaintORM).filter(
        ComplaintORM.dept_id == dept_id
    ).all()
    anomalies = detect_anomalies(complaints)
    return {
        "dept_id":         dept_id,
        "total_anomalies": len(anomalies),
        "anomalies":       anomalies,
    }
