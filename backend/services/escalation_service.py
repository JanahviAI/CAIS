# backend/services/escalation_service.py

import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.complaint import ComplaintORM
from models.user import UserORM
from services.email_service import _send

# ── How long before each priority gets escalated ──────────────────────────
ESCALATION_RULES = {
    "Low":    timedelta(days=7),
    "Medium": timedelta(days=5),
    "High":   timedelta(days=3),
}

PRIORITY_ORDER = ["Low", "Medium", "High", "Critical"]


def escalate_stale_complaints(db: Session):
    print("[Escalation] Running escalation check...")

    open_complaints = db.query(ComplaintORM).filter(
        ComplaintORM.status.notin_(["Resolved", "Closed"])
    ).all()

    escalated_count = 0

    for c in open_complaints:
        threshold = ESCALATION_RULES.get(c.priority)
        if not threshold:
            continue  # skip Critical (already highest)

        age = datetime.utcnow() - datetime.combine(c.submitted_at, datetime.min.time())
        if age < threshold:
            continue  # not old enough yet

        current_idx = PRIORITY_ORDER.index(c.priority)
        if current_idx >= len(PRIORITY_ORDER) - 1:
            continue  # already Critical

        old_priority = c.priority
        c.priority   = PRIORITY_ORDER[current_idx + 1]
        c.updated_at = datetime.utcnow()
        escalated_count += 1

        # ── Notify the user ───────────────────────────────────────────────
        user = db.query(UserORM).filter(UserORM.user_id == c.user_id).first()
        if user and user.email:
            _send(
                to_email = user.email,
                subject  = f"⚠️ Complaint #{c.id} Priority Escalated — CAIS",
                body     = f"""
                <h3>Your complaint priority has been escalated.</h3>
                <p><b>Complaint ID:</b> #{c.id}</p>
                <p><b>Previous Priority:</b> {old_priority}</p>
                <p><b>New Priority:</b> <b style="color:red">{c.priority}</b></p>
                <p>This complaint has been waiting too long and has been flagged for urgent attention.</p>
                <br><small>CAIS — Complaint Action Intelligence System, SIES GST</small>
                """,
            )
            time.sleep(1)  # 1 second gap between emails

    db.commit()
    print(f"[Escalation] Done. {escalated_count} complaint(s) escalated.")