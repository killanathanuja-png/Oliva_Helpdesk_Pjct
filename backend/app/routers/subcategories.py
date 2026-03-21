from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Subcategory, Category, StatusEnum
from app.schemas.schemas import SubcategoryCreate, SubcategoryUpdate, SubcategoryResponse

router = APIRouter(prefix="/api/subcategories", tags=["Subcategories"])


def _next_code(db: Session) -> str:
    last = db.query(Subcategory).order_by(Subcategory.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"SUB{num:03d}"


@router.get("/", response_model=list[SubcategoryResponse])
def list_subcategories(db: Session = Depends(get_db)):
    subs = db.query(Subcategory).order_by(Subcategory.id).all()
    return [
        SubcategoryResponse(
            id=s.id, code=s.code, name=s.name,
            category=s.category_rel.name if s.category_rel else None,
            module=s.category_rel.module if s.category_rel else None,
            service_title_count=len(s.service_titles),
            status=s.status.value if s.status else "Active",
            created_at=s.created_at,
        )
        for s in subs
    ]


@router.post("/", response_model=SubcategoryResponse, status_code=201)
def create_subcategory(req: SubcategoryCreate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.name == req.category).first() if req.category else None
    if req.category and not cat:
        raise HTTPException(status_code=400, detail="Category not found")
    sub = Subcategory(
        code=_next_code(db), name=req.name,
        category_id=cat.id if cat else None, status=StatusEnum.Active,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubcategoryResponse(
        id=sub.id, code=sub.code, name=sub.name, category=req.category,
        module=cat.module if cat else None,
        service_title_count=0, status="Active", created_at=sub.created_at,
    )


@router.put("/{sub_id}", response_model=SubcategoryResponse)
def update_subcategory(sub_id: int, req: SubcategoryUpdate, db: Session = Depends(get_db)):
    sub = db.query(Subcategory).filter(Subcategory.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    if req.name is not None:
        sub.name = req.name
    if req.category is not None:
        cat = db.query(Category).filter(Category.name == req.category).first()
        sub.category_id = cat.id if cat else None
    if req.status is not None:
        sub.status = StatusEnum(req.status)
    db.commit()
    db.refresh(sub)
    return SubcategoryResponse(
        id=sub.id, code=sub.code, name=sub.name,
        category=sub.category_rel.name if sub.category_rel else None,
        service_title_count=len(sub.service_titles),
        status=sub.status.value if sub.status else "Active",
        created_at=sub.created_at,
    )


@router.patch("/{sub_id}/status", response_model=SubcategoryResponse)
def update_subcategory_status(sub_id: int, status: str, db: Session = Depends(get_db)):
    sub = db.query(Subcategory).filter(Subcategory.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    sub.status = StatusEnum(status)
    db.commit()
    db.refresh(sub)
    return SubcategoryResponse(
        id=sub.id, code=sub.code, name=sub.name,
        category=sub.category_rel.name if sub.category_rel else None,
        service_title_count=len(sub.service_titles),
        status=sub.status.value if sub.status else "Active",
        created_at=sub.created_at,
    )


@router.delete("/{sub_id}", status_code=204)
def delete_subcategory(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subcategory).filter(Subcategory.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    db.delete(sub)
    db.commit()
