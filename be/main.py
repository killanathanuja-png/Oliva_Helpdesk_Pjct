from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.seed import seed
from app.routers import (
    auth, departments, centers, users, roles, designations,
    categories, subcategories, child_categories, service_titles,
    tickets, sla, notifications, dashboard, login_history, aom_mappings, cdd_types,
    admin_masters, admin_users, tat_report, certificates,
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
    allow_origins=["*"],
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
app.include_router(tat_report.router)
app.include_router(certificates.router)


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
                from datetime import datetime, timezone, timedelta
                from zoneinfo import ZoneInfo

                IST = ZoneInfo("Asia/Kolkata")
                WORK_START = 10  # 10:00 AM
                WORK_END = 18    # 6:00 PM
                WORK_HOURS_PER_DAY = WORK_END - WORK_START  # 8 hours

                def calc_working_hours(start_utc, end_utc):
                    """Calculate working hours (10AM-6PM IST, Mon-Sat) between two UTC timestamps."""
                    start = start_utc.astimezone(IST) if start_utc.tzinfo else start_utc.replace(tzinfo=timezone.utc).astimezone(IST)
                    end = end_utc.astimezone(IST) if end_utc.tzinfo else end_utc.replace(tzinfo=timezone.utc).astimezone(IST)
                    total = 0.0
                    current = start
                    while current < end:
                        # Skip Sunday (6)
                        if current.weekday() == 6:
                            current = current.replace(hour=0, minute=0, second=0) + timedelta(days=1)
                            continue
                        day_start = current.replace(hour=WORK_START, minute=0, second=0, microsecond=0)
                        day_end = current.replace(hour=WORK_END, minute=0, second=0, microsecond=0)
                        # Clamp to working hours
                        effective_start = max(current, day_start)
                        effective_end = min(end, day_end)
                        if effective_start < effective_end:
                            total += (effective_end - effective_start).total_seconds() / 3600
                        # Move to next day
                        current = current.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                    return total

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
                    hrs = calc_working_hours(created, now)
                    center_obj = db.query(Center).filter(Center.name == t.center).first()
                    city = center_obj.city if center_obj else None
                    if not city: continue
                    esc = db.query(AdminEscalationMatrix).filter(AdminEscalationMatrix.location == city, AdminEscalationMatrix.status == StatusEnum.Active).first()
                    if not esc: continue
                    level = t.escalation_level or 0
                    l1_t = esc.l1_sla_hours or 8
                    l2_t = l1_t + (esc.l2_sla_hours or 10)
                    if not t.original_assigned_to_id and t.assigned_to_id:
                        t.original_assigned_to_id = t.assigned_to_id
                    orig_name = t.original_assigned_to_rel.name if t.original_assigned_to_rel else "L1"

                    # Step 1: Escalate to L2 if not already
                    if hrs > l1_t and level < 2:
                        l2u = db.query(User).filter(User.email == esc.l2_email).first()
                        if l2u:
                            t.escalation_level = 2; t.escalated_to_id = l2u.id; t.assigned_to_id = l2u.id; t.escalated_at = now; t.status = TicketStatusEnum.EscalatedL1
                            db.add(TicketComment(ticket_id=t.id, user="System", message=f"Auto-escalated to L2 ({l2u.name}). Originally assigned to {orig_name}.", type=CommentTypeEnum.status_change))
                            count += 1
                            level = 2

                    # Step 2: Escalate to L3 if past L2 threshold
                    if hrs > l2_t and level < 3:
                        l3u = db.query(User).filter(User.email == esc.l3_email).first()
                        if l3u:
                            t.escalation_level = 3; t.escalated_to_id = l3u.id; t.assigned_to_id = l3u.id; t.escalated_at = now; t.status = TicketStatusEnum.EscalatedL2
                            l2_name = db.query(User).filter(User.email == esc.l2_email).first()
                            l2_display = l2_name.name if l2_name else "L2"
                            db.add(TicketComment(ticket_id=t.id, user="System", message=f"Auto-escalated to L3 ({l3u.name}). L2 ({l2_display}) did not resolve.", type=CommentTypeEnum.status_change))
                            count += 1
                if count > 0:
                    db.commit()
                    print(f"[ESCALATION] Auto-escalated {count} admin tickets")

                # ── CDD Clinic Escalation: L1=AOM after 6hrs, L2=Atman after 14hrs (6+8) ──
                CDD_L1_HOURS = 6
                CDD_L2_HOURS = 8  # additional hours after L1
                CDD_L2_EMAIL = "atman@olivaclinic.com"

                cdd_clinic_tickets = db.query(Ticket).filter(
                    Ticket.assigned_dept == "Clinic",
                    Ticket.raised_by_dept == "CDD",
                    Ticket.status.notin_([
                        TicketStatusEnum.Resolved, TicketStatusEnum.Closed,
                        TicketStatusEnum.Rejected, TicketStatusEnum.FinalClosed,
                    ]),
                ).all()

                cdd_count = 0
                for t in cdd_clinic_tickets:
                    if not t.created_at: continue
                    created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
                    hrs = calc_working_hours(created, now)
                    level = t.escalation_level or 0

                    if not t.original_assigned_to_id and t.assigned_to_id:
                        t.original_assigned_to_id = t.assigned_to_id
                    orig_name = t.original_assigned_to_rel.name if t.original_assigned_to_rel else "Clinic Manager"

                    # Step 1: Escalate to L1 (AOM) after 6 hours
                    if hrs > CDD_L1_HOURS and level < 1:
                        center_obj = db.query(Center).filter(Center.name == t.center).first()
                        if center_obj and center_obj.aom_email:
                            aom_user = db.query(User).filter(User.email == center_obj.aom_email).first()
                            if aom_user:
                                t.escalation_level = 1; t.escalated_to_id = aom_user.id; t.assigned_to_id = aom_user.id
                                t.escalated_at = now; t.status = TicketStatusEnum.EscalatedL1
                                db.add(TicketComment(ticket_id=t.id, user="System", message=f"Auto-escalated to L1 AOM ({aom_user.name}). Originally assigned to {orig_name}.", type=CommentTypeEnum.status_change))
                                cdd_count += 1; level = 1
                                print(f"[CDD ESCALATION] {t.code} -> L1 AOM ({aom_user.name})")

                    # Step 2: Escalate to L2 (Atman) after 6+8=14 hours
                    if hrs > (CDD_L1_HOURS + CDD_L2_HOURS) and level < 2:
                        l2_user = db.query(User).filter(User.email == CDD_L2_EMAIL).first()
                        if l2_user:
                            aom_name = t.escalated_to_rel.name if t.escalated_to_rel else "AOM"
                            t.escalation_level = 2; t.escalated_to_id = l2_user.id; t.assigned_to_id = l2_user.id
                            t.escalated_at = now; t.status = TicketStatusEnum.EscalatedL2
                            db.add(TicketComment(ticket_id=t.id, user="System", message=f"Auto-escalated to L2 ({l2_user.name}). L1 AOM ({aom_name}) did not resolve.", type=CommentTypeEnum.status_change))
                            cdd_count += 1
                            print(f"[CDD ESCALATION] {t.code} -> L2 ({l2_user.name})")

                if cdd_count > 0:
                    db.commit()
                    print(f"[CDD ESCALATION] Auto-escalated {cdd_count} CDD clinic tickets")

                db.close()
            except Exception as e:
                print(f"[ESCALATION ERROR] {e}")
            time.sleep(300)  # Check every 5 minutes
    threading.Thread(target=escalation_loop, daemon=True).start()


@app.get("/")
def root():
    return {"message": "Oliva Help Desk API", "docs": "/docs"}
