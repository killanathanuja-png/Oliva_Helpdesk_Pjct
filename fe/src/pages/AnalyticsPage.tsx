import { useState, useEffect } from "react";
import { isSuperRole } from "@/lib/roles";
import { ticketsApi } from "@/lib/api";
import type { ApiTicket } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2, BarChart3, AlertTriangle, CheckCircle, Clock, Shield,
  TrendingUp, ArrowUpRight, ArrowDownRight, ShieldAlert, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

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

const pieColors = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)", "hsl(210, 80%, 55%)", "hsl(200, 10%, 45%)"];

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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tracking-tight" style={{ color }}>{value}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Compliance</span>
      </div>
    </div>
  );
};

const AnalyticsPage = () => {
  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = parsedUser?.role || "User";
  const userName = parsedUser?.name || "";
  const userDept = parsedUser?.department || "";
  const isCddUser = userDept.toUpperCase() === "CDD";

  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsApi.list()
      .then((t) => {
        if (isSuperRole(userRole)) {
          setTickets(t);
        } else {
          // Filter to user's relevant tickets
          setTickets(t.filter((tk) =>
            tk.raised_by === userName || tk.assigned_to === userName ||
            (userDept && (tk.assigned_dept || "").toLowerCase().includes(userDept.toLowerCase().split(" ")[0]))
          ));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userRole, userName, userDept]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const total = tickets.length;
  const resolved = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const open = total - resolved;
  const breached = tickets.filter((t) => t.sla_breached).length;
  const onTrack = total - breached;
  const complianceRate = total > 0 ? Math.round((onTrack / total) * 100) : 100;

  // Avg resolution time
  const resolvedTickets = tickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && t.created_at && t.updated_at);
  const avgResHours = resolvedTickets.length > 0
    ? Math.round(resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at!).getTime();
        const updated = new Date(t.updated_at!).getTime();
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0) / resolvedTickets.length)
    : null;

  // Department breakdown
  const deptMap = new Map<string, { total: number; breached: number }>();
  tickets.forEach((t) => {
    const dept = t.assigned_dept || "Unassigned";
    const entry = deptMap.get(dept) || { total: 0, breached: 0 };
    entry.total++;
    if (t.sla_breached) entry.breached++;
    deptMap.set(dept, entry);
  });
  const deptBreakdown = Array.from(deptMap.entries())
    .map(([name, v]) => ({ name, ...v, complianceRate: v.total > 0 ? Math.round(((v.total - v.breached) / v.total) * 100) : 100 }))
    .sort((a, b) => a.complianceRate - b.complianceRate);

  // Priority breakdown
  const prioMap = new Map<string, { total: number; breached: number }>();
  tickets.forEach((t) => {
    const prio = t.priority || "Unknown";
    const entry = prioMap.get(prio) || { total: 0, breached: 0 };
    entry.total++;
    if (t.sla_breached) entry.breached++;
    prioMap.set(prio, entry);
  });
  const prioBreakdown = Array.from(prioMap.entries())
    .map(([name, v]) => ({ name, ...v, complianceRate: v.total > 0 ? Math.round(((v.total - v.breached) / v.total) * 100) : 100 }))
    .sort((a, b) => ["Critical", "High", "Medium", "Low"].indexOf(a.name) - ["Critical", "High", "Medium", "Low"].indexOf(b.name));

  // Priority pie data
  const pieData = prioBreakdown.map((p) => ({ name: p.name, value: p.total }));

  // Tickets by department bar chart
  const deptBarData = deptBreakdown.map((d) => ({ name: d.name, count: d.total }));

  // Status distribution
  const statusMap = new Map<string, number>();
  tickets.forEach((t) => {
    const s = t.status || "Unknown";
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const statusData = Array.from(statusMap.entries()).map(([name, count]) => ({ name, count }));

  // Top centers
  const centerMap = new Map<string, number>();
  tickets.forEach((t) => {
    if (t.center) centerMap.set(t.center, (centerMap.get(t.center) || 0) + 1);
  });
  const topCenters = Array.from(centerMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">SLA performance & ticket analytics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SLA Gauge */}
        <div className="lg:col-span-4 bg-card rounded-2xl card-shadow border border-border p-6 flex flex-col items-center justify-center">
          {(() => {
            const pieData = [
              { name: "Resolved", value: resolved, color: "hsl(145, 65%, 42%)" },
              { name: "Breached", value: breached, color: "hsl(0, 72%, 55%)" },
            ].filter((d) => d.value > 0);
            if (pieData.length === 0) pieData.push({ name: "No Tickets", value: 1, color: "hsl(200, 10%, 80%)" });
            return (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={3}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-muted-foreground">{d.value} tickets</p>
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span className="font-medium">Resolved: {resolved}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span className="font-medium">Breached: {breached}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-primary" /></div>
              <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Total Tickets</p>
          </div>
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-blue-500" /></div>
              <ArrowUpRight className="h-4 w-4 text-blue-500/50" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{open}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Open Tickets</p>
          </div>
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><CheckCircle className="h-4 w-4 text-success" /></div>
              <Shield className="h-4 w-4 text-success/40" />
            </div>
            <p className="text-2xl font-bold text-success">{resolved}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Resolved</p>
          </div>
          <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center"><ShieldAlert className="h-4 w-4 text-destructive" /></div>
              {breached > 0 ? <ArrowUpRight className="h-4 w-4 text-destructive/50" /> : <ArrowDownRight className="h-4 w-4 text-success/50" />}
            </div>
            <p className={cn("text-2xl font-bold", breached > 0 ? "text-destructive" : "text-success")}>{breached}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">SLA Breached</p>
          </div>
          <div className="col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl card-shadow border border-primary/20 p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0"><Clock className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold">{avgResHours != null ? `${avgResHours}h` : "N/A"}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Avg. Resolution Time</p>
            </div>
          </div>
          <div className="col-span-2 bg-gradient-to-br from-success/5 to-success/10 rounded-2xl card-shadow border border-success/20 p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success flex items-center justify-center shrink-0"><CheckCircle className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold text-success">{onTrack}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Currently On Track</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department SLA + Priority SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Department SLA Compliance</h2>
          </div>
          <div className="p-6 space-y-5">
            {deptBreakdown.length > 0 ? deptBreakdown.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", d.complianceRate >= 80 ? "bg-success" : d.complianceRate >= 50 ? "bg-warning" : "bg-destructive")} />
                    <span className="text-sm font-medium">{d.name}</span>
                  </div>
                  <span className={cn("text-sm font-bold", d.complianceRate >= 80 ? "text-success" : d.complianceRate >= 50 ? "text-warning" : "text-destructive")}>{d.complianceRate}%</span>
                </div>
                <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", d.complianceRate >= 80 ? "bg-gradient-to-r from-success/80 to-success" : d.complianceRate >= 50 ? "bg-gradient-to-r from-warning/80 to-warning" : "bg-gradient-to-r from-destructive/80 to-destructive")}
                    style={{ width: `${d.complianceRate}%` }} />
                </div>
                <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{d.total} total</span><span>{d.breached} breached</span><span>{d.total - d.breached} on track</span>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </div>
        </div>

        {!isCddUser && (
          <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-orange-500/5 to-transparent">
              <h2 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Priority SLA Compliance</h2>
            </div>
            <div className="p-6 space-y-5">
              {prioBreakdown.length > 0 ? prioBreakdown.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-2.5 w-2.5 rounded-full", priorityDotColors[p.name])} />
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", priorityColors[p.name])}>{p.name}</span>
                    </div>
                    <span className={cn("text-sm font-bold", p.complianceRate >= 80 ? "text-success" : p.complianceRate >= 50 ? "text-warning" : "text-destructive")}>{p.complianceRate}%</span>
                  </div>
                  <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", p.complianceRate >= 80 ? "bg-gradient-to-r from-success/80 to-success" : p.complianceRate >= 50 ? "bg-gradient-to-r from-warning/80 to-warning" : "bg-gradient-to-r from-destructive/80 to-destructive")}
                      style={{ width: `${p.complianceRate}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{p.total} total</span><span>{p.breached} breached</span><span>{p.total - p.breached} on track</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
            </div>
          </div>
        )}
      </div>

      {/* Charts: Priority Pie + Department Bar + Top Centers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl card-shadow border border-border p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4"><Target className="h-4 w-4 text-primary" /> By Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl card-shadow border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Tickets by Department</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl card-shadow border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Top Centers</h3>
          <div className="space-y-3">
            {topCenters.length > 0 ? topCenters.map((c, i) => {
              const max = topCenters[0]?.count || 1;
              return (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full gradient-primary" style={{ width: `${(c.count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold w-6 text-right">{c.count}</span>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
