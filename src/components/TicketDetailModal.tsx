import { useState } from "react";
import type { Ticket } from "@/data/dummyData";
import { X, Clock, User, Building2, MapPin, MessageSquare, CheckCircle2, AlertTriangle, ShieldCheck, Phone, CreditCard, FileText, IndianRupee, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onModify?: () => void;
  onCancel?: () => void;
  canEdit?: boolean;
  canApprove?: boolean;
  currentUserName?: string;
  onApprovalDone?: () => void;
  extraActions?: React.ReactNode;
}

const statusColors: Record<string, string> = {
  Open: "bg-info text-info-foreground",
  "In Progress": "bg-warning text-warning-foreground",
  "Pending Approval": "bg-accent text-accent-foreground",
  Resolved: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  Critical: "text-destructive",
  High: "text-warning",
  Medium: "text-info",
  Low: "text-muted-foreground",
};

const TicketDetailModal = ({ ticket, onClose, onModify, onCancel, canEdit, canApprove, currentUserName, onApprovalDone, extraActions }: Props) => {
  const [approvalAction, setApprovalAction] = useState<string>("");
  const [approvalComment, setApprovalComment] = useState("");
  const [approving, setApproving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const dbId = (ticket as Ticket & { _dbId?: number })?._dbId;

  const handleApproval = async () => {
    if (!approvalAction || !dbId) return;
    setApproving(true);
    try {
      await ticketsApi.approve(dbId, {
        action: approvalAction,
        comment: approvalComment || undefined,
        approver_name: currentUserName,
      });
      onApprovalDone?.();
      onClose();
    } catch {
      alert("Failed to process approval. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !dbId) return;
    setSendingComment(true);
    try {
      await ticketsApi.addComment(dbId, {
        user: currentUserName || "User",
        message: commentText.trim(),
        type: "comment",
      });
      onApprovalDone?.();
      onClose();
    } catch {
      alert("Failed to send comment.");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl max-h-[85vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-card flex items-center justify-between px-6 py-4 border-b border-border rounded-t-2xl">
          <div>
            <p className="text-xs font-mono text-primary font-medium">{ticket.id}</p>
            <h2 className="text-lg font-bold font-display mt-0.5">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status bar */}
          <div className="flex flex-wrap gap-2">
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[ticket.status])}>
              {ticket.status}
            </span>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border border-border", priorityColors[ticket.priority])}>
              {ticket.priority} Priority
            </span>
            {ticket.slaBreached && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> SLA Breached
              </span>
            )}
            {ticket.approvalRequired && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Approval: {ticket.approvalStatus || "Pending"}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
            <p className="text-sm">{ticket.description}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Raised By</p>
                  <p className="text-sm font-medium">{ticket.raisedBy}</p>
                  <p className="text-[11px] text-muted-foreground">{ticket.raisedByDept}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-medium">{ticket.assignedTo}</p>
                  <p className="text-[11px] text-muted-foreground">{ticket.assignedDept}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Center</p>
                  <p className="text-sm font-medium">{ticket.center}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium">{ticket.dueDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <p>Department: <span className="text-foreground font-medium">{ticket.assignedDept}</span></p>
            <p>Category: <span className="text-foreground font-medium">{ticket.category} › {ticket.subCategory}</span></p>
            <p>Created: <span className="text-foreground font-medium">{ticket.createdAt}</span></p>
            <p>Updated: <span className="text-foreground font-medium">{ticket.updatedAt}</span></p>
          </div>

          {/* Zenoti Details */}
          {ticket.zenotiMainCategory && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Zenoti Details</h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3 text-amber-600" />{ticket.zenotiLocation}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Main Category</p>
                  <p className="font-medium">{ticket.zenotiMainCategory}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Sub Category</p>
                  <p className="font-medium">{ticket.zenotiSubCategory}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Child Category</p>
                  <p className="font-medium">{ticket.zenotiChildCategory}</p>
                </div>
              </div>

              <div className="border-t border-amber-200 pt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Client Name</p>
                  <p className="font-medium flex items-center gap-1.5"><User className="h-3 w-3 text-amber-600" />{ticket.zenotiCustomerName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Client ID</p>
                  <p className="font-medium flex items-center gap-1.5"><CreditCard className="h-3 w-3 text-amber-600" />{ticket.zenotiCustomerId}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Mobile No</p>
                  <p className="font-medium flex items-center gap-1.5"><Phone className="h-3 w-3 text-amber-600" />{ticket.zenotiMobileNumber}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Billed By</p>
                  <p className="font-medium">{ticket.zenotiBilledBy}</p>
                </div>
              </div>

              <div className="border-t border-amber-200 pt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Invoice No</p>
                  <p className="font-medium flex items-center gap-1.5"><FileText className="h-3 w-3 text-amber-600" />{ticket.zenotiInvoiceNo}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">{ticket.zenotiInvoiceDate}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Amount</p>
                  <p className="font-medium flex items-center gap-1.5"><IndianRupee className="h-3 w-3 text-amber-600" />{ticket.zenotiAmount}</p>
                </div>
              </div>

              {ticket.zenotiDescription && (
                <div className="border-t border-amber-200 pt-3">
                  <p className="text-[11px] text-muted-foreground mb-1">Zenoti Description</p>
                  <p className="text-sm">{ticket.zenotiDescription}</p>
                </div>
              )}
            </div>
          )}

          {ticket.resolution && (
            <div className="bg-success/10 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-success flex items-center gap-1 mb-1">
                <CheckCircle2 className="h-3 w-3" /> Resolution
              </h4>
              <p className="text-sm">{ticket.resolution}</p>
            </div>
          )}

          {/* Comments / Activity */}
          {ticket.comments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Activity ({ticket.comments.length})
              </h4>
              <div className="space-y-3">
                {ticket.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {c.user.split(" ").map((w) => w[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{c.user}</span>
                        <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
                        {c.type === "approval" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">Approval</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{c.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSendComment}
              disabled={sendingComment || !commentText.trim()}
              className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              {sendingComment ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send
            </button>
          </div>

          {/* AOM Approval Section */}
          {canApprove && (ticket.approvalStatus === "Pending" || !ticket.approvalStatus) && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Approval Action
              </h4>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Select Status</label>
                <select
                  value={approvalAction}
                  onChange={(e) => setApprovalAction(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Select Action --</option>
                  <option value="Approve">Approve</option>
                  <option value="Follow-up">Follow-up (Need more info)</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Comments {approvalAction === "Follow-up" && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder={
                    approvalAction === "Follow-up"
                      ? "Describe what additional information you need..."
                      : approvalAction === "Reject"
                      ? "Provide the reason for rejection..."
                      : "Add any comments (optional)..."
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {(ticket.category?.toLowerCase() === "zenoti-finance" || ticket.zenotiMainCategory?.toLowerCase() === "zenoti-finance") && approvalAction === "Approve" && (
                <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-amber-700">
                    This is a <strong>Zenoti-Finance</strong> category request. After your approval, it will be automatically escalated to the <strong>Finance Team</strong> for final approval.
                  </p>
                </div>
              )}

              <button
                onClick={handleApproval}
                disabled={
                  approving ||
                  !approvalAction ||
                  (approvalAction === "Follow-up" && !approvalComment.trim())
                }
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  approvalAction === "Reject"
                    ? "bg-destructive text-destructive-foreground hover:opacity-90"
                    : approvalAction === "Follow-up"
                    ? "bg-warning text-warning-foreground hover:opacity-90"
                    : "gradient-primary text-primary-foreground hover:opacity-90",
                  "disabled:opacity-50"
                )}
              >
                {approving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {approvalAction === "Follow-up" ? "Submit Follow-up" : approvalAction === "Reject" ? "Reject Request" : "Approve Request"}
              </button>
            </div>
          )}

          {/* Extra actions (e.g. Zenoti Team resolve/close) */}
          {extraActions}

          {/* Modify / Cancel actions */}
          {canEdit && (
            <div className="flex gap-2 pt-2 border-t border-border">
              {onModify && (
                <button
                  onClick={onModify}
                  className="flex-1 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Modify Request
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
                >
                  Cancel Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
