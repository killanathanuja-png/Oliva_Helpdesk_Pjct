import { useState } from "react";
import { tickets, departments, centers } from "@/data/dummyData";
import type { Priority, TicketStatus, Ticket } from "@/data/dummyData";
import { Search, Filter, Plus, ChevronDown, Eye, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import TicketDetailModal from "@/components/TicketDetailModal";
import RaiseTicketModal from "@/components/RaiseTicketModal";

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
  Rejected: "bg-destructive text-destructive-foreground",
};

const TicketsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showRaise, setShowRaise] = useState(false);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    const matchDept = deptFilter === "All" || t.assignedDept === deptFilter;
    return matchSearch && matchStatus && matchPriority && matchDept;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold font-display">Ticket Management</h1>
        <button
          onClick={() => setShowRaise(true)}
          className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Raise Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Pending Approval</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Priority</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 && "s"} found</p>

      {/* Table */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Ticket ID</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned Dept</th>
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{t.id}</td>
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="font-medium truncate">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.raisedBy}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className={cn("h-2 w-2 rounded-full", priorityColors[t.priority])} />
                    {t.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-medium", statusColors[t.status])}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.assignedDept}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.center}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.createdAt}</td>
                <td className="px-4 py-3">
                  {t.slaBreached ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Breached
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-success">On Track</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedTicket(t)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      {showRaise && <RaiseTicketModal onClose={() => setShowRaise(false)} />}
    </div>
  );
};

export default TicketsPage;
