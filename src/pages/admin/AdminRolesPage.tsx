import { roles } from "@/data/dummyData";
import { ShieldCheck, Users } from "lucide-react";

const AdminRolesPage = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Role Management</h1>
        <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Role
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="bg-card rounded-xl p-5 card-shadow border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {r.userCount} users
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{r.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {r.permissions.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRolesPage;
