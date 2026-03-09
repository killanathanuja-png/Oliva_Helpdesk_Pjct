import type { Ticket } from "@/data/dummyData";
import { X, Clock, User, Building2, MapPin, MessageSquare, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  ticket: Ticket;
  onClose: () => void;
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

const TicketDetailModal = ({ ticket, onClose }: Props) => {
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
                <ShieldCheck className="h-3 w-3" /> Approval: {ticket.approvalStatus}
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
            <p>Category: <span className="text-foreground font-medium">{ticket.category} › {ticket.subCategory}</span></p>
            <p>Created: <span className="text-foreground font-medium">{ticket.createdAt}</span></p>
          </div>

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
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
