"""
models/user.py
───────────────
ORM table for SIES GST users + Pydantic schemas.

PRN format  : 3 digits (batch year) + 1 letter (branch) + digits  e.g. 124A8107
Email format: firstname+initials+branch+batch@gst.sies.edu.in
Login       : email + password  (no separate username field)
"""

from __future__ import annotations
import re
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from pydantic import BaseModel, Field, field_validator
from db.database import Base

# ── Branch code → readable name ───────────────────────────────────────────────
BRANCH_MAP = {
    "A": "AIDS",
    "M": "AIML",
    "C": "CSE",
    "T": "IT",
    "I": "IoT",
    "E": "EXTC",
    "H": "Mechanical",
}

# ── Batch year → academic year ────────────────────────────────────────────────
YEAR_MAP = {
    "125": "First Year",
    "124": "Second Year",
    "123": "Third Year",
    "122": "Fourth Year",
}

PRN_REGEX = re.compile(r"^(12[2-5])([AMCTIEH])(\d+)$", re.IGNORECASE)


def parse_prn(prn: str) -> tuple[str, str]:
    """Return (branch_name, academic_year) from a PRN string, or raise ValueError."""
    m = PRN_REGEX.match(prn.strip().upper())
    if not m:
        raise ValueError("Invalid PRN format. Expected e.g. 124A8107")
    batch, letter, _ = m.groups()
    branch = BRANCH_MAP.get(letter.upper(), "Unknown")
    year   = YEAR_MAP.get(batch, "Unknown Year")
    return branch, year


# ── ORM Table ─────────────────────────────────────────────────────────────────

class UserORM(Base):
    __tablename__ = "users"

    id             = Column(Integer,     primary_key=True, index=True, autoincrement=True)
    user_id        = Column(String(64),  nullable=False, unique=True, index=True)
    full_name      = Column(String(128), nullable=False)
    email          = Column(String(128), nullable=False, unique=True, index=True)
    prn            = Column(String(20),  nullable=True,  unique=True, index=True)
    branch         = Column(String(32),  nullable=True)
    year           = Column(String(32),  nullable=True)
    password_hash  = Column(String(256), nullable=False)
    role           = Column(String(16),  nullable=False, default="user")
    is_active      = Column(Boolean,     nullable=False, default=True)
    created_at     = Column(DateTime,    nullable=False, default=datetime.utcnow)


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2,  max_length=128)
    prn:       str = Field(..., min_length=6,  max_length=20)
    email:     str = Field(..., min_length=10, max_length=128)
    password:  str = Field(..., min_length=6,  max_length=128)

    @field_validator("email")
    @classmethod
    def must_be_college_email(cls, v):
        v = v.lower().strip()
        if not v.endswith("@gst.sies.edu.in"):
            raise ValueError("Must use your college email (@gst.sies.edu.in)")
        return v

    @field_validator("prn")
    @classmethod
    def validate_prn(cls, v):
        try:
            parse_prn(v)
        except ValueError as e:
            raise ValueError(str(e))
        return v.strip().upper()


class LoginRequest(BaseModel):
    email:    str
    password: str


class UserOut(BaseModel):
    role:      str
    name:      str
    user_id:   str
    email:     str
    prn:       Optional[str] = None
    branch:    Optional[str] = None
    year:      Optional[str] = None

    class Config:
        from_attributes = True
