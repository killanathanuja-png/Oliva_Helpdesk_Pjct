"""Seed CDD Types and Categories into the database."""
from sqlalchemy.orm import Session
from app.database import engine
from app.models.models import Base, CDDType, CDDCategory

# Create tables if not exist
Base.metadata.create_all(bind=engine)

DATA = {
    "Staff": [
        "Unprofessional behaviour", "Staff hygiene", "Diet plan not shared",
        "In-correct Prescription", "Pressure selling", "Delayed / no response",
        "Call back request", "In correct / incomplete info provided",
        "Frequent staff changes", "Request denied", "Doctor Unavailable",
        "Given incorrect product", "Doctor Consultation Dissatisfaction",
        "Nutritionist Consultation Dissatisfaction",
    ],
    "Treatment": [
        "No visible results", "Burn", "Allergy", "Redness/irritation",
        "Primary concern aggravated", "Service not performed well", "Adverse effect",
        "Prescription Request", "Medical Contraindication",
    ],
    "Marketing": [
        "Relocation", "Health Issue", "Personal Reason",
        "Result achieved mid package", "Treatment Cost Objection",
        "Offer misunderstanding", "Misleading ads / offers",
        "Not receiving offer messages", "Marketing",
        "Do not wish to receive offer messages",
    ],
    "Product- Webstore": [
        "Faulty pump mechanism", "Product Delivery", "Defective Product",
        "General product info", "Product Subscription", "High price",
        "Wrong Product Delivery", "Wrong Product Placement", "Packaging issue",
        "Poor labelling", "Received expired / nearing expiry products",
        "Strange or unpleasant odour", "Damaged or leaking packaging",
        "Out of stock", "Change of delivery address or number",
        "Unable to place the order", "Order Cancellation", "Empty Bottle Received",
        "Product refund", "Product exchange",
    ],
    "Product- Clinic": [
        "Faulty pump mechanism", "Product Delivery status", "Defective Product",
        "General product info", "Product Subscription", "High price",
        "Wrong Product Delivery", "Wrong Product Placement", "Packaging issue",
        "Poor labelling", "Received expired / nearing expiry products",
        "Strange or unpleasant odour", "Damaged or leaking packaging",
        "Out of stock", "Change of delivery address or number",
        "Unable to place the order", "Order Cancellation",
        "Product refund", "Product exchange",
    ],
    "Payment": [
        "Overpriced compared to market rates", "Incorrect Package / Product billing",
        "Charged more than MRP", "Invoice not received", "BNPL (Buy Now Pay Later)",
        "Charged for follow-up", "Refund - promised not received",
        "Package transfer", "Price Difference Post-Enrolment",
        "Expecting more discount", "Points credit / debit issue",
        "Points Expiry", "Incorrect points calculation", "Info about loyalty points",
    ],
    "Viva Oliva": [
        "Points credit / debit issue", "Points Expiry",
        "Incorrect points calculation", "Info about loyalty points",
    ],
    "Infrastructure": [
        "AC not working", "Pest infestations",
        "Dirty restrooms or inadequate cleaning services",
        "Poor maintenance of walls, floors, or ceilings", "Unpleasant odour",
        "Leaking or broken pipes",
        "Insufficient or poorly managed parking space", "Soiled Lenin",
        "Damaged / insufficient seating arrangements", "Valet not available",
    ],
    "Non Contact": [
        "Unprofessional behaviour", "Wrong appointment booking",
        "Too many calls for appointment booking",
        "In correct / incomplete info provided",
        "Frequent / Multiple Appointment Rescheduling", "Lead",
        "Not getting slot", "Wait time", "Ez-Connect not working",
        "No follow-up call for service appointment",
        "Service Appointment Request", "Missed Booking Appointment",
    ],
    "BPM": [],
    "Appointment": [],
    "Google Review without comments": [
        "No clear comments", "Google Review without comments", "Fake review",
    ],
    "NPS Review without comments": [
        "No clear comments", "NPS Review without comments",
    ],
    "Clinic": [
        "Clinic Shutdown", "Clinic Location", "General Process Information",
        "Wrong Number", "Registration Policy Feedback", "Non Contact", "Other",
        "Unhappy with Billing Experience", "No Progress Update",
        "Inadequate Post-Care Instructions", "Unsatisfactory Service",
        "Doctor Consultation Request", "Process Transparency",
        "Doctor Engagement",
    ],
}

if __name__ == "__main__":
    with Session(engine) as db:
        for type_name, categories in DATA.items():
            # Check if type already exists
            existing = db.query(CDDType).filter(CDDType.name == type_name).first()
            if existing:
                print(f"SKIP type: {type_name} (already exists)")
                cdd_type = existing
            else:
                cdd_type = CDDType(name=type_name)
                db.add(cdd_type)
                db.flush()
                print(f"ADD type: {type_name} (id={cdd_type.id})")

            for cat_name in categories:
                exists = db.query(CDDCategory).filter(
                    CDDCategory.name == cat_name, CDDCategory.type_id == cdd_type.id
                ).first()
                if not exists:
                    db.add(CDDCategory(name=cat_name, type_id=cdd_type.id))

        db.commit()
        total_types = db.query(CDDType).count()
        total_cats = db.query(CDDCategory).count()
        print(f"\nDone! {total_types} types, {total_cats} categories seeded.")
