"""Certificate management API for clinic certificates."""
import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Certificate, Center, StatusEnum

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "certificates")
os.makedirs(UPLOAD_DIR, exist_ok=True)

CERT_TYPES = ["Trade", "Labour", "Medical License", "PCB", "PPL", "GST"]


@router.get("/center/{center_id}")
def get_certificates(center_id: int, db: Session = Depends(get_db)):
    """Get all certificates for a center."""
    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(404, "Center not found")

    certs = db.query(Certificate).filter(Certificate.center_id == center_id).all()
    existing = {c.cert_type: {
        "id": c.id,
        "cert_type": c.cert_type,
        "file_name": c.file_name,
        "start_date": c.start_date.strftime("%Y-%m-%d") if c.start_date else None,
        "expiry_date": c.expiry_date.strftime("%Y-%m-%d") if c.expiry_date else None,
        "status": c.status,
        "uploaded_by": c.uploaded_by,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "has_file": bool(c.file_path and os.path.exists(c.file_path)),
    } for c in certs}

    # Return all cert types, with data if uploaded
    result = []
    for ct in CERT_TYPES:
        if ct in existing:
            result.append(existing[ct])
        else:
            result.append({"id": None, "cert_type": ct, "file_name": None, "start_date": None, "expiry_date": None,
                           "status": "Not Uploaded", "uploaded_by": None, "created_at": None,
                           "updated_at": None, "has_file": False})

    return {"center_id": center_id, "center_name": center.name, "city": center.city, "certificates": result}


@router.post("/upload")
async def upload_certificate(
    center_id: int = Form(...),
    cert_type: str = Form(...),
    start_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    uploaded_by: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload or replace a certificate file."""
    if cert_type not in CERT_TYPES:
        raise HTTPException(400, f"Invalid cert_type. Must be one of: {CERT_TYPES}")

    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(404, "Center not found")

    # Save file
    ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
    safe_name = f"{center.name}_{cert_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse dates
    s_date = None
    if start_date:
        try: s_date = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError: pass
    exp_date = None
    if expiry_date:
        try: exp_date = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError: pass

    # Check if cert already exists for this center+type
    existing = db.query(Certificate).filter(
        Certificate.center_id == center_id, Certificate.cert_type == cert_type
    ).first()

    if existing:
        # Delete old file
        if existing.file_path and os.path.exists(existing.file_path):
            os.remove(existing.file_path)
        existing.file_name = file.filename
        existing.file_path = file_path
        existing.start_date = s_date
        existing.expiry_date = exp_date
        existing.uploaded_by = uploaded_by
        existing.status = "Active"
        db.commit()
        return {"message": f"{cert_type} certificate updated", "id": existing.id}
    else:
        cert = Certificate(
            center_id=center_id, cert_type=cert_type,
            file_name=file.filename, file_path=file_path,
            start_date=s_date, expiry_date=exp_date, uploaded_by=uploaded_by, status="Active",
        )
        db.add(cert)
        db.commit()
        db.refresh(cert)
        return {"message": f"{cert_type} certificate uploaded", "id": cert.id}


@router.get("/view/{cert_id}")
def view_certificate(cert_id: int, db: Session = Depends(get_db)):
    """View a certificate file inline in browser."""
    import mimetypes
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert or not cert.file_path or not os.path.exists(cert.file_path):
        raise HTTPException(404, "Certificate file not found")
    mime_type = mimetypes.guess_type(cert.file_path)[0] or "application/pdf"
    return FileResponse(cert.file_path, media_type=mime_type,
                        headers={"Content-Disposition": f"inline; filename=\"{cert.file_name or cert.cert_type}\""})


@router.get("/download/{cert_id}")
def download_certificate(cert_id: int, db: Session = Depends(get_db)):
    """Download a certificate file."""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert or not cert.file_path or not os.path.exists(cert.file_path):
        raise HTTPException(404, "Certificate file not found")
    return FileResponse(cert.file_path, filename=cert.file_name or f"{cert.cert_type}.pdf",
                        media_type="application/octet-stream")


@router.delete("/{cert_id}")
def delete_certificate(cert_id: int, db: Session = Depends(get_db)):
    """Delete a certificate."""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    if cert.file_path and os.path.exists(cert.file_path):
        os.remove(cert.file_path)
    db.delete(cert)
    db.commit()
    return {"message": "Certificate deleted"}
