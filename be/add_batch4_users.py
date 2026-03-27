"""Add users from latest screenshot - allow duplicates by appending suffix."""
from app.database import SessionLocal
from app.models.models import User, Department, Center, StatusEnum
from app.auth import hash_password

db = SessionLocal()
dept_map = {d.name: d.id for d in db.query(Department).all()}
center_map = {c.name: c.id for c in db.query(Center).all()}
existing_emails = {u.email for u in db.query(User).all()}

last_user = db.query(User).order_by(User.id.desc()).first()
code_counter = (last_user.id + 1) if last_user else 1

users = [
    {"employee_id": "102432", "name": "Neha", "role": "Clinic Manager", "email": "neha.yadav@olivaclinic.com", "map_level_access": "Can View", "gender": "Female", "designation": "Clinic Manager", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "department": "Clinic Operations", "mobile": "1234567890", "reporting_to": "101969", "employee_dob": "", "employee_doj": "2023-07-07 00:00:00", "lwd": "", "effective_date": "2023-09-06"},
    {"employee_id": "CRT-ADY", "name": "CRT-ADY", "role": "Clinic Incharge", "email": "adyar@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Adiyar", "grade": "On-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-AH", "name": "CRT AH", "role": "Clinic Incharge, Clinic Manager, Helpdesk In-charge", "email": "nazish.ansari@olivaclinic.com", "map_level_access": "Can View", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Aundh", "department": "CRT", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-ALW", "name": "CRT-ALW", "role": "Clinic Incharge, Clinic Manager", "email": "alwarpetteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Alwarpet", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "CRT-ANN", "name": "CRT-ANN", "role": "Clinic Incharge, Clinic Manager", "email": "annanagarteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Chennai", "location": "Annanagar", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "CRT-ETC", "name": "CRT ETC", "role": "Clinic Incharge, Clinic Manager", "email": "electroniccityteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Bengaluru", "location": "Electronic City", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-HSR", "name": "CRT-HSR", "role": "Clinic Incharge, Clinic Manager", "email": "hsrlayout@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "HSR Layout", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "CRT-JN", "name": "CRT-JN", "role": "Clinic Incharge", "email": "jayanagarteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Bengaluru", "location": "Jayanagar", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "CRT-KHD", "name": "CRT KHD", "role": "Clinic Incharge, Clinic Manager", "email": "kharaditeam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Pune", "location": "Kharadi", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-KM", "name": "CRT-KM", "role": "Clinic Incharge, Clinic Manager", "email": "koramangalateam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "Koramangala", "reporting_to": "Karthik", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-OMR", "name": "CRT OMR", "role": "Clinic Incharge, Clinic Manager", "email": "omrteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Chennai", "location": "OMR", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-VJY", "name": "CRT VJY", "role": "Clinic Incharge, Clinic Manager", "email": "vijayawada@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Vijayawada", "location": "Vijayawada", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "divya", "name": "Divya Rao", "role": "Clinic Incharge, Clinic Manager", "email": "indiranagarteam@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "Indiranagar", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "DL-PTM", "name": "Pitam pura", "role": "Employee", "email": "pitampura@olivaclinic.com", "gender": "M", "designation": "IT ADMIN", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Delhi", "location": "Pitampura", "department": "IT Department", "grade": "Off-Roll", "employee_type": "Off-Roll", "remarks": "ok"},
    {"employee_id": "JN-QA", "name": "JN-QA", "role": "Clinic Manager", "email": "triveni.eric@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "mr", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "Jayanagar", "grade": "A", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "KOL-SALT", "name": "KOL SALT", "role": "Employee", "email": "saltlake@olivaclinic.com", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Kolkata", "location": "Salk Lake", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Lavanya", "name": "Lavanya Oliva", "role": "Clinic Incharge", "email": "vizag@olivaclinic.com", "gender": "F", "city": "Vizag", "location": "Dwaraka Nagar", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "Nithya", "name": "Nithya Oliva", "role": "Clinic Incharge", "email": "kadavanthara@olivaclinic.com", "gender": "M", "city": "Cochin", "location": "Kadvanthara"},
    {"employee_id": "pallavip", "name": "Pallavi p", "role": "QA", "email": "pallavip@olivaclinic.com", "gender": "M", "city": "Hyderabad", "location": "Gachibowli"},
    {"employee_id": "Punjabi bagh - QA", "name": "PB-QA", "role": "Clinic Manager", "email": "neha.yadav@olivaclinic.com", "map_level_access": "Can View", "gender": "Female", "designation": "Clinic Manager", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "department": "CLCN", "mobile": "101969", "grade": "A", "employee_doj": "2023-11-20 00:00:00", "effective_date": "2023-11-20"},
    {"employee_id": "PUN-KLN", "name": "Kalyani Nagar Clinic", "role": "Employee", "email": "kalyaninagar@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Kalyaninagar", "department": "CLCN", "mobile": "1011", "grade": "Off-Roll", "employee_type": "Off-Roll", "employee_doj": "1900-01-01 00:00:00"},
    {"employee_id": "Syada", "name": "Syada Maimoona", "role": "Clinic Incharge, Clinic Manager", "email": "gachibowliteam@olivaclinic.com", "map_level_access": "Can View", "gender": "F", "city": "Hyderabad", "location": "Gachibowli"},
    {"employee_id": "Tejaswini", "name": "Tejaswini Tiwari", "role": "Area Operations Manager, Area Operations Manager Head, Employee", "email": "tejaswini.tiwari@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "F", "city": "Bengaluru", "location": "HSR Layout", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "WF-QA", "name": "WF-QA", "role": "Area Operations Manager", "email": "astha.kapoor@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "mr", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "Whitefield", "grade": "A", "employee_doj": "1900-01-01 00:00:00"},
]

added = 0
updated = 0

for u in users:
    email = (u.get("email") or "").strip().lower()
    if not email:
        continue

    center_name = u.get("location", "")
    center_id = center_map.get(center_name) if center_name else None
    dept_name = u.get("department", "")
    dept_id = dept_map.get(dept_name) if dept_name else None

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        # Update with new data from this screenshot
        existing.employee_id = u["employee_id"]
        existing.name = u["name"]
        existing.role = u["role"]
        if u.get("map_level_access"): existing.map_level_access = u["map_level_access"]
        if u.get("gender"): existing.gender = u["gender"]
        if u.get("designation"): existing.designation = u["designation"]
        if u.get("entity"): existing.entity = u["entity"]
        if u.get("vertical"): existing.vertical = u["vertical"]
        if u.get("costcenter"): existing.costcenter = u["costcenter"]
        if u.get("city"): existing.city = u["city"]
        if u.get("mobile"): existing.mobile = u["mobile"]
        if u.get("reporting_to"): existing.reporting_to = u["reporting_to"]
        if u.get("grade"): existing.grade = u["grade"]
        if u.get("employee_type"): existing.employee_type = u["employee_type"]
        if u.get("employee_dob"): existing.employee_dob = u["employee_dob"]
        if u.get("employee_doj"): existing.employee_doj = u["employee_doj"]
        if u.get("lwd"): existing.lwd = u["lwd"]
        if u.get("effective_date"): existing.effective_date = u["effective_date"]
        if u.get("remarks"): existing.remarks = u["remarks"]
        if center_id: existing.center_id = center_id
        if dept_id: existing.department_id = dept_id
        parts = u["name"].split()
        existing.avatar = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else u["name"][:2].upper()
        updated += 1
        print(f"  Updated: {u['employee_id']:25s} {email}")
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
            city=u.get("city"), employee_dob=u.get("employee_dob"),
            employee_doj=u.get("employee_doj"), lwd=u.get("lwd"),
            effective_date=u.get("effective_date"), remarks=u.get("remarks"),
            department_id=dept_id, center_id=center_id, avatar=avatar, status=StatusEnum.Active,
        )
        db.add(new_user)
        added += 1
        print(f"  Added:   {u['employee_id']:25s} {email}")

db.commit()
print(f"\nUpdated {updated}, Added {added}")
print(f"Total users: {db.query(User).count()}")
db.close()
