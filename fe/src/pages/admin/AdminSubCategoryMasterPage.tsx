import { useState, useRef, useEffect } from "react";
import { adminMastersApi } from "@/lib/api";
import type { AdminMainCategoryApi, AdminModuleApi, AdminSubCategoryApi, AdminChildCategoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download, Search, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

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

interface LocalSubCat {
  id: string;
  numericId: number;
  name: string;
  mainCategory: string;
  module: string;
  category: string;
  status: "Active" | "Inactive";
}

const emptyForm = { name: "", mainCategory: "", module: "", category: "" };

const AdminSubCategoryMasterPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<LocalSubCat[]>([]);
  const [mainCats, setMainCats] = useState<AdminMainCategoryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterMainCategory, setFilterMainCategory] = useState("");

  // Derived options
  const categoryOptions = [...new Set(mainCats.map((mc) => mc.name))].sort();
  const moduleOptions = form.mainCategory
    ? [...new Set(mainCats.find((mc) => mc.name === form.mainCategory)?.modules?.map((m) => m.name) || [])].sort()
    : [...new Set(mainCats.flatMap((mc) => mc.modules?.map((m) => m.name) || []))].sort();
  const mainCategoryOptions = form.module
    ? (() => {
        const opts: string[] = [];
        mainCats.forEach((mc) => {
          (mc.modules || []).forEach((m) => {
            if (m.name === form.module) {
              (m.sub_categories || []).forEach((s) => opts.push(s.name));
            }
          });
        });
        return [...new Set(opts)].sort();
      })()
    : (() => {
        const opts: string[] = [];
        mainCats.forEach((mc) => {
          (mc.modules || []).forEach((m) => {
            (m.sub_categories || []).forEach((s) => opts.push(s.name));
          });
        });
        return [...new Set(opts)].sort();
      })();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const mcs = await adminMastersApi.listMainCategories().catch(() => []);
      setMainCats(mcs);
      const localData: LocalSubCat[] = [];
      mcs.forEach((mc) => {
        (mc.modules || []).forEach((m) => {
          (m.sub_categories || []).forEach((s) => {
            (s.child_categories || []).forEach((c) => {
              localData.push({
                id: `ACC${c.id}`,
                numericId: c.id,
                name: c.name,
                mainCategory: s.name,
                module: m.name,
                category: mc.name,
                status: (c.status as "Active" | "Inactive") || "Active",
              });
            });
          });
        });
      });
      setData(localData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Please fill: Sub Category Name"); return; }
    if (!form.mainCategory) { setFormError("Please select a Main Category"); return; }
    setFormError("");

    // Find sub_category_id from selected main category (which is AdminSubCategory)
    let subCategoryId: number | null = null;
    mainCats.forEach((mc) => {
      (mc.modules || []).forEach((m) => {
        (m.sub_categories || []).forEach((s) => {
          if (s.name === form.mainCategory) subCategoryId = s.id;
        });
      });
    });
    if (!subCategoryId) { setFormError("Could not find the selected Main Category"); return; }

    try {
      if (editingId) {
        const item = data.find((d) => d.id === editingId);
        if (item) {
          const updated = await adminMastersApi.updateChildCategory(item.numericId, { name: form.name, sub_category_id: subCategoryId });
          setData((prev) => prev.map((d) => d.id === editingId ? { ...d, name: updated.name, mainCategory: form.mainCategory, module: form.module, category: form.category } : d));
          showToast("Sub Category updated successfully");
        }
      } else {
        const created = await adminMastersApi.createChildCategory({ name: form.name, sub_category_id: subCategoryId });
        setData((prev) => [...prev, {
          id: `ACC${created.id}`,
          numericId: created.id,
          name: created.name,
          mainCategory: form.mainCategory,
          module: form.module,
          category: form.category,
          status: "Active",
        }]);
        showToast("Sub Category created successfully");
      }
    } catch {
      showToast(editingId ? "Failed to update Sub Category" : "Failed to create Sub Category", "error");
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleCancel = () => { setShowModal(false); setEditingId(null); setForm({ ...emptyForm }); setFormError(""); };

  const handleEdit = (c: LocalSubCat) => {
    setEditingId(c.id);
    setForm({ name: c.name, mainCategory: c.mainCategory, module: c.module, category: c.category });
    setFormError("");
    setShowModal(true);
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const item = data.find((d) => d.id === deleteConfirm);
    if (item) {
      try {
        await adminMastersApi.deleteChildCategory(item.numericId);
      } catch { /* fall through */ }
    }
    setData((prev) => prev.map((d) => d.id === deleteConfirm ? { ...d, status: "Inactive" as const } : d));
    showToast("Sub Category deleted successfully");
    setDeleteConfirm(null);
  };

  // Filter options derived from data
  const filterCategoryOptions = [...new Set(data.filter((d) => d.status !== "Inactive").map((d) => d.category))].sort();
  const filterModuleOptions = [...new Set(data.filter((d) => d.status !== "Inactive" && (!filterCategory || d.category === filterCategory)).map((d) => d.module))].sort();
  const filterMainCategoryOptions = [...new Set(data.filter((d) => d.status !== "Inactive" && (!filterCategory || d.category === filterCategory) && (!filterModule || d.module === filterModule)).map((d) => d.mainCategory))].sort();

  const activeData = data.filter((d) => d.status !== "Inactive");
  const filteredData = activeData.filter((d) => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterModule && d.module !== filterModule) return false;
    if (filterMainCategory && d.mainCategory !== filterMainCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.mainCategory.toLowerCase().includes(q) || d.module.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0 flex items-center gap-3">

          <div>
            <h1 className="text-xl font-bold font-display">Sub Category Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Total: <span className="font-semibold text-foreground">{activeData.length}</span></p>
          </div>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, main category, module..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); fetchData(); }} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => {
            const exportData = activeData.map((d) => ({
              "Category": d.category, "Module": d.module,
              "Main Category": d.mainCategory, "Sub Category": d.name,
              "Status": d.status,
            }));
            exportToExcel(exportData, "SubCategories", "SubCategories");
          }} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setFormError(""); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            + Add Sub Category
          </button>
        </div>
      </div>


      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap">
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Module</th>
              <th className="px-4 py-3 font-semibold">Main Category</th>
              <th className="px-4 py-3 font-semibold">Sub Category</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.category}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.module}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.mainCategory}</td>
                <td className="px-4 py-3 text-xs font-medium">{d.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(d)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(d.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
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
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Sub Category" : "Add Sub Category"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
                <ComboBox value={form.category} onChange={(val) => setForm({ ...form, category: val, module: "", mainCategory: "" })} options={categoryOptions} placeholder="Select category" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Module</label>
                <ComboBox value={form.module} onChange={(val) => setForm({ ...form, module: val, mainCategory: "" })} options={moduleOptions} placeholder="Select module" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Main Category <span className="text-destructive">*</span></label>
                <ComboBox value={form.mainCategory} onChange={(val) => setForm({ ...form, mainCategory: val })} options={mainCategoryOptions} placeholder="Select main category" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sub Category Name <span className="text-destructive">*</span></label>
                <ComboBox value={form.name} onChange={(val) => setForm({ ...form, name: val })} options={[]} placeholder="Type sub category name" allowCreate />
              </div>
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
              <div><h3 className="font-semibold">Delete Sub Category</h3><p className="text-xs text-muted-foreground">This action cannot be undone</p></div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this sub category?</p>
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

export default AdminSubCategoryMasterPage;
