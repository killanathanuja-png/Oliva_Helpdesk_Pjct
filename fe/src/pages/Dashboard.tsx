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
  RefreshCw,
  Filter,
  Target,
  Layers,
  Building2,
  Calendar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/* ── Color palettes ── */
const deptPieColors = [
  "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(145, 65%, 42%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 10%, 45%)",
  "hsl(30, 80%, 55%)", "hsl(160, 60%, 45%)", "hsl(330, 60%, 55%)",
  "hsl(60, 70%, 45%)",
];
const priorityPieColors = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)", "hsl(210, 80%, 55%)", "hsl(200, 10%, 45%)"];
const categoryColors = [
  "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(145, 65%, 42%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 10%, 45%)",
  "hsl(30, 80%, 55%)", "hsl(160, 60%, 45%)",
];

/* ── Tooltip ── */
const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground">{value} tickets ({Math.round((percent || 0) * 100)}%)</p>
    </div>
  );
};

/* ── Time presets ── */
function getDateRange(preset: string): { from_date?: string; to_date?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (preset === "this_month") {
    return { from_date: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to_date: fmt(now) };
  }
  if (preset === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from_date: fmt(first), to_date: fmt(last) };
  }
  if (preset === "last_3_months") {
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return { from_date: fmt(start), to_date: fmt(now) };
  }
  return {};
}

const selectClass = "px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30";

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

  /* ── Filters ── */
  const [filterDept, setFilterDept] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [timePreset, setTimePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  /* ── Role-based base params ── */
  const getBaseParams = (): { department?: string; user_id?: number } | undefined => {
    if (isSuperRole(userRole)) return undefined;
    const roles = userRole.split(",").map((r: string) => r.trim());
    const zenotiRoles = ["Zenoti Team", "Area Operations Manager", "Area Operations Manager Head", "Finance", "Finance Head"];
    if (roles.some((r: string) => zenotiRoles.includes(r))) return { department: "Zenoti", user_id: userId };
    const deptManagerRoles = ["Help Desk Admin", "Helpdesk In-charge", "L1 Manager", "L2 Manager", "Manager"];
    if (roles.some((r: string) => deptManagerRoles.includes(r))) return undefined;
    if (userDept) {
      if (userDept.toLowerCase().includes("quality")) return { department: "Quality", user_id: userId };
      return { department: userDept, user_id: userId };
    }
    return { user_id: userId };
  };
  const hasRoleLockedDept = !!(getBaseParams()?.department);

  /* ── Fetch ── */
  const fetchCount = useRef(0);
  const doFetch = () => {
    if (!localStorage.getItem("oliva_token")) { setLoading(false); return; }
    setLoading(true);
    const base = getBaseParams() || {};
    const params: Record<string, any> = { ...base };
    if (filterDept !== "All" && !base.department) params.department = filterDept;
    if (filterCategory !== "All") params.category = filterCategory;
    // Time
    if (timePreset === "custom") {
      if (customFrom) params.from_date = customFrom;
      if (customTo) params.to_date = customTo;
    } else if (timePreset !== "all") {
      const range = getDateRange(timePreset);
      if (range.from_date) params.from_date = range.from_date;
      if (range.to_date) params.to_date = range.to_date;
    }
    dashboardApi.stats(params).then(setStats).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (fetchCount.current === 0) {
      fetchCount.current++;
      doFetch();
      return;
    }
    doFetch();
  }, [filterDept, filterCategory, timePreset, customFrom, customTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset category when department changes
  useEffect(() => { setFilterCategory("All"); }, [filterDept]);

  /* ── Loading / Error ── */
  if (loading && !stats) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!stats) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Unable to load dashboard data.</p></div>;
  }

  /* ── Derived ── */
  const deptOptions = stats.tickets_by_department.map((d) => d.name).filter((n) => n !== "Unassigned");
  const categoryOptions = (stats.tickets_by_category || []).map((c) => c.name);
  const priorityPieData = Object.entries(stats.tickets_by_priority).map(([name, value]) => ({ name, value }));
  const deptPieData = stats.tickets_by_department.filter((d) => d.count > 0);
  const deptTotal = deptPieData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold font-display">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Welcome back, {userName}</p>
      </div>

      {/* ── KPI Cards + Escalation ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 flex-shrink-0"><Ticket className="h-4 w-4 text-primary" /></div>
            <div><span className="text-2xl font-bold leading-none">{stats.total_tickets}</span><p className="text-[11px] font-medium text-muted-foreground mt-0.5">All Tickets</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-amber-50 flex-shrink-0"><Clock className="h-4 w-4 text-amber-500" /></div>
            <div><span className="text-2xl font-bold leading-none">{stats.open_tickets}</span><p className="text-[11px] font-medium text-muted-foreground mt-0.5">Open</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-50 flex-shrink-0"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
            <div><span className="text-2xl font-bold leading-none">{stats.resolved}</span><p className="text-[11px] font-medium text-muted-foreground mt-0.5">Resolved</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-sky-500">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-sky-50 flex-shrink-0"><Clock className="h-4 w-4 text-sky-500" /></div>
            <div><span className="text-2xl font-bold leading-none">{stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : "—"}</span><p className="text-[11px] font-medium text-muted-foreground mt-0.5">Avg Resolution</p></div>
          </div>
        </div>
        <div
          onClick={() => navigate("/tickets?filter=escalation")}
          className={cn("rounded-xl p-4 card-shadow border-l-4 cursor-pointer transition-all hover:shadow-md", stats.escalation_count > 0 ? "bg-red-50 border border-red-200 border-l-red-500" : "bg-emerald-50 border border-emerald-200 border-l-emerald-500")}
        >
          <div className="flex items-center gap-3">
            <div className={cn("inline-flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0", stats.escalation_count > 0 ? "bg-red-100" : "bg-emerald-100")}>
              <AlertTriangle className={cn("h-4 w-4", stats.escalation_count > 0 ? "text-red-600" : "text-emerald-600")} />
            </div>
            <div>
              <span className={cn("text-2xl font-bold leading-none", stats.escalation_count > 0 ? "text-red-600" : "text-emerald-600")}>{stats.escalation_count}</span>
              <p className={cn("text-[11px] font-medium mt-0.5 flex items-center gap-1", stats.escalation_count > 0 ? "text-red-500" : "text-emerald-500")}>Escalations <ArrowUpRight className="h-3 w-3" /></p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2 bg-card rounded-lg px-3 py-2 card-shadow border border-border">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {!hasRoleLockedDept && (
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={selectClass}>
            <option value="All">All Departments</option>
            {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
          <option value="All">All Categories</option>
          {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="h-4 w-px bg-border mx-1" />
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <select value={timePreset} onChange={(e) => setTimePreset(e.target.value)} className={selectClass}>
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="custom">Custom Range</option>
        </select>
        {timePreset === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={cn(selectClass, "w-[130px]")} />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={cn(selectClass, "w-[130px]")} />
          </>
        )}
        {(filterDept !== "All" || filterCategory !== "All" || timePreset !== "all") && (
          <button onClick={() => { setFilterDept("All"); setFilterCategory("All"); setTimePreset("all"); setCustomFrom(""); setCustomTo(""); }} className="text-[11px] text-primary font-medium hover:underline">
            Clear
          </button>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={doFetch}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />} Submit
          </button>
          <button
            onClick={doFetch}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Charts: Dept Pie + Priority Pie + Category Bars ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Department-wise Pie */}
        <div className="bg-card rounded-xl p-4 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-xs">Department-wise</h3>
          </div>
          {deptPieData.length > 0 ? (
            <div className="flex items-start gap-3">
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie data={deptPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="count" nameKey="name" paddingAngle={2}>
                    {deptPieData.map((_, i) => <Cell key={i} fill={deptPieColors[i % deptPieColors.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 pt-2 max-h-[160px] overflow-y-auto">
                {deptPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[100px]">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: deptPieColors[i % deptPieColors.length] }} />
                      <span className="text-muted-foreground truncate" title={d.name}>{d.name}</span>
                    </div>
                    <span className="font-bold ml-1">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-8">No data</p>}
        </div>

        {/* Priority-wise Pie */}
        <div className="bg-card rounded-xl p-4 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-xs">Priority-wise</h3>
          </div>
          {priorityPieData.length > 0 ? (
            <div className="flex items-start gap-3">
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" nameKey="name" paddingAngle={3}>
                    {priorityPieData.map((_, i) => <Cell key={i} fill={priorityPieColors[i % priorityPieColors.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 pt-2">
                {priorityPieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityPieColors[i % priorityPieColors.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="font-bold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-8">No data</p>}
        </div>

        {/* Category-wise Bars */}
        <div className="bg-card rounded-xl p-4 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-xs">
              Category-wise
              {filterDept !== "All" && <span className="text-[10px] text-primary ml-1">({filterDept})</span>}
            </h3>
          </div>
          {(stats.tickets_by_category || []).length > 0 ? (
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {stats.tickets_by_category.slice(0, 10).map((c, i) => {
                const max = stats.tickets_by_category[0]?.count || 1;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="text-muted-foreground truncate max-w-[140px]" title={c.name}>{c.name}</span>
                      <span className="font-bold">{c.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.count / max) * 100}%`, backgroundColor: categoryColors[i % categoryColors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-8">No data</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
