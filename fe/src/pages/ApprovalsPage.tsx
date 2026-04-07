import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { hasAnyRole } from "@/lib/roles";
import { tickets as dummyTickets } from "@/data/dummyData";
import type { Ticket } from "@/data/dummyData";
import { CheckCircle2, XCircle, Clock, Eye, ShieldCheck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api";
import type { ApiTicket } from "@/lib/api";
 
const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};
 
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
    createdAt: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : "",
    updatedAt: t.updated_at ? new Date(t.updated_at).toISOString().split("T")[0] : "",
    dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "",
    slaBreached: t.sla_breached,
    approvalRequired: t.approval_required,
    approvalType: t.approval_type || undefined,
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
 
const ApprovalsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"pending" | "approved" | "rejected" | "followup" | "all">("pending");
 
  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserRole = parsedUser?.role || "User";
  const currentUserName = parsedUser?.name || "";
  const managedCenters: string[] = parsedUser?.managed_centers || [];

  const isAomRole = hasAnyRole(currentUserRole, ["Area Operations Manager", "Area Operations Manager Head"]);
  const isFinanceRole = hasAnyRole(currentUserRole, ["Finance", "Finance Head"]);

  const fetchTickets = useCallback(async () => {
    try {
      const apiTickets = await ticketsApi.list();
      const allTickets = apiTickets.map(apiToTicket);
      setData(allTickets.filter((t) => {
        if (!t.approvalRequired) return false;
        // Already processed tickets (Approved/Rejected/Follow Up) visible to all relevant roles
        const isProcessed = t.approvalStatus === "Approved" || t.approvalStatus === "Rejected" || t.status === "Follow Up";
        if (isFinanceRole) {
          return t.approvalType === "aom_finance" && (t.approver === "Finance Team" || isProcessed);
        }
        if (isAomRole) {
          if (isProcessed) {
            // Show processed tickets from managed centers or where user was approver
            const isManagedCenter = managedCenters.length > 0 && managedCenters.includes(t.center);
            return t.approver === currentUserName || isManagedCenter;
          }
          if (t.approver === "Finance Team") return false;
          const isApprover = t.approver === currentUserName;
          const isManagedCenter = managedCenters.length > 0 && managedCenters.includes(t.center);
          return isApprover || isManagedCenter;
        }
        return true; // Super admin sees all
      }));
    } catch {
      setData(dummyTickets.filter((t) => t.approvalRequired));
    } finally {
      setLoading(false);
    }
  }, [isAomRole, isFinanceRole, currentUserName, managedCenters]);
 
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
 
  const filtered = data.filter((t) => {
    if (filterTab === "pending") return t.approvalStatus === "Pending" || !t.approvalStatus;
    if (filterTab === "approved") return t.approvalStatus === "Approved";
    if (filterTab === "rejected") return t.approvalStatus === "Rejected";
    if (filterTab === "followup") return t.status === "Follow Up";
    return true;
  });

  const pendingCount = data.filter((t) => t.approvalStatus === "Pending" || !t.approvalStatus).length;
  const approvedCount = data.filter((t) => t.approvalStatus === "Approved").length;
  const rejectedCount = data.filter((t) => t.approvalStatus === "Rejected").length;
  const followUpCount = data.filter((t) => t.status === "Follow Up").length;
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
 
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold font-display">Pending Approvals</h1>
 
      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {([
          { key: "pending" as const, label: "Pending", count: pendingCount, icon: Clock },
          { key: "approved" as const, label: "Approved", count: approvedCount, icon: CheckCircle2 },
          { key: "rejected" as const, label: "Rejected", count: rejectedCount, icon: XCircle },
          { key: "followup" as const, label: "Follow Up", count: followUpCount, icon: RotateCcw },
          { key: "all" as const, label: "All", count: data.length, icon: ShieldCheck },
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
 
      <p className="text-xs text-muted-foreground">{filtered.length} request{filtered.length !== 1 && "s"} found</p>
 
      {/* Approvals Table */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Ticket ID</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Raised By</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Center</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Approval Status</th>
                <th className="px-4 py-3 font-semibold">Approver</th>
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
                    onClick={() => navigate(`/tickets/${(t as Ticket & { _dbId: number })._dbId}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary font-medium whitespace-nowrap">{t.id}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{t.category || "—"}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.raisedBy}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.assignedDept || "—"}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.center || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", priorityColor)}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.approvalStatus || "Pending"])}>
                        {t.approvalStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.approver || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{t.createdAt || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${(t as Ticket & { _dbId: number })._dbId}`); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No {filterTab !== "all" ? filterTab : ""} approval requests found.</p>
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
 
export default ApprovalsPage;
 