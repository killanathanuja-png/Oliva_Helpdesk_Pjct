from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import AdminUser
from app.auth import hash_password

router = APIRouter(prefix="/api/admin-users", tags=["Admin Users"])


class AdminUserResponse(BaseModel):
    id: int
    code: str
    name: str
    email: str
    role: Optional[str] = None
    department: Optional[str] = None
    center_name: Optional[str] = None
    city: Optional[str] = None
    map_level_access: Optional[str] = None
    mobile: Optional[str] = None
    employee_type: Optional[str] = None
    status: Optional[str] = "Active"

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    role: Optional[str] = "Helpdesk Admin"
    department: Optional[str] = "Help desk"
    center_name: Optional[str] = None
    city: Optional[str] = None
    map_level_access: Optional[str] = "Can View and Edit"
    mobile: Optional[str] = None
    employee_type: Optional[str] = None


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    center_name: Optional[str] = None
    city: Optional[str] = None
    map_level_access: Optional[str] = None
    mobile: Optional[str] = None
    employee_type: Optional[str] = None
    status: Optional[str] = None


def _next_code(db: Session) -> str:
    last = db.query(AdminUser).order_by(AdminUser.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"HD{num:04d}"


@router.get("/", response_model=list[AdminUserResponse])
def list_admin_users(db: Session = Depends(get_db)):
    return db.query(AdminUser).filter(AdminUser.status == "Active").order_by(AdminUser.name).all()


@router.post("/", response_model=AdminUserResponse, status_code=201)
def create_admin_user(req: AdminUserCreate, db: Session = Depends(get_db)):
    existing = db.query(AdminUser).filter(AdminUser.email == req.email).first()
    if existing:
        raise HTTPException(400, "Email already exists")
    user = AdminUser(
        code=_next_code(db),
        name=req.name, email=req.email,
        hashed_password=hash_password(req.password) if req.password else hash_password("oliva@123"),
        role=req.role, department=req.department,
        center_name=req.center_name, city=req.city,
        map_level_access=req.map_level_access,
        mobile=req.mobile, employee_type=req.employee_type,
        status="Active",
    )
    db.add(user); db.commit(); db.refresh(user)
    return user


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_admin_user(user_id: int, req: AdminUserUpdate, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit(); db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_admin_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.status = "Inactive"
    db.commit()
    return {"message": "Deleted"}
