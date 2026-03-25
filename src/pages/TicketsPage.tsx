import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
};

// Convert API ticket to frontend Ticket shape
function apiToTicket(t: ApiTicket): Ticket {
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
  } as Ticket & { _dbId: number };
}

type TabKey = "all" | "mytickets" | "raised" | "resolved";

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
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Current user from localStorage
  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUser = parsedUser?.name || "User";
  const currentUserRole = parsedUser?.role || "User";
  const currentUserDept = parsedUser?.department || "";
  const currentUserCenter = parsedUser?.center || "";

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
    "Area Operations Manager": ["Zenoti"],
    "Area Operations Manager Head": ["Zenoti"],
    "Finance": ["Zenoti"],
    "Finance Head": ["Zenoti"],
    "Help Desk Admin": [], // sees all (handled below)
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
    if (currentUserDept) depts.add(currentUserDept);
    return [...depts];
  };

  // Super roles see all tickets; Employee/Others see only their own; other roles see their department's tickets
  const roleFiltered = isSuperRole(currentUserRole)
    ? data
    : hasAnyRole(currentUserRole, ["Employee", "Others"])
      ? data.filter((t) => t.raisedBy === currentUser)
      : hasAnyRole(currentUserRole, ["Help Desk Admin", "Helpdesk In-charge", "L1 Manager", "L2 Manager"])
        ? data // these roles see all tickets
        : (() => {
            const allowedDepts = getUserDepts();
            const isAom = hasAnyRole(currentUserRole, ["Area Operations Manager", "Area Operations Manager Head"]);
            return allowedDepts.length > 0
              ? data.filter((t) => {
                  if (t.raisedBy === currentUser) return true;
                  if (!allowedDepts.includes(t.assignedDept)) return false;
                  // AOM only sees tickets from their own center
                  if (isAom && currentUserCenter && t.center && t.center !== currentUserCenter) return false;
                  return true;
                })
              : currentUserDept
                ? data.filter((t) => t.assignedDept === currentUserDept || t.raisedByDept === currentUserDept || t.raisedBy === currentUser)
                : data.filter((t) => t.raisedBy === currentUser);
          })();

  // Filter by tab
  const tabFiltered = roleFiltered.filter((t) => {
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
              const exportData = filtered.map((t) => ({
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
                "SLA Breached": t.slaBreached ? "Yes" : "No",
              }));
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

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 border border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-white shadow-md text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.key ? "text-primary" : "")} />
            {tab.label}
            <span className={cn(
              "text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-bold",
              activeTab === tab.key ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
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
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => goToTicket(t)}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-primary font-medium hover:underline">{t.id}</span>
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
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.assignedTo || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.center}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.createdAt}</td>
                <td className="px-4 py-3">
                  {t.slaBreached ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Breached
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-success">On Track</span>
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
            )) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No tickets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Raise Ticket Modal */}
      {showRaise && <RaiseTicketModal onClose={() => setShowRaise(false)} onSuccess={handleRaiseSuccess} />}

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
