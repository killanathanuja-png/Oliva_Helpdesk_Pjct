import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Ticket } from "@/data/dummyData";
import { CheckCircle2, Eye, Wrench, Clock, XCircle, PackageCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api";
import type { ApiTicket } from "@/lib/api";

const statusColors: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-success/10 text-success",
  Closed: "bg-muted text-muted-foreground",
  Open: "bg-warning/10 text-warning",
};

function apiToTicket(t: ApiTicket): Ticket & { _dbId: number } {
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
    createdAt: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : "",
    updatedAt: t.updated_at ? new Date(t.updated_at).toISOString().split("T")[0] : "",
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
    _dbId: t.id,
  } as Ticket & { _dbId: number };
}

const ZenotiRequestsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<(Ticket & { _dbId: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"active" | "resolved" | "closed" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const apiTickets = await ticketsApi.list();
      const allTickets = apiTickets.map(apiToTicket);
      // Show tickets assigned to Zenoti dept OR Zenoti-related categories
      setData(allTickets.filter((t) => {
        const dept = (t.assignedDept || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const mainCat = (t.zenotiMainCategory || "").toLowerCase();
        return dept === "zenoti" ||
          cat.startsWith("zenoti") ||
          mainCat.startsWith("zenoti") ||
          cat === "operational issues";
      }));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = data.filter((t) => {
    const matchTab = filterTab === "active" ? (t.status === "In Progress" || t.status === "Open")
      : filterTab === "resolved" ? t.status === "Resolved"
      : filterTab === "closed" ? t.status === "Closed"
      : true;
    if (!matchTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (t.id || "").toLowerCase().includes(q) ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.zenotiCustomerId || "").toLowerCase().includes(q) ||
        (t.raisedBy || "").toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = data.filter((t) => t.status === "In Progress" || t.status === "Open").length;
  const resolvedCount = data.filter((t) => t.status === "Resolved").length;
  const closedCount = data.filter((t) => t.status === "Closed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display">Zenoti Requests</h1>
          <p className="text-xs text-muted-foreground">Review approved requests, make corrections, and close tickets</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {([
          { key: "active" as const, label: "Active", count: activeCount, icon: Clock },
          { key: "resolved" as const, label: "Resolved", count: resolvedCount, icon: CheckCircle2 },
          { key: "closed" as const, label: "Closed", count: closedCount, icon: XCircle },
          { key: "all" as const, label: "All", count: data.length, icon: PackageCheck },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              filterTab === tab.key
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
              filterTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by Ticket ID, Title, Client ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} request{filtered.length !== 1 && "s"} found</p>

      {/* Requests Table */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Ticket ID</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Client ID</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Raised By</th>
                <th className="px-4 py-3 font-semibold">Center</th>
                <th className="px-4 py-3 font-semibold">Approval</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((t) => {
                const priorityColor = t.priority === "Critical" ? "bg-destructive/10 text-destructive" : t.priority === "High" ? "bg-warning/10 text-warning" : t.priority === "Medium" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground";
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets/${t._dbId}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary font-medium whitespace-nowrap">{t.id}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">{t.zenotiCustomerId || "—"}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {(t.category?.toLowerCase().startsWith("zenoti") || t.zenotiMainCategory?.toLowerCase().startsWith("zenoti")) ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">
                          {t.zenotiMainCategory || t.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t.category || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", priorityColor)}>{t.priority}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.status] || "bg-muted text-muted-foreground")}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.raisedBy}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.center || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.approvalStatus === "Approved" ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success">Approved</span>
                      ) : t.approvalStatus ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/10 text-warning">{t.approvalStatus}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{t.createdAt || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setResolution(""); setResolveAction("Resolve"); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No {filterTab !== "all" ? filterTab : ""} Zenoti requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ZenotiRequestsPage;
