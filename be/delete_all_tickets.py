"""Delete all tickets and their dependent rows (comments, notification/email refs).
Schema and other data (users, categories, etc.) are left intact."""
from sqlalchemy import text
from app.database import SessionLocal


def delete_all_tickets():
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM ticket_comments"))
        print("  Cleared: ticket_comments")

        db.execute(text("UPDATE notifications SET ticket_id = NULL WHERE ticket_id IS NOT NULL"))
        print("  Cleared notifications.ticket_id refs")

        db.execute(text("UPDATE email_logs SET ticket_id = NULL WHERE ticket_id IS NOT NULL"))
        print("  Cleared email_logs.ticket_id refs")

        result = db.execute(text("DELETE FROM tickets"))
        print(f"  Cleared: tickets ({result.rowcount} rows)")

        db.commit()
        print("\nDone.")
    except Exception as e:
        db.rollback()
        print(f"Failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    delete_all_tickets()
