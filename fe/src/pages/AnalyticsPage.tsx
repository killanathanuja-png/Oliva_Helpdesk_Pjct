import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isSuperRole } from "@/lib/roles";
import { ticketsApi, dashboardApi } from "@/lib/api";
import type { ApiTicket, ApiDashboardStats } from "@/lib/api";
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

  const navigate = useNavigate();
  const showEscalation = isSuperRole(userRole) || isCddUser;

  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, any> = {};
    if (!isSuperRole(userRole) && userDept) {
      params.department = userDept;
      const userId = parsedUser?.id;
      if (userId) params.user_id = userId;
    }

    // Fetch dashboard stats (single source of truth for counts)
    dashboardApi.stats(params)
      .then((s) => setStats(s))
      .catch(() => {});

    // Fetch tickets for response time calculation
    ticketsApi.list()
      .then((t) => {
        if (isSuperRole(userRole)) {
          setTickets(t);
        } else {
          setTickets(t.filter((tk) =>
            tk.raised_by === userName ||
            (userDept && tk.assigned_dept === userDept)
          ));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userRole, userName, userDept]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Use dashboard stats for KPI counts (matches dashboard exactly)
  const total = stats?.total_tickets ?? 0;
  const open = stats?.open_tickets ?? 0;
  const resolved = stats?.resolved ?? 0;
  const breached = stats?.sla_breached ?? 0;
  const onTrack = total - breached;
  const complianceRate = total > 0 ? Math.round((onTrack / total) * 100) : 100;
  const escalationCount = stats?.escalation_count ?? 0;

  // Avg response time (created_at → acknowledged_at or first comment)
  const respondedTickets = tickets.filter((t) => t.created_at && (t.acknowledged_at || (t.comments && t.comments.length > 0)));
  const avgResHours = respondedTickets.length > 0
    ? (() => {
        let totalMin = 0;
        let count = 0;
        for (const t of respondedTickets) {
          const created = new Date(t.created_at!).getTime();
          const responded = t.acknowledged_at
            ? new Date(t.acknowledged_at).getTime()
            : t.comments.length > 0
              ? new Date(t.comments[0].created_at).getTime()
              : 0;
          if (responded > created) {
            totalMin += (responded - created) / (1000 * 60);
            count++;
          }
        }
        if (count === 0) return null;
        const avgMin = totalMin / count;
        if (avgMin < 60) return `${Math.round(avgMin)}m`;
        return `${Math.round(avgMin / 60)}h`;
      })()
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
        <p className="text-sm text-muted-foreground mt-0.5">TAT performance & ticket analytics</p>
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
                    <span className="font-medium">Resolved: {total > 0 ? Math.round((resolved / total) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span className="font-medium">Breached: {total > 0 ? Math.round((breached / total) * 100) : 0}%</span>
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
          {showEscalation ? (
            <div
              onClick={() => navigate("/tickets?filter=escalation")}
              className={cn("rounded-2xl card-shadow border p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md", escalationCount > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", escalationCount > 0 ? "bg-red-100" : "bg-emerald-100")}>
                  <AlertTriangle className={cn("h-4 w-4", escalationCount > 0 ? "text-red-600" : "text-emerald-600")} />
                </div>
                <ArrowUpRight className={cn("h-4 w-4", escalationCount > 0 ? "text-red-400" : "text-emerald-400")} />
              </div>
              <p className={cn("text-2xl font-bold", escalationCount > 0 ? "text-red-600" : "text-emerald-600")}>{escalationCount}</p>
              <p className={cn("text-[11px] font-medium mt-0.5", escalationCount > 0 ? "text-red-500" : "text-emerald-500")}>Escalations</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl card-shadow border border-border p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center"><ShieldAlert className="h-4 w-4 text-destructive" /></div>
                {breached > 0 ? <ArrowUpRight className="h-4 w-4 text-destructive/50" /> : <ArrowDownRight className="h-4 w-4 text-success/50" />}
              </div>
              <p className={cn("text-2xl font-bold", breached > 0 ? "text-destructive" : "text-success")}>{breached}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">SLA Breached</p>
            </div>
          )}
          <div className="col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl card-shadow border border-primary/20 p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0"><Clock className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold">{avgResHours ?? "N/A"}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Avg. Response Time</p>
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

    </div>
  );
};

export default AnalyticsPage;
