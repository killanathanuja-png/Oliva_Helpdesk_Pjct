from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Ticket, TicketComment, User, TicketStatusEnum, PriorityEnum, CommentTypeEnum, ApprovalStatusEnum, AOMCenterMapping, StatusEnum, Notification, NotificationTypeEnum, Department, Center
from app.schemas.schemas import TicketCreate, TicketUpdate, TicketResponse, TicketCommentCreate, TicketCommentResponse
from app.auth import get_current_user
from app.config import DEPT_EMAIL_MAP
from app.email_utils import send_ticket_notification
 
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
        comments=[
            TicketCommentResponse(id=c.id, user=c.user, message=c.message, type=c.type.value if c.type else "comment", created_at=c.created_at)
            for c in t.comments
        ],
        created_at=t.created_at, updated_at=t.updated_at,
    )
 
 
@router.get("/", response_model=list[TicketResponse])
def list_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clinic Managers only see tickets for their center
    user_roles = (current_user.role or "").lower()
    is_clinic_manager = "clinic manager" in user_roles or "clinic incharge" in user_roles

    if is_clinic_manager and current_user.center_rel:
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
        approval_required = req.approval_required or False
        approval_type_value = req.approval_type if hasattr(req, 'approval_type') else None
        approver_value = None
        approval_status_value = None
        ticket_status = TicketStatusEnum.Open

        # Look up AOM mapping for the current user (by email)
        aom_mapping = db.query(AOMCenterMapping).filter(
            AOMCenterMapping.cm_email == current_user.email,
            AOMCenterMapping.status == StatusEnum.Active,
        ).first()

        if aom_mapping:
            # Auto-set center from mapping if not provided
            if not center_value:
                center_value = aom_mapping.center_name
            # Auto-set AOM as approver — ticket needs AOM approval
            approval_required = True
            approver_value = aom_mapping.aom_name
            approval_status_value = ApprovalStatusEnum.Pending
            ticket_status = TicketStatusEnum.PendingApproval
            if not approval_type_value:
                approval_type_value = "aom_only"

        ticket = Ticket(
            code=code, title=req.title, description=req.description,
            category=req.category, sub_category=req.sub_category,
            priority=PriorityEnum(req.priority) if req.priority else PriorityEnum.Medium,
            status=ticket_status,
            raised_by_id=current_user.id,
            raised_by_dept=req.assigned_dept,
            assigned_dept=req.assigned_dept,
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

        # Notify assigned department users
        dept = db.query(Department).filter(Department.name == ticket.assigned_dept).first()
        if dept:
            dept_users = db.query(User).filter(User.department_id == dept.id, User.id != current_user.id).all()
            for u in dept_users:
                _create_notification(db, u.id, f"New Ticket {ticket.code}",
                    f"New ticket '{ticket.title}' assigned to {ticket.assigned_dept} department.", ticket.id)

        # If center is specified, notify center users
        if ticket.center:
            center = db.query(Center).filter(Center.name == ticket.center).first()
            if center:
                center_users = db.query(User).filter(User.center_id == center.id, User.id != current_user.id).all()
                for u in center_users:
                    _create_notification(db, u.id, f"New Ticket {ticket.code}",
                        f"New ticket '{ticket.title}' raised for {ticket.center}.", ticket.id)

        db.commit()

    except Exception as e:
        print(f"[CREATE TICKET] FAILED: {traceback.format_exc()}")
        raise

    # Email notification disabled for now
    # dept_email = DEPT_EMAIL_MAP.get(req.assigned_dept)
    # if dept_email:
    #     send_ticket_notification(...)
 
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

    # --- Notifications ---
    # Notify on status change
    if "status" in update_data:
        status_val = update_data["status"].value if hasattr(update_data["status"], 'value') else str(update_data["status"])
        # Notify the raiser
        if t.raised_by_id and t.raised_by_id != current_user.id:
            _create_notification(db, t.raised_by_id, f"Ticket {t.code} Updated",
                f"Ticket '{t.title}' status changed to {status_val}.", t.id)
        # Notify the assignee
        if t.assigned_to_id and t.assigned_to_id != current_user.id and t.assigned_to_id != t.raised_by_id:
            _create_notification(db, t.assigned_to_id, f"Ticket {t.code} Updated",
                f"Ticket '{t.title}' status changed to {status_val}.", t.id)

    # Notify new assignee
    if new_assignee_id:
        _create_notification(db, new_assignee_id, f"Ticket {t.code} Assigned",
            f"Ticket '{t.title}' has been assigned to you.", t.id, NotificationTypeEnum.info)

    db.commit()

    # Email notification disabled for now
    # if new_assignee_id:
    #     assignee = db.query(User).filter(User.id == new_assignee_id).first()
    #     if assignee and assignee.email:
    #         send_ticket_notification(...)

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
 