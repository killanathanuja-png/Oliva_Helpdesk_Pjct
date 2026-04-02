from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Ticket, TicketComment, User, TicketStatusEnum, PriorityEnum, CommentTypeEnum, ApprovalStatusEnum, AOMCenterMapping, StatusEnum, Notification, NotificationTypeEnum, Department, Center, AdminEscalationMatrix
from app.schemas.schemas import TicketCreate, TicketUpdate, TicketResponse, TicketCommentCreate, TicketCommentResponse
from app.auth import get_current_user
from app.config import DEPT_EMAIL_MAP
from app.email_utils import send_ticket_created, send_ticket_assigned, send_status_changed, send_comment_added
from datetime import datetime, timezone
 
router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def _create_notification(db, user_id, title, message, ticket_id, notif_type=NotificationTypeEnum.info):
    notif = Notification(
        title=title,
        message=message,
        type=notif_type,
        ticket_id=ticket_id,
        user_id=user_id,
    )
    db.add(notif)
 
 
def _next_code(db: Session) -> str:
    # Get all ticket codes, extract numbers, and find the true max
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
 
 
def _ticket_to_response(t: Ticket, aom_name: str = None, aom_email: str = None) -> TicketResponse:
    # Calculate TAT
    tat_hours = None
    tat_breached = False
    if t.created_at:
        end_time = t.updated_at if t.status in (TicketStatusEnum.Resolved, TicketStatusEnum.Closed, TicketStatusEnum.FinalClosed) else datetime.now(timezone.utc)
        # Handle timezone-naive datetimes
        created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
        end = end_time.replace(tzinfo=timezone.utc) if end_time and end_time.tzinfo is None else (end_time or datetime.now(timezone.utc))
        delta = end - created
        tat_hours = round(delta.total_seconds() / 3600, 1)
        # TAT breach: check against default 8 hours for L1
        tat_breached = tat_hours > 8

    return TicketResponse(
        id=t.id, code=t.code, title=t.title, description=t.description,
        category=t.category, sub_category=t.sub_category,
        priority=t.priority.value if t.priority else None,
        status=t.status.value if t.status else None,
        raised_by=t.raised_by_rel.name if t.raised_by_rel else None,
        raised_by_dept=t.raised_by_dept,
        assigned_to=t.assigned_to_rel.name if t.assigned_to_rel else None,
        assigned_dept=t.assigned_dept, center=t.center,
        due_date=t.due_date, sla_breached=t.sla_breached,
        approval_required=t.approval_required, approval_type=t.approval_type, approver=t.approver,
        approval_status=t.approval_status.value if t.approval_status else None,
        resolution=t.resolution,
        zenoti_location=t.zenoti_location,
        zenoti_main_category=t.zenoti_main_category,
        zenoti_sub_category=t.zenoti_sub_category,
        zenoti_child_category=t.zenoti_child_category,
        zenoti_mobile_number=t.zenoti_mobile_number,
        zenoti_customer_id=t.zenoti_customer_id,
        zenoti_customer_name=t.zenoti_customer_name,
        zenoti_billed_by=t.zenoti_billed_by,
        zenoti_invoice_no=t.zenoti_invoice_no,
        zenoti_invoice_date=t.zenoti_invoice_date,
        zenoti_amount=t.zenoti_amount,
        zenoti_description=t.zenoti_description,
        aom_name=aom_name,
        aom_email=aom_email,
        escalation_level=t.escalation_level or 0,
        escalated_to=t.escalated_to_rel.name if t.escalated_to_rel else None,
        original_assigned_to=t.original_assigned_to_rel.name if t.original_assigned_to_rel else None,
        escalated_at=t.escalated_at,
        acknowledged_at=t.acknowledged_at,
        tat_hours=tat_hours,
        tat_breached=tat_breached,
        comments=[
            TicketCommentResponse(id=c.id, user=c.user, message=c.message, type=c.type.value if c.type else "comment", created_at=c.created_at)
            for c in t.comments
        ],
        created_at=t.created_at, updated_at=t.updated_at,
    )
 
 
@router.get("/", response_model=list[TicketResponse])
def list_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Role-based ticket filtering
    user_roles = (current_user.role or "").lower()
    is_clinic_manager = "clinic manager" in user_roles or "clinic incharge" in user_roles
    is_helpdesk_admin = "helpdesk admin" in user_roles
    is_admin_dept = "admin department" in user_roles

    if is_helpdesk_admin and current_user.center_rel:
        # Helpdesk Admin users see only their center's tickets + tickets they raised
        center_name = current_user.center_rel.name
        tickets = db.query(Ticket).filter(
            (Ticket.center == center_name) | (Ticket.raised_by_id == current_user.id)
        ).order_by(Ticket.created_at.desc()).all()
    elif is_admin_dept:
        # Admin Department users see all admin tickets
        tickets = db.query(Ticket).filter(
            Ticket.assigned_dept == "Admin Department"
        ).order_by(Ticket.created_at.desc()).all()
    elif is_clinic_manager and current_user.center_rel:
        center_name = current_user.center_rel.name
        tickets = db.query(Ticket).filter(
            (Ticket.center == center_name) | (Ticket.raised_by_id == current_user.id)
        ).order_by(Ticket.created_at.desc()).all()
    else:
        tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()

    return [_ticket_to_response(t) for t in tickets]
 
 
@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(req: TicketCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import traceback
    try:
        code = _next_code(db)
        print(f"[CREATE TICKET] code={code}, title={req.title}, dept={req.assigned_dept}, center={req.center}")

        # Auto-fetch center and AOM for CM (Center Manager) users
        center_value = req.center
        # If no center provided, use the user's primary center
        if not center_value and current_user.center_rel:
            center_value = current_user.center_rel.name
        approval_required = req.approval_required or False
        approval_type_value = req.approval_type if hasattr(req, 'approval_type') else None
        approver_value = None
        approval_status_value = None
        ticket_status = TicketStatusEnum.Open
        assigned_to_id_value = None
        raised_by_dept_value = req.assigned_dept  # default: same as assigned_dept
        assigned_dept_value = req.assigned_dept

        # Admin ticket routing: Helpdesk Admin users auto-route to Admin Department
        user_roles = (current_user.role or "").lower()
        is_helpdesk_admin = "helpdesk admin" in user_roles

        if is_helpdesk_admin:
            # Force department to Admin Department
            assigned_dept_value = "Admin Department"
            # Keep raised_by_dept as the user's actual department
            raised_by_dept_value = current_user.department_rel.name if current_user.department_rel else (req.assigned_dept or "Admin Department")

            # Auto-fill center from user's center
            if current_user.center_rel:
                center_value = current_user.center_rel.name

            # Look up location assignment based on user's city
            from sqlalchemy import text as sa_text
            user_city = current_user.city or ""
            location_match = db.execute(sa_text(
                "SELECT assigned_to_email, assigned_to_name FROM admin_location_assignment WHERE LOWER(location) = LOWER(:city)"
            ), {"city": user_city}).first()

            if location_match:
                assigned_user = db.query(User).filter(User.email == location_match[0]).first()
                if assigned_user:
                    assigned_to_id_value = assigned_user.id

            # Override status and approval
            ticket_status = TicketStatusEnum.Open
            approval_required = False

        # Auto-assign Admin Department tickets to L1 based on center location
        if (req.assigned_dept or "").lower() in ("admin department", "admin") and center_value:
            center_obj = db.query(Center).filter(Center.name == center_value).first()
            center_city = center_obj.city if center_obj else None
            if center_city:
                esc_matrix = db.query(AdminEscalationMatrix).filter(
                    AdminEscalationMatrix.location == center_city,
                    AdminEscalationMatrix.status == StatusEnum.Active,
                ).first()
                if esc_matrix:
                    l1_user = db.query(User).filter(User.email == esc_matrix.l1_email).first()
                    if l1_user:
                        assigned_to_id_value = l1_user.id
                        print(f"[ADMIN TICKET] Auto-assigned to L1: {l1_user.name} ({center_city})")

        # If CDD user creates a ticket, auto-assign to the selected center's clinic manager
        user_dept_name = current_user.department_rel.name if current_user.department_rel else ""
        if user_dept_name and user_dept_name.upper() == "CDD" and center_value:
            center_obj = db.query(Center).filter(Center.name == center_value, Center.status == StatusEnum.Active).first()
            if center_obj and center_obj.center_manager_email:
                cm_user = db.query(User).filter(User.email == center_obj.center_manager_email).first()
                if cm_user:
                    assigned_to_id_value = cm_user.id

        # Look up AOM mapping for the current user (by email)
        aom_mapping = db.query(AOMCenterMapping).filter(
            AOMCenterMapping.cm_email == current_user.email,
            AOMCenterMapping.status == StatusEnum.Active,
        ).first()

        # Determine Zenoti category type for approval routing
        zenoti_cat = (req.category or "").lower()
        is_zenoti_finance = zenoti_cat == "zenoti-finance"
        is_zenoti_operational = zenoti_cat == "zenoti-operational"
        is_operational_issues = zenoti_cat == "operational issues"
        is_zenoti_dept = (req.assigned_dept or "").lower() == "zenoti"

        if aom_mapping:
            # Auto-set center from mapping if not provided
            if not center_value:
                center_value = aom_mapping.center_name

            if is_zenoti_dept and is_operational_issues:
                # Flow III: Operational Issues — No approval needed, goes to Zenoti team directly
                approval_required = False
                ticket_status = TicketStatusEnum.Open

            elif is_zenoti_dept and is_zenoti_finance:
                # Flow I: Zenoti-Finance — Needs AOM approval first, then Finance
                approval_required = True
                approver_value = aom_mapping.aom_name
                approval_status_value = ApprovalStatusEnum.Pending
                ticket_status = TicketStatusEnum.PendingApproval
                approval_type_value = "aom_finance"

            elif is_zenoti_dept and is_zenoti_operational:
                # Flow II: Zenoti-Operational — Needs only AOM approval
                approval_required = True
                approver_value = aom_mapping.aom_name
                approval_status_value = ApprovalStatusEnum.Pending
                ticket_status = TicketStatusEnum.PendingApproval
                approval_type_value = "aom_only"

            else:
                # Non-Zenoti, non-CDD departments (Admin, etc.) — no AOM approval needed
                approval_required = False

        elif is_zenoti_dept and center_value:
            # No AOM mapping found — look up AOM from center's aom_email
            center_obj = db.query(Center).filter(Center.name == center_value).first()
            if center_obj and center_obj.aom_email:
                aom_user = db.query(User).filter(User.email == center_obj.aom_email).first()
                if aom_user:
                    if is_operational_issues:
                        # Flow III: No approval
                        approval_required = False
                    elif is_zenoti_finance:
                        # Flow I: AOM + Finance
                        approval_required = True
                        approver_value = aom_user.name
                        approval_status_value = ApprovalStatusEnum.Pending
                        ticket_status = TicketStatusEnum.PendingApproval
                        approval_type_value = "aom_finance"
                    elif is_zenoti_operational:
                        # Flow II: AOM only
                        approval_required = True
                        approver_value = aom_user.name
                        approval_status_value = ApprovalStatusEnum.Pending
                        ticket_status = TicketStatusEnum.PendingApproval
                        approval_type_value = "aom_only"
                    # else: non-Zenoti category — no approval, stay Open

        ticket = Ticket(
            code=code, title=req.title, description=req.description,
            category=req.category, sub_category=req.sub_category,
            priority=PriorityEnum(req.priority) if req.priority else PriorityEnum.Medium,
            status=ticket_status,
            raised_by_id=current_user.id,
            raised_by_dept=raised_by_dept_value,
            assigned_dept=assigned_dept_value,
            assigned_to_id=assigned_to_id_value,
            center=center_value,
            approval_required=approval_required,
            approval_type=approval_type_value,
            approver=approver_value,
            approval_status=approval_status_value,
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
        )
        db.add(ticket)
        try:
            db.commit()
        except Exception as e1:
            print(f"[CREATE TICKET] First commit failed: {e1}")
            db.rollback()
            ticket.code = _next_code(db)
            db.add(ticket)
            db.commit()
        db.refresh(ticket)
        print(f"[CREATE TICKET] SUCCESS: {ticket.code}, id={ticket.id}")

        # --- Notifications ---
        # Notify the raiser
        _create_notification(db, current_user.id, f"Ticket {ticket.code} Created",
            f"Your ticket '{ticket.title}' has been raised successfully.", ticket.id, NotificationTypeEnum.success)

        # Notify the assigned user (if auto-assigned)
        if ticket.assigned_to_id and ticket.assigned_to_id != current_user.id:
            _create_notification(db, ticket.assigned_to_id, f"New Ticket {ticket.code}",
                f"New ticket '{ticket.title}' has been assigned to you.", ticket.id)

        # Notify AOM if ticket needs approval
        if ticket.approval_required and ticket.approver:
            aom_user = db.query(User).filter(User.name == ticket.approver).first()
            if aom_user and aom_user.id != current_user.id:
                _create_notification(db, aom_user.id, f"New Ticket {ticket.code} - Approval Required",
                    f"Ticket '{ticket.title}' needs your approval.", ticket.id)

        db.commit()

    except Exception as e:
        print(f"[CREATE TICKET] FAILED: {traceback.format_exc()}")
        raise

    # ── Email: Ticket Created ──
    try:
        priority_val = ticket.priority.value if ticket.priority else "Medium"
        assigned_name = ticket.assigned_to_rel.name if ticket.assigned_to_rel else ""

        # Email the raiser (confirmation)
        if current_user.email:
            send_ticket_created(current_user.email, ticket.code, ticket.title,
                ticket.description or "", current_user.name, ticket.assigned_dept or "",
                ticket.center or "", priority_val, ticket.category or "", assigned_name)

        # Email the assignee
        if ticket.assigned_to_rel and ticket.assigned_to_rel.email and ticket.assigned_to_rel.id != current_user.id:
            send_ticket_assigned(ticket.assigned_to_rel.email, ticket.code, ticket.title,
                ticket.assigned_to_rel.name, current_user.name,
                ticket.assigned_dept or "", ticket.center or "", priority_val)

        # Email department users
        dept = db.query(Department).filter(Department.name == ticket.assigned_dept).first()
        if dept:
            dept_users = db.query(User).filter(User.department_id == dept.id, User.id != current_user.id).all()
            for u in dept_users:
                if u.email and (not ticket.assigned_to_rel or u.id != ticket.assigned_to_rel.id):
                    send_ticket_created(u.email, ticket.code, ticket.title,
                        ticket.description or "", current_user.name, ticket.assigned_dept or "",
                        ticket.center or "", priority_val, ticket.category or "", assigned_name)

        # Email center manager if center specified
        if ticket.center:
            center_obj = db.query(Center).filter(Center.name == ticket.center).first()
            if center_obj and center_obj.center_manager_email:
                cm = db.query(User).filter(User.email == center_obj.center_manager_email).first()
                if cm and cm.id != current_user.id and (not ticket.assigned_to_rel or cm.id != ticket.assigned_to_rel.id):
                    send_ticket_created(cm.email, ticket.code, ticket.title,
                        ticket.description or "", current_user.name, ticket.assigned_dept or "",
                        ticket.center or "", priority_val, ticket.category or "")
    except Exception as email_err:
        print(f"[EMAIL] Failed to send creation emails: {email_err}")

    return _ticket_to_response(ticket)
 
 
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_to_response(t)
 
 
@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, req: TicketUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update_data = req.model_dump(exclude_unset=True)
    if "status" in update_data:
        update_data["status"] = TicketStatusEnum(update_data["status"])
    if "priority" in update_data:
        update_data["priority"] = PriorityEnum(update_data["priority"])
    # Track if assigned_to changed
    new_assignee_id = update_data.get("assigned_to_id")
    for key, value in update_data.items():
        setattr(t, key, value)

    # Add assignment comment if assigned_to changed
    if new_assignee_id:
        assignee = db.query(User).filter(User.id == new_assignee_id).first()
        if assignee:
            db.add(TicketComment(
                ticket_id=ticket_id,
                user=current_user.name,
                message=f"Ticket assigned to {assignee.name} by {current_user.name}",
                type=CommentTypeEnum.status_change,
            ))

    db.commit()
    db.refresh(t)

    db.commit()

    # ── Email: Status Changed + Ticket Assigned ──
    try:
        old_status = req.model_dump(exclude_unset=True).get("_old_status", "")
        if "status" in update_data:
            new_status = update_data["status"].value if hasattr(update_data["status"], "value") else str(update_data["status"])
            # Email the raiser
            if t.raised_by_rel and t.raised_by_rel.email and t.raised_by_id != current_user.id:
                send_status_changed(t.raised_by_rel.email, t.code, t.title,
                    old_status or "—", new_status, current_user.name)
            # Email the assignee
            if t.assigned_to_rel and t.assigned_to_rel.email and t.assigned_to_id != current_user.id:
                send_status_changed(t.assigned_to_rel.email, t.code, t.title,
                    old_status or "—", new_status, current_user.name)

        if new_assignee_id:
            assignee = db.query(User).filter(User.id == new_assignee_id).first()
            if assignee and assignee.email:
                send_ticket_assigned(assignee.email, t.code, t.title,
                    assignee.name, current_user.name,
                    t.assigned_dept or "", t.center or "",
                    t.priority.value if t.priority else "")
    except Exception as email_err:
        print(f"[EMAIL] Failed to send update emails: {email_err}")

    return _ticket_to_response(t)
 
 
@router.patch("/{ticket_id}/status/")
def update_ticket_status(ticket_id: int, status: str, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    t.status = TicketStatusEnum(status)
    db.commit()
    return {"message": "Status updated"}
 
 
@router.post("/{ticket_id}/comments", response_model=TicketCommentResponse, status_code=201)
def add_comment(ticket_id: int, req: TicketCommentCreate, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    comment = TicketComment(
        ticket_id=ticket_id, user=req.user, message=req.message,
        type=CommentTypeEnum(req.type) if req.type else CommentTypeEnum.comment,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # ── Email: Comment Added ──
    try:
        # Notify the raiser
        if t.raised_by_rel and t.raised_by_rel.email:
            send_comment_added(t.raised_by_rel.email, t.code, t.title, req.user, req.message)
        # Notify the assignee (if different from raiser)
        if t.assigned_to_rel and t.assigned_to_rel.email and t.assigned_to_id != t.raised_by_id:
            send_comment_added(t.assigned_to_rel.email, t.code, t.title, req.user, req.message)
    except Exception as email_err:
        print(f"[EMAIL] Failed to send comment emails: {email_err}")

    return TicketCommentResponse(id=comment.id, user=comment.user, message=comment.message, type=comment.type.value, created_at=comment.created_at)


# --- Approval workflow ---
 
class ApprovalRequest(BaseModel):
    action: str  # "Approve" | "Follow-up" | "Reject"
    comment: Optional[str] = None
    approver_name: Optional[str] = None
 
 
@router.patch("/{ticket_id}/approve/", response_model=TicketResponse)
def approve_ticket(ticket_id: int, req: ApprovalRequest, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
 
    approver = req.approver_name or "AOM"

    # Prevent AOM from approving twice — if approver is now "Finance Team", AOM cannot act
    if t.approver == "Finance Team" and approver != "Finance Team" and not any(r in (approver or "").lower() for r in ["finance"]):
        # Check if this person already approved (AOM approved, now it's Finance's turn)
        already_approved = any(
            c.type == CommentTypeEnum.approval and approver in (c.user or "") and "approved" in (c.message or "").lower()
            for c in t.comments
        )
        if already_approved:
            raise HTTPException(status_code=400, detail="You have already approved this ticket. It is now pending Finance approval.")

    if req.action == "Follow-up":
        # AOM needs more info – set status to Follow Up, add comment
        t.status = TicketStatusEnum.FollowUp
        t.approval_status = ApprovalStatusEnum.Pending
        t.approver = approver
        comment_msg = f"Follow-up requested by {approver}: {req.comment}" if req.comment else f"Follow-up requested by {approver}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=approver, message=comment_msg,
            type=CommentTypeEnum.approval,
        ))
 
    elif req.action == "Approve":
        cat = (t.category or "").lower()
        main_cat = (t.zenoti_main_category or "").lower()
        is_zenoti_finance = cat == "zenoti-finance" or main_cat == "zenoti-finance"
        is_zenoti_operational = cat == "zenoti-operational" or main_cat == "zenoti-operational"
        finance_already_involved = t.approver == "Finance Team"
 
        if is_zenoti_finance and not finance_already_involved:
            # Flow I: Zenoti-Finance — AOM approving → escalate to Finance team
            comment_msg = f"Approved by {approver} (AOM). Escalated to Finance team for final approval."
            if req.comment:
                comment_msg += f" Comment: {req.comment}"
            db.add(TicketComment(
                ticket_id=ticket_id, user=approver, message=comment_msg,
                type=CommentTypeEnum.approval,
            ))
            t.approver = "Finance Team"
            t.approval_status = ApprovalStatusEnum.Pending
            t.status = TicketStatusEnum.PendingApproval
 
        elif is_zenoti_finance and finance_already_involved:
            # Flow I: Zenoti-Finance — Finance approving → send to Zenoti team
            t.approval_status = ApprovalStatusEnum.Approved
            t.approver = approver
            t.status = TicketStatusEnum.InProgress
            t.assigned_dept = "Zenoti"
            comment_msg = f"Approved by {approver} (Finance). Sent to Zenoti team for correction."
            if req.comment:
                comment_msg += f" Comment: {req.comment}"
            db.add(TicketComment(
                ticket_id=ticket_id, user=approver, message=comment_msg,
                type=CommentTypeEnum.approval,
            ))
 
        elif is_zenoti_operational:
            # Flow II: Zenoti-Operational — AOM approving → send directly to Zenoti team
            t.approval_status = ApprovalStatusEnum.Approved
            t.approver = approver
            t.status = TicketStatusEnum.InProgress
            t.assigned_dept = "Zenoti"
            comment_msg = f"Approved by {approver} (AOM). Sent to Zenoti team for correction."
            if req.comment:
                comment_msg += f" Comment: {req.comment}"
            db.add(TicketComment(
                ticket_id=ticket_id, user=approver, message=comment_msg,
                type=CommentTypeEnum.approval,
            ))
 
        else:
            # Non-Zenoti: direct approval → In Progress
            t.approval_status = ApprovalStatusEnum.Approved
            t.approver = approver
            t.status = TicketStatusEnum.InProgress
            comment_msg = f"Approved by {approver}."
            if req.comment:
                comment_msg += f" Comment: {req.comment}"
            db.add(TicketComment(
                ticket_id=ticket_id, user=approver, message=comment_msg,
                type=CommentTypeEnum.approval,
            ))
 
    elif req.action == "Reject":
        t.approval_status = ApprovalStatusEnum.Rejected
        t.approver = approver
        t.status = TicketStatusEnum.Rejected
        comment_msg = f"Rejected by {approver}."
        if req.comment:
            comment_msg += f" Reason: {req.comment}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=approver, message=comment_msg,
            type=CommentTypeEnum.approval,
        ))
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'Approve', 'Follow-up', or 'Reject'.")
 
    db.commit()
    db.refresh(t)
    return _ticket_to_response(t)
 
 
# --- Zenoti Team resolve/close ---
 
class ResolveRequest(BaseModel):
    resolution: Optional[str] = None
    action: str  # "Resolve" | "Close"
    user_name: Optional[str] = None
 
 
@router.patch("/{ticket_id}/resolve", response_model=TicketResponse)
def resolve_ticket(ticket_id: int, req: ResolveRequest, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
 
    user = req.user_name or "Zenoti Team"
 
    if req.action == "Resolve":
        t.status = TicketStatusEnum.Resolved
        t.resolution = req.resolution or ""
        comment_msg = f"Resolved by {user}."
        if req.resolution:
            comment_msg += f" Resolution: {req.resolution}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=user, message=comment_msg,
            type=CommentTypeEnum.status_change,
        ))
    elif req.action == "Close":
        t.status = TicketStatusEnum.Closed
        t.resolution = req.resolution or t.resolution or ""
        comment_msg = f"Closed by {user} after review."
        if req.resolution:
            comment_msg += f" Note: {req.resolution}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=user, message=comment_msg,
            type=CommentTypeEnum.status_change,
        ))
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'Resolve' or 'Close'.")

    db.commit()
    db.refresh(t)
    return _ticket_to_response(t)


# --- CDD Escalation Flow ---

class EscalateRequest(BaseModel):
    action: str  # "Acknowledge", "Escalate L1", "Escalate L2", "Reopen", "Final Close"
    comment: Optional[str] = None
    escalate_to_id: Optional[int] = None
    user_name: Optional[str] = None


@router.patch("/{ticket_id}/cdd-action", response_model=TicketResponse)
def cdd_ticket_action(ticket_id: int, req: EscalateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import traceback
    from datetime import datetime, timezone
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Validate escalate_to_id exists
    if req.escalate_to_id:
        target_user = db.query(User).filter(User.id == req.escalate_to_id).first()
        if not target_user:
            raise HTTPException(status_code=400, detail=f"User with ID {req.escalate_to_id} not found")

    user = req.user_name or current_user.name
    print(f"[CDD ACTION] ticket={ticket_id}, action={req.action}, escalate_to={req.escalate_to_id}, user={user}")

    if req.action == "Acknowledge":
        # Clinic Manager acknowledges the ticket
        t.status = TicketStatusEnum.Acknowledged
        t.acknowledged_at = datetime.now(timezone.utc)
        db.add(TicketComment(
            ticket_id=ticket_id, user=user,
            message=f"Ticket acknowledged by {user}.",
            type=CommentTypeEnum.status_change,
        ))

    elif req.action == "Escalate L1":
        # Escalate to L1 Dept Head — also assign ticket to them
        t.status = TicketStatusEnum.EscalatedL1
        t.escalation_level = 1
        t.escalated_at = datetime.now(timezone.utc)
        if req.escalate_to_id:
            t.escalated_to_id = req.escalate_to_id
            t.assigned_to_id = req.escalate_to_id
            escalated_user = db.query(User).filter(User.id == req.escalate_to_id).first()
            esc_name = escalated_user.name if escalated_user else "L1 Dept Head"
        else:
            esc_name = "L1 Dept Head"
        comment_msg = f"Escalated to L1 ({esc_name}) by {user}."
        if req.comment:
            comment_msg += f" Reason: {req.comment}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=user, message=comment_msg,
            type=CommentTypeEnum.status_change,
        ))

    elif req.action == "Escalate L2":
        # Escalate to L2 CXO — also assign ticket to them
        t.status = TicketStatusEnum.EscalatedL2
        t.escalation_level = 2
        t.escalated_at = datetime.now(timezone.utc)
        if req.escalate_to_id:
            t.escalated_to_id = req.escalate_to_id
            t.assigned_to_id = req.escalate_to_id
            escalated_user = db.query(User).filter(User.id == req.escalate_to_id).first()
            esc_name = escalated_user.name if escalated_user else "L2 CXO"
        else:
            esc_name = "L2 CXO"
        comment_msg = f"Escalated to L2 CXO ({esc_name}) by {user}."
        if req.comment:
            comment_msg += f" Reason: {req.comment}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=user, message=comment_msg,
            type=CommentTypeEnum.status_change,
        ))

    elif req.action == "Reopen":
        # CDD reopens a resolved/closed ticket — re-initiate resolution flow
        t.status = TicketStatusEnum.ReopenedByCDD
        t.resolution = None
        comment_msg = f"Reopened by CDD ({user}). Not all queries addressed."
        if req.comment:
            comment_msg += f" Reason: {req.comment}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=user, message=comment_msg,
            type=CommentTypeEnum.status_change,
        ))

    elif req.action == "Final Close":
        # CDD confirms all queries addressed — final close
        t.status = TicketStatusEnum.FinalClosed
        comment_msg = f"Final closed by CDD ({user}). All queries addressed."
        if req.comment:
            comment_msg += f" Note: {req.comment}"
        db.add(TicketComment(
            ticket_id=ticket_id, user=user, message=comment_msg,
            type=CommentTypeEnum.status_change,
        ))

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'Acknowledge', 'Escalate L1', 'Escalate L2', 'Reopen', or 'Final Close'.")

    try:
        db.commit()
        db.refresh(t)
    except Exception as e:
        db.rollback()
        print(f"[CDD ACTION] FAILED: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")
    return _ticket_to_response(t)


# --- Admin Department Auto-Escalation ---

@router.post("/admin-escalation-check")
def check_admin_escalations(db: Session = Depends(get_db)):
    """Check Admin Department tickets for SLA breach and auto-escalate to L2/L3."""
    now = datetime.now(timezone.utc)
    escalated_count = 0

    # Get all open/in-progress Admin Department tickets
    admin_tickets = db.query(Ticket).filter(
        Ticket.assigned_dept.in_(["Admin Department", "Admin"]),
        Ticket.status.notin_([
            TicketStatusEnum.Resolved, TicketStatusEnum.Closed,
            TicketStatusEnum.Rejected, TicketStatusEnum.FinalClosed,
        ]),
    ).all()

    for t in admin_tickets:
        if not t.created_at:
            continue

        created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
        hours_elapsed = (now - created).total_seconds() / 3600

        # Find center city
        center_obj = db.query(Center).filter(Center.name == t.center).first()
        center_city = center_obj.city if center_obj else None
        if not center_city:
            continue

        # Get escalation matrix
        esc = db.query(AdminEscalationMatrix).filter(
            AdminEscalationMatrix.location == center_city,
            AdminEscalationMatrix.status == StatusEnum.Active,
        ).first()
        if not esc:
            continue

        current_level = t.escalation_level or 0
        l1_threshold = esc.l1_sla_hours or 8
        l2_threshold = l1_threshold + (esc.l2_sla_hours or 10)

        # Escalate to L3 if > l1+l2 hours and currently at L2
        if hours_elapsed > l2_threshold and current_level < 3:
            l3_user = db.query(User).filter(User.email == esc.l3_email).first()
            if l3_user:
                t.escalation_level = 3
                t.escalated_to_id = l3_user.id
                t.assigned_to_id = l3_user.id
                t.escalated_at = now
                t.status = TicketStatusEnum.EscalatedL2
                db.add(TicketComment(
                    ticket_id=t.id, user="System",
                    message=f"Auto-escalated to L3 ({l3_user.name}) after {round(hours_elapsed, 1)} hours. SLA threshold: {l2_threshold}h.",
                    type=CommentTypeEnum.status_change,
                ))
                escalated_count += 1
                print(f"[ESCALATION] {t.code} -> L3 ({l3_user.name}) after {round(hours_elapsed, 1)}h")

        # Escalate to L2 if > l1 hours and currently at L1
        elif hours_elapsed > l1_threshold and current_level < 2:
            l2_user = db.query(User).filter(User.email == esc.l2_email).first()
            if l2_user:
                t.escalation_level = 2
                t.escalated_to_id = l2_user.id
                t.assigned_to_id = l2_user.id
                t.escalated_at = now
                t.status = TicketStatusEnum.EscalatedL1
                db.add(TicketComment(
                    ticket_id=t.id, user="System",
                    message=f"Auto-escalated to L2 ({l2_user.name}) after {round(hours_elapsed, 1)} hours. SLA threshold: {l1_threshold}h.",
                    type=CommentTypeEnum.status_change,
                ))
                escalated_count += 1
                print(f"[ESCALATION] {t.code} -> L2 ({l2_user.name}) after {round(hours_elapsed, 1)}h")

    if escalated_count > 0:
        db.commit()

    return {"escalated": escalated_count, "checked": len(admin_tickets)}
