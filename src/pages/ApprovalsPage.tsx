import { useState, useEffect, useCallback } from "react";
import { tickets as dummyTickets } from "@/data/dummyData";
import type { Ticket } from "@/data/dummyData";
import { CheckCircle2, XCircle, Clock, Eye, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api";
import type { ApiTicket } from "@/lib/api";
import TicketDetailModal from "@/components/TicketDetailModal";

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
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterTab, setFilterTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserName = parsedUser?.name || "User";
  const currentUserRole = parsedUser?.role || "User";

  const fetchTickets = useCallback(async () => {
    try {
      const apiTickets = await ticketsApi.list();
      const allTickets = apiTickets.map(apiToTicket);
      setData(allTickets.filter((t) => t.approvalRequired));
    } catch {
      setData(dummyTickets.filter((t) => t.approvalRequired));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = data.filter((t) => {
    if (filterTab === "pending") return t.approvalStatus === "Pending" || !t.approvalStatus;
    if (filterTab === "approved") return t.approvalStatus === "Approved";
    if (filterTab === "rejected") return t.approvalStatus === "Rejected";
    return true;
  });

  const pendingCount = data.filter((t) => t.approvalStatus === "Pending" || !t.approvalStatus).length;
  const approvedCount = data.filter((t) => t.approvalStatus === "Approved").length;
  const rejectedCount = data.filter((t) => t.approvalStatus === "Rejected").length;

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

      <div className="grid gap-3">
        {filtered.length > 0 ? filtered.map((t) => (
          <div
            key={t.id}
            className="bg-card rounded-xl p-5 card-shadow border border-border hover:elevated-shadow transition-shadow cursor-pointer"
            onClick={() => setSelectedTicket(t)}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-primary font-medium">{t.id}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.approvalStatus || "Pending"])}>
                    {t.approvalStatus || "Pending"}
                  </span>
                  {(t.category?.toLowerCase() === "zenoti-finance" || t.zenotiMainCategory?.toLowerCase() === "zenoti-finance") && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                      Zenoti-Finance
                    </span>
                  )}
                </div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Raised by: <span className="text-foreground font-medium">{t.raisedBy}</span></span>
                  <span>Department: <span className="text-foreground font-medium">{t.assignedDept}</span></span>
                  <span>Center: <span className="text-foreground font-medium">{t.center}</span></span>
                  {t.approver && <span>Approver: <span className="text-foreground font-medium">{t.approver}</span></span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-card rounded-xl p-8 card-shadow border border-border text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {filterTab !== "all" ? filterTab : ""} approval requests found.</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal with approval actions */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          canApprove={["Area Operations Manager", "Area Operations Manager Head", "Manager", "L1 Manager", "L2 Manager", "Finance", "Finance Head"].includes(currentUserRole)}
          currentUserName={currentUserName}
          onApprovalDone={() => { fetchTickets(); setSelectedTicket(null); }}
        />
      )}
    </div>
  );
};

export default ApprovalsPage;
