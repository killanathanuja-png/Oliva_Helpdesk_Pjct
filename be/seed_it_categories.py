"""Seed IT Department categories and subcategories."""
from app.database import SessionLocal
from app.models.models import Category, Subcategory, Department, StatusEnum

db = SessionLocal()

dept = db.query(Department).filter(Department.name == "IT Department").first()
if not dept:
    print("IT Department not found")
    exit()

IT_DATA = {
    "Hardware": ["Laptop - repair", "Laptop - replacement", "Desktop - repair", "Desktop - replacement", "iPad - repair", "iPad - replacement", "iPad - storage", "Monitor - repair", "Monitor - replacement", "Power supply issue", "Cable issue"],
    "Printer & Consumables": ["Printer not working", "Cartridge replacement", "Toner replacement", "Paper jam", "Network printer setup"],
    "Internet & Network": ["No internet connectivity", "Slow internet speed", "Wi-Fi connection issue"],
    "Email & Communication": ["Cannot send email", "Cannot receive email", "New email account setup", "Password reset", "Email storage / quota"],
    "CCTV & Security": ["Camera offline", "Camera not recording", "DVR issue", "NVR issue", "Footage retrieval request", "New camera installation", "CCTV storage full", "HDD full"],
    "Software & Applications": ["Software installation", "Software update", "Application crash", "Application error", "Antivirus issue", "Malware issue", "Operating system issue", "License / activation issue", "Remote desktop access", "VPN access"],
    "User Access & Accounts": ["New user account creation", "Account locked", "Account disabled", "Password reset"],
    "Consumables & Supplies": ["Printer cartridge / toner", "Keyboard replacement", "Mouse replacement", "USB / cable / adapter", "Headset replacement"],
}

cat_count = 0
sub_count = 0
cat_num = 100  # Start IT cats at IT001

for cat_name, subs in IT_DATA.items():
    existing = db.query(Category).filter(Category.name == cat_name, Category.department_id == dept.id).first()
    if not existing:
        cat_num += 1
        cat = Category(code=f"IT{str(cat_num).zfill(3)}", name=cat_name, department_id=dept.id)
        db.add(cat)
        db.flush()
        cat_count += 1
    else:
        cat = existing

    for sub_name in subs:
        existing_sub = db.query(Subcategory).filter(Subcategory.name == sub_name, Subcategory.category_id == cat.id).first()
        if not existing_sub:
            sub = Subcategory(code=f"ITS{cat.id}{db.query(Subcategory).filter(Subcategory.category_id == cat.id).count() + 1:03d}", name=sub_name, category_id=cat.id)
            db.add(sub)
            db.flush()
            sub_count += 1

db.commit()
print(f"Created {cat_count} categories, {sub_count} subcategories for IT Department")
db.close()
