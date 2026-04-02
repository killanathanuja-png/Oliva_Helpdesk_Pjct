"""Seed Admin Department escalation matrix."""
from sqlalchemy.orm import Session
from app.database import engine
from app.models.models import Base, AdminEscalationMatrix

Base.metadata.create_all(bind=engine)

DATA = [
    {"location": "Hyderabad", "l1_email": "pruthviraj.s@olivaclinic.com", "l1_name": "Pruthviraj S", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Bangalore", "l1_email": "suresh.sb@olivaclinic.com", "l1_name": "Suresh SB", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Chennai", "l1_email": "suresh.sb@olivaclinic.com", "l1_name": "Suresh SB", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Kochi", "l1_email": "suresh.sb@olivaclinic.com", "l1_name": "Suresh SB", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Vizag", "l1_email": "pruthviraj.s@olivaclinic.com", "l1_name": "Pruthviraj S", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Vijayawada", "l1_email": "pruthviraj.s@olivaclinic.com", "l1_name": "Pruthviraj S", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Pune", "l1_email": "pruthviraj.s@olivaclinic.com", "l1_name": "Pruthviraj S", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Ahmedabad", "l1_email": "pruthviraj.s@olivaclinic.com", "l1_name": "Pruthviraj S", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
    {"location": "Kolkata", "l1_email": "rajesh@olivaclinic.com", "l1_name": "Rajesh Alur", "l2_email": "rajesh@olivaclinic.com", "l2_name": "Rajesh Alur", "l3_email": "rupalirane@olivaclinic.com", "l3_name": "Rupali Rane"},
]

if __name__ == "__main__":
    with Session(engine) as db:
        for row in DATA:
            existing = db.query(AdminEscalationMatrix).filter(AdminEscalationMatrix.location == row["location"]).first()
            if existing:
                print(f"SKIP: {row['location']} (exists)")
                continue
            db.add(AdminEscalationMatrix(**row, l1_sla_hours=8, l2_sla_hours=10))
            print(f"ADDED: {row['location']} -> L1:{row['l1_name']}, L2:{row['l2_name']}, L3:{row['l3_name']}")
        db.commit()
    print("\nDone!")
