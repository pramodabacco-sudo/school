import { useEffect, useState } from "react";
import {
  Users, FlaskConical, Home, Eye, Pencil, Trash2,
  Plus, RefreshCw, X, Phone, Mail, CalendarDays,
  Banknote, Building2, CreditCard, Hash, ShieldCheck,
  UserCircle2, ChevronRight,
} from "lucide-react";
import { fetchStaff, deleteStaff } from "./api/api";
import StaffAdd from "./components/StaffAdd";

const GROUP = {
  "Group B": {
    badge: "bg-blue-50 text-blue-600 border border-blue-100",
    dot: "bg-blue-400",
    pill: "bg-blue-100 text-blue-700",
  },
  "Group C": {
    badge: "bg-violet-50 text-violet-600 border border-violet-100",
    dot: "bg-violet-400",
    pill: "bg-violet-100 text-violet-700",
  },
};

export default function StaffList() {
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab]   = useState("All");

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchStaff({});
      setStaff(res.data || []);
    } catch {
      alert("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit  = (s) => { setEditData(s); setShowAdd(true); };
  const handleClose = ()  => { setShowAdd(false); setEditData(null); };

  const handleDelete = async (s) => {
    if (!window.confirm(`Remove ${s.firstName} ${s.lastName || ""}?`)) return;
    setDeletingId(s.id);
    try { await deleteStaff(s.id); await load(); }
    catch (err) { alert(err.message || "Failed to delete"); }
    finally { setDeletingId(null); }
  };

  const groupB = staff.filter((s) => s.groupType === "Group B");
  const groupC = staff.filter((s) => s.groupType === "Group C");

  const visible =
    activeTab === "Group B" ? groupB :
    activeTab === "Group C" ? groupC :
    staff;

  return (
    <div className="p-6 bg-[#f4f8fc] min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-[#384959]" />
          <div>
            <h1 className="text-[22px] font-semibold text-gray-800 leading-tight">Staff Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage non-teaching staff across Group B and C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => { setEditData(null); setShowAdd(true); }}
            className="flex items-center gap-1.5 bg-[#384959] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2c3a45] transition shadow-sm"
          >
            <Plus size={15} /> Add Staff
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Staff",  value: staff.length,  icon: <Users size={18} className="text-gray-400" /> },
          { label: "Group B",      value: groupB.length, icon: <FlaskConical size={18} className="text-blue-400" /> },
          { label: "Group C",      value: groupC.length, icon: <Home size={18} className="text-violet-400" /> },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              {c.icon}
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800 leading-none">{c.value}</p>
              <p className="text-xs text-blue-500 mt-1">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex gap-1.5">
            {["All", "Group B", "Group C"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeTab === t
                    ? "bg-[#384959] text-white border-[#384959]"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{visible.length} member{visible.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading staff...</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No staff found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Joining Date</th>
                <th className="px-5 py-3">Group</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((s) => {
                const g = GROUP[s.groupType] || GROUP["Group B"];
                return (
                  <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#e8edf3] flex items-center justify-center text-[#384959] text-xs font-semibold shrink-0">
                          {s.firstName?.[0]}{s.lastName?.[0] || ""}
                        </div>
                        <span className="font-medium text-gray-800">{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{s.role}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.email || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.joiningDate?.split("T")[0]}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${g.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                        {s.groupType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewData(s)} title="View"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleEdit(s)} title="Edit"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(s)} title="Delete" disabled={deletingId === s.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                          {deletingId === s.id
                            ? <RefreshCw size={15} className="animate-spin" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showAdd && <StaffAdd onClose={handleClose} onSuccess={load} editData={editData} />}

      {/* ── View Detail Modal ── */}
      {viewData && <ViewModal staff={viewData} onClose={() => setViewData(null)} onEdit={(s) => { setViewData(null); handleEdit(s); }} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   View Modal
───────────────────────────────────────── */
function ViewModal({ staff: s, onClose, onEdit }) {
  const g = GROUP[s.groupType] || GROUP["Group B"];

  const hasBank = s.bankName || s.bankAccountNo || s.ifscCode;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Top colour strip + avatar ── */}
        <div className="relative bg-gradient-to-br from-[#384959] to-[#4a6280] px-6 pt-6 pb-10">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
            <X size={15} />
          </button>
          <div className="flex items-end gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {s.firstName?.[0]}{s.lastName?.[0] || ""}
            </div>
            <div className="pb-1">
              <p className="text-white font-semibold text-lg leading-tight">{s.firstName} {s.lastName}</p>
              <p className="text-white/70 text-sm mt-0.5">{s.role}</p>
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${g.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                {s.groupType}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-4 -mt-4 relative space-y-4">

          {/* Contact */}
          <Section title="Contact Info">
            <InfoRow icon={<Mail size={14} />}    label="Email"   value={s.email} />
            <InfoRow icon={<Phone size={14} />}   label="Phone"   value={s.phone} />
            <InfoRow icon={<CalendarDays size={14} />} label="Joined" value={s.joiningDate?.split("T")[0]} />
          </Section>

          {/* Salary */}
          <Section title="Salary">
            <InfoRow icon={<Banknote size={14} />} label="Basic Salary" value={s.basicSalary ? `₹${Number(s.basicSalary).toLocaleString("en-IN")}` : null} />
          </Section>

          {/* Bank */}
          {hasBank && (
            <Section title="Bank Details">
              <InfoRow icon={<Building2 size={14} />}  label="Bank"       value={s.bankName} />
              <InfoRow icon={<CreditCard size={14} />} label="Account No" value={s.bankAccountNo} />
              <InfoRow icon={<Hash size={14} />}       label="IFSC"       value={s.ifscCode} />
            </Section>
          )}

          {/* Login */}
          {s.user && (
            <Section title="Login Access">
              <InfoRow
                icon={<ShieldCheck size={14} />}
                label="Status"
                value={
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.user.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                    {s.user.isActive ? "Active" : "Inactive"}
                  </span>
                }
              />
              <InfoRow icon={<UserCircle2 size={14} />} label="Login Email" value={s.user.email} />
            </Section>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white transition">
            Close
          </button>
          <button onClick={() => onEdit(s)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#384959] text-white text-sm font-medium hover:bg-[#2c3a45] transition">
            <Pencil size={13} /> Edit Staff
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl px-4 py-1 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-xs font-medium text-gray-700">
        {value || <span className="text-gray-300 font-normal italic">—</span>}
      </div>
    </div>
  );
}