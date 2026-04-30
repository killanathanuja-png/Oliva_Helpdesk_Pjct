"""Update L1 assignment for 5 cities to raj.kumar@olivaclinic.com"""
from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

cities = ('Hyderabad', 'Vizag', 'Vijayawada', 'Pune', 'Ahmedabad')

# Update escalation matrix L1
db.execute(text(
    "UPDATE admin_escalation_matrix SET l1_email = :email, l1_name = 'Raj Kumar' "
    "WHERE location IN :cities"
), {"email": "raj.kumar@olivaclinic.com", "cities": cities})

# Also update location assignment table if those cities exist there
db.execute(text(
    "UPDATE admin_location_assignment SET assigned_to_email = :email, assigned_to_name = 'Raj Kumar' "
    "WHERE location IN :cities"
), {"email": "raj.kumar@olivaclinic.com", "cities": cities})

db.commit()

# Verify
print("\n=== Updated Escalation Matrix ===\n")
rows = db.execute(text("SELECT location, l1_email, l1_name FROM admin_escalation_matrix ORDER BY location")).fetchall()
for r in rows:
    marker = " ✓ UPDATED" if r[0] in cities else ""
    print(f"  {r[0]:<15} → L1: {r[2]} ({r[1]}){marker}")

print("\n=== Updated Location Assignments ===\n")
rows2 = db.execute(text("SELECT location, assigned_to_email, assigned_to_name FROM admin_location_assignment ORDER BY location")).fetchall()
for r in rows2:
    marker = " ✓ UPDATED" if r[0] in cities else ""
    print(f"  {r[0]:<15} → {r[2]} ({r[1]}){marker}")

db.close()
print("\nDone!")
