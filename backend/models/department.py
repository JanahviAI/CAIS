"""
models/department.py
─────────────────────
ORM tables for departments and the department_admins junction.
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from pydantic import BaseModel

from db.database import Base


class DepartmentORM(Base):
    __tablename__ = "departments"

    id         = Column(Integer,     primary_key=True, index=True, autoincrement=True)
    name       = Column(String(128), nullable=False, unique=True, index=True)
    location   = Column(String(256), nullable=True)
    created_at = Column(DateTime,    nullable=False, default=datetime.utcnow)


class DepartmentAdminORM(Base):
    __tablename__ = "department_admins"

    id         = Column(Integer,     primary_key=True, index=True, autoincrement=True)
    user_id    = Column(String(64),  nullable=False, index=True)
    dept_id    = Column(Integer,     ForeignKey("departments.id"), nullable=False, index=True)
    created_at = Column(DateTime,    nullable=False, default=datetime.utcnow)


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name:     str
    location: Optional[str] = None


class DepartmentOut(BaseModel):
    id:       int
    name:     str
    location: Optional[str] = None

    class Config:
        from_attributes = True


class AssignAdminRequest(BaseModel):
    user_id: str
