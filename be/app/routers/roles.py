import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from sqlalchemy import text
from app.models.models import Role, User, StatusEnum
from app.schemas.schemas import RoleCreate, RoleUpdate, RoleResponse

router = APIRouter(prefix="/api/roles", tags=["Roles"])


def _next_code(db: Session) -> str:
    last = db.query(Role).order_by(Role.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"R{num:03d}"


def _count_users_by_role_name(db: Session, role_name: str) -> int:
    """Count users with a given role using raw SQL to avoid enum serialization issues.
    Checks both the enum value ('Super Admin') and member name ('SuperAdmin') forms."""
    try:
        # Also match the no-space form (e.g. 'Super Admin' -> 'SuperAdmin', 'Zenoti Team' -> 'ZenotiTeam')
        alt_name = role_name.replace(" ", "")
        result = db.execute(
            text("SELECT COUNT(*) FROM users WHERE role = :role_val OR role = :alt_val"),
            {"role_val": role_name, "alt_val": alt_name},
        )
        return result.scalar() or 0
    except Exception:
        return 0


@router.get("/", response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).order_by(Role.id).all()
    results = []
    for r in roles:
        user_count = _count_users_by_role_name(db, r.name)
        perms = json.loads(r.permissions) if r.permissions else []
        results.append(RoleResponse(
            id=r.id, code=r.code, name=r.name, description=r.description,
            permissions=perms, user_count=user_count,
            status=r.status.value if r.status else "Active",
            created_at=r.created_at,
        ))
    return results


@router.post("/", response_model=RoleResponse, status_code=201)
def create_role(req: RoleCreate, db: Session = Depends(get_db)):
    role = Role(
        code=_next_code(db), name=req.name, description=req.description,
        permissions=json.dumps(req.permissions or []),
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return RoleResponse(id=role.id, code=role.code, name=role.name, description=role.description, permissions=req.permissions or [], status=role.status.value if role.status else "Active", created_at=role.created_at)


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, req: RoleUpdate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if req.name is not None:
        role.name = req.name
    if req.description is not None:
        role.description = req.description
    if req.permissions is not None:
        role.permissions = json.dumps(req.permissions)
    db.commit()
    db.refresh(role)
    perms = json.loads(role.permissions) if role.permissions else []
    user_count = _count_users_by_role_name(db, role.name)
    return RoleResponse(
        id=role.id, code=role.code, name=role.name, description=role.description,
        permissions=perms, user_count=user_count,
        status=role.status.value if role.status else "Active",
        created_at=role.created_at,
    )


@router.patch("/{role_id}/status")
def update_role_status(role_id: int, status: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role.status = StatusEnum(status)
    db.commit()
    db.refresh(role)
    perms = json.loads(role.permissions) if role.permissions else []
    user_count = _count_users_by_role_name(db, role.name)
    return RoleResponse(
        id=role.id, code=role.code, name=role.name, description=role.description,
        permissions=perms, user_count=user_count,
        status=role.status.value if role.status else "Active",
        created_at=role.created_at,
    )


@router.delete("/{role_id}", status_code=204)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
