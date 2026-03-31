import { useState, useRef, useEffect } from "react";
import { X, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { departments as fallbackDepartments, centers as fallbackCenters } from "@/data/dummyData";
import type { Ticket } from "@/data/dummyData";
import { cn } from "@/lib/utils";
import { departmentsApi, centersApi, categoriesApi, subcategoriesApi, childCategoriesApi, serviceTitlesApi, aomMappingsApi, cddTypesApi } from "@/lib/api";
import type { ApiDepartment, ApiCenter, ApiCategory, ApiSubcategory, ApiChildCategory, ApiServiceTitle, ApiCDDType } from "@/lib/api";
 
export interface TicketFormData {
  title: string;
  description: string;
  department: string;
  category: string;
  subCategory: string;
  priority: string;
  center: string;
  status?: string;
  // CDD fields
  actionRequired?: string;
  assignedCenter?: string;
  centerManagerEmail?: string;
  aomEmail?: string;
  // Zenoti fields
  zenotiLocation?: string;
  zenotiMainCategory?: string;
  zenotiSubCategory?: string;
  zenotiChildCategory?: string;
  zenotiMobileNumber?: string;
  zenotiCustomerId?: string;
  zenotiCustomerName?: string;
  zenotiBilledBy?: string;
  zenotiInvoiceNo?: string;
  zenotiInvoiceDate?: string;
  zenotiAmount?: string;
  zenotiDescription?: string;
}
 
interface Props {
  onClose: () => void;
  onSuccess?: (formData: TicketFormData) => void;
  editMode?: boolean;
  editTicket?: Ticket;
  userRole?: string;
  userDepartment?: string;
}
 
interface ComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  error?: boolean;
}
 
const ComboBox = ({ value, onChange, options, placeholder, error }: ComboBoxProps) => {
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
          className={cn(
            "w-full px-3 py-2 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer",
            error && "border-destructive ring-1 ring-destructive/30"
          )}
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
 
const emptyZenotiFields = {
  location: "",
  mainCategory: "",
  subCategory: "",
  childCategory: "",
  mobileNumber: "",
  customerId: "",
  customerName: "",
  billedBy: "",
  invoiceNo: "",
  invoiceDate: "",
  amount: "",
  zenotiDescription: "",
};
 
const RaiseTicketModal = ({ onClose, onSuccess, editMode, editTicket, userRole, userDepartment }: Props) => {
  const [department, setDepartment] = useState(editTicket?.assignedDept || "");
  const [category, setCategory] = useState(editTicket?.category || "");
  const [zenotiFields, setZenotiFields] = useState(emptyZenotiFields);
  const [showAlert, setShowAlert] = useState(false);
  const [title, setTitle] = useState(editTicket?.title || "");
  const [description, setDescription] = useState(editTicket?.description || "");
  const [priority, setPriority] = useState(editTicket?.priority || "");
  const [subCategory, setSubCategory] = useState(editTicket?.subCategory || "");
  const [center, setCenter] = useState(editTicket?.center || "");
  const [status, setStatus] = useState(editTicket?.status || "");
 
  // API-fetched master data
  const [apiDepartments, setApiDepartments] = useState<ApiDepartment[]>([]);
  const [apiCenters, setApiCenters] = useState<ApiCenter[]>([]);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [apiSubcategories, setApiSubcategories] = useState<ApiSubcategory[]>([]);
  const [apiServiceTitles, setApiServiceTitles] = useState<ApiServiceTitle[]>([]);
  const [apiChildCategories, setApiChildCategories] = useState<ApiChildCategory[]>([]);
  const [childCategory, setChildCategory] = useState(editTicket?.zenotiChildCategory || "");
  const [customType, setCustomType] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [apiCddTypes, setApiCddTypes] = useState<ApiCDDType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cmCenterName, setCmCenterName] = useState<string | null>(null);
  const [cmAomName, setCmAomName] = useState<string | null>(null);
  // CDD department fields
  const [actionRequired, setActionRequired] = useState("");
  const [assignedCenter, setAssignedCenter] = useState("");
  const [cddCmEmail, setCddCmEmail] = useState("");
  const [cddAomEmail, setCddAomEmail] = useState("");
 
  // Fetch all master data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [depts, ctrs, cats, subs, childCats, svcs, cddTypes] = await Promise.all([
          departmentsApi.list().catch(() => null),
          centersApi.list().catch(() => null),
          categoriesApi.list().catch(() => null),
          subcategoriesApi.list().catch(() => null),
          childCategoriesApi.list().catch(() => null),
          serviceTitlesApi.list().catch(() => null),
          cddTypesApi.list().catch(() => null),
        ]);
 
        if (depts && depts.length > 0) {
          setApiDepartments(depts);
        } else {
          // Use fallback departments
          setApiDepartments(fallbackDepartments.map((d, i) => ({
            id: i + 1, code: d.id, name: d.name, head: d.head || null,
            sla_hours: d.slaHours, center_count: d.centerCount,
            active_tickets: d.activeTickets, status: null, created_at: null,
          })));
        }
 
        if (ctrs && ctrs.length > 0) {
          setApiCenters(ctrs);
        } else {
          setApiCenters(fallbackCenters.map((c, i) => ({
            id: i + 1, code: c.id, location_code: null, name: c.name, city: c.city, state: c.state,
            department: c.department, contact_person: c.contactPerson,
            phone: c.phone, address: null, pincode: null, latitude: null,
            longitude: null, zone: null, country: c.country,
            center_manager_email: null, aom_email: null,
            status: c.status, created_at: null,
          })));
        }
 
        if (cats) setApiCategories(cats);
        if (subs) setApiSubcategories(subs);
        if (childCats) setApiChildCategories(childCats);
        if (svcs) setApiServiceTitles(svcs);
        if (cddTypes) setApiCddTypes(cddTypes);

        // Auto-fetch CM's mapped center and AOM
        try {
          const cmInfo = await aomMappingsApi.myCenter();
          if (cmInfo.center_name) {
            setCmCenterName(cmInfo.center_name);
            setCenter(cmInfo.center_name);
          }
          if (cmInfo.aom_name) {
            setCmAomName(cmInfo.aom_name);
          }
        } catch {
          // Not a CM or no mapping — ignore
        }
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);
 
  const isZenoti = department === "Zenoti";
  const isCDD = (userDepartment || "").toLowerCase().includes("cdd");
  const isQualityAudit = department === "Quality" || department === "Quality & Audit" || (department || "").toLowerCase().includes("quality");
  const isCDDClinic = isCDD && (department === "Clinic" || department === "Clinic Operations");

  // CDD Clinic: Type → Category mapping (from API)
  const cddClinicTypeMap: Record<string, string[]> = {};
  for (const t of apiCddTypes) {
    cddClinicTypeMap[t.name] = t.categories.map((c) => c.name);
  }
  const cddClinicTypes = [...apiCddTypes.map((t) => t.name), "others"];
  // Quality & Audit category → subcategory mapping
  const qaSubcategoryMap: Record<string, string[]> = {
    "Post Audit": [],
    "Quality Report": [],
    "Grooming Approval": ["Accessories", "Make up", "Mehandi Application"],
    "Intern Departmental Concerns": ["Admin", "Stores", "HR", "Ops VP", "CDD", "Marketing", "BPM", "Products", "Zenoti", "Medical Team"],
    "Clinic Late Opening & Early Closure": ["Doctor Unavailability", "Keys unavailable", "Team outing"],
    "Uniform Concerns": ["Temporary Approval", "Uniform Issuance", "Name Badge", "Shoes"],
    "Audit Requisitions": ["Room Checklist", "Register video", "Emergency drug list", "Grooming guidelines"],
    "Dr Referrals": [],
  };
  const isCDDToClinics = isCDD && (department === "Clinic" || department === "Clinic Operations");

  // When CDD selects a center, auto-fill CM and AOM
  const handleAssignedCenterChange = (val: string) => {
    setAssignedCenter(val);
    const matched = apiCenters.find((c) => c.name === val);
    if (matched) {
      setCddCmEmail(matched.center_manager_email || "");
      setCddAomEmail(matched.aom_email || "");
    } else {
      setCddCmEmail("");
      setCddAomEmail("");
    }
  };

  // Department options from API + "Others"
  const departmentOptions = [...apiDepartments.map((d) => d.name).sort(), "Others"];
 
  // Categories filtered by selected department
  // If a department is selected: show categories assigned to that department + unassigned categories
  // Exception: if department has dedicated categories (like Zenoti), show only those
  const deptHasDedicatedCategories = department && apiCategories.some((c) => c.status !== "Inactive" && c.department === department);
  const categoryOptions = isCDDClinic
    ? cddClinicTypes
    : isQualityAudit
    ? Object.keys(qaSubcategoryMap).sort()
    : [...new Set(
        apiCategories
          .filter((c) => {
            if (c.status === "Inactive") return false;
            if (!department) return true;
            if (deptHasDedicatedCategories) return c.department === department;
            return !c.department || c.department === department;
          })
          .map((c) => c.name)
      )].sort();
 
  // Subcategories filtered by selected category
  const allCddClinicCategories = [...new Set(Object.values(cddClinicTypeMap).flat()), "others"];
  const subCategoryOptions = isCDDClinic
    ? allCddClinicCategories
    : isQualityAudit
    ? (category ? (qaSubcategoryMap[category] || []) : [])
    : isCDD ? []
    : [...new Set(
        apiSubcategories
          .filter((s) => {
            if (s.status === "Inactive") return false;
            if (!category) return true;
            const hasLinked = apiSubcategories.some((x) => x.status !== "Inactive" && x.category === category);
            return hasLinked ? s.category === category : !s.category;
          })
          .map((s) => s.name)
      )].sort();
 
  // Child categories filtered by selected subcategory
  const childCategoryOptions = [...new Set(
    apiChildCategories
      .filter((c) => {
        if (c.status === "Inactive") return false;
        if (!subCategory) return false;
        // Show children linked to selected subcategory
        return c.subcategory === subCategory;
      })
      .map((c) => c.name)
  )].sort();
 
  // Centers from API
  const centerOptions = ["Select All", ...apiCenters.map((c) => c.name)];
 
  // Service titles filtered by subcategory (for priority lookup)
  const matchingServiceTitle = subCategory
    ? apiServiceTitles.find((st) => st.subcategory === subCategory)
    : null;
 
  const zenotiFieldsFilled = () => {
    const { location, mobileNumber, customerId, customerName, billedBy, invoiceNo, invoiceDate } = zenotiFields;
    return [location, category, subCategory, childCategory, mobileNumber, customerId, customerName, billedBy, invoiceNo, invoiceDate].every((v) => v.trim() !== "");
  };
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    if (editMode) {
      // Edit mode: only priority, status, attachment
      if (onSuccess) {
        onSuccess({
          title: editTicket?.title || "", description: editTicket?.description || "",
          department: editTicket?.assignedDept || "", category: editTicket?.category || "",
          subCategory: editTicket?.subCategory || "", center: editTicket?.center || "",
          priority, status,
        });
      }
    } else {
      // Raise mode: full form
      if (isZenoti && !zenotiFieldsFilled()) {
        setShowAlert(true);
        return;
      }
      if (onSuccess) {
        const finalCategory = (isCDDClinic && category === "others" && customType) ? customType : category;
        const finalSubCategory = (isCDDClinic && subCategory === "others" && customCategory) ? customCategory : subCategory;
        onSuccess({
          title, description, department, category: finalCategory, subCategory: finalSubCategory, priority,
          center: isZenoti ? zenotiFields.location : (isCDDToClinics ? assignedCenter : center),
          zenotiChildCategory: childCategory,
          ...(isCDDToClinics && {
            actionRequired,
            assignedCenter,
            centerManagerEmail: cddCmEmail,
            aomEmail: cddAomEmail,
          }),
          ...(isZenoti && {
            zenotiLocation: zenotiFields.location,
            zenotiMainCategory: category,
            zenotiSubCategory: subCategory,
            zenotiMobileNumber: zenotiFields.mobileNumber,
            zenotiCustomerId: zenotiFields.customerId,
            zenotiCustomerName: zenotiFields.customerName,
            zenotiBilledBy: zenotiFields.billedBy,
            zenotiInvoiceNo: zenotiFields.invoiceNo,
            zenotiInvoiceDate: zenotiFields.invoiceDate,
            zenotiAmount: zenotiFields.amount,
            zenotiDescription: zenotiFields.zenotiDescription,
          }),
        });
      }
    }
    if (!onSuccess) onClose();
  };
 
  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    setCategory("");
    setSubCategory("");
    setChildCategory("");
    setActionRequired("");
    setAssignedCenter("");
    setCddCmEmail("");
    setCddAomEmail("");
    if (val !== "Zenoti") {
      setZenotiFields(emptyZenotiFields);
      setShowAlert(false);
    } else if (cmCenterName) {
      // Auto-fill Zenoti location with CM's mapped center
      setZenotiFields((prev) => ({ ...prev, location: cmCenterName }));
    }
  };
 
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSubCategory("");
    setChildCategory("");
    // Auto-set priority to Critical for Zenoti-Finance
    if (val.toLowerCase() === "zenoti-finance") {
      setPriority("Critical");
    } else {
      setPriority("");
    }
  };
 
  const handleSubCategoryChange2 = (val: string) => {
    setSubCategory(val);
    setChildCategory("");
  };
 
  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
  const errField = (field: string) => showAlert && !field.trim();
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold font-display">{editMode ? "Edit Ticket" : "Raise New Ticket"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
 
        {editMode ? (
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Priority <span className="text-destructive">*</span></label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} required>
                  <option value="">Select priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Status <span className="text-destructive">*</span></label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass} required>
                  <option value="">Select status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
 
            {(userRole === "AOM" || userRole === "Finance") && (
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, "resize-none")} placeholder="Add remarks or comments..." />
              </div>
            )}
 
            <div>
              <label className={labelClass}>Attachment</label>
              <input type="file" className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80" />
            </div>
 
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        ) : loadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className={labelClass}>Department <span className="text-destructive">*</span></label>
              <ComboBox
                value={department}
                onChange={handleDepartmentChange}
                options={departmentOptions}
                placeholder="Select department"
              />
              {/* CDD to Clinic — Action Required + Assign to Center */}
              {isCDDToClinics && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className={labelClass}>Action Required <span className="text-destructive">*</span></label>
                    <textarea rows={2} required value={actionRequired} onChange={(e) => setActionRequired(e.target.value)} className={cn(inputClass, "resize-none")} placeholder="Describe the action required..." />
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">Assign to Center</span>
                    </div>
                    <div>
                      <label className={labelClass}>Assigned To (Center) <span className="text-destructive">*</span></label>
                      <ComboBox
                        value={assignedCenter}
                        onChange={handleAssignedCenterChange}
                        options={apiCenters.map((c) => c.name)}
                        placeholder="Select center"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Center Manager {cddCmEmail && <span className="text-xs text-emerald-600 ml-1">(Auto-filled)</span>}</label>
                        <input type="text" value={cddCmEmail} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed")} placeholder="Auto-filled on center selection" />
                      </div>
                      <div>
                        <label className={labelClass}>AOM {cddAomEmail && <span className="text-xs text-emerald-600 ml-1">(Auto-filled)</span>}</label>
                        <input type="text" value={cddAomEmail} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed")} placeholder="Auto-filled on center selection" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Title <span className="text-destructive">*</span></label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Brief description of the issue" />
            </div>

            <div>
              <label className={labelClass}>Complete Issue Description <span className="text-destructive">*</span></label>
              <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, "resize-none")} placeholder="Detailed description of the issue..." />
            </div>

            {/* Category / Sub-Category - for non-Zenoti departments */}
            {!isZenoti && (
              <div className={cn("grid gap-3", (isCDDToClinics || isCDDClinic || isQualityAudit) ? "grid-cols-2" : "grid-cols-3")}>
                <div>
                  <label className={labelClass}>{isCDDClinic ? "Type" : "Category"}</label>
                  <ComboBox
                    value={category}
                    onChange={(val) => { handleCategoryChange(val); if (val !== "others") setCustomType(""); }}
                    options={categoryOptions}
                    placeholder={isCDDClinic ? "Select type" : "Select category"}
                  />
                  {isCDDClinic && category === "others" && (
                    <input type="text" value={customType} onChange={(e) => setCustomType(e.target.value)}
                      className={cn(inputClass, "mt-2")} placeholder="Enter custom type..." />
                  )}
                </div>
                <div>
                  <label className={labelClass}>{isCDDClinic ? "Category" : "Sub-Category"}</label>
                  <ComboBox
                    value={subCategory}
                    onChange={(val) => { handleSubCategoryChange2(val); if (val !== "others") setCustomCategory(""); }}
                    options={subCategoryOptions}
                    placeholder={isCDDClinic ? "Select category" : "Select sub-category"}
                  />
                  {isCDDClinic && subCategory === "others" && (
                    <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                      className={cn(inputClass, "mt-2")} placeholder="Enter custom category..." />
                  )}
                </div>
                {!isQualityAudit && !isCDDToClinics && !isCDDClinic && (
                <div>
                  <label className={labelClass}>Child Category</label>
                  <ComboBox
                    value={childCategory}
                    onChange={(val) => setChildCategory(val)}
                    options={childCategoryOptions}
                    placeholder="Select child category"
                  />
                </div>
                )}
              </div>
            )}
 
            {/* Zenoti mandatory fields */}
            {isZenoti && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Zenoti - Mandatory Fields</span>
                </div>
 
                {/* Category / Sub-Category / Child Category inside Zenoti block */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Category <span className="text-destructive">*</span></label>
                    <ComboBox
                      value={category}
                      onChange={handleCategoryChange}
                      options={categoryOptions}
                      placeholder="Select category"
                      error={errField(category)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Sub-Category <span className="text-destructive">*</span></label>
                    <ComboBox
                      value={subCategory}
                      onChange={handleSubCategoryChange2}
                      options={subCategoryOptions}
                      placeholder="Select sub-category"
                      error={errField(subCategory)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Child Category <span className="text-destructive">*</span></label>
                    <ComboBox
                      value={childCategory}
                      onChange={(val) => setChildCategory(val)}
                      options={childCategoryOptions}
                      placeholder="Select child category"
                      error={errField(childCategory)}
                    />
                  </div>
                </div>
 
                {/* Location */}
                <div>
                  <label className={labelClass}>Location (Clinic) <span className="text-destructive">*</span>{cmCenterName && <span className="text-xs text-emerald-600 ml-1">(Auto-filled)</span>}</label>
                  {cmCenterName ? (
                    <input
                      type="text"
                      value={zenotiFields.location}
                      readOnly
                      className={cn(inputClass, "bg-muted cursor-not-allowed")}
                    />
                  ) : (
                    <ComboBox
                      value={zenotiFields.location}
                      onChange={(val) => setZenotiFields({ ...zenotiFields, location: val })}
                      options={centerOptions}
                      placeholder="Select clinic location"
                      error={errField(zenotiFields.location)}
                    />
                  )}
                </div>
 
                {/* Client & Invoice details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Client Mobile No <span className="text-destructive">*</span></label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={zenotiFields.mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setZenotiFields({ ...zenotiFields, mobileNumber: val });
                      }}
                      className={cn(inputClass, errField(zenotiFields.mobileNumber) && "border-destructive ring-1 ring-destructive/30")}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Client ID <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={zenotiFields.customerId}
                      onChange={(e) => setZenotiFields({ ...zenotiFields, customerId: e.target.value })}
                      className={cn(inputClass, errField(zenotiFields.customerId) && "border-destructive ring-1 ring-destructive/30")}
                      placeholder="e.g. BN01C2334"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Client Name <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={zenotiFields.customerName}
                      onChange={(e) => setZenotiFields({ ...zenotiFields, customerName: e.target.value })}
                      className={cn(inputClass, errField(zenotiFields.customerName) && "border-destructive ring-1 ring-destructive/30")}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Billed By <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={zenotiFields.billedBy}
                      onChange={(e) => setZenotiFields({ ...zenotiFields, billedBy: e.target.value })}
                      className={cn(inputClass, errField(zenotiFields.billedBy) && "border-destructive ring-1 ring-destructive/30")}
                      placeholder="Enter billed by"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Invoice No <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={zenotiFields.invoiceNo}
                      onChange={(e) => setZenotiFields({ ...zenotiFields, invoiceNo: e.target.value })}
                      className={cn(inputClass, errField(zenotiFields.invoiceNo) && "border-destructive ring-1 ring-destructive/30")}
                      placeholder="e.g. HYDBNH7711"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Invoice Date <span className="text-destructive">*</span></label>
                    <input
                      type="date"
                      value={zenotiFields.invoiceDate}
                      onChange={(e) => setZenotiFields({ ...zenotiFields, invoiceDate: e.target.value })}
                      className={cn(inputClass, errField(zenotiFields.invoiceDate) && "border-destructive ring-1 ring-destructive/30")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <input
                      type="text"
                      value={zenotiFields.amount}
                      onChange={(e) => setZenotiFields({ ...zenotiFields, amount: e.target.value })}
                      className={inputClass}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
 
              </div>
            )}
 
 
            {/* Priority & Center — hidden for CDD→Clinic */}
            {!isCDDToClinics && (
              <div className={cn("grid gap-3", isZenoti ? "grid-cols-1" : "grid-cols-2")}>
                <div>
                  <label className={labelClass}>Priority <span className="text-destructive">*</span></label>
                  <ComboBox
                    value={priority}
                    onChange={(val) => setPriority(val)}
                    options={category.toLowerCase() === "zenoti-finance" ? ["Critical"] : ["High", "Medium", "Low"]}
                    placeholder={matchingServiceTitle ? `Suggested: ${matchingServiceTitle.priority}` : "Select priority"}
                  />
                </div>
                {!isZenoti && (
                  <div>
                    <label className={labelClass}>Center <span className="text-destructive">*</span>{cmCenterName && <span className="text-xs text-emerald-600 ml-1">(Auto-filled)</span>}</label>
                    {cmCenterName ? (
                      <input
                        type="text"
                        value={center}
                        readOnly
                        className={cn(inputClass, "bg-muted cursor-not-allowed")}
                      />
                    ) : (
                      <ComboBox
                        value={center}
                        onChange={(val) => setCenter(val === "Select All" ? "All Centers" : val)}
                        options={centerOptions}
                        placeholder="Select center"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={labelClass}>Attachment</label>
              <input type="file" className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80" />
            </div>

            {/* Validation alert popup */}
            {showAlert && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs font-medium text-destructive">Please fill all mandatory Zenoti fields before submitting.</p>
                <button type="button" onClick={() => setShowAlert(false)} className="ml-auto text-destructive/60 hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
 
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(""); setDescription(""); setDepartment(""); setCategory("");
                  setSubCategory(""); setPriority(""); setCenter(cmCenterName || "");
                  setZenotiFields(cmCenterName ? { ...emptyZenotiFields, location: cmCenterName } : emptyZenotiFields); setShowAlert(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Submitting..." : editMode ? "Modify" : "Submit Ticket"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
 
export default RaiseTicketModal;