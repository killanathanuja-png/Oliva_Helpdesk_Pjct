"""Add missing users from the screenshot."""
from app.database import SessionLocal
from app.models.models import User, Department, Center, StatusEnum
from app.auth import hash_password

db = SessionLocal()

dept_map = {d.name: d.id for d in db.query(Department).all()}
center_map = {c.name: c.id for c in db.query(Center).all()}
existing_emails = {u.email for u in db.query(User).all()}
existing_emp_ids = {u.employee_id for u in db.query(User).all() if u.employee_id}

last_user = db.query(User).order_by(User.id.desc()).first()
code_counter = (last_user.id + 1) if last_user else 1

new_users = [
    {"employee_id": "115566", "name": "Cluster Manager", "role": "Area Operations Manager, Area Operations Manager Head", "email": "", "gender": "F", "city": "Bengaluru", "location": "Whitefield", "reporting_to": "astha", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "BLR-WHF", "name": "White Field", "role": "Employee", "email": "whitefielddteam@olivaclinic.com", "designation": "Clinic Incharge", "city": "Bengaluru", "location": "Whitefield", "department": "CLCN", "mobile": "7337395720", "grade": "On-Roll"},
    {"employee_id": "CRT-BH", "name": "CRT-BH", "role": "Clinic Incharge", "map_level_access": "Can View", "designation": "Clinic Incharge", "city": "Hyderabad", "location": "Banjara Hills"},
    {"employee_id": "CRT-DN", "name": "CRT-DN", "role": "Clinic Incharge, Clinic Manager, Helpdesk In-charge", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Manager", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Hyderabad", "location": "Dilsukhnagar", "reporting_to": "HYD-AOM2"},
    {"employee_id": "CRT-GK2", "name": "CRT GK", "role": "Clinic Incharge, Clinic Manager", "map_level_access": "Can View and Edit", "gender": "F", "designation": "Clinic Manager", "city": "Delhi", "location": "Greater Kailash 2", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-KOK", "name": "CRT KOK", "role": "Clinic Incharge, Clinic Manager", "map_level_access": "Can View", "gender": "F", "city": "Hyderabad", "location": "Kokapet", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-PB", "name": "CRT - PB", "role": "Clinic Incharge, Clinic Manager", "map_level_access": "Can View and Edit", "gender": "F", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Kolkata", "location": "Park Street", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "CRT-PS", "name": "CRT PS", "role": "Clinic Incharge, Clinic Manager", "map_level_access": "Can View", "gender": "F", "city": "Vijayawada", "location": "Vijayawada", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "DivyaSripathy", "name": "Divya Sripathy", "role": "Clinic Incharge, Clinic Manager", "email": "jayanagartteam@olivaclinic.com", "map_level_access": "Can View and Edit", "designation": "Projects Team", "city": "Bengaluru", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "DL-PNB", "name": "West Punjabi Bagh", "role": "Employee", "gender": "M", "city": "Delhi", "reporting_to": "qfmsadmin", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "DL-PTH", "name": "Preetvihar Preetvihar", "role": "Employee", "gender": "M", "city": "Delhi", "location": "Preetvihar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Kol-Jodh", "name": "Kolkata Jodhpur", "role": "Employee", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Kolkata", "location": "Jodhpur", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "PUN-SHN", "name": "Shivaji Nagar Clinic", "role": "Employee", "gender": "M", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Pune", "location": "Shivaji Nagar", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "QFMSADMIN", "name": "QFMSADMIN", "role": "Global Admin, Help Desk Admin", "email": "gfmsadmin@olivaclinic.com", "map_level_access": "Can View and Edit", "gender": "M", "designation": "Administration", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Hyderabad", "location": "Begumpet HO", "department": "SUPT", "grade": "Off-Roll", "employee_type": "A"},
    {"employee_id": "Quality Audit", "name": "Quality Audit", "role": "QA", "map_level_access": "Can View and Edit", "designation": "Admin Member", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Hyderabad", "location": "Gachibowli", "department": "SUPT", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Venkatesh", "name": "Venkatesh T", "role": "Clinic Incharge", "map_level_access": "Can View", "gender": "M", "city": "Vizag", "location": "Dwaraka Nagar", "grade": "Off-Roll", "employee_type": "Off-Roll"},
    {"employee_id": "Karthik", "name": "Karthik Oliva", "role": "Clinic Incharge, Clinic Manager", "email": "sadashinagarteam@olivaclinic.com", "map_level_access": "Can View", "gender": "M", "designation": "Clinic Incharge", "entity": "Oliva", "vertical": "OLIVA", "costcenter": "OLIVA", "city": "Bengaluru", "location": "Sadashivnagar", "department": "CLCN", "grade": "Off-Roll", "employee_type": "Off-Roll"},
]

added = 0
skipped = 0

for u in new_users:
    email = (u.get("email") or "").strip().lower()
    emp_id = (u.get("employee_id") or "").strip()

    # Skip if email already exists
    if email and email in existing_emails:
        skipped += 1
        print(f"  Skip (email exists): {email}")
        continue

    # Skip if employee_id already exists
    if emp_id and emp_id in existing_emp_ids:
        skipped += 1
        print(f"  Skip (emp_id exists): {emp_id}")
        continue

    # Generate email for users without one
    if not email:
        email = f"{emp_id.lower().replace(' ', '')}@olivaclinic.com"
        if email in existing_emails:
            skipped += 1
            print(f"  Skip (generated email exists): {email}")
            continue

    name = u["name"].strip()
    parts = name.split()
    avatar = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else name[:2].upper()

    dept_id = dept_map.get((u.get("department") or "").strip()) or None
    center_id = center_map.get((u.get("location") or "").strip()) or None

    user_code = f"U{code_counter:03d}"
    code_counter += 1

    user = User(
        code=user_code,
        employee_id=emp_id or None,
        name=name,
        email=email,
        hashed_password=hash_password("oliva@123"),
        role=u.get("role", "Employee"),
        map_level_access=u.get("map_level_access") or None,
        designation=u.get("designation") or None,
        entity=u.get("entity") or None,
        vertical=u.get("vertical") or None,
        costcenter=u.get("costcenter") or None,
        gender=u.get("gender") or None,
        mobile=u.get("mobile") or None,
        reporting_to=u.get("reporting_to") or None,
        grade=u.get("grade") or None,
        employee_type=u.get("employee_type") or None,
        department_id=dept_id,
        center_id=center_id,
        avatar=avatar,
        status=StatusEnum.Active,
    )
    db.add(user)
    existing_emails.add(email)
    existing_emp_ids.add(emp_id)
    added += 1
    print(f"  Added: {name} ({email}) role={u.get('role')}")

db.commit()
print(f"\nAdded {added} new users, skipped {skipped}")
print(f"Total users now: {db.query(User).count()}")
db.close()
