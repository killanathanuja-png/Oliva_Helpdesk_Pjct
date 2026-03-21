from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Center, StatusEnum
from app.schemas.schemas import CenterCreate, CenterResponse

router = APIRouter(prefix="/api/centers", tags=["Centers"])


def _next_code(db: Session) -> str:
    last = db.query(Center).order_by(Center.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"C{num:03d}"


@router.get("/", response_model=list[CenterResponse])
def list_centers(db: Session = Depends(get_db)):
    return db.query(Center).order_by(Center.id).all()


@router.post("/", response_model=CenterResponse, status_code=201)
def create_center(req: CenterCreate, db: Session = Depends(get_db)):
    center = Center(
        code=_next_code(db), location_code=req.location_code, name=req.name, city=req.city, state=req.state,
        department=req.department, contact_person=req.contact_person,
        phone=req.phone, address=req.address, pincode=req.pincode,
        latitude=req.latitude, longitude=req.longitude, zone=req.zone,
        country=req.country,
        status=StatusEnum(req.status) if req.status else StatusEnum.Active,
    )
    db.add(center)
    db.commit()
    db.refresh(center)
    return center


@router.get("/{center_id}", response_model=CenterResponse)
def get_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return center


@router.put("/{center_id}", response_model=CenterResponse)
def update_center(center_id: int, req: CenterCreate, db: Session = Depends(get_db)):
    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    center.name = req.name
    center.location_code = req.location_code
    center.city = req.city
    center.state = req.state
    center.department = req.department
    center.contact_person = req.contact_person
    center.phone = req.phone
    center.address = req.address
    center.pincode = req.pincode
    center.latitude = req.latitude
    center.longitude = req.longitude
    center.zone = req.zone
    center.country = req.country
    center.status = StatusEnum(req.status) if req.status else center.status
    db.commit()
    db.refresh(center)
    return center


@router.patch("/{center_id}/status")
def update_center_status(center_id: int, status: str, db: Session = Depends(get_db)):
    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    center.status = StatusEnum(status)
    db.commit()
    db.refresh(center)
    return center


@router.delete("/{center_id}", status_code=204)
def delete_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    db.delete(center)
    db.commit()
