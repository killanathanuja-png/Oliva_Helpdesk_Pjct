import { useState, useRef, useEffect } from "react";
import { categories as initialCategories } from "@/data/dummyData";
import type { Category } from "@/data/dummyData";
import { categoriesApi } from "@/lib/api";
import type { ApiCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download, Search, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

const MODULE_OPTIONS = [
  "Feedback",
  "Helpdesk",
  "Zenoti",
];

interface ComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  allowCreate?: boolean;
}

const ComboBox = ({ value, onChange, options, placeholder, allowCreate }: ComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (allowCreate && open && search.trim()) {
          onChange(search.trim());
        }
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, search, allowCreate, onChange]);

  const handleSelect = (item: string) => {
    onChange(item);
    setSearch("");
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (!open) setOpen(true);
    if (allowCreate) onChange(val);
  };

  const toggleOpen = () => {
    if (open) {
      if (allowCreate && search.trim()) onChange(search.trim());
      setOpen(false);
      setSearch("");
    } else {
      setOpen(true);
      setSearch("");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative cursor-pointer" onClick={toggleOpen}>
        <input
          type="text"
          value={open ? search : value}
          onChange={handleInputChange}
          placeholder={value || placeholder}
          className="w-full px-3 py-2 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          readOnly={!open && !allowCreate}
        />
        <svg className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSelect(item)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors",
                item === value && "bg-primary/10 text-primary font-medium"
              )}
            >
              {item}
            </button>
          )) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {allowCreate && search.trim() ? (
                <span>Press Enter or click away to create &quot;<strong>{search.trim()}</strong>&quot;</span>
              ) : (
                "No results found"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface LocalCategory extends Category {
  module: string;
}

function apiCategoryToLocal(ac: ApiCategory): LocalCategory {
  return {
    id: ac.code,
    name: ac.name,
    module: ac.module ?? "",
    department: ac.department ?? "",
    description: ac.description ?? "",
    subcategoryCount: ac.subcategory_count,
    status: (ac.status === "Inactive" ? "Inactive" : "Active") as "Active" | "Inactive",
  };
}

const AdminCategoriesPage = () => {
  const { showToast } = useToast();
  const _storedUser = localStorage.getItem("oliva_user");
  const _parsedUser = _storedUser ? JSON.parse(_storedUser) : null;
  const _userDept = _parsedUser?.department || "";
  const _userRole = _parsedUser?.role || "";
  const _isDeptFiltered = _userDept.toLowerCase().includes("quality") || _userRole.toLowerCase().includes("zenoti team manager");
  const [data, setData] = useState<LocalCategory[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ categoryCode: "", category: "", module: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let apiCategories = await categoriesApi.list().catch(() => null);
        if (_isDeptFiltered && apiCategories) {
          const deptKey = _userDept.toLowerCase().split(" ")[0];
          apiCategories = apiCategories.filter((c) => (c.department || "").toLowerCase().includes(deptKey));
        }
        if (apiCategories && apiCategories.length > 0) {
          setData(apiCategories.map(apiCategoryToLocal));
          const map: Record<string, number> = {};
          apiCategories.forEach((c) => { map[c.code] = c.id; });
          setIdMap(map);
        } else {
          setData(initialCategories.map((c) => ({ ...c, module: "" })));
        }
      } catch {
        setData(initialCategories.map((c) => ({ ...c, module: "" })));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.category) missing.push("Main Category Name");
    if (missing.length > 0) { setFormError(`Please fill: ${missing.join(", ")}`); return; }
    setFormError("");
    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await categoriesApi.update(numericId, { name: form.category, module: form.module });
          setData((prev) => prev.map((c) => c.id === editingId ? apiCategoryToLocal(updated) : c));
          showToast("Category updated successfully");
        } catch {
          showToast("Failed to update Category", "error");
          setData((prev) => prev.map((c) => c.id === editingId ? { ...c, name: form.category, module: form.module } : c));
        }
      }
    } else {
      try {
        const created = await categoriesApi.create({ name: form.category, module: form.module });
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, apiCategoryToLocal(created)]);
        showToast("Category created successfully");
      } catch {
        showToast("Failed to create Category", "error");
        const newCat: LocalCategory = {
          id: `CAT-${String(data.length + 1).padStart(3, "0")}`,
          name: form.category,
          module: form.module,
          department: "",
          description: "",
          subcategoryCount: 0,
          status: "Active",
        };
        setData((prev) => [...prev, newCat]);
      }
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ categoryCode: "", category: "", module: "" });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ categoryCode: "", category: "", module: "" });
    setFormError("");
  };

  const handleEdit = (c: LocalCategory) => {
    setEditingId(c.id);
    setForm({ categoryCode: c.id, category: c.name, module: c.module });
    setFormError("");
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        await categoriesApi.updateStatus(numericId, "Inactive");
      } catch { /* fall through */ }
    }
    setData((prev) => prev.map((c) => c.id === deleteConfirm ? { ...c, status: "Inactive" as const } : c));
    showToast("Category deleted successfully");
    setDeleteConfirm(null);
  };

  const activeData = data.filter((c) => c.status !== "Inactive");
  const filteredData = search.trim()
    ? activeData.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.module.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      })
    : activeData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-xl font-bold font-display">Category Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Total Categories: <span className="font-semibold text-foreground">{activeData.length}</span></p>
          </div>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, module, code..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = activeData.map((c) => ({
                "Main Category Code": c.id,
                "Main Category Name": c.name,
                "Module": c.module,
                "Status": c.status,
              }));
              exportToExcel(exportData, "Categories", "Categories");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ categoryCode: "", category: "", module: "" }); setFormError(""); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Category
          </button>
        </div>
      </div>
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap">
              <th className="px-4 py-3 font-semibold">Main Category Code</th>
              <th className="px-4 py-3 font-semibold">Main Category Name</th>
              <th className="px-4 py-3 font-semibold">Module</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{c.id}</td>
                <td className="px-4 py-3 text-xs font-medium">{c.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.module || ""}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Category" : "Add Category"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Main Category Code</label>
                <input type="text" value={form.categoryCode} onChange={(e) => setForm({ ...form, categoryCode: e.target.value })} placeholder="e.g. CAT001"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Main Category Name <span className="text-destructive">*</span></label>
                <ComboBox
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  options={data.filter((c) => c.status !== "Inactive").map((c) => c.name)}
                  placeholder="Type or select category name"
                  allowCreate
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Module</label>
                <ComboBox
                  value={form.module}
                  onChange={(val) => setForm({ ...form, module: val })}
                  options={MODULE_OPTIONS}
                  placeholder="Type or select module"
                  allowCreate
                />
              </div>
            </div>
            {formError && (
              <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>
            )}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                {editingId ? "Update Category" : "Create Category"}
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
                <h3 className="font-semibold">Delete Category</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this category?</p>
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

export default AdminCategoriesPage;
