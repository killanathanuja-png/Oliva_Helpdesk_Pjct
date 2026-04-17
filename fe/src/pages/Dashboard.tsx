import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isSuperRole } from "@/lib/roles";
import { dashboardApi, certificatesApi } from "@/lib/api";
import type { ApiDashboardStats } from "@/lib/api";
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Filter,
  Target,
  Layers,
  Building2,
  Calendar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
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
  const entry = payload[0].payload;
  const name = entry.name || "";
  const value = entry.value ?? entry.count ?? 0;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground">{value} tickets</p>
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
  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAdminDept = userRole.toLowerCase().includes("admin department");
  const isHelpdeskAdmin = userRole.toLowerCase().includes("helpdesk admin") || userRole.toLowerCase().includes("help desk admin");
  const userCenter = user?.center || "";
  const [expiringCerts, setExpiringCerts] = useState<{ centerName: string; city: string; centerId: number; cert_type: string; expiry_date: string; days_left: number }[]>([]);
  const [certsLoaded, setCertsLoaded] = useState(false);
  const showCertCard = isAdminDept || isHelpdeskAdmin;

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

  // Fetch only on initial load
  useEffect(() => {
    if (fetchCount.current === 0) {
      fetchCount.current++;
      doFetch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset category when department changes
  useEffect(() => { setFilterCategory("All"); }, [filterDept]);

  // Fetch expiring certificates for Admin Department and Helpdesk Admin
  useEffect(() => {
    if (!isAdminDept && !isHelpdeskAdmin) return;
    certificatesApi.getExpiring().then((data) => {
      const filtered = isHelpdeskAdmin ? data.filter((c) => c.center_name === userCenter) : data;
      setExpiringCerts(filtered.map((c) => ({ centerName: c.center_name, city: c.city, centerId: c.center_id, cert_type: c.cert_type, expiry_date: c.expiry_date || "", days_left: c.days_left })));
      setCertsLoaded(true);
    }).catch(() => setCertsLoaded(true));
  }, []);

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

  return (
    <div className="space-y-2 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold font-display">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Welcome back, {userName}</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className={cn("grid grid-cols-2 gap-3", showCertCard ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
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
        {showCertCard && (
          <div className={cn("rounded-xl p-4 card-shadow border border-l-4 cursor-pointer hover:opacity-90 transition-opacity",
            expiringCerts.length > 0 ? "bg-amber-50 border-amber-200 border-l-amber-500" : "bg-emerald-50 border-emerald-200 border-l-emerald-500"
          )} onClick={() => navigate("/certificates?view=expiring")}>
            <div className="flex items-center gap-3">
              <div className={cn("inline-flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0", expiringCerts.length > 0 ? "bg-amber-100" : "bg-emerald-100")}>
                {expiringCerts.length > 0 ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </div>
              <div>
                {!certsLoaded ? (
                  <><span className="text-2xl font-bold leading-none text-muted-foreground">...</span><p className="text-[11px] font-medium text-muted-foreground mt-0.5">Checking</p></>
                ) : expiringCerts.length > 0 ? (
                  <><span className="text-2xl font-bold leading-none text-amber-600">{expiringCerts.length}</span><p className="text-[11px] font-medium text-amber-700 mt-0.5">Certificate Expiring</p></>
                ) : (
                  <><span className="text-2xl font-bold leading-none text-emerald-600">0</span><p className="text-[11px] font-medium text-emerald-700 mt-0.5">Certificate Expiring</p></>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ── CDD Dashboard: Clinic-wise, Escalation, Department, Category, Sub-Category ── */}
      {userDept.toUpperCase() === "CDD" ? (
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Clinic-wise — Donut */}
          {(() => {
            const centerData = (stats.top_centers || []).map((c) => ({ name: c.name, value: c.tickets }));
            return (
              <div className="bg-card rounded-xl p-3 card-shadow border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <h3 className="font-bold text-[11px]">Clinic-wise</h3>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={centerData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" nameKey="name" paddingAngle={2}>
                      {centerData.map((_, i) => <Cell key={i} fill={deptPieColors[i % deptPieColors.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-0.5 mt-1">
                  {centerData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 truncate">
                        <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: deptPieColors[i % deptPieColors.length] }} />
                        <span className="text-muted-foreground truncate">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 2. Escalation — Stacked bars */}
          {(() => {
            const escItems = (stats.tickets_by_status || []).filter((s) => s.name.includes("Escalated"));
            const totalEsc = escItems.reduce((s, d) => s + d.count, 0);
            const escColors = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)"];
            return (
              <div className="bg-card rounded-xl p-3 card-shadow border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <h3 className="font-bold text-[11px]">Escalation</h3>
                </div>
                <div className="flex items-center justify-center my-2">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-destructive">{totalEsc}</span>
                    <p className="text-[10px] text-muted-foreground">Total Escalated</p>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex mb-2">
                  {escItems.map((s, i) => (
                    <div key={s.name} className="h-full" style={{ width: `${stats.total_tickets > 0 ? (s.count / stats.total_tickets) * 100 : 0}%`, backgroundColor: escColors[i % escColors.length] }} />
                  ))}
                </div>
                <div className="space-y-0.5">
                  {escItems.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: escColors[i % escColors.length] }} />
                        <span className="text-muted-foreground">{s.name.replace("Escalated to ", "")}</span>
                      </div>
                      <span className="font-bold text-destructive">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 3. Department-wise — Bar Chart */}
          <div className="bg-card rounded-xl p-3 card-shadow border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <h3 className="font-bold text-[11px]">Department</h3>
            </div>
            {deptPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={deptPieData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {deptPieData.map((_, i) => <Cell key={i} fill={categoryColors[i % categoryColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-[10px] text-muted-foreground text-center py-8">No data</p>}
          </div>

          {/* 4. Type-wise — Full pie (no hole) */}
          {(() => {
            const typeData = (stats.tickets_by_category || []).map((c) => ({ name: c.name, value: c.count }));
            return (
              <div className="bg-card rounded-xl p-3 card-shadow border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <h3 className="font-bold text-[11px]">Type-wise</h3>
                </div>
                {typeData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie data={typeData} cx="50%" cy="50%" outerRadius={42} dataKey="value" nameKey="name" paddingAngle={1}>
                          {typeData.map((_, i) => <Cell key={i} fill={categoryColors[i % categoryColors.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-0.5 mt-1">
                      {typeData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 truncate">
                            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                            <span className="text-muted-foreground truncate">{d.name}</span>
                          </div>
                          <span className="font-bold">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-[10px] text-muted-foreground text-center py-4">No data</p>}
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          {/* ── Non-CDD: Charts: Dept Pie + Priority Pie + Category Bars ── */}
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
                <h3 className="font-semibold text-xs">Category-wise</h3>
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

          {/* ── Center-wise Breakdown (non-CDD) ── */}
          {stats.top_centers && stats.top_centers.length > 0 && (
            <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-gradient-to-r from-primary/5 to-transparent">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold">Center-wise Tickets</h2>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="px-4 py-2.5 font-semibold">Center</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.top_centers.map((c) => (
                    <tr key={c.name} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-center font-bold text-primary">{c.tickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
