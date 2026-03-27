"""
db/database.py
──────────────
SQLAlchemy engine, session factory, and Base declaration.
SQLite file is created at ./cais.db (relative to where uvicorn is run).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./cais.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ── Dependency injected into every route that needs DB access ─────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
