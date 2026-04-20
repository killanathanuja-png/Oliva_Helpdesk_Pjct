import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hasAnyRole, isSuperRole } from "@/lib/roles";
import type { Ticket } from "@/data/dummyData";
import {
  ArrowLeft, Clock, User, Building2, MapPin, MessageSquare, CheckCircle2,
  ShieldCheck, Phone, CreditCard, FileText, IndianRupee, Send,
  Pencil, Loader2, Circle, Tag, Layers,
  Calendar, Timer, Save, X, Upload, Paperclip, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi, usersApi, centersApi } from "@/lib/api";
import type { ApiTicket, ApiUser } from "@/lib/api";
import RaiseTicketModal from "@/components/RaiseTicketModal";
import type { TicketFormData } from "@/components/RaiseTicketModal";

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
  "Escalated to L1": "bg-orange-200 text-orange-800",
  "Escalated to L2": "bg-red-200 text-red-800",
  "Reopened by CDD": "bg-amber-200 text-amber-800",
  "Final Closed": "bg-emerald-200 text-emerald-800",
};

const priorityDotColors: Record<string, string> = {
  Critical: "bg-destructive",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-muted-foreground",
};

interface TimelineEvent {
  id: string;
  type: "created" | "comment" | "status_change" | "approval";
  user: string;
  message: string;
  timestamp: string;
  rawDate?: Date;
}

function apiToTicket(t: ApiTicket): Ticket & { _dbId: number; rawCreatedAt: string } {
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
    escalationLevel: t.escalation_level || 0,
    escalatedTo: t.escalated_to || undefined,
    escalatedAt: t.escalated_at || undefined,
    acknowledgedAt: t.acknowledged_at || undefined,
    originalAssignedTo: t.original_assigned_to || undefined,
    actionRequired: t.action_required || undefined,
    clientCode: t.client_code || undefined,
    clientName: t.client_name || undefined,
    serviceName: t.service_name || undefined,
    crtName: t.crt_name || undefined,
    primaryDoctor: t.primary_doctor || undefined,
    therapistName: t.therapist_name || undefined,
    _dbId: t.id,
    rawCreatedAt: t.created_at || "",
  } as Ticket & { _dbId: number; rawCreatedAt: string };
}

function buildTimeline(ticket: Ticket & { _dbId: number; rawCreatedAt: string }): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  events.push({
    id: "created",
    type: "created",
    user: ticket.raisedBy,
    message: ticket.assignedDept === "IT Department"
      ? `Ticket raised and assigned to IT Department (Ramakrishna Kanchu & Suresh Kumar)`
      : `Ticket raised and assigned to ${ticket.assignedDept || "Unassigned"} department${(ticket as any).originalAssignedTo ? ` (${(ticket as any).originalAssignedTo})` : ticket.assignedTo && ticket.assignedTo !== "Unassigned" ? ` (${ticket.assignedTo})` : ""}`,
    timestamp: ticket.rawCreatedAt ? new Date(ticket.rawCreatedAt).toLocaleString() : ticket.createdAt,
    rawDate: ticket.rawCreatedAt ? new Date(ticket.rawCreatedAt) : undefined,
  });
  for (const c of ticket.comments) {
    events.push({
      id: c.id,
      type: c.type as TimelineEvent["type"],
      user: c.user,
      message: c.message,
      timestamp: c.timestamp,
      rawDate: c.timestamp ? new Date(c.timestamp) : undefined,
    });
  }
  events.sort((a, b) => {
    if (a.rawDate && b.rawDate) return a.rawDate.getTime() - b.rawDate.getTime();
    return 0;
  });
  return events;
}


// Light rounded-box read-only field
const Field = ({ label, value, icon: Icon, fullWidth, badge }: { label: string; value: string; icon?: typeof User; fullWidth?: boolean; badge?: boolean }) => (
  <div className={fullWidth ? "col-span-full" : ""}>
    <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </label>
    {badge ? (
      <div className="px-2 py-1.5 rounded-md bg-muted/30 border border-border/60 flex items-center">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">{value || "—"}</span>
      </div>
    ) : (
      <div className="px-2 py-1.5 rounded-md bg-muted/30 border border-border/60 flex items-center">
        <span className="text-xs font-medium">{value || "—"}</span>
      </div>
    )}
  </div>
);

// Section card wrapper
const Section = ({ title, green, compact, children }: { title: string; green?: boolean; compact?: boolean; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
    <div className={cn("px-4 py-2.5 border-b", green ? "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-50/30" : "border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-transparent")}>
      <h2 className={cn("text-xs font-bold uppercase tracking-wider", green ? "text-emerald-700" : "text-primary")}>{title}</h2>
    </div>
    <div className={compact ? "px-2 py-1.5" : "px-4 py-3"}>{children}</div>
  </div>
);

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<(Ticket & { _dbId: number; rawCreatedAt: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approvalAction, setApprovalAction] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [approving, setApproving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  // Inline editing state
  const [inlineEditing, setInlineEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssignTo, setEditAssignTo] = useState<number | "">("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editComment, setEditComment] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<ApiUser[]>([]);
  // CDD escalation state
  const [cddActionLoading, setCddActionLoading] = useState(false);
  const [cddComment, setCddComment] = useState("");
  const [cddEscalateTo, setCddEscalateTo] = useState<number | "">("");
  const [l1Users, setL1Users] = useState<ApiUser[]>([]);
  const [l2Users, setL2Users] = useState<ApiUser[]>([]);

  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUser = parsedUser?.name || "User";
  const currentUserRole = parsedUser?.role || "User";
  const userManagedCenters: string[] = parsedUser?.managed_centers || (parsedUser?.center ? [parsedUser.center] : []);
  const isAomRole = hasAnyRole(currentUserRole, ["Area Operations Manager", "Area Operations Manager Head", "CDD L2 Manager"]);
  const approverRoles = ["Area Operations Manager", "Area Operations Manager Head", "Manager", "L1 Manager", "L2 Manager", "Finance", "Finance Head"];
  const canApproveRole = hasAnyRole(currentUserRole, approverRoles);
  // AOM can only approve tickets from their managed centers (location-based)
  // No managed centers = no approval permission for AOM
  const canApprove = canApproveRole && (!isAomRole || (userManagedCenters.length > 0 && userManagedCenters.some((c) => c.toLowerCase() === (ticket?.center || "").toLowerCase())));
  // Roles that can always edit (even resolved/closed tickets)
  const alwaysEditRoleList = ["Employee", "Others", "Help Desk Admin", "Helpdesk In-charge", "Super Admin", "Global Admin", "Super User", "Zenoti Team"];
  const alwaysEdit = hasAnyRole(currentUserRole, alwaysEditRoleList);
  // Roles that cannot edit at all (view only)
  const noEditRoleList = ["Finance", "Finance Head"];
  const noEdit = hasAnyRole(currentUserRole, noEditRoleList);
  // AOM can edit only when ticket is Pending Approval (for approve/reject/follow-up) AND they are the current approver
  const aomAlreadyApproved = isAomRole && ticket && ticket.approver === "Finance Team";
  const isAomAssigned = isAomRole && ticket && ticket.assignedTo === currentUser;
  const isCddRaisedTicket = isAomRole && ticket && ticket.raisedByDept === "CDD";
  const aomCanEdit = isAomRole && ticket && !aomAlreadyApproved && (ticket.status === "Pending Approval" || (ticket.status as string) === "Follow Up" || isAomAssigned || isCddRaisedTicket);
  // Zenoti Team cannot edit/assign if the ticket requires finance approval and finance hasn't approved yet
  const isZenotiTeamRole = hasAnyRole(currentUserRole, ["Zenoti Team", "Zenoti Team Manager"]);
  const zenotiBlockedByFinance = isZenotiTeamRole && ticket && ticket.approvalType === "aom_finance" && ticket.approvalStatus !== "Approved";
  const canEdit = ticket
    ? zenotiBlockedByFinance ? false
    : aomCanEdit || (!noEdit && (
        alwaysEdit || true  // Always allow edit so users can reopen closed/resolved tickets
      ))
    : false;

  const [emailLogs, setEmailLogs] = useState<{ id: number; to_email: string; to_name: string; template: string; status: string; created_at: string | null }[]>([]);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const dbId = parseInt(id, 10);
      if (isNaN(dbId)) throw new Error("Invalid ticket ID");
      const data = await ticketsApi.get(dbId);
      setTicket(apiToTicket(data));
      // Fetch email logs
      ticketsApi.getEmailLogs(dbId).then(setEmailLogs).catch(() => {});
    } catch {
      setError("Unable to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const currentUserDept = parsedUser?.department || "";

  // Hide edit for raiser — BUT allow if ticket is Closed/Resolved (so they can reopen)
  const isClosed = ticket && ["Closed", "Resolved", "Final Closed"].includes(ticket.status as string);
  const raisedByCurrentUser = ticket && ticket.raisedBy === currentUser && ticket.assignedDept !== currentUserDept;
  const canEditFinal = raisedByCurrentUser ? (isClosed ? true : false) : canEdit;

  // Zenoti department ticket assignees
  const ZENOTI_ASSIGNEE_IDS = [707, 816, 823, 811]; // Kalyani Thadoju, Ramya Janagam, Swapna M, Poornima Oliva

  // Fetch team members for "Assign To" dropdown — filtered by user's department
  useEffect(() => {
    usersApi.list().then((users) => {
      const active = users.filter((u) => u.status === "Active");
      if (hasAnyRole(currentUserRole, ["Zenoti Team"])) {
        setTeamMembers(active.filter((u) => ZENOTI_ASSIGNEE_IDS.includes(u.id)));
      } else if (isSuperRole(currentUserRole)) {
        setTeamMembers(active);
      } else if (currentUserDept?.toUpperCase() === "CDD") {
        // CDD users can see their own dept + all Clinic Managers for reassignment
        setTeamMembers(active.filter((u) => u.department === currentUserDept || u.role === "Clinic Manager"));
      } else if (currentUserDept) {
        // Show only users from the same department
        setTeamMembers(active.filter((u) => u.department === currentUserDept));
      } else {
        setTeamMembers(active);
      }
    }).catch(() => {});
  }, [currentUserRole, currentUserDept]);

  // Fetch L1 (AOM for ticket's center) and L2 (L2 Manager) users for escalation dropdowns
  useEffect(() => {
    if (currentUserDept?.toUpperCase() !== "CDD" || !ticket) return;
    Promise.all([usersApi.list(), centersApi.list()]).then(([users, centers]) => {
      const active = users.filter((u) => u.status === "Active");
      const ticketCenter = centers.find((c) => c.name === ticket.center);
      if (ticketCenter?.aom_email) {
        const aomUser = active.find((u) => u.email === ticketCenter.aom_email);
        if (aomUser) {
          setL1Users([aomUser]);
          setCddEscalateTo(aomUser.id);
        } else {
          setL1Users(active.filter((u) => hasAnyRole(u.role, ["Area Operations Manager", "Area Operations Manager Head"])));
        }
      } else {
        setL1Users(active.filter((u) => hasAnyRole(u.role, ["Area Operations Manager", "Area Operations Manager Head"])));
      }
      setL2Users(active.filter((u) => hasAnyRole(u.role, ["L2 Manager"])));
    }).catch(() => {});
  }, [currentUserDept, ticket]);

  const handleCddAction = async (action: string) => {
    if (!ticket) return;
    setCddActionLoading(true);
    try {
      await ticketsApi.cddAction(ticket._dbId, {
        action,
        comment: cddComment || undefined,
        escalate_to_id: cddEscalateTo || undefined,
        user_name: currentUser,
      });
      setCddComment("");
      setCddEscalateTo("");
      await fetchTicket();
    } catch { alert(`Failed to perform ${action}.`); }
    finally { setCddActionLoading(false); }
  };

  const handleApproval = async () => {
    if (!approvalAction || !ticket) return;
    setApproving(true);
    try {
      await ticketsApi.approve(ticket._dbId, { action: approvalAction, comment: approvalComment || undefined, approver_name: currentUser });
      await fetchTicket();
      setApprovalAction("");
      setApprovalComment("");
    } catch { alert("Failed to process approval."); } finally { setApproving(false); }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !ticket) return;
    setSendingComment(true);
    try {
      await ticketsApi.addComment(ticket._dbId, { user: currentUser, message: commentText.trim(), type: "comment" });
      setCommentText("");
      await fetchTicket();
    } catch { alert("Failed to send comment."); } finally { setSendingComment(false); }
  };

  const handleStartEdit = () => {
    if (!ticket) return;
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditAssignTo("");
    setEditFiles([]);
    setEditComment("");
    setInlineEditing(true);
  };

  // Auto-initialize edit fields for all users (no Edit button needed)
  useEffect(() => {
    if (ticket && canEditFinal && !editStatus) {
      setEditStatus(ticket.status);
      setEditPriority(ticket.priority);
      setEditComment("");
    }
  }, [ticket, canEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelEdit = () => {
    setInlineEditing(false);
    setEditStatus("");
    setEditPriority("");
    setEditAssignTo("");
    setEditFiles([]);
    setEditComment("");
  };

  const handleSaveEdit = async () => {
    if (!ticket) return;
    const statusChanged = editStatus !== ticket.status;
    const priorityChanged = editPriority !== ticket.priority;
    // Allow Re-Open on Closed/Resolved tickets (max 2 times)
    const closedStatuses = ["Resolved", "Closed", "Final Closed"];
    if (closedStatuses.includes(ticket.status)) {
      if (editStatus !== "Re-Open") {
        alert(`This ticket is "${ticket.status}". You can only Re-Open it.`);
        return;
      }
      // Count how many times this ticket was reopened (from comments)
      const reopenCount = ticket.comments.filter((c) =>
        c.message.toLowerCase().includes("re-open") || c.message.toLowerCase().includes("reopened")
      ).length;
      if (reopenCount >= 2) {
        alert("This ticket has already been reopened 2 times. No further reopens are allowed.");
        return;
      }
    }
    // Only assigned department team can resolve/change status (except Super Admin and Re-Open)
    const _isSuperAdmin = hasAnyRole(currentUserRole, ["Super Admin", "Global Admin", "Super User"]);
    const isReopening = editStatus === "Re-Open";
    if (statusChanged && !isReopening && !_isSuperAdmin && currentUserDept && ticket.assignedDept && currentUserDept !== ticket.assignedDept) {
      alert(`You cannot change the status of this ticket. Only the ${ticket.assignedDept} team can resolve or update this ticket.`);
      return;
    }
    const hasAnyChange = statusChanged || priorityChanged || !!editAssignTo || editComment.trim().length > 0;
    if (!hasAnyChange) {
      alert("No changes made. Please modify at least one field or add a comment.");
      return;
    }
    // User role must always provide a description; other roles only when status/priority changes
    if (["Employee", "Others"].includes(currentUserRole) && !editComment.trim()) {
      alert("Please provide a description explaining why you are making this change.");
      return;
    }
    if (!isAomRole && currentUserRole !== "User" && (statusChanged || priorityChanged) && !editComment.trim()) {
      alert("Please provide a reason for changing the status or priority.");
      return;
    }
    setEditSaving(true);
    try {
      // AOM approval flow — use the approve endpoint
      const aomApprovalActions = ["Approved", "Rejected", "Follow Up"];
      if (isAomRole && statusChanged && aomApprovalActions.includes(editStatus)) {
        const actionMap: Record<string, string> = { "Approved": "Approve", "Rejected": "Reject", "Follow Up": "Follow-up" };
        await ticketsApi.approve(ticket._dbId, {
          action: actionMap[editStatus],
          comment: editComment.trim() || undefined,
          approver_name: currentUser,
        });
      } else {
        const payload: Record<string, unknown> = {};
        if (statusChanged) {
          // Map display values to backend values
          payload.status = editStatus === "Re-Open" ? "Open" : editStatus;  // Backend converts "Open" to "Reopened" if ticket was Closed/Resolved
        }
        if (priorityChanged) payload.priority = editPriority;
        if (editAssignTo) payload.assigned_to_id = editAssignTo;
        if (editComment.trim()) payload.comment = editComment.trim();
        if (Object.keys(payload).length > 0) {
          await ticketsApi.update(ticket._dbId, payload as import("@/lib/api").UpdateTicketPayload);
        }
        // Post comment if provided
        if (editComment.trim()) {
          const parts: string[] = [];
          if (statusChanged) {
            const resolvedStatuses = ["Resolved", "Closed", "Final Closed"];
            if (resolvedStatuses.includes(editStatus) && ticket.assignedTo && ticket.assignedTo !== currentUser && ticket.assignedTo !== "Unassigned") {
              parts.push(`Status changed from "${ticket.status}" to "${editStatus}" by ${currentUser} (originally assigned to ${ticket.assignedTo})`);
            } else {
              parts.push(`Status changed from "${ticket.status}" to "${editStatus}"`);
            }
          }
          if (priorityChanged) parts.push(`Priority changed from "${ticket.priority}" to "${editPriority}"`);
          if (editAssignTo) {
            const assignedUser = teamMembers.find((u) => u.id === editAssignTo);
            if (assignedUser) parts.push(`Assigned to ${assignedUser.name}`);
          }
          const prefix = parts.length > 0 ? `${parts.join(". ")}. Reason: ` : "";
          const msg = `${prefix}${editComment.trim()}`;
          await ticketsApi.addComment(ticket._dbId, { user: currentUser, message: msg, type: statusChanged || priorityChanged ? "status_change" : "comment" });
        }
      }
      // TODO: File upload will be added when backend endpoint is ready
      await fetchTicket();
      handleCancelEdit();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save changes. " + (err instanceof Error ? err.message : ""));
    } finally {
      setEditSaving(false);
    }
  };


  const handleEditSuccess = async (formData: TicketFormData) => {
    if (!ticket) return;
    try {
      await ticketsApi.update(ticket._dbId, {
        title: formData.title, description: formData.description, category: formData.category,
        sub_category: formData.subCategory, priority: formData.priority, center: formData.center,
        assigned_dept: formData.department, ...(formData.status && { status: formData.status }),
      });
      await fetchTicket();
    } catch { alert("Failed to update ticket."); }
    setEditingTicket(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">{error || "Ticket not found."}</p>
        <button onClick={() => navigate("/tickets")} className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>
      </div>
    );
  }

  const timeline = buildTimeline(ticket);

  const isZenoti = ticket.assignedDept?.toLowerCase() === "zenoti";
  const commentTypeBadge: Record<string, { label: string; cls: string }> = {
    approval: { label: "Approval", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    status_change: { label: "System", cls: "bg-gray-100 text-gray-600 border-gray-200" },
    comment: { label: "Comment", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  };

  return (
    <div className="animate-fade-in space-y-3 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/tickets")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-primary font-bold">{ticket.id}</span>
              <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", statusColors[ticket.status] || "bg-gray-100 text-gray-600")}>
                {ticket.status}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                <span className={cn("h-2 w-2 rounded-full", priorityDotColors[ticket.priority])} />
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>
        {zenotiBlockedByFinance && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
            <Clock className="h-3.5 w-3.5" /> Awaiting Finance Approval — editing disabled
          </div>
        )}
      </div>

      {/* ── Ticket Journey ── */}
      <Section title="Ticket Journey" compact>
        <div>
          <div className="flex items-center py-1 px-2 justify-center w-full">
            {timeline.map((event, idx) => {
              const isLast = idx === timeline.length - 1;
              const msg = event.message.toLowerCase();

              // Extract destination status: "to "X"" pattern
              const toMatch = msg.match(/to "([^"]+)"/);
              const toStatus = toMatch ? toMatch[1].toLowerCase() : "";

              // Determine label from destination status
              const label =
                event.type === "created" ? "Ticket Created" :
                event.type === "approval" ? (
                  msg.includes("rejected") ? "Rejected" :
                  msg.includes("follow") ? "Follow Up" :
                  msg.includes("(finance)") ? "Finance Approval" : "AOM Approval"
                ) :
                event.type === "status_change" ? (
                  toStatus === "re-open" || toStatus === "reopened" ? "Reopened" :
                  toStatus === "open" ? "Open" :
                  toStatus === "resolved" ? "Resolved" :
                  toStatus === "closed" || toStatus === "final closed" ? "Closed" :
                  toStatus === "in progress" ? "In Progress" :
                  toStatus === "follow up" ? "Follow Up" :
                  toStatus === "acknowledged" ? "Acknowledged" :
                  msg.includes("auto-escalated to l3") || msg.includes("escalated to l3") ? "Escalated to L3" :
                  msg.includes("auto-escalated to l2") || msg.includes("escalated to l2") ? "Escalated to L2" :
                  msg.includes("auto-escalated to l1") || msg.includes("escalated to l1") ? "Escalated to L1" :
                  msg.includes("assigned") ? "Assigned" :
                  "Status Update"
                ) :
                "Comment";

              const isRejected = label === "Rejected";
              const isReopened = label === "Reopened";
              const isResolved = label === "Resolved";
              const isClosed = label === "Closed";
              const isEscalatedL1 = label === "Escalated to L1";
              const isEscalatedL2 = label === "Escalated to L2" || label === "Escalated to L3";
              const isApproved = label.includes("Approval");
              const isFollowUp = label === "Follow Up";
              const isAssigned = msg.includes("assigned") || msg.includes("ticket assigned");
              const isComment = event.type === "comment";
              const isCreated = event.type === "created";
              const isInProgress = msg.includes("in progress");

              // Emoji for each event type — check event.type first, then message content
              const emoji = isCreated ? "📦" :
                isComment ? "🗨️" :
                isReopened ? "🔄" :
                isRejected ? "👎" :
                isApproved ? "👍" :
                isEscalatedL2 ? "🚨" :
                isEscalatedL1 ? "🆘" :
                isResolved ? "🥳" :
                isClosed ? "🥳" :
                isFollowUp ? "💡" :
                isInProgress ? "⏳" :
                isAssigned ? "👤" : "✅";

              const nodeColor = isRejected ? "bg-red-100 ring-red-200" :
                isReopened ? "bg-orange-100 ring-orange-200" :
                (isResolved || isClosed) ? "bg-emerald-100 ring-emerald-200" :
                isApproved ? "bg-green-100 ring-green-200" :
                isEscalatedL1 || isEscalatedL2 ? "bg-orange-100 ring-orange-200" :
                isCreated ? "bg-blue-100 ring-blue-200" :
                "bg-primary/10 ring-primary/20";
              const lineColor = isRejected ? "bg-destructive/40" : isReopened ? "bg-orange-400" : (isResolved || isClosed) ? "bg-emerald-400" : "bg-primary";
              const labelColor = isRejected ? "text-destructive" : isReopened ? "text-orange-600" : (isResolved || isClosed) ? "text-emerald-700" : "text-primary";

              return (
                <div key={event.id} className="flex items-start flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-md ring-2 hover:scale-125 transition-transform duration-300", nodeColor)}>
                      <span className="text-lg animate-bounce" style={{ animationDuration: "2s", animationIterationCount: idx === timeline.length - 1 ? "infinite" : "1" }}>{emoji}</span>
                    </div>
                    <p className={cn("text-xs font-bold mt-2 text-center", labelColor)}>{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 text-center">{event.timestamp}</p>
                    <p className="text-[10px] text-muted-foreground/70 text-center mt-0.5 px-1 leading-relaxed line-clamp-2" title={event.message}>
                      {event.message}
                    </p>
                  </div>
                  {!isLast && (
                    <div className={cn("flex-1 h-1 rounded-full mt-5 shrink min-w-4 max-w-16", lineColor)} />
                  )}
                </div>
              );
            })}

          </div>
        </div>
      </Section>


      {/* ── Ticket Information ── */}
      <Section title="Ticket Information">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
              <Tag className="h-3 w-3" /> Title
            </label>
            <div className="px-2 py-1.5 rounded-md bg-muted/30 border border-border/60">
              <span className="text-sm font-bold text-foreground">{ticket.title || "—"}</span>
            </div>
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
              <FileText className="h-3 w-3" /> Description
            </label>
            <div className="px-2 py-1.5 rounded-md bg-muted/30 border border-border/60">
              <p className="text-sm font-semibold leading-relaxed">{ticket.description || "No description provided."}</p>
            </div>
          </div>
          <Field label="Raised By" value={`${ticket.raisedBy}${ticket.raisedByDept ? ` (${ticket.raisedByDept})` : ""}`} icon={User} />
          <Field label="Assigned To" value={`${ticket.assignedTo}${(ticket as any).escalationLevel >= 1 ? (ticket as any).escalationLevel >= 2 ? " (L2)" : " (L1 AOM)" : ticket.assignedDept ? ` (${ticket.assignedDept})` : ""}`} icon={Building2} />
          <Field label="Department" value={ticket.assignedDept} icon={Building2} />
          {!isZenoti && <Field label="Category" value={ticket.category} icon={Layers} />}
          {isZenoti && ticket.zenotiMainCategory && <Field label="Category" value={ticket.zenotiMainCategory} icon={Layers} />}
          {!isZenoti && <Field label={ticket.assignedDept === "Admin Department" ? "Module" : "Sub Category"} value={ticket.subCategory} icon={Tag} />}
          {isZenoti && ticket.zenotiSubCategory && <Field label="Sub Category" value={ticket.zenotiSubCategory} icon={Tag} />}
          {!isZenoti && ticket.assignedDept === "Admin Department" && ticket.zenotiChildCategory && <Field label="Main Category" value={ticket.zenotiChildCategory} icon={Tag} />}
          {!isZenoti && ticket.assignedDept === "Admin Department" && ticket.zenotiDescription && <Field label="Sub Category" value={ticket.zenotiDescription} icon={Tag} />}
          {isZenoti && ticket.zenotiChildCategory && <Field label="Child Category" value={ticket.zenotiChildCategory} icon={Tag} />}
          {isZenoti && <Field label="Priority" value={ticket.priority} />}
          {!isZenoti && <Field label="Center / Location" value={ticket.center} icon={MapPin} />}
          {isZenoti && ticket.zenotiLocation && <Field label="Center / Location" value={ticket.zenotiLocation} icon={MapPin} />}
          {(ticket as any).actionRequired && <Field label="Action Required" value={(ticket as any).actionRequired} fullWidth />}
          {(ticket as any).clientCode && <Field label="Client Code" value={(ticket as any).clientCode} />}
          {(ticket as any).clientName && <Field label="Client Name" value={(ticket as any).clientName} />}
          {(ticket as any).serviceName && <Field label="Service Name" value={(ticket as any).serviceName} />}
          {(ticket as any).crtName && <Field label="CRT Name" value={(ticket as any).crtName} />}
          {(ticket as any).primaryDoctor && <Field label="Primary Doctor" value={(ticket as any).primaryDoctor} />}
          {(ticket as any).therapistName && <Field label="Therapist Name" value={(ticket as any).therapistName} />}
        </div>
      </Section>

      {/* ── Client & Invoice Details (Zenoti only) ── */}
      {isZenoti && ticket.zenotiMainCategory && (
        <Section title="Client & Invoice Details" green>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Client Name" value={ticket.zenotiCustomerName || ""} icon={User} />
            <Field label="Client Mobile No" value={ticket.zenotiMobileNumber || ""} icon={Phone} />
            <Field label="Client ID" value={ticket.zenotiCustomerId || ""} icon={CreditCard} />
            <Field label="Billed By" value={ticket.zenotiBilledBy || ""} icon={User} />
            <Field label="Invoice No" value={ticket.zenotiInvoiceNo || ""} icon={FileText} />
            <Field label="Invoice Date" value={ticket.zenotiInvoiceDate || ""} icon={Calendar} />
            <Field label="Amount" value={ticket.zenotiAmount ? `₹ ${ticket.zenotiAmount}` : ""} icon={IndianRupee} />
          </div>
        </Section>
      )}

      {/* Dates & SLA section removed */}

      {/* ── Approval Information ── */}
      {ticket.approvalRequired && (
        <Section title="Approval Information" green>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Approval Required" value={ticket.approvalRequired ? "Yes" : "No"} />
            <Field label="Current Approver" value={ticket.approver || "—"} icon={ShieldCheck} />
            <Field label="Approval Status" value={ticket.approvalStatus || "Pending"} badge />
          </div>
        </Section>
      )}


      {/* ── Resolution ── */}
      {ticket.resolution && (
        <Section title="Resolution" green>
          <div className="px-1">
            <p className="text-sm leading-relaxed">{ticket.resolution}</p>
          </div>
        </Section>
      )}

      {/* ── Approval Action (for approvers) ── */}
      {canApprove && (ticket.approvalStatus === "Pending" || !ticket.approvalStatus) && ticket.approvalRequired && (
        <Section title="Approval Action" green>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Action *</label>
              <select value={approvalAction} onChange={(e) => setApprovalAction(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">-- Select --</option>
                <option value="Approve">Approve</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Comments {approvalAction === "Follow-up" && <span className="text-destructive">*</span>}
              </label>
              <textarea value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)}
                placeholder={approvalAction === "Follow-up" ? "What info do you need?" : approvalAction === "Reject" ? "Reason for rejection..." : "Optional comments..."}
                rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
          <button onClick={handleApproval}
            disabled={approving || !approvalAction || (approvalAction === "Follow-up" && !approvalComment.trim())}
            className={cn("mt-4 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50",
              approvalAction === "Reject" ? "bg-destructive text-destructive-foreground" : approvalAction === "Follow-up" ? "bg-warning text-warning-foreground" : "gradient-primary text-primary-foreground"
            )}>
            {approving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <CheckCircle2 className="h-4 w-4" />}
            {approvalAction === "Follow-up" ? "Submit Follow-up" : approvalAction === "Reject" ? "Reject Request" : "Approve Request"}
          </button>
        </Section>
      )}

      {/* ── Email Status ── */}
      {emailLogs.length > 0 && (
        <Section title="Email Notifications">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-2 font-semibold">To</th>
                  <th className="px-4 py-2 font-semibold">Email</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-xs font-medium">{log.to_name || "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{log.to_email}</td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.template === "created" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {log.template === "created" ? "Ticket Created" : "Ticket Assigned"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {log.status === "sent" ? "Sent" : "Failed"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Inline Edit Panel (always visible for users who can edit) ── */}
      {canEditFinal && (
        <Section title={isAomRole && !isAomAssigned && !isCddRaisedTicket ? "Attachments" : "Edit Ticket"} green>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {/* Status — hidden for AOM approval tickets (they use approval actions), but shown for AOM assigned/CDD tickets */}
            {(!isAomRole || isAomAssigned || isCddRaisedTicket) && <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <Clock className="h-3 w-3" /> Status
              </label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                {isAomRole ? (
                  <>
                    <option value={ticket.status}>{ticket.status}</option>
                    {(isAomAssigned || isCddRaisedTicket) && isCddRaisedTicket && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="Resolved">Resolved</option>}
                    {(isAomAssigned || isCddRaisedTicket) && isCddRaisedTicket && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="Closed">Closed</option>}
                    {(isAomAssigned || isCddRaisedTicket) && !isCddRaisedTicket && (ticket.status as string) !== "In Progress" && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="In Progress">In Progress</option>}
                    {!isAomAssigned && !isCddRaisedTicket && <option value="Approved">Approved</option>}
                    {!isAomAssigned && !isCddRaisedTicket && <option value="Rejected">Rejected</option>}
                    {!isAomAssigned && !isCddRaisedTicket && <option value="Follow Up">Follow Up</option>}
                    {(isAomAssigned || isCddRaisedTicket) && !isCddRaisedTicket && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="Resolved">Resolved</option>}
                    {(isAomAssigned || isCddRaisedTicket) && !isCddRaisedTicket && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="Closed">Closed</option>}
                    {(isAomAssigned || isCddRaisedTicket) && ["Closed", "Resolved"].includes(ticket.status as string) && <option value="Re-Open">Re-Open</option>}
                  </>
                ) : isZenoti ? (
                  <>
                    <option value={ticket.status}>{ticket.status}</option>
                    {!["Open", "Closed", "Resolved", "Reopened"].includes(ticket.status as string) && <option value="Open">Open</option>}
                    {(ticket.status as string) !== "In Progress" && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="In Progress">In Progress</option>}
                    {(ticket.status as string) !== "Follow Up" && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="Follow Up">Follow Up</option>}
                    {!["Closed", "Resolved"].includes(ticket.status as string) && <option value="Closed">Closed</option>}
                    {["Closed", "Resolved"].includes(ticket.status as string) && <option value="Re-Open">Re-Open</option>}
                  </>
                ) : (
                  <>
                    <option value={ticket.status}>{ticket.status}</option>
                    {!["Open", "Closed", "Resolved", "Reopened"].includes(ticket.status as string) && <option value="Open">Open</option>}
                    {(ticket.status as string) !== "In Progress" && !["Closed", "Resolved"].includes(ticket.status as string) && <option value="In Progress">In Progress</option>}
                    {!["Closed", "Resolved"].includes(ticket.status as string) && <option value="Closed">Closed</option>}
                    {["Closed", "Resolved"].includes(ticket.status as string) && <option value="Re-Open">Re-Open</option>}
                  </>
                )}
              </select>
            </div>}

            {/* Assign To — hidden for closed/resolved tickets, User, AOM, Helpdesk Admin, Clinic Manager roles, and Admin department tickets */}
            {!isClosed && currentUserRole !== "User" && !isAomRole && !hasAnyRole(currentUserRole, ["Clinic Manager", "Clinic Incharge", "Helpdesk Admin"]) && !["Admin Department", "Administration", "Admin"].includes(ticket.assignedDept) && (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  <User className="h-3 w-3" /> Assign To
                </label>
                <select value={editAssignTo} onChange={(e) => setEditAssignTo(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">-- No Change --</option>
                  {teamMembers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}{u.department ? ` (${u.department})` : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <Upload className="h-3 w-3" /> Attach Files
              </label>
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {editFiles.length > 0 ? `${editFiles.length} file(s) selected` : "Choose files..."}
                </span>
                <input type="file" multiple className="hidden"
                  onChange={(e) => { if (e.target.files) setEditFiles(Array.from(e.target.files)); }} />
              </label>
            </div>

            {/* Description / Comment — hidden for AOM approval tickets, shown for AOM assigned/CDD tickets */}
            {(!isAomRole || isAomAssigned || isCddRaisedTicket) && <div className="col-span-full">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <MessageSquare className="h-3 w-3" /> Description / Reason for Change
                {(["Employee", "Others"].includes(currentUserRole) || editStatus !== ticket.status) && <span className="text-destructive">*</span>}
              </label>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder={["Employee", "Others"].includes(currentUserRole)
                  ? "Please describe why you are making this change (mandatory)..."
                  : editStatus !== ticket.status
                    ? "Please explain why you are changing the status (mandatory)..."
                    : "Add a comment or reason for this change..."}
                rows={3}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none",
                  (["Employee", "Others"].includes(currentUserRole) || editStatus !== ticket.status) && !editComment.trim()
                    ? "border-destructive/50" : "border-border"
                )}
              />
              {(["Employee", "Others"].includes(currentUserRole) || editStatus !== ticket.status) && !editComment.trim() && (
                <p className="text-[11px] text-destructive mt-1">
                  {["Employee", "Others"].includes(currentUserRole)
                    ? "Description is mandatory. Please explain why you are making this change."
                    : "This field is mandatory when changing status."}
                </p>
              )}
            </div>}

            {/* Show selected files */}
            {editFiles.length > 0 && (
              <div className="col-span-full">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Selected Files</p>
                <div className="flex flex-wrap gap-2">
                  {editFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span className="max-w-[150px] truncate">{f.name}</span>
                      <button onClick={() => setEditFiles(editFiles.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save / Cancel buttons at bottom-right */}
            <div className="col-span-full flex justify-end gap-2 pt-2">
              <button onClick={handleSaveEdit} disabled={editSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* ── Activity & Comments ── */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <button
          onClick={() => setActivityOpen(!activityOpen)}
          className="w-full px-4 py-2.5 border-b border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-2 cursor-pointer hover:from-primary/15 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Activity & Comments ({timeline.length})</h2>
          <span className="ml-auto">
            {activityOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
          </span>
        </button>
        {activityOpen && <div className="px-4 py-3 space-y-2 max-h-[300px] overflow-y-auto">
          {timeline.map((ev) => {
            const badge = commentTypeBadge[ev.type] || commentTypeBadge.comment;
            const bgColor =
              ev.type === "created" ? "bg-primary/5" :
              ev.type === "approval" ? "bg-emerald-50/60" :
              ev.type === "status_change" ? "bg-gray-50/80" :
              "bg-blue-50/40";
            const iconBg =
              ev.type === "created" ? "bg-primary/10 text-primary" :
              ev.type === "approval" ? "bg-emerald-100 text-emerald-600" :
              ev.type === "status_change" ? "bg-gray-200 text-gray-500" :
              "bg-blue-100 text-blue-600";
            const iconEl =
              ev.type === "created" ? <CheckCircle2 className="h-4 w-4" /> :
              ev.type === "approval" ? <ShieldCheck className="h-4 w-4" /> :
              ev.type === "status_change" ? <Clock className="h-4 w-4" /> :
              <MessageSquare className="h-4 w-4" />;
            const badgeLabel =
              ev.type === "created" ? "Created" :
              badge.label;
            const badgeCls =
              ev.type === "created" ? "bg-primary/10 text-primary border-primary/20" :
              badge.cls;

            return (
              <div key={ev.id} className={cn("rounded-lg px-3 py-2 flex items-start gap-2", bgColor)}>
                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
                  {iconEl}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold">{ev.user}</span>
                    <span className="text-[10px] text-muted-foreground">{ev.timestamp}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", badgeCls)}>{badgeLabel}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ev.message}</p>
                </div>
              </div>
            );
          })}

        </div>}
        {/* Add comment input — always visible */}
        <div className="flex gap-2 px-4 py-3 border-t border-border">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSendComment(); } }}
            className="flex-1 px-3 py-2 rounded-full border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={handleSendComment} disabled={sendingComment || !commentText.trim()}
            className="px-6 py-2.5 rounded-full gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5">
            {sendingComment ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </button>
        </div>
      </div>

      {/* Modals */}
      {editingTicket && (
        <RaiseTicketModal onClose={() => setEditingTicket(null)} onSuccess={handleEditSuccess} editMode editTicket={editingTicket} userRole={currentUserRole} />
      )}

    </div>
  );
};

export default TicketDetailPage;
