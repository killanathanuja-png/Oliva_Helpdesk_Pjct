from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.models import Department, StatusEnum
from app.schemas.schemas import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/api/departments", tags=["Departments"])


def _next_code(db: Session) -> str:
    last = db.query(Department).order_by(Department.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"D{num:03d}"


def _active_ticket_count(db: Session, dept_name: str) -> int:
    """Count active tickets for a department using raw SQL to avoid schema mismatch issues."""
    try:
        result = db.execute(
            text("SELECT COUNT(*) FROM tickets WHERE assigned_dept = :dept AND status NOT IN ('Closed', 'Resolved')"),
            {"dept": dept_name},
        )
        return result.scalar() or 0
    except Exception:
        db.rollback()
        return 0


@router.get("/", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.id).all()
    results = []
    for d in depts:
        active = _active_ticket_count(db, d.name)
        results.append(DepartmentResponse(
            id=d.id, code=d.code, name=d.name, head=d.head,
            sla_hours=d.sla_hours, center_count=len(d.users),
            active_tickets=active, status=d.status.value if d.status else "Active",
            created_at=d.created_at,
        ))
    return results


@router.post("/", response_model=DepartmentResponse, status_code=201)
def create_department(req: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(code=_next_code(db), name=req.name, head=req.head, sla_hours=req.sla_hours)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentResponse(id=dept.id, code=dept.code, name=dept.name, head=dept.head, sla_hours=dept.sla_hours, status=dept.status.value if dept.status else "Active", created_at=dept.created_at)


@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return DepartmentResponse(id=dept.id, code=dept.code, name=dept.name, head=dept.head, sla_hours=dept.sla_hours, status=dept.status.value if dept.status else "Active", created_at=dept.created_at)


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, req: DepartmentCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.name = req.name
    dept.head = req.head
    dept.sla_hours = req.sla_hours
    db.commit()
    db.refresh(dept)
    return DepartmentResponse(id=dept.id, code=dept.code, name=dept.name, head=dept.head, sla_hours=dept.sla_hours, status=dept.status.value if dept.status else "Active", created_at=dept.created_at)


@router.patch("/{dept_id}/status")
def update_department_status(dept_id: int, status: str, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.status = StatusEnum(status)
    db.commit()
    db.refresh(dept)
    return DepartmentResponse(id=dept.id, code=dept.code, name=dept.name, head=dept.head, sla_hours=dept.sla_hours, status=dept.status.value if dept.status else "Active", created_at=dept.created_at)


@router.delete("/{dept_id}", status_code=204)
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
