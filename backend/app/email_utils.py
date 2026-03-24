"""Email utility for sending ticket notifications."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html_body: str):
    """Send email in background thread so it doesn't block the API response."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


def send_email_async(to: str, subject: str, html_body: str):
    """Fire-and-forget email sending."""
    Thread(target=_send, args=(to, subject, html_body), daemon=True).start()


def send_ticket_notification(to_email: str, ticket_code: str, title: str,
                             description: str, raised_by: str, department: str,
                             center: str, priority: str, category: str = ""):
    """Send a ticket assignment notification email."""
    subject = f"[Oliva Helpdesk] New Ticket {ticket_code} - {title}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00B7AE, #1A6B6A); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Oliva Help Desk</h2>
            <p style="color: rgba(255,255,255,0.85); margin: 5px 0 0; font-size: 14px;">New Ticket Assigned</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 130px;">Ticket ID</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #00B7AE;">{ticket_code}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Title</td>
                    <td style="padding: 8px 0; font-weight: 600;">{title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Description</td>
                    <td style="padding: 8px 0;">{description or '—'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Raised By</td>
                    <td style="padding: 8px 0;">{raised_by}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Department</td>
                    <td style="padding: 8px 0;">{department}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Category</td>
                    <td style="padding: 8px 0;">{category or '—'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Center</td>
                    <td style="padding: 8px 0;">{center or '—'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Priority</td>
                    <td style="padding: 8px 0;">
                        <span style="background: {'#fee2e2' if priority == 'Critical' else '#fef3c7' if priority == 'High' else '#dbeafe'}; color: {'#dc2626' if priority == 'Critical' else '#d97706' if priority == 'High' else '#2563eb'}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            {priority}
                        </span>
                    </td>
                </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 13px; color: #6b7280;">
                Please log in to <strong>Oliva Help Desk</strong> to resolve or close this ticket.
            </p>
        </div>
        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Oliva Help Desk &copy; 2026. All rights reserved.
        </p>
    </div>
    """
    send_email_async(to_email, subject, html)
