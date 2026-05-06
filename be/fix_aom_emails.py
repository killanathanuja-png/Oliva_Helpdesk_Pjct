"""Backfill missing AOM emails for Tanima and Tejaswini in aom_center_mappings,
and propagate to the centers table so ticket routing picks them up."""
from app.database import SessionLocal
from app.models.models import AOMCenterMapping, Center


UPDATES = {
    "Tanima": "tanima.ghosh@olivaclinic.com",
    "Tejaswini": "tejaswini.tiwari@olivaclinic.com",
}


def run():
    db = SessionLocal()
    try:
        for aom_name, email in UPDATES.items():
            mappings = db.query(AOMCenterMapping).filter(AOMCenterMapping.aom_name == aom_name).all()
            for m in mappings:
                m.aom_email = email
            print(f"  {aom_name}: updated {len(mappings)} mapping(s)")
            # Also update centers.aom_email for the centers this AOM owns
            centers_updated = 0
            for m in mappings:
                center = db.query(Center).filter(Center.name == m.center_name).first()
                if center and center.aom_email != email:
                    center.aom_email = email
                    centers_updated += 1
            print(f"  {aom_name}: updated {centers_updated} center(s) aom_email")
        db.commit()
        print("\nDone.")
    except Exception as e:
        db.rollback()
        print(f"Failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
