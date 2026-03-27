from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Designation, StatusEnum
from app.schemas.schemas import DesignationCreate, DesignationResponse

router = APIRouter(prefix="/api/designations", tags=["Designations"])


def _next_code(db: Session) -> str:
    last = db.query(Designation).order_by(Designation.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f"DG{num:03d}"


@router.get("/", response_model=list[DesignationResponse])
def list_designations(db: Session = Depends(get_db)):
    return db.query(Designation).order_by(Designation.id).all()


@router.post("/", response_model=DesignationResponse, status_code=201)
def create_designation(req: DesignationCreate, db: Session = Depends(get_db)):
    existing = db.query(Designation).filter(Designation.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Designation already exists")
    d = Designation(code=_next_code(db), name=req.name)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/{desig_id}", response_model=DesignationResponse)
def update_designation(desig_id: int, req: DesignationCreate, db: Session = Depends(get_db)):
    d = db.query(Designation).filter(Designation.id == desig_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")
    d.name = req.name
    db.commit()
    db.refresh(d)
    return d


@router.patch("/{desig_id}/status")
def update_designation_status(desig_id: int, status: str, db: Session = Depends(get_db)):
    d = db.query(Designation).filter(Designation.id == desig_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")
    d.status = StatusEnum(status)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{desig_id}", status_code=204)
def delete_designation(desig_id: int, db: Session = Depends(get_db)):
    d = db.query(Designation).filter(Designation.id == desig_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")
    db.delete(d)
    db.commit()
