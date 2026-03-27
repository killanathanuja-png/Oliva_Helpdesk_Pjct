from sqlalchemy import create_engine, text
from app.config import DATABASE_URL
from app.database import Base

engine = create_engine(DATABASE_URL)
with engine.begin() as c:
    c.execute(text('DROP TABLE IF EXISTS "subcategories" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "categories" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "sub_categories" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "child_categories" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "service_titles" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "tickets" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "users" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "departments" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "centers" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "roles" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "designations" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "sla_configs" CASCADE'))
    c.execute(text('DROP TABLE IF EXISTS "alembic_version" CASCADE'))

Base.metadata.create_all(bind=engine)
print('Schema reset complete')
