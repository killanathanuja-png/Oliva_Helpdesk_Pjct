import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/oliva_helpdesk")
SECRET_KEY = os.getenv("SECRET_KEY", "oliva-helpdesk-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Email / SMTP
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@olivaclinic.com")

# MSG91 Configuration
MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY", "")
MSG91_EMAIL_TEMPLATE_TICKET_CREATED = os.getenv("MSG91_EMAIL_TEMPLATE_TICKET_CREATED", "")
MSG91_EMAIL_TEMPLATE_STATUS_UPDATE = os.getenv("MSG91_EMAIL_TEMPLATE_STATUS_UPDATE", "")
MSG91_EMAIL_TEMPLATE_ASSIGNMENT = os.getenv("MSG91_EMAIL_TEMPLATE_ASSIGNMENT", "")
MSG91_SMS_TEMPLATE_TICKET_CREATED = os.getenv("MSG91_SMS_TEMPLATE_TICKET_CREATED", "")
MSG91_SMS_TEMPLATE_STATUS_UPDATE = os.getenv("MSG91_SMS_TEMPLATE_STATUS_UPDATE", "")
MSG91_SENDER_EMAIL = os.getenv("MSG91_SENDER_EMAIL", "noreply@olivaclinic.com")
MSG91_SENDER_NAME = os.getenv("MSG91_SENDER_NAME", "Oliva Help Desk")
MSG91_SMS_SENDER_ID = os.getenv("MSG91_SMS_SENDER_ID", "OLIVA")
# Notification provider: "smtp" or "msg91"
NOTIFICATION_PROVIDER = os.getenv("NOTIFICATION_PROVIDER", "smtp")
# Frontend URL for clickable ticket links in emails
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

# Department → email mapping for ticket notifications
DEPT_EMAIL_MAP = {
    "Quality": "qualityteam@olivaclinic.com",
    "Admin Department": "rajesh@olivaclinic.com",
    "Administration": "rajesh@olivaclinic.com",
}
