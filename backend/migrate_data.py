"""Migrate all data from local DB to remote DB (test schema)."""
import psycopg2
from psycopg2.extras import execute_values

LOCAL = {"host": "localhost", "user": "postgres", "password": "1234", "port": 5432, "dbname": "oliva_helpdesk"}
REMOTE = {"host": "111.93.26.122", "user": "postgres", "password": "OneOliva#26", "port": 5432, "dbname": "oliva_helpdesk", "sslmode": "require"}

# Tables in dependency order (parents first)
TABLES = [
    "departments", "centers", "roles", "designations", "categories",
    "subcategories", "child_categories", "service_titles", "sla_configs",
    "users", "login_history", "tickets", "ticket_comments", "notifications",
]

local_conn = psycopg2.connect(**LOCAL)
remote_conn = psycopg2.connect(**REMOTE)
remote_conn.autocommit = False

local_cur = local_conn.cursor()
remote_cur = remote_conn.cursor()

# Set search path on remote
remote_cur.execute("SET search_path TO test")

for table in TABLES:
    try:
        # Get columns
        local_cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}' AND table_schema = 'public' ORDER BY ordinal_position")
        columns = [r[0] for r in local_cur.fetchall()]
        if not columns:
            print(f"  SKIP {table}: no columns found locally")
            continue

        # Get data from local
        cols_str = ", ".join([f'"{c}"' for c in columns])
        local_cur.execute(f'SELECT {cols_str} FROM public."{table}"')
        rows = local_cur.fetchall()

        if not rows:
            print(f"  SKIP {table}: no data")
            continue

        # Clear remote table first
        remote_cur.execute(f'DELETE FROM test."{table}"')

        # Insert into remote
        placeholders = ", ".join(["%s"] * len(columns))
        insert_sql = f'INSERT INTO test."{table}" ({cols_str}) VALUES ({placeholders})'

        batch_size = 100
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            remote_cur.executemany(insert_sql, batch)

        # Reset sequence
        remote_cur.execute(f"SELECT MAX(id) FROM test.\"{table}\"")
        max_id = remote_cur.fetchone()[0]
        if max_id:
            try:
                remote_cur.execute(f"SELECT setval(pg_get_serial_sequence('test.\"{table}\"', 'id'), {max_id})")
            except Exception:
                try:
                    remote_cur.execute(f"ALTER SEQUENCE test.{table}_id_seq RESTART WITH {max_id + 1}")
                except Exception:
                    pass

        remote_conn.commit()
        print(f"  OK {table}: {len(rows)} rows migrated")

    except Exception as e:
        remote_conn.rollback()
        print(f"  ERROR {table}: {e}")

local_cur.close()
local_conn.close()
remote_cur.close()
remote_conn.close()
print("\nMigration complete!")
