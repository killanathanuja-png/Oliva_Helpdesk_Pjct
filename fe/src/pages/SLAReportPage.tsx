import React, { useState, useEffect } from "react";
import { isSuperRole } from "@/lib/roles";
import { ticketsApi, slaApi, categoriesApi, subcategoriesApi, centersApi, cddTypesApi } from "@/lib/api";
import type { ApiTicket, ApiSLAConfig, ApiCenter, ApiCDDType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, CheckCircle, Clock, BarChart3, TrendingUp, Shield, ShieldAlert, ArrowUpRight, ArrowDownRight, Filter, Calendar } from "lucide-react";

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
  const userName = parsedUser?.name || "";
  const userDept = parsedUser?.department || "";

  const isCddUser = userDept.toUpperCase() === "CDD";
  const reportLabel = isCddUser ? "TAT" : "SLA";

  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<ApiSLAConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSubCategory, setFilterSubCategory] = useState("All");
  const [datePreset, setDatePreset] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [tatReportView, setTatReportView] = useState<"" | "CM Response" | "AOM Response" | "AMH Response">("");
  const [centers, setCenters] = useState<ApiCenter[]>([]);
  const [cddTypesData, setCddTypesData] = useState<ApiCDDType[]>([]);

  // Fetch categories, subcategories, and centers
  useEffect(() => {
    if (isCddUser) {
      // CDD: fetch from cdd_types API
      cddTypesApi.list().then((types) => {
        setCddTypesData(types);
        setCategoryOptions(types.map((t) => t.name));
        // Initial: show all categories from all types
        const allCats: string[] = [];
        types.forEach((t) => (t.categories || []).forEach((c) => { if (!allCats.includes(c.name)) allCats.push(c.name); }));
        setSubCategoryOptions(allCats.sort());
      }).catch(() => {});
      centersApi.list().then((c) => setCenters(c)).catch(() => {});
    } else {
      categoriesApi.list().then((cats) => {
        setCategoryOptions(cats.map((c) => c.name));
      }).catch(() => {});
      subcategoriesApi.list().then((subs) => {
        setSubCategoryOptions(subs.map((s) => s.name));
      }).catch(() => {});
    }
  }, [isCddUser]);

  // CDD: always show all cdd_categories regardless of type selection
  useEffect(() => {
    if (!isCddUser || cddTypesData.length === 0) return;
    const allCats: string[] = [];
    cddTypesData.forEach((t) => (t.categories || []).forEach((c) => { if (!allCats.includes(c.name)) allCats.push(c.name); }));
    setSubCategoryOptions(allCats.sort());
  }, [cddTypesData, isCddUser]);

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
        const myTickets = isSuperRole(userRole)
          ? t
          : t.filter((tk) => tk.raised_by === userName || tk.assigned_to === userName ||
              (allowedDepts.length > 0 && allowedDepts.includes(tk.assigned_dept || "")));
        setTickets(myTickets.filter((tk) => tk.status === "Resolved" || tk.status === "Closed"));
        setSlaConfigs(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userRole, userDept]);

  // Compute date range from preset
  const getDateRange = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    if (datePreset === "Last 7 Days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start, end: now };
    }
    if (datePreset === "Last 30 Days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start, end: now };
    }
    if (datePreset === "Last 3 Months") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { start, end: now };
    }
    if (datePreset === "Custom" && customStartDate && customEndDate) {
      return { start: new Date(customStartDate), end: new Date(customEndDate + "T23:59:59") };
    }
    return { start: null, end: null };
  };

  const filtered = tickets.filter((t) => {
    if (filterPriority !== "All" && t.priority !== filterPriority) return false;
    if (filterDept !== "All" && t.assigned_dept !== filterDept) return false;
    if (filterCategory !== "All" && t.category !== filterCategory) return false;
    if (filterSubCategory !== "All" && t.sub_category !== filterSubCategory) return false;
    // Date range filter
    const { start, end } = getDateRange();
    if (start && end && t.created_at) {
      const ticketDate = new Date(t.created_at);
      if (ticketDate < start || ticketDate > end) return false;
    }
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">{reportLabel} Report</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isCddUser ? "Turn Around Time performance overview" : "Service Level Agreement performance overview"}
            </p>
          </div>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mt-2" />
          {!isCddUser && (
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
          )}
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
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          >
            <option value="All">{isCddUser ? "All Types" : "All Categories"}</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterSubCategory}
            onChange={(e) => setFilterSubCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          >
            <option value="All">{isCddUser ? "All Category" : "All Sub-Categories"}</option>
            {subCategoryOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            >
              <option value="All">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          {datePreset === "Custom" && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                placeholder="End Date"
              />
            </>
          )}
          {isCddUser && (
            <select
              value={tatReportView}
              onChange={(e) => setTatReportView(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-primary bg-primary/5 text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            >
              <option value="">TAT Overview</option>
              <option value="CM Response">TAT - CM Response</option>
              <option value="AOM Response">TAT - AOM Response</option>
              <option value="AMH Response">TAT - AMH Response</option>
            </select>
          )}
        </div>
      </div>

      {/* ── TAT AOM/CM/AMH Report View (CDD only) ── */}
      {isCddUser && tatReportView && (() => {
        // Build AOM → Zone → Clinic hierarchy from centers
        const aomMap = new Map<string, { zones: Map<string, { clinics: { name: string; total: number; withinTat: number; overTat: number }[] }> }>();

        centers.forEach((c) => {
          const aomEmail = c.aom_email || "";
          // Get AOM name from email
          const aomNameFromEmail = aomEmail.split("@")[0]?.split(".")[0] || "";
          const aomDisplayName = (() => {
            // Map known AOM emails to display names
            const nameMap: Record<string, string> = {
              "shweta.pushkar": "Shweta", "triveni.eric": "Triveni", "bindhu.m": "Bindhu",
              "navya.shivanna": "Navya", "karthik.sn": "Karthik", "sumitakaul": "Sumita",
              "tanima.ghosh": "Tanima", "tejaswini.tiwari": "Tejaswini",
            };
            const key = aomEmail.split("@")[0] || "";
            return nameMap[key] || aomNameFromEmail.charAt(0).toUpperCase() + aomNameFromEmail.slice(1);
          })();

          const zone = c.zone || "Other";
          const clinicName = c.name;

          if (!aomMap.has(aomDisplayName)) {
            aomMap.set(aomDisplayName, { zones: new Map() });
          }
          const aomEntry = aomMap.get(aomDisplayName)!;
          if (!aomEntry.zones.has(zone)) {
            aomEntry.zones.set(zone, { clinics: [] });
          }

          // Count tickets for this clinic
          const clinicTickets = filtered.filter((t) => t.center === clinicName || t.zenoti_location === clinicName);
          const withinTat = clinicTickets.filter((t) => !t.tat_breached).length;
          const overTat = clinicTickets.filter((t) => t.tat_breached).length;

          aomEntry.zones.get(zone)!.clinics.push({
            name: clinicName,
            total: clinicTickets.length,
            withinTat,
            overTat,
          });
        });

        const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
        const currentYear = new Date().getFullYear().toString().slice(-2);

        return (
          <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {tatReportView} — {currentMonth}'{currentYear}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-white text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-semibold">AOM</th>
                    <th className="px-4 py-3 text-left font-semibold">Zone</th>
                    <th className="px-4 py-3 text-left font-semibold">Clinic</th>
                    <th className="px-4 py-3 text-center font-semibold">Total Tickets</th>
                    <th className="px-4 py-3 text-center font-semibold">Within TAT</th>
                    <th className="px-4 py-3 text-center font-semibold">Over TAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.from(aomMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([aomName, aomData]) => {
                    const allClinics: { zone: string; name: string; total: number; withinTat: number; overTat: number }[] = [];
                    aomData.zones.forEach((zoneData, zoneName) => {
                      zoneData.clinics.forEach((cl) => {
                        allClinics.push({ zone: zoneName, ...cl });
                      });
                    });
                    const aomTotal = allClinics.reduce((s, c) => s + c.total, 0);
                    const aomWithin = allClinics.reduce((s, c) => s + c.withinTat, 0);
                    const aomOver = allClinics.reduce((s, c) => s + c.overTat, 0);

                    return (
                      <React.Fragment key={aomName}>
                        {allClinics.map((cl, idx) => (
                          <tr key={`${aomName}-${cl.name}`} className="hover:bg-muted/20 transition-colors">
                            {idx === 0 && (
                              <td className="px-4 py-2.5 font-semibold text-xs" rowSpan={allClinics.length}>
                                {aomName}
                              </td>
                            )}
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{cl.zone}</td>
                            <td className="px-4 py-2.5 text-xs">{cl.name}</td>
                            <td className="px-4 py-2.5 text-center text-xs font-medium">{cl.total || ""}</td>
                            <td className="px-4 py-2.5 text-center text-xs">
                              {cl.withinTat > 0 && <span className="text-success font-medium">{cl.withinTat}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center text-xs">
                              {cl.overTat > 0 && <span className="text-destructive font-medium">{cl.overTat}</span>}
                            </td>
                          </tr>
                        ))}
                        {/* AOM Total Row */}
                        <tr className="bg-amber-50/60 font-semibold border-b-2 border-border">
                          <td className="px-4 py-2 text-xs">{aomName}</td>
                          <td className="px-4 py-2 text-xs font-bold">Total</td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 text-center text-xs font-bold">{aomTotal || ""}</td>
                          <td className="px-4 py-2 text-center text-xs font-bold text-success">{aomWithin || ""}</td>
                          <td className="px-4 py-2 text-center text-xs font-bold text-destructive">{aomOver || ""}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Resolved / Closed Tickets with Resolution Time — hidden for CDD */}
      {!isCddUser && <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
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
      </div>}
    </div>
  );
};

export default SLAReportPage;
