import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey, Enum as SAEnum, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Many-to-many: users <-> centers (for AOM managing multiple locations)
user_centers = Table(
    "user_centers",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("center_id", Integer, ForeignKey("centers.id"), primary_key=True),
)


# --- Enums ---

class PriorityEnum(str, enum.Enum):
    Critical = "Critical"
    High = "High"
    Medium = "Medium"
    Low = "Low"


class TicketStatusEnum(str, enum.Enum):
    Open = "Open"
    InProgress = "In Progress"
    FollowUp = "Follow Up"
    PendingApproval = "Pending Approval"
    Approved = "Approved"
    Acknowledged = "Acknowledged"
    AwaitingUserInputs = "Awaiting User Inputs"
    UserInputsReceived = "User Inputs Received"
    Resolved = "Resolved"
    Closed = "Closed"
    Rejected = "Rejected"
    EscalatedL1 = "Escalated to L1"
    EscalatedL2 = "Escalated to L2"
    ReopenedByCDD = "Reopened by CDD"
    FinalClosed = "Final Closed"


class UserRoleEnum(str, enum.Enum):
    SuperAdmin = "Super Admin"
    Admin = "Admin"
    Manager = "Manager"
    AOM = "AOM"
    Finance = "Finance"
    ZenotiTeam = "Zenoti Team"
    User = "User"


class StatusEnum(str, enum.Enum):
    Active = "Active"
    Inactive = "Inactive"


class ApprovalStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Rejected = "Rejected"


class CommentTypeEnum(str, enum.Enum):
    comment = "comment"
    status_change = "status_change"
    approval = "approval"


class NotificationTypeEnum(str, enum.Enum):
    info = "info"
    warning = "warning"
    success = "success"
    error = "error"


# --- Models ---

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    head = Column(String(100))
    sla_hours = Column(Integer, default=24)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="department_rel")
    categories = relationship("Category", back_populates="department_rel")
    sla_configs = relationship("SLAConfig", back_populates="department_rel")


class Center(Base):
    __tablename__ = "centers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    location_code = Column(String(20), nullable=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100))
    state = Column(String(100))
    department = Column(String(100))
    contact_person = Column(String(100))
    phone = Column(String(20))
    address = Column(String(300))
    pincode = Column(String(10))
    latitude = Column(String(20))
    longitude = Column(String(20))
    zone = Column(String(50))
    country = Column(String(50), default="India")
    center_manager_email = Column(String(150), nullable=True)
    aom_email = Column(String(150), nullable=True)
    branch_email = Column(String(200), nullable=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="center_rel")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    permissions = Column(Text)  # JSON string of permissions
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Designation(Base):
    __tablename__ = "designations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), unique=True, nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), nullable=False)
    employee_id = Column(String(30), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(100), default="User")
    map_level_access = Column(String(50), nullable=True)
    designation = Column(String(100), nullable=True)
    gender = Column(String(10), nullable=True)
    entity = Column(String(50), nullable=True)
    vertical = Column(String(50), nullable=True)
    costcenter = Column(String(50), nullable=True)
    mobile = Column(String(20), nullable=True)
    reporting_to = Column(String(100), nullable=True)
    grade = Column(String(50), nullable=True)
    employee_type = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    employee_dob = Column(String(30), nullable=True)
    employee_doj = Column(String(30), nullable=True)
    lwd = Column(String(30), nullable=True)
    effective_date = Column(String(30), nullable=True)
    remarks = Column(String(500), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    center_id = Column(Integer, ForeignKey("centers.id"), nullable=True)
    avatar = Column(String(10))
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    department_rel = relationship("Department", back_populates="users")
    center_rel = relationship("Center", back_populates="users")
    managed_centers = relationship("Center", secondary=user_centers, backref="managed_by_users")
    tickets_raised = relationship("Ticket", back_populates="raised_by_rel", foreign_keys="Ticket.raised_by_id")
    tickets_assigned = relationship("Ticket", back_populates="assigned_to_rel", foreign_keys="Ticket.assigned_to_id")


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    login_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    logout_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    role = Column(String(100), nullable=True)
    module = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    login_source = Column(String(50), default="Web browser")
    remarks = Column(String(500), nullable=True)

    user_rel = relationship("User")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    module = Column(String(100), nullable=True)
    description = Column(Text)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    department_rel = relationship("Department", back_populates="categories")
    subcategories = relationship("Subcategory", back_populates="category_rel")


class Subcategory(Base):
    __tablename__ = "subcategories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category_rel = relationship("Category", back_populates="subcategories")
    service_titles = relationship("ServiceTitle", back_populates="subcategory_rel")


class ChildCategory(Base):
    __tablename__ = "child_categories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    module = Column(String(100), nullable=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    subcategory_rel = relationship("Subcategory")
    category_rel = relationship("Category")


class ServiceTitle(Base):
    __tablename__ = "service_titles"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=False)
    priority = Column(SAEnum(PriorityEnum), default=PriorityEnum.Medium)
    sla_hours = Column(Integer, default=24)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category_rel = relationship("Category")
    subcategory_rel = relationship("Subcategory", back_populates="service_titles")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    sub_category = Column(String(100))
    priority = Column(SAEnum(PriorityEnum), default=PriorityEnum.Medium)
    status = Column(SAEnum(TicketStatusEnum), default=TicketStatusEnum.Open)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raised_by_dept = Column(String(100))
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_dept = Column(String(100))
    center = Column(String(150))
    due_date = Column(DateTime(timezone=True))
    sla_breached = Column(Boolean, default=False)
    approval_required = Column(Boolean, default=False)
    approval_type = Column(String(50), nullable=True)  # "aom_finance", "aom_only", or null (no approval)
    approver = Column(String(100))
    approval_status = Column(SAEnum(ApprovalStatusEnum), nullable=True)
    resolution = Column(Text)
    # Zenoti-specific fields
    zenoti_location = Column(String(200))
    zenoti_main_category = Column(String(100))
    zenoti_sub_category = Column(String(100))
    zenoti_child_category = Column(String(100))
    zenoti_mobile_number = Column(String(20))
    zenoti_customer_id = Column(String(50))
    zenoti_customer_name = Column(String(100))
    zenoti_billed_by = Column(String(100))
    zenoti_invoice_no = Column(String(50))
    zenoti_invoice_date = Column(String(20))
    zenoti_amount = Column(String(50))
    zenoti_description = Column(Text)

    # CDD Escalation fields
    escalation_level = Column(Integer, default=0)  # 0=None, 1=L1 Dept Head, 2=L2 CXO
    escalated_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    raised_by_rel = relationship("User", back_populates="tickets_raised", foreign_keys=[raised_by_id])
    assigned_to_rel = relationship("User", back_populates="tickets_assigned", foreign_keys=[assigned_to_id])
    escalated_to_rel = relationship("User", foreign_keys=[escalated_to_id])
    comments = relationship("TicketComment", back_populates="ticket_rel", cascade="all, delete-orphan")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    user = Column(String(100))
    message = Column(Text)
    type = Column(SAEnum(CommentTypeEnum), default=CommentTypeEnum.comment)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket_rel = relationship("Ticket", back_populates="comments")


class SLAConfig(Base):
    __tablename__ = "sla_configs"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    priority = Column(SAEnum(PriorityEnum), nullable=False)
    response_time_hrs = Column(Float, default=4)
    resolution_time_hrs = Column(Float, default=24)
    escalation_level1_hrs = Column(Float, default=8)
    escalation_level2_hrs = Column(Float, default=24)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    department_rel = relationship("Department", back_populates="sla_configs")


class AOMCenterMapping(Base):
    """Maps AOM (Area Operations Manager) to Center Managers and their Centers."""
    __tablename__ = "aom_center_mappings"

    id = Column(Integer, primary_key=True, index=True)
    aom_name = Column(String(100), nullable=False)
    aom_email = Column(String(150), nullable=True)
    cm_name = Column(String(100), nullable=False)
    cm_email = Column(String(150), nullable=True)
    center_name = Column(String(200), nullable=False)
    location = Column(String(100), nullable=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CDDType(Base):
    """CDD Clinic Type (e.g., Staff, Treatment, Marketing)"""
    __tablename__ = "cdd_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    categories = relationship("CDDCategory", back_populates="type_rel", cascade="all, delete-orphan")


class CDDCategory(Base):
    """CDD Clinic Category linked to a Type"""
    __tablename__ = "cdd_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type_id = Column(Integer, ForeignKey("cdd_types.id"), nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    type_rel = relationship("CDDType", back_populates="categories")


class AdminMainCategory(Base):
    __tablename__ = "admin_main_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    modules = relationship("AdminModule", back_populates="main_category_rel", cascade="all, delete-orphan")


class AdminModule(Base):
    __tablename__ = "admin_modules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    main_category_id = Column(Integer, ForeignKey("admin_main_categories.id"), nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    main_category_rel = relationship("AdminMainCategory", back_populates="modules")
    sub_categories = relationship("AdminSubCategory", back_populates="module_rel", cascade="all, delete-orphan")


class AdminSubCategory(Base):
    __tablename__ = "admin_sub_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    module_id = Column(Integer, ForeignKey("admin_modules.id"), nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    module_rel = relationship("AdminModule", back_populates="sub_categories")
    child_categories = relationship("AdminChildCategory", back_populates="sub_category_rel", cascade="all, delete-orphan")


class AdminChildCategory(Base):
    __tablename__ = "admin_child_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sub_category_id = Column(Integer, ForeignKey("admin_sub_categories.id"), nullable=False)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.Active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sub_category_rel = relationship("AdminSubCategory", back_populates="child_categories")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text)
    type = Column(SAEnum(NotificationTypeEnum), default=NotificationTypeEnum.info)
    read = Column(Boolean, default=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    hashed_password = Column(String(200))
    role = Column(String(200))
    department = Column(String(100))
    center_name = Column(String(150))
    city = Column(String(100))
    map_level_access = Column(String(50))
    mobile = Column(String(20))
    employee_type = Column(String(50))
    status = Column(String(20), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
