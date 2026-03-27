from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import AOMCenterMapping, User, StatusEnum
from app.auth import get_current_user

router = APIRouter(prefix="/api/aom-mappings", tags=["AOM Mappings"])


class AOMMapping(BaseModel):
    id: int
    aom_name: str
    aom_email: Optional[str] = None
    cm_name: str
    cm_email: Optional[str] = None
    center_name: str
    location: Optional[str] = None

    class Config:
        from_attributes = True


class AOMInfoResponse(BaseModel):
    aom_name: str
    aom_email: Optional[str] = None
    center_name: str
    location: Optional[str] = None


@router.get("/", response_model=list[AOMMapping])
def list_mappings(db: Session = Depends(get_db)):
    """List all AOM-CM-Center mappings."""
    mappings = db.query(AOMCenterMapping).filter(
        AOMCenterMapping.status == StatusEnum.Active
    ).all()
    return mappings


@router.get("/my-center")
def get_my_center(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the center mapped to the currently logged-in CM."""
    mapping = db.query(AOMCenterMapping).filter(
        AOMCenterMapping.cm_email == current_user.email,
        AOMCenterMapping.status == StatusEnum.Active,
    ).first()
    if not mapping:
        # Fallback: try matching by name
        mapping = db.query(AOMCenterMapping).filter(
            AOMCenterMapping.cm_name == current_user.name,
            AOMCenterMapping.status == StatusEnum.Active,
        ).first()
    if not mapping:
        return {"center_name": None, "location": None, "aom_name": None, "aom_email": None}
    return {
        "center_name": mapping.center_name,
        "location": mapping.location,
        "aom_name": mapping.aom_name,
        "aom_email": mapping.aom_email,
    }


@router.get("/by-cm-email/{cm_email}")
def get_aom_for_cm(cm_email: str, db: Session = Depends(get_db)):
    """Get the AOM details for a given CM email."""
    mapping = db.query(AOMCenterMapping).filter(
        AOMCenterMapping.cm_email == cm_email,
        AOMCenterMapping.status == StatusEnum.Active,
    ).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="No AOM mapping found for this CM")
    return AOMInfoResponse(
        aom_name=mapping.aom_name,
        aom_email=mapping.aom_email,
        center_name=mapping.center_name,
        location=mapping.location,
    )


@router.get("/by-aom/{aom_name}")
def get_centers_for_aom(aom_name: str, db: Session = Depends(get_db)):
    """Get all centers managed by an AOM."""
    mappings = db.query(AOMCenterMapping).filter(
        AOMCenterMapping.aom_name == aom_name,
        AOMCenterMapping.status == StatusEnum.Active,
    ).all()
    return [
        {
            "cm_name": m.cm_name,
            "cm_email": m.cm_email,
            "center_name": m.center_name,
            "location": m.location,
        }
        for m in mappings
    ]
