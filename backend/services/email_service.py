# backend/services/email_service.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── Mailtrap SMTP config ───────────────────────────────────────────────────
SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_USERNAME = "cais.siesgst@gmail.com"
SMTP_PASSWORD = "qxwhgrpzhcnxwhcr"
MAIL_FROM     = "cais.siesgst@gmail.com"


# ── Low-level helper ───────────────────────────────────────────────────────
def _send(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = MAIL_FROM
        msg["To"]      = to_email
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())
    except Exception as e:
        print(f"[Email Error] {e}")


# ── Notification: complaint submitted ─────────────────────────────────────
def notify_submitted(to_email: str, complaint_id: int, category: str):
    _send(
        to_email = to_email,
        subject  = f"✅ Complaint #{complaint_id} Received — CAIS",
        body     = f"""
        <h3>Your complaint has been submitted successfully.</h3>
        <p><b>Complaint ID:</b> #{complaint_id}</p>
        <p><b>Category detected:</b> {category}</p>
        <p>You will be notified when there is any update.</p>
        <br><small>CAIS — Complaint Action Intelligence System, SIES GST</small>
        """,
    )


# ── Notification: status changed ──────────────────────────────────────────
def notify_status_changed(to_email: str, complaint_id: int,
                           old_status: str, new_status: str):
    _send(
        to_email = to_email,
        subject  = f"🔔 Complaint #{complaint_id} Status Updated — CAIS",
        body     = f"""
        <h3>Your complaint status has been updated.</h3>
        <p><b>Complaint ID:</b> #{complaint_id}</p>
        <p><b>Previous Status:</b> {old_status}</p>
        <p><b>New Status:</b> <b style="color:green">{new_status}</b></p>
        <br><small>CAIS — Complaint Action Intelligence System, SIES GST</small>
        """,
    )