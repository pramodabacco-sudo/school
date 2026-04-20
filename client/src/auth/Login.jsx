// client/src/auth/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, loginSuperAdmin } from "./api";
import { saveAuth } from "./storage";
import {
  GraduationCap, Users, ShieldCheck, Building2,
  Mail, Lock, Eye, EyeOff, ChevronRight, BookOpen,
  BarChart3, UserCog, ArrowRight
} from "lucide-react";

const REDIRECT = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
  PARENT: "/parent/dashboard",
  SUPER_ADMIN: "/superAdmin/dashboard",
  FINANCER: "/financer/dashboard",
};

const STAFF_ROLES = [
  { label: "Admin", value: "admin", icon: UserCog, desc: "Manage university operations" },
  { label: "Teacher", value: "teacher", icon: BookOpen, desc: "Access classes & grades" },
  { label: "Financer", value: "financer", icon: BarChart3, desc: "Manage fees & accounts" },
];

const TOP_TABS = [
  { label: "Staff", value: "staff", icon: Users },
  { label: "Student", value: "student", icon: GraduationCap },
  { label: "Parent", value: "parent", icon: Building2 },
  { label: "Super Admin", value: "superAdmin", icon: ShieldCheck },
];

export default function Login({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const [type, setType] = useState("staff");
  const [staffRole, setStaffRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) return setError("Please enter email and password");
    try {
      setLoading(true);
      let result;
      const loginType = type === "staff" ? staffRole : type;
      if (type === "superAdmin") {
        result = await loginSuperAdmin({ email, password });
      } else {
        result = await loginRequest(loginType, { email, password });
      }
      saveAuth(result);
      const role = result?.user?.role;
      if (!role) { setError("Login failed: role not found"); return; }
      window.location.href = REDIRECT[role] || "/dashboard";
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const activeTab = TOP_TABS.find(t => t.value === type);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f0f6ff", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* LEFT PANEL */}
      <div style={{
        flex: "0 0 45%", background: "linear-gradient(145deg, #384959 0%, #4a6278 60%, #6A89A7 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start",
        padding: "60px 56px", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(136,189,242,0.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(189,221,252,0.10)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#88BDF2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={24} color="#384959" />
          </div>
          <span style={{ color: "#BDDDFC", fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>UniPortal</span>
        </div>

        <h1 style={{ color: "#fff", fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginBottom: 18, maxWidth: 340 }}>
          Welcome Back to Your Campus Hub
        </h1>
        <p style={{ color: "#BDDDFC", fontSize: 15, lineHeight: 1.7, maxWidth: 340, marginBottom: 48 }}>
          One platform for staff, students, parents and administrators to manage university life seamlessly.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 320 }}>
          {[
            { icon: Users, text: "Staff & Faculty Management" },
            { icon: GraduationCap, text: "Student Academic Portal" },
            { icon: BarChart3, text: "Finance & Fee Tracking" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(136,189,242,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color="#88BDF2" />
              </div>
              <span style={{ color: "#BDDDFC", fontSize: 14, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          <h2 style={{ color: "#384959", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: "#6A89A7", fontSize: 14, marginBottom: 28 }}>Select your role and enter your credentials</p>

          {/* Top Role Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: type === "staff" ? 16 : 24, background: "#eaf3fc", borderRadius: 12, padding: 5 }}>
            {TOP_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.value} onClick={() => { setType(tab.value); setError(""); }}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: type === tab.value ? "#384959" : "transparent",
                    color: type === tab.value ? "#fff" : "#6A89A7",
                    fontWeight: 600, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.2s", boxShadow: type === tab.value ? "0 2px 8px rgba(56,73,89,0.18)" : "none"
                  }}>
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Staff Sub-roles */}
          {type === "staff" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {STAFF_ROLES.map(({ label, value, icon: Icon, desc }) => (
                <button key={value} onClick={() => { setStaffRole(value); setError(""); }}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                    border: staffRole === value ? "2px solid #6A89A7" : "2px solid #dde8f5",
                    background: staffRole === value ? "#eaf3fc" : "#fff",
                    transition: "all 0.2s"
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <Icon size={14} color={staffRole === value ? "#384959" : "#6A89A7"} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: staffRole === value ? "#384959" : "#6A89A7" }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "#88BDF2", margin: 0, lineHeight: 1.4 }}>{desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Active role badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "8px 14px", background: "#BDDDFC", borderRadius: 8 }}>
            {activeTab && <activeTab.icon size={14} color="#384959" />}
            <span style={{ fontSize: 12, color: "#384959", fontWeight: 600 }}>
              Logging in as: {type === "staff" ? `${STAFF_ROLES.find(r => r.value === staffRole)?.label} (Staff)` : activeTab?.label}
            </span>
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: 8, padding: "10px 14px", marginBottom: 18, color: "#c0392b", fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#384959", marginBottom: 6 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="#88BDF2" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input type="email" placeholder="name@university.edu" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", padding: "11px 14px 11px 40px", border: "1.5px solid #dde8f5", borderRadius: 10,
                  fontSize: 14, fontWeight: 500, color: "#384959", outline: "none", boxSizing: "border-box",
                  background: "#fff", transition: "border 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#6A89A7"}
                onBlur={e => e.target.style.borderColor = "#dde8f5"}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 26 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#384959", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color="#88BDF2" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", padding: "11px 44px 11px 40px", border: "1.5px solid #dde8f5", borderRadius: 10,
                  fontSize: 14, fontWeight: 500, color: "#384959", outline: "none", boxSizing: "border-box",
                  background: "#fff", transition: "border 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#6A89A7"}
                onBlur={e => e.target.style.borderColor = "#dde8f5"}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                {showPassword ? <EyeOff size={17} color="#6A89A7" /> : <Eye size={17} color="#6A89A7" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button onClick={handleLogin} disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#6A89A7" : "#384959", color: "#fff", fontWeight: 700, fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(56,73,89,0.22)", transition: "all 0.2s", marginBottom: 14,
              opacity: loading ? 0.75 : 1
            }}>
            {loading ? "Authenticating..." : <><span>Sign In</span><ArrowRight size={17} /></>}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: "#dde8f5" }} />
            <span style={{ fontSize: 11, color: "#88BDF2", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#dde8f5" }} />
          </div>

          {/* Register */}
          <button onClick={() => navigate("/register")}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #88BDF2",
              background: "#fff", color: "#384959", fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#eaf3fc"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <Building2 size={16} color="#6A89A7" />
            <span>Register New University</span>
            <ChevronRight size={15} color="#6A89A7" />
          </button>

        </div>
      </div>
    </div>
  );
}