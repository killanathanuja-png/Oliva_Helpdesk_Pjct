import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminLikeRole } from "@/lib/roles";
import olivaLogo from "@/assets/oliva-logo.png";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await authApi.login(form.username, form.password);
      localStorage.setItem("oliva_token", access_token);
      localStorage.setItem("oliva_logged_in", "true");
      // Fetch user profile
      const user = await authApi.me();
      localStorage.setItem("oliva_user", JSON.stringify(user));
      navigate("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary">
      {/* Oliva teal gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #1A6B6A 0%, #00B7AE 50%, #1A6B6A 100%)" }}
      />
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-white/8 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <img src={olivaLogo} alt="Oliva" className="h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to Oliva Help Desk</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter your username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #00B7AE, #1A6B6A)",
                boxShadow: "0 8px 24px rgba(0,183,174,0.3)",
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">Oliva Help Desk &copy; 2026. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
