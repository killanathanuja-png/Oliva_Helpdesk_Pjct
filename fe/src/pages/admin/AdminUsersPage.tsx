import { useState, useRef, useEffect } from "react";
import { centers as dummyCenters, roles as dummyRoles, departments as dummyDepartments } from "@/data/dummyData";
import type { User } from "@/data/dummyData";
import { usersApi, departmentsApi, centersApi, rolesApi, designationsApi, adminUsersApi } from "@/lib/api";
import type { ApiUser, ApiAdminUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Download, Search, Upload, Eye, EyeOff, ArrowLeft, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/lib/toast";

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

interface MultiSelectProps {
  value: string; // comma-separated
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}

const MultiSelectComboBox = ({ value, onChange, options, placeholder }: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
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

  const realOptions = options.filter((o) => o !== "Select All");
  const allSelected = realOptions.length > 0 && realOptions.every((o) => selected.includes(o));

  const toggleItem = (item: string) => {
    if (item === "Select All") {
      // If all are selected, deselect all; otherwise select all
      onChange(allSelected ? "" : realOptions.join(", "));
      return;
    }
    const newSelected = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    onChange(newSelected.filter((s) => s !== "Select All").join(", "));
  };

  const displayText = selected.length > 0 ? selected.join(", ") : "";

  return (
    <div className="relative" ref={ref}>
      <div className="relative cursor-pointer" onClick={() => { setOpen(!open); setSearch(""); }}>
        <input
          type="text"
          value={open ? search : displayText}
          onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
          placeholder={displayText || placeholder}
          className="w-full px-3 py-2 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          readOnly={!open}
        />
        <svg className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {selected.length > 0 && !open && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
              {item}
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleItem(item); }} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((item) => {
            const isChecked = item === "Select All" ? allSelected : selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleItem(item)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2",
                  isChecked && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0", isChecked ? "bg-primary border-primary" : "border-border")}>
                  {isChecked && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                {item}
              </button>
            );
          }) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};


interface LocalUser extends User {
  employeeId: string;
  mapLevelAccess: string;
  designation: string;
  entity: string;
  vertical: string;
  costcenter: string;
  gender: string;
  mobile: string;
  reportingTo: string;
  grade: string;
  employeeType: string;
  city: string;
  employeeDob: string;
  employeeDoj: string;
  lwd: string;
  effectiveDate: string;
  remarks: string;
  managedCenters: string[];
}

function apiUserToUser(a: ApiUser): LocalUser {
  return {
    id: a.code,
    employeeId: a.employee_id ?? "",
    name: a.name,
    email: a.email,
    role: (a.role as User["role"]) ?? "Employee",
    mapLevelAccess: a.map_level_access ?? "",
    designation: a.designation ?? "",
    entity: a.entity ?? "",
    vertical: a.vertical ?? "",
    costcenter: a.costcenter ?? "",
    department: a.department ?? "",
    center: a.center ?? "",
    gender: a.gender ?? "",
    mobile: a.mobile ?? "",
    reportingTo: a.reporting_to ?? "",
    grade: a.grade ?? "",
    employeeType: a.employee_type ?? "",
    city: a.city ?? "",
    employeeDob: a.employee_dob ?? "",
    employeeDoj: a.employee_doj ?? "",
    lwd: a.lwd ?? "",
    effectiveDate: a.effective_date ?? "",
    remarks: a.remarks ?? "",
    avatar: a.avatar ?? a.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    status: (a.status as "Active" | "Inactive") ?? "Active",
    lastLogin: a.last_login ?? "",
    managedCenters: a.managed_centers ?? [],
  };
}

const AdminUsersPage = () => {
  const { showToast } = useToast();
  const _storedUser = localStorage.getItem("oliva_user");
  const _parsedUser = _storedUser ? JSON.parse(_storedUser) : null;
  const _userDept = _parsedUser?.department || "";
  const _userRole = _parsedUser?.role || "";
  const _isQualityHead = _userDept.toLowerCase().includes("quality");
  const _isZenotiUser = _userRole.toLowerCase().includes("zenoti") || _userDept.toLowerCase() === "zenoti";
  const _isCddAdmin = _userRole.toLowerCase().includes("cdd admin");
  const _isAdminDept = _userRole.toLowerCase().includes("admin department");
  const _isITUser = _userRole.toLowerCase() === "it" || _userDept.toLowerCase() === "it department";
  const _isFinanceUser = _userRole.toLowerCase() === "finance" || _userRole.toLowerCase() === "finance head" || _userDept.toLowerCase() === "finance";
  const _isDeptFiltered = _isQualityHead || _isZenotiUser || _isCddAdmin || _isAdminDept || _isITUser || _isFinanceUser;
  const [data, setData] = useState<LocalUser[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "", designation: "", center: "", department: "", gender: "", mobile: "", reportingTo: "", employeeId: "", mapLevelAccess: "", entity: "", vertical: "", costcenter: "", grade: "", employeeType: "", city: "", employeeDob: "", employeeDoj: "", lwd: "", effectiveDate: "", remarks: "", status: "Active" });
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roleOptions, setRoleOptions] = useState<string[]>(dummyRoles.map((r) => r.name));
  const [centerOptions, setCenterOptions] = useState<string[]>(dummyCenters.map((c) => c.name));
  const [centerIdMap, setCenterIdMap] = useState<Record<string, number>>({});
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(dummyDepartments.map((d) => d.name));
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);

      // Fetch users
      try {
        if (_isAdminDept) {
          // Admin Department: fetch from admin_users table
          const adminUsers = await adminUsersApi.list();
          if (!cancelled) {
            setData(adminUsers.map((a: ApiAdminUser): LocalUser => ({
              id: a.code,
              employeeId: a.code,
              name: a.name,
              email: a.email,
              role: a.role || "Helpdesk Admin",
              mapLevelAccess: a.map_level_access || "",
              designation: "",
              entity: "",
              vertical: "",
              costcenter: "",
              department: a.department || "",
              center: a.center_name || "",
              gender: "",
              mobile: a.mobile || "",
              reportingTo: "",
              grade: "",
              employeeType: a.employee_type || "",
              city: a.city || "",
              employeeDob: "",
              employeeDoj: "",
              lwd: "",
              effectiveDate: "",
              remarks: "",
              managedCenters: [],
              avatar: a.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
              status: (a.status as "Active" | "Inactive") || "Active",
              lastLogin: "",
            })));
            const map: Record<string, number> = {};
            adminUsers.forEach((u) => { map[u.code] = u.id; });
            setIdMap(map);
          }
        } else {
          let apiUsers = await usersApi.list();
          if (_isITUser) {
            apiUsers = apiUsers.filter((u) => (u.department || "") === "IT Department");
          } else if (_isZenotiUser) {
            apiUsers = apiUsers.filter((u) => (u.department || "") === "Zenoti");
          } else if (_isFinanceUser) {
            apiUsers = apiUsers.filter((u) => (u.department || "") === "Finance" || (u.department || "") === "Zenoti");
          } else if (_isDeptFiltered) {
            apiUsers = apiUsers.filter((u) => (u.department || "").toLowerCase().includes(_userDept.toLowerCase().split(" ")[0]));
          }
          if (!cancelled) {
            setData(apiUsers.map(apiUserToUser));
            const map: Record<string, number> = {};
            apiUsers.forEach((u) => { map[u.code] = u.id; });
            setIdMap(map);
          }
        }
      } catch {
        // API failed — keep existing data, only use dummy if we have nothing
        if (!cancelled) {
          setData((prev) => prev.length > 0 ? prev : []);
        }
      }

      // Fetch departments
      try {
        const apiDepts = await departmentsApi.list();
        if (!cancelled) setDepartmentOptions(apiDepts.length > 0 ? [...apiDepts.map((d) => d.name), "Others"] : [...dummyDepartments.map((d) => d.name), "Others"]);
      } catch {
        if (!cancelled) setDepartmentOptions([...dummyDepartments.map((d) => d.name), "Others"]);
      }

      // Fetch centers
      try {
        const apiCenters = await centersApi.list();
        if (!cancelled) {
          setCenterOptions(apiCenters.length > 0 ? ["Select All", ...apiCenters.map((c) => c.name)] : ["Select All", ...dummyCenters.map((c) => c.name)]);
          const cMap: Record<string, number> = {};
          apiCenters.forEach((c) => { cMap[c.name] = c.id; });
          setCenterIdMap(cMap);
        }
      } catch {
        if (!cancelled) setCenterOptions(["Select All", ...dummyCenters.map((c) => c.name)]);
      }

      // Fetch roles
      try {
        const apiRoles = await rolesApi.list();
        if (!cancelled) setRoleOptions(apiRoles.length > 0 ? apiRoles.map((r) => r.name) : dummyRoles.map((r) => r.name));
      } catch {
        if (!cancelled) setRoleOptions(dummyRoles.map((r) => r.name));
      }

      // Fetch designations
      try {
        const apiDesigs = await designationsApi.list();
        if (!cancelled) setDesignationOptions(apiDesigs.map((d) => d.name));
      } catch {
        // ignore
      }

      if (!cancelled) setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const refreshUsers = async () => {
    if (_isAdminDept) {
      try {
        const adminUsers = await adminUsersApi.list();
        setData(adminUsers.map((a: ApiAdminUser): LocalUser => ({
          id: a.code, employeeId: a.code, name: a.name, email: a.email,
          role: a.role || "Helpdesk Admin", mapLevelAccess: a.map_level_access || "",
          designation: "", entity: "", vertical: "", costcenter: "",
          department: a.department || "", center: a.center_name || "",
          gender: "", mobile: a.mobile || "", reportingTo: "", grade: "",
          employeeType: a.employee_type || "", city: a.city || "",
          employeeDob: "", employeeDoj: "", lwd: "", effectiveDate: "", remarks: "",
          managedCenters: [],
          avatar: a.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
          status: (a.status as "Active" | "Inactive") || "Active", lastLogin: "",
        })));
        const map: Record<string, number> = {};
        adminUsers.forEach((u) => { map[u.code] = u.id; });
        setIdMap(map);
      } catch { /* ignore */ }
    } else {
      try {
        const apiUsers = await usersApi.list();
        setData(apiUsers.map(apiUserToUser));
        const map: Record<string, number> = {};
        apiUsers.forEach((u) => { map[u.code] = u.id; });
        setIdMap(map);
      } catch { /* ignore */ }
    }
  };

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("Name");
    if (!form.email.trim()) missing.push("Email");
    if (!editingId && !form.password.trim() && !_isAdminDept) missing.push("Password");
    if (!_isAdminDept && !form.role) missing.push("Role");
    if (!_isAdminDept && !form.department.trim()) missing.push("Department");
    if (missing.length > 0) {
      setFormError(`Please fill: ${missing.join(", ")}`);
      return;
    }
    // Validate email domain — only @olivaclinic.com allowed
    if (form.email.trim() && !form.email.trim().toLowerCase().endsWith("@olivaclinic.com")) {
      setFormError("Only @olivaclinic.com email addresses are allowed.");
      return;
    }
    setFormError("");

    if (_isAdminDept) {
      // Admin Department: use admin_users API
      const numericId = editingId ? idMap[editingId] : null;
      try {
        if (editingId && numericId) {
          await adminUsersApi.update(numericId, {
            name: form.name, email: form.email, role: form.role || "Helpdesk Admin",
            department: form.department || "Help desk", center_name: form.center,
            city: form.city, map_level_access: form.mapLevelAccess || null,
            mobile: form.mobile, employee_type: form.employeeType, status: form.status,
          });
          showToast("User updated successfully");
        } else {
          await adminUsersApi.create({
            name: form.name, email: form.email, password: form.password || "oliva@123",
            role: form.role || "Helpdesk Admin", department: form.department || "Help desk",
            center_name: form.center, city: form.city,
            map_level_access: form.mapLevelAccess || null,
            mobile: form.mobile, employee_type: form.employeeType,
          });
          showToast("User created successfully");
        }
        await refreshUsers();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setFormError(`Failed: ${msg}`);
        showToast("Failed", "error");
        return;
      }
      setShowModal(false); setEditingId(null);
      setForm({ name: "", email: "", password: "", role: "", designation: "", center: "", department: "", gender: "", mobile: "", reportingTo: "", employeeId: "", mapLevelAccess: "", entity: "", vertical: "", costcenter: "", grade: "", employeeType: "", city: "", employeeDob: "", employeeDoj: "", lwd: "", effectiveDate: "", remarks: "", status: "Active" });
      return;
    }

    if (editingId) {
      const numericId = idMap[editingId];
      if (numericId) {
        try {
          // Parse selected centers from comma-separated string
          const selectedCenterNames = form.center.split(",").map((s) => s.trim()).filter(Boolean);
          const primaryCenter = selectedCenterNames[0] || "";

          await usersApi.update(numericId, {
            name: form.name, email: form.email, role: form.role, designation: form.designation,
            department: form.department, center: primaryCenter, gender: form.gender, mobile: form.mobile,
            reporting_to: form.reportingTo, map_level_access: form.mapLevelAccess, entity: form.entity,
            vertical: form.vertical, costcenter: form.costcenter, grade: form.grade,
            employee_type: form.employeeType, city: form.city, employee_dob: form.employeeDob,
            employee_doj: form.employeeDoj, lwd: form.lwd, effective_date: form.effectiveDate,
            remarks: form.remarks, status: form.status,
          });

          // Save managed centers (map center names to IDs)
          if (selectedCenterNames.length > 0 && centerIdMap) {
            const centerIds = selectedCenterNames
              .map((name) => centerIdMap[name])
              .filter((id): id is number => id !== undefined);
            if (centerIds.length > 0) {
              await usersApi.setManagedCenters(numericId, centerIds);
            }
          }

          showToast("User updated successfully");
          await refreshUsers();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setFormError(`Failed to update user: ${msg}`);
          showToast("Failed to update User", "error");
          return;
        }
      } else {
        setFormError("Cannot find user to update. Please refresh and try again.");
        return;
      }
    } else {
      // New user -> call API
      try {
        await usersApi.create({
          name: form.name, email: form.email, password: form.password,
          role: form.role, designation: form.designation, department: form.department,
          center: form.center, gender: form.gender, mobile: form.mobile,
          reporting_to: form.reportingTo, employee_id: form.employeeId,
          map_level_access: form.mapLevelAccess, entity: form.entity, vertical: form.vertical,
          costcenter: form.costcenter, grade: form.grade, employee_type: form.employeeType,
          city: form.city, employee_dob: form.employeeDob, employee_doj: form.employeeDoj,
          lwd: form.lwd, effective_date: form.effectiveDate, remarks: form.remarks, status: form.status,
        });
        showToast("User created successfully");
        await refreshUsers();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setFormError(`Failed to create user: ${msg}`);
        showToast("Failed to create User", "error");
        return;
      }
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", email: "", password: "", role: "", designation: "", center: "", department: "", gender: "", mobile: "", reportingTo: "", employeeId: "", mapLevelAccess: "", entity: "", vertical: "", costcenter: "", grade: "", employeeType: "", city: "", employeeDob: "", employeeDoj: "", lwd: "", effectiveDate: "", remarks: "", status: "Active" });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setShowPassword(false);
    setForm({ name: "", email: "", password: "", role: "", designation: "", center: "", department: "", gender: "", mobile: "", reportingTo: "", employeeId: "", mapLevelAccess: "", entity: "", vertical: "", costcenter: "", grade: "", employeeType: "", city: "", employeeDob: "", employeeDoj: "", lwd: "", effectiveDate: "", remarks: "", status: "Active" });
    setFormError("");
  };

  const handleEdit = (u: LocalUser) => {
    setEditingId(u.id);
    // For AOM users, show managed centers; otherwise show primary center
    const centerVal = u.managedCenters && u.managedCenters.length > 0
      ? u.managedCenters.join(", ")
      : u.center;
    setForm({ name: u.name, email: u.email, password: "", role: u.role, designation: u.designation, center: centerVal, department: u.department, gender: u.gender, mobile: u.mobile, reportingTo: u.reportingTo, employeeId: u.employeeId, mapLevelAccess: u.mapLevelAccess, entity: u.entity, vertical: u.vertical, costcenter: u.costcenter, grade: u.grade, employeeType: u.employeeType, city: u.city, employeeDob: u.employeeDob, employeeDoj: u.employeeDoj, lwd: u.lwd, effectiveDate: u.effectiveDate, remarks: u.remarks, status: u.status });
    setShowModal(true);
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const result = await usersApi.uploadExcel(file);
      setUploadMsg(`${result.message}`);
      showToast(result.message);
      // Refresh user list from response
      if (result.users && result.users.length > 0) {
        setData(result.users.map(apiUserToUser));
        const map: Record<string, number> = {};
        result.users.forEach((u) => { map[u.code] = u.id; });
        setIdMap(map);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadMsg(`Error: ${msg}`);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirm) return;
    const numericId = idMap[deleteConfirm];
    if (numericId) {
      try {
        if (_isAdminDept) {
          await adminUsersApi.delete(numericId);
        } else {
          await usersApi.updateStatus(numericId, "Inactive");
        }
      } catch { /* fall through to local update */ }
    }
    showToast("User deleted successfully");
    setDeleteConfirm(null);
    await refreshUsers();
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
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0 flex items-center gap-3">

          <div>
          <h1 className="text-xl font-bold font-display">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Total Users: <span className="font-semibold text-foreground">{data.filter((u) => u.status !== "Inactive").length}</span></p>
          </div>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role, department..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2" title="Refresh"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button
            onClick={() => {
              const exportData = data.filter((u) => u.status !== "Inactive").map((u) => ({
                "User ID": u.employeeId || u.id,
                "User Name": u.name,
                "Role Name": u.role,
                "Email ID": u.email,
                "Map Level Access": u.mapLevelAccess,
                "Gender": u.gender,
                "Designation": u.designation,
                "Entity": u.entity,
                "Vertical": u.vertical,
                "Costcenter": u.costcenter,
                "Location": u.center,
                "Department": u.department,
                "Mobile No": u.mobile,
                "Reporting To": u.reportingTo,
                "Grade": u.grade,
                "Employee Type": u.employeeType,
                "Employee DOB": u.employeeDob,
                "Employee DOJ": u.employeeDoj,
                "LWD": u.lwd,
                "Effective Date": u.effectiveDate,
                "Remarks": u.remarks,
                "Status": u.status,
              }));
              exportToExcel(exportData, "Users", "Users");
            }}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleUploadExcel} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload Excel"}
          </button>
          <button
            onClick={() => { setEditingId(null); setForm({ name: "", email: "", password: "", role: "", designation: "", center: "", department: "", gender: "", mobile: "", reportingTo: "", employeeId: "", mapLevelAccess: "", entity: "", vertical: "", costcenter: "", grade: "", employeeType: "", city: "", employeeDob: "", employeeDoj: "", lwd: "", effectiveDate: "", remarks: "", status: "Active" }); setFormError(""); setShowModal(true); }}
            className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add User
          </button>
        </div>
      </div>
      {uploadMsg && (
        <div className={cn("px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between", uploadMsg.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success")}>
          <span>{uploadMsg}</span>
          <button onClick={() => setUploadMsg("")} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap">
              <th className="px-3 py-3 font-semibold">User ID</th>
              <th className="px-3 py-3 font-semibold">User Name</th>
              <th className="px-3 py-3 font-semibold">Location</th>
              <th className="px-3 py-3 font-semibold">Department</th>
              <th className="px-3 py-3 font-semibold">Role Name</th>
              <th className="px-3 py-3 font-semibold">Map Level Access</th>
              <th className="px-3 py-3 font-semibold">Email</th>
              <th className="px-3 py-3 font-semibold">Employee Type</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.filter((u) => {
              if (u.status === "Inactive") return false;
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q) ||
                u.department.toLowerCase().includes(q) ||
                u.center.toLowerCase().includes(q) ||
                u.employeeId.toLowerCase().includes(q) ||
                u.designation.toLowerCase().includes(q) ||
                u.city.toLowerCase().includes(q) ||
                u.mobile.toLowerCase().includes(q)
              );
            }).map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors whitespace-nowrap">
                <td className="px-3 py-2.5 font-mono text-xs text-primary font-semibold">{u.employeeId || u.id}</td>
                <td className="px-3 py-2.5 text-xs font-medium">{u.name}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.center || ""}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.department || ""}</td>
                <td className="px-3 py-2.5 text-xs">{u.role}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.mapLevelAccess || ""}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{u.employeeType || ""}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.status === "Active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(u.id)}
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

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-3xl mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold font-display">{editingId ? "Edit User" : "Add User"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">User ID</label>
                  <input type="text" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="Enter user ID"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">User Name <span className="text-destructive">*</span></label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name"
                    autoComplete="off" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email <span className="text-destructive">*</span></label>
                  <input type="text" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email address"
                    autoComplete="off" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password"
                        autoComplete="new-password" className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role <span className="text-destructive">*</span></label>
                  <MultiSelectComboBox value={form.role} onChange={(val) => setForm({ ...form, role: val })} options={roleOptions} placeholder="Select role(s)" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Map Level Access</label>
                  <select value={form.mapLevelAccess} onChange={(e) => setForm({ ...form, mapLevelAccess: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">-- Select --</option>
                    <option value="Can View">Can View</option>
                    <option value="Can View and Edit">Can View and Edit</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">-- Select --</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Designation</label>
                  <ComboBox value={form.designation} onChange={(val) => setForm({ ...form, designation: val })} options={designationOptions} placeholder="Select designation" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Entity</label>
                  <input type="text" value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} placeholder="Entity"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vertical</label>
                  <input type="text" value={form.vertical} onChange={(e) => setForm({ ...form, vertical: e.target.value })} placeholder="Vertical"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Costcenter</label>
                  <input type="text" value={form.costcenter} onChange={(e) => setForm({ ...form, costcenter: e.target.value })} placeholder="Costcenter"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Location</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Enter location"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Center Name</label>
                  <MultiSelectComboBox value={form.center} onChange={(val) => setForm({ ...form, center: val })} options={centerOptions} placeholder="Select center(s)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department <span className="text-destructive">*</span></label>
                  <ComboBox value={form.department} onChange={(val) => setForm({ ...form, department: val })} options={departmentOptions} placeholder="Select department" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mobile No</label>
                  <input type="tel" maxLength={10} value={form.mobile} onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 10); setForm({ ...form, mobile: val }); }} placeholder="Enter mobile number"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reporting To</label>
                  <input type="text" value={form.reportingTo} onChange={(e) => setForm({ ...form, reportingTo: e.target.value })} placeholder="Reporting manager"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Grade</label>
                  <input type="text" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Grade"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee Type</label>
                  <input type="text" value={form.employeeType} onChange={(e) => setForm({ ...form, employeeType: e.target.value })} placeholder="Employee type"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee DOB</label>
                  <input type="date" value={form.employeeDob} onChange={(e) => setForm({ ...form, employeeDob: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee DOJ</label>
                  <input type="date" value={form.employeeDoj} onChange={(e) => setForm({ ...form, employeeDoj: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">LWD</label>
                  <input type="date" value={form.lwd} onChange={(e) => setForm({ ...form, lwd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Effective Date</label>
                  <input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
                  <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            {formError && (
              <p className="px-6 text-sm text-destructive font-medium">{formError}</p>
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
                {editingId ? "Update User" : "Create User"}
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
                <h3 className="font-semibold">Delete User</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this user?</p>
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

export default AdminUsersPage;
