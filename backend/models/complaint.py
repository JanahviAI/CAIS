"""
models/complaint.py
────────────────────
ORM table + Pydantic schemas for complaints.
New columns: is_emergency, demoted_by_admin, dept_id, approved_by,
             approval_notes, root_cause, severity_factors, recommended_dept
"""

from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Boolean
from pydantic import BaseModel, Field
from db.database import Base


class ComplaintORM(Base):
    __tablename__ = "complaints"

    id               = Column(Integer,  primary_key=True, index=True, autoincrement=True)
    user_id          = Column(String(64),  nullable=False, index=True)
    prn              = Column(String(20),  nullable=True)
    branch           = Column(String(32),  nullable=True)
    year             = Column(String(32),  nullable=True)
    text             = Column(Text,        nullable=False)
    category         = Column(String(64),  nullable=True)
    priority         = Column(String(16),  nullable=True)
    status           = Column(String(32),  nullable=False, default="Open")
    sentiment        = Column(Float,       nullable=True)
    location         = Column(String(128), nullable=True)
    action_taken     = Column(Text,        nullable=True, default="")
    cluster_id       = Column(Integer,     nullable=True)
    is_emergency     = Column(Boolean,     nullable=False, default=False)
    demoted_by_admin = Column(Boolean,     nullable=False, default=False)
    submitted_at     = Column(Date,        nullable=False, default=date.today)
    updated_at       = Column(DateTime,    nullable=False, default=datetime.utcnow,
                              onupdate=datetime.utcnow)
    # ── Department & approval fields ──────────────────────────────────────────
    dept_id          = Column(Integer,     nullable=True, index=True)
    approved_by      = Column(String(64),  nullable=True)
    approval_notes   = Column(Text,        nullable=True)
    # ── Root Cause Analysis fields ────────────────────────────────────────────
    root_cause       = Column(Text,        nullable=True)
    severity_factors = Column(Text,        nullable=True)
    recommended_dept = Column(String(128), nullable=True)


class ComplaintCreate(BaseModel):
    user_id:      str  = Field(..., min_length=1, max_length=64)
    text:         str  = Field(..., min_length=10, max_length=4000)
    location:     Optional[str] = "Unknown"
    is_emergency: Optional[bool] = False
    dept_id:      Optional[int] = None


class ComplaintUpdate(BaseModel):
    status:         Optional[str] = None
    action_taken:   Optional[str] = None
    dept_id:        Optional[int] = None
    approved_by:    Optional[str] = None
    approval_notes: Optional[str] = None


class ComplaintOut(BaseModel):
    id:               int
    user_id:          str
    prn:              Optional[str]
    branch:           Optional[str]
    year:             Optional[str]
    text:             str
    category:         Optional[str]
    priority:         Optional[str]
    status:           str
    sentiment:        Optional[float]
    location:         Optional[str]
    action_taken:     Optional[str]
    cluster_id:       Optional[int]
    is_emergency:     bool
    demoted_by_admin: bool
    submitted_at:     date
    updated_at:       datetime
    dept_id:          Optional[int] = None
    approved_by:      Optional[str] = None
    approval_notes:   Optional[str] = None
    root_cause:       Optional[str] = None
    severity_factors: Optional[str] = None
    recommended_dept: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisResult(BaseModel):
    category:         str
    priority:         str
    sentiment:        float
    summary:          str
    suggested_action: str
    similar_ids:      list[int] = []
