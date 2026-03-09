import { tickets } from "@/data/dummyData";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const ApprovalsPage = () => {
  const approvalTickets = tickets.filter((t) => t.approvalRequired);

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold font-display">Pending Approvals</h1>

      <div className="grid gap-3">
        {approvalTickets.map((t) => (
          <div key={t.id} className="bg-card rounded-xl p-5 card-shadow border border-border">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-primary font-medium">{t.id}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.approvalStatus || "Pending"])}>
                    {t.approvalStatus}
                  </span>
                </div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Raised by: <span className="text-foreground font-medium">{t.raisedBy}</span></span>
                  <span>Department: <span className="text-foreground font-medium">{t.assignedDept}</span></span>
                  <span>Center: <span className="text-foreground font-medium">{t.center}</span></span>
                  <span>Approver: <span className="text-foreground font-medium">{t.approver}</span></span>
                </div>
              </div>
              {t.approvalStatus === "Pending" && (
                <div className="flex gap-2 shrink-0">
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success text-success-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalsPage;
