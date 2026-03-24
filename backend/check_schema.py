from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as c:
    tables = c.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).fetchall()
    print('tables =', [t[0] for t in tables])
    for tbl in ['categories', 'subcategories']:
        cols = c.execute(text(f"SELECT column_name,data_type FROM information_schema.columns WHERE table_name='{tbl}' ORDER BY ordinal_position")).fetchall()
        print(tbl, cols)
