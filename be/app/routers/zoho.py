"""
Zoho Desk Integration API
─────────────────────────
External endpoints for Zoho Desk to create and update tickets in Oliva Helpdesk.
Authenticated via long-lived API tokens (Bearer oliva_xxxx).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user
from app.models.models import (
    Ticket, TicketComment, User, TicketStatusEnum, PriorityEnum,
    CommentTypeEnum, StatusEnum, Center, AOMCenterMapping,
    AdminEscalationMatrix, SLAConfig, Department,
)
from app.email_utils import send_ticket_created, send_ticket_assigned, send_status_changed

router = APIRouter(prefix="/api/zoho", tags=["Zoho Integration"])


# ── Schemas ──

class ZohoCreateTicket(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = "Medium"
    center: Optional[str] = None
    assigned_dept: Optional[str] = None
    # Zenoti fields
    zenoti_location: Optional[str] = None
    zenoti_main_category: Optional[str] = None
    zenoti_sub_category: Optional[str] = None
    zenoti_child_category: Optional[str] = None
    zenoti_mobile_number: Optional[str] = None
    zenoti_customer_id: Optional[str] = None
    zenoti_customer_name: Optional[str] = None
    zenoti_billed_by: Optional[str] = None
    zenoti_invoice_no: Optional[str] = None
    zenoti_invoice_date: Optional[str] = None
    zenoti_amount: Optional[str] = None
    zenoti_description: Optional[str] = None
    # CDD Clinic fields
    action_required: Optional[str] = None
    client_code: Optional[str] = None
    client_name: Optional[str] = None
    service_name: Optional[str] = None
    crt_name: Optional[str] = None
    primary_doctor: Optional[str] = None
    therapist_name: Optional[str] = None


class ZohoUpdateTicket(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    center: Optional[str] = None
    assigned_dept: Optional[str] = None
    comment: Optional[str] = None
    zenoti_location: Optional[str] = None
    zenoti_main_category: Optional[str] = None
    zenoti_sub_category: Optional[str] = None
    zenoti_child_category: Optional[str] = None
    zenoti_mobile_number: Optional[str] = None
    zenoti_customer_id: Optional[str] = None
    zenoti_customer_name: Optional[str] = None
    zenoti_billed_by: Optional[str] = None
    zenoti_invoice_no: Optional[str] = None
    zenoti_invoice_date: Optional[str] = None
    zenoti_amount: Optional[str] = None
    zenoti_description: Optional[str] = None


class ZohoTicketResponse(BaseModel):
    id: int
    code: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    raised_by: Optional[str] = None
    raised_by_dept: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_dept: Optional[str] = None
    center: Optional[str] = None
    sla_breached: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Helpers ──

def _next_code(db: Session) -> str:
    all_codes = db.query(Ticket.code).all()
    max_num = 0
    for (code,) in all_codes:
        try:
            num = int(code.replace("TKT", "").replace("tkt", ""))
            if num > max_num:
                max_num = num
        except (ValueError, AttributeError):
            continue
    return f"TKT{(max_num + 1):04d}"


def _ticket_response(t: Ticket) -> ZohoTicketResponse:
    return ZohoTicketResponse(
        id=t.id,
        code=t.code,
        title=t.title,
        description=t.description,
        category=t.category,
        sub_category=t.sub_category,
        priority=t.priority.value if t.priority else None,
        status=t.status.value if t.status else None,
        raised_by=t.raised_by_rel.name if t.raised_by_rel else None,
        raised_by_dept=t.raised_by_dept,
        assigned_to=t.assigned_to_rel.name if t.assigned_to_rel else None,
        assigned_dept=t.assigned_dept,
        center=t.center,
        sla_breached=t.sla_breached,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


# ── Endpoints ──

@router.post("/tickets", response_model=ZohoTicketResponse, status_code=201)
def zoho_create_ticket(
    req: ZohoCreateTicket,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a ticket from Zoho Desk. Uses the API token's linked user as the raiser."""
    import traceback
    try:
        code = _next_code(db)
        print(f"[ZOHO CREATE] code={code}, title={req.title}, dept={req.assigned_dept}, center={req.center}, user={current_user.name}")

        center_value = req.center
        if not center_value and current_user.center_rel:
            center_value = current_user.center_rel.name

        assigned_to_id_value = None
        raised_by_dept_value = current_user.department_rel.name if current_user.department_rel else req.assigned_dept
        assigned_dept_value = req.assigned_dept
        ticket_status = TicketStatusEnum.Open

        # CDD user → auto-assign to clinic manager of the selected center
        user_dept_name = current_user.department_rel.name if current_user.department_rel else ""
        if user_dept_name and user_dept_name.upper() == "CDD" and center_value:
            assigned_dept_value = assigned_dept_value or "Clinic"
            center_obj = db.query(Center).filter(Center.name == center_value, Center.status == StatusEnum.Active).first()
            if center_obj and center_obj.center_manager_email:
                cm_user = db.query(User).filter(User.email == center_obj.center_manager_email).first()
                if cm_user:
                    assigned_to_id_value = cm_user.id

        # Admin Department → auto-assign via escalation matrix
        if (assigned_dept_value or "").lower() in ("admin department", "admin") and center_value:
            center_obj = db.query(Center).filter(Center.name == center_value).first()
            center_city = center_obj.city if center_obj else None
            if center_city:
                esc = db.query(AdminEscalationMatrix).filter(
                    AdminEscalationMatrix.location == center_city,
                    AdminEscalationMatrix.status == StatusEnum.Active,
                ).first()
                if esc:
                    l1_user = db.query(User).filter(User.email == esc.l1_email).first()
                    if l1_user:
                        assigned_to_id_value = l1_user.id

        # Calculate SLA due date
        due_date = None
        priority_str = req.priority or "Medium"
        sla = db.query(SLAConfig).filter(
            SLAConfig.priority == priority_str,
            SLAConfig.active == True,
        ).first()
        if sla and sla.resolution_time_hrs:
            from datetime import timedelta
            due_date = datetime.now(timezone.utc) + timedelta(hours=sla.resolution_time_hrs)

        ticket = Ticket(
            code=code,
            title=req.title,
            description=req.description,
            category=req.category,
            sub_category=req.sub_category,
            priority=PriorityEnum(priority_str) if priority_str else PriorityEnum.Medium,
            status=ticket_status,
            raised_by_id=current_user.id,
            raised_by_dept=raised_by_dept_value,
            assigned_to_id=assigned_to_id_value,
            assigned_dept=assigned_dept_value,
            center=center_value,
            due_date=due_date,
            zenoti_location=req.zenoti_location,
            zenoti_main_category=req.zenoti_main_category,
            zenoti_sub_category=req.zenoti_sub_category,
            zenoti_child_category=req.zenoti_child_category,
            zenoti_mobile_number=req.zenoti_mobile_number,
            zenoti_customer_id=req.zenoti_customer_id,
            zenoti_customer_name=req.zenoti_customer_name,
            zenoti_billed_by=req.zenoti_billed_by,
            zenoti_invoice_no=req.zenoti_invoice_no,
            zenoti_invoice_date=req.zenoti_invoice_date,
            zenoti_amount=req.zenoti_amount,
            zenoti_description=req.zenoti_description,
            action_required=req.action_required,
            client_code=req.client_code,
            client_name=req.client_name,
            service_name=req.service_name,
            crt_name=req.crt_name,
            primary_doctor=req.primary_doctor,
            therapist_name=req.therapist_name,
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        # Send email notifications
        try:
            if ticket.assigned_to_rel:
                send_ticket_assigned(
                    ticket.assigned_to_rel.email, ticket.code, ticket.title,
                    ticket.assigned_to_rel.name, current_user.name,
                    ticket.assigned_dept or "", ticket.center or "",
                    priority_str, ticket_db_id=ticket.id,
                )
        except Exception as email_err:
            print(f"[ZOHO EMAIL ERROR] {email_err}")

        print(f"[ZOHO CREATE] Success: {ticket.code} (id={ticket.id})")
        return _ticket_response(ticket)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")


@router.patch("/tickets/{ticket_id}", response_model=ZohoTicketResponse)
def zoho_update_ticket(
    ticket_id: int,
    req: ZohoUpdateTicket,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing ticket from Zoho Desk."""
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_data = req.model_dump(exclude_unset=True)
    update_comment = update_data.pop("comment", None) or ""

    old_status = t.status.value if t.status else "Open"

    if "status" in update_data:
        new_status_str = update_data["status"]
        if new_status_str == "Open" and t.status in (TicketStatusEnum.Closed, TicketStatusEnum.Resolved, TicketStatusEnum.FinalClosed):
            update_data["status"] = TicketStatusEnum.Reopened
        else:
            update_data["status"] = TicketStatusEnum(new_status_str)
    if "priority" in update_data:
        update_data["priority"] = PriorityEnum(update_data["priority"])

    status_changed = "status" in update_data and update_data["status"] != t.status

    for key, value in update_data.items():
        setattr(t, key, value)

    # Add comment if provided
    if update_comment:
        db.add(TicketComment(
            ticket_id=ticket_id,
            user=current_user.name,
            message=update_comment,
            type=CommentTypeEnum.comment,
        ))

    db.commit()
    db.refresh(t)

    # Send email on status change
    try:
        if status_changed:
            new_status = t.status.value if t.status else "Open"
            raiser_email = t.raised_by_rel.email if t.raised_by_rel else None
            if raiser_email:
                send_status_changed(
                    raiser_email, t.code, t.title,
                    old_status, new_status, current_user.name,
                    comment=update_comment, ticket_db_id=t.id,
                    recipient_name=t.raised_by_rel.name if t.raised_by_rel else "",
                )
    except Exception as email_err:
        print(f"[ZOHO EMAIL ERROR] {email_err}")

    print(f"[ZOHO UPDATE] {t.code} updated by {current_user.name}")
    return _ticket_response(t)


@router.get("/tickets/{ticket_id}", response_model=ZohoTicketResponse)
def zoho_get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get ticket details (for Zoho to check status)."""
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_response(t)


@router.get("/tickets/by-code/{ticket_code}", response_model=ZohoTicketResponse)
def zoho_get_ticket_by_code(
    ticket_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get ticket by ticket code (e.g., TKT0001) — useful for Zoho lookups."""
    t = db.query(Ticket).filter(Ticket.code == ticket_code).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_response(t)


@router.get("/health")
def zoho_health():
    """Health check endpoint — no auth required."""
    return {"status": "ok", "service": "Oliva Helpdesk Zoho Integration"}
