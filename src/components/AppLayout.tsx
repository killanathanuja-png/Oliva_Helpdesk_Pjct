import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import olivaLogo from "@/assets/oliva-logo.png";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifications } from "@/data/dummyData";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Tickets", icon: Ticket, path: "/tickets" },
  { label: "Approvals", icon: ShieldCheck, path: "/approvals" },
  {
    label: "Admin",
    icon: Settings,
    children: [
      { label: "Users", icon: Users, path: "/admin/users" },
      { label: "Departments", icon: Building2, path: "/admin/departments" },
      { label: "Roles", icon: ShieldCheck, path: "/admin/roles" },
      { label: "Centers", icon: MapPin, path: "/admin/centers" },
      { label: "SLA Config", icon: Clock, path: "/admin/sla" },
    ],
  },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActive = (path: string) => location.pathname === path;
  const isAdminActive = location.pathname.startsWith("/admin");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center border-b border-sidebar-border", collapsed ? "px-3 py-4 justify-center" : "px-5 py-4")}>
          <img
            src={olivaLogo}
            alt="Oliva Clinic"
            className={cn("transition-all", collapsed ? "h-8 w-8 object-contain" : "h-10")}
          />
          {!collapsed && <span className="ml-2 text-xs font-medium text-sidebar-muted uppercase tracking-widest">ITSM</span>}
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
                      ? "text-sidebar-primary-foreground bg-sidebar-accent"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
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
        <div className="hidden lg:flex border-t border-sidebar-border p-2">
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
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 lg:px-6 h-14">
          <button className="lg:hidden p-2 -ml-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              {location.pathname === "/" && "Dashboard"}
              {location.pathname === "/tickets" && "Ticket Management"}
              {location.pathname === "/approvals" && "Pending Approvals"}
              {location.pathname.startsWith("/admin") && "Administration"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                RK
              </div>
              {/* Desktop only */}
              <div className="hidden md:block">
                <p className="text-xs font-medium leading-none">Rajesh Kumar</p>
                <p className="text-[10px] text-muted-foreground">Admin</p>
              </div>
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
