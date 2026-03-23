// Dummy data for the ITSM application

export type Priority = "Critical" | "High" | "Medium" | "Low";
export type TicketStatus = "Open" | "In Progress" | "Pending Approval" | "Resolved" | "Closed" | "Rejected";
export type UserRole = string;

export interface Department {
  id: string;
  name: string;
  head: string;
  slaHours: number;
  centerCount: number;
  activeTickets: number;
}

export interface Center {
  id: string;
  locationCode: string;
  name: string;
  city: string;
  state: string;
  department: string;
  contactPerson: string;
  phone: string;
  address: string;
  pincode: string;
  latitude: string;
  longitude: string;
  zone: string;
  country: string;
  status: "Active" | "Inactive";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  center: string;
  avatar: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  priority: Priority;
  status: TicketStatus;
  raisedBy: string;
  raisedByDept: string;
  assignedTo: string;
  assignedDept: string;
  center: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  slaBreached: boolean;
  approvalRequired: boolean;
  approvalType?: string;
  approver?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  resolution?: string;
  comments: TicketComment[];
  // Zenoti-specific fields
  zenotiLocation?: string;
  zenotiMainCategory?: string;
  zenotiSubCategory?: string;
  zenotiChildCategory?: string;
  zenotiMobileNumber?: string;
  zenotiCustomerId?: string;
  zenotiCustomerName?: string;
  zenotiBilledBy?: string;
  zenotiInvoiceNo?: string;
  zenotiInvoiceDate?: string;
  zenotiAmount?: string;
  zenotiDescription?: string;
}

export interface TicketComment {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: "comment" | "status_change" | "approval";
}

export interface SLAConfig {
  id: string;
  department: string;
  priority: Priority;
  responseTimeHrs: number;
  resolutionTimeHrs: number;
  escalationLevel1Hrs: number;
  escalationLevel2Hrs: number;
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  timestamp: string;
  ticketId?: string;
}

// Departments
export const departments: Department[] = [
  { id: "D001", name: "IT", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D002", name: "Zenoti", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D003", name: "HR", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D004", name: "Clinic", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D005", name: "Quality", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D006", name: "Stores", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D007", name: "Products", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
  { id: "D008", name: "Admin", head: "", slaHours: 24, centerCount: 0, activeTickets: 0 },
];

// Centers
export const centers: Center[] = [];

// Users
export const users: User[] = [];

// Tickets
export const tickets: Ticket[] = [];

// SLA Configurations
export const slaConfigs: SLAConfig[] = [];

// Notifications
export const notifications: Notification[] = [];

// Dashboard stats
export const dashboardStats = {
  totalTickets: 0,
  openTickets: 0,
  inProgress: 0,
  pendingApproval: 0,
  resolved: 0,
  closed: 0,
  slaBreached: 0,
  avgResolutionHrs: 0,
  satisfactionScore: 0,
  ticketsByPriority: {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  },
  ticketsByDepartment: [],
  ticketTrend: [],
  topCenters: [],
};

export const roles: { id: string; name: string; description: string; userCount: number; permissions: string[] }[] = [];

// Categories
export interface Category {
  id: string;
  name: string;
  department: string;
  description: string;
  subcategoryCount: number;
  status: "Active" | "Inactive";
}

export const categories: Category[] = [];

// Subcategories
export interface Subcategory {
  id: string;
  name: string;
  category: string;
  serviceTitleCount: number;
  status: "Active" | "Inactive";
}

export const subcategories: Subcategory[] = [];

// Service Titles
export interface ServiceTitle {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  priority: Priority;
  slaHours: number;
  status: "Active" | "Inactive";
}

export const serviceTitles: ServiceTitle[] = [];
