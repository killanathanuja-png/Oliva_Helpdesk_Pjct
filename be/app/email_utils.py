"""Email utility for sending ticket notifications via SMTP or MSG91."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
from app.services.notification_service import (
    send_ticket_created_email as _msg91_ticket_created,
    send_status_update_email as _msg91_status_update,
    send_assignment_email as _msg91_assignment,
    is_msg91_enabled,
)

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html_body: str):
    """Send email in background thread so it doesn't block the API response."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(f"SMTP credentials not configured. Skipping email to {to}: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


def send_email_async(to: str, subject: str, html_body: str):
    """Fire-and-forget email sending."""
    Thread(target=_send, args=(to, subject, html_body), daemon=True).start()


def _email_wrapper(subtitle: str, content_html: str, ticket_link: str = "") -> str:
    """Wrap content in the standard Oliva email template with optional ticket link button."""
    link_button = ""
    if ticket_link:
        link_button = f'''
            <div style="text-align: center; margin: 20px 0;">
                <a href="{ticket_link}" style="display: inline-block; background: linear-gradient(135deg, #00B7AE, #1A6B6A); color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                    View Ticket
                </a>
            </div>
        '''
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00B7AE, #1A6B6A); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Oliva Help Desk</h2>
            <p style="color: rgba(255,255,255,0.85); margin: 5px 0 0; font-size: 14px;">{subtitle}</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #ffffff;">
            {content_html}
            {link_button}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 13px; color: #6b7280;">
                Please log in to <strong>Oliva Help Desk</strong> to view or take action on this ticket.
            </p>
        </div>
        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Oliva Help Desk &copy; 2026. All rights reserved.
        </p>
    </div>
    """


def _ticket_row(label: str, value: str, bold: bool = False, color: str = None) -> str:
    style = "padding: 8px 0;"
    if bold:
        style += " font-weight: 600;"
    if color:
        style += f" color: {color};"
    return f'<tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">{label}</td><td style="{style}">{value}</td></tr>'


def _priority_badge(priority: str) -> str:
    colors = {
        "Critical": ("#fee2e2", "#dc2626"),
        "High": ("#fef3c7", "#d97706"),
        "Medium": ("#dbeafe", "#2563eb"),
        "Low": ("#e0f2fe", "#0284c7"),
    }
    bg, fg = colors.get(priority, ("#f3f4f6", "#374151"))
    return f'<span style="background: {bg}; color: {fg}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">{priority}</span>'


def _status_badge(status: str) -> str:
    colors = {
        "Open": ("#dbeafe", "#2563eb"),
        "In Progress": ("#fef3c7", "#d97706"),
        "Pending Approval": ("#fef3c7", "#d97706"),
        "Approved": ("#d1fae5", "#059669"),
        "Acknowledged": ("#dbeafe", "#2563eb"),
        "Resolved": ("#d1fae5", "#059669"),
        "Closed": ("#f3f4f6", "#6b7280"),
        "Rejected": ("#fee2e2", "#dc2626"),
        "Follow Up": ("#fff7ed", "#ea580c"),
        "Escalated to L1": ("#fff7ed", "#ea580c"),
        "Escalated to L2": ("#fee2e2", "#dc2626"),
    }
    bg, fg = colors.get(status, ("#f3f4f6", "#374151"))
    return f'<span style="background: {bg}; color: {fg}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">{status}</span>'


# ── Event 1: Ticket Created ──

def send_ticket_created(to_email: str, ticket_code: str, title: str,
                        description: str, raised_by: str, department: str,
                        center: str, priority: str, category: str = "",
                        assigned_to: str = "", ticket_db_id: int = 0):
    """Notify when a new ticket is created. Uses MSG91 if enabled, else SMTP."""
    if is_msg91_enabled():
        _msg91_ticket_created(to_email, raised_by, ticket_code, title, department, center, priority, category, assigned_to, ticket_db_id)
        return
    from app.services.notification_service import generate_ticket_link
    ticket_link = generate_ticket_link(ticket_db_id) if ticket_db_id else ""
    subject = f"[Oliva Helpdesk] New Ticket {ticket_code} - {title}"
    rows = (
        _ticket_row("Ticket ID", ticket_code, bold=True, color="#00B7AE")
        + _ticket_row("Title", title, bold=True)
        + _ticket_row("Description", description or "—")
        + _ticket_row("Raised By", raised_by)
        + _ticket_row("Department", department)
        + (f'<tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Category</td><td style="padding: 8px 0;">{category}</td></tr>' if category else "")
        + _ticket_row("Center", center or "—")
        + f'<tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Priority</td><td style="padding: 8px 0;">{_priority_badge(priority)}</td></tr>'
        + (_ticket_row("Assigned To", assigned_to) if assigned_to else "")
    )
    content = f'<table style="width: 100%; border-collapse: collapse; font-size: 14px;">{rows}</table>'
    html = _email_wrapper("New Ticket Created", content, ticket_link)
    send_email_async(to_email, subject, html)


# ── Event 2: Ticket Assigned ──

def send_ticket_assigned(to_email: str, ticket_code: str, title: str,
                         assigned_to: str, assigned_by: str,
                         department: str = "", center: str = "", priority: str = "",
                         ticket_db_id: int = 0):
    """Notify the assignee when a ticket is assigned to them. Uses MSG91 if enabled."""
    if is_msg91_enabled():
        _msg91_assignment(to_email, assigned_to, ticket_code, title, department, center, priority, assigned_by, ticket_db_id)
        return
    subject = f"[Oliva Helpdesk] Ticket {ticket_code} Assigned to You"
    rows = (
        _ticket_row("Ticket ID", ticket_code, bold=True, color="#00B7AE")
        + _ticket_row("Title", title, bold=True)
        + _ticket_row("Assigned To", assigned_to, bold=True, color="#059669")
        + _ticket_row("Assigned By", assigned_by)
        + (_ticket_row("Department", department) if department else "")
        + (_ticket_row("Center", center) if center else "")
        + (f'<tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Priority</td><td style="padding: 8px 0;">{_priority_badge(priority)}</td></tr>' if priority else "")
    )
    content = f"""
        <p style="font-size: 15px; color: #111827; margin-bottom: 16px;">
            A ticket has been <strong>assigned to you</strong>. Please review and take action.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">{rows}</table>
    """
    from app.services.notification_service import generate_ticket_link
    ticket_link = generate_ticket_link(ticket_db_id) if ticket_db_id else ""
    html = _email_wrapper("Ticket Assigned to You", content, ticket_link)
    send_email_async(to_email, subject, html)


# ── Event 3: Status Changed ──

def send_status_changed(to_email: str, ticket_code: str, title: str,
                        old_status: str, new_status: str, changed_by: str,
                        comment: str = "", ticket_db_id: int = 0,
                        recipient_name: str = ""):
    """Notify when a ticket's status changes. Uses MSG91 if enabled."""
    if is_msg91_enabled():
        _msg91_status_update(to_email, recipient_name or to_email.split("@")[0], ticket_code, title, old_status, new_status, changed_by, comment, ticket_db_id)
        return
    subject = f"[Oliva Helpdesk] Ticket {ticket_code} Status → {new_status}"
    rows = (
        _ticket_row("Ticket ID", ticket_code, bold=True, color="#00B7AE")
        + _ticket_row("Title", title, bold=True)
        + f'<tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Previous Status</td><td style="padding: 8px 0;">{_status_badge(old_status)}</td></tr>'
        + f'<tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">New Status</td><td style="padding: 8px 0;">{_status_badge(new_status)}</td></tr>'
        + _ticket_row("Changed By", changed_by)
        + (_ticket_row("Comment", comment) if comment else "")
    )
    content = f'<table style="width: 100%; border-collapse: collapse; font-size: 14px;">{rows}</table>'
    from app.services.notification_service import generate_ticket_link
    ticket_link = generate_ticket_link(ticket_db_id) if ticket_db_id else ""
    html = _email_wrapper(f"Ticket Status Changed to {new_status}", content, ticket_link)
    send_email_async(to_email, subject, html)


# ── Event 4: Comment Added ──

def send_comment_added(to_email: str, ticket_code: str, title: str,
                       comment_by: str, comment_text: str):
    """Notify when a comment is added to a ticket."""
    subject = f"[Oliva Helpdesk] New Comment on {ticket_code}"
    content = f"""
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            {_ticket_row("Ticket ID", ticket_code, bold=True, color="#00B7AE")}
            {_ticket_row("Title", title, bold=True)}
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-left: 4px solid #00B7AE; border-radius: 0 8px 8px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;"><strong>{comment_by}</strong> added a comment:</p>
            <p style="font-size: 14px; color: #111827; margin: 0; line-height: 1.5;">{comment_text}</p>
        </div>
    """
    html = _email_wrapper("New Comment Added", content)
    send_email_async(to_email, subject, html)


# ── Legacy compatibility ──

def send_ticket_notification(to_email: str, ticket_code: str, title: str,
                             description: str, raised_by: str, department: str,
                             center: str, priority: str, category: str = ""):
    """Legacy wrapper — calls send_ticket_created."""
    send_ticket_created(to_email, ticket_code, title, description, raised_by,
                        department, center, priority, category)
