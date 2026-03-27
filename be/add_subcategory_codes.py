"""Add all subcategory codes from the screenshot."""
from app.database import SessionLocal
from app.models.models import Subcategory, Category, StatusEnum

db = SessionLocal()

# Get first category as default (we don't know which category each belongs to yet)
default_cat = db.query(Category).first()
default_cat_id = default_cat.id if default_cat else None

existing_codes = {s.code for s in db.query(Subcategory).all()}

codes = [
    "AIC", "AT", "AUTH", "BC", "BCP", "BCS", "BDOBILLS", "BOCFDP", "BPMAT",
    "BPMCC", "BPMDRB", "BPMEAC", "BPMEAO", "BPMEAR", "BPMEAT",
    "BPMECC", "BPMECRT", "BPMEDR", "BPMEDRB", "BPMEFDB", "BPMEHI", "BPMEL",
    "BPMELP", "BPMEN", "BPMEO", "BPMEOS", "BPMEP", "BPMEPR", "BPMEPS", "BPMERF",
    "BPMERS", "BPMEST",
    "BPMET", "BPMETMT", "BPMEWT", "BPMEpq", "BPMFDB",
    "BPMOTH", "BPMT", "BPMTFT", "CAR", "CAS", "CC",
    "CIW", "CNA", "CPDEND", "DRB", "DRNC",
    "DSATCAC", "DSATCAO", "DSATCAR", "DSATCAT",
    "DSATCCC", "DSATCCRT", "DSATCDR", "DSATCDRB", "DSATCFDB", "DSATCHI",
    "DSATCL", "DSATCLP", "DSATCN", "DSATCO",
    "DSATCOS", "DSATCP", "DSATCPQ", "DSATCPR", "DSATCPS", "DSATCRF",
    "DSATCRS", "DSATCST", "DSATCT", "DSATCTMT",
    "DSATCWT", "DrBehaviour", "ECA", "ELS", "EMS", "EPC", "EQU", "Expriy", "FBAC",
    "FBAO", "FBAR", "FBAT", "FBC", "FBCC", "FBCRT", "FBDR", "FBDRB", "FBFDB", "FBHI",
    "FBL", "FBLP", "FBN", "FBOS", "FBOTH", "FBP", "FBPKG", "FBPQ", "FBPR", "FBPS",
    "FBRF", "FBRS", "FBST", "FBT", "FBTFT", "FBWT", "FDB",
    "FDBKAC", "FDBKAO", "FDBKAR",
    "FDBKCC", "FDBKCRT", "FDBKDR", "FDBKDRB", "FDBKFDB", "FDBKHI", "FDBKLP", "FDBKLT",
    "FDBKNC",
    "FDBKOS", "FDBKOTH", "FDBKPQ", "FDBKPR", "FDBKPROD", "FDBKPS", "FDBKRF", "FDBKRS",
    "FDBKST",
    "FDBKT", "FDBKTFT", "FDBKWT", "FDBehaviour",
    "FEEDCOF", "FEEDDS", "FEEDOT", "FEEDOTRS", "FEEDWPO", "FEEDWPR", "FOTH",
    "GAT", "GCC",
    "GFDBCAC", "GFDBCAO", "GFDBCAR", "GFDBCAT", "GFDBCCC", "GFDBCCRT", "GFDBCDRB",
    "GFDBCFDB", "GFDBCHI", "GFDBCL", "GFDBCLP", "GFDBCN", "GFDBCO", "GFDBCOS",
    "GFDBCP", "GFDBCPQ", "GFDBCPR",
    "GFDBCPS", "GFDBCRF", "GFDBCRS", "GFDBCST", "GFDBCT", "GFDBCTMT", "GFDBCWT",
    "GRAC", "GRAO", "GRAR",
    "GRCC", "GRCRT", "GRDR", "GRDRB", "GRFDB", "GRHI", "GRL", "GRLP", "GROS",
    "GROTH", "GRP", "GRPQ", "GRPR", "GRPS", "GRREFUND", "GRRS", "GRST", "GRTFT", "GRWT",
    "HAS", "IABC", "ICA", "INCP", "INCPKG",
    "INFOAT", "INFOCC", "INFORF", "INFOT",
    "JDAT", "JDDRB", "JDFDB", "JDOTH", "JDRF", "JDT", "JDTFT",
    "LOY", "MNCP", "MNCPKG", "MPR",
    "MSAC", "MSAO", "MSAR", "MSAT", "MSCC", "MSCRT", "MSDR", "MSDRB", "MSFDB", "MSHI",
    "MSL", "MSLP", "MSN", "MSO", "MSOS", "MSP", "MSPQ", "MSPR", "MSPS", "MSRF",
    "MSRS", "MSST", "MST", "MSTF", "MSWT",
    "NES", "OAS", "OTPI", "OrderRepmnt",
    "Others", "PAS", "PBC", "PCGLP", "PEC", "PIS", "PMC", "PNU", "PRJ", "PRO",
    "PRODAC", "PRODAO", "PRODAR", "PRODAT", "PRODCC", "PRODCRT", "PRODDR", "PRODDRB",
    "PRODFDB", "PRODHI",
    "PRODL", "PRODLP", "PRODN", "PRODOS", "PRODP", "PRODPQ", "PRODPR", "PRODPS",
    "PRODRS", "PRODST",
    "PRODTMT", "PRODWT", "PRS", "PWM", "ProductConcern",
    "REAT", "REM", "REP", "RF", "Refund",
    "SEAC", "SEAO", "SEAR", "SEAT", "SECC", "SECRT", "SEDR", "SEDRB", "SEFDB", "SEHI",
    "SEL", "SELP", "SEN", "SEO", "SEOS", "SEP", "SEPQ", "SEPR", "SEPS", "SERF",
    "SERS", "SES", "SEST", "SET", "SETMT", "SEWT",
    "SFDBKAC", "SFDBKAO", "SFDBKAR", "SFDBKAT",
    "SFDBKCC", "SFDBKCRT", "SFDBKDR", "SFDBKDRB", "SFDBKFDB", "SFDBKHI", "SFDBKL",
    "SFDBKLP", "SFDBKN", "SFDBKO",
    "SFDBKOS", "SFDBKP", "SFDBKPQ", "SFDBKPR", "SFDBKPS", "SFDBKRF", "SFDBKRS",
    "SFDBKST", "SFDBKT", "SFDBKTMT",
    "SFDBKWT",
    "SOS", "TCC", "TEL", "THFT", "TR",
    "TSCAC", "TSCAO", "TSCAR", "TSCAT",
    "TSCCC", "TSCCRT", "TSCDR", "TSCDRB", "TSCFDB", "TSCHI", "TSCL", "TSCLP",
    "TSCN", "TSCO",
    "TSCOS", "TSCP", "TSCPQ", "TSCPR", "TSCPS", "TSCRF", "TSCRS", "TSCST", "TSCT",
    "TSCTMT",
    "TSCWT",
    "TWAC", "TWAO", "TWAR", "TWAT", "TWCRT", "TWDR", "TWDRB", "TWFDB", "TWHI",
    "TWL", "TWLP", "TWN", "TWOS", "TWOTH", "TWP", "TWPQ", "TWPR", "TWPS", "TWRF",
    "TWRS", "TWST", "TWT", "TWTFT", "TWWT",
    "Treatment", "UAEP", "UP", "VEP", "WAM",
    "WC", "WE",
    "WEBAC", "WEBAO", "WEBAR", "WEBCRT", "WEBDR", "WEBHI", "WEBL", "WEBLP",
    "WEBN", "WEBOS", "WEBP", "WEBPQ", "WEBPR", "WEBPS", "WEBRS", "WEBST", "WEBWT",
    "WECC", "WEDRB", "WEFDB", "WEGAT", "WEOTH", "WEREFUND", "WETFT",
    "WRP", "WRPRODUCT",
]

added = 0
last = db.query(Subcategory).order_by(Subcategory.id.desc()).first()
counter = (last.id + 1) if last else 1

for code in codes:
    if code not in existing_codes:
        sub = Subcategory(
            code=code,
            name=code,  # Use code as name for now
            category_id=default_cat_id,
            status=StatusEnum.Active,
        )
        db.add(sub)
        added += 1

db.commit()
total = db.query(Subcategory).count()
print(f"Added {added} subcategories. Total: {total}")
db.close()
