"""One-time backfill: repopulate Certificate.file_path for legacy rows
where only file_name was stored.

Logic:
1. Skip rows that already have a valid file_path.
2. For each row missing file_path, scan be/uploads/certificates/ for:
   a) An exact file_name match
   b) A naming-convention match `{centerName}_{cert_type}_*`
3. Pick the most recently modified match and persist.

Run after deploying so subsequent loads don't need the runtime resolver.
"""
import os
from app.database import SessionLocal
from app.models.models import Certificate, Center

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "certificates")


def main():
    if not os.path.isdir(UPLOAD_DIR):
        print(f"Upload dir does not exist: {UPLOAD_DIR}")
        return
    files = os.listdir(UPLOAD_DIR)
    if not files:
        print("Upload dir is empty.")
        return

    db = SessionLocal()
    try:
        rows = db.query(Certificate).all()
        repaired = 0
        already_ok = 0
        skipped = 0
        for c in rows:
            if c.file_path and os.path.exists(c.file_path):
                already_ok += 1
                continue
            resolved = None
            # 1) exact file_name match
            if c.file_name and c.file_name in files:
                resolved = os.path.join(UPLOAD_DIR, c.file_name)
            # 2) convention match
            if not resolved:
                center = db.query(Center).filter(Center.id == c.center_id).first()
                center_name = center.name if center else ""
                if center_name and c.cert_type:
                    prefix = f"{center_name}_{c.cert_type}_"
                    matches = [f for f in files if f.startswith(prefix)]
                    if matches:
                        matches_full = [os.path.join(UPLOAD_DIR, m) for m in matches]
                        matches_full.sort(key=lambda p: os.path.getmtime(p), reverse=True)
                        resolved = matches_full[0]
            if resolved:
                c.file_path = resolved
                repaired += 1
                print(f"  repaired id={c.id} cert_type={c.cert_type!r} -> {os.path.basename(resolved)}")
            else:
                skipped += 1
                print(f"  SKIP id={c.id} cert_type={c.cert_type!r} file_name={c.file_name!r} -- no file found on disk")
        db.commit()
        print(f"\nDone. repaired={repaired} already_ok={already_ok} skipped={skipped}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
