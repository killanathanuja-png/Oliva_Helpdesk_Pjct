import { useState, useEffect } from "react";
import { isSuperRole } from "@/lib/roles";
import { dashboardApi } from "@/lib/api";
import type { ApiDashboardStats } from "@/lib/api";
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Loader2,
  ThumbsUp,
  MessageSquare,
  HelpCircle,
  Inbox,
  RotateCcw,
  Ban,
  ShieldCheck,
  Timer,
  Activity,
  BarChart3,
  Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  Critical: "bg-destructive",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-muted-foreground",
};

const statusColors: Record<string, string> = {
  Open: "bg-info text-info-foreground",
  "In Progress": "bg-warning text-warning-foreground",
  "Pending Approval": "bg-accent text-accent-foreground",
  Approved: "bg-emerald-100 text-emerald-700",
  Acknowledged: "bg-blue-100 text-blue-700",
  "Awaiting User Inputs": "bg-amber-100 text-amber-700",
  "User Inputs Received": "bg-purple-100 text-purple-700",
  "Follow Up": "bg-orange-100 text-orange-700",
  Resolved: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
  Rejected: "bg-destructive text-destructive-foreground",
};

const pieColors = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)", "hsl(210, 80%, 55%)", "hsl(200, 10%, 45%)"];
const statusChartColors = [
  "hsl(210, 80%, 55%)", // Open - blue
  "hsl(38, 92%, 50%)",  // In Progress - amber
  "hsl(280, 60%, 55%)", // Pending Approval - purple
  "hsl(145, 65%, 42%)", // Approved - green
  "hsl(200, 70%, 50%)", // Acknowledged - light blue
  "hsl(30, 80%, 55%)",  // Awaiting User - orange
  "hsl(270, 50%, 55%)", // User Inputs Received - violet
  "hsl(20, 70%, 50%)",  // Follow Up - dark orange
  "hsl(145, 70%, 40%)", // Resolved - dark green
  "hsl(0, 0%, 55%)",    // Closed - gray
  "hsl(0, 72%, 55%)",   // Rejected - red
];

const SLAGauge = ({ pct }: { pct: number }) => {
  const radius = 52;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 90 ? "hsl(145, 65%, 42%)" : pct >= 70 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 55%)";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-muted-foreground font-medium">Compliance</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const storedUser = localStorage.getItem("oliva_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";
  const userRole = user?.role || "User";
  const userDept = user?.department || "";

  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    // Determine dashboard filter based on role
    const getParams = (): { department?: string; user_id?: number } | undefined => {
      if (isSuperRole(userRole)) return undefined; // see all

      const roles = userRole.split(",").map((r: string) => r.trim());

      // Zenoti-related roles see Zenoti department
      const zenotiRoles = ["Zenoti Team", "Area Operations Manager", "Area Operations Manager Head", "Finance", "Finance Head"];
      if (roles.some((r: string) => zenotiRoles.includes(r))) return { department: "Zenoti" };

      // Department heads/managers see their department tickets
      const deptManagerRoles = ["Help Desk Admin", "Helpdesk In-charge", "L1 Manager", "L2 Manager", "Manager"];
      if (roles.some((r: string) => deptManagerRoles.includes(r))) return undefined; // see all

      // Users with a department (like Quality & Audit) see department tickets
      if (userDept) {
        // Quality & Audit also sees "Quality" department
        if (userDept.toLowerCase().includes("quality")) return { department: "Quality" };
        return { department: userDept };
      }

      // Employee/Others see only their own tickets
      return { user_id: userId };
    };

    dashboardApi.stats(getParams())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userRole, userDept, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load dashboard data.</p>
      </div>
    );
  }

  const pieData = Object.entries(stats.tickets_by_priority).map(([name, value]) => ({ name, value }));
  const statusPieData = (stats.tickets_by_status || []).filter((s) => s.count > 0);

  const activeTickets = stats.total_tickets - stats.resolved - stats.closed;

  const summaryCards = [
    { label: "Total Tickets", value: stats.total_tickets, icon: Ticket, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-l-primary" },
    { label: "Active", value: activeTickets, icon: Activity, color: "text-info", bgColor: "bg-info/10", borderColor: "border-l-info" },
    { label: "Resolved", value: stats.resolved + stats.closed, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10", borderColor: "border-l-success" },
  ];

  const statusCards = [
    { label: "Open", value: stats.open_tickets, icon: AlertTriangle, color: "text-info", bgColor: "bg-info/10" },
    { label: "In Progress", value: stats.in_progress, icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
    { label: "Pending Approval", value: stats.pending_approval, icon: ShieldAlert, color: "text-accent-foreground", bgColor: "bg-accent" },
    { label: "Approved", value: stats.approved, icon: ThumbsUp, color: "text-emerald-600", bgColor: "bg-emerald-100" },
    { label: "Acknowledged", value: stats.acknowledged, icon: CheckCircle2, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "Awaiting User Inputs", value: stats.awaiting_user_inputs, icon: HelpCircle, color: "text-amber-600", bgColor: "bg-amber-100" },
    { label: "User Inputs Received", value: stats.user_inputs_received, icon: Inbox, color: "text-purple-600", bgColor: "bg-purple-100" },
    { label: "Follow Up", value: stats.follow_up, icon: MessageSquare, color: "text-orange-600", bgColor: "bg-orange-100" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
    { label: "Closed", value: stats.closed, icon: XCircle, color: "text-muted-foreground", bgColor: "bg-muted" },
    { label: "Rejected", value: stats.rejected, icon: Ban, color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-display">Welcome back, {userName}</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening across your centers today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="font-semibold">{stats.total_tickets}</span>
            <span className="text-muted-foreground">Total Tickets</span>
          </div>
          {stats.avg_resolution_hours != null && (
            <div className="flex items-center gap-1.5 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-semibold">{stats.avg_resolution_hours}h</span>
              <span className="text-muted-foreground">Avg Resolution</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards (Top 4 KPIs) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={cn("bg-card rounded-xl p-5 card-shadow border border-border border-l-4 hover:elevated-shadow transition-shadow", card.borderColor)}>
            <div className="flex items-center justify-between mb-3">
              <div className={cn("inline-flex items-center justify-center h-10 w-10 rounded-lg", card.bgColor)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
              <span className="text-3xl font-bold">{card.value}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Status Breakdown Cards ── */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {statusCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-3 card-shadow border border-border hover:elevated-shadow transition-shadow">
            <div className={cn("inline-flex items-center justify-center h-8 w-8 rounded-lg mb-2", stat.bgColor)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Priority Pie + Status Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Distribution */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">By Priority</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Status Distribution</h3>
          </div>
          {statusPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name" paddingAngle={2}>
                    {statusPieData.map((_, index) => (
                      <Cell key={`status-cell-${index}`} fill={statusChartColors[index % statusChartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto">
                {statusPieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusChartColors[i % statusChartColors.length] }} />
                      <span className="text-muted-foreground truncate">{entry.name}</span>
                    </div>
                    <span className="font-bold">{entry.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* ── Department Bar Chart + Top Centers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department-wise Tickets */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-sm mb-4">Tickets by Department</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.tickets_by_department}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Centers */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-sm mb-4">Top Centers by Tickets</h3>
          <div className="space-y-3">
            {stats.top_centers.length > 0 ? stats.top_centers.map((center, i) => {
              const maxTickets = stats.top_centers[0]?.tickets || 1;
              return (
                <div key={center.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm font-medium">{center.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full gradient-primary" style={{ width: `${(center.tickets / maxTickets) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold w-6 text-right">{center.tickets}</span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Tickets ── */}
      <div className="bg-card rounded-xl card-shadow border border-border">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="font-semibold text-sm">Recent Tickets</h3>
          <Link to="/tickets" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">ID</th>
                <th className="px-5 py-2.5 font-medium">Title</th>
                <th className="px-5 py-2.5 font-medium">Priority</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Department</th>
                <th className="px-5 py-2.5 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_tickets.length > 0 ? stats.recent_tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-primary font-medium">{t.id}</td>
                  <td className="px-5 py-3 font-medium max-w-[200px] truncate">{t.title}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn("h-2 w-2 rounded-full", priorityColors[t.priority])} />
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.status] || "bg-gray-100 text-gray-600")}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.department}</td>
                  <td className="px-5 py-3">
                    {t.sla_breached ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Breached
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-success">On Track</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">No tickets yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
