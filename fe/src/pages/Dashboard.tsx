import { useState, useEffect, useRef } from "react";
import { isSuperRole, hasAnyRole } from "@/lib/roles";
import { dashboardApi } from "@/lib/api";
import type { ApiDashboardStats } from "@/lib/api";
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  Filter,
  BarChart3,
  Target,
  Layers,
  Building2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/* ── Color palettes ── */
const pieColors = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)", "hsl(210, 80%, 55%)", "hsl(200, 10%, 45%)"];
const barColors = ["hsl(var(--chart-1))", "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(145, 65%, 42%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)"];
const categoryColors = ["hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(145, 65%, 42%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 10%, 45%)", "hsl(30, 80%, 55%)", "hsl(160, 60%, 45%)"];

const statusColors: Record<string, string> = {
  Open: "bg-info text-info-foreground",
  "In Progress": "bg-warning text-warning-foreground",
  "Pending Approval": "bg-accent text-accent-foreground",
  "Follow Up": "bg-orange-100 text-orange-700",
  Resolved: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  Critical: "bg-destructive",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-muted-foreground",
};

/* ── Custom Tooltip ── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label || payload[0]?.name}</p>
      <p className="text-muted-foreground">{payload[0]?.value} tickets</p>
    </div>
  );
};

const Dashboard = () => {
  const storedUser = localStorage.getItem("oliva_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";
  const userRole = user?.role || "User";
  const userDept = user?.department || "";
  const userId = user?.id;
  const navigate = useNavigate();

  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Filter state ── */
  const [filterDept, setFilterDept] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  /* ── Role-based base params (computed once) ── */
  const getBaseParams = (): { department?: string; user_id?: number } | undefined => {
    if (isSuperRole(userRole)) return undefined;
    const roles = userRole.split(",").map((r: string) => r.trim());
    const zenotiRoles = ["Zenoti Team", "Area Operations Manager", "Area Operations Manager Head", "Finance", "Finance Head"];
    if (roles.some((r: string) => zenotiRoles.includes(r))) return { department: "Zenoti" };
    const deptManagerRoles = ["Help Desk Admin", "Helpdesk In-charge", "L1 Manager", "L2 Manager", "Manager"];
    if (roles.some((r: string) => deptManagerRoles.includes(r))) return undefined;
    if (userDept) {
      if (userDept.toLowerCase().includes("quality")) return { department: "Quality" };
      return { department: userDept };
    }
    return { user_id: userId };
  };

  /* ── Fetch dashboard data ── */
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!localStorage.getItem("oliva_token")) {
      setLoading(false);
      return;
    }
    // Avoid double-fetch on mount from React StrictMode
    if (fetchedRef.current && filterDept === "All" && filterCategory === "All") return;
    fetchedRef.current = true;

    setLoading(true);
    const base = getBaseParams() || {};
    const params: Record<string, any> = { ...base };
    if (filterDept !== "All" && !base.department) params.department = filterDept;
    if (filterCategory !== "All") params.category = filterCategory;
    dashboardApi.stats(params)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterDept, filterCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load dashboard data.</p>
      </div>
    );
  }

  /* ── Derived data ── */
  const deptOptions = stats.tickets_by_department.map((d) => d.name).filter((n) => n !== "Unassigned");
  const categoryOptions = (stats.tickets_by_category || []).map((c) => c.name);
  const pieData = Object.entries(stats.tickets_by_priority).map(([name, value]) => ({ name, value }));
  const hasRoleLockedDept = !!(getBaseParams()?.department);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {userName}</p>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* All Tickets */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border border-l-4 border-l-primary hover:elevated-shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <span className="text-3xl font-bold">{stats.total_tickets}</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">All Tickets</p>
        </div>

        {/* Open Tickets */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border border-l-4 border-l-amber-500 hover:elevated-shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-3xl font-bold">{stats.open_tickets}</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border border-l-4 border-l-emerald-500 hover:elevated-shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold">{stats.resolved}</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Resolved Tickets</p>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border border-l-4 border-l-sky-500 hover:elevated-shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-sky-50">
              <Clock className="h-5 w-5 text-sky-500" />
            </div>
            <span className="text-3xl font-bold">
              {stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : "—"}
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
        </div>
      </div>

      {/* ── Escalation Alert Card ── */}
      <div
        onClick={() => navigate("/tickets?filter=escalation")}
        className={cn(
          "relative overflow-hidden rounded-xl p-5 card-shadow border-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg",
          stats.escalation_count > 0
            ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-300"
            : "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "inline-flex items-center justify-center h-14 w-14 rounded-2xl",
              stats.escalation_count > 0 ? "bg-red-100" : "bg-emerald-100"
            )}>
              <AlertTriangle className={cn("h-7 w-7", stats.escalation_count > 0 ? "text-red-600" : "text-emerald-600")} />
            </div>
            <div>
              <h3 className={cn("text-lg font-bold", stats.escalation_count > 0 ? "text-red-700" : "text-emerald-700")}>
                Escalations (Next 4 Hours)
              </h3>
              <p className={cn("text-sm", stats.escalation_count > 0 ? "text-red-600/80" : "text-emerald-600/80")}>
                {stats.escalation_count > 0
                  ? `${stats.escalation_count} ticket${stats.escalation_count > 1 ? "s" : ""} approaching SLA breach`
                  : "No tickets approaching SLA breach"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-4xl font-bold",
              stats.escalation_count > 0 ? "text-red-600" : "text-emerald-600"
            )}>
              {stats.escalation_count}
            </span>
            <ArrowUpRight className={cn("h-5 w-5", stats.escalation_count > 0 ? "text-red-400" : "text-emerald-400")} />
          </div>
        </div>
        {stats.escalation_count > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 bg-card rounded-xl p-4 card-shadow border border-border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
        {!hasRoleLockedDept && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          >
            <option value="All">All Departments</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        >
          <option value="All">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterDept !== "All" || filterCategory !== "All") && (
          <button
            onClick={() => { setFilterDept("All"); setFilterCategory("All"); }}
            className="text-xs text-primary font-medium hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Distribution Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department-wise */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Department-wise</h3>
          </div>
          {stats.tickets_by_department.length > 0 ? (
            <div className="space-y-2.5">
              {stats.tickets_by_department
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((d, i) => {
                  const maxCount = stats.tickets_by_department[0]?.count || 1;
                  const sorted = [...stats.tickets_by_department].sort((a, b) => b.count - a.count);
                  const max = sorted[0]?.count || 1;
                  return (
                    <div key={d.name} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate max-w-[140px]" title={d.name}>{d.name}</span>
                        <span className="font-bold">{d.count}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(d.count / max) * 100}%`, backgroundColor: barColors[i % barColors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          )}
        </div>

        {/* Priority-wise (Type) */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Priority-wise</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
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
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          )}
        </div>

        {/* Category-wise */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Category-wise</h3>
          </div>
          {(stats.tickets_by_category || []).length > 0 ? (
            <div className="space-y-2.5">
              {stats.tickets_by_category
                .slice(0, 8)
                .map((c, i) => {
                  const max = stats.tickets_by_category[0]?.count || 1;
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate max-w-[140px]" title={c.name}>{c.name}</span>
                        <span className="font-bold">{c.count}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(c.count / max) * 100}%`, backgroundColor: categoryColors[i % categoryColors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
