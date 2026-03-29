"""
services/auth_service.py
─────────────────────────
Registration and login against the users table.
Login uses email + password.
Passwords stored as SHA-256 + salt (no external deps).
"""

from __future__ import annotations
import uuid, hashlib, secrets
from datetime import datetime
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.user import UserORM, RegisterRequest, LoginRequest, UserOut, parse_prn


def hash_password(plain: str) -> str:
    salt   = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + plain).encode()).hexdigest()
    return f"{salt}${hashed}"


def verify_password(plain: str, stored: str) -> bool:
    try:
        salt, hashed = stored.split("$", 1)
        return hashlib.sha256((salt + plain).encode()).hexdigest() == hashed
    except Exception:
        return False


def register_user(db: Session, payload: RegisterRequest) -> UserOut:
    if db.query(UserORM).filter(UserORM.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    if db.query(UserORM).filter(UserORM.prn == payload.prn.upper()).first():
        raise HTTPException(status_code=400, detail="PRN already registered.")

    branch, year = parse_prn(payload.prn)
    user_id      = "user_" + uuid.uuid4().hex[:8]

    user = UserORM(
        user_id       = user_id,
        full_name     = payload.full_name.strip(),
        email         = payload.email.lower(),
        prn           = payload.prn.upper(),
        branch        = branch,
        year          = year,
        password_hash = hash_password(payload.password),
        role          = "user",
        is_active     = True,
        created_at    = datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _to_out(user, dept_name=None)


def login_user(db: Session, payload: LoginRequest) -> UserOut:
    user = db.query(UserORM).filter(
        UserORM.email == payload.email.lower().strip()
    ).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated.")

    dept_name = None
    if user.dept_id is not None:
        try:
            from models.department import DepartmentORM
            dept = db.query(DepartmentORM).filter(DepartmentORM.id == user.dept_id).first()
            dept_name = dept.name if dept else None
        except Exception:
            pass

    return _to_out(user, dept_name=dept_name)


def _to_out(user: UserORM, dept_name: Optional[str] = None) -> UserOut:
    return UserOut(
        role           = user.role,
        name           = user.full_name,
        user_id        = user.user_id,
        email          = user.email,
        prn            = user.prn,
        branch         = user.branch,
        year           = user.year,
        is_super_admin = user.is_super_admin,
        dept_id        = user.dept_id,
        dept_name      = dept_name,
    )
