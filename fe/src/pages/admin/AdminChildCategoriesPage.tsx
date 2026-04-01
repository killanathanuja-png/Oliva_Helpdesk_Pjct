import { useState, useRef, useEffect } from "react";
import { childCategoriesApi, subcategoriesApi, categoriesApi, adminMastersApi } from "@/lib/api";
import type { ApiChildCategory, ApiSubcategory, ApiCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download, Search, Upload, ArrowLeft, RefreshCw } from "lucide-react";
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
  const filtered = search ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (allowCreate && open && search.trim()) onChange(search.trim());
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, search, allowCreate, onChange]);

  const handleSelect = (item: string) => { onChange(item); setSearch(""); setOpen(false); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value); if (!open) setOpen(true); if (allowCreate) onChange(e.target.value);
  };
  const toggleOpen = () => {
    if (open) { if (allowCreate && search.trim()) onChange(search.trim()); setOpen(false); setSearch(""); }
    else { setOpen(true); setSearch(""); }
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

interface LocalChildCategory {
  id: string;
  name: string;
  subcategory: string;
  category: string;
  module: string;
  status: "Active" | "Inactive";
}

function toLocal(api: ApiChildCategory): LocalChildCategory {
  return {
    id: api.code,
    name: api.name,
    subcategory: api.subcategory ?? "",
    category: api.category ?? "",
    module: api.module ?? "",
    status: (api.status as "Active" | "Inactive") ?? "Active",
  };
}

const emptyForm = { childCode: "", childName: "", subcategory: "", category: "", module: "" };

const AdminChildCategoriesPage = () => {
  const { showToast } = useToast();
  const _storedUser = localStorage.getItem("oliva_user");
  const _parsedUser = _storedUser ? JSON.parse(_storedUser) : null;
  const _userRole = _parsedUser?.role || "";
  const _isAdminDept = _userRole.toLowerCase().includes("admin department");
  const [data, setData] = useState<LocalChildCategory[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (_isAdminDept) {
          // Admin Department: fetch sub-categories from admin_main_categories
          const mainCats = await adminMastersApi.listMainCategories().catch(() => []);
          const localData: LocalChildCategory[] = [];
          const map: Record<string, number> = {};
          const subOpts: string[] = [];
          const catOpts: string[] = [];
          mainCats.forEach((mc) => {
            (mc.modules || []).forEach((m) => {
              catOpts.push(m.name);
              (m.sub_categories || []).forEach((s) => {
                const localId = `AMS${s.id}`;
                subOpts.push(s.name);
                localData.push({
                  id: localId,
                  name: s.name,
                  subcategory: m.name,
                  category: mc.name,
                  module: "",
                  status: (s.status as "Active" | "Inactive") || "Active",
                });
                map[localId] = s.id;
              });
            });
          });
          setData(localData);
          setIdMap(map);
          setSubcategoryOptions([...new Set(subOpts)].sort());
          setCategoryOptions([...new Set(catOpts)].sort());
        } else {
          const [items, subs, cats] = await Promise.all([
            childCategoriesApi.list(),
            subcategoriesApi.list(),
            categoriesApi.list(),
          ]);
          setData(items.map(toLocal));
          const map: Record<string, number> = {};
          items.forEach((c) => { map[c.code] = c.id; });
          setIdMap(map);
          setSubcategoryOptions([...new Set(subs.filter((s) => s.status !== "Inactive").map((s: ApiSubcategory) => s.name))].sort());
          setCategoryOptions(cats.filter((c) => c.status !== "Inactive").map((c: ApiCategory) => c.name).sort());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const result = await childCategoriesApi.uploadExcel(file);
      setUploadMsg(result.message);
      showToast(result.message);
      if (result.items && result.items.length > 0) {
        setData(result.items.map(toLocal));
        const map: Record<string, number> = {};
        result.items.forEach((c) => { map[c.code] = c.id; });
        setIdMap(map);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadMsg(`Error: ${msg}`);
      showToast(`Upload failed: ${msg}`, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.childName.trim()) { setFormError(_isAdminDept ? "Please fill: Sub Category Name" : "Please fill: Child Category Name"); return; }
    setFormError("");

    if (_isAdminDept) {
      // Admin Department: create/update sub-category via admin_masters API
      // We need to find the module_id from the selected module (stored in form.subcategory which represents parent module)
      try {
        const mainCats = await adminMastersApi.listMainCategories().catch(() => []);
        let moduleId: number | null = null;
        mainCats.forEach((mc) => {
          (mc.modules || []).forEach((m) => {
            if (m.name === form.subcategory) moduleId = m.id;
          });
        });
        if (!moduleId) { setFormError("Please select a valid Module"); return; }
        if (editingId) {
          const numericId = idMap[editingId];
          if (numericId) {
            const updated = await adminMastersApi.updateSubCategory(numericId, { name: form.childName, module_id: moduleId });
            setData((prev) => prev.map((c) => c.id === editingId ? { ...c, name: updated.name, subcategory: form.subcategory } : c));
            showToast("Sub Category updated successfully");
          }
        } else {
          const created = await adminMastersApi.createSubCategory({ name: form.childName, module_id: moduleId });
          setIdMap((prev) => ({ ...prev, [`AMS${created.id}`]: created.id }));
          setData((prev) => [...prev, { id: `AMS${created.id}`, name: created.name, subcategory: form.subcategory, category: form.category, module: "", status: "Active" }]);
          showToast("Sub Category created successfully");
        }
      } catch {
        showToast(editingId ? "Failed to update Sub Category" : "Failed to create Sub Category", "error");
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      return;
    }

    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await childCategoriesApi.update(numericId, {
            name: form.childName, subcategory: form.subcategory, category: form.category, module: form.module,
          });
          setData((prev) => prev.map((c) => c.id === editingId ? toLocal(updated) : c));
          showToast("Child Category updated successfully");
        } catch {
          showToast("Failed to update Child Category", "error");
        }
      }
    } else {
      try {
        const created = await childCategoriesApi.create({
          name: form.childName, code: form.childCode || undefined,
          subcategory: form.subcategory, category: form.category, module: form.module,
        });
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, toLocal(created)]);
        showToast("Child Category created successfully");
      } catch {
        showToast("Failed to create Child Category", "error");
      }
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleCancel = () => { setShowModal(false); setEditingId(null); setForm({ ...emptyForm }); setFormError(""); };

  const handleEdit = (c: LocalChildCategory) => {
    setEditingId(c.id);
    setForm({ childCode: c.id, childName: c.name, subcategory: c.subcategory, category: c.category, module: c.module });
    setFormError("");
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        if (_isAdminDept) {
          await adminMastersApi.deleteSubCategory(numericId);
        } else {
          await childCategoriesApi.updateStatus(numericId, "Inactive");
        }
      } catch { /* fall through */ }
    }
    setData((prev) => prev.map((c) => c.id === deleteConfirm ? { ...c, status: "Inactive" as const } : c));
    showToast(_isAdminDept ? "Sub Category deleted successfully" : "Child Category deleted successfully");
    setDeleteConfirm(null);
  };

  const activeData = data.filter((c) => c.status !== "Inactive");
  const filteredData = search.trim()
    ? activeData.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.subcategory.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.module.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      })
    : activeData;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-xl font-bold font-display">{_isAdminDept ? "Sub Category Management" : "Child Category Management"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Total: <span className="font-semibold text-foreground">{activeData.length}</span></p>
          </div>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, subcategory, category..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => {
            const exportData = activeData.map((c) => ({
              "Child Category Code": c.id, "Child Category Name": c.name,
              "Sub Category Name": c.subcategory, "Main Category": c.category,
              "Module": c.module, "Status": c.status,
            }));
            exportToExcel(exportData, "ChildCategories", "ChildCategories");
          }} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </button>
          {!_isAdminDept && <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleUploadExcel} className="hidden" />}
          {!_isAdminDept && <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload Excel"}
          </button>}
          <button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setFormError(""); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            + {_isAdminDept ? "Add Sub Category" : "Add Child Category"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap">
              {!_isAdminDept && <th className="px-4 py-3 font-semibold">Child Category Code</th>}
              <th className="px-4 py-3 font-semibold">{_isAdminDept ? "Sub Category Name" : "Child Category Name"}</th>
              <th className="px-4 py-3 font-semibold">{_isAdminDept ? "Module" : "Sub Category Name"}</th>
              <th className="px-4 py-3 font-semibold">{_isAdminDept ? "Main Category" : "Main Category"}</th>
              {!_isAdminDept && <th className="px-4 py-3 font-semibold">Module</th>}
              {!_isAdminDept && <th className="px-4 py-3 font-semibold">Status</th>}
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                {!_isAdminDept && <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{c.id}</td>}
                <td className="px-4 py-3 text-xs font-medium">{c.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.subcategory || ""}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.category || ""}</td>
                {!_isAdminDept && <td className="px-4 py-3 text-xs text-muted-foreground">{c.module || ""}</td>}
                {!_isAdminDept && <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
                </td>}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? (_isAdminDept ? "Edit Sub Category" : "Edit Child Category") : (_isAdminDept ? "Add Sub Category" : "Add Child Category")}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!_isAdminDept && <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Child Category Code</label>
                <input type="text" value={form.childCode} onChange={(e) => setForm({ ...form, childCode: e.target.value })} placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{_isAdminDept ? "Sub Category Name" : "Child Category Name"} <span className="text-destructive">*</span></label>
                <ComboBox value={form.childName} onChange={(val) => setForm({ ...form, childName: val })} options={[]} placeholder={_isAdminDept ? "Type sub category name" : "Type child category name"} allowCreate />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{_isAdminDept ? "Module" : "Sub Category Name"} <span className="text-destructive">*</span></label>
                <ComboBox value={form.subcategory} onChange={(val) => setForm({ ...form, subcategory: val })} options={subcategoryOptions} placeholder={_isAdminDept ? "Select module" : "Select sub category"} allowCreate />
              </div>
              {!_isAdminDept && <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Main Category</label>
                <ComboBox value={form.category} onChange={(val) => setForm({ ...form, category: val })} options={categoryOptions} placeholder="Select main category" allowCreate />
              </div>}
              {!_isAdminDept && <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Module</label>
                <ComboBox value={form.module} onChange={(val) => setForm({ ...form, module: val })} options={MODULE_OPTIONS} placeholder="Select module" allowCreate />
              </div>}
            </div>
            {formError && <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-sm mx-4 p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div><h3 className="font-semibold">Delete Child Category</h3><p className="text-xs text-muted-foreground">This action cannot be undone</p></div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this child category?</p>
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

export default AdminChildCategoriesPage;
