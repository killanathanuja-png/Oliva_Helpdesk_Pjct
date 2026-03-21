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
        # Ensure existing user has Super Admin role
        if existing_sa.role != "Super Admin":
            existing_sa.role = "Super Admin"
            db.commit()
            print(f"Updated {sa_email} to Super Admin role")
        else:
            print(f"Super Admin user {sa_email} already exists")

    db.close()


if __name__ == "__main__":
    seed()
