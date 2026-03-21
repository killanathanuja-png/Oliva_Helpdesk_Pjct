import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Building2, MapPin, ShieldCheck, Clock,
  Pencil, Save, X, Lock, Eye, EyeOff, Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import type { AuthUser } from "@/lib/api";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    authApi.me().then((u) => {
      setUser(u);
      setEditName(u.name);
      setEditEmail(u.email);
    }).catch(() => {
      // Fallback to localStorage
      const stored = localStorage.getItem("oliva_user");
      if (stored) setUser(JSON.parse(stored));
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) return;
    setSaving(true);
    setProfileMsg("");
    try {
      const updated = await authApi.updateProfile({ name: editName.trim(), email: editEmail.trim() });
      setUser(updated);
      localStorage.setItem("oliva_user", JSON.stringify(updated));
      setEditing(false);
      setProfileMsg("Profile updated successfully");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch {
      setProfileMsg("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwMsg("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwMsg("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setTimeout(() => setPwMsg(""), 3000);
    } catch {
      setPwError("Current password is incorrect");
    } finally {
      setChangingPw(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Unable to load profile.</p>
        <button onClick={() => navigate("/tickets")} className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>
      </div>
    );
  }

  const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="animate-fade-in max-w-[800px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold font-display">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-28 relative" style={{ background: "linear-gradient(135deg, rgba(1,178,184,0.9), rgba(1,150,155,0.85))" }}>
          <div className="absolute -bottom-10 left-6">
            <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-primary border-4 border-white">
              {initials}
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="pt-14 px-6 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">{user.role || "User"}</span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", user.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                  {user.status || "Active"}
                </span>
              </div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </button>
            )}
          </div>

          {/* Success message */}
          {profileMsg && (
            <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4 text-sm font-medium",
              profileMsg.includes("Failed") ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700"
            )}>
              <CheckCircle2 className="h-4 w-4" />
              {profileMsg}
            </div>
          )}

          {/* Profile fields */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <User className="h-3 w-3" /> Full Name
              </label>
              {editing ? (
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              ) : (
                <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60 min-h-[40px] flex items-center">
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <Mail className="h-3 w-3" /> Email
              </label>
              {editing ? (
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              ) : (
                <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60 min-h-[40px] flex items-center">
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
              )}
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <ShieldCheck className="h-3 w-3" /> Role
              </label>
              <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60 min-h-[40px] flex items-center">
                <span className="text-sm font-medium">{user.role || "User"}</span>
              </div>
            </div>

            {/* Department (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <Building2 className="h-3 w-3" /> Department
              </label>
              <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60 min-h-[40px] flex items-center">
                <span className="text-sm font-medium">{user.department || "—"}</span>
              </div>
            </div>

            {/* Center (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <MapPin className="h-3 w-3" /> Center
              </label>
              <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60 min-h-[40px] flex items-center">
                <span className="text-sm font-medium">{user.center || "—"}</span>
              </div>
            </div>

            {/* Employee Code (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <Clock className="h-3 w-3" /> Employee Code
              </label>
              <div className="px-3 py-2.5 rounded-lg bg-muted/30 border border-border/60 min-h-[40px] flex items-center">
                <span className="text-sm font-medium font-mono">{user.code}</span>
              </div>
            </div>
          </div>

          {/* Edit actions */}
          {editing && (
            <div className="flex items-center gap-2 mt-5">
              <button onClick={handleSaveProfile} disabled={saving || !editName.trim() || !editEmail.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Changes
              </button>
              <button onClick={handleCancelEdit} disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-l-4 border-l-transparent bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Security</h2>
          </div>
        </div>
        <div className="p-6">
          {/* Success / Error messages */}
          {pwMsg && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4 text-sm font-medium bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {pwMsg}
            </div>
          )}

          {!showPasswordForm ? (
            <button onClick={() => { setShowPasswordForm(true); setPwError(""); setPwMsg(""); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              <Lock className="h-4 w-4" /> Change Password
            </button>
          ) : (
            <div className="max-w-md space-y-4">
              {pwError && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive">
                  {pwError}
                </div>
              )}

              {/* Current password */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10"
                    placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10"
                    placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Confirm new password" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleChangePassword} disabled={changingPw}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {changingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />} Update Password
                </button>
                <button onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwError(""); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
