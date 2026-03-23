import { useState, useRef, useEffect } from "react";
import { loginHistoryApi } from "@/lib/api";
import type { ApiLoginHistory, ApiEmployeeOption } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, Download, Search, Calendar, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";

const LoginHistoryPage = () => {
  const [employees, setEmployees] = useState<ApiEmployeeOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<ApiEmployeeOption | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<ApiLoginHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Employee search dropdown
  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const empRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loginHistoryApi.employees()
      .then(setEmployees)
      .catch(() => {})
      .finally(() => setLoadingEmployees(false));

    // Default date range: last 30 days
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(now.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (empRef.current && !empRef.current.contains(e.target as Node)) {
        setEmpOpen(false);
        setEmpSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredEmployees = empSearch
    ? employees.filter((e) => e.label.toLowerCase().includes(empSearch.toLowerCase()) || e.name.toLowerCase().includes(empSearch.toLowerCase()))
    : employees;

  const handleSubmit = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      const result = await loginHistoryApi.list({
        user_id: selectedEmployee.id,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setData(result);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dt: string | null) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Login History Report</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track employee login and logout activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSubmit} disabled={!selectedEmployee || loading}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50" title="Refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
          </button>
          <button
            onClick={() => {
              if (data.length === 0) return;
              const exportData = data.map((r) => ({
                "Name": `${r.employee_id || ""}/${r.name}`,
                "Email": r.email,
                "Login Time": r.login_time ? formatDateTime(r.login_time) : "",
                "Logout Time": r.logout_time ? formatDateTime(r.logout_time) : "",
                "Duration (HH:MM)": r.duration || "",
                "Role": r.role || "",
                "Module": r.module || "",
                "Location": r.location || "",
                "Login Source": r.login_source || "",
                "Remarks": r.remarks || "",
              }));
              exportToExcel(exportData, "LoginHistory", "LoginHistory");
            }}
            disabled={data.length === 0}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl card-shadow border border-border p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Select Employee <span className="text-destructive">*</span></label>
            <div className="relative" ref={empRef}>
              <div className="relative cursor-pointer" onClick={() => { setEmpOpen(!empOpen); setEmpSearch(""); }}>
                <input
                  type="text"
                  value={empOpen ? empSearch : (selectedEmployee?.label || "")}
                  onChange={(e) => { setEmpSearch(e.target.value); if (!empOpen) setEmpOpen(true); }}
                  placeholder={loadingEmployees ? "Loading..." : "Search employee..."}
                  className="w-full px-3 py-2.5 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  readOnly={!empOpen}
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {empOpen && (
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => { setSelectedEmployee(emp); setEmpOpen(false); setEmpSearch(""); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors",
                        selectedEmployee?.id === emp.id && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {emp.label}
                    </button>
                  )) : (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">No employees found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">From Date <span className="text-destructive">*</span></label>
            <div className="relative">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">To Date <span className="text-destructive">*</span></label>
            <div className="relative">
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Submit */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={!selectedEmployee || loading}
              className="w-full px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {data.length > 0 && (
        <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">
              Results: <span className="text-primary">{data.length}</span> records
            </h2>
            <button
              onClick={() => {
                const exportData = data.map((r) => ({
                  "Name": `${r.employee_id || ""}/${r.name}`,
                  "Email": r.email,
                  "Login Time": r.login_time ? formatDateTime(r.login_time) : "",
                  "Logout Time": r.logout_time ? formatDateTime(r.logout_time) : "",
                  "Duration (HH:MM)": r.duration || "",
                  "Role": r.role || "",
                  "Module": r.module || "",
                  "Location": r.location || "",
                  "Login Source": r.login_source || "",
                  "Remarks": r.remarks || "",
                }));
                exportToExcel(exportData, "LoginHistory", "LoginHistory");
              }}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Login Time</th>
                  <th className="px-4 py-3 font-semibold">Logout Time</th>
                  <th className="px-4 py-3 font-semibold">Duration (HH:MM)</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Module</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Login Source</th>
                  <th className="px-4 py-3 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-medium">{r.employee_id || ""}/{r.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(r.login_time)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(r.logout_time)}</td>
                    <td className="px-4 py-3 text-xs font-medium text-center">{r.duration || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.role || ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.module || ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.location || ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.login_source || ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.remarks || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && data.length === 0 && selectedEmployee && (
        <div className="bg-card rounded-2xl card-shadow border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No login history found for the selected employee and date range.</p>
        </div>
      )}
    </div>
  );
};

export default LoginHistoryPage;
