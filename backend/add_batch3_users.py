"""Add users from the latest screenshot."""
from app.database import SessionLocal
from app.models.models import User, Department, Center, StatusEnum
from app.auth import hash_password

db = SessionLocal()
dept_map = {d.name: d.id for d in db.query(Department).all()}
center_map = {c.name: c.id for c in db.query(Center).all()}
existing_emails = {u.email for u in db.query(User).all()}

last_user = db.query(User).order_by(User.id.desc()).first()
code_counter = (last_user.id + 1) if last_user else 1

users_data = [
    {"employee_id": "101074", "name": "Pallavi Prabhakar", "role": "Area Operations Manager Head", "email": "pallavip@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Hyderabad", "location": "Begumpet HO", "mobile": "9000730055", "grade": "On-Roll", "employee_type": "EMPLOYEE"},
    {"employee_id": "102432", "name": "Neha", "role": "Clinic Manager", "email": "neha.yadav@olivaclinic.com", "map_level_access": "Can View", "gender": "Female", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "department": "Clinic Operations", "mobile": "1234567890", "reporting_to": "Tejaswini", "grade": "On-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "9001", "name": "Electronic City", "role": "Clinic Incharge, Employee", "email": "electroniccityteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "Electronic City", "department": "Clinic Operations", "reporting_to": "Tejaswini", "grade": "On-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "9002", "name": "OM R", "role": "Employee", "email": "omrteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "city": "Chennai", "location": "OMR", "department": "Clinic Operations", "reporting_to": "Karthik", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "9003", "name": "Kharadi Clinic", "role": "Clinic Incharge, Clinic Manager, Employee", "email": "kharaditeam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Kharadi", "department": "Clinic Operations", "reporting_to": "keerthi", "grade": "On-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "9004", "name": "VJ A", "role": "Clinic Incharge, Employee", "email": "vijayawada@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "city": "Vijayawada", "location": "Vijayawada", "department": "CLCN", "reporting_to": "keerthi", "grade": "On-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "AOM-BLR1", "name": "Triveni Eric", "role": "Area Operations Manager", "email": "triveni.eric@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Area Operations Manager", "city": "Bengaluru", "location": "Jayanagar"},
    {"employee_id": "AP-VZG", "name": "AP VIZAG", "role": "Employee", "email": "vizag@olivaclinic.com", "map_level_access": "Can View", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Vizag", "location": "Dwaraka Nagar", "department": "CLCN", "reporting_to": "HYD-AOM2", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Astha-QA", "name": "Astha QA", "role": "Area Operations Manager", "email": "astha.kapoor@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Aundh", "name": "AH-QA", "role": "Employee", "email": "nazish.ansari@olivaclinic.com", "map_level_access": "Can View", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "city": "Pune", "department": "Clinic Operations", "mobile": "101769", "grade": "A"},
    {"employee_id": "BLR-HSR", "name": "HSR Layout Clinic", "role": "Employee", "email": "hsrlayout@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "city": "Bengaluru", "location": "HSR Layout", "department": "CLCN", "reporting_to": "AOM-BLR", "grade": "On-Roll", "employee_type": "EMPLOYEE"},
    {"employee_id": "BLR-IND", "name": "Indira Nagar", "role": "Employee", "email": "indiranagarteam@olivaclinic.com", "map_level_access": "Can View and Edit", "designation": "Clinic Incharge", "city": "Bengaluru", "location": "Indiranagar", "department": "CLCN", "mobile": "9741591222", "grade": "On-Roll"},
    {"employee_id": "BLR-JNG", "name": "Jaya Nagar", "role": "Employee", "email": "jayanagarteam@olivaclinic.com", "map_level_access": "Can View and Edit", "designation": "Clinic Incharge", "city": "Bengaluru", "location": "Jayanagar", "department": "CLCN", "mobile": "9611475266"},
    {"employee_id": "BLR-KRM", "name": "Koramangala", "role": "Employee", "email": "koramangalateam@olivaclinic.com", "map_level_access": "Can View and Edit", "designation": "Clinic Incharge", "city": "Bengaluru", "location": "Koramangala", "department": "CLCN", "mobile": "7022872832", "reporting_to": "CHN-AOM", "grade": "A", "employee_type": "EMPLOYEE"},
    {"employee_id": "CHN-ADR", "name": "Adyar Clinic", "role": "Employee", "email": "adyar@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Adiyar", "department": "CLCN", "reporting_to": "CHN-AOM", "grade": "A", "employee_type": "EMPLOYEE"},
    {"employee_id": "CHN-ALW", "name": "Alwarpet Clinic", "role": "Employee", "email": "alwarpetteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Alwarpet", "mobile": "9652518855", "reporting_to": "AOM-CHN", "grade": "On-Roll", "employee_type": "EMPLOYEE"},
    {"employee_id": "CHN-ANG", "name": "Annanagar Clinic Clinic", "role": "Employee", "email": "annanagarteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Annanagar", "mobile": "7330999274", "reporting_to": "AOM-CHN", "grade": "On-Roll", "employee_type": "EMPLOYEE"},
    {"employee_id": "CRT-KN", "name": "CRT-KN", "role": "Clinic Incharge, Clinic Manager", "email": "kalyaninagar@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Kalyaninagar", "grade": "Off-Roll"},
    {"employee_id": "CRT-PP", "name": "Pitam Pura", "role": "Clinic Incharge", "email": "pitampura@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Delhi", "location": "Pitampura", "department": "CRT", "reporting_to": "poornima", "grade": "A", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-SL", "name": "CRT-SL", "role": "Clinic Incharge", "email": "saltlake@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "city": "Kolkata", "location": "Salk Lake", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "HSR-QA", "name": "HSR-QA", "role": "Clinic Manager", "email": "tejaswini.tiwari@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "mr", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "HSR Layout", "department": "CLCN", "grade": "On-Roll", "employee_type": "off-role"},
    {"employee_id": "HYD-GBL", "name": "Gachibowli", "role": "Employee", "email": "gachibowliteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Hyderabad", "location": "Gachibowli", "department": "CLCN", "grade": "On-Roll"},
    {"employee_id": "KLR-COCHIN", "name": "KLR COCHIN", "role": "Employee", "email": "kadavanthara@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Cochin", "location": "Kadvanthara", "department": "CLCN", "mobile": "101969", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Punjabi bagh - QA", "name": "PB-QA", "role": "Clinic Manager", "email": "neha.yadav@olivaclinic.com", "map_level_access": "Can View", "gender": "Female", "designation": "Clinic Manager", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "department": "CLCN", "mobile": "101969", "grade": "A"},
]

updated = 0
added = 0

for u in users_data:
    email = (u.get("email") or "").strip().lower()
    if not email:
        continue

    existing = db.query(User).filter(User.email == email).first()
    center_id = center_map.get((u.get("location") or "").strip()) or None
    dept_id = dept_map.get((u.get("department") or "").strip()) or None

    if existing:
        existing.employee_id = u["employee_id"]
        existing.name = u["name"]
        existing.role = u["role"]
        existing.map_level_access = u.get("map_level_access")
        existing.designation = u.get("designation")
        existing.entity = u.get("entity")
        existing.vertical = u.get("vertical")
        existing.costcenter = u.get("costcenter")
        existing.gender = u.get("gender")
        if u.get("mobile"):
            existing.mobile = u["mobile"]
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
