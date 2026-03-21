import { useState, useEffect, useCallback } from "react";
import type { Ticket } from "@/data/dummyData";
import { CheckCircle2, Eye, Wrench, Clock, XCircle, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api";
import type { ApiTicket } from "@/lib/api";
import TicketDetailModal from "@/components/TicketDetailModal";

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
  const [data, setData] = useState<(Ticket & { _dbId: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<(Ticket & { _dbId: number }) | null>(null);
  const [filterTab, setFilterTab] = useState<"active" | "resolved" | "closed" | "all">("active");
  const [resolveAction, setResolveAction] = useState<"Resolve" | "Close">("Resolve");
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserName = parsedUser?.name || "Zenoti Team";

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
    if (filterTab === "active") return t.status === "In Progress" || t.status === "Open";
    if (filterTab === "resolved") return t.status === "Resolved";
    if (filterTab === "closed") return t.status === "Closed";
    return true;
  });

  const activeCount = data.filter((t) => t.status === "In Progress" || t.status === "Open").length;
  const resolvedCount = data.filter((t) => t.status === "Resolved").length;
  const closedCount = data.filter((t) => t.status === "Closed").length;

  const handleResolve = async () => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      await ticketsApi.resolve(selectedTicket._dbId, {
        action: resolveAction,
        resolution: resolution || undefined,
        user_name: currentUserName,
      });
      setResolution("");
      setResolveAction("Resolve");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert("Failed to update ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

      <p className="text-xs text-muted-foreground">{filtered.length} request{filtered.length !== 1 && "s"} found</p>

      {/* Request cards */}
      <div className="grid gap-3">
        {filtered.length > 0 ? filtered.map((t) => (
          <div
            key={t.id}
            className="bg-card rounded-xl p-5 card-shadow border border-border hover:elevated-shadow transition-shadow cursor-pointer"
            onClick={() => { setSelectedTicket(t); setResolution(""); setResolveAction("Resolve"); }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-primary font-medium">{t.id}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.status] || "bg-muted text-muted-foreground")}>
                    {t.status}
                  </span>
                  {t.approvalStatus === "Approved" && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success">
                      Approved
                    </span>
                  )}
                  {(t.category?.toLowerCase().startsWith("zenoti") || t.zenotiMainCategory?.toLowerCase().startsWith("zenoti")) && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">
                      {t.zenotiMainCategory || t.category}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Raised by: <span className="text-foreground font-medium">{t.raisedBy}</span></span>
                  <span>Center: <span className="text-foreground font-medium">{t.center}</span></span>
                  <span>Department: <span className="text-foreground font-medium">{t.assignedDept}</span></span>
                </div>
                {/* Show approval trail */}
                {t.comments.filter((c) => c.type === "approval").length > 0 && (
                  <div className="mt-2 px-3 py-2 bg-success/5 border border-success/20 rounded-lg">
                    <p className="text-[11px] font-medium text-success">Approval History</p>
                    {t.comments.filter((c) => c.type === "approval").map((c) => (
                      <p key={c.id} className="text-[11px] text-muted-foreground mt-0.5">{c.message}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setResolution(""); setResolveAction("Resolve"); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Review
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-card rounded-xl p-8 card-shadow border border-border text-center">
            <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {filterTab !== "all" ? filterTab : ""} Zenoti requests found.</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal + Resolve/Close actions */}
      {selectedTicket && (
        <>
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            canApprove={false}
            currentUserName={currentUserName}
            onApprovalDone={() => { fetchTickets(); setSelectedTicket(null); }}
            extraActions={
              (selectedTicket.status === "In Progress" || selectedTicket.status === "Open" || selectedTicket.status === "Resolved") ? (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Zenoti Team Actions
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Action</label>
                      <select
                        value={resolveAction}
                        onChange={(e) => setResolveAction(e.target.value as "Resolve" | "Close")}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="Resolve">Resolve (corrections made)</option>
                        <option value="Close">Close (reviewed & complete)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Resolution / Notes</label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                        placeholder="Describe corrections made or resolution notes..."
                      />
                    </div>
                    <button
                      onClick={handleResolve}
                      disabled={submitting}
                      className={cn(
                        "w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors",
                        resolveAction === "Close"
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "bg-primary hover:bg-primary/90",
                        submitting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {submitting ? "Processing..." : resolveAction === "Close" ? "Close Request" : "Mark as Resolved"}
                    </button>
                  </div>
                </div>
              ) : null
            }
          />
        </>
      )}
    </div>
  );
};

export default ZenotiRequestsPage;
