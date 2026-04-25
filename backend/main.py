"""
main.py
────────
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import engine, Base, SessionLocal
from models.complaint import ComplaintORM
from models.user import UserORM
from models.department import DepartmentORM, DepartmentAdminORM
from models.audit_log import AuditLogORM
from routers import complaints, analytics, auth
from routers import departments, rca, anomaly
from apscheduler.schedulers.background import BackgroundScheduler
from services.escalation_service import escalate_stale_complaints

# ── Create tables ─────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Auto-seed on first run ────────────────────────────────────────────────────
def _maybe_seed():
    db = SessionLocal()
    if db.query(ComplaintORM).count() == 0:
        db.close()
        import seed as _seed
        _seed.seed()
    else:
        db.close()

_maybe_seed()

# ── Auto-escalation scheduler ─────────────────────────────────────────────────
def _run_escalation():
    db = SessionLocal()
    try:
        escalate_stale_complaints(db)
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(_run_escalation, "interval", hours=12)
scheduler.start()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Complaint Intelligence System API",
    description="NLP-powered complaint analysis, clustering, RBAC, RCA and anomaly detection.",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(analytics.router)
app.include_router(departments.router)
app.include_router(rca.router)
app.include_router(anomaly.router)


@app.get("/")
def root():
    return {"message": "Complaint Intelligence System API v2", "docs": "/docs"}