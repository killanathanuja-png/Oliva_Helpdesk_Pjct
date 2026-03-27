"""Add/update users from the screenshot with correct employee_ids."""
from app.database import SessionLocal
from app.models.models import User, Department, Center, StatusEnum
from app.auth import hash_password

db = SessionLocal()
dept_map = {d.name: d.id for d in db.query(Department).all()}
center_map = {c.name: c.id for c in db.query(Center).all()}

last_user = db.query(User).order_by(User.id.desc()).first()
code_counter = (last_user.id + 1) if last_user else 1

# Users from the image - update employee_id if email exists, or add if new
image_users = [
    {"employee_id": "CRT-ADY", "name": "CRT-ADY", "role": "Clinic Incharge", "email": "adyar@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Adiyar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-AH", "name": "CRT AH", "role": "Clinic Incharge, Clinic Manager, Helpdesk In-charge", "email": "nazish.ansari@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Aundh", "department": "CRT", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-ALW", "name": "CRT-ALW", "role": "Clinic Incharge, Clinic Manager", "email": "alwarpetteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Alwarpet", "grade": "On-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-ANN", "name": "CRT-ANN", "role": "Clinic Incharge", "email": "annanagarteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Annanagar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-ETC", "name": "CRT ETC", "role": "Clinic Incharge, Clinic Manager", "email": "electroniccityteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Bengaluru", "location": "Electronic City", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-HSR", "name": "CRT-HSR", "role": "Clinic Incharge, Clinic Manager", "email": "hsrlayout@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "HSR Layout", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-JN", "name": "CRT JN", "role": "Clinic Incharge", "email": "jayanagarteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Bengaluru", "location": "Jayanagar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-KHD", "name": "CRT KHD", "role": "Clinic Incharge, Clinic Manager", "email": "kharaditeam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Pune", "location": "Kharadi", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-KM", "name": "CRT-KM", "role": "Clinic Incharge, Clinic Manager", "email": "koramangalateam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "Koramangala", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-OMR", "name": "CRT OMR", "role": "Clinic Incharge, Clinic Manager", "email": "omrteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "OMR", "reporting_to": "Karthik", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-VJY", "name": "CRT VJY", "role": "Clinic Incharge, Clinic Manager", "email": "vijayawada@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Vijayawada", "location": "Vijayawada", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "divya", "name": "Divya Rao", "role": "Clinic Incharge, Clinic Manager", "email": "indiranagarteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "Indiranagar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "DL-PTM", "name": "Pitam pura", "role": "Employee", "email": "pitampura@olivaclinic.com", "gender": "M", "designation": "IT ADMIN", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Delhi", "location": "Pitampura", "department": "IT Department", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "JN-QA", "name": "JN-QA", "role": "Clinic Manager", "email": "triveni.eric@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "mr", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "Jayanagar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "KOL-SALT", "name": "KOL SALT", "role": "Employee", "email": "saltlake@olivaclinic.com", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Kolkata", "location": "Salk Lake", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Lavanya", "name": "Lavanya Oliva", "role": "Clinic Incharge", "email": "vizag@olivaclinic.com", "gender": "F", "city": "Vizag", "location": "Dwaraka Nagar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Nithya", "name": "Nithya Oliva", "role": "Clinic Incharge", "email": "kadavanthara@olivaclinic.com", "gender": "M", "city": "Cochin", "location": "Kadvanthara"},
    {"employee_id": "pallavip", "name": "Pallavi p", "role": "QA", "email": "pallavip@olivaclinic.com", "map_level_access": "Can View", "gender": "M", "city": "Hyderabad", "location": "Gachibowli"},
    {"employee_id": "Punjabi bagh - QA", "name": "PB-QA", "role": "Clinic Manager", "email": "neha.yadav@olivaclinic.com", "map_level_access": "Can View", "gender": "Female", "designation": "Clinic Manager", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "department": "CLCN", "mobile": "101969", "grade": "Off-Roll", "employee_type": "A"},
    {"employee_id": "PUN-KLN", "name": "Kalyani Nagar Clinic", "role": "Employee", "email": "kalyaninagar@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Kalyaninagar", "department": "CLCN", "mobile": "1011", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Syada", "name": "Syada Maimoona", "role": "Clinic Incharge, Clinic Manager", "email": "gachibowliteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Hyderabad", "location": "Gachibowli"},
    {"employee_id": "Tejaswini", "name": "Tejaswini Tiwari", "role": "Area Operations Manager, Area Operations Manager Head, Employee", "email": "tejaswini.tiwari@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "HSR Layout", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "WF-QA", "name": "WF-QA", "role": "Area Operations Manager", "email": "astha.kapoor@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "mr", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "Whitefield", "employee_type": "A"},
]

updated = 0
added = 0

for u in image_users:
    email = (u.get("email") or "").strip().lower()
    if not email:
        continue

    existing = db.query(User).filter(User.email == email).first()
    center_id = center_map.get((u.get("location") or "").strip()) or None
    dept_id = dept_map.get((u.get("department") or "").strip()) or None

    if existing:
        # Update with image data
        existing.employee_id = u["employee_id"]
        existing.name = u["name"]
        existing.role = u["role"]
        existing.map_level_access = u.get("map_level_access")
        existing.designation = u.get("designation")
        existing.entity = u.get("entity")
        existing.vertical = u.get("vertical")
        existing.costcenter = u.get("costcenter")
        existing.gender = u.get("gender")
        existing.mobile = u.get("mobile") or existing.mobile
        existing.reporting_to = u.get("reporting_to")
        existing.grade = u.get("grade")
        existing.employee_type = u.get("employee_type")
        if center_id:
            existing.center_id = center_id
        if dept_id:
            existing.department_id = dept_id
        parts = u["name"].split()
        existing.avatar = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else u["name"][:2].upper()
        updated += 1
        print(f"  Updated: {u['employee_id']:20s} {email}")
    else:
        user_code = f"U{code_counter:03d}"
        code_counter += 1
        parts = u["name"].split()
        avatar = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else u["name"][:2].upper()
        new_user = User(
            code=user_code, employee_id=u["employee_id"], name=u["name"], email=email,
            hashed_password=hash_password("oliva@123"), role=u["role"],
            map_level_access=u.get("map_level_access"), designation=u.get("designation"),
            entity=u.get("entity"), vertical=u.get("vertical"), costcenter=u.get("costcenter"),
            gender=u.get("gender"), mobile=u.get("mobile"), reporting_to=u.get("reporting_to"),
            grade=u.get("grade"), employee_type=u.get("employee_type"),
            department_id=dept_id, center_id=center_id, avatar=avatar, status=StatusEnum.Active,
        )
        db.add(new_user)
        added += 1
        print(f"  Added:   {u['employee_id']:20s} {email}")

db.commit()
print(f"\nUpdated {updated}, Added {added}")
print(f"Total users: {db.query(User).count()}")
db.close()
