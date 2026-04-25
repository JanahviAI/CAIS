"""
models/branch.py
─────────────────
ORM tables for academic branches and their mapping to support departments.

Academic Branches: AIDS, CSE, AIML, IT, IoT
Support Departments: Maintenance, Canteen (handle cross-branch issues)
"""

from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, Integer, String, ForeignKey
from pydantic import BaseModel

from db.database import Base


class BranchORM(Base):
    __tablename__ = "branches"

    id          = Column(Integer,     primary_key=True, index=True, autoincrement=True)
    name        = Column(String(64),  nullable=False, unique=True, index=True)
    description = Column(String(256), nullable=True)


class AcademicBranchDeptORM(Base):
    """Junction table linking an academic branch to its responsible department."""
    __tablename__ = "academic_branch_depts"

    id        = Column(Integer, primary_key=True, index=True, autoincrement=True)
    branch_id = Column(Integer, ForeignKey("branches.id"),     nullable=False, index=True)
    dept_id   = Column(Integer, ForeignKey("departments.id"),  nullable=False, index=True)


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class BranchOut(BaseModel):
    id:          int
    name:        str
    description: Optional[str] = None

    class Config:
        from_attributes = True