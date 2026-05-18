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
MAX_UPLOAD_BYTES = 1024 * 1024 * 1024  # 1 GB


def _resolve_file_path(cert: "Certificate") -> str | None:
    """Resolve a certificate's file location on disk.

    Newer rows store the full file_path. Older rows only stored file_name.
    For legacy rows, look up the file by matching the upload-dir naming
    convention `{centerName}_{certType}_*` or by the original file_name.
    Returns the absolute path if found, else None.
    """
    if cert.file_path and os.path.exists(cert.file_path):
        return cert.file_path
    if not os.path.isdir(UPLOAD_DIR):
        return None
    # Legacy fallback — scan the upload directory
    try:
        files = os.listdir(UPLOAD_DIR)
    except OSError:
        return None
    # 1) Exact stored file_name match
    if cert.file_name and cert.file_name in files:
        return os.path.join(UPLOAD_DIR, cert.file_name)
    # 2) Match naming convention `{center}_{cert_type}_*`
    if cert.cert_type:
        from app.models.models import Center
        from app.database import SessionLocal
        # Caller already has a session, but Certificate may not eagerly load center
        center_name = ""
        if hasattr(cert, "center_id"):
            db = SessionLocal()
            try:
                c = db.query(Center).filter(Center.id == cert.center_id).first()
                center_name = c.name if c else ""
            finally:
                db.close()
        prefix = f"{center_name}_{cert.cert_type}_" if center_name else f"_{cert.cert_type}_"
        matches = [f for f in files if f.startswith(prefix) or (f"_{cert.cert_type}_" in f and (not center_name or center_name in f))]
        if matches:
            # Prefer the most recently modified match
            matches_full = [os.path.join(UPLOAD_DIR, m) for m in matches]
            matches_full.sort(key=lambda p: os.path.getmtime(p), reverse=True)
            return matches_full[0]
    return None


@router.get("/expiring/")
def get_expiring_certificates(db: Session = Depends(get_db)):
    """Get all certificates expiring within 30 days."""
    from datetime import datetime as dt, timedelta
    today = dt.now().date()
    thirty_days = dt.combine(today + timedelta(days=30), dt.min.time())

    certs = db.query(Certificate).filter(
        Certificate.expiry_date != None,
        Certificate.expiry_date <= thirty_days,
        Certificate.renewal_status != "renewed",
    ).all()

    result = []
    for c in certs:
        center = db.query(Center).filter(Center.id == c.center_id).first()
        days_left = (c.expiry_date.date() - today).days if c.expiry_date else 0
        result.append({
            "id": c.id,
            "cert_type": c.cert_type,
            "center_id": c.center_id,
            "center_name": center.name if center else "",
            "city": center.city if center else "",
            "file_name": c.file_name,
            "expiry_date": c.expiry_date.strftime("%Y-%m-%d") if c.expiry_date else None,
            "days_left": days_left,
            "status": "Expired" if days_left < 0 else "Expiring Soon",
        })
    result.sort(key=lambda x: x["days_left"])
    return result


@router.get("/by-year/{year}/")
def get_certificates_by_year(year: int, db: Session = Depends(get_db)):
    """Get all certificates whose expiry_date falls within the given year."""
    from datetime import datetime as dt
    year_start = dt(year, 1, 1)
    year_end = dt(year, 12, 31, 23, 59, 59)
    today = dt.now().date()

    certs = db.query(Certificate).filter(
        Certificate.expiry_date != None,
        Certificate.expiry_date >= year_start,
        Certificate.expiry_date <= year_end,
    ).all()

    result = []
    for c in certs:
        center = db.query(Center).filter(Center.id == c.center_id).first()
        days_left = (c.expiry_date.date() - today).days if c.expiry_date else 0
        result.append({
            "id": c.id,
            "cert_type": c.cert_type,
            "center_id": c.center_id,
            "center_name": center.name if center else "",
            "city": center.city if center else "",
            "file_name": c.file_name,
            "expiry_date": c.expiry_date.strftime("%Y-%m-%d") if c.expiry_date else None,
            "days_left": days_left,
            "status": "Expired" if days_left < 0 else ("Expiring Soon" if days_left <= 30 else "Active"),
        })
    result.sort(key=lambda x: x["expiry_date"] or "")
    return result


@router.get("/expiry-years/")
def get_expiry_years(db: Session = Depends(get_db)):
    """Return the distinct years that appear in certificate expiry_dates."""
    from sqlalchemy import extract, distinct
    rows = db.query(distinct(extract("year", Certificate.expiry_date))).filter(
        Certificate.expiry_date != None
    ).all()
    years = sorted({int(r[0]) for r in rows if r[0] is not None}, reverse=True)
    return {"years": years}


@router.get("/by-date-range/")
def get_certificates_by_date_range(from_date: str, to_date: str, db: Session = Depends(get_db)):
    """Get all certificates whose expiry_date falls within [from_date, to_date]. Dates in YYYY-MM-DD."""
    from datetime import datetime as dt
    try:
        start = dt.strptime(from_date, "%Y-%m-%d")
        end = dt.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(400, "Dates must be in YYYY-MM-DD format")
    if start > end:
        raise HTTPException(400, "from_date must be on or before to_date")

    today = dt.now().date()
    certs = db.query(Certificate).filter(
        Certificate.expiry_date != None,
        Certificate.expiry_date >= start,
        Certificate.expiry_date <= end,
    ).all()
    result = []
    for c in certs:
        center = db.query(Center).filter(Center.id == c.center_id).first()
        days_left = (c.expiry_date.date() - today).days if c.expiry_date else 0
        result.append({
            "id": c.id,
            "cert_type": c.cert_type,
            "center_id": c.center_id,
            "center_name": center.name if center else "",
            "city": center.city if center else "",
            "file_name": c.file_name,
            "expiry_date": c.expiry_date.strftime("%Y-%m-%d") if c.expiry_date else None,
            "days_left": days_left,
            "status": "Expired" if days_left < 0 else ("Expiring Soon" if days_left <= 30 else "Active"),
        })
    result.sort(key=lambda x: x["expiry_date"] or "")
    return result


@router.get("/center/{center_id}/")
def get_certificates(center_id: int, db: Session = Depends(get_db)):
    """Get all certificates for a center."""
    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(404, "Center not found")

    certs = db.query(Certificate).filter(Certificate.center_id == center_id).all()
    from datetime import datetime as dt
    today = dt.now().date()
    existing = {}
    for c in certs:
        days_left = (c.expiry_date.date() - today).days if c.expiry_date else None
        cert_status = c.status
        if c.expiry_date:
            if days_left is not None and days_left < 0:
                cert_status = "Expired"
            elif days_left is not None and days_left <= 30:
                cert_status = "Expiring Soon"
        existing[c.cert_type] = {
            "id": c.id,
            "cert_type": c.cert_type,
            "file_name": c.file_name,
            "start_date": c.start_date.strftime("%Y-%m-%d") if c.start_date else None,
            "expiry_date": c.expiry_date.strftime("%Y-%m-%d") if c.expiry_date else None,
            "status": cert_status,
            "renewal_status": c.renewal_status or "pending",
            "days_to_expiry": days_left,
            "uploaded_by": c.uploaded_by,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "has_file": bool(c.file_name or c.file_path),
        }

    result = []
    for ct in CERT_TYPES:
        if ct in existing:
            result.append(existing[ct])
        else:
            result.append({"id": None, "cert_type": ct, "file_name": None, "start_date": None, "expiry_date": None,
                           "status": "Not Uploaded", "renewal_status": "pending", "days_to_expiry": None,
                           "uploaded_by": None, "created_at": None, "updated_at": None, "has_file": False})

    return {"center_id": center_id, "center_name": center.name, "city": center.city, "certificates": result}


@router.post("/upload/")
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
    # Allow any cert_type (predefined + custom)

    center = db.query(Center).filter(Center.id == center_id).first()
    if not center:
        raise HTTPException(404, "Center not found")

    # Read & validate file size (1 GB cap)
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is 1 GB (you uploaded {round(len(content) / (1024 * 1024), 2)} MB).",
        )

    # Save file
    ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
    safe_name = f"{center.name}_{cert_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
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
        existing.renewal_status = "renewed"
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


@router.get("/view/{cert_id}/")
def view_certificate(cert_id: int, db: Session = Depends(get_db)):
    """View a certificate file inline in browser."""
    import mimetypes
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    resolved = _resolve_file_path(cert)
    if not resolved:
        raise HTTPException(404, "Certificate file not found")
    # Backfill the resolved path so subsequent calls are fast
    if not cert.file_path:
        cert.file_path = resolved
        db.commit()
    mime_type = mimetypes.guess_type(resolved)[0] or "application/pdf"
    return FileResponse(resolved, media_type=mime_type,
                        headers={"Content-Disposition": f"inline; filename=\"{cert.file_name or cert.cert_type}\""})


@router.get("/download/{cert_id}/")
def download_certificate(cert_id: int, db: Session = Depends(get_db)):
    """Download a certificate file."""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    resolved = _resolve_file_path(cert)
    if not resolved:
        raise HTTPException(404, "Certificate file not found")
    if not cert.file_path:
        cert.file_path = resolved
        db.commit()
    return FileResponse(resolved, filename=cert.file_name or f"{cert.cert_type}.pdf",
                        media_type="application/octet-stream")


@router.delete("/{cert_id}/")
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
