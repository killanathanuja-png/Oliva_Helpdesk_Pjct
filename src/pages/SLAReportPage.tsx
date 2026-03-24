import { useState, useEffect } from "react";
import { isSuperRole } from "@/lib/roles";
import { ticketsApi, slaApi } from "@/lib/api";
import type { ApiTicket, ApiSLAConfig } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, CheckCircle, Clock, BarChart3, TrendingUp, Shield, ShieldAlert, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";

interface SLASummary {
  total: number;
  breached: number;
  onTrack: number;
  resolved: number;
  open: number;
}

interface DeptBreakdown {
  department: string;
  total: number;
  breached: number;
  complianceRate: number;
}

interface PriorityBreakdown {
  priority: string;
  total: number;
  breached: number;
  complianceRate: number;
}

const priorityColors: Record<string, string> = {
  Critical: "bg-red-50 text-red-600 border-red-200",
  High: "bg-orange-50 text-orange-600 border-orange-200",
  Medium: "bg-amber-50 text-amber-600 border-amber-200",
  Low: "bg-sky-50 text-sky-600 border-sky-200",
};

const priorityDotColors: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-sky-500",
};

/* Circular gauge SVG */
const SLAGauge = ({ value, size = 160 }: { value: number; size?: number }) => {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 80 ? "hsl(152,60%,42%)" : value >= 50 ? "hsl(38,90%,50%)" : "hsl(0,72%,51%)";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tracking-tight" style={{ color }}>{value}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Compliance</span>
      </div>
    </div>
  );
};

const SLAReportPage = () => {
  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = parsedUser?.role || "User";
  const userDept = parsedUser?.department || "";

  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<ApiSLAConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterDept, setFilterDept] = useState("All");

  useEffect(() => {
    Promise.all([ticketsApi.list(), slaApi.list()])
      .then(([t, s]) => {
        // Map roles to departments
        const getRoleDepts = (): string[] => {
          if (isSuperRole(userRole)) return [];
          const roles = userRole.split(",").map((r: string) => r.trim());
          const zenotiRoles = ["Zenoti Team", "Area Operations Manager", "Area Operations Manager Head", "Finance", "Finance Head"];
          const depts: string[] = [];
          if (roles.some((r: string) => zenotiRoles.includes(r))) depts.push("Zenoti");
          if (userDept && !depts.includes(userDept)) depts.push(userDept);
          return depts;
        };
        const allowedDepts = getRoleDepts();
        const deptTickets = allowedDepts.length === 0 ? t : t.filter((tk) => allowedDepts.includes(tk.assigned_dept || ""));
        setTickets(deptTickets);
        setSlaConfigs(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userRole, userDept]);

  const filtered = tickets.filter((t) => {
    if (filterPriority !== "All" && t.priority !== filterPriority) return false;
    if (filterDept !== "All" && t.assigned_dept !== filterDept) return false;
    return true;
  });

  const summary: SLASummary = {
    total: filtered.length,
    breached: filtered.filter((t) => t.sla_breached).length,
    onTrack: filtered.filter((t) => !t.sla_breached && t.status !== "Resolved" && t.status !== "Closed").length,
    resolved: filtered.filter((t) => t.status === "Resolved" || t.status === "Closed").length,
    open: filtered.filter((t) => t.status !== "Resolved" && t.status !== "Closed").length,
  };

  const complianceRate = summary.total > 0 ? Math.round(((summary.total - summary.breached) / summary.total) * 100) : 100;

  // Department breakdown
  const deptMap = new Map<string, { total: number; breached: number }>();
  filtered.forEach((t) => {
    const dept = t.assigned_dept || "Unassigned";
    const entry = deptMap.get(dept) || { total: 0, breached: 0 };
    entry.total++;
    if (t.sla_breached) entry.breached++;
    deptMap.set(dept, entry);
  });
  const deptBreakdown: DeptBreakdown[] = Array.from(deptMap.entries())
    .map(([department, v]) => ({
      department,
      ...v,
      complianceRate: v.total > 0 ? Math.round(((v.total - v.breached) / v.total) * 100) : 100,
    }))
    .sort((a, b) => a.complianceRate - b.complianceRate);

  // Priority breakdown
  const prioMap = new Map<string, { total: number; breached: number }>();
  filtered.forEach((t) => {
    const prio = t.priority || "Unknown";
    const entry = prioMap.get(prio) || { total: 0, breached: 0 };
    entry.total++;
    if (t.sla_breached) entry.breached++;
    prioMap.set(prio, entry);
  });
  const prioBreakdown: PriorityBreakdown[] = Array.from(prioMap.entries())
    .map(([priority, v]) => ({
      priority,
      ...v,
      complianceRate: v.total > 0 ? Math.round(((v.total - v.breached) / v.total) * 100) : 100,
    }))
    .sort((a, b) => {
      const order = ["Critical", "High", "Medium", "Low"];
      return order.indexOf(a.priority) - order.indexOf(b.priority);
    });

  const breachedTickets = filtered.filter((t) => t.sla_breached);
  const departments = [...new Set(tickets.map((t) => t.assigned_dept).filter(Boolean))] as string[];

  // Average resolution time
  const resolvedTickets = filtered.filter((t) => (t.status === "Resolved" || t.status === "Closed") && t.created_at && t.updated_at);
  const avgResHours = resolvedTickets.length > 0
    ? Math.round(resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at!).getTime();
        const updated = new Date(t.updated_at!).getTime();
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0) / resolvedTickets.length)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">SLA Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Service Level Agreement performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Section: Gauge + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SLA Gauge Card */}
        <div className="lg:col-span-4 bg-card rounded-2xl card-shadow border border-border p-6 flex flex-col items-center justify-center">
          <SLAGauge value={complianceRate} size={180} />
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>On Track: {summary.onTrack}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span>Breached: {summary.breached}</span>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Tickets */}
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{summary.total}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Total Tickets</p>
            </div>
          </div>

          {/* Open */}
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-blue-500" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-500/50" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-blue-600">{summary.open}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Open Tickets</p>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-4.5 w-4.5 text-success" />
              </div>
              <Shield className="h-4 w-4 text-success/40" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-success">{summary.resolved}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Resolved</p>
            </div>
          </div>

          {/* Breached */}
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-4.5 w-4.5 text-destructive" />
              </div>
              {summary.breached > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-destructive/50" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-success/50" />
              )}
            </div>
            <div>
              <p className={cn("text-2xl font-bold tracking-tight", summary.breached > 0 ? "text-destructive" : "text-success")}>{summary.breached}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">SLA Breached</p>
            </div>
          </div>

          {/* Avg Resolution Time - spans 2 cols */}
          <div className="col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl card-shadow border border-primary/20 p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{avgResHours != null ? `${avgResHours}h` : "N/A"}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Avg. Resolution Time</p>
            </div>
          </div>

          {/* On Track - spans 2 cols */}
          <div className="col-span-2 bg-gradient-to-br from-success/5 to-success/10 rounded-2xl card-shadow border border-success/20 p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-success">{summary.onTrack}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Currently On Track</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department & Priority Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Department SLA Compliance
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {deptBreakdown.length > 0 ? deptBreakdown.map((d) => (
              <div key={d.department} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", d.complianceRate >= 80 ? "bg-success" : d.complianceRate >= 50 ? "bg-warning" : "bg-destructive")} />
                    <span className="text-sm font-medium">{d.department}</span>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", d.complianceRate >= 80 ? "text-success" : d.complianceRate >= 50 ? "text-warning" : "text-destructive")}>
                    {d.complianceRate}%
                  </span>
                </div>
                <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", d.complianceRate >= 80 ? "bg-gradient-to-r from-success/80 to-success" : d.complianceRate >= 50 ? "bg-gradient-to-r from-warning/80 to-warning" : "bg-gradient-to-r from-destructive/80 to-destructive")}
                    style={{ width: `${d.complianceRate}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{d.total} total</span>
                  <span>{d.breached} breached</span>
                  <span>{d.total - d.breached} on track</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No department data available</p>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-orange-500/5 to-transparent">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Priority SLA Compliance
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {prioBreakdown.length > 0 ? prioBreakdown.map((p) => (
              <div key={p.priority} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-2.5 w-2.5 rounded-full", priorityDotColors[p.priority])} />
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", priorityColors[p.priority])}>
                      {p.priority}
                    </span>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", p.complianceRate >= 80 ? "text-success" : p.complianceRate >= 50 ? "text-warning" : "text-destructive")}>
                    {p.complianceRate}%
                  </span>
                </div>
                <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", p.complianceRate >= 80 ? "bg-gradient-to-r from-success/80 to-success" : p.complianceRate >= 50 ? "bg-gradient-to-r from-warning/80 to-warning" : "bg-gradient-to-r from-destructive/80 to-destructive")}
                    style={{ width: `${p.complianceRate}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{p.total} total</span>
                  <span>{p.breached} breached</span>
                  <span>{p.total - p.breached} on track</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No priority data available</p>
            )}
          </div>
        </div>
      </div>

      {/* SLA Configurations */}
      {slaConfigs.length > 0 && (
        <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Active SLA Rules
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <th className="px-6 py-3.5 font-semibold">Department</th>
                  <th className="px-6 py-3.5 font-semibold">Priority</th>
                  <th className="px-6 py-3.5 font-semibold">Response Time</th>
                  <th className="px-6 py-3.5 font-semibold">Resolution Time</th>
                  <th className="px-6 py-3.5 font-semibold">Escalation L1</th>
                  <th className="px-6 py-3.5 font-semibold">Escalation L2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slaConfigs.filter((s) => s.active).map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5 text-xs font-medium">{s.department || "All"}</td>
                    <td className="px-6 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", priorityColors[s.priority])}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium tabular-nums">{s.response_time_hrs ?? "-"}h</td>
                    <td className="px-6 py-3.5 text-xs font-medium tabular-nums">{s.resolution_time_hrs ?? "-"}h</td>
                    <td className="px-6 py-3.5 text-xs font-medium tabular-nums">{s.escalation_level1_hrs ?? "-"}h</td>
                    <td className="px-6 py-3.5 text-xs font-medium tabular-nums">{s.escalation_level2_hrs ?? "-"}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolved / Closed Tickets with Resolution Time */}
      <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-success/5 to-transparent flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            Resolved / Closed Tickets
          </h2>
          {resolvedTickets.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-success/10 text-success border border-success/20 tabular-nums">
              {resolvedTickets.length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                <th className="px-6 py-3.5 font-semibold">Ticket</th>
                <th className="px-6 py-3.5 font-semibold">Title</th>
                <th className="px-6 py-3.5 font-semibold">Priority</th>
                <th className="px-6 py-3.5 font-semibold">Department</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold">Assigned To</th>
                <th className="px-6 py-3.5 font-semibold">Created</th>
                <th className="px-6 py-3.5 font-semibold">Closed Time</th>
                <th className="px-6 py-3.5 font-semibold">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resolvedTickets.length > 0 ? resolvedTickets.map((t) => {
                const created = new Date(t.created_at!);
                const closed = new Date(t.updated_at!);
                const diffMs = closed.getTime() - created.getTime();
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const totalTime = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
                return (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{t.code}</td>
                    <td className="px-6 py-3.5 text-xs font-medium max-w-[200px] truncate">{t.title}</td>
                    <td className="px-6 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", priorityColors[t.priority || "Medium"])}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">{t.assigned_dept || "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                        t.status === "Closed" ? "bg-muted text-muted-foreground" : "bg-success/10 text-success border border-success/20"
                      )}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">{t.assigned_to || "Unassigned"}</td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground tabular-nums">
                      {created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      <br />
                      <span className="text-[10px]">{created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground tabular-nums">
                      {closed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      <br />
                      <span className="text-[10px]">{closed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums",
                        diffHrs >= 24 ? "bg-destructive/10 text-destructive" : diffHrs >= 8 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                      )}>
                        {totalTime}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">No resolved tickets yet</p>
                    </div>
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

export default SLAReportPage;
