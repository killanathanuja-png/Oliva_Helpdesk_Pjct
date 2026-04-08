from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import AdminMainCategory, AdminModule, AdminSubCategory, AdminChildCategory, StatusEnum

router = APIRouter(prefix="/api/admin-masters", tags=["Admin Masters"])


# Response schemas
class AdminChildCategoryResponse(BaseModel):
    id: int
    name: str
    sub_category_id: int
    status: Optional[str] = "Active"
    class Config:
        from_attributes = True


class AdminSubCategoryResponse(BaseModel):
    id: int
    name: str
    module_id: int
    status: Optional[str] = "Active"
    child_categories: list[AdminChildCategoryResponse] = []
    class Config:
        from_attributes = True


class AdminModuleResponse(BaseModel):
    id: int
    name: str
    main_category_id: int
    status: Optional[str] = "Active"
    sub_categories: list[AdminSubCategoryResponse] = []
    class Config:
        from_attributes = True


class AdminMainCategoryResponse(BaseModel):
    id: int
    name: str
    status: Optional[str] = "Active"
    modules: list[AdminModuleResponse] = []
    class Config:
        from_attributes = True


# Create schemas
class CreateMainCategory(BaseModel):
    name: str


class CreateModule(BaseModel):
    name: str
    main_category_id: int


class CreateSubCategory(BaseModel):
    name: str
    module_id: int


class CreateChildCategory(BaseModel):
    name: str
    sub_category_id: int


# Helper
def _mc_response(mc):
    return AdminMainCategoryResponse(
        id=mc.id, name=mc.name,
        status=mc.status.value if mc.status else "Active",
        modules=[
            AdminModuleResponse(
                id=m.id, name=m.name, main_category_id=m.main_category_id,
                status=m.status.value if m.status else "Active",
                sub_categories=[
                    AdminSubCategoryResponse(
                        id=s.id, name=s.name, module_id=s.module_id,
                        status=s.status.value if s.status else "Active",
                        child_categories=[
                            AdminChildCategoryResponse(
                                id=c.id, name=c.name, sub_category_id=c.sub_category_id,
                                status=c.status.value if c.status else "Active"
                            ) for c in (s.child_categories or []) if c.status == StatusEnum.Active
                        ]
                    ) for s in (m.sub_categories or []) if s.status == StatusEnum.Active
                ]
            ) for m in (mc.modules or []) if m.status == StatusEnum.Active
        ]
    )


# --- Main Categories ---
@router.get("/main-categories", response_model=list[AdminMainCategoryResponse])
def list_main_categories(db: Session = Depends(get_db)):
    items = db.query(AdminMainCategory).options(
        joinedload(AdminMainCategory.modules)
        .joinedload(AdminModule.sub_categories)
        .joinedload(AdminSubCategory.child_categories)
    ).filter(AdminMainCategory.status == StatusEnum.Active).order_by(AdminMainCategory.name).all()
    return [_mc_response(mc) for mc in items]


@router.post("/main-categories", response_model=AdminMainCategoryResponse, status_code=201)
def create_main_category(req: CreateMainCategory, db: Session = Depends(get_db)):
    mc = AdminMainCategory(name=req.name)
    db.add(mc); db.commit(); db.refresh(mc)
    return _mc_response(mc)


@router.put("/main-categories/{id}", response_model=AdminMainCategoryResponse)
def update_main_category(id: int, req: CreateMainCategory, db: Session = Depends(get_db)):
    mc = db.query(AdminMainCategory).filter(AdminMainCategory.id == id).first()
    if not mc: raise HTTPException(404, "Not found")
    mc.name = req.name
    db.commit(); db.refresh(mc)
    return _mc_response(mc)


@router.delete("/main-categories/{id}")
def delete_main_category(id: int, db: Session = Depends(get_db)):
    mc = db.query(AdminMainCategory).filter(AdminMainCategory.id == id).first()
    if not mc: raise HTTPException(404, "Not found")
    mc.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Modules ---
@router.get("/modules", response_model=list[AdminModuleResponse])
def list_modules(db: Session = Depends(get_db)):
    return db.query(AdminModule).options(
        joinedload(AdminModule.sub_categories).joinedload(AdminSubCategory.child_categories)
    ).filter(AdminModule.status == StatusEnum.Active).order_by(AdminModule.name).all()


@router.post("/modules", response_model=AdminModuleResponse, status_code=201)
def create_module(req: CreateModule, db: Session = Depends(get_db)):
    m = AdminModule(name=req.name, main_category_id=req.main_category_id)
    db.add(m); db.commit(); db.refresh(m)
    return AdminModuleResponse(id=m.id, name=m.name, main_category_id=m.main_category_id, status="Active")


@router.put("/modules/{id}")
def update_module(id: int, req: CreateModule, db: Session = Depends(get_db)):
    m = db.query(AdminModule).filter(AdminModule.id == id).first()
    if not m: raise HTTPException(404, "Not found")
    m.name = req.name
    m.main_category_id = req.main_category_id
    db.commit(); db.refresh(m)
    return {"id": m.id, "name": m.name, "main_category_id": m.main_category_id, "status": m.status.value}


@router.delete("/modules/{id}")
def delete_module(id: int, db: Session = Depends(get_db)):
    m = db.query(AdminModule).filter(AdminModule.id == id).first()
    if not m: raise HTTPException(404, "Not found")
    m.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Sub Categories ---
@router.post("/sub-categories", status_code=201)
def create_sub_category(req: CreateSubCategory, db: Session = Depends(get_db)):
    s = AdminSubCategory(name=req.name, module_id=req.module_id)
    db.add(s); db.commit(); db.refresh(s)
    return {"id": s.id, "name": s.name, "module_id": s.module_id, "status": "Active"}


@router.put("/sub-categories/{id}")
def update_sub_category(id: int, req: CreateSubCategory, db: Session = Depends(get_db)):
    s = db.query(AdminSubCategory).filter(AdminSubCategory.id == id).first()
    if not s: raise HTTPException(404, "Not found")
    s.name = req.name; s.module_id = req.module_id
    db.commit(); db.refresh(s)
    return {"id": s.id, "name": s.name, "module_id": s.module_id, "status": s.status.value}


@router.delete("/sub-categories/{id}")
def delete_sub_category(id: int, db: Session = Depends(get_db)):
    s = db.query(AdminSubCategory).filter(AdminSubCategory.id == id).first()
    if not s: raise HTTPException(404, "Not found")
    s.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Child Categories ---
@router.get("/child-categories", response_model=list[AdminChildCategoryResponse])
def list_child_categories(db: Session = Depends(get_db)):
    return db.query(AdminChildCategory).filter(AdminChildCategory.status == StatusEnum.Active).order_by(AdminChildCategory.name).all()


@router.post("/child-categories", status_code=201)
def create_child_category(req: CreateChildCategory, db: Session = Depends(get_db)):
    c = AdminChildCategory(name=req.name, sub_category_id=req.sub_category_id)
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name, "sub_category_id": c.sub_category_id, "status": "Active"}


@router.put("/child-categories/{id}")
def update_child_category(id: int, req: CreateChildCategory, db: Session = Depends(get_db)):
    c = db.query(AdminChildCategory).filter(AdminChildCategory.id == id).first()
    if not c: raise HTTPException(404, "Not found")
    c.name = req.name; c.sub_category_id = req.sub_category_id
    db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name, "sub_category_id": c.sub_category_id, "status": c.status.value}


@router.delete("/child-categories/{id}")
def delete_child_category(id: int, db: Session = Depends(get_db)):
    c = db.query(AdminChildCategory).filter(AdminChildCategory.id == id).first()
    if not c: raise HTTPException(404, "Not found")
    c.status = StatusEnum.Inactive; db.commit()
    return {"message": "Deleted"}


# --- Seed Data ---
@router.post("/seed-categories")
def seed_categories(db: Session = Depends(get_db)):
    """Seed the admin category hierarchy with FM Call / HELPDESK data."""
    SEED_DATA = {
        "FM Call": {
            "HELPDESK": {
                "Air Conditioner": ["Others","Filter cleaning","Bad Odour","No air flow","Excessive sound from indoor unit","Water Leakage from indoor unit","Remote holder not available","Remote not working","Uneven Heating or Cooling","Excessive / less cooling","Cooling is not sufficiant","Not Switching ON"],
                "Carpentry Service": ["Window Blands replacement","Window Blands Repair","Wall skirting","Photo Frames Fitting","Others","keyboard trays","Furniture finishing","Chair Hydric issues","Chair wheels","Tables","Footrest","Glass door handle","Glass Cupboards replacement","Glass fitting issues","Glass doors issues","Wooden doors","Key set replacment","Key set repair","Cupboards channel","Cupboards Hinges","Cupboards handle","Cupboards","Complete Woodworks"],
                "Civil Works": ["Damage wall repair","Tiles Work","Brick Walls","POP works"],
                "Electrical Services": ["Others","Exhaust fans repair","Internet Modam issues","Low Speed","Internet Issue","Data Card issue","Telephone wire replacement","New Line installation","EPABX Repair","Telephone Repair","Buzzers issues","MCB issues","Switch board issues","Sign board light not working","CFL light not working","LED light not working","Fan repairs","Fans not working pantry","Speaker controler issues","Speaker problem","Music System","Smoke detector replacement","Smoke detector not blinking","Low Battery Error from Panel","Beep Sound from Alarm","Fire Alarm panel not working","CCTV Camera","Back up Issues","Battery replacement","UPS smell  issue","UPS error / repair","Stabilizers","Projectors","Not switching ON in auto mode","Engine Oil leakage","Coolent Leakage","Servicing Due","Low Battery","Generators not switching ON"],
                "Emergency Service": ["Others","Cable Wiring","Fire Extingusher servicing","Fire Incident","Electrical Short Circuit"],
                "Equipment": ["Others","Lamp replacement","Water filter replacement","Inter Lens isses","Window Lens issues","MDA filter issue","Machine wheels problem","Hand piece holder replacement","Hand piece shifting","Hand piece \"O\" replacement","Power cord problem","Client Goggle requirment","Goggle requirment","Water filling","Machine shfting","Tips Issues","Foot Pedal Issues","Water Leakage","Hand piece Error","Display error","Not working"],
                "Hardware Support": ["Others","Printer Toner & Drum","Data Card","Mouse, Mouse-pad","Keyboard","Scanner","Printer","Computer Peripherals"],
                "Network Support": ["Others","Outlook configration","Email configration","Email Storage issues","Wifi","Server","LAN","Internet"],
                "Office Administration Support": ["Conference Hall booking","Others","Bio Matrix issues","Newspapers & Magazines","ID Cards","Valet parking Tag requirement","Valet Parking driver issues","Carpet cleaning","Water purifier issues","Sofa Washing","Sofa Repairs"],
                "Painting Service": ["Paint removal","Paint new/ existing interiors","Apply wall coverings, coatings, and spray finishes","Painting Touch-up"],
                "Pantry Services": ["Others","Refrigerator issues","Microwave Oven","Coffee Machine"],
                "Pest Control": ["Others","Rodent Treatment (Gum Pad Placement)","Spray for cockroach & flies & Mosquitoes"],
                "Plumbing & Water Management": ["Others","Bad Odour","restroom tissues dispenser","Rest room hand dryers","Washbasin Replace / Repair","Tissues paper roll holder","W/C Replace / Repair","Water leakages","restroom flush issues","restroom sink","Rest Room Towels Hanger fitting","Plumbing Fixtures","Pipes & Taps issues","Health Faucet holder","Health Faucet water pressure","Health Faucet Repair"],
                "Printing & Stationery": ["Others","Branding prints, goodie bags etc","Envelopes, Letterheads & Forms"],
                "Procurment": ["Others","Z Trolley","Pen Drive","Computer Table","Round chair","Clinic Stamp","Derm lite DL1 & Iphone 4 S","Microwave","Refrigerator","Mini Refrigerator","Camera","Dust Bin Steel Big","Dust Bin Steel Small","Dust Bin Steel leg","Poster","Sharp Container","Needle Burner","Green Bags 17X24 5KG","Yellow Bags 17X24 5KG","Red Bags 17X24 5KG","Yellow bins 15LTS","Red bins 15LTS","Normal Phone","Mobile phone","Electronics safety locker","Crockery set & Cutlery Set, Mircrowave bowls","Wireless Router","Printer","External HDD 1TB","Laptop","Systems","Centrifuge","Blankets","Bed Covers","Bath robe","Back Peel gowns","Peel gowns","Peel towel L","Peel towel M","Peel towel S","DustBin replacement"],
                "Project Services": ["New lights/furniture","Reception shadow Lights","New tables/chairs","Wallpaper damage","Toughened Glass Broken","Floor tiles","Grid ceiling"],
                "Real Estate Management": ["Others","Structural Leakage/Damage"],
                "Security Services": ["Others","Uniform / Grooming","Man Power availability issues","Theft incident"],
                "Software Support": ["Tally Software installation","Billing Software installation","CRM Application","Others","Operating System","Installation","Application","Corel Draw Software","Antivirus","Adobe"],
                "Vehicle Request": ["request for pick up  & drop, Machine shifting"],
                "Waste Management": ["Others","General garbbage collection","Bio-waste collection"],
            }
        }
    }

    created_counts = {"categories": 0, "modules": 0, "main_categories": 0, "sub_categories": 0}

    for cat_name, modules in SEED_DATA.items():
        # Level 1: Category (AdminMainCategory)
        mc = db.query(AdminMainCategory).filter(AdminMainCategory.name == cat_name, AdminMainCategory.status == StatusEnum.Active).first()
        if not mc:
            mc = AdminMainCategory(name=cat_name)
            db.add(mc); db.flush()
            created_counts["categories"] += 1

        for mod_name, main_cats in modules.items():
            # Level 2: Module (AdminModule)
            mod = db.query(AdminModule).filter(AdminModule.name == mod_name, AdminModule.main_category_id == mc.id, AdminModule.status == StatusEnum.Active).first()
            if not mod:
                mod = AdminModule(name=mod_name, main_category_id=mc.id)
                db.add(mod); db.flush()
                created_counts["modules"] += 1

            for main_cat_name, sub_cats in main_cats.items():
                # Level 3: Main Category (AdminSubCategory)
                sc = db.query(AdminSubCategory).filter(AdminSubCategory.name == main_cat_name, AdminSubCategory.module_id == mod.id, AdminSubCategory.status == StatusEnum.Active).first()
                if not sc:
                    sc = AdminSubCategory(name=main_cat_name, module_id=mod.id)
                    db.add(sc); db.flush()
                    created_counts["main_categories"] += 1

                for sub_cat_name in sub_cats:
                    # Level 4: Sub Category (AdminChildCategory)
                    cc = db.query(AdminChildCategory).filter(AdminChildCategory.name == sub_cat_name, AdminChildCategory.sub_category_id == sc.id, AdminChildCategory.status == StatusEnum.Active).first()
                    if not cc:
                        cc = AdminChildCategory(name=sub_cat_name, sub_category_id=sc.id)
                        db.add(cc); db.flush()
                        created_counts["sub_categories"] += 1

    db.commit()
    return {"message": "Seed completed", "created": created_counts}


# --- Location Assignments & Escalation Matrix ---

@router.get("/location-assignments")
def list_location_assignments(db: Session = Depends(get_db)):
    from sqlalchemy import text
    result = db.execute(text("SELECT * FROM admin_location_assignment ORDER BY location"))
    return [dict(row._mapping) for row in result]


@router.get("/escalation-matrix")
def list_escalation_matrix(db: Session = Depends(get_db)):
    from sqlalchemy import text
    result = db.execute(text("SELECT * FROM admin_escalation_matrix ORDER BY location"))
    return [dict(row._mapping) for row in result]
