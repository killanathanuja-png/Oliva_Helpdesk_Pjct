from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.seed import seed
from app.routers import (
    auth, departments, centers, users, roles, designations,
    categories, subcategories, child_categories, service_titles,
    tickets, sla, notifications, dashboard, login_history, aom_mappings, cdd_types,
    admin_masters, admin_users,
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
app.include_router(aom_mappings.router)
app.include_router(cdd_types.router)
app.include_router(admin_masters.router)
app.include_router(admin_users.router)


@app.on_event("startup")
def on_startup():
    seed()
    # Start background escalation checker
    import threading
    import time
    from app.database import SessionLocal
    def escalation_loop():
        while True:
            try:
                from app.models.models import Ticket, TicketComment, User, TicketStatusEnum, CommentTypeEnum, Center, AdminEscalationMatrix, StatusEnum
                from datetime import datetime, timezone
                db = SessionLocal()
                now = datetime.now(timezone.utc)
                admin_tickets = db.query(Ticket).filter(
                    Ticket.assigned_dept.in_(["Admin Department", "Admin"]),
                    Ticket.status.notin_([
                        TicketStatusEnum.Resolved, TicketStatusEnum.Closed,
                        TicketStatusEnum.Rejected, TicketStatusEnum.FinalClosed,
                    ]),
                ).all()
                count = 0
                for t in admin_tickets:
                    if not t.created_at: continue
                    created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
                    hrs = (now - created).total_seconds() / 3600
                    center_obj = db.query(Center).filter(Center.name == t.center).first()
                    city = center_obj.city if center_obj else None
                    if not city: continue
                    esc = db.query(AdminEscalationMatrix).filter(AdminEscalationMatrix.location == city, AdminEscalationMatrix.status == StatusEnum.Active).first()
                    if not esc: continue
                    level = t.escalation_level or 0
                    l1_t = esc.l1_sla_hours or 8
                    l2_t = l1_t + (esc.l2_sla_hours or 10)
                    if hrs > l2_t and level < 3:
                        u = db.query(User).filter(User.email == esc.l3_email).first()
                        if u:
                            if not t.original_assigned_to_id: t.original_assigned_to_id = t.assigned_to_id
                            orig_name = t.original_assigned_to_rel.name if t.original_assigned_to_rel else "L1"
                            t.escalation_level = 3; t.escalated_to_id = u.id; t.assigned_to_id = u.id; t.escalated_at = now; t.status = TicketStatusEnum.EscalatedL2
                            db.add(TicketComment(ticket_id=t.id, user="System", message=f"Auto-escalated to L3 ({u.name}) after {round(hrs,1)}h. Originally assigned to {orig_name}.", type=CommentTypeEnum.status_change))
                            count += 1
                    elif hrs > l1_t and level < 2:
                        u = db.query(User).filter(User.email == esc.l2_email).first()
                        if u:
                            if not t.original_assigned_to_id: t.original_assigned_to_id = t.assigned_to_id
                            orig_name = t.original_assigned_to_rel.name if t.original_assigned_to_rel else "L1"
                            t.escalation_level = 2; t.escalated_to_id = u.id; t.assigned_to_id = u.id; t.escalated_at = now; t.status = TicketStatusEnum.EscalatedL1
                            db.add(TicketComment(ticket_id=t.id, user="System", message=f"Auto-escalated to L2 ({u.name}) after {round(hrs,1)}h. Originally assigned to {orig_name}.", type=CommentTypeEnum.status_change))
                            count += 1
                if count > 0:
                    db.commit()
                    print(f"[ESCALATION] Auto-escalated {count} admin tickets")
                db.close()
            except Exception as e:
                print(f"[ESCALATION ERROR] {e}")
            time.sleep(300)  # Check every 5 minutes
    threading.Thread(target=escalation_loop, daemon=True).start()


@app.get("/")
def root():
    return {"message": "Oliva Help Desk API", "docs": "/docs"}
