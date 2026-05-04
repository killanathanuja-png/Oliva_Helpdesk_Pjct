const API_BASE = "http://localhost:8000/api";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("oliva_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Ensure trailing slash before query params to avoid 307 redirects from FastAPI
  let url = `${API_BASE}${path}`;
  const qIdx = url.indexOf("?");
  if (qIdx === -1) {
    if (!url.endsWith("/")) url += "/";
  } else {
    const base = url.slice(0, qIdx);
    if (!base.endsWith("/")) url = base + "/" + url.slice(qIdx);
  }
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (body?.detail) detail = JSON.stringify(body.detail);
    } catch { /* non-JSON body */ }
    throw new Error(detail || `API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Auth ---

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthUser {
  id: number;
  code: string;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
  center: string | null;
  avatar: string | null;
  status: string | null;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<AuthUser>("/auth/me"),
  updateProfile: (data: { name?: string; email?: string }) =>
    request<AuthUser>("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
};

// --- Ticket types matching backend response ---

export interface ApiTicketComment {
  id: number;
  user: string | null;
  message: string;
  type: string;
  created_at: string | null;
}

export interface ApiTicket {
  id: number;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  sub_category: string | null;
  priority: string | null;
  status: string | null;
  raised_by: string | null;
  raised_by_dept: string | null;
  assigned_to: string | null;
  assigned_dept: string | null;
  center: string | null;
  due_date: string | null;
  sla_breached: boolean;
  approval_required: boolean;
  approval_type: string | null;
  approver: string | null;
  approval_status: string | null;
  resolution: string | null;
  comments: ApiTicketComment[];
  created_at: string | null;
  updated_at: string | null;
  // Zenoti fields
  zenoti_location: string | null;
  zenoti_main_category: string | null;
  zenoti_sub_category: string | null;
  zenoti_child_category: string | null;
  zenoti_mobile_number: string | null;
  zenoti_customer_id: string | null;
  zenoti_customer_name: string | null;
  zenoti_billed_by: string | null;
  zenoti_invoice_no: string | null;
  zenoti_invoice_date: string | null;
  zenoti_amount: string | null;
  zenoti_description: string | null;
  // CDD Clinic fields
  action_required: string | null;
  client_code: string | null;
  client_name: string | null;
  service_name: string | null;
  crt_name: string | null;
  primary_doctor: string | null;
  therapist_name: string | null;
  // CDD Escalation fields
  escalation_level: number | null;
  escalated_to: string | null;
  original_assigned_to: string | null;
  escalated_at: string | null;
  acknowledged_at: string | null;
  // TAT fields
  tat_hours: number | null;
  tat_breached: boolean;
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  category?: string;
  sub_category?: string;
  priority?: string;
  center?: string;
  assigned_dept?: string;
  approval_required?: boolean;
  approval_type?: string;
  zenoti_location?: string;
  zenoti_main_category?: string;
  zenoti_sub_category?: string;
  zenoti_child_category?: string;
  zenoti_mobile_number?: string;
  zenoti_customer_id?: string;
  zenoti_customer_name?: string;
  zenoti_billed_by?: string;
  zenoti_invoice_no?: string;
  zenoti_invoice_date?: string;
  zenoti_amount?: string;
  zenoti_description?: string;
  action_required?: string;
  client_code?: string;
  client_name?: string;
  service_name?: string;
  crt_name?: string;
  primary_doctor?: string;
  therapist_name?: string;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  category?: string;
  sub_category?: string;
  priority?: string;
  center?: string;
  assigned_dept?: string;
  assigned_to_id?: number;
  status?: string;
  comment?: string;
  zenoti_location?: string;
  zenoti_main_category?: string;
  zenoti_sub_category?: string;
  zenoti_child_category?: string;
  zenoti_mobile_number?: string;
  zenoti_customer_id?: string;
  zenoti_customer_name?: string;
  zenoti_billed_by?: string;
  zenoti_invoice_no?: string;
  zenoti_invoice_date?: string;
  zenoti_amount?: string;
  zenoti_description?: string;
}

// --- Master data types ---

export interface ApiDepartment {
  id: number;
  code: string;
  name: string;
  head: string | null;
  sla_hours: number | null;
  center_count: number;
  active_tickets: number;
  status: string | null;
  created_at: string | null;
}

export interface ApiCenter {
  id: number;
  code: string;
  location_code: string | null;
  name: string;
  city: string | null;
  state: string | null;
  department: string | null;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  zone: string | null;
  country: string | null;
  center_manager_email: string | null;
  aom_email: string | null;
  branch_email: string | null;
  status: string | null;
  created_at: string | null;
}

export interface ApiUser {
  id: number;
  code: string;
  employee_id: string | null;
  name: string;
  email: string;
  role: string | null;
  map_level_access: string | null;
  designation: string | null;
  entity: string | null;
  vertical: string | null;
  costcenter: string | null;
  department: string | null;
  center: string | null;
  gender: string | null;
  mobile: string | null;
  reporting_to: string | null;
  grade: string | null;
  employee_type: string | null;
  city: string | null;
  employee_dob: string | null;
  employee_doj: string | null;
  lwd: string | null;
  effective_date: string | null;
  remarks: string | null;
  avatar: string | null;
  status: string | null;
  last_login: string | null;
  created_at: string | null;
  managed_centers: string[] | null;
}

export interface ApiDesignation {
  id: number;
  code: string;
  name: string;
  status: string | null;
  created_at: string | null;
}

export interface ApiRole {
  id: number;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  user_count: number;
  status: string | null;
  created_at: string | null;
}

export interface ApiCategory {
  id: number;
  code: string;
  name: string;
  module: string | null;
  description: string | null;
  department: string | null;
  subcategory_count: number;
  status: string | null;
  created_at: string | null;
}

export interface ApiSubcategory {
  id: number;
  code: string;
  name: string;
  category: string | null;
  module: string | null;
  service_title_count: number;
  status: string | null;
  created_at: string | null;
}

export interface ApiServiceTitle {
  id: number;
  code: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  priority: string | null;
  sla_hours: number | null;
  status: string | null;
  created_at: string | null;
}

// --- Master data APIs ---

export const departmentsApi = {
  list: () => request<ApiDepartment[]>("/departments"),
  create: (data: { name: string; head?: string; sla_hours?: number }) =>
    request<ApiDepartment>("/departments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; head?: string; sla_hours?: number }) =>
    request<ApiDepartment>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiDepartment>(`/departments/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export const centersApi = {
  list: () => request<ApiCenter[]>("/centers"),
  create: (data: Record<string, unknown>) =>
    request<ApiCenter>("/centers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    request<ApiCenter>(`/centers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiCenter>(`/centers/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export const usersApi = {
  list: () => request<ApiUser[]>("/users"),
  create: (data: Record<string, unknown>) =>
    request<ApiUser>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    request<ApiUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiUser>(`/users/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  getManagedCenters: (id: number) =>
    request<{ id: number; name: string }[]>(`/users/${id}/managed-centers`),
  setManagedCenters: (id: number, centerIds: number[]) =>
    request<{ id: number; name: string }[]>(`/users/${id}/managed-centers`, { method: "PUT", body: JSON.stringify(centerIds) }),
  uploadExcel: async (file: File): Promise<{ message: string; added: number; updated: number; skipped: number; errors: string[]; users: ApiUser[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("oliva_token");
    const res = await fetch(`${API_BASE}/users/upload-excel`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },
};

export const designationsApi = {
  list: () => request<ApiDesignation[]>("/designations"),
  create: (data: { name: string }) =>
    request<ApiDesignation>("/designations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name: string }) =>
    request<ApiDesignation>(`/designations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiDesignation>(`/designations/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export const rolesApi = {
  list: () => request<ApiRole[]>("/roles"),
  create: (data: { name: string; description?: string; permissions?: string[] }) =>
    request<ApiRole>("/roles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; description?: string; permissions?: string[] }) =>
    request<ApiRole>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiRole>(`/roles/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export const categoriesApi = {
  list: () => request<ApiCategory[]>("/categories"),
  create: (data: { name: string; module?: string; description?: string; department?: string }) =>
    request<ApiCategory>("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; module?: string; description?: string; department?: string; status?: string }) =>
    request<ApiCategory>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiCategory>(`/categories/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export const subcategoriesApi = {
  list: () => request<ApiSubcategory[]>("/subcategories"),
  create: (data: { name: string; category?: string }) =>
    request<ApiSubcategory>("/subcategories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; category?: string; status?: string }) =>
    request<ApiSubcategory>(`/subcategories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiSubcategory>(`/subcategories/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export interface ApiChildCategory {
  id: number;
  code: string;
  name: string;
  subcategory: string | null;
  category: string | null;
  module: string | null;
  status: string | null;
  created_at: string | null;
}

export const childCategoriesApi = {
  list: () => request<ApiChildCategory[]>("/child-categories"),
  create: (data: { name: string; code?: string; subcategory?: string; category?: string; module?: string }) =>
    request<ApiChildCategory>("/child-categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; subcategory?: string; category?: string; module?: string; status?: string }) =>
    request<ApiChildCategory>(`/child-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiChildCategory>(`/child-categories/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  uploadExcel: async (file: File): Promise<{ message: string; added: number; updated: number; skipped: number; items: ApiChildCategory[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("oliva_token");
    const res = await fetch(`${API_BASE}/child-categories/upload-excel`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },
};

export const serviceTitlesApi = {
  list: () => request<ApiServiceTitle[]>("/service-titles"),
  create: (data: { title: string; category?: string; subcategory?: string; priority?: string; sla_hours?: number }) =>
    request<ApiServiceTitle>("/service-titles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { title?: string; category?: string; subcategory?: string; priority?: string; sla_hours?: number; status?: string }) =>
    request<ApiServiceTitle>(`/service-titles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<ApiServiceTitle>(`/service-titles/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

export interface ApproveTicketPayload {
  action: string; // "Approve" | "Follow-up" | "Reject"
  comment?: string;
  approver_name?: string;
}

export const ticketsApi = {
  list: (params?: { escalation?: boolean }) => {
    const q = params?.escalation ? "?escalation=true" : "";
    return request<ApiTicket[]>(`/tickets${q}`);
  },
  get: (id: number) => request<ApiTicket>(`/tickets/${id}`),
  delete: (id: number) => request<{ message: string }>(`/tickets/${id}`, { method: "DELETE" }),
  create: (data: CreateTicketPayload) =>
    request<ApiTicket>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: UpdateTicketPayload) =>
    request<ApiTicket>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<{ message: string }>(`/tickets/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  approve: (id: number, data: ApproveTicketPayload) =>
    request<ApiTicket>(`/tickets/${id}/approve`, { method: "PATCH", body: JSON.stringify(data) }),
  addComment: (id: number, data: { user: string; message: string; type?: string }) =>
    request<ApiTicketComment>(`/tickets/${id}/comments`, { method: "POST", body: JSON.stringify(data) }),
  getEmailLogs: (id: number) =>
    request<{ id: number; to_email: string; to_name: string; template: string; status: string; msg91_id: string; error: string | null; created_at: string | null }[]>(`/tickets/${id}/email-logs`),
  resolve: (id: number, data: { action: string; resolution?: string; user_name?: string }) =>
    request<ApiTicket>(`/tickets/${id}/resolve`, { method: "PATCH", body: JSON.stringify(data) }),
  cddAction: (id: number, data: { action: string; comment?: string; escalate_to_id?: number; user_name?: string }) =>
    request<ApiTicket>(`/tickets/${id}/cdd-action`, { method: "PATCH", body: JSON.stringify(data) }),
};

// --- CDD Types ---

export interface ApiCDDCategory {
  id: number;
  name: string;
  type_id: number;
  status: string | null;
}

export interface ApiCDDType {
  id: number;
  name: string;
  status: string | null;
  categories: ApiCDDCategory[];
}

export const cddTypesApi = {
  list: () => request<ApiCDDType[]>("/cdd-types"),
  create: (data: { name: string }) => request<ApiCDDType>("/cdd-types", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/cdd-types/${id}`, { method: "DELETE" }),
  createCategory: (data: { name: string; type_id: number }) => request<ApiCDDCategory>("/cdd-types/categories", { method: "POST", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request<void>(`/cdd-types/categories/${id}`, { method: "DELETE" }),
};

// --- Admin Masters (Admin Department) ---

export interface AdminChildCategoryApi {
  id: number; name: string; sub_category_id: number; status: string | null;
}
export interface AdminSubCategoryApi {
  id: number; name: string; module_id: number; status: string | null;
  child_categories: AdminChildCategoryApi[];
}
export interface AdminModuleApi {
  id: number; name: string; main_category_id: number; status: string | null;
  sub_categories: AdminSubCategoryApi[];
}
export interface AdminMainCategoryApi {
  id: number; name: string; status: string | null;
  modules: AdminModuleApi[];
}

export interface AdminLocationAssignment {
  id: number;
  location: string;
  assigned_to_email: string;
  assigned_to_name: string | null;
  created_at: string | null;
}

export interface AdminEscalationMatrix {
  id: number;
  location: string;
  l1_email: string;
  l1_name: string | null;
  l2_email: string;
  l2_name: string | null;
  l3_email: string;
  l3_name: string | null;
  sla_hours: number | null;
  created_at: string | null;
}

export const adminMastersApi = {
  listMainCategories: () => request<AdminMainCategoryApi[]>("/admin-masters/main-categories"),
  createMainCategory: (data: { name: string }) => request<AdminMainCategoryApi>("/admin-masters/main-categories", { method: "POST", body: JSON.stringify(data) }),
  updateMainCategory: (id: number, data: { name: string }) => request<AdminMainCategoryApi>(`/admin-masters/main-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMainCategory: (id: number) => request<void>(`/admin-masters/main-categories/${id}`, { method: "DELETE" }),
  listModules: () => request<AdminModuleApi[]>("/admin-masters/modules"),
  createModule: (data: { name: string; main_category_id: number }) => request<AdminModuleApi>("/admin-masters/modules", { method: "POST", body: JSON.stringify(data) }),
  updateModule: (id: number, data: { name: string; main_category_id: number }) => request<AdminModuleApi>(`/admin-masters/modules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteModule: (id: number) => request<void>(`/admin-masters/modules/${id}`, { method: "DELETE" }),
  createSubCategory: (data: { name: string; module_id: number }) => request<any>("/admin-masters/sub-categories", { method: "POST", body: JSON.stringify(data) }),
  updateSubCategory: (id: number, data: { name: string; module_id: number }) => request<any>(`/admin-masters/sub-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubCategory: (id: number) => request<void>(`/admin-masters/sub-categories/${id}`, { method: "DELETE" }),
  listChildCategories: () => request<AdminChildCategoryApi[]>("/admin-masters/child-categories"),
  createChildCategory: (data: { name: string; sub_category_id: number }) => request<any>("/admin-masters/child-categories", { method: "POST", body: JSON.stringify(data) }),
  updateChildCategory: (id: number, data: { name: string; sub_category_id: number }) => request<any>(`/admin-masters/child-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChildCategory: (id: number) => request<void>(`/admin-masters/child-categories/${id}`, { method: "DELETE" }),
  listLocationAssignments: () => request<AdminLocationAssignment[]>("/admin-masters/location-assignments"),
  listEscalationMatrix: () => request<AdminEscalationMatrix[]>("/admin-masters/escalation-matrix"),
};

// --- Admin Users ---

export interface ApiAdminUser {
  id: number;
  code: string;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
  center_name: string | null;
  city: string | null;
  map_level_access: string | null;
  mobile: string | null;
  employee_type: string | null;
  status: string | null;
}

export const adminUsersApi = {
  list: () => request<ApiAdminUser[]>("/admin-users"),
  create: (data: Record<string, unknown>) => request<ApiAdminUser>("/admin-users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) => request<ApiAdminUser>(`/admin-users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/admin-users/${id}`, { method: "DELETE" }),
};

// --- Dashboard ---

export interface ApiDashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  pending_approval: number;
  approved: number;
  acknowledged: number;
  awaiting_user_inputs: number;
  user_inputs_received: number;
  follow_up: number;
  resolved: number;
  closed: number;
  rejected: number;
  reopened: number;
  sla_breached: number;
  sla_compliance_pct: number;
  avg_resolution_hours: number | null;
  escalation_count: number;
  tickets_by_priority: Record<string, number>;
  tickets_by_department: { name: string; count: number }[];
  tickets_by_status: { name: string; count: number }[];
  tickets_by_category: { name: string; count: number }[];
  tickets_by_sub_category: { name: string; count: number }[];
  dept_sla_compliance: { name: string; total: number; breached: number; on_track: number; compliance_pct: number }[];
  priority_sla_compliance: { name: string; total: number; breached: number; on_track: number; compliance_pct: number }[];
  recent_tickets: { id: string; title: string; priority: string; status: string; department: string; center: string; sla_breached: boolean; created_at?: string; raised_by?: string }[];
  top_centers: { name: string; tickets: number }[];
}

export const dashboardApi = {
  stats: (params?: { department?: string; category?: string; user_id?: number; from_date?: string; to_date?: string }) => {
    const qs = new URLSearchParams();
    if (params?.department) qs.set("department", params.department);
    if (params?.category) qs.set("category", params.category);
    if (params?.sub_category) qs.set("sub_category", params.sub_category);
    if (params?.user_id) qs.set("user_id", String(params.user_id));
    if (params?.from_date) qs.set("from_date", params.from_date);
    if (params?.to_date) qs.set("to_date", params.to_date);
    const q = qs.toString();
    return request<ApiDashboardStats>(`/dashboard/stats${q ? `?${q}` : ""}`);
  },
};

// --- SLA Config ---

export interface ApiSLAConfig {
  id: number;
  code: string;
  department: string | null;
  priority: string;
  response_time_hrs: number | null;
  resolution_time_hrs: number | null;
  escalation_level1_hrs: number | null;
  escalation_level2_hrs: number | null;
  active: boolean;
  created_at: string | null;
}

export const slaApi = {
  list: () => request<ApiSLAConfig[]>("/sla"),
  create: (data: {
    department?: string;
    priority: string;
    response_time_hrs?: number;
    resolution_time_hrs?: number;
    escalation_level1_hrs?: number;
    escalation_level2_hrs?: number;
    active?: boolean;
  }) => request<ApiSLAConfig>("/sla", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/sla/${id}`, { method: "DELETE" }),
};

// --- Login History ---

export interface ApiLoginHistory {
  id: number;
  user_id: number;
  employee_id: string | null;
  name: string;
  email: string;
  login_time: string | null;
  logout_time: string | null;
  duration: string | null;
  role: string | null;
  module: string | null;
  location: string | null;
  login_source: string | null;
  remarks: string | null;
}

export interface ApiEmployeeOption {
  id: number;
  employee_id: string;
  name: string;
  label: string;
}

export const loginHistoryApi = {
  list: (params?: { user_id?: number; from_date?: string; to_date?: string }) => {
    const qs = new URLSearchParams();
    if (params?.user_id) qs.set("user_id", String(params.user_id));
    if (params?.from_date) qs.set("from_date", params.from_date);
    if (params?.to_date) qs.set("to_date", params.to_date);
    const q = qs.toString();
    return request<ApiLoginHistory[]>(`/login-history${q ? `?${q}` : ""}`);
  },
  employees: () => request<ApiEmployeeOption[]>("/login-history/employees"),
};

// --- AOM Mappings ---

export interface AOMCenterInfo {
  center_name: string | null;
  location: string | null;
  aom_name: string | null;
  aom_email: string | null;
}

export const aomMappingsApi = {
  myCenter: () => request<AOMCenterInfo>("/aom-mappings/my-center"),
};

// --- Notifications ---

export interface ApiNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  ticket_id: number | null;
  user_id: number | null;
  created_at: string;
}

export const notificationsApi = {
  list: () => request<ApiNotification[]>("/notifications"),
  unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markRead: (id: number) => request<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request<void>("/notifications/mark-all-read", { method: "PATCH" }),
};

// --- TAT Report ---

export interface TATReportRow {
  ticket_id: string;
  title: string;
  department: string | null;
  category: string | null;
  sub_category: string | null;
  priority: string | null;
  status: string | null;
  raised_by: string | null;
  raised_by_dept: string | null;
  center: string | null;
  assigned_to: string | null;
  created_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  actual_tat_hours: number | null;
  sla_hours: number | null;
  sla_status: string;
  delay_hours: number | null;
  escalation_level: number;
  escalated_at: string | null;
  escalated_to: string | null;
}

export interface TATReportResponse {
  rows: TATReportRow[];
  total: number;
  within_sla: number;
  breached: number;
  avg_tat_hours: number | null;
}

export const tatReportApi = {
  get: (params?: Record<string, string | number>) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "All") qs.set(k, String(v));
      });
    }
    const q = qs.toString();
    return request<TATReportResponse>(`/tat-report${q ? `?${q}` : ""}`);
  },
};

// --- Auth logout ---

export const authLogout = () =>
  request<{ message: string }>("/auth/logout/", { method: "POST" });

// --- Certificates ---

export interface CertificateData {
  id: number | null;
  cert_type: string;
  file_name: string | null;
  start_date: string | null;
  expiry_date: string | null;
  status: string;
  renewal_status: string;
  days_to_expiry: number | null;
  uploaded_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  has_file: boolean;
}

export interface ExpiringCert {
  id: number;
  cert_type: string;
  center_id: number;
  center_name: string;
  city: string;
  file_name: string;
  expiry_date: string | null;
  days_left: number;
  status: string;
}

export const certificatesApi = {
  getExpiring: () => request<ExpiringCert[]>("/certificates/expiring"),
  getForCenter: (centerId: number) => request<{ center_id: number; center_name: string; city: string; certificates: CertificateData[] }>(`/certificates/center/${centerId}`),
  upload: (formData: FormData) => {
    const token = localStorage.getItem("oliva_token");
    return fetch(`${API_BASE}/certificates/upload/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((res) => res.json());
  },
  download: (certId: number) => {
    const token = localStorage.getItem("oliva_token");
    return fetch(`${API_BASE}/certificates/download/${certId}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    });
  },
  delete: (certId: number) => request<{ message: string }>(`/certificates/${certId}`, { method: "DELETE" }),
};
