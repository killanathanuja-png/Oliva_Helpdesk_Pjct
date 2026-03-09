import { useState } from "react";
import { centers } from "@/data/dummyData";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminCentersPage = () => {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");

  const cities = [...new Set(centers.map((c) => c.city))];
  const filtered = centers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === "All" || c.city === cityFilter;
    return matchSearch && matchCity;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Center Management ({centers.length})</h1>
        <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Center
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search centers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All Cities</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Contact Person</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.city}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.state}</td>
                <td className="px-4 py-3 text-xs">{c.contactPerson}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.phone}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block h-2 w-2 rounded-full mr-1.5", c.status === "Active" ? "bg-success" : "bg-muted-foreground")} />
                  <span className="text-xs">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCentersPage;
