// Dummy data for the ITSM application

export type Priority = "Critical" | "High" | "Medium" | "Low";
export type TicketStatus = "Open" | "In Progress" | "Pending Approval" | "Resolved" | "Closed" | "Rejected";
export type UserRole = "Admin" | "Manager" | "Resolver" | "End User";

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
  name: string;
  city: string;
  state: string;
  department: string;
  contactPerson: string;
  phone: string;
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
  approver?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  resolution?: string;
  comments: TicketComment[];
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
  { id: "D001", name: "IT Infrastructure", head: "Rajesh Kumar", slaHours: 4, centerCount: 35, activeTickets: 23 },
  { id: "D002", name: "Biomedical Engineering", head: "Priya Sharma", slaHours: 2, centerCount: 35, activeTickets: 15 },
  { id: "D003", name: "Facilities Management", head: "Arun Patel", slaHours: 6, centerCount: 35, activeTickets: 18 },
  { id: "D004", name: "HR & Admin", head: "Sneha Reddy", slaHours: 8, centerCount: 1, activeTickets: 12 },
  { id: "D005", name: "Procurement", head: "Vikram Singh", slaHours: 24, centerCount: 1, activeTickets: 8 },
  { id: "D006", name: "Clinical Operations", head: "Dr. Meera Nair", slaHours: 1, centerCount: 35, activeTickets: 31 },
  { id: "D007", name: "Finance & Accounts", head: "Karthik Rao", slaHours: 12, centerCount: 1, activeTickets: 6 },
  { id: "D008", name: "Marketing", head: "Anita Desai", slaHours: 24, centerCount: 1, activeTickets: 4 },
];

// Centers
export const centers: Center[] = [
  { id: "C001", name: "Oliva Jubilee Hills", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Srinivas", phone: "+91 9876543210", status: "Active" },
  { id: "C002", name: "Oliva Banjara Hills", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Kavitha", phone: "+91 9876543211", status: "Active" },
  { id: "C003", name: "Oliva Kondapur", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Ravi", phone: "+91 9876543212", status: "Active" },
  { id: "C004", name: "Oliva Kukatpally", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Anjali", phone: "+91 9876543213", status: "Active" },
  { id: "C005", name: "Oliva Anna Nagar", city: "Chennai", state: "Tamil Nadu", department: "Clinical Operations", contactPerson: "Dr. Suresh", phone: "+91 9876543214", status: "Active" },
  { id: "C006", name: "Oliva T Nagar", city: "Chennai", state: "Tamil Nadu", department: "Clinical Operations", contactPerson: "Dr. Lakshmi", phone: "+91 9876543215", status: "Active" },
  { id: "C007", name: "Oliva Velachery", city: "Chennai", state: "Tamil Nadu", department: "Clinical Operations", contactPerson: "Dr. Ganesh", phone: "+91 9876543216", status: "Active" },
  { id: "C008", name: "Oliva Koramangala", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Deepa", phone: "+91 9876543217", status: "Active" },
  { id: "C009", name: "Oliva Indiranagar", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Prasad", phone: "+91 9876543218", status: "Active" },
  { id: "C010", name: "Oliva Whitefield", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Nithya", phone: "+91 9876543219", status: "Active" },
  { id: "C011", name: "Oliva HSR Layout", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Mohan", phone: "+91 9876543220", status: "Active" },
  { id: "C012", name: "Oliva Jayanagar", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Revathi", phone: "+91 9876543221", status: "Active" },
  { id: "C013", name: "Oliva Film Nagar", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Harish", phone: "+91 9876543222", status: "Active" },
  { id: "C014", name: "Oliva Gachibowli", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Swathi", phone: "+91 9876543223", status: "Active" },
  { id: "C015", name: "Oliva Madhapur", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Venkat", phone: "+91 9876543224", status: "Active" },
  { id: "C016", name: "Oliva Himayatnagar", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Padma", phone: "+91 9876543225", status: "Active" },
  { id: "C017", name: "Oliva Secunderabad", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Krishna", phone: "+91 9876543226", status: "Active" },
  { id: "C018", name: "Oliva OMR", city: "Chennai", state: "Tamil Nadu", department: "Clinical Operations", contactPerson: "Dr. Divya", phone: "+91 9876543227", status: "Active" },
  { id: "C019", name: "Oliva Adyar", city: "Chennai", state: "Tamil Nadu", department: "Clinical Operations", contactPerson: "Dr. Ramesh", phone: "+91 9876543228", status: "Active" },
  { id: "C020", name: "Oliva Kilpauk", city: "Chennai", state: "Tamil Nadu", department: "Clinical Operations", contactPerson: "Dr. Aishwarya", phone: "+91 9876543229", status: "Active" },
  { id: "C021", name: "Oliva JP Nagar", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Satish", phone: "+91 9876543230", status: "Active" },
  { id: "C022", name: "Oliva Malleshwaram", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Meghana", phone: "+91 9876543231", status: "Active" },
  { id: "C023", name: "Oliva BTM Layout", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Naresh", phone: "+91 9876543232", status: "Active" },
  { id: "C024", name: "Oliva Electronic City", city: "Bangalore", state: "Karnataka", department: "Clinical Operations", contactPerson: "Dr. Pooja", phone: "+91 9876543233", status: "Active" },
  { id: "C025", name: "Oliva Bandra", city: "Mumbai", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Amit", phone: "+91 9876543234", status: "Active" },
  { id: "C026", name: "Oliva Andheri", city: "Mumbai", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Shilpa", phone: "+91 9876543235", status: "Active" },
  { id: "C027", name: "Oliva Powai", city: "Mumbai", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Sanjay", phone: "+91 9876543236", status: "Active" },
  { id: "C028", name: "Oliva Thane", city: "Mumbai", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Rekha", phone: "+91 9876543237", status: "Active" },
  { id: "C029", name: "Oliva Baner", city: "Pune", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Ajay", phone: "+91 9876543238", status: "Active" },
  { id: "C030", name: "Oliva Kothrud", city: "Pune", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Sunita", phone: "+91 9876543239", status: "Active" },
  { id: "C031", name: "Oliva Viman Nagar", city: "Pune", state: "Maharashtra", department: "Clinical Operations", contactPerson: "Dr. Rohit", phone: "+91 9876543240", status: "Active" },
  { id: "C032", name: "Oliva Somajiguda", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Bhavani", phone: "+91 9876543241", status: "Active" },
  { id: "C033", name: "Oliva ECIL", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Praveen", phone: "+91 9876543242", status: "Active" },
  { id: "C034", name: "Oliva Miyapur", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Sowmya", phone: "+91 9876543243", status: "Active" },
  { id: "C035", name: "Oliva Dilsukhnagar", city: "Hyderabad", state: "Telangana", department: "Clinical Operations", contactPerson: "Dr. Kiran", phone: "+91 9876543244", status: "Active" },
];

// Users
export const users: User[] = [
  { id: "U001", name: "Rajesh Kumar", email: "rajesh.kumar@olivaclinic.com", role: "Admin", department: "IT Infrastructure", center: "Head Office", avatar: "RK", status: "Active", lastLogin: "2026-03-09 10:30 AM" },
  { id: "U002", name: "Priya Sharma", email: "priya.sharma@olivaclinic.com", role: "Manager", department: "Biomedical Engineering", center: "Head Office", avatar: "PS", status: "Active", lastLogin: "2026-03-09 09:15 AM" },
  { id: "U003", name: "Arun Patel", email: "arun.patel@olivaclinic.com", role: "Manager", department: "Facilities Management", center: "Head Office", avatar: "AP", status: "Active", lastLogin: "2026-03-09 08:45 AM" },
  { id: "U004", name: "Sneha Reddy", email: "sneha.reddy@olivaclinic.com", role: "Manager", department: "HR & Admin", center: "Head Office", avatar: "SR", status: "Active", lastLogin: "2026-03-08 05:30 PM" },
  { id: "U005", name: "Dr. Meera Nair", email: "meera.nair@olivaclinic.com", role: "End User", department: "Clinical Operations", center: "Oliva Jubilee Hills", avatar: "MN", status: "Active", lastLogin: "2026-03-09 11:00 AM" },
  { id: "U006", name: "Vikram Singh", email: "vikram.singh@olivaclinic.com", role: "Manager", department: "Procurement", center: "Head Office", avatar: "VS", status: "Active", lastLogin: "2026-03-09 10:00 AM" },
  { id: "U007", name: "Karthik Rao", email: "karthik.rao@olivaclinic.com", role: "Resolver", department: "IT Infrastructure", center: "Head Office", avatar: "KR", status: "Active", lastLogin: "2026-03-09 09:30 AM" },
  { id: "U008", name: "Anita Desai", email: "anita.desai@olivaclinic.com", role: "End User", department: "Marketing", center: "Head Office", avatar: "AD", status: "Active", lastLogin: "2026-03-08 04:00 PM" },
  { id: "U009", name: "Suresh Babu", email: "suresh.babu@olivaclinic.com", role: "Resolver", department: "Biomedical Engineering", center: "Oliva Koramangala", avatar: "SB", status: "Active", lastLogin: "2026-03-09 07:00 AM" },
  { id: "U010", name: "Divya Menon", email: "divya.menon@olivaclinic.com", role: "End User", department: "Clinical Operations", center: "Oliva Anna Nagar", avatar: "DM", status: "Active", lastLogin: "2026-03-09 08:00 AM" },
  { id: "U011", name: "Rahul Verma", email: "rahul.verma@olivaclinic.com", role: "Resolver", department: "IT Infrastructure", center: "Head Office", avatar: "RV", status: "Active", lastLogin: "2026-03-09 09:00 AM" },
  { id: "U012", name: "Lakshmi Iyer", email: "lakshmi.iyer@olivaclinic.com", role: "End User", department: "Finance & Accounts", center: "Head Office", avatar: "LI", status: "Inactive", lastLogin: "2026-02-28 03:00 PM" },
];

// Tickets
export const tickets: Ticket[] = [
  {
    id: "TKT-2026-001",
    title: "Laser machine not powering on",
    description: "The diode laser machine at Jubilee Hills center is not powering on since morning. Patients are waiting.",
    category: "Biomedical Equipment",
    subCategory: "Laser Systems",
    priority: "Critical",
    status: "In Progress",
    raisedBy: "Dr. Meera Nair",
    raisedByDept: "Clinical Operations",
    assignedTo: "Suresh Babu",
    assignedDept: "Biomedical Engineering",
    center: "Oliva Jubilee Hills",
    createdAt: "2026-03-09 08:30 AM",
    updatedAt: "2026-03-09 09:15 AM",
    dueDate: "2026-03-09 10:30 AM",
    slaBreached: false,
    approvalRequired: false,
    comments: [
      { id: "CMT001", user: "Dr. Meera Nair", message: "Machine was working fine yesterday. No power indicator at all.", timestamp: "2026-03-09 08:30 AM", type: "comment" },
      { id: "CMT002", user: "Suresh Babu", message: "Acknowledged. Checking power supply unit. ETA 1 hour.", timestamp: "2026-03-09 09:15 AM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-002",
    title: "Network connectivity issue at Bandra center",
    description: "Internet connection is intermittent. Unable to access patient records and billing system.",
    category: "IT Infrastructure",
    subCategory: "Network",
    priority: "High",
    status: "Open",
    raisedBy: "Dr. Amit",
    raisedByDept: "Clinical Operations",
    assignedTo: "Karthik Rao",
    assignedDept: "IT Infrastructure",
    center: "Oliva Bandra",
    createdAt: "2026-03-09 09:00 AM",
    updatedAt: "2026-03-09 09:00 AM",
    dueDate: "2026-03-09 01:00 PM",
    slaBreached: false,
    approvalRequired: false,
    comments: [
      { id: "CMT003", user: "Dr. Amit", message: "Internet keeps dropping every 10-15 minutes. Affecting patient check-ins.", timestamp: "2026-03-09 09:00 AM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-003",
    title: "Request for new AC installation in consultation room",
    description: "Consultation room 3 at Kondapur center needs AC installation. Current room temperature is uncomfortable for patients.",
    category: "Facilities",
    subCategory: "HVAC",
    priority: "Medium",
    status: "Pending Approval",
    raisedBy: "Dr. Ravi",
    raisedByDept: "Clinical Operations",
    assignedTo: "Arun Patel",
    assignedDept: "Facilities Management",
    center: "Oliva Kondapur",
    createdAt: "2026-03-08 02:00 PM",
    updatedAt: "2026-03-09 10:00 AM",
    dueDate: "2026-03-10 02:00 PM",
    slaBreached: false,
    approvalRequired: true,
    approver: "Vikram Singh",
    approvalStatus: "Pending",
    comments: [
      { id: "CMT004", user: "Dr. Ravi", message: "Room temperature exceeds 30°C. Very uncomfortable for patients.", timestamp: "2026-03-08 02:00 PM", type: "comment" },
      { id: "CMT005", user: "Arun Patel", message: "Assessed the room. Recommending 1.5 ton split AC. Sent for procurement approval.", timestamp: "2026-03-09 10:00 AM", type: "status_change" },
    ],
  },
  {
    id: "TKT-2026-004",
    title: "New employee onboarding - IT setup required",
    description: "New dermatologist Dr. Priyanka joining Indiranagar center. Need laptop, email ID, system access, and ID card.",
    category: "HR & Admin",
    subCategory: "Onboarding",
    priority: "Medium",
    status: "In Progress",
    raisedBy: "Sneha Reddy",
    raisedByDept: "HR & Admin",
    assignedTo: "Rahul Verma",
    assignedDept: "IT Infrastructure",
    center: "Oliva Indiranagar",
    createdAt: "2026-03-07 11:00 AM",
    updatedAt: "2026-03-09 08:00 AM",
    dueDate: "2026-03-10 11:00 AM",
    slaBreached: false,
    approvalRequired: true,
    approver: "Rajesh Kumar",
    approvalStatus: "Approved",
    comments: [
      { id: "CMT006", user: "Sneha Reddy", message: "Joining date is March 10th. Please prepare all IT assets.", timestamp: "2026-03-07 11:00 AM", type: "comment" },
      { id: "CMT007", user: "Rajesh Kumar", message: "Approved. Proceeding with setup.", timestamp: "2026-03-08 09:00 AM", type: "approval" },
      { id: "CMT008", user: "Rahul Verma", message: "Laptop configured. Setting up email and system access.", timestamp: "2026-03-09 08:00 AM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-005",
    title: "CCTV camera malfunction - Main entrance",
    description: "CCTV camera at the main entrance of Koramangala center has stopped recording since last night.",
    category: "IT Infrastructure",
    subCategory: "Security Systems",
    priority: "High",
    status: "Resolved",
    raisedBy: "Dr. Deepa",
    raisedByDept: "Clinical Operations",
    assignedTo: "Karthik Rao",
    assignedDept: "IT Infrastructure",
    center: "Oliva Koramangala",
    createdAt: "2026-03-08 07:00 AM",
    updatedAt: "2026-03-08 03:00 PM",
    dueDate: "2026-03-08 11:00 AM",
    slaBreached: true,
    approvalRequired: false,
    resolution: "Camera power adapter was faulty. Replaced with a new adapter. Camera is now recording properly.",
    comments: [
      { id: "CMT009", user: "Dr. Deepa", message: "Security guard noticed no recording on the monitor.", timestamp: "2026-03-08 07:00 AM", type: "comment" },
      { id: "CMT010", user: "Karthik Rao", message: "Identified faulty power adapter. Replacement done. Camera functional.", timestamp: "2026-03-08 03:00 PM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-006",
    title: "Software update required for patient management system",
    description: "The patient management system needs to be updated to version 4.2 across all centers for new regulatory compliance.",
    category: "IT Infrastructure",
    subCategory: "Software",
    priority: "High",
    status: "Pending Approval",
    raisedBy: "Rajesh Kumar",
    raisedByDept: "IT Infrastructure",
    assignedTo: "Rahul Verma",
    assignedDept: "IT Infrastructure",
    center: "All Centers",
    createdAt: "2026-03-07 03:00 PM",
    updatedAt: "2026-03-08 11:00 AM",
    dueDate: "2026-03-12 03:00 PM",
    slaBreached: false,
    approvalRequired: true,
    approver: "Dr. Meera Nair",
    approvalStatus: "Pending",
    comments: [
      { id: "CMT011", user: "Rajesh Kumar", message: "Compliance deadline is March 15th. Need clinical operations approval for downtime window.", timestamp: "2026-03-07 03:00 PM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-007",
    title: "Procurement of consumables for dermatology",
    description: "Monthly consumables order for dermatology procedures across all centers. Includes chemical peels, microneedling cartridges.",
    category: "Procurement",
    subCategory: "Medical Consumables",
    priority: "Medium",
    status: "In Progress",
    raisedBy: "Dr. Meera Nair",
    raisedByDept: "Clinical Operations",
    assignedTo: "Vikram Singh",
    assignedDept: "Procurement",
    center: "All Centers",
    createdAt: "2026-03-06 10:00 AM",
    updatedAt: "2026-03-09 09:00 AM",
    dueDate: "2026-03-13 10:00 AM",
    slaBreached: false,
    approvalRequired: true,
    approver: "Karthik Rao",
    approvalStatus: "Approved",
    comments: [
      { id: "CMT012", user: "Vikram Singh", message: "PO raised with vendor. Expected delivery by March 12.", timestamp: "2026-03-09 09:00 AM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-008",
    title: "Water leakage in treatment room",
    description: "Water leakage from ceiling in treatment room 2 at T Nagar center. Room currently unusable.",
    category: "Facilities",
    subCategory: "Plumbing",
    priority: "Critical",
    status: "In Progress",
    raisedBy: "Dr. Lakshmi",
    raisedByDept: "Clinical Operations",
    assignedTo: "Arun Patel",
    assignedDept: "Facilities Management",
    center: "Oliva T Nagar",
    createdAt: "2026-03-09 07:30 AM",
    updatedAt: "2026-03-09 09:45 AM",
    dueDate: "2026-03-09 01:30 PM",
    slaBreached: false,
    approvalRequired: false,
    comments: [
      { id: "CMT013", user: "Dr. Lakshmi", message: "Significant water damage. Room sealed off. 3 appointments rescheduled.", timestamp: "2026-03-09 07:30 AM", type: "comment" },
      { id: "CMT014", user: "Arun Patel", message: "Plumber dispatched. Root cause appears to be burst pipe above ceiling.", timestamp: "2026-03-09 09:45 AM", type: "comment" },
    ],
  },
  {
    id: "TKT-2026-009",
    title: "Printer not working at reception",
    description: "Receipt printer at Whitefield center reception desk is showing paper jam error but no paper jam found.",
    category: "IT Infrastructure",
    subCategory: "Hardware",
    priority: "Low",
    status: "Open",
    raisedBy: "Dr. Nithya",
    raisedByDept: "Clinical Operations",
    assignedTo: "Rahul Verma",
    assignedDept: "IT Infrastructure",
    center: "Oliva Whitefield",
    createdAt: "2026-03-09 10:00 AM",
    updatedAt: "2026-03-09 10:00 AM",
    dueDate: "2026-03-10 10:00 AM",
    slaBreached: false,
    approvalRequired: false,
    comments: [],
  },
  {
    id: "TKT-2026-010",
    title: "Marketing collateral update for new service",
    description: "Need updated brochures and standees for new PRP hair treatment service launching across all centers.",
    category: "Marketing",
    subCategory: "Collateral",
    priority: "Low",
    status: "Closed",
    raisedBy: "Anita Desai",
    raisedByDept: "Marketing",
    assignedTo: "Anita Desai",
    assignedDept: "Marketing",
    center: "All Centers",
    createdAt: "2026-03-01 09:00 AM",
    updatedAt: "2026-03-07 04:00 PM",
    dueDate: "2026-03-08 09:00 AM",
    slaBreached: false,
    approvalRequired: false,
    resolution: "All collateral designed, printed, and distributed to 35 centers.",
    comments: [
      { id: "CMT015", user: "Anita Desai", message: "Design finalized. Sent for printing.", timestamp: "2026-03-05 02:00 PM", type: "comment" },
      { id: "CMT016", user: "Anita Desai", message: "Distribution completed to all centers.", timestamp: "2026-03-07 04:00 PM", type: "comment" },
    ],
  },
];

// SLA Configurations
export const slaConfigs: SLAConfig[] = [
  { id: "SLA001", department: "IT Infrastructure", priority: "Critical", responseTimeHrs: 0.5, resolutionTimeHrs: 2, escalationLevel1Hrs: 1, escalationLevel2Hrs: 2, active: true },
  { id: "SLA002", department: "IT Infrastructure", priority: "High", responseTimeHrs: 1, resolutionTimeHrs: 4, escalationLevel1Hrs: 2, escalationLevel2Hrs: 4, active: true },
  { id: "SLA003", department: "IT Infrastructure", priority: "Medium", responseTimeHrs: 2, resolutionTimeHrs: 8, escalationLevel1Hrs: 4, escalationLevel2Hrs: 8, active: true },
  { id: "SLA004", department: "IT Infrastructure", priority: "Low", responseTimeHrs: 4, resolutionTimeHrs: 24, escalationLevel1Hrs: 12, escalationLevel2Hrs: 24, active: true },
  { id: "SLA005", department: "Biomedical Engineering", priority: "Critical", responseTimeHrs: 0.25, resolutionTimeHrs: 1, escalationLevel1Hrs: 0.5, escalationLevel2Hrs: 1, active: true },
  { id: "SLA006", department: "Biomedical Engineering", priority: "High", responseTimeHrs: 0.5, resolutionTimeHrs: 2, escalationLevel1Hrs: 1, escalationLevel2Hrs: 2, active: true },
  { id: "SLA007", department: "Biomedical Engineering", priority: "Medium", responseTimeHrs: 1, resolutionTimeHrs: 4, escalationLevel1Hrs: 2, escalationLevel2Hrs: 4, active: true },
  { id: "SLA008", department: "Biomedical Engineering", priority: "Low", responseTimeHrs: 2, resolutionTimeHrs: 8, escalationLevel1Hrs: 4, escalationLevel2Hrs: 8, active: true },
  { id: "SLA009", department: "Facilities Management", priority: "Critical", responseTimeHrs: 0.5, resolutionTimeHrs: 2, escalationLevel1Hrs: 1, escalationLevel2Hrs: 2, active: true },
  { id: "SLA010", department: "Facilities Management", priority: "High", responseTimeHrs: 1, resolutionTimeHrs: 6, escalationLevel1Hrs: 3, escalationLevel2Hrs: 6, active: true },
  { id: "SLA011", department: "Facilities Management", priority: "Medium", responseTimeHrs: 2, resolutionTimeHrs: 12, escalationLevel1Hrs: 6, escalationLevel2Hrs: 12, active: true },
  { id: "SLA012", department: "Facilities Management", priority: "Low", responseTimeHrs: 4, resolutionTimeHrs: 48, escalationLevel1Hrs: 24, escalationLevel2Hrs: 48, active: true },
  { id: "SLA013", department: "Clinical Operations", priority: "Critical", responseTimeHrs: 0.25, resolutionTimeHrs: 1, escalationLevel1Hrs: 0.5, escalationLevel2Hrs: 1, active: true },
  { id: "SLA014", department: "Clinical Operations", priority: "High", responseTimeHrs: 0.5, resolutionTimeHrs: 2, escalationLevel1Hrs: 1, escalationLevel2Hrs: 2, active: true },
  { id: "SLA015", department: "HR & Admin", priority: "Medium", responseTimeHrs: 4, resolutionTimeHrs: 24, escalationLevel1Hrs: 12, escalationLevel2Hrs: 24, active: true },
  { id: "SLA016", department: "Procurement", priority: "Medium", responseTimeHrs: 4, resolutionTimeHrs: 72, escalationLevel1Hrs: 48, escalationLevel2Hrs: 72, active: true },
];

// Notifications
export const notifications: Notification[] = [
  { id: "N001", title: "SLA Breach Alert", message: "Ticket TKT-2026-005 has breached SLA. Resolution time exceeded by 4 hours.", type: "error", read: false, timestamp: "2026-03-08 03:00 PM", ticketId: "TKT-2026-005" },
  { id: "N002", title: "Approval Required", message: "Ticket TKT-2026-003 requires your approval for AC installation at Kondapur center.", type: "warning", read: false, timestamp: "2026-03-09 10:00 AM", ticketId: "TKT-2026-003" },
  { id: "N003", title: "Ticket Resolved", message: "Ticket TKT-2026-005 (CCTV camera malfunction) has been resolved.", type: "success", read: true, timestamp: "2026-03-08 03:05 PM", ticketId: "TKT-2026-005" },
  { id: "N004", title: "New Ticket Assigned", message: "Ticket TKT-2026-002 (Network issue at Bandra) has been assigned to you.", type: "info", read: false, timestamp: "2026-03-09 09:00 AM", ticketId: "TKT-2026-002" },
  { id: "N005", title: "Critical Ticket Raised", message: "Critical ticket TKT-2026-008 raised for water leakage at T Nagar center.", type: "error", read: false, timestamp: "2026-03-09 07:30 AM", ticketId: "TKT-2026-008" },
  { id: "N006", title: "Approval Granted", message: "Your ticket TKT-2026-004 has been approved by Rajesh Kumar.", type: "success", read: true, timestamp: "2026-03-08 09:00 AM", ticketId: "TKT-2026-004" },
];

// Dashboard stats
export const dashboardStats = {
  totalTickets: 117,
  openTickets: 23,
  inProgress: 31,
  pendingApproval: 14,
  resolved: 38,
  closed: 11,
  slaBreached: 5,
  avgResolutionHrs: 6.2,
  satisfactionScore: 4.3,
  ticketsByPriority: {
    Critical: 8,
    High: 27,
    Medium: 52,
    Low: 30,
  },
  ticketsByDepartment: [
    { name: "IT Infrastructure", count: 23 },
    { name: "Biomedical Eng.", count: 15 },
    { name: "Facilities", count: 18 },
    { name: "Clinical Ops", count: 31 },
    { name: "HR & Admin", count: 12 },
    { name: "Procurement", count: 8 },
    { name: "Finance", count: 6 },
    { name: "Marketing", count: 4 },
  ],
  ticketTrend: [
    { date: "Mar 3", opened: 12, resolved: 8 },
    { date: "Mar 4", opened: 15, resolved: 11 },
    { date: "Mar 5", opened: 9, resolved: 14 },
    { date: "Mar 6", opened: 18, resolved: 10 },
    { date: "Mar 7", opened: 14, resolved: 16 },
    { date: "Mar 8", opened: 11, resolved: 13 },
    { date: "Mar 9", opened: 8, resolved: 5 },
  ],
  topCenters: [
    { name: "Jubilee Hills", tickets: 12 },
    { name: "Koramangala", tickets: 9 },
    { name: "Bandra", tickets: 8 },
    { name: "Anna Nagar", tickets: 7 },
    { name: "T Nagar", tickets: 6 },
  ],
};

export const roles = [
  { id: "R001", name: "Admin", description: "Full system access. Can manage all settings, users, and configurations.", userCount: 2, permissions: ["All"] },
  { id: "R002", name: "Manager", description: "Department-level management. Can approve tickets, manage team, view reports.", userCount: 4, permissions: ["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports", "Manage Team"] },
  { id: "R003", name: "Resolver", description: "Can work on and resolve assigned tickets. Update ticket status and add comments.", userCount: 3, permissions: ["View Assigned Tickets", "Update Ticket Status", "Add Comments", "View Knowledge Base"] },
  { id: "R004", name: "End User", description: "Can raise tickets and track their own requests. View knowledge base articles.", userCount: 3, permissions: ["Raise Ticket", "Track Own Tickets", "View Knowledge Base", "View Announcements"] },
];
