from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ServiceTitle, Category, Subcategory, PriorityEnum, StatusEnum
from app.schemas.schemas import ServiceTitleCreate, ServiceTitleUpdate, ServiceTitleResponse

router = APIRouter(prefix="/api/service-titles", tags=["Service Titles"])


def _next_code(db: Session) -> str:
    last = db.query(ServiceTitle).order_by(ServiceTitle.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"SRV{num:03d}"


@router.get("/", response_model=list[ServiceTitleResponse])
def list_service_titles(db: Session = Depends(get_db)):
    titles = db.query(ServiceTitle).order_by(ServiceTitle.id).all()
    return [
        ServiceTitleResponse(
            id=s.id, code=s.code, title=s.title,
            category=s.category_rel.name if s.category_rel else None,
            subcategory=s.subcategory_rel.name if s.subcategory_rel else None,
            priority=s.priority.value if s.priority else "Medium",
            sla_hours=s.sla_hours,
            status=s.status.value if s.status else "Active",
            created_at=s.created_at,
        )
        for s in titles
    ]


@router.post("/", response_model=ServiceTitleResponse, status_code=201)
def create_service_title(req: ServiceTitleCreate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.name == req.category).first() if req.category else None
    sub = db.query(Subcategory).filter(Subcategory.name == req.subcategory).first() if req.subcategory else None

    st = ServiceTitle(
        code=_next_code(db), title=req.title,
        category_id=cat.id if cat else None,
        subcategory_id=sub.id if sub else None,
        priority=PriorityEnum(req.priority) if req.priority else PriorityEnum.Medium,
        sla_hours=req.sla_hours or 24,
        status=StatusEnum.Active,
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return ServiceTitleResponse(
        id=st.id, code=st.code, title=st.title, category=req.category,
        subcategory=req.subcategory, priority=req.priority, sla_hours=st.sla_hours,
        status="Active", created_at=st.created_at,
    )


@router.put("/{st_id}", response_model=ServiceTitleResponse)
def update_service_title(st_id: int, req: ServiceTitleUpdate, db: Session = Depends(get_db)):
    st = db.query(ServiceTitle).filter(ServiceTitle.id == st_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Service title not found")
    if req.title is not None:
        st.title = req.title
    if req.category is not None:
        cat = db.query(Category).filter(Category.name == req.category).first()
        st.category_id = cat.id if cat else None
    if req.subcategory is not None:
        sub = db.query(Subcategory).filter(Subcategory.name == req.subcategory).first()
        st.subcategory_id = sub.id if sub else None
    if req.priority is not None:
        st.priority = PriorityEnum(req.priority)
    if req.sla_hours is not None:
        st.sla_hours = req.sla_hours
    if req.status is not None:
        st.status = StatusEnum(req.status)
    db.commit()
    db.refresh(st)
    return ServiceTitleResponse(
        id=st.id, code=st.code, title=st.title,
        category=st.category_rel.name if st.category_rel else None,
        subcategory=st.subcategory_rel.name if st.subcategory_rel else None,
        priority=st.priority.value if st.priority else "Medium",
        sla_hours=st.sla_hours,
        status=st.status.value if st.status else "Active",
        created_at=st.created_at,
    )


@router.patch("/{st_id}/status", response_model=ServiceTitleResponse)
def update_service_title_status(st_id: int, status: str, db: Session = Depends(get_db)):
    st = db.query(ServiceTitle).filter(ServiceTitle.id == st_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Service title not found")
    st.status = StatusEnum(status)
    db.commit()
    db.refresh(st)
    return ServiceTitleResponse(
        id=st.id, code=st.code, title=st.title,
        category=st.category_rel.name if st.category_rel else None,
        subcategory=st.subcategory_rel.name if st.subcategory_rel else None,
        priority=st.priority.value if st.priority else "Medium",
        sla_hours=st.sla_hours,
        status=st.status.value if st.status else "Active",
        created_at=st.created_at,
    )


@router.delete("/{st_id}", status_code=204)
def delete_service_title(st_id: int, db: Session = Depends(get_db)):
    st = db.query(ServiceTitle).filter(ServiceTitle.id == st_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Service title not found")
    db.delete(st)
    db.commit()
