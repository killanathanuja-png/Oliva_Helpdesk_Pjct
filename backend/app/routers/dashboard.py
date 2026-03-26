from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app.models.models import Ticket, TicketStatusEnum, PriorityEnum
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    department: Optional[str] = Query(None, description="Filter by department"),
    user_id: Optional[int] = Query(None, description="Filter by user (raised_by)"),
    db: Session = Depends(get_db),
):
    # Base query — optionally filtered by department or user
    base = db.query(Ticket)
    if user_id:
        base = base.filter((Ticket.raised_by_id == user_id) | (Ticket.assigned_to_id == user_id))
    elif department:
        base = base.filter(Ticket.assigned_dept == department)

    total = base.count()

    def _count(status: TicketStatusEnum) -> int:
        return base.filter(Ticket.status == status).count()

    breached = base.filter(Ticket.sla_breached == True).count()

    # SLA compliance percentage
    sla_compliance_pct = ((total - breached) / total * 100) if total > 0 else 100.0

    # Average resolution time (hours) for resolved/closed tickets
    resolved_tickets = (
        base.filter(
            Ticket.status.in_([TicketStatusEnum.Resolved, TicketStatusEnum.Closed]),
            Ticket.created_at.isnot(None),
            Ticket.updated_at.isnot(None),
        )
        .all()
    )
    avg_resolution_hours = None
    if resolved_tickets:
        total_hours = 0.0
        count = 0
        for t in resolved_tickets:
            if t.created_at and t.updated_at:
                diff = (t.updated_at - t.created_at).total_seconds() / 3600
                if diff >= 0:
                    total_hours += diff
                    count += 1
        if count > 0:
            avg_resolution_hours = round(total_hours / count, 1)

    by_priority = {}
    for p in PriorityEnum:
        by_priority[p.value] = base.filter(Ticket.priority == p).count()

    by_dept = base.with_entities(Ticket.assigned_dept, func.count(Ticket.id)).group_by(Ticket.assigned_dept).all()
    dept_list = [{"name": d or "Unassigned", "count": c} for d, c in by_dept]

    # Tickets by status for status distribution chart
    by_status = (
        base.with_entities(Ticket.status, func.count(Ticket.id))
        .group_by(Ticket.status)
        .all()
    )
    status_list = [{"name": s.value if s else "Unknown", "count": c} for s, c in by_status]

    # Department-wise SLA compliance
    dept_sla = (
        base.with_entities(
            Ticket.assigned_dept,
            func.count(Ticket.id).label("total"),
            func.sum(case((Ticket.sla_breached == True, 1), else_=0)).label("breached"),
        )
        .group_by(Ticket.assigned_dept)
        .all()
    )
    dept_sla_compliance = []
    for dept_name, dept_total, dept_breached in dept_sla:
        on_track = dept_total - (dept_breached or 0)
        pct = round((on_track / dept_total * 100), 1) if dept_total > 0 else 100.0
        dept_sla_compliance.append({
            "name": dept_name or "Unassigned",
            "total": dept_total,
            "breached": dept_breached or 0,
            "on_track": on_track,
            "compliance_pct": pct,
        })

    # Priority-wise SLA compliance
    priority_sla = (
        base.with_entities(
            Ticket.priority,
            func.count(Ticket.id).label("total"),
            func.sum(case((Ticket.sla_breached == True, 1), else_=0)).label("breached"),
        )
        .group_by(Ticket.priority)
        .all()
    )
    priority_sla_compliance = []
    for pri, pri_total, pri_breached in priority_sla:
        on_track = pri_total - (pri_breached or 0)
        pct = round((on_track / pri_total * 100), 1) if pri_total > 0 else 100.0
        priority_sla_compliance.append({
            "name": pri.value if pri else "Unknown",
            "total": pri_total,
            "breached": pri_breached or 0,
            "on_track": on_track,
            "compliance_pct": pct,
        })

    # Top centers by ticket count
    by_center = (
        base.with_entities(Ticket.center, func.count(Ticket.id))
        .filter(Ticket.center.isnot(None), Ticket.center != "")
        .group_by(Ticket.center)
        .order_by(func.count(Ticket.id).desc())
        .limit(5)
        .all()
    )
    top_centers = [{"name": c, "tickets": n} for c, n in by_center]

    # Recent tickets (last 10)
    recent = (
        base.order_by(Ticket.created_at.desc())
        .limit(10)
        .all()
    )
    recent_list = [
        {
            "id": t.code,
            "title": t.title,
            "priority": t.priority.value if t.priority else "Medium",
            "status": t.status.value if t.status else "Open",
            "department": t.assigned_dept or "",
            "center": t.center or "",
            "sla_breached": t.sla_breached,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "raised_by": t.raised_by_dept or "",
        }
        for t in recent
    ]

    return DashboardStats(
        total_tickets=total,
        open_tickets=_count(TicketStatusEnum.Open),
        in_progress=_count(TicketStatusEnum.InProgress),
        pending_approval=_count(TicketStatusEnum.PendingApproval),
        approved=_count(TicketStatusEnum.Approved),
        acknowledged=_count(TicketStatusEnum.Acknowledged),
        awaiting_user_inputs=_count(TicketStatusEnum.AwaitingUserInputs),
        user_inputs_received=_count(TicketStatusEnum.UserInputsReceived),
        follow_up=_count(TicketStatusEnum.FollowUp),
        resolved=_count(TicketStatusEnum.Resolved),
        closed=_count(TicketStatusEnum.Closed),
        rejected=_count(TicketStatusEnum.Rejected),
        sla_breached=breached,
        sla_compliance_pct=round(sla_compliance_pct, 1),
        avg_resolution_hours=avg_resolution_hours,
        tickets_by_priority=by_priority,
        tickets_by_department=dept_list,
        tickets_by_status=status_list,
        dept_sla_compliance=dept_sla_compliance,
        priority_sla_compliance=priority_sla_compliance,
        recent_tickets=recent_list,
        top_centers=top_centers,
    )
