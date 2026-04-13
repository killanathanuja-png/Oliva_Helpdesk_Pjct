"""
MSG91 Notification Service for Oliva Help Desk.

Supports:
- Email via MSG91 Email API (https://docs.msg91.com/reference/send-email)
- SMS via MSG91 Flow API (https://docs.msg91.com/reference/send-sms)

Environment variables required:
    MSG91_AUTH_KEY          - Your MSG91 authkey (from MSG91 dashboard)
    MSG91_EMAIL_TEMPLATE_*  - Template IDs for each email type
    MSG91_SMS_TEMPLATE_*    - Flow IDs for each SMS type
    NOTIFICATION_PROVIDER   - "msg91" to enable, "smtp" for legacy SMTP

MSG91 Email API:
    POST https://control.msg91.com/api/v5/email/send
    Headers: { "authkey": "<your_authkey>", "Content-Type": "application/json" }
    Body: {
        "to": [{"email": "user@example.com", "name": "User Name"}],
        "from": {"email": "noreply@olivaclinic.com", "name": "Oliva Help Desk"},
        "template_id": "<template_id>",
        "variables": {"ticket_id": "TKT0001", "status": "Open", ...}
    }

MSG91 SMS Flow API:
    POST https://control.msg91.com/api/v5/flow/
    Headers: { "authkey": "<your_authkey>", "Content-Type": "application/json" }
    Body: {
        "template_id": "<flow_id>",
        "sender": "OLIVA",
        "short_url": "0",
        "mobiles": "91XXXXXXXXXX",
        "VAR1": "TKT0001",
        "VAR2": "Open"
    }
"""
import logging
import requests
from threading import Thread
from typing import Optional, Dict, List

from app.config import (
    MSG91_AUTH_KEY,
    MSG91_EMAIL_API_URL,
    MSG91_EMAIL_TEMPLATE_TICKET_CREATED,
    MSG91_EMAIL_TEMPLATE_STATUS_UPDATE,
    MSG91_EMAIL_TEMPLATE_ASSIGNMENT,
    MSG91_FROM_EMAIL,
    MSG91_FROM_NAME,
    MSG91_DOMAIN,
    MSG91_SMS_TEMPLATE_TICKET_CREATED,
    MSG91_SMS_TEMPLATE_STATUS_UPDATE,
    MSG91_SENDER_EMAIL,
    MSG91_SENDER_NAME,
    MSG91_SMS_SENDER_ID,
    NOTIFICATION_PROVIDER,
    FRONTEND_URL,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
#  Ticket Link Generator
# ──────────────────────────────────────────────

def generate_ticket_link(ticket_db_id: int) -> str:
    """
    Generate a clickable URL for a ticket.

    Args:
        ticket_db_id: The database ID of the ticket (used in frontend route)

    Returns:
        Full URL like http://localhost:8080/tickets/42

    Usage in MSG91 email template:
        <a href="##ticket_link##">View Ticket ##ticket_id##</a>
    """
    return f"{FRONTEND_URL}/tickets/{ticket_db_id}"


def generate_ticket_link_by_code(ticket_code: str, ticket_db_id: int) -> str:
    """Generate link using DB id (frontend routes by DB id, not ticket code)."""
    return generate_ticket_link(ticket_db_id)


# ──────────────────────────────────────────────
#  MSG91 API URLs
# ──────────────────────────────────────────────

MSG91_SMS_URL = "https://control.msg91.com/api/v5/flow/"


def _log_email(ticket_id, to_email, to_name, template, status, msg91_id="", error=""):
    """Log email to DB for tracking."""
    try:
        from app.database import SessionLocal
        from app.models.models import EmailLog
        db = SessionLocal()
        db.add(EmailLog(ticket_id=ticket_id, to_email=to_email, to_name=to_name or "",
                        template=template, status=status, msg91_id=msg91_id, error=error))
        db.commit()
        db.close()
    except Exception as e:
        logger.error(f"Failed to log email: {e}")


def _send_msg91_email(
    to_email: str,
    to_name: str,
    template_id: str,
    variables: Dict[str, str],
    cc: Optional[List[Dict[str, str]]] = None,
    ticket_db_id: int = None,
):
    """
    Send email via MSG91 Email API using the correct recipients format.

    API: POST https://control.msg91.com/api/v5/email/send

    Args:
        to_email: Recipient email address
        to_name: Recipient display name
        template_id: MSG91 email template ID (unique template name from MSG91 dashboard)
        variables: Dynamic variables matching ##var## in MSG91 template
        cc: Optional CC recipients [{"email": "...", "name": "..."}]

    MSG91 Template Variables:
        Use {{variable_name}} or ##variable_name## in your MSG91 template.
        Example: "Dear ##name##, your ticket ##code## has been created."
    """
    if not MSG91_AUTH_KEY:
        logger.warning(f"MSG91 auth key not configured. Skipping email to {to_email}")
        return
    if not template_id:
        logger.warning(f"MSG91 email template_id not provided. Skipping email to {to_email}")
        return

    # Build recipient object per MSG91 spec
    recipient = {
        "to": [{"name": to_name, "email": to_email}],
        "variables": variables,
    }
    if cc:
        recipient["cc"] = cc

    payload = {
        "recipients": [recipient],
        "from": {"name": MSG91_FROM_NAME, "email": MSG91_FROM_EMAIL},
        "domain": MSG91_DOMAIN,
        "template_id": template_id,
        "validate_before_send": True,
    }

    headers = {
        "authkey": MSG91_AUTH_KEY,
        "accept": "application/json",
        "content-type": "application/json",
    }

    template_label = "created" if "created" in template_id.lower() else "assigned" if "assign" in template_id.lower() else template_id
    try:
        logger.info(f"MSG91 sending email to {to_email} | template: {template_id} | vars: {list(variables.keys())}")
        resp = requests.post(MSG91_EMAIL_API_URL, json=payload, headers=headers, timeout=10)
        resp_data = resp.text
        if resp.status_code == 200:
            logger.info(f"MSG91 email sent to {to_email}: {resp_data}")
            import json as _json
            msg91_id = ""
            try: msg91_id = _json.loads(resp_data).get("data", {}).get("unique_id", "")
            except: pass
            _log_email(ticket_db_id, to_email, to_name, template_label, "sent", msg91_id)
        else:
            logger.error(f"MSG91 email failed [{resp.status_code}]: {resp_data}")
            _log_email(ticket_db_id, to_email, to_name, template_label, "failed", error=resp_data)
    except Exception as e:
        logger.error(f"MSG91 email error to {to_email}: {e}")
        _log_email(ticket_db_id, to_email, to_name, template_label, "failed", error=str(e))


def _send_msg91_email_async(to_email: str, to_name: str, template_id: str, variables: Dict[str, str], cc=None, ticket_db_id: int = None):
    """Fire-and-forget MSG91 email in background thread."""
    Thread(
        target=_send_msg91_email,
        args=(to_email, to_name, template_id, variables, cc, ticket_db_id),
        daemon=True,
    ).start()


# ──────────────────────────────────────────────
#  MSG91 SMS Flow API
# ──────────────────────────────────────────────

def _send_msg91_sms(
    mobile: str,
    template_id: str,
    variables: Dict[str, str],
):
    """
    Send SMS via MSG91 Flow API.

    Args:
        mobile: Mobile number with country code (e.g., "919876543210")
        template_id: MSG91 Flow template ID
        variables: Dynamic variables (VAR1, VAR2, etc.)

    MSG91 Flow Template Variables:
        Use ##VAR1##, ##VAR2## etc. in your Flow template.
        Map them: VAR1=ticket_id, VAR2=status, VAR3=user_name
    """
    if not MSG91_AUTH_KEY:
        logger.warning(f"MSG91 auth key not configured. Skipping SMS to {mobile}")
        return
    if not template_id:
        logger.warning(f"MSG91 SMS template_id not provided. Skipping SMS to {mobile}")
        return

    # Clean mobile number — ensure country code prefix
    clean_mobile = mobile.replace("+", "").replace(" ", "").replace("-", "")
    if not clean_mobile.startswith("91") and len(clean_mobile) == 10:
        clean_mobile = "91" + clean_mobile

    payload = {
        "template_id": template_id,
        "sender": MSG91_SMS_SENDER_ID,
        "short_url": "0",
        "mobiles": clean_mobile,
        **variables,  # VAR1, VAR2, etc.
    }

    headers = {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        resp = requests.post(MSG91_SMS_URL, json=payload, headers=headers, timeout=10)
        if resp.status_code == 200:
            logger.info(f"MSG91 SMS sent to {clean_mobile} (flow: {template_id})")
        else:
            logger.error(f"MSG91 SMS failed [{resp.status_code}]: {resp.text}")
    except Exception as e:
        logger.error(f"MSG91 SMS error to {mobile}: {e}")


def _send_msg91_sms_async(mobile: str, template_id: str, variables: Dict[str, str]):
    """Fire-and-forget MSG91 SMS in background thread."""
    Thread(target=_send_msg91_sms, args=(mobile, template_id, variables), daemon=True).start()


# ──────────────────────────────────────────────
#  High-Level Notification Functions
#  (Called from ticket routers)
# ──────────────────────────────────────────────

def send_ticket_created_email(
    to_email: str,
    user_name: str,
    ticket_id: str,
    title: str,
    department: str,
    center: str,
    priority: str,
    category: str = "",
    assigned_to: str = "",
    ticket_db_id: int = 0,
):
    """
    Send notification when a new ticket is created.
    Triggered: On POST /api/tickets/

    MSG91 Email Template should include:
        <a href="##ticket_link##" style="...">View Ticket ##ticket_id##</a>
    """
    if NOTIFICATION_PROVIDER != "msg91":
        return  # Fall through to existing SMTP in email_utils.py

    variables = {
        # Match MSG91 template variables exactly
        "name": user_name,
        "code": ticket_id,
        "title": title,
        "description": title,
        "department": department,
        "center_name": center or "—",
        "priority": priority,
        "category": category or "—",
        "assigned_to": assigned_to or "Unassigned",
        "status": "Open",
        "ticket_link": generate_ticket_link(ticket_db_id),
        "raised_by": to_email,
    }

    _send_msg91_email_async(to_email, user_name, MSG91_EMAIL_TEMPLATE_TICKET_CREATED, variables, ticket_db_id=ticket_db_id)


def send_status_update_email(
    to_email: str,
    user_name: str,
    ticket_id: str,
    title: str,
    old_status: str,
    new_status: str,
    changed_by: str = "",
    comment: str = "",
    ticket_db_id: int = 0,
):
    """
    Send notification when ticket status changes.
    Triggered: On PATCH /api/tickets/{id} (only when status actually changes)

    MSG91 Email Template should include:
        <a href="##ticket_link##">View Ticket</a>
    """
    if NOTIFICATION_PROVIDER != "msg91":
        return

    variables = {
        "name": user_name,
        "code": ticket_id,
        "title": title,
        "old_status": old_status,
        "new_status": new_status,
        "changed_by": changed_by or "System",
        "comment": comment or "—",
        "ticket_link": generate_ticket_link(ticket_db_id),
    }

    _send_msg91_email_async(to_email, user_name, MSG91_EMAIL_TEMPLATE_STATUS_UPDATE, variables)


def send_assignment_email(
    to_email: str,
    agent_name: str,
    ticket_id: str,
    title: str,
    department: str,
    center: str,
    priority: str,
    assigned_by: str = "",
    ticket_db_id: int = 0,
):
    """
    Send notification when a ticket is assigned to an agent.
    Triggered: On ticket assignment (create or update)

    MSG91 Email Template should include:
        <a href="##ticket_link##">View Ticket</a>
    """
    if NOTIFICATION_PROVIDER != "msg91":
        return

    variables = {
        "agent_name": agent_name,
        "code": ticket_id,
        "title": title,
        "department": department,
        "center_name": center or "—",
        "priority": priority,
        "assigned_by": assigned_by or "System",
        "ticket_link": generate_ticket_link(ticket_db_id),
    }

    _send_msg91_email_async(to_email, agent_name, MSG91_EMAIL_TEMPLATE_ASSIGNMENT, variables, ticket_db_id=ticket_db_id)


def send_ticket_created_sms(
    mobile: str,
    ticket_id: str,
    title: str,
    status: str = "Open",
):
    """Send SMS on ticket creation (optional)."""
    if NOTIFICATION_PROVIDER != "msg91":
        return

    _send_msg91_sms_async(mobile, MSG91_SMS_TEMPLATE_TICKET_CREATED, {
        "VAR1": ticket_id,
        "VAR2": title[:50],
        "VAR3": status,
    })


def send_status_update_sms(
    mobile: str,
    ticket_id: str,
    new_status: str,
):
    """Send SMS on status change (optional)."""
    if NOTIFICATION_PROVIDER != "msg91":
        return

    _send_msg91_sms_async(mobile, MSG91_SMS_TEMPLATE_STATUS_UPDATE, {
        "VAR1": ticket_id,
        "VAR2": new_status,
    })


# ──────────────────────────────────────────────
#  Provider check utility
# ──────────────────────────────────────────────

def is_msg91_enabled() -> bool:
    """Check if MSG91 is the active notification provider."""
    return NOTIFICATION_PROVIDER == "msg91" and bool(MSG91_AUTH_KEY)
