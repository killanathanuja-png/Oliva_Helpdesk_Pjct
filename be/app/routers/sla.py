from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import SLAConfig, Department, PriorityEnum
from app.schemas.schemas import SLAConfigCreate, SLAConfigResponse

router = APIRouter(prefix="/api/sla", tags=["SLA Config"])


def _next_code(db: Session) -> str:
    last = db.query(SLAConfig).order_by(SLAConfig.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"SLA{num:03d}"


@router.get("/", response_model=list[SLAConfigResponse])
def list_sla_configs(db: Session = Depends(get_db)):
    configs = db.query(SLAConfig).order_by(SLAConfig.id).all()
    return [
        SLAConfigResponse(
            id=s.id, code=s.code,
            department=s.department_rel.name if s.department_rel else None,
            priority=s.priority.value if s.priority else None,
            response_time_hrs=s.response_time_hrs,
            resolution_time_hrs=s.resolution_time_hrs,
            escalation_level1_hrs=s.escalation_level1_hrs,
            escalation_level2_hrs=s.escalation_level2_hrs,
            active=s.active, created_at=s.created_at,
        )
        for s in configs
    ]


@router.post("/", response_model=SLAConfigResponse, status_code=201)
def create_sla_config(req: SLAConfigCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.name == req.department).first() if req.department else None
    sla = SLAConfig(
        code=_next_code(db),
        department_id=dept.id if dept else None,
        priority=PriorityEnum(req.priority),
        response_time_hrs=req.response_time_hrs,
        resolution_time_hrs=req.resolution_time_hrs,
        escalation_level1_hrs=req.escalation_level1_hrs,
        escalation_level2_hrs=req.escalation_level2_hrs,
        active=req.active if req.active is not None else True,
    )
    db.add(sla)
    db.commit()
    db.refresh(sla)
    return SLAConfigResponse(
        id=sla.id, code=sla.code, department=req.department,
        priority=req.priority, response_time_hrs=sla.response_time_hrs,
        resolution_time_hrs=sla.resolution_time_hrs,
        escalation_level1_hrs=sla.escalation_level1_hrs,
        escalation_level2_hrs=sla.escalation_level2_hrs,
        active=sla.active, created_at=sla.created_at,
    )


@router.delete("/{sla_id}", status_code=204)
def delete_sla_config(sla_id: int, db: Session = Depends(get_db)):
    sla = db.query(SLAConfig).filter(SLAConfig.id == sla_id).first()
    if not sla:
        raise HTTPException(status_code=404, detail="SLA config not found")
    db.delete(sla)
    db.commit()
