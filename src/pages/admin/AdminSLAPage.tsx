import { slaConfigs } from "@/data/dummyData";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive",
  High: "bg-warning/10 text-warning",
  Medium: "bg-info/10 text-info",
  Low: "bg-muted text-muted-foreground",
};

const AdminSLAPage = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">SLA Configuration</h1>
        <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Add SLA Rule
        </button>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Response Time</th>
              <th className="px-4 py-3 font-medium">Resolution Time</th>
              <th className="px-4 py-3 font-medium">Escalation L1</th>
              <th className="px-4 py-3 font-medium">Escalation L2</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {slaConfigs.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-xs">{s.department}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", priorityColors[s.priority])}>
                    {s.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{s.responseTimeHrs}h</td>
                <td className="px-4 py-3 text-xs">{s.resolutionTimeHrs}h</td>
                <td className="px-4 py-3 text-xs">{s.escalationLevel1Hrs}h</td>
                <td className="px-4 py-3 text-xs">{s.escalationLevel2Hrs}h</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block h-2 w-2 rounded-full mr-1.5", s.active ? "bg-success" : "bg-muted-foreground")} />
                  <span className="text-xs">{s.active ? "Active" : "Inactive"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSLAPage;
