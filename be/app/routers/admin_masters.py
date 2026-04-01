from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import AdminMainCategory, AdminModule, AdminSubCategory, AdminChildCategory, StatusEnum

router = APIRouter(prefix="/api/admin-masters", tags=["Admin Masters"])


# Response schemas
class AdminChildCategoryResponse(BaseModel):
    id: int
    name: str
    sub_category_id: int
    status: Optional[str] = "Active"
    class Config:
        from_attributes = True


class AdminSubCategoryResponse(BaseModel):
    id: int
    name: str
    module_id: int
    status: Optional[str] = "Active"
    child_categories: list[AdminChildCategoryResponse] = []
    class Config:
        from_attributes = True


class AdminModuleResponse(BaseModel):
    id: int
    name: str
    main_category_id: int
    status: Optional[str] = "Active"
    sub_categories: list[AdminSubCategoryResponse] = []
    class Config:
        from_attributes = True


class AdminMainCategoryResponse(BaseModel):
    id: int
    name: str
    status: Optional[str] = "Active"
    modules: list[AdminModuleResponse] = []
    class Config:
        from_attributes = True


# Create schemas
class CreateMainCategory(BaseModel):
    name: str


class CreateModule(BaseModel):
    name: str
    main_category_id: int


class CreateSubCategory(BaseModel):
    name: str
    module_id: int


class CreateChildCategory(BaseModel):
    name: str
    sub_category_id: int


# Helper
def _mc_response(mc):
    return AdminMainCategoryResponse(
        id=mc.id, name=mc.name,
        status=mc.status.value if mc.status else "Active",
        modules=[
            AdminModuleResponse(
                id=m.id, name=m.name, main_category_id=m.main_category_id,
                status=m.status.value if m.status else "Active",
                sub_categories=[
                    AdminSubCategoryResponse(
                        id=s.id, name=s.name, module_id=s.module_id,
                        status=s.status.value if s.status else "Active",
                        child_categories=[
                            AdminChildCategoryResponse(
                                id=c.id, name=c.name, sub_category_id=c.sub_category_id,
                                status=c.status.value if c.status else "Active"
                            ) for c in (s.child_categories or []) if c.status == StatusEnum.Active
                        ]
                    ) for s in (m.sub_categories or []) if s.status == StatusEnum.Active
                ]
            ) for m in (mc.modules or []) if m.status == StatusEnum.Active
        ]
    )


# --- Main Categories ---
@router.get("/main-categories", response_model=list[AdminMainCategoryResponse])
def list_main_categories(db: Session = Depends(get_db)):
    items = db.query(AdminMainCategory).options(
        joinedload(AdminMainCategory.modules)
        .joinedload(AdminModule.sub_categories)
        .joinedload(AdminSubCategory.child_categories)
    ).filter(AdminMainCategory.status == StatusEnum.Active).order_by(AdminMainCategory.name).all()
    return [_mc_response(mc) for mc in items]


@router.post("/main-categories", response_model=AdminMainCategoryResponse, status_code=201)
def create_main_category(req: CreateMainCategory, db: Session = Depends(get_db)):
    mc = AdminMainCategory(name=req.name)
    db.add(mc); db.commit(); db.refresh(mc)
    return _mc_response(mc)


@router.put("/main-categories/{id}", response_model=AdminMainCategoryResponse)
def update_main_category(id: int, req: CreateMainCategory, db: Session = Depends(get_db)):
    mc = db.query(AdminMainCategory).filter(AdminMainCategory.id == id).first()
    if not mc: raise HTTPException(404, "Not found")
    mc.name = req.name
    db.commit(); db.refresh(mc)
    return _mc_response(mc)


@router.delete("/main-categories/{id}")
def delete_main_category(id: int, db: Session = Depends(get_db)):
    mc = db.query(AdminMainCategory).filter(AdminMainCategory.id == id).first()
    if not mc: raise HTTPException(404, "Not found")
    mc.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Modules ---
@router.get("/modules", response_model=list[AdminModuleResponse])
def list_modules(db: Session = Depends(get_db)):
    return db.query(AdminModule).options(
        joinedload(AdminModule.sub_categories).joinedload(AdminSubCategory.child_categories)
    ).filter(AdminModule.status == StatusEnum.Active).order_by(AdminModule.name).all()


@router.post("/modules", response_model=AdminModuleResponse, status_code=201)
def create_module(req: CreateModule, db: Session = Depends(get_db)):
    m = AdminModule(name=req.name, main_category_id=req.main_category_id)
    db.add(m); db.commit(); db.refresh(m)
    return AdminModuleResponse(id=m.id, name=m.name, main_category_id=m.main_category_id, status="Active")


@router.put("/modules/{id}")
def update_module(id: int, req: CreateModule, db: Session = Depends(get_db)):
    m = db.query(AdminModule).filter(AdminModule.id == id).first()
    if not m: raise HTTPException(404, "Not found")
    m.name = req.name
    m.main_category_id = req.main_category_id
    db.commit(); db.refresh(m)
    return {"id": m.id, "name": m.name, "main_category_id": m.main_category_id, "status": m.status.value}


@router.delete("/modules/{id}")
def delete_module(id: int, db: Session = Depends(get_db)):
    m = db.query(AdminModule).filter(AdminModule.id == id).first()
    if not m: raise HTTPException(404, "Not found")
    m.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Sub Categories ---
@router.post("/sub-categories", status_code=201)
def create_sub_category(req: CreateSubCategory, db: Session = Depends(get_db)):
    s = AdminSubCategory(name=req.name, module_id=req.module_id)
    db.add(s); db.commit(); db.refresh(s)
    return {"id": s.id, "name": s.name, "module_id": s.module_id, "status": "Active"}


@router.put("/sub-categories/{id}")
def update_sub_category(id: int, req: CreateSubCategory, db: Session = Depends(get_db)):
    s = db.query(AdminSubCategory).filter(AdminSubCategory.id == id).first()
    if not s: raise HTTPException(404, "Not found")
    s.name = req.name; s.module_id = req.module_id
    db.commit(); db.refresh(s)
    return {"id": s.id, "name": s.name, "module_id": s.module_id, "status": s.status.value}


@router.delete("/sub-categories/{id}")
def delete_sub_category(id: int, db: Session = Depends(get_db)):
    s = db.query(AdminSubCategory).filter(AdminSubCategory.id == id).first()
    if not s: raise HTTPException(404, "Not found")
    s.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Child Categories ---
@router.post("/child-categories", status_code=201)
def create_child_category(req: CreateChildCategory, db: Session = Depends(get_db)):
    c = AdminChildCategory(name=req.name, sub_category_id=req.sub_category_id)
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name, "sub_category_id": c.sub_category_id, "status": "Active"}


@router.put("/child-categories/{id}")
def update_child_category(id: int, req: CreateChildCategory, db: Session = Depends(get_db)):
    c = db.query(AdminChildCategory).filter(AdminChildCategory.id == id).first()
    if not c: raise HTTPException(404, "Not found")
    c.name = req.name; c.sub_category_id = req.sub_category_id
    db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name, "sub_category_id": c.sub_category_id, "status": c.status.value}


@router.delete("/child-categories/{id}")
def delete_child_category(id: int, db: Session = Depends(get_db)):
    c = db.query(AdminChildCategory).filter(AdminChildCategory.id == id).first()
    if not c: raise HTTPException(404, "Not found")
    c.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Location Assignments & Escalation Matrix ---

@router.get("/location-assignments")
def list_location_assignments(db: Session = Depends(get_db)):
    from sqlalchemy import text
    result = db.execute(text("SELECT * FROM admin_location_assignment ORDER BY location"))
    return [dict(row._mapping) for row in result]


@router.get("/escalation-matrix")
def list_escalation_matrix(db: Session = Depends(get_db)):
    from sqlalchemy import text
    result = db.execute(text("SELECT * FROM admin_escalation_matrix ORDER BY location"))
    return [dict(row._mapping) for row in result]
