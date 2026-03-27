"""
main.py
────────
FastAPI application entry point.

Startup sequence
────────────────
1. Create all DB tables (idempotent).
2. Seed demo data if the table is empty.
3. Mount routers.
4. Add CORS middleware (allows React dev-server on :3000).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import engine, Base, SessionLocal
from models.complaint import ComplaintORM          # noqa: F401 — registers ORM model
from models.user import UserORM                    # noqa: F401 — registers ORM model
from routers import complaints, analytics, auth

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

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Complaint Intelligence System API",
    description="NLP-powered complaint analysis, clustering and prioritisation.",
    version="1.0.0",
)

# CORS — allow React dev-server (port 3000) and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "Complaint Intelligence System API", "docs": "/docs"}
