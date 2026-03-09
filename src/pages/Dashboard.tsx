import { dashboardStats, tickets, notifications } from "@/data/dummyData";
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Star,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
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
  Resolved: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
};

const pieColors = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)", "hsl(210, 80%, 55%)", "hsl(200, 10%, 45%)"];

const pieData = Object.entries(dashboardStats.ticketsByPriority).map(([name, value]) => ({
  name,
  value,
}));

const Dashboard = () => {
  const recentTickets = tickets.slice(0, 5);
  const criticalNotifs = notifications.filter((n) => !n.read);

  const statCards = [
    { label: "Total Tickets", value: dashboardStats.totalTickets, icon: Ticket, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Open", value: dashboardStats.openTickets, icon: AlertTriangle, color: "text-info", bgColor: "bg-info/10" },
    { label: "In Progress", value: dashboardStats.inProgress, icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
    { label: "Pending Approval", value: dashboardStats.pendingApproval, icon: ShieldAlert, color: "text-accent-foreground", bgColor: "bg-accent" },
    { label: "Resolved", value: dashboardStats.resolved, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
    { label: "SLA Breached", value: dashboardStats.slaBreached, icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-display">Welcome back, Rajesh</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening across your 35 centers today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 text-warning fill-warning" />
            <span className="font-semibold">{dashboardStats.satisfactionScore}/5</span>
            <span className="text-muted-foreground">CSAT</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="font-semibold">{dashboardStats.avgResolutionHrs}h</span>
            <span className="text-muted-foreground">Avg Resolution</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-4 card-shadow border border-border hover:elevated-shadow transition-shadow">
            <div className={cn("inline-flex items-center justify-center h-9 w-9 rounded-lg mb-3", stat.bgColor)}>
              <stat.icon className={cn("h-[18px] w-[18px]", stat.color)} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-sm mb-4">Ticket Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dashboardStats.ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="opened" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-3))", r: 3 }} name="Opened" />
              <Line type="monotone" dataKey="resolved" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-4))", r: 3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-sm mb-4">By Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-semibold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department-wise */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-sm mb-4">Tickets by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboardStats.ticketsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Centers */}
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-sm mb-4">Top Centers by Tickets</h3>
          <div className="space-y-3">
            {dashboardStats.topCenters.map((center, i) => (
              <div key={center.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm">{center.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary"
                      style={{ width: `${(center.tickets / 12) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-5 text-right">{center.tickets}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
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
                <th className="px-5 py-2.5 font-medium">Center</th>
                <th className="px-5 py-2.5 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-primary">{t.id}</td>
                  <td className="px-5 py-3 font-medium max-w-[200px] truncate">{t.title}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn("h-2 w-2 rounded-full", priorityColors[t.priority])} />
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.status])}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.assignedDept}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.center}</td>
                  <td className="px-5 py-3">
                    {t.slaBreached ? (
                      <span className="text-xs font-medium text-destructive">Breached</span>
                    ) : (
                      <span className="text-xs font-medium text-success">On Track</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
