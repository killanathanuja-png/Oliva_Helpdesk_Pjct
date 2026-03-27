import { useState, useEffect } from "react";
import { slaApi, departmentsApi } from "@/lib/api";
import type { ApiSLAConfig, ApiDepartment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, X, Trash2, AlertTriangle, Download, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

const priorityColors: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive",
  High: "bg-warning/10 text-warning",
  Medium: "bg-info/10 text-info",
  Low: "bg-muted text-muted-foreground",
};

const priorities = ["Critical", "High", "Medium", "Low"];

const AdminSLAPage = () => {
  const { showToast } = useToast();
  const [configs, setConfigs] = useState<ApiSLAConfig[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState({
    department: "",
    priority: "Medium",
    response_time_hrs: 4,
    resolution_time_hrs: 24,
    escalation_level1_hrs: 8,
    escalation_level2_hrs: 24,
    active: true,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([slaApi.list(), departmentsApi.list()])
      .then(([slaData, deptData]) => {
        setConfigs(slaData);
        setDepartments(deptData.filter((d) => d.status === "Active"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      department: "",
      priority: "Medium",
      response_time_hrs: 4,
      resolution_time_hrs: 24,
      escalation_level1_hrs: 8,
      escalation_level2_hrs: 24,
      active: true,
    });
    setFormError("");
  };

  const handleAdd = async () => {
    if (!form.priority) {
      setFormError("Priority is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await slaApi.create({
        department: form.department || undefined,
        priority: form.priority,
        response_time_hrs: form.response_time_hrs,
        resolution_time_hrs: form.resolution_time_hrs,
        escalation_level1_hrs: form.escalation_level1_hrs,
        escalation_level2_hrs: form.escalation_level2_hrs,
        active: form.active,
      });
      setShowModal(false);
      resetForm();
      fetchData();
      showToast("SLA Config created successfully");
    } catch (e: any) {
      setFormError(e.message || "Failed to create SLA rule");
      showToast("Failed to create SLA Config", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await slaApi.delete(deleteConfirm);
      fetchData();
      showToast("SLA Config deleted successfully");
    } catch {
      showToast("Failed to delete SLA Config", "error");
      // ignore
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="text-xl font-bold font-display">SLA Configuration</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = configs.map((s) => ({
                "Department": s.department || "All",
                "Priority": s.priority,
                "Response Time (hrs)": s.response_time_hrs ?? "-",
                "Resolution Time (hrs)": s.resolution_time_hrs ?? "-",
                "Escalation L1 (hrs)": s.escalation_level1_hrs ?? "-",
                "Escalation L2 (hrs)": s.escalation_level2_hrs ?? "-",
              }));
              exportToExcel(exportData, "SLA_Configuration", "SLA Config");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add SLA Rule
          </button>
        </div>
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
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.length > 0 ? configs.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-xs">{s.department || "All"}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", priorityColors[s.priority])}>
                    {s.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{s.response_time_hrs ?? "-"}h</td>
                <td className="px-4 py-3 text-xs">{s.resolution_time_hrs ?? "-"}h</td>
                <td className="px-4 py-3 text-xs">{s.escalation_level1_hrs ?? "-"}h</td>
                <td className="px-4 py-3 text-xs">{s.escalation_level2_hrs ?? "-"}h</td>
                <td className="px-4 py-3">
                  <button onClick={() => setDeleteConfirm(s.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No SLA rules configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-sm mx-4 p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Delete SLA Rule</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this SLA rule?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SLA Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-lg mx-4 card-shadow border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold font-display">Add SLA Rule</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{formError}</div>
              )}

              {/* Department */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority *</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Time fields - 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Response Time (hrs)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.response_time_hrs}
                    onChange={(e) => setForm({ ...form, response_time_hrs: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Resolution Time (hrs)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.resolution_time_hrs}
                    onChange={(e) => setForm({ ...form, resolution_time_hrs: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Escalation L1 (hrs)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.escalation_level1_hrs}
                    onChange={(e) => setForm({ ...form, escalation_level1_hrs: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Escalation L2 (hrs)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.escalation_level2_hrs}
                    onChange={(e) => setForm({ ...form, escalation_level2_hrs: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    form.active ? "bg-success" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                      form.active ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-xs">{form.active ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSLAPage;
