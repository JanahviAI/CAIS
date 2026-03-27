"""
routers/auth.py
────────────────
POST /api/auth/register  — student self-registration
POST /api/auth/login     — email + password login
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import RegisterRequest, LoginRequest, UserOut
from services.auth_service import register_user, login_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new student account."""
    return register_user(db, payload)


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with college email + password."""
    return login_user(db, payload)
