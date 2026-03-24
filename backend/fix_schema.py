"""
One-time script to fix the database schema.
Uses psycopg2 directly to drop the public schema, then uses SQLAlchemy to recreate tables.
"""
import psycopg2

# Database connection details (match your .env)
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="oliva_helpdesk",
    user="postgres",
    password="1234"
)
conn.autocommit = True
cur = conn.cursor()

# Check current state of categories table
try:
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'id'
    """)
    row = cur.fetchone()
    if row:
        print(f"Current categories.id type: {row[1]}")
    else:
        print("categories table does not exist")
except Exception as e:
    print(f"Check failed: {e}")

# Drop and recreate the entire public schema
print("Dropping public schema...")
cur.execute("DROP SCHEMA public CASCADE")
cur.execute("CREATE SCHEMA public")
cur.execute("GRANT ALL ON SCHEMA public TO public")
print("Schema dropped and recreated successfully.")

cur.close()
conn.close()
print("Done! Now run: .venv/Scripts/python -m uvicorn main:app --reload")
