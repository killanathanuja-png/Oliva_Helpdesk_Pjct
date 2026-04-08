"""TAT (Turnaround Time) Report API endpoint."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models.models import (
    Ticket, User, Department, SLAConfig, TicketStatusEnum, PriorityEnum, StatusEnum,
)

router = APIRouter(prefix="/api/tat-report", tags=["TAT Report"])


def _calc_working_hours(start_utc, end_utc):
    """Calculate working hours (10AM-6PM IST, Mon-Sun) between two UTC timestamps."""
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
    start = start_utc.astimezone(IST) if start_utc.tzinfo else start_utc.replace(tzinfo=timezone.utc).astimezone(IST)
    end = end_utc.astimezone(IST) if end_utc.tzinfo else end_utc.replace(tzinfo=timezone.utc).astimezone(IST)
    total = 0.0
    current = start
    while current < end:
        day_start = current.replace(hour=10, minute=0, second=0, microsecond=0)
        day_end = current.replace(hour=18, minute=0, second=0, microsecond=0)
        effective_start = max(current, day_start)
        effective_end = min(end, day_end)
        if effective_start < effective_end:
            total += (effective_end - effective_start).total_seconds() / 3600
        current = current.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return total


class TATReportRow(BaseModel):
    ticket_id: str
    title: str
    department: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    raised_by: Optional[str] = None
    raised_by_dept: Optional[str] = None
    center: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    actual_tat_hours: Optional[float] = None
    sla_hours: Optional[float] = None
    sla_status: str = "Within SLA"
    delay_hours: Optional[float] = None
    escalation_level: int = 0
    escalated_at: Optional[datetime] = None
    escalated_to: Optional[str] = None


class TATReportResponse(BaseModel):
    rows: List[TATReportRow]
    total: int
    within_sla: int
    breached: int
    avg_tat_hours: Optional[float] = None


@router.get("/", response_model=TATReportResponse)
def get_tat_report(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    center: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sla_status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = db.query(Ticket)

    # Date filters
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

    # Other filters
    if department:
        base = base.filter(Ticket.assigned_dept == department)
    if center:
        base = base.filter(Ticket.center == center)
    if assigned_to:
        base = base.join(Ticket.assigned_to_rel).filter(User.name == assigned_to)
    if status:
        try:
            base = base.filter(Ticket.status == TicketStatusEnum(status))
        except ValueError:
            pass
    if priority:
        try:
            base = base.filter(Ticket.priority == PriorityEnum(priority))
        except ValueError:
            pass

    tickets = base.order_by(Ticket.created_at.desc()).all()

    # Build SLA config cache: (dept_id, priority) -> resolution_time_hrs
    sla_cache = {}
    sla_configs = db.query(SLAConfig).filter(SLAConfig.active == True).all()
    for sc in sla_configs:
        sla_cache[(sc.department_id, sc.priority)] = sc.resolution_time_hrs

    # Dept name -> id cache
    dept_cache = {}
    for dept in db.query(Department).all():
        dept_cache[dept.name] = dept.id

    now = datetime.now(timezone.utc)
    resolved_statuses = {TicketStatusEnum.Resolved, TicketStatusEnum.Closed, TicketStatusEnum.FinalClosed}

    rows = []
    total_tat = 0.0
    tat_count = 0
    within_sla_count = 0
    breached_count = 0

    for t in tickets:
        created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at and t.created_at.tzinfo is None else t.created_at

        # Resolved/closed time
        is_resolved = t.status in resolved_statuses
        end_time = t.updated_at if is_resolved and t.updated_at else (now if created else None)
        if end_time and end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)

        # Actual TAT (working hours)
        actual_tat = None
        if created and end_time:
            actual_tat = round(_calc_working_hours(created, end_time), 2)

        # First response: acknowledged_at or first comment time
        first_response = None
        if t.acknowledged_at:
            first_response = t.acknowledged_at
        elif t.comments:
            sorted_comments = sorted(t.comments, key=lambda c: c.created_at or now)
            if sorted_comments:
                first_response = sorted_comments[0].created_at

        # SLA hours from config
        dept_id = dept_cache.get(t.assigned_dept)
        sla_hrs = None
        if dept_id and t.priority:
            sla_hrs = sla_cache.get((dept_id, t.priority))
        if sla_hrs is None:
            # Fallback to department default
            dept_obj = db.query(Department).filter(Department.name == t.assigned_dept).first() if t.assigned_dept else None
            sla_hrs = float(dept_obj.sla_hours) if dept_obj and dept_obj.sla_hours else 24.0

        # SLA status & delay
        sla_stat = "Within SLA"
        delay = 0.0
        if actual_tat is not None and sla_hrs:
            if actual_tat > sla_hrs:
                sla_stat = "Breached"
                delay = round(actual_tat - sla_hrs, 1)
                breached_count += 1
            else:
                within_sla_count += 1
        elif actual_tat is not None:
            within_sla_count += 1

        if actual_tat is not None:
            total_tat += actual_tat
            tat_count += 1

        row = TATReportRow(
            ticket_id=t.code,
            title=t.title,
            department=t.assigned_dept,
            category=t.category,
            sub_category=t.sub_category,
            priority=t.priority.value if t.priority else None,
            status=t.status.value if t.status else None,
            raised_by=t.raised_by_rel.name if t.raised_by_rel else None,
            raised_by_dept=t.raised_by_dept,
            center=t.center,
            assigned_to=t.assigned_to_rel.name if t.assigned_to_rel else None,
            created_at=t.created_at,
            first_response_at=first_response,
            resolved_at=t.updated_at if is_resolved else None,
            closed_at=t.updated_at if t.status in {TicketStatusEnum.Closed, TicketStatusEnum.FinalClosed} else None,
            actual_tat_hours=actual_tat,
            sla_hours=sla_hrs,
            sla_status=sla_stat,
            delay_hours=delay if delay > 0 else None,
            escalation_level=t.escalation_level or 0,
            escalated_at=t.escalated_at,
            escalated_to=t.escalated_to_rel.name if t.escalated_to_rel else None,
        )
        rows.append(row)

    # Filter by SLA status after calculation
    if sla_status:
        rows = [r for r in rows if r.sla_status == sla_status]
        within_sla_count = sum(1 for r in rows if r.sla_status == "Within SLA")
        breached_count = sum(1 for r in rows if r.sla_status == "Breached")

    # Sorting
    if sort_by:
        sort_map = {
            "ticket_id": lambda r: r.ticket_id,
            "created_at": lambda r: r.created_at or datetime.min.replace(tzinfo=timezone.utc),
            "actual_tat_hours": lambda r: r.actual_tat_hours or 0,
            "sla_hours": lambda r: r.sla_hours or 0,
            "delay_hours": lambda r: r.delay_hours or 0,
            "priority": lambda r: {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}.get(r.priority or "", 4),
            "department": lambda r: r.department or "",
            "status": lambda r: r.status or "",
        }
        key_fn = sort_map.get(sort_by)
        if key_fn:
            rows.sort(key=key_fn, reverse=(sort_order == "desc"))

    total = len(rows)
    avg_tat = round(total_tat / tat_count, 1) if tat_count > 0 else None

    # Pagination
    start_idx = (page - 1) * page_size
    paginated = rows[start_idx:start_idx + page_size]

    return TATReportResponse(
        rows=paginated,
        total=total,
        within_sla=within_sla_count,
        breached=breached_count,
        avg_tat_hours=avg_tat,
    )
