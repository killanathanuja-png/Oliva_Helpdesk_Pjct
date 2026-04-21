from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.models import Ticket, TicketStatusEnum, PriorityEnum, Department, SLAConfig
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# Statuses that mean "not resolved"
_OPEN_STATUSES = [
    TicketStatusEnum.Open,
    TicketStatusEnum.InProgress,
    TicketStatusEnum.PendingApproval,
    TicketStatusEnum.Approved,
    TicketStatusEnum.Acknowledged,
    TicketStatusEnum.AwaitingUserInputs,
    TicketStatusEnum.UserInputsReceived,
    TicketStatusEnum.FollowUp,
    TicketStatusEnum.EscalatedL1,
    TicketStatusEnum.EscalatedL2,
    TicketStatusEnum.ReopenedByCDD,
]


@router.get("/stats/", response_model=DashboardStats)
def get_dashboard_stats(
    department: Optional[str] = Query(None, description="Filter by department"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sub_category: Optional[str] = Query(None, description="Filter by sub-category"),
    user_id: Optional[int] = Query(None, description="Filter by user (raised_by)"),
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    print(f"[DASHBOARD] Stats request: dept={department}, user={user_id}")
    import traceback
    try:
        return _get_dashboard_stats_impl(department, category, sub_category, user_id, from_date, to_date, db)
    except Exception as e:
        traceback.print_exc()
        raise

def _get_dashboard_stats_impl(department, category, sub_category, user_id, from_date, to_date, db):
    # Base query — optionally filtered by department or user
    base = db.query(Ticket)
    # Department alias mapping (departments that share tickets)
    DEPT_ALIASES = {
        "Admin Department": ["Admin Department", "IT Department"],
        "Administration": ["Administration"],
        "Quality & Audit": ["Quality & Audit", "Quality"],
        "Quality": ["Quality & Audit", "Quality"],
    }

    if department and user_id:
        # Show tickets assigned to the department OR raised by this user
        dept_names = DEPT_ALIASES.get(department, [department])
        base = base.filter(
            Ticket.assigned_dept.in_(dept_names)
            | (Ticket.raised_by_id == user_id)
        )
    elif user_id:
        base = base.filter((Ticket.raised_by_id == user_id) | (Ticket.assigned_to_id == user_id))
    elif department:
        dept_names = DEPT_ALIASES.get(department, [department])
        base = base.filter(Ticket.assigned_dept.in_(dept_names))

    if category:
        base = base.filter(Ticket.category == category)

    if sub_category:
        base = base.filter(Ticket.sub_category == sub_category)

    # Time-based filtering
    if from_date:
        try:
            start = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            base = base.filter(Ticket.created_at >= start)
        except ValueError:
            pass
    if to_date:
        try:
            end = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            base = base.filter(Ticket.created_at <= end)
        except ValueError:
            pass

    total = base.count()

    def _count(status: TicketStatusEnum) -> int:
        return base.filter(Ticket.status == status).count()

    open_tickets = base.filter(Ticket.status.in_(_OPEN_STATUSES)).count()
    resolved_count = base.filter(
        Ticket.status.in_([TicketStatusEnum.Resolved, TicketStatusEnum.Closed, TicketStatusEnum.FinalClosed])
    ).count()

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

    # ── Escalation: tickets breaching SLA within next 4 hours ──
    now = datetime.now(timezone.utc)
    threshold = now + timedelta(hours=4)

    # Method 1: tickets that have due_date set
    escalation_with_due = (
        base.filter(
            Ticket.status.in_(_OPEN_STATUSES),
            Ticket.due_date.isnot(None),
            Ticket.due_date <= threshold,
        )
        .count()
    )

    # Method 2: for tickets without due_date, calculate from dept sla_hours
    tickets_no_due = (
        base.filter(
            Ticket.status.in_(_OPEN_STATUSES),
            Ticket.due_date.is_(None),
            Ticket.created_at.isnot(None),
        )
        .all()
    )
    # Cache dept SLA hours
    dept_sla_cache: dict = {}
    escalation_no_due = 0
    for t in tickets_no_due:
        dept_name = t.assigned_dept or ""
        if dept_name not in dept_sla_cache:
            dept_obj = db.query(Department).filter(Department.name == dept_name).first()
            dept_sla_cache[dept_name] = float(dept_obj.sla_hours) if dept_obj and dept_obj.sla_hours else 24.0
        sla_hrs = dept_sla_cache[dept_name]
        deadline = t.created_at + timedelta(hours=sla_hrs)
        if deadline <= threshold:
            escalation_no_due += 1

    escalation_count = escalation_with_due + escalation_no_due

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

    # Tickets by category
    by_category = (
        base.filter(Ticket.category.isnot(None), Ticket.category != "")
        .with_entities(Ticket.category, func.count(Ticket.id))
        .group_by(Ticket.category)
        .order_by(func.count(Ticket.id).desc())
        .all()
    )
    category_list = [{"name": cat, "count": cnt} for cat, cnt in by_category]

    # Tickets by sub-category
    by_sub_category = (
        base.filter(Ticket.sub_category.isnot(None), Ticket.sub_category != "")
        .with_entities(Ticket.sub_category, func.count(Ticket.id))
        .group_by(Ticket.sub_category)
        .order_by(func.count(Ticket.id).desc())
        .all()
    )
    sub_category_list = [{"name": sub, "count": cnt} for sub, cnt in by_sub_category]

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
        open_tickets=open_tickets,
        in_progress=_count(TicketStatusEnum.InProgress),
        pending_approval=_count(TicketStatusEnum.PendingApproval),
        approved=_count(TicketStatusEnum.Approved),
        acknowledged=_count(TicketStatusEnum.Acknowledged),
        awaiting_user_inputs=_count(TicketStatusEnum.AwaitingUserInputs),
        user_inputs_received=_count(TicketStatusEnum.UserInputsReceived),
        follow_up=_count(TicketStatusEnum.FollowUp),
        resolved=_count(TicketStatusEnum.Resolved) + _count(TicketStatusEnum.Closed) + _count(TicketStatusEnum.FinalClosed),
        closed=_count(TicketStatusEnum.Closed),
        rejected=_count(TicketStatusEnum.Rejected),
        reopened=_count(TicketStatusEnum.Reopened) + _count(TicketStatusEnum.ReopenedByCDD),
        sla_breached=breached,
        sla_compliance_pct=round(sla_compliance_pct, 1),
        avg_resolution_hours=avg_resolution_hours,
        escalation_count=escalation_count,
        tickets_by_priority=by_priority,
        tickets_by_department=dept_list,
        tickets_by_status=status_list,
        tickets_by_category=category_list,
        tickets_by_sub_category=sub_category_list,
        dept_sla_compliance=dept_sla_compliance,
        priority_sla_compliance=priority_sla_compliance,
        recent_tickets=recent_list,
        top_centers=top_centers,
    )
