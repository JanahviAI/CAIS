"""
models/audit_log.py
────────────────────
ORM table for audit trail logging.
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime, Text
from pydantic import BaseModel

from db.database import Base


class AuditLogORM(Base):
    __tablename__ = "audit_logs"

    id           = Column(Integer,  primary_key=True, index=True, autoincrement=True)
    user_id      = Column(String(64), nullable=False, index=True)
    action       = Column(String(64), nullable=False)
    complaint_id = Column(Integer,  nullable=True, index=True)
    dept_id      = Column(Integer,  nullable=True)
    details      = Column(Text,     nullable=True)
    created_at   = Column(DateTime, nullable=False, default=datetime.utcnow)


class AuditLogOut(BaseModel):
    id:           int
    user_id:      str
    action:       str
    complaint_id: Optional[int] = None
    dept_id:      Optional[int] = None
    details:      Optional[str] = None
    created_at:   datetime

    class Config:
        from_attributes = True
