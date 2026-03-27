"""
models/complaint.py
────────────────────
ORM table + Pydantic schemas for complaints.
New columns: is_emergency, demoted_by_admin
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


class ComplaintCreate(BaseModel):
    user_id:      str  = Field(..., min_length=1, max_length=64)
    text:         str  = Field(..., min_length=10, max_length=4000)
    location:     Optional[str] = "Unknown"
    is_emergency: Optional[bool] = False


class ComplaintUpdate(BaseModel):
    status:       Optional[str] = None
    action_taken: Optional[str] = None


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

    class Config:
        from_attributes = True


class AnalysisResult(BaseModel):
    category:         str
    priority:         str
    sentiment:        float
    summary:          str
    suggested_action: str
    similar_ids:      list[int] = []
