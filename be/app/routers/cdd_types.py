from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import CDDType, CDDCategory, StatusEnum

router = APIRouter(prefix="/api/cdd-types", tags=["CDD Types"])


class CDDCategoryResponse(BaseModel):
    id: int
    name: str
    type_id: int
    status: Optional[str] = "Active"

    class Config:
        from_attributes = True


class CDDTypeResponse(BaseModel):
    id: int
    name: str
    status: Optional[str] = "Active"
    categories: list[CDDCategoryResponse] = []

    class Config:
        from_attributes = True


class CDDTypeCreate(BaseModel):
    name: str


class CDDCategoryCreate(BaseModel):
    name: str
    type_id: int


def _type_to_response(t: CDDType) -> CDDTypeResponse:
    return CDDTypeResponse(
        id=t.id, name=t.name,
        status=t.status.value if t.status else "Active",
        categories=[
            CDDCategoryResponse(
                id=c.id, name=c.name, type_id=c.type_id,
                status=c.status.value if c.status else "Active"
            )
            for c in (t.categories or []) if c.status == StatusEnum.Active
        ]
    )


@router.get("/", response_model=list[CDDTypeResponse])
def list_cdd_types(db: Session = Depends(get_db)):
    types = db.query(CDDType).options(joinedload(CDDType.categories)).filter(
        CDDType.status == StatusEnum.Active
    ).order_by(CDDType.id).all()
    return [_type_to_response(t) for t in types]


@router.post("/", response_model=CDDTypeResponse, status_code=201)
def create_cdd_type(req: CDDTypeCreate, db: Session = Depends(get_db)):
    t = CDDType(name=req.name)
    db.add(t)
    db.commit()
    db.refresh(t)
    return _type_to_response(t)


@router.post("/categories", response_model=CDDCategoryResponse, status_code=201)
def create_cdd_category(req: CDDCategoryCreate, db: Session = Depends(get_db)):
    t = db.query(CDDType).filter(CDDType.id == req.type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="CDD Type not found")
    c = CDDCategory(name=req.name, type_id=req.type_id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return CDDCategoryResponse(id=c.id, name=c.name, type_id=c.type_id, status=c.status.value if c.status else "Active")


@router.delete("/{type_id}")
def delete_cdd_type(type_id: int, db: Session = Depends(get_db)):
    t = db.query(CDDType).filter(CDDType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="CDD Type not found")
    t.status = StatusEnum.Inactive
    db.commit()
    return {"message": "Deleted"}


@router.delete("/categories/{cat_id}")
def delete_cdd_category(cat_id: int, db: Session = Depends(get_db)):
    c = db.query(CDDCategory).filter(CDDCategory.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="CDD Category not found")
    c.status = StatusEnum.Inactive
    db.commit()
    return {"message": "Deleted"}
