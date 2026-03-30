from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Category, Department, StatusEnum
from app.schemas.schemas import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])


def _next_code(db: Session) -> str:
    last = db.query(Category).order_by(Category.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"CAT{num:03d}"


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.id).all()
    return [
        CategoryResponse(
            id=c.id, code=c.code, name=c.name, module=c.module, description=c.description,
            department=c.department_rel.name if c.department_rel else None,
            subcategory_count=len(c.subcategories),
            status=c.status.value if c.status else "Active",
            created_at=c.created_at,
        )
        for c in cats
    ]


@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(req: CategoryCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.name == req.department).first() if req.department else None
    cat = Category(
        code=_next_code(db), name=req.name, module=req.module, description=req.description,
        department_id=dept.id if dept else None, status=StatusEnum.Active,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryResponse(
        id=cat.id, code=cat.code, name=cat.name, module=cat.module, description=cat.description,
        department=req.department, subcategory_count=0, status="Active", created_at=cat.created_at,
    )


@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: int, req: CategoryUpdate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if req.name is not None:
        cat.name = req.name
    if req.module is not None:
        cat.module = req.module
    if req.description is not None:
        cat.description = req.description
    if req.department is not None:
        dept = db.query(Department).filter(Department.name == req.department).first()
        cat.department_id = dept.id if dept else None
    if req.status is not None:
        cat.status = StatusEnum(req.status)
    db.commit()
    db.refresh(cat)
    return CategoryResponse(
        id=cat.id, code=cat.code, name=cat.name, description=cat.description,
        department=cat.department_rel.name if cat.department_rel else None,
        subcategory_count=len(cat.subcategories),
        status=cat.status.value if cat.status else "Active",
        created_at=cat.created_at,
    )


@router.patch("/{cat_id}/status", response_model=CategoryResponse)
def update_category_status(cat_id: int, status: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.status = StatusEnum(status)
    db.commit()
    db.refresh(cat)
    return CategoryResponse(
        id=cat.id, code=cat.code, name=cat.name, description=cat.description,
        department=cat.department_rel.name if cat.department_rel else None,
        subcategory_count=len(cat.subcategories),
        status=cat.status.value if cat.status else "Active",
        created_at=cat.created_at,
    )


@router.delete("/{cat_id}", status_code=204)
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
