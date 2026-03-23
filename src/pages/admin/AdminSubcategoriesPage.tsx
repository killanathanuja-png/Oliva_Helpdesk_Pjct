import { useState, useRef, useEffect } from "react";
import { subcategories as initialSubcategories } from "@/data/dummyData";
import type { Subcategory } from "@/data/dummyData";
import { subcategoriesApi, categoriesApi } from "@/lib/api";
import type { ApiSubcategory, ApiCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download, Search, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

const MODULE_OPTIONS = ["Feedback", "Helpdesk", "Zenoti"];

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
        if (allowCreate && open && search.trim()) onChange(search.trim());
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, search, allowCreate, onChange]);

  const handleSelect = (item: string) => { onChange(item); setSearch(""); setOpen(false); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (!open) setOpen(true);
    if (allowCreate) onChange(val);
  };
  const toggleOpen = () => {
    if (open) {
      if (allowCreate && search.trim()) onChange(search.trim());
      setOpen(false); setSearch("");
    } else { setOpen(true); setSearch(""); }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative cursor-pointer" onClick={toggleOpen}>
        <input type="text" value={open ? search : value} onChange={handleInputChange}
          placeholder={value || placeholder}
          className="w-full px-3 py-2 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          readOnly={!open && !allowCreate} />
        <svg className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((item) => (
            <button key={item} type="button" onClick={() => handleSelect(item)}
              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors", item === value && "bg-primary/10 text-primary font-medium")}>
              {item}
            </button>
          )) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {allowCreate && search.trim() ? <span>Click away to create &quot;<strong>{search.trim()}</strong>&quot;</span> : "No results found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface LocalSubcategory extends Subcategory {
  module: string;
}

function toLocalSubcategory(api: ApiSubcategory): LocalSubcategory {
  return {
    id: api.code,
    name: api.name,
    category: api.category ?? "",
    module: api.module ?? "",
    serviceTitleCount: api.service_title_count,
    status: (api.status as "Active" | "Inactive") ?? "Active",
  };
}

const emptyForm = { subCategoryCode: "", subcategory: "", category: "", module: "" };

const AdminSubcategoriesPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<LocalSubcategory[]>([]);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apiSubs, apiCats] = await Promise.all([
          subcategoriesApi.list(),
          categoriesApi.list(),
        ]);
        if (apiSubs.length > 0) {
          setData(apiSubs.map(toLocalSubcategory));
          const map: Record<string, number> = {};
          apiSubs.forEach((s) => { map[s.code] = s.id; });
          setIdMap(map);
        } else {
          setData(initialSubcategories.map((s) => ({ ...s, module: "" })));
        }
        setApiCategories(apiCats);
      } catch {
        setData(initialSubcategories.map((s) => ({ ...s, module: "" })));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryOptions = apiCategories.filter((c) => c.status !== "Inactive").map((c) => c.name);

  // When category is selected, auto-fill module from the category
  const handleCategoryChange = (val: string) => {
    const cat = apiCategories.find((c) => c.name === val);
    setForm({ ...form, category: val, module: cat?.module ?? form.module });
  };

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.subcategory) missing.push("Sub Category Name");
    if (!form.category) missing.push("Main Category");
    if (missing.length > 0) { setFormError(`Please fill: ${missing.join(", ")}`); return; }
    setFormError("");

    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await subcategoriesApi.update(numericId, { name: form.subcategory, category: form.category });
          setData((prev) => prev.map((s) => s.id === editingId ? toLocalSubcategory(updated) : s));
          showToast("Subcategory updated successfully");
        } catch {
          showToast("Failed to update Subcategory", "error");
        }
      }
    } else {
      try {
        const created = await subcategoriesApi.create({ name: form.subcategory, category: form.category });
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, toLocalSubcategory(created)]);
        showToast("Subcategory created successfully");
      } catch {
        showToast("Failed to create Subcategory", "error");
        const newSub: LocalSubcategory = {
          id: `SUB${String(data.length + 1).padStart(3, "0")}`,
          name: form.subcategory,
          category: form.category,
          module: form.module,
          serviceTitleCount: 0,
          status: "Active",
        };
        setData((prev) => [...prev, newSub]);
      }
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError("");
  };

  const handleEdit = (s: LocalSubcategory) => {
    setEditingId(s.id);
    setForm({ subCategoryCode: s.id, subcategory: s.name, category: s.category, module: s.module });
    setFormError("");
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        await subcategoriesApi.updateStatus(numericId, "Inactive");
      } catch { /* fall through */ }
    }
    setData((prev) => prev.map((s) => s.id === deleteConfirm ? { ...s, status: "Inactive" as const } : s));
    showToast("Subcategory deleted successfully");
    setDeleteConfirm(null);
  };

  const activeData = data.filter((s) => s.status !== "Inactive");
  const filteredData = search.trim()
    ? activeData.filter((s) => {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.module.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
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
            <h1 className="text-xl font-bold font-display">Subcategory Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Total: <span className="font-semibold text-foreground">{activeData.length}</span></p>
          </div>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, module..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = activeData.map((s) => ({
                "Sub Category Code": s.id,
                "Sub Category Name": s.name,
                "Main Category": s.category,
                "Module": s.module,
                "Status": s.status,
              }));
              exportToExcel(exportData, "Subcategories", "Subcategories");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setFormError(""); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Subcategory
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap">
              <th className="px-4 py-3 font-semibold">Sub Category Code</th>
              <th className="px-4 py-3 font-semibold">Sub Category Name</th>
              <th className="px-4 py-3 font-semibold">Main Category</th>
              <th className="px-4 py-3 font-semibold">Module</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{s.id}</td>
                <td className="px-4 py-3 text-xs font-medium">{s.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{s.category}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{s.module || ""}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(s)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Subcategory Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Subcategory" : "Add Subcategory"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sub Category Code</label>
                <input type="text" value={form.subCategoryCode} onChange={(e) => setForm({ ...form, subCategoryCode: e.target.value })} placeholder="e.g. SUB001"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sub Category Name <span className="text-destructive">*</span></label>
                <ComboBox value={form.subcategory} onChange={(val) => setForm({ ...form, subcategory: val })} options={[]} placeholder="Type subcategory name" allowCreate />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Main Category <span className="text-destructive">*</span></label>
                <ComboBox value={form.category} onChange={handleCategoryChange} options={categoryOptions} placeholder="Select main category" allowCreate />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Module</label>
                <ComboBox value={form.module} onChange={(val) => setForm({ ...form, module: val })} options={MODULE_OPTIONS} placeholder="Select module" allowCreate />
              </div>
            </div>
            {formError && (
              <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>
            )}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                {editingId ? "Update Subcategory" : "Create Subcategory"}
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
                <h3 className="font-semibold">Delete Subcategory</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this subcategory?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSoftDelete} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubcategoriesPage;
