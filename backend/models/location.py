"""
models/location.py
───────────────────
ORM table for campus infrastructure locations.
Maps floors and rooms to facility types and primary academic branches.
"""

from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, Integer, String
from pydantic import BaseModel

from db.database import Base


class LocationORM(Base):
    __tablename__ = "locations"

    id             = Column(Integer,     primary_key=True, index=True, autoincrement=True)
    floor          = Column(String(32),  nullable=False, index=True)   # e.g. "Ground", "1st", "-1"
    room_name      = Column(String(128), nullable=False)               # e.g. "Classroom 101", "Lab 3"
    facility_type  = Column(String(64),  nullable=False, index=True)   # e.g. "Classroom", "Lab"
    primary_branch = Column(String(64),  nullable=True,  index=True)   # e.g. "CSE", "AIDS", None


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class LocationOut(BaseModel):
    id:             int
    floor:          str
    room_name:      str
    facility_type:  str
    primary_branch: Optional[str] = None

    class Config:
        from_attributes = True