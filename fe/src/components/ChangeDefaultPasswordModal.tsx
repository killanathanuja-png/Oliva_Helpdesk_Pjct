import { useState, useEffect } from "react";
import { authApi, authLogout } from "@/lib/api";
import { Lock, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

const FLAG_KEY = "oliva_must_change_password";

const ChangeDefaultPasswordModal = () => {
  const [show, setShow] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem(FLAG_KEY) === "true");
  }, []);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPwd.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPwd === "oliva@123") { setError("New password cannot be the default password."); return; }
    if (newPwd !== confirmPwd) { setError("Passwords do not match."); return; }
    setSaving(true);
    try {
      await authApi.changePassword("oliva@123", newPwd);
      localStorage.removeItem(FLAG_KEY);
      setShow(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to change password.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    localStorage.removeItem(FLAG_KEY);
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-amber-900">Update Your Password</h2>
            <p className="text-xs text-amber-800 mt-1">
              You're signed in with the default password. Please set a new password to continue using your account.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPwd ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #00B7AE, #1A6B6A)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeDefaultPasswordModal;
