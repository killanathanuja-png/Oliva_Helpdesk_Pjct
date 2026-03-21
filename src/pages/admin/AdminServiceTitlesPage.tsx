import { useState, useRef, useEffect } from "react";
import { serviceTitles as initialServiceTitles, subcategories as dummySubcategories, categories as dummyCategories } from "@/data/dummyData";
import type { ServiceTitle, Priority } from "@/data/dummyData";
import { serviceTitlesApi, subcategoriesApi, categoriesApi } from "@/lib/api";
import type { ApiServiceTitle, ApiSubcategory, ApiCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

const priorityColor: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-blue-100 text-blue-700",
};

interface ComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}

const ComboBox = ({ value, onChange, options, placeholder }: ComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setSearch("");
    setOpen(false);
  };

  const toggleOpen = () => {
    if (open) {
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
          onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
          placeholder={value || placeholder}
          className="w-full px-3 py-2 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          readOnly={!open}
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
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

function convertApiServiceTitle(api: ApiServiceTitle): ServiceTitle {
  return {
    id: api.code,
    title: api.title,
    category: api.category ?? "",
    subcategory: api.subcategory ?? "",
    priority: (api.priority ?? "Medium") as Priority,
    slaHours: api.sla_hours ?? 0,
    status: (api.status as "Active" | "Inactive") ?? "Active",
  };
}

const AdminServiceTitlesPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<ServiceTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ subcategory: "", serviceTitle: "" });

  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  // API-fetched subcategories and categories
  const [apiSubcategories, setApiSubcategories] = useState<ApiSubcategory[]>([]);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [titles, subs, cats] = await Promise.all([
          serviceTitlesApi.list().catch(() => null),
          subcategoriesApi.list().catch(() => null),
          categoriesApi.list().catch(() => null),
        ]);

        if (titles && titles.length > 0) {
          setData(titles.map(convertApiServiceTitle));
          const map: Record<string, number> = {};
          titles.forEach((t) => { map[t.code] = t.id; });
          setIdMap(map);
        } else {
          setData([...initialServiceTitles]);
        }

        if (subs && subs.length > 0) {
          setApiSubcategories(subs);
        } else {
          setApiSubcategories(
            dummySubcategories.map((s, i) => ({
              id: i,
              code: s.id,
              name: s.name,
              category: s.category,
              service_title_count: 0,
              status: "Active",
              created_at: null,
            }))
          );
        }

        if (cats && cats.length > 0) {
          setApiCategories(cats);
        } else {
          setApiCategories(
            dummyCategories.map((c, i) => ({
              id: i,
              code: c.id,
              name: c.name,
              description: null,
              department: c.department,
              subcategory_count: 0,
              status: "Active",
              created_at: null,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.subcategory) missing.push("Subcategory");
    if (!form.serviceTitle) missing.push("Service Title");
    if (missing.length > 0) { setFormError(`Please fill: ${missing.join(", ")}`); return; }
    setFormError("");
    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await serviceTitlesApi.update(numericId, { title: form.serviceTitle, subcategory: form.subcategory });
          setData((prev) => prev.map((s) => s.id === editingId ? convertApiServiceTitle(updated) : s));
          showToast("Service Title updated successfully");
        } catch {
          showToast("Failed to update Service Title", "error");
          setData((prev) => prev.map((s) => s.id === editingId ? { ...s, title: form.serviceTitle, subcategory: form.subcategory } : s));
        }
      } else {
        setData((prev) => prev.map((s) => s.id === editingId ? { ...s, title: form.serviceTitle, subcategory: form.subcategory } : s));
      }
    } else {
      // New service title - persist via API
      try {
        const created = await serviceTitlesApi.create({
          title: form.serviceTitle,
          subcategory: form.subcategory,
        });
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, convertApiServiceTitle(created)]);
        showToast("Service Title created successfully");
      } catch {
        showToast("Failed to create Service Title", "error");
        // Fallback to local add on error
        const newId = `SVC${String(data.length + 1).padStart(3, "0")}`;
        setData((prev) => [
          ...prev,
          {
            id: newId,
            title: form.serviceTitle,
            category: "",
            subcategory: form.subcategory,
            priority: "Medium" as Priority,
            slaHours: 0,
            status: "Active" as const,
          },
        ]);
      }
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ subcategory: "", serviceTitle: "" });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ subcategory: "", serviceTitle: "" });
  };

  const handleEdit = (s: ServiceTitle) => {
    setEditingId(s.id);
    setForm({ subcategory: s.subcategory, serviceTitle: s.title });
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        await serviceTitlesApi.updateStatus(numericId, "Inactive");
      } catch { /* fall through to local update */ }
    }
    setData((prev) => prev.map((s) => s.id === deleteConfirm ? { ...s, status: "Inactive" } : s));
    showToast("Service Title deleted successfully");
    setDeleteConfirm(null);
  };

  // Subcategory options from API-fetched data
  const subcategoryOptions = apiSubcategories.map((s) => s.name);
  const serviceTitleOptions = data
    .filter((s) => !form.subcategory || s.subcategory === form.subcategory)
    .map((s) => s.title);

  // Build categoryDeptMap from API-fetched categories
  const categoryDeptMap: Record<string, string> = {};
  apiCategories.forEach((c) => { categoryDeptMap[c.name] = c.department ?? ""; });

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
        <h1 className="text-xl font-bold font-display">Service Title Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const exportData = data.map((s) => ({
                "Code": s.id,
                "Service Title": s.title,
                "Category": s.category,
                "Subcategory": s.subcategory,
                "Priority": s.priority,
                "SLA Hours": s.slaHours,
                "Status": s.status,
              }));
              exportToExcel(exportData, "ServiceTitles", "Service Titles");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ subcategory: "", serviceTitle: "" }); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Service Title
          </button>
        </div>
      </div>
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Department</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Subcategory</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">SLA (hrs)</th>
              <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.filter((s) => s.status !== "Inactive").map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{categoryDeptMap[s.category] || "\u2014"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.subcategory}</td>
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColor[s.priority]}`}>{s.priority}</span>
                </td>
                <td className="px-4 py-3 font-medium">{s.slaHours}h</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(s.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Service Title Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Service Title" : "Add Service Title"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subcategory <span className="text-destructive">*</span></label>
                <ComboBox
                  value={form.subcategory}
                  onChange={(val) => setForm({ ...form, subcategory: val, serviceTitle: "" })}
                  options={subcategoryOptions}
                  placeholder="Select subcategory"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Service Title <span className="text-destructive">*</span></label>
                <ComboBox
                  value={form.serviceTitle}
                  onChange={(val) => setForm({ ...form, serviceTitle: val })}
                  options={serviceTitleOptions}
                  placeholder="Select service title"
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
                {editingId ? "Update Service Title" : "Create Service Title"}
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
                <h3 className="font-semibold">Delete Service Title</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this service title?</p>
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

export default AdminServiceTitlesPage;
