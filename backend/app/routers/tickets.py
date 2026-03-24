from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Ticket, TicketComment, User, TicketStatusEnum, PriorityEnum, CommentTypeEnum, ApprovalStatusEnum
from app.schemas.schemas import TicketCreate, TicketUpdate, TicketResponse, TicketCommentCreate, TicketCommentResponse
from app.auth import get_current_user
from app.config import DEPT_EMAIL_MAP
from app.email_utils import send_ticket_notification
 
router = APIRouter(prefix="/api/tickets", tags=["Tickets"])
 
 
def _next_code(db: Session) -> str:
    from sqlalchemy import func as sa_func
    max_code = db.query(sa_func.max(Ticket.code)).scalar()
    if max_code:
        num = int(max_code.replace("TKT", "")) + 1
    else:
        num = 1
    return f"TKT{num:04d}"
 
 
def _ticket_to_response(t: Ticket) -> TicketResponse:
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
        comments=[
            TicketCommentResponse(id=c.id, user=c.user, message=c.message, type=c.type.value if c.type else "comment", created_at=c.created_at)
            for c in t.comments
        ],
        created_at=t.created_at, updated_at=t.updated_at,
    )
 
 
@router.get("/", response_model=list[TicketResponse])
def list_tickets(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    return [_ticket_to_response(t) for t in tickets]
 
 
@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(req: TicketCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = Ticket(
        code=_next_code(db), title=req.title, description=req.description,
        category=req.category, sub_category=req.sub_category,
        priority=PriorityEnum(req.priority) if req.priority else PriorityEnum.Medium,
        status=TicketStatusEnum.Open,
        raised_by_id=current_user.id,
        raised_by_dept=req.assigned_dept,
        assigned_dept=req.assigned_dept,
        center=req.center,
        approval_required=req.approval_required or False,
        approval_type=req.approval_type if hasattr(req, 'approval_type') else None,
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
    db.commit()
    db.refresh(ticket)
 
    # Send email notification if department has a mapped email
    dept_email = DEPT_EMAIL_MAP.get(req.assigned_dept)
    if dept_email:
        send_ticket_notification(
            to_email=dept_email,
            ticket_code=ticket.code,
            title=ticket.title,
            description=ticket.description or "",
            raised_by=current_user.name,
            department=req.assigned_dept or "",
            center=req.center or "",
            priority=req.priority or "Medium",
            category=req.category or "",
        )
 
    return _ticket_to_response(ticket)
 
 
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_to_response(t)
 
 
@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, req: TicketUpdate, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update_data = req.model_dump(exclude_unset=True)
    if "status" in update_data:
        update_data["status"] = TicketStatusEnum(update_data["status"])
    if "priority" in update_data:
        update_data["priority"] = PriorityEnum(update_data["priority"])
    for key, value in update_data.items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return _ticket_to_response(t)
 
 
@router.patch("/{ticket_id}/status")
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
 
 
@router.patch("/{ticket_id}/approve", response_model=TicketResponse)
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
 