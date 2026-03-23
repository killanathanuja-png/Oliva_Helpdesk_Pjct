from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.models.models import LoginHistory, User
from pydantic import BaseModel

router = APIRouter(prefix="/api/login-history", tags=["LoginHistory"])


class LoginHistoryResponse(BaseModel):
    id: int
    user_id: int
    employee_id: Optional[str] = None
    name: str
    email: str
    login_time: Optional[datetime] = None
    logout_time: Optional[datetime] = None
    duration: Optional[str] = None
    role: Optional[str] = None
    module: Optional[str] = None
    location: Optional[str] = None
    login_source: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


def _format_duration(minutes: Optional[int]) -> str:
    if minutes is None:
        return ""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"


@router.get("/", response_model=list[LoginHistoryResponse])
def get_login_history(
    user_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(LoginHistory).join(User, LoginHistory.user_id == User.id)

    if user_id:
        query = query.filter(LoginHistory.user_id == user_id)
    if from_date:
        try:
            dt = datetime.strptime(from_date, "%Y-%m-%d")
            query = query.filter(LoginHistory.login_time >= dt)
        except ValueError:
            pass
    if to_date:
        try:
            dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(LoginHistory.login_time < dt)
        except ValueError:
            pass

    records = query.order_by(LoginHistory.login_time.desc()).limit(500).all()

    result = []
    for r in records:
        user = r.user_rel
        result.append(LoginHistoryResponse(
            id=r.id,
            user_id=r.user_id,
            employee_id=user.employee_id if user else None,
            name=user.name if user else "Unknown",
            email=user.email if user else "",
            login_time=r.login_time,
            logout_time=r.logout_time,
            duration=_format_duration(r.duration_minutes),
            role=r.role,
            module=r.module,
            location=r.location,
            login_source=r.login_source,
            remarks=r.remarks,
        ))
    return result


@router.get("/employees")
def get_employees_for_dropdown(db: Session = Depends(get_db)):
    """Return list of employees for the dropdown."""
    users = db.query(User).filter(User.status == "Active").order_by(User.employee_id, User.name).all()
    return [
        {
            "id": u.id,
            "employee_id": u.employee_id or u.code,
            "name": u.name,
            "label": f"{u.employee_id or u.code}/{u.name}",
        }
        for u in users
    ]
