import { useState, useEffect } from "react";
import { roles as initialRoles } from "@/data/dummyData";
import { rolesApi, ApiRole } from "@/lib/api";
import { ShieldCheck, Users, X, Loader2, Pencil, Trash2, AlertTriangle, Download, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

interface LocalRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: "Active" | "Inactive";
}

const toLocal = (r: ApiRole): LocalRole => ({
  id: r.code,
  name: r.name,
  description: r.description ?? "",
  userCount: r.user_count,
  permissions: r.permissions,
  status: (r.status as "Active" | "Inactive") ?? "Active",
});

const CDD_ROLES = ["CDD", "CDD Admin"];
const ADMIN_DEPT_ROLES = ["Admin", "Helpdesk", "Admin Department"];

const AdminRolesPage = () => {
  const { showToast } = useToast();
  const _storedUser = localStorage.getItem("oliva_user");
  const _parsedUser = _storedUser ? JSON.parse(_storedUser) : null;
  const _userRole = _parsedUser?.role || "";
  const _isCddAdmin = _userRole.toLowerCase().includes("cdd admin");
  const _isAdminDept = _userRole.toLowerCase().includes("admin department");

  const [data, setData] = useState<LocalRole[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    rolesApi
      .list()
      .then((roles) => {
        if (!cancelled) {
          let filtered = roles;
          if (_isAdminDept) {
            filtered = roles.filter((r) => ADMIN_DEPT_ROLES.some((ar) => r.name.toLowerCase().includes(ar.toLowerCase())));
          } else if (_isCddAdmin) {
            filtered = roles.filter((r) => CDD_ROLES.some((cr) => r.name.toLowerCase().includes(cr.toLowerCase())));
          }
          if (filtered.length > 0) {
            setData(filtered.map(toLocal));
            const map: Record<string, number> = {};
            filtered.forEach((r) => { map[r.code] = r.id; });
            setIdMap(map);
          } else {
            setData(initialRoles.map((r) => ({ ...r, status: "Active" as const })));
          }
        }
      })
      .catch(() => {
        if (!cancelled) setData(initialRoles.map((r) => ({ ...r, status: "Active" as const })));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("Role Name");
    if (!form.description.trim()) missing.push("Description");
    if (missing.length > 0) { setFormError(`Please fill: ${missing.join(", ")}`); return; }
    setFormError("");
    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await rolesApi.update(numericId, { name: form.name.trim(), description: form.description.trim() });
          setData((prev) => prev.map((r) => r.id === editingId ? toLocal(updated) : r));
          showToast("Role updated successfully");
        } catch {
          showToast("Failed to update Role", "error");
          setData((prev) => prev.map((r) => r.id === editingId ? { ...r, name: form.name.trim(), description: form.description.trim() } : r));
        }
      } else {
        setData((prev) => prev.map((r) => r.id === editingId ? { ...r, name: form.name.trim(), description: form.description.trim() } : r));
      }
    } else {
      try {
        const created = await rolesApi.create({
          name: form.name.trim(),
          description: form.description.trim(),
        });
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, toLocal(created)]);
        showToast("Role created successfully");
      } catch {
        showToast("Failed to create Role", "error");
        const newRole: LocalRole = {
          id: `R${String(data.length + 1).padStart(3, "0")}`,
          name: form.name.trim(),
          description: form.description.trim(),
          userCount: 0,
          permissions: [],
          status: "Active",
        };
        setData((prev) => [...prev, newRole]);
      }
    }
    setForm({ name: "", description: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleCancel = () => {
    setForm({ name: "", description: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (r: LocalRole) => {
    setEditingId(r.id);
    setForm({ name: r.name, description: r.description });
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        await rolesApi.updateStatus(numericId, "Inactive");
      } catch { /* fall through to local update */ }
    }
    setData((prev) => prev.map((r) => r.id === deleteConfirm ? { ...r, status: "Inactive" } : r));
    showToast("Role deleted successfully");
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
          <h1 className="text-xl font-bold font-display">Role Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = data.map((r) => ({
                "Code": r.id,
                "Role Name": r.name,
                "Description": r.description,
                "User Count": r.userCount,
                "Permissions": r.permissions.join(", "),
                "Status": r.status,
              }));
              exportToExcel(exportData, "Roles", "Roles");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ name: "", description: "" }); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Role
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.filter((r) => r.status !== "Inactive").map((r) => (
          <div key={r.id} className="bg-card rounded-xl p-5 card-shadow border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {r.userCount} users
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(r)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(r.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{r.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {r.permissions.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Role" : "Add Role"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter role name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description <span className="text-destructive">*</span></label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter role description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
            {formError && (
              <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>
            )}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
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
                <h3 className="font-semibold">Delete Role</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this role?</p>
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

export default AdminRolesPage;
