from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.seed import seed
from app.routers import (
    auth, departments, centers, users, roles, designations,
    categories, subcategories, child_categories, service_titles,
    tickets, sla, notifications, dashboard, login_history,
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Oliva Help Desk API",
    description="Backend API for Oliva ITSM Help Desk",
    version="1.0.0",
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(departments.router)
app.include_router(centers.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(categories.router)
app.include_router(subcategories.router)
app.include_router(child_categories.router)
app.include_router(service_titles.router)
app.include_router(tickets.router)
app.include_router(sla.router)
app.include_router(notifications.router)
app.include_router(designations.router)
app.include_router(login_history.router)


@app.on_event("startup")
def on_startup():
    seed()


@app.get("/")
def root():
    return {"message": "Oliva Help Desk API", "docs": "/docs"}
