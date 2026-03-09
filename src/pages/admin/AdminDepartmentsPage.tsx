import { departments } from "@/data/dummyData";

const AdminDepartmentsPage = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Department Management</h1>
        <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Department
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-card rounded-xl p-5 card-shadow border border-border hover:elevated-shadow transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{d.name}</h3>
              <span className="text-[10px] font-mono text-muted-foreground">{d.id}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Head</span>
                <span className="text-xs font-medium">{d.head}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">SLA (hrs)</span>
                <span className="text-xs font-medium">{d.slaHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Centers</span>
                <span className="text-xs font-medium">{d.centerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Active Tickets</span>
                <span className="text-xs font-semibold text-primary">{d.activeTickets}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDepartmentsPage;
