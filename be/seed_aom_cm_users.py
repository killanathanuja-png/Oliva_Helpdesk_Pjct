"""Seed all AOM and CM users + AOM-Center mappings into the database."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.models import User, Center, AOMCenterMapping, StatusEnum
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

DEFAULT_PASSWORD = "oliva@123"

# AOM users: (name, email, location/city)
AOM_USERS = [
    ("Bindhu", "bindhu.m@olivaclinic.com", "Bangalore"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Hyderabad"),
    ("Karthik", "karthik.sn@olivaclinic.com", "Chennai"),
    ("Tejaswini", None, "Bangalore"),
    ("Sumita", "sumitakaul@olivaclinic.com", "Pune"),
    ("Tanima", None, "Kolkata"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Hyderabad"),
    ("Navya", "navya.shivanna@olivaclinic.com", "Bangalore"),
]

# CM users: (name, email, center_name, location)
CM_USERS = [
    ("Leishangthem Romina Devi", "romina.leishangthem@olivaclinic.com", "Whitefield", "Bangalore"),
    ("Accamma M D", "accamma.md@olivaclinic.com", "HRBR", "Bangalore"),
    ("Meena R", "meena.r@olivaclinic.com", "Sadashiv Nagar", "Bangalore"),
    ("Ranjitha", "ranjitha.vasu@olivaclinic.com", "Yelahanka", "Bangalore"),
    ("Sreeraj", "sreeraj.nambiar@olivaclinic.com", "Kochi", "Kochi"),
    ("Naresh Challa", "naresh.challa@olivaclinic.com", "Himayathnagar", "Hyderabad"),
    ("Mullangi Taruni Reddy", "taruni.mullangi@olivaclinic.com", "Kukatpally", "Hyderabad"),
    ("Sujatha Robby", "sujatha.robby@olivaclinic.com", "Dilsukhnagar", "Hyderabad"),
    ("Tulasi Molugu", "tulasi.molugu@olivaclinic.com", "Secunderabad", "Hyderabad"),
    ("Suma", "suma.varadhi@olivaclinic.com", "Vizag", "Vizag"),
    ("Sarvesh Chandran", "sarvesh.chandran@olivaclinic.com", "Annanagar", "Chennai"),
    ("Karthikeyan C", "karthikeyan.c@olivaclinic.com", "Alwarpet", "Chennai"),
    ("L Manjusha", "manjusha.l@olivaclinic.com", "OMR", "Chennai"),
    ("Vidhya Karthick", "vidhya.r@olivaclinic.com", "Adyar", "Chennai"),
    ("Amrita Thakkar", "amritaathakker@gmail.com", "HSR Layout", "Bangalore"),
    ("Swati Deshmukh", "swati.deshmukh@olivaclinic.com", "Kalyani Nagar", "Pune"),
    ("Kalyani Tarwade", "kalyani.tarwade@olivaclinic.com", "Shivaji Nagar", "Pune"),
    ("Manisha Giramkar", "manisha.giramkar@olivaclinic.com", "Kharadi", "Pune"),
    ("Nazish Akbar Ansari", "nazish.ansari@olivaclinic.com", "Aundh", "Pune"),
    ("Rupal Panchal", "rupal.panchal@olivaclinic.com", "Ahmedabad", "Ahmedabad"),
    ("Papri Nath", "papri.nath@olivaclinic.com", "Park Street", "Kolkata"),
    ("Soma Chanda", "soma.chanda@olivaclinic.com", "Jodhpur Park", "Kolkata"),
    ("Megha Arora", "megha.a@olivaclinic.com", "Salt Lake", "Kolkata"),
    ("Nabila Khan", "nabila@olivaclinic.com", "Banjara Hills", "Hyderabad"),
    ("Sonia Sharma", "sonia.sharma@olivaclinic.com", "Gachibowli", "Hyderabad"),
    ("Krishnaveni", "krishnaveni.kola@olivaclinic.com", "Kokapet", "Hyderabad"),
    ("Mounika Patamata", "mounika.patamata@olivaclinic.com", "Vijayawada", "Vijayawada"),
    ("Soni Gowda", "soni.gowda@olivaclinic.com", "Jayanagar", "Bangalore"),
    ("Shweta Virmani", "shweta.virmani@olivaclinic.com", "Indiranagar", "Bangalore"),
    ("Divya P", "divya.p@olivaclinic.com", "Koramangala", "Bangalore"),
]

# AOM-CM-Center mapping: (aom_name, aom_email, cm_name, cm_email, center_name, location)
AOM_CM_MAPPINGS = [
    ("Bindhu", "bindhu.m@olivaclinic.com", "Leishangthem Romina Devi", "romina.leishangthem@olivaclinic.com", "Whitefield", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Accamma M D", "accamma.md@olivaclinic.com", "HRBR", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Meena R", "meena.r@olivaclinic.com", "Sadashiv Nagar", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Ranjitha", "ranjitha.vasu@olivaclinic.com", "Yelahanka", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Sreeraj", "sreeraj.nambiar@olivaclinic.com", "Kochi", "Kochi"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Naresh Challa", "naresh.challa@olivaclinic.com", "Himayathnagar", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Mullangi Taruni Reddy", "taruni.mullangi@olivaclinic.com", "Kukatpally", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Sujatha Robby", "sujatha.robby@olivaclinic.com", "Dilsukhnagar", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Tulasi Molugu", "tulasi.molugu@olivaclinic.com", "Secunderabad", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Suma", "suma.varadhi@olivaclinic.com", "Vizag", "Vizag"),
    ("Karthik", "karthik.sn@olivaclinic.com", "Sarvesh Chandran", "sarvesh.chandran@olivaclinic.com", "Annanagar", "Chennai"),
    ("Karthik", "karthik.sn@olivaclinic.com", "Karthikeyan C", "karthikeyan.c@olivaclinic.com", "Alwarpet", "Chennai"),
    ("Karthik", "karthik.sn@olivaclinic.com", "L Manjusha", "manjusha.l@olivaclinic.com", "OMR", "Chennai"),
    ("Karthik", "karthik.sn@olivaclinic.com", "Vidhya Karthick", "vidhya.r@olivaclinic.com", "Adyar", "Chennai"),
    ("Tejaswini", None, "Amrita Thakkar", "amritaathakker@gmail.com", "HSR Layout", "Bangalore"),
    ("Tejaswini", None, "Swati Deshmukh", "swati.deshmukh@olivaclinic.com", "Kalyani Nagar", "Pune"),
    ("Tejaswini", None, "Kalyani Tarwade", "kalyani.tarwade@olivaclinic.com", "Shivaji Nagar", "Pune"),
    ("Sumita", "sumitakaul@olivaclinic.com", "Manisha Giramkar", "manisha.giramkar@olivaclinic.com", "Kharadi", "Pune"),
    ("Sumita", "sumitakaul@olivaclinic.com", "Nazish Akbar Ansari", "nazish.ansari@olivaclinic.com", "Aundh", "Pune"),
    ("Sumita", "sumitakaul@olivaclinic.com", "Rupal Panchal", "rupal.panchal@olivaclinic.com", "Ahmedabad", "Ahmedabad"),
    ("Tanima", None, "Papri Nath", "papri.nath@olivaclinic.com", "Park Street", "Kolkata"),
    ("Tanima", None, "Soma Chanda", "soma.chanda@olivaclinic.com", "Jodhpur Park", "Kolkata"),
    ("Tanima", None, "Megha Arora", "megha.a@olivaclinic.com", "Salt Lake", "Kolkata"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Nabila Khan", "nabila@olivaclinic.com", "Banjara Hills", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Sonia Sharma", "sonia.sharma@olivaclinic.com", "Gachibowli", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Krishnaveni", "krishnaveni.kola@olivaclinic.com", "Kokapet", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Mounika Patamata", "mounika.patamata@olivaclinic.com", "Vijayawada", "Vijayawada"),
    ("Navya", "navya.shivanna@olivaclinic.com", "Soni Gowda", "soni.gowda@olivaclinic.com", "Jayanagar", "Bangalore"),
    ("Navya", "navya.shivanna@olivaclinic.com", "Shweta Virmani", "shweta.virmani@olivaclinic.com", "Indiranagar", "Bangalore"),
    ("Navya", "navya.shivanna@olivaclinic.com", "Divya P", "divya.p@olivaclinic.com", "Koramangala", "Bangalore"),
]


def make_avatar(name):
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


def seed_all():
    db = SessionLocal()
    try:
        existing_emails = {u.email.lower(): u for u in db.query(User).all()}
        last_user = db.query(User).order_by(User.id.desc()).first()
        code_counter = (last_user.id + 1) if last_user else 1

        # Build center lookup
        center_map = {c.name.lower(): c for c in db.query(Center).all()}

        added_users = 0
        updated_users = 0

        # --- Add AOM users ---
        for name, email, city in AOM_USERS:
            if not email:
                # Generate email for AOMs without one
                email = f"{name.lower().replace(' ', '.')}@olivaclinic.com"
            email_lower = email.lower()
            if email_lower in existing_emails:
                # Update role to Area Operations Manager
                u = existing_emails[email_lower]
                u.role = "Area Operations Manager"
                u.city = city
                u.designation = "Area Operations Manager"
                updated_users += 1
                print(f"  Updated AOM: {name} ({email})")
            else:
                user = User(
                    code=f"U{code_counter:03d}",
                    name=name,
                    email=email,
                    hashed_password=hash_password(DEFAULT_PASSWORD),
                    role="Area Operations Manager",
                    designation="Area Operations Manager",
                    city=city,
                    avatar=make_avatar(name),
                    status=StatusEnum.Active,
                )
                db.add(user)
                existing_emails[email_lower] = user
                code_counter += 1
                added_users += 1
                print(f"  Added AOM: {name} ({email})")

        # --- Add CM users ---
        for name, email, center_name, city in CM_USERS:
            if not email:
                continue
            email_lower = email.lower()
            center_obj = center_map.get(center_name.lower())
            if email_lower in existing_emails:
                u = existing_emails[email_lower]
                if "Clinic" not in (u.role or ""):
                    u.role = "Clinic Manager"
                u.city = city
                u.designation = "Center Manager"
                if center_obj:
                    u.center_id = center_obj.id
                updated_users += 1
                print(f"  Updated CM: {name} ({email}) -> {center_name}")
            else:
                user = User(
                    code=f"U{code_counter:03d}",
                    name=name,
                    email=email,
                    hashed_password=hash_password(DEFAULT_PASSWORD),
                    role="Clinic Manager",
                    designation="Center Manager",
                    city=city,
                    center_id=center_obj.id if center_obj else None,
                    avatar=make_avatar(name),
                    status=StatusEnum.Active,
                )
                db.add(user)
                existing_emails[email_lower] = user
                code_counter += 1
                added_users += 1
                print(f"  Added CM: {name} ({email}) -> {center_name}")

        db.commit()
        print(f"\n--- Users: Added {added_users}, Updated {updated_users} ---")

        # --- Seed AOM-Center Mappings ---
        db.query(AOMCenterMapping).delete()
        db.commit()

        mapping_count = 0
        for aom_name, aom_email, cm_name, cm_email, center_name, location in AOM_CM_MAPPINGS:
            mapping = AOMCenterMapping(
                aom_name=aom_name,
                aom_email=aom_email,
                cm_name=cm_name,
                cm_email=cm_email,
                center_name=center_name,
                location=location,
                status=StatusEnum.Active,
            )
            db.add(mapping)
            mapping_count += 1

        db.commit()
        print(f"--- AOM-CM Mappings: Added {mapping_count} ---")

        # --- Print summary ---
        print("\n========== SUMMARY ==========")
        print(f"Total Users in DB: {db.query(User).count()}")
        print(f"Total AOM-CM Mappings: {db.query(AOMCenterMapping).count()}")
        print("\nAOM Users:")
        for u in db.query(User).filter(User.role == "Area Operations Manager").all():
            print(f"  {u.name} | {u.email} | {u.role} | {u.city}")
        print("\nCM Users:")
        for u in db.query(User).filter(User.role == "Clinic Manager").all():
            center_name = u.center_rel.name if u.center_rel else "No center"
            print(f"  {u.name} | {u.email} | {u.role} | {center_name} | {u.city}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
