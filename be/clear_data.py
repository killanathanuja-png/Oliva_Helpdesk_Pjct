"""Clear all data from the database tables, keeping schema intact.
Re-seeds roles and departments and the Super Admin user afterwards."""
from sqlalchemy import text
from app.database import SessionLocal
from app.seed import seed


def clear():
    db = SessionLocal()
    # Order matters due to foreign keys – children first
    tables = [
        "notifications",
        "ticket_comments",
        "tickets",
        "sla_configs",
        "service_titles",
        "subcategories",
        "categories",
        "users",
        "centers",
        "roles",
        "departments",
    ]
    for t in tables:
        try:
            db.execute(text(f"DELETE FROM {t}"))
            print(f"  Cleared: {t}")
        except Exception as e:
            db.rollback()
            print(f"  Skip {t}: {e}")
    db.commit()
    db.close()
    print("\nAll data cleared. Re-seeding base data...\n")
    seed()
    print("\nDone!")


if __name__ == "__main__":
    clear()
