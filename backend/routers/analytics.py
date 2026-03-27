"""
routers/analytics.py
─────────────────────
Endpoints consumed by the admin analytics dashboard.

  GET /api/analytics/stats     – KPI cards + chart data (all-in-one)
  GET /api/analytics/clusters  – complaints grouped by cluster_id
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict

from db.database import get_db
from models.complaint import ComplaintOut
from services import complaint_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Returns a single JSON payload used to populate:
      - KPI cards (total, open, critical, resolved, in_progress, avg_urgency)
      - Bar chart  (by_category)
      - Pie chart  (by_priority)
      - Line chart (daily_trend)
      - Horizontal bar (by_zone)
    """
    return complaint_service.get_stats(db)


@router.get("/clusters", response_model=list[dict])
def get_clusters(db: Session = Depends(get_db)):
    """
    Returns complaints grouped by cluster_id.
    Each item: { cluster_id, count, top_category, complaints: [ComplaintOut] }
    """
    records = complaint_service.get_all(db)
    groups: dict[int, list] = defaultdict(list)
    for r in records:
        groups[r.cluster_id if r.cluster_id is not None else -1].append(r)

    result = []
    for cid, members in sorted(groups.items()):
        cats = [m.category for m in members if m.category]
        top_cat = max(set(cats), key=cats.count) if cats else "Unknown"
        result.append({
            "cluster_id":    cid,
            "count":         len(members),
            "top_category":  top_cat,
            "complaints":    [ComplaintOut.from_orm(m).model_dump() for m in members],
        })
    return result
