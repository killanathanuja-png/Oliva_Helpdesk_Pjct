import { useState, useEffect } from "react";
import { departments as fallbackDepartments } from "@/data/dummyData";
import type { Department } from "@/data/dummyData";
import { departmentsApi } from "@/lib/api";
import type { ApiDepartment } from "@/lib/api";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

const apiToDepartment = (d: ApiDepartment): Department & { status: "Active" | "Inactive" } => ({
  id: d.code,
  name: d.name,
  head: d.head || "",
  slaHours: d.sla_hours || 24,
  centerCount: d.center_count,
  activeTickets: d.active_tickets,
  status: (d.status as "Active" | "Inactive") ?? "Active",
});

type DeptWithStatus = Department & { status: "Active" | "Inactive" };

const AdminDepartmentsPage = () => {
  const { showToast } = useToast();
  const _storedUser = localStorage.getItem("oliva_user");
  const _parsedUser = _storedUser ? JSON.parse(_storedUser) : null;
  const _userDept = _parsedUser?.department || "";
  const _userRole = _parsedUser?.role || "";
  const _isDeptFiltered = _userDept.toLowerCase().includes("quality") || _userRole.toLowerCase().includes("zenoti team manager");
  const [data, setData] = useState<DeptWithStatus[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", head: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    departmentsApi.list()
      .then((res) => {
        let filtered = res;
        if (_isDeptFiltered) {
          filtered = res.filter((d) => d.name.toLowerCase().includes(_userDept.toLowerCase().split(" ")[0]));
        }
        if (filtered.length > 0) {
          setData(filtered.map(apiToDepartment));
          const map: Record<string, number> = {};
          res.forEach((d) => { map[d.code] = d.id; });
          setIdMap(map);
        } else {
          setData(fallbackDepartments.map((d) => ({ ...d, status: "Active" as const })));
        }
      })
      .catch(() => setData(fallbackDepartments.map((d) => ({ ...d, status: "Active" as const }))))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Department Name is required."); return; }
    setFormError("");
    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await departmentsApi.update(numericId, { name: form.name.trim(), head: form.head.trim() });
          setData((prev) => prev.map((d) => d.id === editingId ? apiToDepartment(updated) : d));
          showToast("Department updated successfully");
        } catch {
          showToast("Failed to update Department", "error");
          setData((prev) => prev.map((d) => d.id === editingId ? { ...d, name: form.name.trim(), head: form.head.trim() } : d));
        }
      } else {
        setData((prev) => prev.map((d) => d.id === editingId ? { ...d, name: form.name.trim(), head: form.head.trim() } : d));
      }
    } else {
      try {
        const created = await departmentsApi.create({ name: form.name.trim(), head: form.head.trim() });
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, apiToDepartment(created)]);
        showToast("Department created successfully");
      } catch {
        showToast("Failed to create Department", "error");
        const newDept: DeptWithStatus = {
          id: `D${String(data.length + 1).padStart(3, "0")}`,
          name: form.name.trim(),
          head: form.head.trim(),
          slaHours: 24,
          centerCount: 0,
          activeTickets: 0,
          status: "Active",
        };
        setData((prev) => [...prev, newDept]);
      }
    }
    setForm({ name: "", head: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleCancel = () => {
    setForm({ name: "", head: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (d: DeptWithStatus) => {
    setEditingId(d.id);
    setForm({ name: d.name, head: d.head });
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        await departmentsApi.updateStatus(numericId, "Inactive");
      } catch { /* fall through to local update */ }
    }
    setData((prev) => prev.map((d) => d.id === deleteConfirm ? { ...d, status: "Inactive" } : d));
    showToast("Department deleted successfully");
    setDeleteConfirm(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back"><ArrowLeft className="h-4 w-4" /></button>
          <h1 className="text-xl font-bold font-display">Department Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = data.filter((d) => d.status !== "Inactive").map((d) => ({
                "Code": d.id,
                "Department Name": d.name,
                "Head": d.head,
                "SLA Hours": d.slaHours,
                "Active Tickets": d.activeTickets,
                "Status": d.status,
              }));
              exportToExcel(exportData, "Departments", "Departments");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ name: "", head: "" }); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Department
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.filter((d) => d.status !== "Inactive").map((d) => (
          <div key={d.id} className="bg-card rounded-xl p-5 card-shadow border border-border hover:elevated-shadow transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{d.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(d)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(d.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-mono text-muted-foreground ml-1">{d.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Department" : "Add Department"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter department name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Head</label>
                <input
                  type="text"
                  required
                  value={form.head}
                  onChange={(e) => setForm({ ...form, head: e.target.value })}
                  placeholder="Enter department head"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {formError && (
              <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>
            )}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-sm mx-4 p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Delete Department</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this department?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSoftDelete} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartmentsPage;
