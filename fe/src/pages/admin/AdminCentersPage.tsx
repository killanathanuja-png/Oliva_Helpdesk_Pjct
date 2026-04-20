import { useState, useEffect } from "react";
import { centers as fallbackCenters } from "@/data/dummyData";
import type { Center } from "@/data/dummyData";
import { centersApi } from "@/lib/api";
import type { ApiCenter } from "@/lib/api";
import { MapPin, Search, X, Trash2, Pencil, AlertTriangle, Loader2, Download, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

const apiToCenter = (c: ApiCenter): Center & { centerManagerEmail: string; aomEmail: string } => ({
  id: c.code,
  locationCode: c.location_code || "",
  name: c.name,
  city: c.city || "",
  state: c.state || "",
  department: c.department || "",
  contactPerson: c.contact_person || "",
  phone: c.phone || "",
  address: c.address || "",
  pincode: c.pincode || "",
  latitude: c.latitude || "",
  longitude: c.longitude || "",
  zone: c.zone || "",
  country: c.country || "India",
  centerManagerEmail: c.center_manager_email || "",
  aomEmail: c.aom_email || "",
  status: (c.status as "Active" | "Inactive") || "Active",
});

const emptyForm = {
  locationCode: "", name: "", city: "", state: "", contactPerson: "", phone: "",
  address: "", pincode: "", latitude: "", longitude: "", zone: "",
  country: "India", centerManagerEmail: "", aomEmail: "", status: "Active",
};

const zoneOptions = ["North", "South", "East", "West"];

const AdminCentersPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<Center[]>([...fallbackCenters]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    centersApi.list()
      .then((res) => {
        setData(res.map(apiToCenter));
        const map: Record<string, number> = {};
        res.forEach((c) => { map[c.code] = c.id; });
        setIdMap(map);
      })
      .catch(() => setData([...fallbackCenters]))
      .finally(() => setLoading(false));
  }, []);

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        await centersApi.updateStatus(numericId, "Inactive");
      } catch { /* fall through to local update */ }
    }
    setData((prev) => prev.map((c) => c.id === deleteConfirm ? { ...c, status: "Inactive" as const } : c));
    showToast("Center deleted successfully");
    setDeleteConfirm(null);
  };

  const cities = [...new Set(data.map((c) => c.city).filter(Boolean))];
  const filtered = data.filter((c) => {
    if (c.status === "Inactive") return false;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === "All" || c.city === cityFilter;
    return matchSearch && matchCity;
  });

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("Center Name");
    if (!form.city.trim()) missing.push("Location");
    if (!form.centerManagerEmail.trim()) missing.push("Center Manager Mail");
    if (!form.aomEmail.trim()) missing.push("AOM Mail");
    if (!form.country.trim()) missing.push("Country");
    if (missing.length > 0) { setFormError(`Please fill: ${missing.join(", ")}`); return; }
    setFormError("");

    const payload = {
      location_code: form.locationCode.trim(),
      name: form.name.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      contact_person: form.contactPerson.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      pincode: form.pincode.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      zone: form.zone,
      country: form.country.trim(),
      center_manager_email: form.centerManagerEmail.trim(),
      aom_email: form.aomEmail.trim(),
      status: form.status,
    };

    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          const updated = await centersApi.update(numericId, payload);
          setData((prev) => prev.map((c) => c.id === editingId ? apiToCenter(updated) : c));
          showToast("Center updated successfully");
        } catch {
          showToast("Failed to update Center", "error");
          setData((prev) => prev.map((c) => c.id === editingId ? {
            ...c, name: form.name.trim(), city: form.city.trim(), state: form.state.trim(),
            contactPerson: form.contactPerson.trim(), phone: form.phone.trim(),
            address: form.address.trim(), pincode: form.pincode.trim(),
            latitude: form.latitude.trim(), longitude: form.longitude.trim(),
            zone: form.zone, country: form.country.trim(),
          } : c));
        }
      }
    } else {
      try {
        const created = await centersApi.create(payload);
        setIdMap((prev) => ({ ...prev, [created.code]: created.id }));
        setData((prev) => [...prev, apiToCenter(created)]);
        showToast("Center created successfully");
      } catch {
        showToast("Failed to create Center", "error");
        const newCenter: Center = {
          id: `C${String(data.length + 1).padStart(3, "0")}`,
          locationCode: form.locationCode.trim(),
          name: form.name.trim(), city: form.city.trim(), state: form.state.trim(),
          department: "", contactPerson: form.contactPerson.trim(), phone: form.phone.trim(),
          address: form.address.trim(), pincode: form.pincode.trim(),
          latitude: form.latitude.trim(), longitude: form.longitude.trim(),
          zone: form.zone, country: form.country.trim(),
          status: form.status as "Active" | "Inactive",
        };
        setData((prev) => [...prev, newCenter]);
      }
    }
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      locationCode: c.locationCode, name: c.name, city: c.city, state: c.state,
      contactPerson: c.contactPerson, phone: c.phone,
      address: c.address, pincode: c.pincode,
      latitude: c.latitude, longitude: c.longitude,
      zone: c.zone, country: c.country,
      centerManagerEmail: c.centerManagerEmail || "", aomEmail: c.aomEmail || "",
      status: c.status,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleCancel = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormError("");
    setShowModal(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">

          <h1 className="text-xl font-bold font-display">Center Management ({filtered.length})</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = filtered.map((c: any) => ({
                "Location": c.city,
                "Center Name": c.name,
                "Center Manager Mail": c.centerManagerEmail || "",
                "AOM Mail": c.aomEmail || "",
                "Country": c.country || "India",
                "Zone": c.zone,
                "Pincode": c.pincode,
                "Status": c.status,
                "Address": c.address,
                "Latitude": c.latitude,
                "Longitude": c.longitude,
                "Contact Person": c.contactPerson,
                "Mobile Number": c.phone,
              }));
              exportToExcel(exportData, "Centers", "Centers");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setFormError(""); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Center
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search centers..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="All">All Cities</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Center Name</th>
              <th className="px-4 py-3 font-semibold">Center Manager Mail</th>
              <th className="px-4 py-3 font-semibold">AOM Mail</th>
              <th className="px-4 py-3 font-semibold">Country</th>
              <th className="px-4 py-3 font-semibold">Zone</th>
              <th className="px-4 py-3 font-semibold">Pincode</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c: any) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.city || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-medium text-xs">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.centerManagerEmail || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.aomEmail || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.country || "India"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.zone || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.pincode || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No centers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit Center" : "Add Center"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Row 1: Location (City), Center Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Location <span className="text-destructive">*</span></label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Enter location/city"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Center Name <span className="text-destructive">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter center name"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Row 2: Center Manager Mail, AOM Mail */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Center Manager Mail <span className="text-destructive">*</span></label>
                  <input type="email" value={form.centerManagerEmail} onChange={(e) => setForm({ ...form, centerManagerEmail: e.target.value })} placeholder="Enter CM email"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">AOM Mail <span className="text-destructive">*</span></label>
                  <input type="email" value={form.aomEmail} onChange={(e) => setForm({ ...form, aomEmail: e.target.value })} placeholder="Enter AOM email"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Row 3: Country, Zone, Pincode */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Country <span className="text-destructive">*</span></label>
                  <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="India"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Zone</label>
                  <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">-- Select --</option>
                    {zoneOptions.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pincode</label>
                  <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Enter pincode"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Row 4: Status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status <span className="text-destructive">*</span></label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Contact Person, Mobile Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contact Person</label>
                  <input type="text" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Enter contact person"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mobile Number</label>
                  <input type="tel" maxLength={10} value={form.phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 10); setForm({ ...form, phone: val }); }} placeholder="Enter mobile number"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
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
                <h3 className="font-semibold">Delete Center</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this center?</p>
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

export default AdminCentersPage;
