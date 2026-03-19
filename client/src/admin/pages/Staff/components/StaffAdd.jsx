import { useState, useEffect } from "react";
import { X, UserPlus, FlaskConical, Home, KeyRound, Info } from "lucide-react";
import { createStaff, updateStaff } from "../api/api";

const GROUP_CONFIG = {
  "Group B": {
    note: "Skilled / semi-skilled staff assisting in academic or lab functions.",
    roles: ["Lab Assistant", "Librarian", "Computer Operator", "Office Clerk"],
    noteColor: "bg-blue-50 border-blue-100 text-blue-600",
    icon: <FlaskConical size={15} />,
  },
  "Group C": {
    note: "General support staff for maintenance, security and daily upkeep.",
    roles: ["Peon", "Watchman", "Sweeper", "Gardner"],
    noteColor: "bg-violet-50 border-violet-100 text-violet-600",
    icon: <Home size={15} />,
  },
};

export default function StaffAdd({ onClose, onSuccess, editData = null }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", role: "", groupType: "Group B",
    joiningDate: "", basicSalary: "",
    bankAccountNo: "", bankName: "", ifscCode: "",
  });
  const [loading, setLoading]   = useState(false);
  const [giveLogin, setGiveLogin] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        firstName:    editData.firstName    || "",
        lastName:     editData.lastName     || "",
        email:        editData.email        || "",
        phone:        editData.phone        || "",
        password:     "",
        role:         editData.role         || "",
        groupType:    editData.groupType    || "Group B",
        joiningDate:  editData.joiningDate?.split("T")[0] || "",
        basicSalary:  editData.basicSalary  ?? "",
        bankAccountNo: editData.bankAccountNo || "",
        bankName:     editData.bankName     || "",
        ifscCode:     editData.ifscCode     || "",
      });
      if (editData.email) setGiveLogin(true);
    }
  }, [editData]);

  const set  = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setG = (g) => setForm({ ...form, groupType: g, role: "" });
  const setR = (r) => setForm({ ...form, role: form.role === r ? "" : r });

  const handleSubmit = async () => {
    if (!form.firstName || !form.role || !form.joiningDate)
      return alert("First Name, Role and Joining Date are required");
    if (!isEdit && giveLogin && !form.email)
      return alert("Email is required when giving login access");
    if (!isEdit && giveLogin && !form.password)
      return alert("Password is required when giving login access");

    setLoading(true);
    try {
      if (isEdit) {
        await updateStaff(editData.id, {
          firstName: form.firstName, lastName: form.lastName || "",
          phone: form.phone || null, email: form.email || null,
          role: form.role, groupType: form.groupType,
          basicSalary: form.basicSalary ? Number(form.basicSalary) : null,
          joiningDate: form.joiningDate,
          bankAccountNo: form.bankAccountNo || null,
          bankName: form.bankName || null, ifscCode: form.ifscCode || null,
        });
      } else {
        await createStaff({
          firstName: form.firstName, lastName: form.lastName || "",
          phone: form.phone || undefined, email: form.email || undefined,
          role: form.role, groupType: form.groupType,
          joiningDate: form.joiningDate,
          basicSalary: form.basicSalary || undefined,
          bankAccountNo: form.bankAccountNo || undefined,
          bankName: form.bankName || undefined, ifscCode: form.ifscCode || undefined,
          ...(giveLogin && { password: form.password }),
        });
      }
      onSuccess(); onClose();
    } catch (err) {
      alert(err.message || "Failed to save staff");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full border border-gray-200 bg-[#f0f4f8] px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:bg-white transition placeholder-gray-400";
  const lbl = "block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";
  const cfg = GROUP_CONFIG[form.groupType];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-[520px] max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8edf3] flex items-center justify-center text-[#384959]">
              <UserPlus size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">{isEdit ? "Edit Staff" : "Add Staff"}</h2>
              <p className="text-xs text-gray-400">{isEdit ? "Update staff member details" : "Create a new staff entry"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Group Toggle */}
          <div>
            <label className={lbl}>Staff Group *</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {Object.entries(GROUP_CONFIG).map(([g, gc]) => (
                <button key={g} type="button" onClick={() => setG(g)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                    form.groupType === g
                      ? "bg-[#384959] text-white border-[#384959] shadow-sm"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}>
                  {gc.icon} {g}
                </button>
              ))}
            </div>
            <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${cfg.noteColor}`}>
              <Info size={13} className="mt-0.5 shrink-0" />
              <span><span className="font-semibold">{form.groupType}:</span> {cfg.note}</span>
            </div>
          </div>

          {/* Role Chips */}
          <div>
            <label className={lbl}>Role * <span className="normal-case font-normal tracking-normal text-gray-400 ml-1">— pick or type custom</span></label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {cfg.roles.map((r) => (
                <button key={r} type="button" onClick={() => setR(r)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.role === r
                      ? "bg-[#384959] text-white border-[#384959]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#384959] hover:text-[#384959]"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <input className={inp} name="role" placeholder="Or type a custom role..." onChange={set} value={form.role} />
          </div>

          {/* Personal Details */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Details</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>First Name *</label><input className={inp} name="firstName" placeholder="First name" onChange={set} value={form.firstName} /></div>
                <div><label className={lbl}>Last Name</label><input className={inp} name="lastName" placeholder="Last name" onChange={set} value={form.lastName} /></div>
              </div>
              <div><label className={lbl}>Email</label><input className={inp} name="email" type="email" placeholder="staff@school.com" onChange={set} value={form.email} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Phone</label><input className={inp} name="phone" placeholder="+91 XXXXX XXXXX" onChange={set} value={form.phone} /></div>
                <div><label className={lbl}>Joining Date *</label><input type="date" className={inp} name="joiningDate" onChange={set} value={form.joiningDate} /></div>
              </div>
            </div>
          </div>

          {/* Salary & Bank */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Salary & Bank <span className="normal-case font-normal tracking-normal">(optional)</span></p>
            <div className="space-y-3">
              <div><label className={lbl}>Basic Salary (₹)</label><input className={inp} name="basicSalary" type="number" placeholder="e.g. 18000" onChange={set} value={form.basicSalary} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Bank Name</label><input className={inp} name="bankName" placeholder="e.g. SBI" onChange={set} value={form.bankName} /></div>
                <div><label className={lbl}>IFSC Code</label><input className={inp} name="ifscCode" placeholder="e.g. SBIN0001234" onChange={set} value={form.ifscCode} /></div>
              </div>
              <div><label className={lbl}>Bank Account No.</label><input className={inp} name="bankAccountNo" placeholder="Account number" onChange={set} value={form.bankAccountNo} /></div>
            </div>
          </div>

          {/* Login Access */}
          {!isEdit && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={15} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Give Login Access?</p>
                    <p className="text-xs text-gray-400 mt-0.5">Staff can log in to the portal</p>
                  </div>
                </div>
                <button type="button" onClick={() => setGiveLogin((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${giveLogin ? "bg-[#384959]" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${giveLogin ? "translate-x-5" : ""}`} />
                </button>
              </div>
              {giveLogin && (
                <div className="mt-3 space-y-3">
                  <div><label className={lbl}>Password *</label><input className={inp} name="password" type="password" placeholder="Set a password" onChange={set} value={form.password} /></div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-500">
                    <Info size={12} /> A user account will be created and linked automatically.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white disabled:opacity-50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#384959] text-white text-sm font-medium hover:bg-[#2c3a45] disabled:opacity-60 transition shadow-sm">
            {loading ? "Saving..." : isEdit ? "Update Staff" : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}