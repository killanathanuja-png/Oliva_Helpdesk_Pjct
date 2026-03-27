from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Notification
from app.schemas.schemas import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationResponse])
def list_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.created_at.desc()).all()


@router.patch("/{notif_id}/read")
def mark_as_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.read = True
        db.commit()
    return {"message": "Marked as read"}
