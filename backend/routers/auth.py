"""
routers/auth.py
────────────────
POST /api/auth/register           — student self-registration
POST /api/auth/login              — email + password login
POST /api/auth/register/super     — create super admin account (one-time setup)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import RegisterRequest, LoginRequest, UserOut
from services.auth_service import register_user, login_user, hash_password
from models.user import UserORM
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new student account."""
    return register_user(db, payload)


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with college email + password."""
    return login_user(db, payload)


class SuperAdminCreate(LoginRequest):
    full_name: str


@router.post("/register/super", response_model=UserOut, status_code=201)
def register_super_admin(payload: SuperAdminCreate, db: Session = Depends(get_db)):
    """
    Create a super admin account.
    Protected: only works if no super admin exists yet (first-time setup).
    """
    existing_super = db.query(UserORM).filter(UserORM.is_super_admin.is_(True)).first()
    if existing_super:
        raise HTTPException(
            status_code=400,
            detail="Super admin already exists. Contact your system administrator."
        )

    if db.query(UserORM).filter(UserORM.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    user_id = "super_" + uuid.uuid4().hex[:8]
    user = UserORM(
        user_id        = user_id,
        full_name      = payload.full_name.strip(),
        email          = payload.email.lower(),
        prn            = None,
        branch         = None,
        year           = None,
        password_hash  = hash_password(payload.password),
        role           = "super_admin",
        is_super_admin = True,
        is_active      = True,
        created_at     = datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut(
        role           = user.role,
        name           = user.full_name,
        user_id        = user.user_id,
        email          = user.email,
        is_super_admin = True,
        dept_id        = None,
        dept_name      = None,
    )
