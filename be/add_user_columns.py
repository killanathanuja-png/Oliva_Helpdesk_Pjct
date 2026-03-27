"""Add missing columns to users table: city, employee_dob, employee_doj, lwd, effective_date, remarks."""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    cols = {
        "city": "VARCHAR(100)",
        "employee_dob": "VARCHAR(30)",
        "employee_doj": "VARCHAR(30)",
        "lwd": "VARCHAR(30)",
        "effective_date": "VARCHAR(30)",
        "remarks": "VARCHAR(500)",
    }
    for col, dtype in cols.items():
        try:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {dtype}"))
            print(f"Added column: {col}")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print(f"Column {col} already exists")
            else:
                print(f"Error adding {col}: {e}")
    conn.commit()
    print("Done!")
