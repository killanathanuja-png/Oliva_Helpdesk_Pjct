"""Seed admin category hierarchy: FM Call > HELPDESK > Main Categories > Sub Categories"""
from app.database import SessionLocal
from app.models.models import AdminMainCategory, AdminModule, AdminSubCategory, AdminChildCategory, StatusEnum

db = SessionLocal()

SEED_DATA = {
    "FM Call": {
        "HELPDESK": {
            "Air Conditioner": ["Others","Filter cleaning","Bad Odour","No air flow","Excessive sound from indoor unit","Water Leakage from indoor unit","Remote holder not available","Remote not working","Uneven Heating or Cooling","Excessive / less cooling","Cooling is not sufficiant","Not Switching ON"],
            "Carpentry Service": ["Window Blands replacement","Window Blands Repair","Wall skirting","Photo Frames Fitting","Others","keyboard trays","Furniture finishing","Chair Hydric issues","Chair wheels","Tables","Footrest","Glass door handle","Glass Cupboards replacement","Glass fitting issues","Glass doors issues","Wooden doors","Key set replacment","Key set repair","Cupboards channel","Cupboards Hinges","Cupboards handle","Cupboards","Complete Woodworks"],
            "Civil Works": ["Damage wall repair","Tiles Work","Brick Walls","POP works"],
            "Electrical Services": ["Others","Exhaust fans repair","Internet Modam issues","Low Speed","Internet Issue","Data Card issue","Telephone wire replacement","New Line installation","EPABX Repair","Telephone Repair","Buzzers issues","MCB issues","Switch board issues","Sign board light not working","CFL light not working","LED light not working","Fan repairs","Fans not working pantry","Speaker controler issues","Speaker problem","Music System","Smoke detector replacement","Smoke detector not blinking","Low Battery Error from Panel","Beep Sound from Alarm","Fire Alarm panel not working","CCTV Camera","Back up Issues","Battery replacement","UPS smell issue","UPS error / repair","Stabilizers","Projectors","Not switching ON in auto mode","Engine Oil leakage","Coolent Leakage","Servicing Due","Low Battery","Generators not switching ON"],
            "Emergency Service": ["Others","Cable Wiring","Fire Extingusher servicing","Fire Incident","Electrical Short Circuit"],
            "Equipment": ["Others","Lamp replacement","Water filter replacement","Inter Lens isses","Window Lens issues","MDA filter issue","Machine wheels problem","Hand piece holder replacement","Hand piece shifting","Hand piece O replacement","Power cord problem","Client Goggle requirment","Goggle requirment","Water filling","Machine shfting","Tips Issues","Foot Pedal Issues","Water Leakage","Hand piece Error","Display error","Not working"],
            "Hardware Support": ["Others","Printer Toner and Drum","Data Card","Mouse, Mouse-pad","Keyboard","Scanner","Printer","Computer Peripherals"],
            "Network Support": ["Others","Outlook configration","Email configration","Email Storage issues","Wifi","Server","LAN","Internet"],
            "Office Administration Support": ["Conference Hall booking","Others","Bio Matrix issues","Newspapers and Magazines","ID Cards","Valet parking Tag requirement","Valet Parking driver issues","Carpet cleaning","Water purifier issues","Sofa Washing","Sofa Repairs"],
            "Painting Service": ["Paint removal","Paint new/ existing interiors","Apply wall coverings, coatings, and spray finishes","Painting Touch-up"],
            "Pantry Services": ["Others","Refrigerator issues","Microwave Oven","Coffee Machine"],
            "Pest Control": ["Others","Rodent Treatment (Gum Pad Placement)","Spray for cockroach and flies and Mosquitoes"],
            "Plumbing & Water Management": ["Others","Bad Odour","restroom tissues dispenser","Rest room hand dryers","Washbasin Replace / Repair","Tissues paper roll holder","W/C Replace / Repair","Water leakages","restroom flush issues","restroom sink","Rest Room Towels Hanger fitting","Plumbing Fixtures","Pipes and Taps issues","Health Faucet holder","Health Faucet water pressure","Health Faucet Repair"],
            "Printing & Stationery": ["Others","Branding prints, goodie bags etc","Envelopes, Letterheads and Forms"],
            "Procurment": ["Others","Z Trolley","Pen Drive","Computer Table","Round chair","Clinic Stamp","Derm lite DL1 and Iphone 4 S","Microwave","Refrigerator","Mini Refrigerator","Camera","Dust Bin Steel Big","Dust Bin Steel Small","Dust Bin Steel leg","Poster","Sharp Container","Needle Burner","Green Bags 17X24 5KG","Yellow Bags 17X24 5KG","Red Bags 17X24 5KG","Yellow bins 15LTS","Red bins 15LTS","Normal Phone","Mobile phone","Electronics safety locker","Crockery set and Cutlery Set, Mircrowave bowls","Wireless Router","Printer","External HDD 1TB","Laptop","Systems","Centrifuge","Blankets","Bed Covers","Bath robe","Back Peel gowns","Peel gowns","Peel towel L","Peel towel M","Peel towel S","DustBin replacement"],
            "Project Services": ["New lights/furniture","Reception shadow Lights","New tables/chairs","Wallpaper damage","Toughened Glass Broken","Floor tiles","Grid ceiling"],
            "Real Estate Management": ["Others","Structural Leakage/Damage"],
            "Security Services": ["Others","Uniform / Grooming","Man Power availability issues","Theft incident"],
            "Software Support": ["Tally Software installation","Billing Software installation","CRM Application","Others","Operating System","Installation","Application","Corel Draw Software","Antivirus","Adobe"],
            "Vehicle Request": ["request for pick up and drop, Machine shifting"],
            "Waste Management": ["Others","General garbbage collection","Bio-waste collection"],
        }
    }
}

counts = {"categories": 0, "modules": 0, "main_categories": 0, "sub_categories": 0}

for cat_name, modules in SEED_DATA.items():
    mc = db.query(AdminMainCategory).filter(AdminMainCategory.name == cat_name, AdminMainCategory.status == StatusEnum.Active).first()
    if not mc:
        mc = AdminMainCategory(name=cat_name)
        db.add(mc)
        db.flush()
        counts["categories"] += 1

    for mod_name, main_cats in modules.items():
        mod = db.query(AdminModule).filter(AdminModule.name == mod_name, AdminModule.main_category_id == mc.id, AdminModule.status == StatusEnum.Active).first()
        if not mod:
            mod = AdminModule(name=mod_name, main_category_id=mc.id)
            db.add(mod)
            db.flush()
            counts["modules"] += 1

        for main_cat_name, sub_cats in main_cats.items():
            sc = db.query(AdminSubCategory).filter(AdminSubCategory.name == main_cat_name, AdminSubCategory.module_id == mod.id, AdminSubCategory.status == StatusEnum.Active).first()
            if not sc:
                sc = AdminSubCategory(name=main_cat_name, module_id=mod.id)
                db.add(sc)
                db.flush()
                counts["main_categories"] += 1

            for sub_cat_name in sub_cats:
                cc = db.query(AdminChildCategory).filter(AdminChildCategory.name == sub_cat_name, AdminChildCategory.sub_category_id == sc.id, AdminChildCategory.status == StatusEnum.Active).first()
                if not cc:
                    cc = AdminChildCategory(name=sub_cat_name, sub_category_id=sc.id)
                    db.add(cc)
                    db.flush()
                    counts["sub_categories"] += 1

db.commit()
print(f"Seed completed: {counts}")
db.close()
