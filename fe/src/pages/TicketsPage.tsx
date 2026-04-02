import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isSuperRole, hasAnyRole } from "@/lib/roles";
import { tickets as dummyTickets, departments as fallbackDepartments } from "@/data/dummyData";
import type { Ticket } from "@/data/dummyData";
import { Search, Plus, Eye, AlertTriangle, CheckCircle2, X, FileText, ListChecks, Download, ArrowLeft, RefreshCw, User as UserIcon } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { cn } from "@/lib/utils";
import RaiseTicketModal from "@/components/RaiseTicketModal";
import type { TicketFormData } from "@/components/RaiseTicketModal";
import { ticketsApi, departmentsApi } from "@/lib/api";
import type { ApiTicket } from "@/lib/api";

const priorityColors: Record<string, string> = {
  Critical: "bg-destructive",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-muted-foreground",
};

const statusColors: Record<string, string> = {
  Open: "bg-info text-info-foreground",
  "In Progress": "bg-warning text-warning-foreground",
  "Pending Approval": "bg-accent text-accent-foreground",
  Approved: "bg-emerald-100 text-emerald-700",
  Acknowledged: "bg-blue-100 text-blue-700",
  "Awaiting User Inputs": "bg-amber-100 text-amber-700",
  "User Inputs Received": "bg-purple-100 text-purple-700",
  "Follow Up": "bg-orange-100 text-orange-700",
  Resolved: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
  Rejected: "bg-destructive text-destructive-foreground",
  Cancelled: "bg-gray-200 text-gray-600",
  "Escalated to L1": "bg-orange-200 text-orange-800",
  "Escalated to L2": "bg-red-200 text-red-800",
  "Reopened by CDD": "bg-amber-200 text-amber-800",
  "Final Closed": "bg-emerald-200 text-emerald-800",
};

// Convert API ticket to frontend Ticket shape
function apiToTicket(t: ApiTicket): Ticket & { _dbId: number; tatHours: number | null; tatBreached: boolean } {
  return {
    id: t.code,
    title: t.title,
    description: t.description || "",
    category: t.category || "",
    subCategory: t.sub_category || "",
    priority: (t.priority as Ticket["priority"]) || "Medium",
    status: (t.status as Ticket["status"]) || "Open",
    raisedBy: t.raised_by || "Unknown",
    raisedByDept: t.raised_by_dept || "",
    assignedTo: t.assigned_to || "Unassigned",
    assignedDept: t.assigned_dept || "",
    center: t.center || "",
    createdAt: t.created_at ? new Date(t.created_at).toLocaleString() : "",
    updatedAt: t.updated_at ? new Date(t.updated_at).toLocaleString() : "",
    dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "",
    slaBreached: t.sla_breached,
    approvalRequired: t.approval_required,
    approver: t.approver || undefined,
    approvalStatus: t.approval_status as Ticket["approvalStatus"],
    resolution: t.resolution || undefined,
    comments: t.comments.map((c) => ({
      id: String(c.id),
      user: c.user || "System",
      message: c.message,
      timestamp: c.created_at ? new Date(c.created_at).toLocaleString() : "",
      type: c.type as "comment" | "status_change" | "approval",
    })),
    zenotiLocation: t.zenoti_location || undefined,
    zenotiMainCategory: t.zenoti_main_category || undefined,
    zenotiSubCategory: t.zenoti_sub_category || undefined,
    zenotiChildCategory: t.zenoti_child_category || undefined,
    zenotiMobileNumber: t.zenoti_mobile_number || undefined,
    zenotiCustomerId: t.zenoti_customer_id || undefined,
    zenotiCustomerName: t.zenoti_customer_name || undefined,
    zenotiBilledBy: t.zenoti_billed_by || undefined,
    zenotiInvoiceNo: t.zenoti_invoice_no || undefined,
    zenotiInvoiceDate: t.zenoti_invoice_date || undefined,
    zenotiAmount: t.zenoti_amount || undefined,
    zenotiDescription: t.zenoti_description || undefined,
    _dbId: t.id, // keep DB id for API calls
    tatHours: t.tat_hours,
    tatBreached: t.tat_breached,
    originalAssignedTo: t.original_assigned_to || null,
    escalationLevel: t.escalation_level || 0,
  } as Ticket & { _dbId: number; tatHours: number | null; tatBreached: boolean; originalAssignedTo: string | null; escalationLevel: number };
}

type TabKey = "all" | "assigned" | "mytickets" | "raised" | "resolved";

const TicketsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingApi, setUsingApi] = useState(false);
  const [deptOptions, setDeptOptions] = useState<string[]>(fallbackDepartments.map((d) => d.name));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [showRaise, setShowRaise] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const ZENOTI_ASSIGNEE_IDS = [707, 816, 823]; // Kalyani, Ramya, Swapna (not Poornima - she's a manager)
  const storedUserId = JSON.parse(localStorage.getItem("oliva_user") || "{}")?.id;
  const isZenotiAssignee = ZENOTI_ASSIGNEE_IDS.includes(storedUserId);
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl || "all");
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Current user from localStorage
  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUser = parsedUser?.name || "User";
  const currentUserRole = parsedUser?.role || "User";
  const currentUserDept = parsedUser?.department || "";
  const currentUserCenter = parsedUser?.center || "";
  const managedCenters: string[] = parsedUser?.managed_centers || [];
  const isCddUser = currentUserDept.toUpperCase() === "CDD";

  const fetchTickets = useCallback(async () => {
    try {
      const apiTickets = await ticketsApi.list();
      setData(apiTickets.map(apiToTicket));
      setUsingApi(true);
    } catch {
      // Backend not available — fall back to dummy data
      setData([...dummyTickets]);
      setUsingApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync tab from URL when sidebar link is clicked
  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    fetchTickets();
    departmentsApi.list()
      .then((depts) => {
        if (depts.length > 0) setDeptOptions(depts.map((d) => d.name));
      })
      .catch(() => {});
  }, [fetchTickets]);

  // Role-to-department mapping: which roles see which department's tickets
  const roleDeptMap: Record<string, string[]> = {
    "Zenoti Team": ["Zenoti"],
    "Zenoti Team Manager": ["Zenoti"],
    "Area Operations Manager": ["Zenoti"],
    "Area Operations Manager Head": ["Zenoti"],
    "Finance": ["Zenoti"],
    "Finance Head": ["Zenoti"],
    "Help Desk Admin": [], // sees all (handled below)
    "Helpdesk Admin": ["Admin Department"], // sees their center's admin tickets
    "Admin Department": ["Admin Department"], // sees all admin dept tickets
    "Helpdesk In-charge": [], // sees all
    "L1 Manager": [], // sees all
    "L2 Manager": [], // sees all
  };

  // Determine which departments this user can see
  const getUserDepts = (): string[] => {
    const userRoles = currentUserRole.split(",").map((r) => r.trim());
    const depts = new Set<string>();
    for (const role of userRoles) {
      const mapped = roleDeptMap[role];
      if (mapped) mapped.forEach((d) => depts.add(d));
    }
    // If user has a department assigned, include that too
    if (currentUserDept) {
      depts.add(currentUserDept);
      // Quality & Audit team also sees Quality department tickets
      if (currentUserDept.toLowerCase().includes("quality")) depts.add("Quality");
      // Admin Department team sees only Admin Department tickets (not Administration)
      if (currentUserDept === "Admin Department") {
        depts.add("Admin Department");
      }
    }
    return [...depts];
  };

  // Super roles see all tickets; Employee/Others see only their own; other roles see their department's tickets
  const roleFiltered = isSuperRole(currentUserRole)
    ? data
    : hasAnyRole(currentUserRole, ["Employee", "Others"])
      ? data.filter((t) => t.raisedBy === currentUser)
      : hasAnyRole(currentUserRole, ["Help Desk Admin", "Helpdesk In-charge", "L1 Manager", "L2 Manager"])
        ? data // these roles see all tickets
        : hasAnyRole(currentUserRole, ["Helpdesk Admin"])
        ? data.filter((t) => t.center === currentUserCenter || t.raisedBy === currentUser) // Helpdesk Admin sees center tickets
        : hasAnyRole(currentUserRole, ["Admin Department"])
        ? data.filter((t) => {
            if (t.raisedBy === currentUser) return true;
            if (t.assignedDept !== "Admin Department") return false;
            // Users with "Can View and Edit" (e.g. Rajesh) see all admin dept tickets
            const mapAccess = parsedUser?.map_level_access || "";
            if (mapAccess === "Can View and Edit") return true;
            // Others: filter by managed centers (assigned locations)
            if (managedCenters.length > 0) {
              return managedCenters.some((c) => c.toLowerCase() === (t.center || "").toLowerCase());
            }
            return true;
          })
        : (() => {
            const allowedDepts = getUserDepts();
            const isAom = hasAnyRole(currentUserRole, ["Area Operations Manager", "Area Operations Manager Head"]);
            if (isAom) {
              // AOM sees: tickets they raised, tickets they are approver for, tickets assigned to them, and tickets from their managed centers
              return data.filter((t) =>
                t.raisedBy === currentUser ||
                (t.approver === currentUser && t.approvalRequired) ||
                t.assignedTo === currentUser ||
                (managedCenters.length > 0 && managedCenters.some((c) => c.toLowerCase() === (t.center || "").toLowerCase()))
              );
            }
            return allowedDepts.length > 0
              ? data.filter((t) => {
                  if (t.raisedBy === currentUser) return true;
                  if (!allowedDepts.includes(t.assignedDept)) return false;
                  return true;
                })
              : currentUserDept
                ? data.filter((t) => t.assignedDept === currentUserDept || t.raisedByDept === currentUserDept || t.raisedBy === currentUser)
                : data.filter((t) => t.raisedBy === currentUser);
          })();

  // Filter by tab
  const tabFiltered = roleFiltered.filter((t) => {
    if (activeTab === "assigned") return t.assignedTo && t.assignedTo !== "Unassigned";
    if (activeTab === "mytickets") return t.assignedTo === currentUser;
    if (activeTab === "raised") return t.raisedBy === currentUser;
    if (activeTab === "resolved") return t.status === "Resolved" || t.status === "Closed";
    return true;
  });

  const filtered = tabFiltered.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || ((t as Ticket & { zenotiCustomerId?: string }).zenotiCustomerId || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    const matchDept = deptFilter === "All" || t.assignedDept === deptFilter;
    return matchSearch && matchStatus && matchPriority && matchDept;
  });

  const handleRaiseSuccess = async (formData: TicketFormData) => {
    if (usingApi) {
      try {
        await ticketsApi.create({
          title: formData.title,
          description: formData.description,
          category: formData.zenotiMainCategory || formData.category,
          sub_category: formData.zenotiSubCategory || formData.subCategory,
          priority: formData.priority,
          center: formData.center,
          assigned_dept: formData.department,
          approval_required: formData.department === "Zenoti" && formData.category !== "Operational Issues",
          approval_type: formData.department === "Zenoti"
            ? formData.category === "Zenoti-Finance" ? "aom_finance"
              : formData.category === "Zenoti-Operational" ? "aom_only"
              : undefined
            : undefined,
          zenoti_location: formData.zenotiLocation,
          zenoti_main_category: formData.zenotiMainCategory,
          zenoti_sub_category: formData.zenotiSubCategory,
          zenoti_child_category: formData.zenotiChildCategory,
          zenoti_mobile_number: formData.zenotiMobileNumber,
          zenoti_customer_id: formData.zenotiCustomerId,
          zenoti_customer_name: formData.zenotiCustomerName,
          zenoti_billed_by: formData.zenotiBilledBy,
          zenoti_invoice_no: formData.zenotiInvoiceNo,
          zenoti_invoice_date: formData.zenotiInvoiceDate,
          zenoti_amount: formData.zenotiAmount,
          zenoti_description: formData.zenotiDescription,
        });
        await fetchTickets(); // Refresh from DB
      } catch {
        // If API fails, add locally
        addTicketLocally(formData);
      }
    } else {
      addTicketLocally(formData);
    }
    setShowRaise(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const addTicketLocally = (formData: TicketFormData) => {
    const newTicket: Ticket = {
      id: `TKT-${String(data.length + 1).padStart(4, "0")}`,
      title: formData.title,
      description: formData.description,
      category: formData.zenotiMainCategory || formData.category,
      subCategory: formData.zenotiSubCategory || formData.subCategory,
      priority: formData.priority as Ticket["priority"],
      status: "Open",
      raisedBy: currentUser,
      raisedByDept: formData.department,
      assignedTo: "Unassigned",
      assignedDept: formData.department,
      center: formData.center,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      slaBreached: false,
      approvalRequired: formData.department === "Zenoti" && formData.zenotiMainCategory !== "Operational Issues",
      comments: [],
      zenotiLocation: formData.zenotiLocation,
      zenotiMainCategory: formData.zenotiMainCategory,
      zenotiSubCategory: formData.zenotiSubCategory,
      zenotiChildCategory: formData.zenotiChildCategory,
      zenotiMobileNumber: formData.zenotiMobileNumber,
      zenotiCustomerId: formData.zenotiCustomerId,
      zenotiCustomerName: formData.zenotiCustomerName,
      zenotiBilledBy: formData.zenotiBilledBy,
      zenotiInvoiceNo: formData.zenotiInvoiceNo,
      zenotiInvoiceDate: formData.zenotiInvoiceDate,
      zenotiAmount: formData.zenotiAmount,
      zenotiDescription: formData.zenotiDescription,
    };
    setData((prev) => [newTicket, ...prev]);
  };

  const goToTicket = (ticket: Ticket) => {
    const dbId = (ticket as Ticket & { _dbId?: number })?._dbId;
    if (dbId) {
      navigate(`/tickets/${dbId}`);
    }
  };


  const handleEditSuccess = async (formData: TicketFormData) => {
    if (usingApi && editingTicket) {
      const dbId = (editingTicket as Ticket & { _dbId?: number })?._dbId;
      if (dbId) {
        try {
          await ticketsApi.update(dbId, {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            sub_category: formData.subCategory,
            priority: formData.priority,
            center: formData.center,
            assigned_dept: formData.department,
            ...(formData.status && { status: formData.status }),
            zenoti_location: formData.zenotiLocation,
            zenoti_main_category: formData.zenotiMainCategory,
            zenoti_sub_category: formData.zenotiSubCategory,
            zenoti_child_category: formData.zenotiChildCategory,
            zenoti_mobile_number: formData.zenotiMobileNumber,
            zenoti_customer_id: formData.zenotiCustomerId,
            zenoti_customer_name: formData.zenotiCustomerName,
            zenoti_billed_by: formData.zenotiBilledBy,
            zenoti_invoice_no: formData.zenotiInvoiceNo,
            zenoti_invoice_date: formData.zenotiInvoiceDate,
            zenoti_amount: formData.zenotiAmount,
            zenoti_description: formData.zenotiDescription,
          });
          await fetchTickets();
        } catch {
          updateTicketLocally(formData);
        }
      }
    } else {
      updateTicketLocally(formData);
    }
    setEditingTicket(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const updateTicketLocally = (formData: TicketFormData) => {
    if (!editingTicket) return;
    setData((prev) => prev.map((t) =>
      t.id === editingTicket.id
        ? {
            ...t, title: formData.title, description: formData.description,
            category: formData.category, subCategory: formData.subCategory,
            priority: formData.priority as Ticket["priority"], center: formData.center,
            assignedDept: formData.department,
            zenotiLocation: formData.zenotiLocation,
            zenotiMainCategory: formData.zenotiMainCategory,
            zenotiSubCategory: formData.zenotiSubCategory,
            zenotiChildCategory: formData.zenotiChildCategory,
            zenotiMobileNumber: formData.zenotiMobileNumber,
            zenotiCustomerId: formData.zenotiCustomerId,
            zenotiCustomerName: formData.zenotiCustomerName,
            zenotiBilledBy: formData.zenotiBilledBy,
            zenotiInvoiceNo: formData.zenotiInvoiceNo,
            zenotiInvoiceDate: formData.zenotiInvoiceDate,
            zenotiAmount: formData.zenotiAmount,
            zenotiDescription: formData.zenotiDescription,
          }
        : t
    ));
  };

  const myTicketsCount = roleFiltered.filter((t) => t.assignedTo === currentUser).length;
  const raisedCount = roleFiltered.filter((t) => t.raisedBy === currentUser).length;
  const resolvedCount = roleFiltered.filter((t) => t.status === "Resolved" || t.status === "Closed").length;

  const tabs: { key: TabKey; label: string; icon: typeof FileText; count: number }[] = [
    { key: "all", label: "All Tickets", icon: ListChecks, count: roleFiltered.length },
    { key: "mytickets", label: "My Tickets", icon: UserIcon, count: myTicketsCount },
    { key: "raised", label: "Raised Tickets", icon: FileText, count: raisedCount },
    { key: "resolved", label: "Resolved Tickets", icon: CheckCircle2, count: resolvedCount },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="text-xl font-bold font-display">Ticket Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => {
              const exportData = filtered.map((t) => {
                const tatData = t as Ticket & { tatHours?: number | null; tatBreached?: boolean };
                return {
                  "Ticket ID": t.id,
                  "Title": t.title,
                  "Category": t.category,
                  "Sub-Category": t.subCategory || "",
                  "Child Category": (t as Ticket & { zenotiChildCategory?: string }).zenotiChildCategory || "",
                  "Priority": t.priority,
                  "Status": t.status,
                  "Raised By": t.raisedBy,
                  "Assigned To": t.assignedTo,
                  "Department": t.assignedDept,
                  "Center": t.center,
                  "Created Timestamp": t.createdAt,
                  "Closed Timestamp": (t.status === "Closed" || t.status === "Resolved") ? t.updatedAt : "",
                  [isCddUser ? "TAT Breached" : "SLA Breached"]: isCddUser ? (tatData.tatBreached ? "Yes" : "No") : (t.slaBreached ? "Yes" : "No"),
                  ...(isCddUser && { "TAT Hours": tatData.tatHours != null ? tatData.tatHours : "" }),
                };
              });
              exportToExcel(exportData, "Tickets", "Tickets");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => setShowRaise(true)}
            className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Raise Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Pending Approval</option>
          <option>Follow Up</option>
          <option>Resolved</option>
          <option>Closed</option>
          <option>Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Priority</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Departments</option>
          {deptOptions.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 && "s"} found</p>

      {/* Table */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Ticket ID</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned Dept</th>
              <th className="px-4 py-3 font-medium">Assigned To</th>
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">{isCddUser ? "TAT" : "SLA"}</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((t) => {
              const tatData = t as Ticket & { _dbId?: number; tatHours?: number | null; tatBreached?: boolean };
              const tatHours = tatData.tatHours;
              const tatBreached = tatData.tatBreached || false;
              const isBreached = isCddUser ? tatBreached : t.slaBreached;
              const formatTatHours = (hrs: number | null | undefined) => {
                if (hrs == null) return "—";
                if (hrs < 1) return `${Math.round(hrs * 60)}m`;
                return `${Math.floor(hrs)}h ${Math.round((hrs % 1) * 60)}m`;
              };
              return (
              <tr key={t.id} className={cn("border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer", isBreached && (isCddUser ? "bg-red-50 dark:bg-red-950/20" : "bg-destructive/5"))} onClick={() => goToTicket(t)}>
                <td className="px-4 py-3">
                  <span className={cn("font-mono text-xs font-medium hover:underline", isBreached ? "text-destructive font-bold" : "text-primary")}>{t.id}</span>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="font-medium truncate">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.raisedBy}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className={cn("h-2 w-2 rounded-full", priorityColors[t.priority])} />
                    {t.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.status] || "bg-gray-100 text-gray-600")}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.assignedDept}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {t.assignedTo || "—"}
                  {(() => {
                    const ext = t as Ticket & { originalAssignedTo?: string | null; escalationLevel?: number };
                    if (ext.escalationLevel && ext.escalationLevel >= 2 && ext.originalAssignedTo) {
                      return <p className="text-[10px] text-destructive mt-0.5">L1: {ext.originalAssignedTo}</p>;
                    }
                    return null;
                  })()}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.center}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.createdAt}</td>
                <td className="px-4 py-3">
                  {isCddUser ? (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                      tatBreached
                        ? "bg-destructive/10 text-destructive"
                        : "bg-success/10 text-success"
                    )}>
                      {tatBreached && <AlertTriangle className="h-3 w-3" />}
                      {formatTatHours(tatHours)}
                    </span>
                  ) : (
                    t.slaBreached ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Breached
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-success">On Track</span>
                    )
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); goToTicket(t); }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            }) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No tickets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Raise Ticket Modal */}
      {showRaise && <RaiseTicketModal onClose={() => setShowRaise(false)} onSuccess={handleRaiseSuccess} userDepartment={currentUserDept} />}

      {/* Edit/Modify Ticket Modal */}
      {editingTicket && (
        <RaiseTicketModal
          onClose={() => setEditingTicket(null)}
          onSuccess={handleEditSuccess}
          editMode
          editTicket={editingTicket}
          userRole={currentUserRole}
        />
      )}

      {/* Success popup */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-xl bg-card border border-success/30 shadow-lg animate-slide-in">
          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold">Service request raised successfully!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your ticket has been submitted and assigned.</p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-2 p-1 rounded-md hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
};

export default TicketsPage;
