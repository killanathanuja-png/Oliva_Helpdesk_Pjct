"""Property Document (lease agreement) management for Admin Department."""
import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import PropertyDocument

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "uploads",
    "documents",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_UPLOAD_BYTES = 1024 * 1024 * 1024  # 1 GB


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None


def _to_response(d: PropertyDocument) -> dict:
    return {
        "id": d.id,
        "city": d.city,
        "location": d.location,
        "area_sqft": d.area_sqft,
        "agreement_date": d.agreement_date.strftime("%Y-%m-%d") if d.agreement_date else None,
        "lease_comm_date": d.lease_comm_date.strftime("%Y-%m-%d") if d.lease_comm_date else None,
        "lease_end_date": d.lease_end_date.strftime("%Y-%m-%d") if d.lease_end_date else None,
        "rent_escalation_date": d.rent_escalation_date.strftime("%Y-%m-%d") if d.rent_escalation_date else None,
        "escalation_percentage": d.escalation_percentage,
        "per_month_rent": d.per_month_rent,
        "owner_name": d.owner_name,
        "owner_contact": d.owner_contact,
        "owner_email": d.owner_email,
        "registered": bool(d.registered),
        "file_name": d.file_name,
        "has_file": bool(d.file_name or d.file_path),
        "uploaded_by": d.uploaded_by,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    rows = db.query(PropertyDocument).order_by(PropertyDocument.city, PropertyDocument.location).all()
    return [_to_response(d) for d in rows]


@router.post("/")
async def create_document(
    city: str = Form(...),
    location: str = Form(...),
    area_sqft: Optional[float] = Form(None),
    agreement_date: Optional[str] = Form(None),
    lease_comm_date: Optional[str] = Form(None),
    lease_end_date: Optional[str] = Form(None),
    rent_escalation_date: Optional[str] = Form(None),
    escalation_percentage: Optional[float] = Form(None),
    per_month_rent: Optional[float] = Form(None),
    owner_name: Optional[str] = Form(None),
    owner_contact: Optional[str] = Form(None),
    owner_email: Optional[str] = Form(None),
    registered: bool = Form(False),
    uploaded_by: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    file_name = None
    file_path = None
    if file is not None:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                413,
                f"File too large. Maximum size is 1 GB (you uploaded {round(len(content) / (1024 * 1024), 2)} MB).",
            )
        ext = os.path.splitext(file.filename or "")[1] or ".pdf"
        safe_name = f"{city}_{location}_{uuid.uuid4().hex[:8]}{ext}".replace("/", "_")
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(content)
        file_name = file.filename

    doc = PropertyDocument(
        city=city.strip(),
        location=location.strip(),
        area_sqft=area_sqft,
        agreement_date=_parse_date(agreement_date),
        lease_comm_date=_parse_date(lease_comm_date),
        lease_end_date=_parse_date(lease_end_date),
        rent_escalation_date=_parse_date(rent_escalation_date),
        escalation_percentage=escalation_percentage,
        per_month_rent=per_month_rent,
        owner_name=(owner_name or "").strip() or None,
        owner_contact=(owner_contact or "").strip() or None,
        owner_email=(owner_email or "").strip() or None,
        registered=bool(registered),
        file_name=file_name,
        file_path=file_path,
        uploaded_by=uploaded_by,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _to_response(doc)


@router.put("/{doc_id}/")
async def update_document(
    doc_id: int,
    city: str = Form(...),
    location: str = Form(...),
    area_sqft: Optional[float] = Form(None),
    agreement_date: Optional[str] = Form(None),
    lease_comm_date: Optional[str] = Form(None),
    lease_end_date: Optional[str] = Form(None),
    rent_escalation_date: Optional[str] = Form(None),
    escalation_percentage: Optional[float] = Form(None),
    per_month_rent: Optional[float] = Form(None),
    owner_name: Optional[str] = Form(None),
    owner_contact: Optional[str] = Form(None),
    owner_email: Optional[str] = Form(None),
    registered: bool = Form(False),
    uploaded_by: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    doc.city = city.strip()
    doc.location = location.strip()
    doc.area_sqft = area_sqft
    doc.agreement_date = _parse_date(agreement_date)
    doc.lease_comm_date = _parse_date(lease_comm_date)
    doc.lease_end_date = _parse_date(lease_end_date)
    doc.rent_escalation_date = _parse_date(rent_escalation_date)
    doc.escalation_percentage = escalation_percentage
    doc.per_month_rent = per_month_rent
    doc.owner_name = (owner_name or "").strip() or None
    doc.owner_contact = (owner_contact or "").strip() or None
    doc.owner_email = (owner_email or "").strip() or None
    doc.registered = bool(registered)
    if uploaded_by:
        doc.uploaded_by = uploaded_by

    if file is not None:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                413,
                f"File too large. Maximum size is 1 GB (you uploaded {round(len(content) / (1024 * 1024), 2)} MB).",
            )
        # Delete old file if present
        if doc.file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except OSError:
                pass
        ext = os.path.splitext(file.filename or "")[1] or ".pdf"
        safe_name = f"{doc.city}_{doc.location}_{uuid.uuid4().hex[:8]}{ext}".replace("/", "_")
        doc.file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(doc.file_path, "wb") as f:
            f.write(content)
        doc.file_name = file.filename

    db.commit()
    db.refresh(doc)
    return _to_response(doc)


@router.delete("/{doc_id}/")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}


@router.get("/view/{doc_id}/")
def view_document(doc_id: int, db: Session = Depends(get_db)):
    import mimetypes
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == doc_id).first()
    if not doc or not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(404, "Document file not found")
    mime_type = mimetypes.guess_type(doc.file_path)[0] or "application/pdf"
    return FileResponse(
        doc.file_path,
        media_type=mime_type,
        headers={"Content-Disposition": f'inline; filename="{doc.file_name or doc.location}"'},
    )


@router.get("/download/{doc_id}/")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == doc_id).first()
    if not doc or not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(404, "Document file not found")
    return FileResponse(
        doc.file_path,
        filename=doc.file_name or f"{doc.location}.pdf",
        media_type="application/octet-stream",
    )
