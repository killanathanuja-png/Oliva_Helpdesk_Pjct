import { useState } from "react";
import { X } from "lucide-react";
import { departments, centers } from "@/data/dummyData";

interface Props {
  onClose: () => void;
}

const categories = [
  { name: "IT Infrastructure", subs: ["Network", "Hardware", "Software", "Security Systems", "Email"] },
  { name: "Biomedical Equipment", subs: ["Laser Systems", "Diagnostic Equipment", "Treatment Devices"] },
  { name: "Facilities", subs: ["HVAC", "Plumbing", "Electrical", "Housekeeping", "Civil"] },
  { name: "HR & Admin", subs: ["Onboarding", "ID Cards", "Attendance", "Leave", "Policies"] },
  { name: "Procurement", subs: ["Medical Consumables", "Office Supplies", "Equipment Purchase"] },
  { name: "Marketing", subs: ["Collateral", "Digital", "Events", "Social Media"] },
  { name: "Finance", subs: ["Billing", "Reimbursement", "Vendor Payment", "Petty Cash"] },
];

const RaiseTicketModal = ({ onClose }: Props) => {
  const [category, setCategory] = useState("");
  const selectedCat = categories.find((c) => c.name === category);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl border border-border shadow-xl animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold font-display">Raise New Ticket</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
            <input type="text" required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Brief description of the issue" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description *</label>
            <textarea rows={3} required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Detailed description..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
              <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                {categories.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sub-Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                {selectedCat?.subs.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Priority *</label>
              <select required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Center *</label>
              <select required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                {centers.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Attachment</label>
            <input type="file" className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseTicketModal;
