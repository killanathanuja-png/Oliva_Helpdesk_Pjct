from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models.models import User, Department, Center, LoginHistory
from app.schemas.schemas import LoginRequest, Token, UserResponse
from app.auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login/", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.username).first()
    if not user:
        user = db.query(User).filter(User.name == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user.last_login = datetime.now(timezone.utc)

    # Record login history - one entry per role
    roles = [r.strip() for r in (user.role or "Employee").split(",") if r.strip()]
    location = user.center_rel.name if user.center_rel else ""
    module_map = {
        "Global Admin": "General", "Super Admin": "General", "Super User": "General",
        "Help Desk Admin": "Helpdesk", "Helpdesk In-charge": "Helpdesk",
        "L1 Manager": "Helpdesk", "L2 Manager": "Helpdesk",
    }
    for role in roles:
        module = module_map.get(role, "General")
        login_entry = LoginHistory(
            user_id=user.id,
            login_time=datetime.now(timezone.utc),
            role=role,
            module=module,
            location=location,
            login_source="Web browser",
        )
        db.add(login_entry)

    db.commit()

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me/", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        code=current_user.code,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role or None,
        department=current_user.department_rel.name if current_user.department_rel else None,
        center=current_user.center_rel.name if current_user.center_rel else None,
        avatar=current_user.avatar,
        status=current_user.status.value if current_user.status else None,
        last_login=current_user.last_login,
        created_at=current_user.created_at,
    )


@router.post("/logout/")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Record logout time for the user's active login sessions."""
    now = datetime.now(timezone.utc)
    active_sessions = db.query(LoginHistory).filter(
        LoginHistory.user_id == current_user.id,
        LoginHistory.logout_time.is_(None),
    ).all()
    for session in active_sessions:
        session.logout_time = now
        if session.login_time:
            delta = now - session.login_time.replace(tzinfo=timezone.utc) if session.login_time.tzinfo is None else now - session.login_time
            session.duration_minutes = max(1, int(delta.total_seconds() / 60))
    db.commit()
    return {"message": "Logged out successfully"}


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


@router.put("/me/", response_model=UserResponse)
def update_profile(req: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.name is not None:
        current_user.name = req.name
        parts = req.name.strip().split()
        current_user.avatar = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else req.name[:2].upper()
    if req.email is not None:
        existing = db.query(User).filter(User.email == req.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = req.email
    db.commit()
    db.refresh(current_user)
    return UserResponse(
        id=current_user.id, code=current_user.code, name=current_user.name, email=current_user.email,
        role=current_user.role or None,
        department=current_user.department_rel.name if current_user.department_rel else None,
        center=current_user.center_rel.name if current_user.center_rel else None,
        avatar=current_user.avatar, status=current_user.status.value if current_user.status else None,
        last_login=current_user.last_login, created_at=current_user.created_at,
    )


@router.patch("/change-password/")
def change_password(req: ChangePassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
