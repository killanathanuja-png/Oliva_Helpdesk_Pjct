import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { centersApi, certificatesApi } from "@/lib/api";
import type { ApiCenter, CertificateData } from "@/lib/api";
import { Loader2, MapPin, Building2, ArrowLeft, ChevronRight, Search, FileText, Upload, Download, Eye, Trash2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CERT_TYPES = ["Trade", "Labour", "Medical License", "PCB", "PPL", "GST"];

const CertificatesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCity = searchParams.get("city") || "";
  const selectedCenterId = searchParams.get("centerId") || "";
  const selectedCenterName = searchParams.get("centerName") || "";
  const isExpiringView = searchParams.get("view") === "expiring";
  const [centers, setCenters] = useState<ApiCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expiringList, setExpiringList] = useState<{ centerName: string; city: string; centerId: number; cert_type: string; expiry_date: string; days_left: number; file_name: string }[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(false);

  // Detect user role
  const storedUser = localStorage.getItem("oliva_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = parsedUser?.role || "";
  const userCenter = parsedUser?.center || "";
  const isHelpdeskAdmin = userRole.toLowerCase().includes("helpdesk admin") || userRole.toLowerCase().includes("help desk admin");
  const isAdminDept = userRole.toLowerCase().includes("admin department");
  const canUpload = isAdminDept; // Only Admin Dept can upload/replace/delete

  // Certificate state
  const [certs, setCerts] = useState<CertificateData[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadModal, setUploadModal] = useState<{ certType: string; startDate: string; expiryDate: string; file: File | null } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: string } | null>(null);
  const [viewCert, setViewCert] = useState<CertificateData | null>(null);
  const [showAddCert, setShowAddCert] = useState(false);
  const [addCertName, setAddCertName] = useState("");

  useEffect(() => {
    centersApi.list()
      .then((data) => {
        const active = data.filter((c) => c.status !== "Inactive");
        setCenters(active);
        // Helpdesk Admin: auto-redirect to their center's certificates
        if (isHelpdeskAdmin && userCenter && !selectedCenterId) {
          const myCenter = active.find((c) => c.name === userCenter);
          if (myCenter) {
            setSearchParams({ city: myCenter.city || "", centerId: String(myCenter.id), centerName: myCenter.name });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch expiring certificates for expiring view
  useEffect(() => {
    if (!isExpiringView || centers.length === 0) return;
    setExpiringLoading(true);
    (async () => {
      const expiring: typeof expiringList = [];
      const targetCenters = isHelpdeskAdmin ? centers.filter((c) => c.name === userCenter) : centers;
      for (const center of targetCenters) {
        try {
          const data = await certificatesApi.getForCenter(center.id);
          for (const cert of data.certificates) {
            if (cert.days_to_expiry !== null && cert.days_to_expiry <= 30 && cert.renewal_status !== "renewed") {
              expiring.push({ centerName: center.name, city: center.city || "", centerId: center.id, cert_type: cert.cert_type, expiry_date: cert.expiry_date || "", days_left: cert.days_to_expiry, file_name: cert.file_name || "" });
            }
          }
        } catch { /* skip */ }
      }
      expiring.sort((a, b) => a.days_left - b.days_left);
      setExpiringList(expiring);
      setExpiringLoading(false);
    })();
  }, [isExpiringView, centers]);

  // Fetch certificates when center is selected
  useEffect(() => {
    if (!selectedCenterId) { setCerts([]); return; }
    setCertsLoading(true);
    certificatesApi.getForCenter(Number(selectedCenterId))
      .then((data) => setCerts(data.certificates))
      .catch(() => setCerts(CERT_TYPES.map((ct) => ({ id: null, cert_type: ct, file_name: null, start_date: null, expiry_date: null, status: "Not Uploaded", renewal_status: "pending", days_to_expiry: null, uploaded_by: null, created_at: null, updated_at: null, has_file: false }))))
      .finally(() => setCertsLoading(false));
  }, [selectedCenterId]);

  // Group centers by city
  const citiesMap: Record<string, ApiCenter[]> = {};
  centers.forEach((c) => {
    const city = c.city || "Other";
    if (!citiesMap[city]) citiesMap[city] = [];
    citiesMap[city].push(c);
  });
  const cityNames = Object.keys(citiesMap).sort();
  const filteredCities = search.trim()
    ? cityNames.filter((city) => city.toLowerCase().includes(search.toLowerCase()))
    : cityNames;
  const selectedClinics = selectedCity ? (citiesMap[selectedCity] || []) : [];

  const handleUploadClick = (certType: string, existingCert?: CertificateData) => {
    setUploadModal({
      certType,
      startDate: existingCert?.start_date || "",
      expiryDate: existingCert?.expiry_date || "",
      file: null,
    });
  };

  const handleUploadSubmit = async () => {
    if (!uploadModal || !selectedCenterId) return;
    if (!uploadModal.file) { alert("Please select a file."); return; }
    if (!uploadModal.startDate) { alert("Please enter the Start Date."); return; }
    if (!uploadModal.expiryDate) { alert("Please enter the Expiry Date."); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("center_id", selectedCenterId);
      formData.append("cert_type", uploadModal.certType);
      formData.append("file", uploadModal.file);
      if (uploadModal.startDate) formData.append("start_date", uploadModal.startDate);
      if (uploadModal.expiryDate) formData.append("expiry_date", uploadModal.expiryDate);
      const user = JSON.parse(localStorage.getItem("oliva_user") || "{}");
      formData.append("uploaded_by", user.name || "");
      await certificatesApi.upload(formData);
      const data = await certificatesApi.getForCenter(Number(selectedCenterId));
      setCerts(data.certificates);
      setUploadModal(null);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (cert: CertificateData) => {
    if (!cert.id) return;
    try {
      const blob = await certificatesApi.download(cert.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cert.file_name || `${cert.cert_type}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  const handleView = (cert: CertificateData) => {
    if (!cert.id) return;
    setViewCert(cert);
  };

  const getViewUrl = (certId: number) => {
    return `http://localhost:8000/api/certificates/view/${certId}/`;
  };

  const handleDelete = async () => {
    if (!deleteConfirm?.id) return;
    try {
      await certificatesApi.delete(deleteConfirm.id);
      const data = await certificatesApi.getForCenter(Number(selectedCenterId));
      setCerts(data.certificates);
    } catch {
      alert("Delete failed");
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Expiring certificates view
  if (isExpiringView) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setSearchParams({})} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display">Expiring Certificates</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{expiringList.length} certificates expiring within 30 days</p>
          </div>
        </div>

        {expiringLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : expiringList.length === 0 ? (
          <div className="bg-card rounded-xl p-8 card-shadow border border-border text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">All certificates are up to date!</p>
            <p className="text-xs text-muted-foreground mt-1">No certificates expiring in the next 30 days.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 font-semibold">Certificate</th>
                  <th className="px-4 py-3 font-semibold">Clinic</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Expiry Date</th>
                  <th className="px-4 py-3 font-semibold">Days Left</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {expiringList.map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={cn("h-4 w-4 shrink-0", c.days_left < 0 ? "text-destructive" : "text-amber-500")} />
                        <span className="font-medium text-xs">{c.cert_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.centerName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.city}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", c.days_left < 0 ? "bg-destructive/10 text-destructive" : c.days_left <= 7 ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-600")}>
                        {c.days_left < 0 ? `Expired ${Math.abs(c.days_left)}d ago` : `${c.days_left} days`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSearchParams({ city: c.city, centerId: String(c.centerId), centerName: c.centerName })}
                        className="px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity">
                        Renew
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Helpdesk Admin: only show their center, block access to others
  if (isHelpdeskAdmin && selectedCenterId) {
    const myCenter = centers.find((c) => c.name === userCenter);
    if (myCenter && String(myCenter.id) !== selectedCenterId) {
      // Redirect back to their own center
      setSearchParams({ city: myCenter.city || "", centerId: String(myCenter.id), centerName: myCenter.name });
    }
  }

  // View: Clinic Certificates
  if (selectedCenterId) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          {!isHelpdeskAdmin && (
            <button onClick={() => setSearchParams({ city: selectedCity })} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display">{selectedCenterName} - Certificates</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedCity} &middot; {certs.length} certificate types</p>
          </div>
          {canUpload && (
            <button onClick={() => { setShowAddCert(true); setAddCertName(""); }}
              className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
              title="Add Certificate Type">
              + Add Certificate
            </button>
          )}
        </div>

        {/* Add new certificate type */}
        {showAddCert && (
          <div className="flex items-center gap-3 bg-card rounded-xl p-4 border border-primary/30">
            <input
              type="text"
              value={addCertName}
              onChange={(e) => setAddCertName(e.target.value)}
              placeholder="Enter new certificate type name (e.g., Fire NOC)"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && addCertName.trim()) {
                  const newType = addCertName.trim();
                  if (!certs.some((c) => c.cert_type === newType)) {
                    setCerts((prev) => [...prev, { id: null, cert_type: newType, file_name: null, start_date: null, expiry_date: null, status: "Not Uploaded", renewal_status: "pending", days_to_expiry: null, uploaded_by: null, created_at: null, updated_at: null, has_file: false }]);
                  }
                  setShowAddCert(false); setAddCertName("");
                }
                if (e.key === "Escape") { setShowAddCert(false); setAddCertName(""); }
              }}
            />
            <button onClick={() => {
              const newType = addCertName.trim();
              if (newType && !certs.some((c) => c.cert_type === newType)) {
                setCerts((prev) => [...prev, { id: null, cert_type: newType, file_name: null, start_date: null, expiry_date: null, status: "Not Uploaded", renewal_status: "pending", days_to_expiry: null, uploaded_by: null, created_at: null, updated_at: null, has_file: false }]);
              }
              setShowAddCert(false); setAddCertName("");
            }} disabled={!addCertName.trim()} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">Add</button>
            <button onClick={() => { setShowAddCert(false); setAddCertName(""); }} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        )}

        {certsLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.map((cert) => (
              <div key={cert.cert_type} className={cn("bg-card rounded-xl p-5 card-shadow border",
                cert.status === "Expired" ? "border-destructive/50 bg-destructive/5" :
                cert.status === "Expiring Soon" ? "border-amber-300 bg-amber-50/50" :
                cert.renewal_status === "renewed" ? "border-success/50 bg-success/5" : "border-border"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center",
                      cert.renewal_status === "renewed" ? "bg-success/20" :
                      cert.status === "Expired" ? "bg-destructive/10" :
                      cert.status === "Expiring Soon" ? "bg-amber-100" :
                      cert.has_file ? "bg-success/10" : "bg-muted"
                    )}>
                      {cert.renewal_status === "renewed" ? <CheckCircle2 className="h-5 w-5 text-success" /> :
                       cert.status === "Expired" ? <AlertTriangle className="h-5 w-5 text-destructive" /> :
                       cert.status === "Expiring Soon" ? <AlertTriangle className="h-5 w-5 text-amber-600" /> :
                       cert.has_file ? <CheckCircle2 className="h-5 w-5 text-success" /> :
                       <FileText className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{cert.cert_type}</h3>
                      <p className={cn("text-[11px] font-medium",
                        cert.renewal_status === "renewed" ? "text-success" :
                        cert.status === "Expired" ? "text-destructive" :
                        cert.status === "Expiring Soon" ? "text-amber-600" :
                        cert.has_file ? "text-success" : "text-muted-foreground"
                      )}>
                        {cert.renewal_status === "renewed" ? "Renewed" :
                         cert.status === "Expired" ? "Expired" :
                         cert.status === "Expiring Soon" ? `Expiring in ${cert.days_to_expiry} days` :
                         cert.has_file ? "Uploaded" : "Not Uploaded"}
                      </p>
                    </div>
                  </div>
                </div>

                {cert.has_file && (
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <p>File: {cert.file_name}</p>
                    {cert.start_date && <p>Start: <span className="font-medium text-foreground">{new Date(cert.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></p>}
                    {cert.expiry_date && <p>Expiry: <span className={cn("font-medium", new Date(cert.expiry_date) < new Date() ? "text-destructive" : "text-success")}>{new Date(cert.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></p>}
                    {cert.uploaded_by && <p>By: {cert.uploaded_by}</p>}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {cert.has_file ? (
                    <>
                      <button onClick={() => handleView(cert)} className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button onClick={() => handleDownload(cert)} className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                      {canUpload && (
                        <>
                          <button onClick={() => handleUploadClick(cert.cert_type, cert)}
                            className="px-3 py-2 rounded-lg border border-primary/30 text-xs font-medium text-primary hover:bg-primary/5 transition-colors flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5" /> Replace
                          </button>
                          <button onClick={() => cert.id && setDeleteConfirm({ id: cert.id, type: cert.cert_type })}
                            className="px-2 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : canUpload ? (
                    <button onClick={() => handleUploadClick(cert.cert_type)}
                      className="w-full px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Upload Certificate
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Not uploaded yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Viewer Modal */}
        {viewCert && viewCert.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-4xl mx-4 h-[85vh] flex flex-col animate-fade-in">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                <div>
                  <h3 className="font-semibold">{viewCert.cert_type} Certificate</h3>
                  <p className="text-xs text-muted-foreground">{viewCert.file_name}</p>
                </div>
                <button onClick={() => setViewCert(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {viewCert.file_name?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                  <div className="h-full flex items-center justify-center p-4 bg-muted/30">
                    <img src={getViewUrl(viewCert.id)} alt={viewCert.cert_type} className="max-h-full max-w-full object-contain rounded-lg shadow-md" />
                  </div>
                ) : (
                  <iframe src={getViewUrl(viewCert.id)} className="w-full h-full border-0" title={viewCert.cert_type} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md mx-4 p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{uploadModal.file ? "Replace" : "Upload"} {uploadModal.certType} Certificate</h3>
                <button onClick={() => setUploadModal(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Certificate File <span className="text-destructive">*</span></label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setUploadModal({ ...uploadModal, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date <span className="text-destructive">*</span></label>
                    <input type="date" value={uploadModal.startDate}
                      onChange={(e) => setUploadModal({ ...uploadModal, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Expiry Date <span className="text-destructive">*</span></label>
                    <input type="date" value={uploadModal.expiryDate}
                      onChange={(e) => setUploadModal({ ...uploadModal, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setUploadModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleUploadSubmit} disabled={!uploadModal.file || !uploadModal.startDate || !uploadModal.expiryDate || uploading}
                  className="flex-1 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload"}
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
                <div><h3 className="font-semibold">Delete Certificate</h3><p className="text-xs text-muted-foreground">This action cannot be undone</p></div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Delete <strong>{deleteConfirm.type}</strong> certificate?</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Helpdesk Admin should never see city/clinic lists - redirect to their center
  if (isHelpdeskAdmin) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // View: Clinic List for City
  if (selectedCity) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setSearchParams({})} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display">{selectedCity} - Clinics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedClinics.length} clinics &middot; Click a clinic to manage certificates</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedClinics.map((c) => (
            <button
              key={c.id}
              onClick={() => setSearchParams({ city: selectedCity, centerId: String(c.id), centerName: c.name })}
              className="bg-card rounded-xl p-5 card-shadow border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.city} &middot; {c.zone || "—"}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // View: City List
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Certificates</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{cityNames.length} cities &middot; {centers.length} clinics</p>
          </div>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCities.map((city) => (
          <button key={city} onClick={() => setSearchParams({ city })}
            className="bg-card rounded-xl p-5 card-shadow border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{city}</h3>
                  <p className="text-xs text-muted-foreground">{citiesMap[city].length} clinic{citiesMap[city].length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
