import { users } from "@/data/dummyData";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  Admin: "bg-destructive/10 text-destructive",
  Manager: "bg-info/10 text-info",
  Resolver: "bg-warning/10 text-warning",
  "End User": "bg-muted text-muted-foreground",
};

const AdminUsersPage = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">User Management</h1>
        <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Add User
        </button>
      </div>
      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
                      {u.avatar}
                    </div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", roleColors[u.role])}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.department}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.center}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block h-2 w-2 rounded-full mr-1.5", u.status === "Active" ? "bg-success" : "bg-muted-foreground")} />
                  <span className="text-xs">{u.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
