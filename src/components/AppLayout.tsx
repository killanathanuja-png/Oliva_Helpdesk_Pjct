import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import olivaLogo from "@/assets/oliva-logo.png";
import { authApi, authLogout } from "@/lib/api";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  ShieldCheck,
  MapPin,
  Clock,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Layers,
  GitBranch,
  FileText,
  DollarSign,
  Wrench,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllowedPaths } from "@/lib/roles";
import { notifications } from "@/data/dummyData";

interface AppLayoutProps {
  children: React.ReactNode;
}

const allNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Tickets", icon: Ticket, path: "/tickets" },
  { label: "Approvals", icon: ShieldCheck, path: "/approvals" },
  { label: "Finance Approvals", icon: DollarSign, path: "/finance-approvals" },
  { label: "Zenoti Requests", icon: Wrench, path: "/zenoti-requests" },
  { label: "SLA Report", icon: BarChart3, path: "/sla-report" },
  {
    label: "Masters",
    icon: Settings,
    children: [
      { label: "Users", icon: Users, path: "/admin/users" },
      { label: "Departments", icon: Building2, path: "/admin/departments" },
      { label: "Roles", icon: ShieldCheck, path: "/admin/roles" },
      { label: "Centers", icon: MapPin, path: "/admin/centers" },
      { label: "SLA Config", icon: Clock, path: "/admin/sla" },
      { label: "Categories", icon: Layers, path: "/admin/categories" },
      { label: "Subcategory", icon: GitBranch, path: "/admin/subcategories" },
      { label: "Child Category", icon: GitBranch, path: "/admin/child-categories" },
      { label: "Service Title", icon: FileText, path: "/admin/service-titles" },
      { label: "Login History", icon: Clock, path: "/admin/login-history" },
    ],
  },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Read logged-in user from localStorage
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(() => {
    const stored = localStorage.getItem("oliva_user");
    return stored ? JSON.parse(stored) : null;
  });
  const userName: string = user?.name || "User";
  const userRole: string = user?.role || "User";
  const userInitials: string = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  // Re-fetch user profile on mount so role changes are always reflected
  useEffect(() => {
    authApi.me().then((fresh) => {
      localStorage.setItem("oliva_user", JSON.stringify(fresh));
      setUser(fresh);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await authLogout(); } catch { /* ignore */ }
    localStorage.removeItem("oliva_logged_in");
    localStorage.removeItem("oliva_token");
    localStorage.removeItem("oliva_user");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;
  const isAdminActive = location.pathname.startsWith("/admin");

  // Filter nav items based on role
  const allowed = getAllowedPaths();
  const navItems = allNavItems.filter((item) => {
    if (item.children) {
      // Keep Masters group only if at least one child is allowed
      return item.children.some((c) => allowed.includes(c.path));
    }
    return allowed.includes(item.path!);
  }).map((item) => {
    if (item.children) {
      return { ...item, children: item.children.filter((c) => allowed.includes(c.path)) };
    }
    return item;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-white/20 transition-all duration-300 backdrop-blur-md",
          collapsed ? "w-[68px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "linear-gradient(180deg, rgba(1,178,184,0.95), rgba(1,150,155,0.9))" }}
      >
        {/* Logo */}
        <div className={cn("flex items-center justify-center border-b border-white/20", collapsed ? "px-3 py-4" : "px-5 py-6")}>
          <div className={cn("bg-white rounded-xl flex items-center justify-center transition-all", collapsed ? "p-1.5" : "px-4 py-2.5")}>
            <img
              src={olivaLogo}
              alt="Oliva Clinic"
              className={cn("transition-all", collapsed ? "h-10 w-10 object-contain" : "h-16")}
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className={cn(
                    "flex items-center w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isAdminActive
                      ? "text-white bg-white/15"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={cn("h-4 w-4 transition-transform", adminOpen && "rotate-90")} />
                    </>
                  )}
                </button>
                {adminOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                          isActive(child.path)
                            ? "text-sidebar-primary bg-sidebar-accent font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path!}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5",
                  isActive(item.path!)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          )}
        </nav>

        {/* Collapse button */}
        <div className="hidden lg:flex border-t border-white/20 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full rounded-md py-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 backdrop-blur-md border-b border-white/20" style={{ background: "linear-gradient(135deg, rgba(1,178,184,0.92), rgba(1,150,155,0.88))" }}>
          <button className="lg:hidden p-2 -ml-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-white/90">
              {location.pathname === "/" && "Dashboard"}
              {location.pathname.startsWith("/tickets") && "Ticket Management"}
              {location.pathname === "/approvals" && "Pending Approvals"}
              {location.pathname === "/finance-approvals" && "Finance Approvals"}
              {location.pathname === "/zenoti-requests" && "Zenoti Requests"}
              {location.pathname === "/sla-report" && "SLA Report"}
              {location.pathname.startsWith("/admin") && "Administration"}
              {location.pathname === "/profile" && "My Profile"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-white/15 transition-colors text-white/80 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl bg-card border border-border shadow-lg animate-slide-in">
                    <div className="p-3 border-b border-border">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                            !n.read && "bg-accent/30"
                          )}
                        >
                          <p className="text-xs font-semibold">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{n.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User avatar — clickable to profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/25 ml-1">
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/15 transition-colors"
                title="View Profile"
              >
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                  {userInitials}
                </div>
                {/* Desktop only */}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium leading-none text-white">{userName}</p>
                  <p className="text-[10px] text-white/70">{userRole}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="ml-1 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
