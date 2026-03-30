"""Add CDD escalation fields and new statuses to tickets table."""
import os
from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

ALTER_STATEMENTS = [
    # Add new columns
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;",
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_to_id INTEGER REFERENCES users(id);",
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;",
    # Add new enum values to ticketstatusenum
    """DO $$ BEGIN
        ALTER TYPE ticketstatusenum ADD VALUE IF NOT EXISTS 'Escalated to L1';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;""",
    """DO $$ BEGIN
        ALTER TYPE ticketstatusenum ADD VALUE IF NOT EXISTS 'Escalated to L2';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;""",
    """DO $$ BEGIN
        ALTER TYPE ticketstatusenum ADD VALUE IF NOT EXISTS 'Reopened by CDD';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;""",
    """DO $$ BEGIN
        ALTER TYPE ticketstatusenum ADD VALUE IF NOT EXISTS 'Final Closed';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;""",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for stmt in ALTER_STATEMENTS:
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"OK: {stmt[:60]}...")
            except Exception as e:
                conn.rollback()
                print(f"SKIP: {e}")
    print("\nMigration complete!")
