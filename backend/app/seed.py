"""Seed the database with initial data matching the frontend dummy data."""
import json
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import Base, Department, Role, User, StatusEnum
from app.auth import hash_password


def _migrate_enums(db: Session):
    """Add new enum values to PostgreSQL enum types if they don't exist."""
    # UserRoleEnum: ensure all values exist (both enum .name and .value forms)
    for val in ("AOM", "User", "Finance", "Zenoti Team", "ZenotiTeam", "Super Admin", "SuperAdmin"):
        try:
            db.execute(text(
                f"ALTER TYPE userroleenum ADD VALUE IF NOT EXISTS '{val}'"
            ))
            db.commit()
        except Exception:
            db.rollback()

    # ApprovalStatusEnum: create if not exists
    for val in ("Pending", "Approved", "Rejected"):
        try:
            db.execute(text(
                f"ALTER TYPE approvalstatusenum ADD VALUE IF NOT EXISTS '{val}'"
            ))
            db.commit()
        except Exception:
            db.rollback()

    # TicketStatusEnum: ensure new status values exist
    for val in ("Follow Up", "FollowUp", "Approved", "Acknowledged", "AwaitingUserInputs",
                "Awaiting User Inputs", "UserInputsReceived", "User Inputs Received"):
        try:
            db.execute(text(
                f"ALTER TYPE ticketstatusenum ADD VALUE IF NOT EXISTS '{val}'"
            ))
            db.commit()
        except Exception:
            db.rollback()


def _migrate_columns(db: Session):
    """Add missing columns to existing tables."""
    migrations = [
        ("departments", "status", "statusenum", "'Active'"),
        ("roles", "status", "statusenum", "'Active'"),
        # Ticket table columns that may be missing from older schema
        ("tickets", "approval_type", "VARCHAR(50)", "NULL"),
        ("tickets", "approval_required", "BOOLEAN", "FALSE"),
        ("tickets", "approver", "VARCHAR(100)", "NULL"),
        ("tickets", "approval_status", "approvalstatusenum", "NULL"),
        ("tickets", "resolution", "TEXT", "NULL"),
        ("tickets", "raised_by_dept", "VARCHAR(100)", "NULL"),
        ("tickets", "sla_breached", "BOOLEAN", "FALSE"),
        ("tickets", "zenoti_location", "VARCHAR(200)", "NULL"),
        ("tickets", "zenoti_main_category", "VARCHAR(100)", "NULL"),
        ("tickets", "zenoti_sub_category", "VARCHAR(100)", "NULL"),
        ("tickets", "zenoti_child_category", "VARCHAR(100)", "NULL"),
        ("tickets", "zenoti_mobile_number", "VARCHAR(20)", "NULL"),
        ("tickets", "zenoti_customer_id", "VARCHAR(50)", "NULL"),
        ("tickets", "zenoti_customer_name", "VARCHAR(100)", "NULL"),
        ("tickets", "zenoti_billed_by", "VARCHAR(100)", "NULL"),
        ("tickets", "zenoti_invoice_no", "VARCHAR(50)", "NULL"),
        ("tickets", "zenoti_invoice_date", "VARCHAR(20)", "NULL"),
        ("tickets", "zenoti_amount", "VARCHAR(50)", "NULL"),
        ("tickets", "zenoti_description", "TEXT", "NULL"),
        # User table columns that may be missing
        ("users", "employee_id", "VARCHAR(30)", "NULL"),
        ("users", "map_level_access", "VARCHAR(50)", "NULL"),
        ("users", "entity", "VARCHAR(50)", "NULL"),
        ("users", "vertical", "VARCHAR(50)", "NULL"),
        ("users", "costcenter", "VARCHAR(50)", "NULL"),
        ("users", "gender", "VARCHAR(10)", "NULL"),
        ("users", "mobile", "VARCHAR(20)", "NULL"),
        ("users", "reporting_to", "VARCHAR(100)", "NULL"),
        ("users", "grade", "VARCHAR(50)", "NULL"),
        ("users", "employee_type", "VARCHAR(50)", "NULL"),
        ("users", "city", "VARCHAR(100)", "NULL"),
        ("users", "employee_dob", "VARCHAR(30)", "NULL"),
        ("users", "employee_doj", "VARCHAR(30)", "NULL"),
        ("users", "lwd", "VARCHAR(30)", "NULL"),
        ("users", "effective_date", "VARCHAR(30)", "NULL"),
        ("users", "remarks", "VARCHAR(500)", "NULL"),
    ]
    for table, column, col_type, default in migrations:
        try:
            db.execute(text(
                f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type} DEFAULT {default}"
            ))
            db.commit()
        except Exception:
            db.rollback()


def seed():
    """Insert initial departments and roles if they don't already exist."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Migrate PostgreSQL enum types to add new values
    _migrate_enums(db)
    # Add missing columns to existing tables
    _migrate_columns(db)

    # --- Departments (matching frontend dummyData.ts) ---
    departments_data = [
        ("D001", "IT", "", 24),
        ("D002", "Zenoti", "", 24),
        ("D003", "HR", "", 24),
        ("D004", "Clinic", "", 24),
        ("D005", "Quality", "", 24),
        ("D006", "Stores", "", 24),
        ("D007", "Products", "", 24),
        ("D008", "Admin", "", 24),
    ]

    existing_depts = db.query(Department).all()
    existing_dept_names = {d.name for d in existing_depts}
    existing_dept_codes = {d.code for d in existing_depts}
    added_depts = 0
    for code, name, head, sla in departments_data:
        if name not in existing_dept_names and code not in existing_dept_codes:
            db.add(Department(code=code, name=name, head=head, sla_hours=sla))
            added_depts += 1

    added_roles = 0

    if added_depts:
        db.commit()
        print(f"Seeded: {added_depts} departments")
    else:
        db.commit()
        print("Seed: all departments already exist")

    # --- Super Admin user ---
    sa_email = "killana@olivaclinic.com"
    existing_sa = db.query(User).filter(User.email == sa_email).first()
    if not existing_sa:
        # Find the next user code
        last_user = db.query(User).order_by(User.id.desc()).first()
        next_num = (last_user.id + 1) if last_user else 1
        user_code = f"U{next_num:03d}"
        sa_user = User(
            code=user_code,
            name="Killana",
            email=sa_email,
            hashed_password=hash_password("admin123"),
            role="Super Admin",
            avatar="KI",
            status=StatusEnum.Active,
        )
        db.add(sa_user)
        db.commit()
        print(f"Created Super Admin user: {sa_email}")
    else:
        changed = False
        # Ensure existing user has Super Admin role
        if existing_sa.role != "Super Admin":
            existing_sa.role = "Super Admin"
            changed = True
            print(f"Updated {sa_email} to Super Admin role")
        # Re-hash password to ensure it works with current bcrypt library
        if existing_sa.hashed_password.startswith("$pbkdf2") or not existing_sa.hashed_password.startswith("$2"):
            existing_sa.hashed_password = hash_password("admin123")
            changed = True
            print(f"Re-hashed password for {sa_email} (migrated to pbkdf2)")
        if changed:
            db.commit()
        else:
            print(f"Super Admin user {sa_email} already exists")

    db.close()


if __name__ == "__main__":
    seed()
