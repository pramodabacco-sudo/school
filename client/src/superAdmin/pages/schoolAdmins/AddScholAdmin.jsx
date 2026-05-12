// client/src/superAdmin/pages/schoolAdmins/components/AddSchoolAdminModal.jsx
import React, { useState, useEffect } from "react";
import {
  UserCog, X, Check, Loader2, Eye, EyeOff, ChevronRight,
  ChevronLeft, User, Briefcase, FileText, Building2, Lock
} from "lucide-react";
import { createSchoolAdmin, updateSchoolAdmin } from "./components/schoolAdminApi.js";
import { getSchools } from "../schools/components/SchoolsApi.js";

const font = { fontFamily: "'DM Sans', sans-serif" };

/* ─── Reusable field components ─────────────────────────── */
function FInput({ label, required, value, onChange, type = "text", error, placeholder, disabled }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ ...font, color: "#6A89A7" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="py-2 px-3 rounded-lg text-sm outline-none transition-all"
        style={{
          border: `1.5px solid ${error ? "#f87171" : "#BDDDFC"}`,
          ...font, color: "#384959",
          background: disabled ? "#f8fbff" : "#fff",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => { if (!disabled) e.target.style.borderColor = "#88BDF2"; }}
        onBlur={(e) => (e.target.style.borderColor = error ? "#f87171" : "#BDDDFC")}
      />
      {error && <span className="text-[11px]" style={{ color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function FSelect({ label, required, value, onChange, options, error, disabled }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ ...font, color: "#6A89A7" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="py-2 px-3 rounded-lg text-sm outline-none"
        style={{
          border: `1.5px solid ${error ? "#f87171" : "#BDDDFC"}`,
          ...font, color: value ? "#384959" : "#94a3b8", background: "#fff",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="text-[11px]" style={{ color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function FileUploadField({ label, accept, value, onChange, hint }) {
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onChange(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold" style={{ ...font, color: "#6A89A7" }}>{label}</label>
      <label
        className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
        style={{
          border: "1.5px dashed #BDDDFC",
          background: "#f8fbff",
          padding: "18px 12px",
          minHeight: 80,
        }}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#88BDF2"; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = "#BDDDFC"; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "#BDDDFC";
          const file = e.dataTransfer.files[0];
          if (file) { onChange(file); if (file.type.startsWith("image/")) setPreview(URL.createObjectURL(file)); }
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" className="h-16 w-16 object-cover rounded-lg" />
        ) : (
          <FileText size={22} style={{ color: "#BDDDFC" }} />
        )}
        <span className="text-xs text-center" style={{ color: "#6A89A7", ...font }}>
          {value ? value.name : <>Click or drag & drop<br /><span style={{ color: "#94a3b8" }}>{hint}</span></>}
        </span>
        <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      </label>
    </div>
  );
}

/* ─── Step indicator ─────────────────────────────────────── */
const STEPS = [
  { label: "Account", icon: Lock },
  { label: "Admin Details", icon: Briefcase },
  { label: "Documents", icon: FileText },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 w-full px-6 py-4" style={{ borderBottom: "1.5px solid #BDDDFC" }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = s.icon;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 34, height: 34,
                  background: done ? "#384959" : active ? "#88BDF2" : "#f0f7ff",
                  border: `2px solid ${done ? "#384959" : active ? "#88BDF2" : "#BDDDFC"}`,
                }}
              >
                {done
                  ? <Check size={15} color="#fff" />
                  : <Icon size={15} color={active ? "#fff" : "#BDDDFC"} />
                }
              </div>
              <span className="text-[10px] font-semibold" style={{ ...font, color: active ? "#384959" : done ? "#384959" : "#94a3b8" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: done ? "#384959" : "#BDDDFC", marginBottom: 20, borderRadius: 2 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Initial form state ─────────────────────────────────── */
const INIT = {
  // Account
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  schoolId: "",

  // Admin Details
  employeeId: "",
  designation: "School Admin",

  phoneNumber: "",
  address: "",
  salary: "",

  // Banking
  bankName: "",
  accountNumber: "",
  ifscCode: "",

  // Identity
  panNumber: "",
  aadharNumber: "",

  // Documents
  photo: null,
  panDocument: null,
  aadharDocument: null,
};

/* ─── Main component ─────────────────────────────────────── */
export default function AddSchoolAdminModal({ onClose, onSuccess, admin = null }) {
  const isEdit = Boolean(admin);

  // FIX: Populate ALL profile fields from admin.schoolAdminProfile when editing
  const buildInitial = () => {
    if (!isEdit) return { ...INIT };
    const p = admin.schoolAdminProfile || {};
    return {
      ...INIT,
      // Account fields
      name:          admin.name  || "",
      email:         admin.email || "",
      schoolId:      admin.schoolId || "",
      // Admin Details — pulled from schoolAdminProfile
      employeeId:    p.employeeId    || "",
      designation:   p.designation   || "School Admin",
      phoneNumber:   p.phoneNumber   || "",
      address:       p.address       || "",
      salary:        p.basicSalary != null ? String(p.basicSalary) : "",
      // Banking
      bankName:      p.bankName      || "",
      accountNumber: p.accountNumber || "",
      ifscCode:      p.ifscCode      || "",
      // Identity
      panNumber:     p.panNumber     || "",
      aadharNumber:  p.aadharNumber  || "",
    };
  };

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(buildInitial);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const set = (k) => (v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
    setApiError("");
  };

  useEffect(() => {
    getSchools()
      .then((data) => setSchools(data.schools || []))
      .catch(() => setApiError("Failed to load schools"))
      .finally(() => setSchoolsLoading(false));
  }, []);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  /* ─── Per-step validation ─── */
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.name.trim()) errs.name = "Required";
      if (!form.email.trim()) errs.email = "Required";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Enter a valid email";
      if (!form.schoolId) errs.schoolId = "Please select a school";
      const needsPassword = !isEdit || changePassword;
      if (needsPassword) {
        if (!form.password) errs.password = "Required";
        else if (form.password.length < 6) errs.password = "Minimum 6 characters";
        if (!form.confirmPassword) errs.confirmPassword = "Required";
        else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
      }
    }
    // Step 1 & 2 are optional details — no required fields
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((p) => p + 1);
  };

  const handleBack = () => setStep((p) => p - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setApiError("");
    try {
      // FIX: Build a shared profile payload used for both create and edit
      const profilePayload = {
        employeeId:    form.employeeId    || undefined,
        designation:   form.designation   || "School Admin",
        phoneNumber:   form.phoneNumber   || undefined,
        address:       form.address       || undefined,
        salary:        Number(form.salary || 0),
        bankName:      form.bankName      || undefined,
        accountNumber: form.accountNumber || undefined,
        ifscCode:      form.ifscCode      || undefined,
        panNumber:     form.panNumber     || undefined,
        aadharNumber:  form.aadharNumber  || undefined,
      };

      if (isEdit) {
        // FIX: Send ALL profile fields on edit, not just name/email/schoolId
        const payload = {
          name:     form.name.trim(),
          email:    form.email.trim(),
          schoolId: form.schoolId,
          ...profilePayload,
          ...(changePassword && form.password ? { password: form.password } : {}),
        };
        const result = await updateSchoolAdmin(admin.id, payload);
        if (onSuccess) onSuccess(result.admin);
      } else {
        const result = await createSchoolAdmin({
          name:     form.name.trim(),
          email:    form.email.trim(),
          password: form.password,
          schoolId: form.schoolId,
          ...profilePayload,
        });
        if (onSuccess) onSuccess(result.admin);
      }
      onClose();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Styles ─── */
  const btnBase = {
    ...font, fontSize: 13, cursor: "pointer", border: "none",
    borderRadius: 10, padding: "9px 20px", fontWeight: 600,
    display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.15s",
  };
  const schoolOptions = [
    { value: "", label: schoolsLoading ? "Loading schools…" : "Select a school" },
    ...schools.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
  ];

  /* ─── Step content ─────────────────────────────────────── */
  const renderStep = () => {
    /* ══ STEP 0: Account ══ */
    if (step === 0) return (
      <div className="flex flex-col gap-4">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#f0f7ff", border: "1.5px solid #BDDDFC" }}
        >
          <User size={18} style={{ color: "#88BDF2" }} />
          <div>
            <p className="text-xs font-bold" style={{ ...font, color: "#384959" }}>Account Credentials</p>
            <p className="text-[11px]" style={{ ...font, color: "#6A89A7" }}>
              These details are used to log into the school dashboard.
            </p>
          </div>
        </div>

        <FInput label="Full Name" required value={form.name} onChange={set("name")} placeholder="e.g. Rahul Sharma" error={errors.name} />
        <FInput label="Email Address" required value={form.email} onChange={set("email")} placeholder="admin@school.edu.in" error={errors.email} />
        <FSelect label="Assign School" required value={form.schoolId} onChange={set("schoolId")} options={schoolOptions} error={errors.schoolId} disabled={isEdit} />

        {isEdit ? (
          <div>
            <button
              type="button"
              onClick={() => setChangePassword((p) => !p)}
              className="flex items-center gap-2 text-xs font-semibold transition-colors"
              style={{ ...font, color: changePassword ? "#ef4444" : "#6A89A7", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <Lock size={13} /> {changePassword ? "Cancel password change" : "Change Password"}
            </button>
          </div>
        ) : null}

        {(!isEdit || changePassword) && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ ...font, color: "#6A89A7" }}>
                Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password")(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full py-2 px-3 pr-12 rounded-lg text-sm outline-none transition-all"
                  style={{ border: `1.5px solid ${errors.password ? "#f87171" : "#BDDDFC"}`, ...font, color: "#384959" }}
                  onFocus={(e) => (e.target.style.borderColor = "#88BDF2")}
                  onBlur={(e) => (e.target.style.borderColor = errors.password ? "#f87171" : "#BDDDFC")}
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6A89A7" }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <span className="text-[11px]" style={{ color: "#dc2626" }}>{errors.password}</span>}
            </div>

            <FInput
              label="Confirm Password" required
              value={form.confirmPassword} onChange={set("confirmPassword")}
              type={showPassword ? "text" : "password"}
              error={errors.confirmPassword} placeholder="Re-enter password"
            />
          </>
        )}
      </div>
    );

    /* ══ STEP 1: Admin Details ══ */
    if (step === 1) return (
      <div className="flex flex-col gap-5">

        {/* Identity */}
        <section>
          <SectionHeading icon={<Briefcase size={14} />} title="Admin Information" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FInput
              label="Employee ID"
              value={form.employeeId}
              onChange={set("employeeId")}
              placeholder="ADM-001"
            />
            <FInput
              label="Designation"
              value={form.designation}
              onChange={set("designation")}
              placeholder="School Admin"
            />
            <FInput
              label="Phone Number"
              value={form.phoneNumber}
              onChange={set("phoneNumber")}
              placeholder="9876543210"
            />
            <FInput
              label="Monthly Salary"
              type="number"
              value={form.salary}
              onChange={set("salary")}
              placeholder="25000"
            />
            <FInput
              label="PAN Number"
              value={form.panNumber}
              onChange={set("panNumber")}
              placeholder="ABCDE1234F"
            />
            <FInput
              label="Aadhar Number"
              value={form.aadharNumber}
              onChange={set("aadharNumber")}
              placeholder="123456789012"
            />
          </div>

          {/* Address */}
          <div className="mt-3">
            <label className="text-xs font-semibold" style={{ ...font, color: "#6A89A7" }}>
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
              placeholder="Enter full address"
              rows={3}
              className="w-full mt-1 py-2 px-3 rounded-lg text-sm outline-none resize-none"
              style={{
                border: "1.5px solid #BDDDFC",
                ...font,
                color: "#384959",
                background: "#fff",
              }}
            />
          </div>
        </section>

        {/* Banking */}
        <section>
          <SectionHeading icon={<Building2 size={14} />} title="Bank Details" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FInput
              label="Bank Name"
              value={form.bankName}
              onChange={set("bankName")}
              placeholder="State Bank of India"
            />
            <FInput
              label="Account Number"
              value={form.accountNumber}
              onChange={set("accountNumber")}
              placeholder="1234567890"
            />
            <FInput
              label="IFSC Code"
              value={form.ifscCode}
              onChange={set("ifscCode")}
              placeholder="SBIN0001234"
            />
          </div>
        </section>
      </div>
    );

    /* ══ STEP 2: Documents ══ */
    if (step === 2) return (
      <div className="flex flex-col gap-4">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#f0f7ff", border: "1.5px solid #BDDDFC" }}
        >
          <FileText size={18} style={{ color: "#88BDF2" }} />
          <div>
            <p className="text-xs font-bold" style={{ ...font, color: "#384959" }}>Upload Documents</p>
            <p className="text-[11px]" style={{ ...font, color: "#6A89A7" }}>
              Upload admin profile photo and ID documents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FileUploadField
            label="Profile Photo"
            accept="image/*"
            value={form.photo}
            onChange={(f) => setForm((p) => ({ ...p, photo: f }))}
            hint="JPG or PNG"
          />
          <FileUploadField
            label="PAN Card Document"
            accept=".pdf,image/*"
            value={form.panDocument}
            onChange={(f) => setForm((p) => ({ ...p, panDocument: f }))}
            hint="PDF or image"
          />
          <FileUploadField
            label="Aadhar Card Document"
            accept=".pdf,image/*"
            value={form.aadharDocument}
            onChange={(f) => setForm((p) => ({ ...p, aadharDocument: f }))}
            hint="PDF or image"
          />
        </div>
      </div>
    );
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(56,73,89,0.35)", backdropFilter: "blur(3px)" }}
      />

      {/* Modal */}
      <div
        className="fixed z-50 flex flex-col overflow-hidden"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(600px, 96vw)",
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(56,73,89,0.18)",
          border: "1.5px solid #BDDDFC",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1.5px solid #BDDDFC" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, background: "#384959" }}>
              <UserCog size={18} color="#fff" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ ...font, color: "#384959" }}>
                {isEdit ? "Edit School Admin" : "Add School Admin"}
              </h2>
              <p className="text-[11px]" style={{ ...font, color: "#6A89A7" }}>
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "#f3f8fd", border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 8px", color: "#6A89A7" }}>
            <X size={16} />
          </button>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderStep()}

          {/* API Error */}
          {apiError && (
            <div className="mt-4 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "#fff1f0", color: "#dc2626", border: "1px solid #f87171", ...font }}>
              {apiError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1.5px solid #BDDDFC" }}>

          {step === 0 ? (
            <button onClick={onClose} style={{ ...btnBase, background: "#f3f8fd", color: "#6A89A7" }}>
              Cancel
            </button>
          ) : (
            <button onClick={handleBack} style={{ ...btnBase, background: "#f3f8fd", color: "#6A89A7" }}>
              <ChevronLeft size={15} /> Back
            </button>
          )}

          {!isLastStep ? (
            <button onClick={handleNext} style={{ ...btnBase, background: "#384959", color: "#fff" }}>
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...btnBase, background: "#384959", color: "#fff", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> {isEdit ? "Saving…" : "Creating…"}</>
                : <><Check size={14} /> {isEdit ? "Save Changes" : "Create Admin"}</>}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Section heading helper ─────────────────────────────── */
function SectionHeading({ icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid #BDDDFC" }}>
      <span style={{ color: "#88BDF2" }}>{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif", color: "#384959" }}>
        {title}
      </span>
    </div>
  );
}