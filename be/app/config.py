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

# Department → email mapping for ticket notifications
DEPT_EMAIL_MAP = {
    "Quality": "qualityteam@olivaclinic.com",
    "Admin Department": "rajesh@olivaclinic.com",
    "Administration": "rajesh@olivaclinic.com",
}
