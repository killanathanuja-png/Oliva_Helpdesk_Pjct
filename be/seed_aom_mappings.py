"""Seed AOM-CM-Center mapping data."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.models import AOMCenterMapping, StatusEnum

# Create tables if not exist
Base.metadata.create_all(bind=engine)

# AOM mapping data: (aom_name, aom_email, cm_name, cm_email, center_name, location)
AOM_DATA = [
    # Bindhu - Bangalore & Kochi
    ("Bindhu", "bindhu.m@olivaclinic.com", "Leishangthem Romina Devi", "romina.leishangthem@olivaclinic.com", "Whitefield", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Accamma M D", "accamma.md@olivaclinic.com", "HRBR", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Meena R", "meena.r@olivaclinic.com", "Sadashiv Nagar", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Ranjitha", "ranjitha.vasu@olivaclinic.com", "Yelahanka", "Bangalore"),
    ("Bindhu", "bindhu.m@olivaclinic.com", "Sreeraj", "sreeraj.nambiar@olivaclinic.com", "Kochi", "Kochi"),

    # Triveni - Hyderabad & Vizag
    ("Triveni", "triveni.eric@olivaclinic.com", "Naresh Challa", "naresh.challa@olivaclinic.com", "Himayathnagar", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Mullangi Taruni Reddy", "taruni.mullangi@olivaclinic.com", "Kukatpally", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Sujatha Robby", "sujatha.robby@olivaclinic.com", "Dilsukhnagar", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Tulasi Molugu", "tulasi.molugu@olivaclinic.com", "Secunderabad", "Hyderabad"),
    ("Triveni", "triveni.eric@olivaclinic.com", "Suma", "suma.varadhi@olivaclinic.com", "Vizag", "Vizag"),

    # Karthik - Chennai
    ("Karthik", "karthik.sn@olivaclinic.com", "Sarvesh Chandran", "sarvesh.chandran@olivaclinic.com", "Annanagar", "Chennai"),
    ("Karthik", "karthik.sn@olivaclinic.com", "Karthikeyan C", "karthikeyan.c@olivaclinic.com", "Alwarpet", "Chennai"),
    ("Karthik", "karthik.sn@olivaclinic.com", "L Manjusha", "manjusha.l@olivaclinic.com", "OMR", "Chennai"),
    ("Karthik", "karthik.sn@olivaclinic.com", "Vidhya Karthick", "vidhya.r@olivaclinic.com", "Adyar", "Chennai"),

    # Tejaswini - Bangalore & Pune
    ("Tejaswini", None, "Amrita Thakkar", "amritaathakker@gmail.com", "HSR Layout", "Bangalore"),
    ("Tejaswini", None, "CRT", None, "Electronic City", "Bangalore"),
    ("Tejaswini", None, "Swati Deshmukh", "swati.deshmukh@olivaclinic.com", "Kalyani Nagar", "Pune"),
    ("Tejaswini", None, "Kalyani Tarwade", "kalyani.tarwade@olivaclinic.com", "Shivaji Nagar", "Pune"),

    # Sumita - Pune & Ahmedabad
    ("Sumita", "sumitakaul@olivaclinic.com", "Manisha Giramkar", "manisha.giramkar@olivaclinic.com", "Kharadi", "Pune"),
    ("Sumita", "sumitakaul@olivaclinic.com", "Nazish Akbar Ansari", "nazish.ansari@olivaclinic.com", "Aundh", "Pune"),
    ("Sumita", "sumitakaul@olivaclinic.com", "Rupal Panchal", "rupal.panchal@olivaclinic.com", "Ahmedabad", "Ahmedabad"),

    # Tanima - Kolkata
    ("Tanima", None, "Papri Nath", "papri.nath@olivaclinic.com", "Park Street", "Kolkata"),
    ("Tanima", None, "Soma Chanda", "soma.chanda@olivaclinic.com", "Jodhpur Park", "Kolkata"),
    ("Tanima", None, "Megha Arora", "megha.a@olivaclinic.com", "Salt Lake", "Kolkata"),

    # Shweta - Hyderabad & Vijayawada
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Nabila Khan", "nabila@olivaclinic.com", "Banjara Hills", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Sonia Sharma", "sonia.sharma@olivaclinic.com", "Gachibowli", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "CRT", None, "Jubilee Hills", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Krishnaveni", "krishnaveni.kola@olivaclinic.com", "Kokapet", "Hyderabad"),
    ("Shweta", "shweta.pushkar@olivaclinic.com", "Mounika Patamata", "mounika.patamata@olivaclinic.com", "Vijayawada", "Vijayawada"),

    # Navya - Bangalore
    ("Navya", "navya.shivanna@olivaclinic.com", "Soni Gowda", "soni.gowda@olivaclinic.com", "Jayanagar", "Bangalore"),
    ("Navya", "navya.shivanna@olivaclinic.com", "Shweta Virmani", "shweta.virmani@olivaclinic.com", "Indiranagar", "Bangalore"),
    ("Navya", "navya.shivanna@olivaclinic.com", "Divya P", "divya.p@olivaclinic.com", "Koramangala", "Bangalore"),
]


def seed_aom_mappings():
    db = SessionLocal()
    try:
        # Clear existing mappings
        db.query(AOMCenterMapping).delete()
        db.commit()

        for aom_name, aom_email, cm_name, cm_email, center_name, location in AOM_DATA:
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

        db.commit()
        print(f"Successfully seeded {len(AOM_DATA)} AOM-CM-Center mappings.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding AOM mappings: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_aom_mappings()
