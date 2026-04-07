import { useState, useEffect, useCallback } from "react";
import { tatReportApi, departmentsApi, centersApi } from "@/lib/api";
import type { TATReportRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2, Filter, Calendar, RefreshCw, Download, ChevronUp, ChevronDown,
  AlertTriangle, CheckCircle, Clock, BarChart3, ArrowUpDown,
} from "lucide-react";

const formatHours = (hrs: number | null | undefined) => {
  if (hrs == null) return "—";
  if (hrs < 1) return `${Math.round(hrs * 60)}m`;
  const h = Math.floor(hrs);
  const m = Math.round((hrs % 1) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
};

const escLabel = (level: number) => {
  if (level === 0) return "—";
  return `L${level}`;
};

const TATDetailReportPage = () => {
  const [rows, setRows] = useState<TATReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [withinSla, setWithinSla] = useState(0);
  const [breached, setBreached] = useState(0);
  const [avgTat, setAvgTat] = useState<number | null>(null);

  // Filters (pending - applied on Submit)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [department, setDepartment] = useState("All");
  const [center, setCenter] = useState("All");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("All");
  const [slaStatus, setSlaStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [datePreset, setDatePreset] = useState("This Month");

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  // Sort
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Options
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [centerOptions, setCenterOptions] = useState<string[]>([]);

  useEffect(() => {
    departmentsApi.list().then((d) => setDeptOptions(d.map((x) => x.name))).catch(() => {});
    centersApi.list().then((c) => setCenterOptions(c.map((x) => x.name))).catch(() => {});
  }, []);

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (datePreset === "This Month") {
      return {
        from_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
        to_date: now.toISOString().split("T")[0],
      };
    }
    if (datePreset === "Last Month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from_date: start.toISOString().split("T")[0], to_date: end.toISOString().split("T")[0] };
    }
    if (datePreset === "Last 3 Months") {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { from_date: start.toISOString().split("T")[0], to_date: now.toISOString().split("T")[0] };
    }
    if (datePreset === "Custom" && fromDate && toDate) {
      return { from_date: fromDate, to_date: toDate };
    }
    return {};
  }, [datePreset, fromDate, toDate]);

  const buildParams = useCallback((filters: Record<string, string>) => {
    const params: Record<string, string | number> = { page, page_size: pageSize, sort_by: sortBy, sort_order: sortOrder };
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "All") params[k] = v;
    });
    return params;
  }, [page, sortBy, sortOrder]);

  const fetchReport = useCallback((filters: Record<string, string>) => {
    setLoading(true);
    tatReportApi.get(buildParams(filters))
      .then((res) => {
        setRows(res.rows);
        setTotal(res.total);
        setWithinSla(res.within_sla);
        setBreached(res.breached);
        setAvgTat(res.avg_tat_hours);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  // Initial load
  useEffect(() => {
    const dateRange = getDateRange();
    const initial: Record<string, string> = { ...dateRange };
    setAppliedFilters(initial);
    fetchReport(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on sort/page change
  useEffect(() => {
    if (Object.keys(appliedFilters).length > 0) {
      fetchReport(appliedFilters);
    }
  }, [page, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    const dateRange = getDateRange();
    const filters: Record<string, string> = { ...dateRange };
    if (department !== "All") filters.department = department;
    if (center !== "All") filters.center = center;
    if (assignedTo) filters.assigned_to = assignedTo;
    if (status !== "All") filters.status = status;
    if (slaStatus !== "All") filters.sla_status = slaStatus;
    if (priority !== "All") filters.priority = priority;
    setAppliedFilters(filters);
    setPage(1);
    fetchReport(filters);
  };

  const handleRefresh = () => {
    setDatePreset("This Month");
    setFromDate("");
    setToDate("");
    setDepartment("All");
    setCenter("All");
    setAssignedTo("");
    setStatus("All");
    setSlaStatus("All");
    setPriority("All");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
    const now = new Date();
    const initial: Record<string, string> = {
      from_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      to_date: now.toISOString().split("T")[0],
    };
    setAppliedFilters(initial);
    fetchReport(initial);
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  // Export to CSV
  const handleExport = () => {
    const headers = [
      "Ticket ID", "Title", "Department", "Category", "Sub-Category", "Priority", "Status",
      "Raised By", "Raised By Dept", "Center", "Assigned To",
      "Created At", "First Response At", "Resolved At",
      "Actual TAT (hrs)", "SLA (hrs)", "SLA Status", "Delay (hrs)",
      "Escalation Level", "Escalated At", "Escalated To",
    ];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      csvRows.push([
        r.ticket_id, `"${(r.title || "").replace(/"/g, '""')}"`, r.department || "", r.category || "", r.sub_category || "",
        r.priority || "", r.status || "", r.raised_by || "", r.raised_by_dept || "", r.center || "", r.assigned_to || "",
        r.created_at ? formatDate(r.created_at) : "", r.first_response_at ? formatDate(r.first_response_at) : "",
        r.resolved_at ? formatDate(r.resolved_at) : "",
        r.actual_tat_hours ?? "", r.sla_hours ?? "", r.sla_status, r.delay_hours ?? "",
        escLabel(r.escalation_level), r.escalated_at ? formatDate(r.escalated_at) : "", r.escalated_to || "",
      ].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TAT_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / pageSize);
  const selectClass = "px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">TAT Detail Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Turnaround Time performance & SLA compliance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div><span className="text-2xl font-bold">{total}</span><p className="text-[11px] text-muted-foreground">Total Tickets</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div><span className="text-2xl font-bold text-emerald-600">{withinSla}</span><p className="text-[11px] text-muted-foreground">Within SLA</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div><span className="text-2xl font-bold text-red-600">{breached}</span><p className="text-[11px] text-muted-foreground">Breached</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-sky-500">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-sky-500" />
            <div><span className="text-2xl font-bold">{avgTat != null ? formatHours(avgTat) : "—"}</span><p className="text-[11px] text-muted-foreground">Avg TAT</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow border border-border border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            <div><span className="text-2xl font-bold">{total > 0 ? Math.round((withinSla / total) * 100) : 100}%</span><p className="text-[11px] text-muted-foreground">SLA Compliance</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 bg-card rounded-lg px-3 py-2 card-shadow border border-border">
        <Filter className="h-4 w-4 text-muted-foreground mt-2" />
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass}>
          <option value="All">All Departments</option>
          {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={center} onChange={(e) => setCenter(e.target.value)} className={selectClass}>
          <option value="All">All Centers</option>
          {centerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Escalated to L1">Escalated to L1</option>
          <option value="Escalated to L2">Escalated to L2</option>
        </select>
        <select value={slaStatus} onChange={(e) => setSlaStatus(e.target.value)} className={selectClass}>
          <option value="All">All SLA</option>
          <option value="Within SLA">Within SLA</option>
          <option value="Breached">Breached</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
          <option value="All">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} className={selectClass}>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        {datePreset === "Custom" && (
          <>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={cn(selectClass, "w-[140px]")} />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={cn(selectClass, "w-[140px]")} />
          </>
        )}
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Submit
        </button>
        <button onClick={handleRefresh} className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        <button onClick={handleExport} disabled={rows.length === 0} className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{total} ticket{total !== 1 && "s"} found</p>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-left text-[11px] text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("ticket_id")}>
                    <span className="flex items-center gap-1">Ticket ID <SortIcon col="ticket_id" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold">Title</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("department")}>
                    <span className="flex items-center gap-1">Dept <SortIcon col="department" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("priority")}>
                    <span className="flex items-center gap-1">Priority <SortIcon col="priority" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("status")}>
                    <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold">Raised By</th>
                  <th className="px-3 py-3 font-semibold">Center</th>
                  <th className="px-3 py-3 font-semibold">Assigned To</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("created_at")}>
                    <span className="flex items-center gap-1">Created <SortIcon col="created_at" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold">1st Response</th>
                  <th className="px-3 py-3 font-semibold">Resolved At</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("actual_tat_hours")}>
                    <span className="flex items-center gap-1">TAT <SortIcon col="actual_tat_hours" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("sla_hours")}>
                    <span className="flex items-center gap-1">SLA <SortIcon col="sla_hours" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold">SLA Status</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("delay_hours")}>
                    <span className="flex items-center gap-1">Delay <SortIcon col="delay_hours" /></span>
                  </th>
                  <th className="px-3 py-3 font-semibold">Esc.</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map((r) => {
                  const isBreached = r.sla_status === "Breached";
                  const priColor = r.priority === "Critical" ? "bg-red-100 text-red-700" : r.priority === "High" ? "bg-orange-100 text-orange-700" : r.priority === "Medium" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600";
                  return (
                    <tr key={r.ticket_id} className={cn("border-b border-border hover:bg-muted/20 transition-colors", isBreached && "bg-red-50/50")}>
                      <td className="px-3 py-2.5 font-mono text-xs text-primary font-medium whitespace-nowrap">{r.ticket_id}</td>
                      <td className="px-3 py-2.5 text-xs max-w-[160px] truncate" title={r.title}>{r.title}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{r.department || "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap truncate max-w-[100px]" title={r.category || ""}>{r.category || "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", priColor)}>{r.priority || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium",
                          r.status === "Resolved" || r.status === "Closed" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "Open" ? "bg-blue-100 text-blue-700" :
                          (r.status || "").includes("Escalated") ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        )}>{r.status || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{r.raised_by || "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{r.center || "—"}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{r.assigned_to || "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.created_at)}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.first_response_at)}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.resolved_at)}</td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold", isBreached ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                          {formatHours(r.actual_tat_hours)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center text-muted-foreground whitespace-nowrap">{r.sla_hours != null ? `${r.sla_hours}h` : "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", isBreached ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                          {r.sla_status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center whitespace-nowrap">
                        {r.delay_hours ? <span className="text-red-600 font-semibold">{formatHours(r.delay_hours)}</span> : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center whitespace-nowrap">{escLabel(r.escalation_level)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={17} className="px-4 py-12 text-center text-sm text-muted-foreground">No tickets found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} tickets)</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TATDetailReportPage;
