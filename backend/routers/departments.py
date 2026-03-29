"""
routers/departments.py
───────────────────────
GET  /api/departments              – list departments
POST /api/departments              – create department (super admin only)
POST /api/departments/{id}/admins  – assign a user as dept head (super admin only)
GET  /api/departments/{id}/admins  – list admins for a department
DELETE /api/departments/{id}/admins/{user_id} – remove dept head (super admin only)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from db.database import get_db
from models.department import (
    DepartmentORM, DepartmentAdminORM,
    DepartmentCreate, DepartmentOut, AssignAdminRequest,
)
from models.audit_log import AuditLogORM
from models.user import UserORM

router = APIRouter(prefix="/api/departments", tags=["departments"])


def _require_super_admin(user_id: str, db: Session):
    user = db.query(UserORM).filter(UserORM.user_id == user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    return user


def _log_action(db: Session, user_id: str, action: str,
                complaint_id: Optional[int] = None,
                dept_id: Optional[int] = None,
                details: Optional[str] = None):
    log = AuditLogORM(
        user_id      = user_id,
        action       = action,
        complaint_id = complaint_id,
        dept_id      = dept_id,
        details      = details,
        created_at   = datetime.utcnow(),
    )
    db.add(log)
    db.commit()


@router.get("/", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    """List all departments (accessible to all authenticated users)."""
    return db.query(DepartmentORM).all()


@router.post("/", response_model=DepartmentOut, status_code=201)
def create_department(
    payload: DepartmentCreate,
    user_id: str = Query(..., description="ID of the super admin making the request"),
    db: Session = Depends(get_db),
):
    """Create a new department. Super admin only."""
    _require_super_admin(user_id, db)

    if db.query(DepartmentORM).filter(DepartmentORM.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Department already exists.")

    dept = DepartmentORM(
        name       = payload.name,
        location   = payload.location,
        created_at = datetime.utcnow(),
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    _log_action(db, user_id, "create_department", dept_id=dept.id,
                details=f"Created department: {dept.name}")
    return dept


@router.post("/{dept_id}/admins", status_code=201)
def assign_dept_admin(
    dept_id: int,
    payload: AssignAdminRequest,
    caller_id: str = Query(..., description="ID of the super admin making the request"),
    db: Session = Depends(get_db),
):
    """Assign a user as department head. Super admin only."""
    _require_super_admin(caller_id, db)

    dept = db.query(DepartmentORM).filter(DepartmentORM.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    user = db.query(UserORM).filter(UserORM.user_id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Promote user to dept_head role and link to department
    user.role    = "dept_head"
    user.dept_id = dept_id

    # Add to junction table (idempotent)
    existing = db.query(DepartmentAdminORM).filter(
        DepartmentAdminORM.user_id == payload.user_id,
        DepartmentAdminORM.dept_id == dept_id,
    ).first()
    if not existing:
        entry = DepartmentAdminORM(
            user_id    = payload.user_id,
            dept_id    = dept_id,
            created_at = datetime.utcnow(),
        )
        db.add(entry)

    db.commit()
    _log_action(db, caller_id, "assign_dept_head", dept_id=dept_id,
                details=f"Assigned {payload.user_id} as head of {dept.name}")
    return {"message": f"{user.full_name} assigned as head of {dept.name}"}


@router.get("/{dept_id}/admins")
def list_dept_admins(dept_id: int, db: Session = Depends(get_db)):
    """List users assigned as heads for a department."""
    dept = db.query(DepartmentORM).filter(DepartmentORM.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    entries = db.query(DepartmentAdminORM).filter(
        DepartmentAdminORM.dept_id == dept_id
    ).all()
    result = []
    for entry in entries:
        user = db.query(UserORM).filter(UserORM.user_id == entry.user_id).first()
        if user:
            result.append({
                "user_id":   user.user_id,
                "full_name": user.full_name,
                "email":     user.email,
                "dept_id":   dept_id,
                "dept_name": dept.name,
            })
    return result


@router.delete("/{dept_id}/admins/{target_user_id}")
def remove_dept_admin(
    dept_id: int,
    target_user_id: str,
    caller_id: str = Query(..., description="ID of the super admin making the request"),
    db: Session = Depends(get_db),
):
    """Remove a department head assignment. Super admin only."""
    _require_super_admin(caller_id, db)

    entry = db.query(DepartmentAdminORM).filter(
        DepartmentAdminORM.user_id == target_user_id,
        DepartmentAdminORM.dept_id == dept_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    db.delete(entry)

    # Revert role if no other dept assignments
    remaining = db.query(DepartmentAdminORM).filter(
        DepartmentAdminORM.user_id == target_user_id
    ).count()
    if remaining == 0:
        user = db.query(UserORM).filter(UserORM.user_id == target_user_id).first()
        if user:
            user.role    = "user"
            user.dept_id = None

    db.commit()
    _log_action(db, caller_id, "remove_dept_head", dept_id=dept_id,
                details=f"Removed {target_user_id} from dept {dept_id}")
    return {"message": "Department head removed."}
