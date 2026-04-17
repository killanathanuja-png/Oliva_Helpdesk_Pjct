from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Auth ---

class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- Department ---

class DepartmentBase(BaseModel):
    name: str
    head: Optional[str] = None
    sla_hours: Optional[int] = 24


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: int
    code: str
    center_count: int = 0
    active_tickets: int = 0
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Center ---

class CenterBase(BaseModel):
    name: str
    location_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    department: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    zone: Optional[str] = None
    country: Optional[str] = "India"
    center_manager_email: Optional[str] = None
    aom_email: Optional[str] = None
    branch_email: Optional[str] = None
    status: Optional[str] = "Active"


class CenterCreate(CenterBase):
    pass


class CenterResponse(CenterBase):
    id: int
    code: str
    center_manager_email: Optional[str] = None
    aom_email: Optional[str] = None
    branch_email: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Role ---

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[list[str]] = []


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[list[str]] = None


class RoleResponse(RoleBase):
    id: int
    code: str
    user_count: int = 0
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- User ---

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "User"
    map_level_access: Optional[str] = None
    designation: Optional[str] = None
    entity: Optional[str] = None
    vertical: Optional[str] = None
    costcenter: Optional[str] = None
    department: Optional[str] = None
    center: Optional[str] = None
    gender: Optional[str] = None
    mobile: Optional[str] = None
    reporting_to: Optional[str] = None
    grade: Optional[str] = None
    employee_type: Optional[str] = None
    city: Optional[str] = None
    employee_dob: Optional[str] = None
    employee_doj: Optional[str] = None
    lwd: Optional[str] = None
    effective_date: Optional[str] = None
    remarks: Optional[str] = None


class UserCreate(UserBase):
    password: str
    employee_id: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    map_level_access: Optional[str] = None
    designation: Optional[str] = None
    entity: Optional[str] = None
    vertical: Optional[str] = None
    costcenter: Optional[str] = None
    department: Optional[str] = None
    center: Optional[str] = None
    gender: Optional[str] = None
    mobile: Optional[str] = None
    reporting_to: Optional[str] = None
    grade: Optional[str] = None
    employee_type: Optional[str] = None
    city: Optional[str] = None
    employee_dob: Optional[str] = None
    employee_doj: Optional[str] = None
    lwd: Optional[str] = None
    effective_date: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = None


class UserResponse(UserBase):
    id: int
    code: str
    employee_id: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[str] = "Active"
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    managed_centers: Optional[list[str]] = None

    class Config:
        from_attributes = True


# --- Designation ---

class DesignationBase(BaseModel):
    name: str

class DesignationCreate(DesignationBase):
    pass

class DesignationResponse(DesignationBase):
    id: int
    code: str
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Category ---

class CategoryBase(BaseModel):
    name: str
    module: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    module: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    code: str
    subcategory_count: int = 0
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Subcategory ---

class SubcategoryBase(BaseModel):
    name: str
    category: Optional[str] = None


class SubcategoryCreate(SubcategoryBase):
    pass


class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class SubcategoryResponse(SubcategoryBase):
    id: int
    code: str
    module: Optional[str] = None
    service_title_count: int = 0
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Child Category ---

class ChildCategoryBase(BaseModel):
    name: str
    subcategory: Optional[str] = None
    category: Optional[str] = None
    module: Optional[str] = None


class ChildCategoryCreate(ChildCategoryBase):
    code: Optional[str] = None


class ChildCategoryUpdate(BaseModel):
    name: Optional[str] = None
    subcategory: Optional[str] = None
    category: Optional[str] = None
    module: Optional[str] = None
    status: Optional[str] = None


class ChildCategoryResponse(ChildCategoryBase):
    id: int
    code: str
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Service Title ---

class ServiceTitleBase(BaseModel):
    title: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    priority: Optional[str] = "Medium"
    sla_hours: Optional[int] = 24


class ServiceTitleCreate(ServiceTitleBase):
    pass


class ServiceTitleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    priority: Optional[str] = None
    sla_hours: Optional[int] = None
    status: Optional[str] = None


class ServiceTitleResponse(ServiceTitleBase):
    id: int
    code: str
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Ticket ---

class TicketCommentBase(BaseModel):
    user: Optional[str] = None
    message: str
    type: Optional[str] = "comment"


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentResponse(TicketCommentBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = "Medium"
    center: Optional[str] = None
    assigned_dept: Optional[str] = None
    approval_required: Optional[bool] = False
    approval_type: Optional[str] = None  # "aom_finance", "aom_only", or null
    # Zenoti fields
    zenoti_location: Optional[str] = None
    zenoti_main_category: Optional[str] = None
    zenoti_sub_category: Optional[str] = None
    zenoti_child_category: Optional[str] = None
    zenoti_mobile_number: Optional[str] = None
    zenoti_customer_id: Optional[str] = None
    zenoti_customer_name: Optional[str] = None
    zenoti_billed_by: Optional[str] = None
    zenoti_invoice_no: Optional[str] = None
    zenoti_invoice_date: Optional[str] = None
    zenoti_amount: Optional[str] = None
    zenoti_description: Optional[str] = None
    # CDD Clinic fields
    action_required: Optional[str] = None
    client_code: Optional[str] = None
    client_name: Optional[str] = None
    service_name: Optional[str] = None
    crt_name: Optional[str] = None
    primary_doctor: Optional[str] = None
    therapist_name: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = None
    center: Optional[str] = None
    assigned_dept: Optional[str] = None
    assigned_to_id: Optional[int] = None
    status: Optional[str] = None
    comment: Optional[str] = None
    zenoti_location: Optional[str] = None
    zenoti_main_category: Optional[str] = None
    zenoti_sub_category: Optional[str] = None
    zenoti_child_category: Optional[str] = None
    zenoti_mobile_number: Optional[str] = None
    zenoti_customer_id: Optional[str] = None
    zenoti_customer_name: Optional[str] = None
    zenoti_billed_by: Optional[str] = None
    zenoti_invoice_no: Optional[str] = None
    zenoti_invoice_date: Optional[str] = None
    zenoti_amount: Optional[str] = None
    zenoti_description: Optional[str] = None


class TicketResponse(TicketBase):
    id: int
    code: str
    status: Optional[str] = "Open"
    raised_by: Optional[str] = None
    raised_by_dept: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_dept: Optional[str] = None
    due_date: Optional[datetime] = None
    sla_breached: Optional[bool] = False
    approver: Optional[str] = None
    approval_status: Optional[str] = None
    resolution: Optional[str] = None
    aom_name: Optional[str] = None
    aom_email: Optional[str] = None
    escalation_level: Optional[int] = 0
    escalated_to: Optional[str] = None
    original_assigned_to: Optional[str] = None
    escalated_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    tat_hours: Optional[float] = None
    tat_breached: bool = False
    comments: list[TicketCommentResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- SLA Config ---

class SLAConfigBase(BaseModel):
    department: Optional[str] = None
    priority: str
    response_time_hrs: Optional[float] = 4
    resolution_time_hrs: Optional[float] = 24
    escalation_level1_hrs: Optional[float] = 8
    escalation_level2_hrs: Optional[float] = 24
    active: Optional[bool] = True


class SLAConfigCreate(SLAConfigBase):
    pass


class SLAConfigResponse(SLAConfigBase):
    id: int
    code: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Notification ---

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: Optional[str] = None
    type: Optional[str] = "info"
    read: bool = False
    ticket_id: Optional[int] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Dashboard ---

class DashboardStats(BaseModel):
    total_tickets: int = 0
    open_tickets: int = 0
    in_progress: int = 0
    pending_approval: int = 0
    approved: int = 0
    acknowledged: int = 0
    awaiting_user_inputs: int = 0
    user_inputs_received: int = 0
    follow_up: int = 0
    resolved: int = 0
    closed: int = 0
    rejected: int = 0
    reopened: int = 0
    sla_breached: int = 0
    sla_compliance_pct: float = 0.0
    avg_resolution_hours: Optional[float] = None
    escalation_count: int = 0
    tickets_by_priority: dict = {}
    tickets_by_department: list = []
    tickets_by_status: list = []
    tickets_by_category: list = []
    tickets_by_sub_category: list = []
    dept_sla_compliance: list = []
    priority_sla_compliance: list = []
    recent_tickets: list = []
    top_centers: list = []
