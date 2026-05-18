import { useState, useEffect } from "react";
import { documentsApi } from "@/lib/api";
import type { PropertyDocumentData } from "@/lib/api";
import { Loader2, FileText, Plus, Pencil, Trash2, Download, Search, X, Upload } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";

type FormState = {
  id: number | null;
  city: string;
  location: string;
  area_sqft: string;
  agreement_date: string;
  lease_comm_date: string;
  lease_end_date: string;
  rent_escalation_date: string;
  escalation_percentage: string;
  per_month_rent: string;
  owner_name: string;
  owner_contact: string;
  owner_email: string;
  registered: boolean | null;
  file: File | null;
};

const emptyForm: FormState = {
  id: null,
  city: "",
  location: "",
  area_sqft: "",
  agreement_date: "",
  lease_comm_date: "",
  lease_end_date: "",
  rent_escalation_date: "",
  escalation_percentage: "",
  per_month_rent: "",
  owner_name: "",
  owner_contact: "",
  owner_email: "",
  registered: null,
  file: null,
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const DocumentsPage = () => {
  const [docs, setDocs] = useState<PropertyDocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; location: string } | null>(null);

  const storedUser = localStorage.getItem("oliva_user");
  const currentUser = storedUser ? (JSON.parse(storedUser).name || "") : "";

  const refresh = () => {
    setLoading(true);
    documentsApi.list().then(setDocs).catch(() => setDocs([])).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const openAdd = () => { setError(""); setModal({ ...emptyForm }); };
  const openEdit = (d: PropertyDocumentData) => {
    setError("");
    setModal({
      id: d.id,
      city: d.city || "",
      location: d.location || "",
      area_sqft: d.area_sqft != null ? String(d.area_sqft) : "",
      agreement_date: d.agreement_date || "",
      lease_comm_date: d.lease_comm_date || "",
      lease_end_date: d.lease_end_date || "",
      rent_escalation_date: d.rent_escalation_date || "",
      escalation_percentage: d.escalation_percentage != null ? String(d.escalation_percentage) : "",
      per_month_rent: d.per_month_rent != null ? String(d.per_month_rent) : "",
      owner_name: d.owner_name || "",
      owner_contact: d.owner_contact || "",
      owner_email: d.owner_email || "",
      registered: !!d.registered,
      file: null,
    });
  };

  const submit = async () => {
    if (!modal) return;
    // All fields mandatory. File only required when adding (edits may keep existing file).
    const required: Array<[string, string]> = [
      ["city", "City"],
      ["location", "Location"],
      ["area_sqft", "Area (Sq.ft)"],
      ["agreement_date", "Agreement Date"],
      ["lease_comm_date", "Lease Commencement Date"],
      ["lease_end_date", "Lease End Date"],
      ["rent_escalation_date", "Rent Escalation Date"],
      ["escalation_percentage", "Escalation %"],
      ["per_month_rent", "Per Month Rent"],
      ["owner_name", "Owner Name"],
      ["owner_contact", "Owner Contact"],
      ["owner_email", "Owner Email"],
    ];
    for (const [key, label] of required) {
      const v = (modal as any)[key];
      if (typeof v !== "string" || !v.trim()) {
        setError(`${label} is required`);
        return;
      }
    }
    if (modal.registered === null) {
      setError("Registered selection is required");
      return;
    }
    if (modal.owner_contact.length !== 10) {
      setError("Owner Contact must be exactly 10 digits");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("city", modal.city.trim());
      fd.append("location", modal.location.trim());
      fd.append("area_sqft", modal.area_sqft);
      fd.append("agreement_date", modal.agreement_date);
      fd.append("lease_comm_date", modal.lease_comm_date);
      fd.append("lease_end_date", modal.lease_end_date);
      fd.append("rent_escalation_date", modal.rent_escalation_date);
      fd.append("escalation_percentage", modal.escalation_percentage);
      fd.append("per_month_rent", modal.per_month_rent);
      fd.append("owner_name", modal.owner_name.trim());
      fd.append("owner_contact", modal.owner_contact.trim());
      fd.append("owner_email", modal.owner_email.trim());
      fd.append("registered", modal.registered ? "true" : "false");
      if (currentUser) fd.append("uploaded_by", currentUser);
      if (modal.file) fd.append("file", modal.file);

      if (modal.id) await documentsApi.update(modal.id, fd);
      else await documentsApi.create(fd);
      setModal(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await documentsApi.remove(deleteConfirm.id);
      setDeleteConfirm(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const downloadFile = async (d: PropertyDocumentData) => {
    try {
      const blob = await documentsApi.download(d.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.file_name || `${d.location}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    }
  };

  const filtered = docs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.city.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      (d.owner_name || "").toLowerCase().includes(q) ||
      (d.owner_email || "").toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (filtered.length === 0) { alert("No documents to export."); return; }
    const rows = filtered.map((d) => ({
      "City": d.city,
      "Location": d.location,
      "Area (Sq.ft)": d.area_sqft ?? "",
      "Agreement Date": fmtDate(d.agreement_date),
      "Lease Comm Date": fmtDate(d.lease_comm_date),
      "Lease End Date": fmtDate(d.lease_end_date),
      "Rent Escalation Date": fmtDate(d.rent_escalation_date),
      "Percentage": d.escalation_percentage ?? "",
      "Per Month Rent": d.per_month_rent ?? "",
      "Owner Name": d.owner_name || "",
      "Owner Contact": d.owner_contact || "",
      "Owner Email": d.owner_email || "",
      "Registered": d.registered ? "YES" : "NO",
      "File": d.file_name || "",
    }));
    exportToExcel(rows, "Property_Documents", "Documents");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Documents</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Property / lease agreements — {docs.length} document{docs.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city, location, owner..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap">
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98] whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #00B7AE, #1A6B6A)" }}>
            <Plus className="h-4 w-4" /> Add Document
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-8 card-shadow border border-border text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Document" to create the first one.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-3 py-3 font-semibold">City</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Area (Sq.ft)</th>
                <th className="px-3 py-3 font-semibold">Agreement</th>
                <th className="px-3 py-3 font-semibold">Lease Comm</th>
                <th className="px-3 py-3 font-semibold">Lease End</th>
                <th className="px-3 py-3 font-semibold">Rent Escalation</th>
                <th className="px-3 py-3 font-semibold">%</th>
                <th className="px-3 py-3 font-semibold">Rent / month</th>
                <th className="px-3 py-3 font-semibold">Owner</th>
                <th className="px-3 py-3 font-semibold">Contact</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Registered</th>
                <th className="px-3 py-3 font-semibold">File</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 text-xs font-medium">{d.city}</td>
                  <td className="px-3 py-2.5 text-xs">{d.location}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.area_sqft ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(d.agreement_date)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(d.lease_comm_date)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(d.lease_end_date)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(d.rent_escalation_date)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.escalation_percentage ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.per_month_rent != null ? `₹${d.per_month_rent.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.owner_name || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.owner_contact || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.owner_email || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${d.registered ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {d.registered ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate" title={d.file_name || ""}>
                    {d.has_file ? (
                      <button onClick={() => downloadFile(d)} className="text-primary hover:underline inline-flex items-center gap-1">
                        <Download className="h-3 w-3" /> {d.file_name || "Download"}
                      </button>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(d)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ id: d.id, location: d.location })}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold">{modal.id ? "Edit Document" : "Add Document"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required value={modal.city} onChange={(v) => setModal({ ...modal, city: v })} placeholder="e.g. Bangalore" />
                <Field label="Location" required value={modal.location} onChange={(v) => setModal({ ...modal, location: v })} placeholder="e.g. HSR Layout" />
                <Field label="Area (Sq.ft)" required value={modal.area_sqft} onChange={(v) => setModal({ ...modal, area_sqft: v })} type="number" placeholder="e.g. 1200" />
                <Field label="Per Month Rent" required value={modal.per_month_rent} onChange={(v) => setModal({ ...modal, per_month_rent: v })} type="number" placeholder="e.g. 50000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agreement Date" required value={modal.agreement_date} onChange={(v) => setModal({ ...modal, agreement_date: v })} type="date" />
                <Field label="Lease Commencement Date" required value={modal.lease_comm_date} onChange={(v) => setModal({ ...modal, lease_comm_date: v })} type="date" />
                <Field label="Lease End Date" required value={modal.lease_end_date} onChange={(v) => setModal({ ...modal, lease_end_date: v })} type="date" />
                <Field label="Rent Escalation Date" required value={modal.rent_escalation_date} onChange={(v) => setModal({ ...modal, rent_escalation_date: v })} type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Escalation %" required value={modal.escalation_percentage} onChange={(v) => setModal({ ...modal, escalation_percentage: v })} type="number" placeholder="e.g. 10" />
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Registered <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modal.registered === null ? "" : modal.registered ? "yes" : "no"}
                    onChange={(e) => {
                      const v = e.target.value;
                      setModal({ ...modal, registered: v === "" ? null : v === "yes" });
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">-- Select --</option>
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Owner Name" required value={modal.owner_name} onChange={(v) => setModal({ ...modal, owner_name: v })} placeholder="e.g. John Doe" />
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Owner Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={modal.owner_contact}
                    onChange={(e) => {
                      // Keep only digits, cap at 10 characters
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setModal({ ...modal, owner_contact: digits });
                    }}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <Field label="Owner Email" required value={modal.owner_email} onChange={(v) => setModal({ ...modal, owner_email: v })} type="email" placeholder="owner@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Upload File</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setModal({ ...modal, file: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/60 text-sm" />
                <p className="text-[11px] text-muted-foreground mt-1">PDF, JPG, PNG, DOC &middot; Max 1 GB {modal.id ? "(leave empty to keep existing file)" : "(optional)"}</p>
              </div>
              {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={submit} disabled={saving}
                className="px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #00B7AE, #1A6B6A)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {modal.id ? "Save Changes" : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-semibold mb-2">Delete document?</h3>
            <p className="text-sm text-muted-foreground mb-4">This will permanently delete the document for <strong>{deleteConfirm.location}</strong>. This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
  </div>
);

export default DocumentsPage;
