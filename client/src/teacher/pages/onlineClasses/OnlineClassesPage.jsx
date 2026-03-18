// client/src/teacher/pages/onlineClasses/OnlineClassesPage.jsx
import React, { useState, useEffect } from "react";
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Users,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  Radio,
} from "lucide-react";
import { getToken } from "../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;

const C = {
  slate: "#6A89A7",
  mist: "#BDDDFC",
  sky: "#88BDF2",
  deep: "#384959",
  deepDark: "#243340",
  bg: "#EDF3FA",
  white: "#FFFFFF",
  border: "#C8DCF0",
  borderLight: "#DDE9F5",
  text: "#243340",
  textLight: "#6A89A7",
};

// ── helpers ───────────────────────────────────────────────────
function Pulse({ w = "100%", h = 13, r = 8 }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: `${C.mist}55` }}
    />
  );
}

function statusBadge(status) {
  const map = {
    SCHEDULED: { bg: "#e8f4fd", color: "#1a6fa8", label: "Scheduled" },
    LIVE:      { bg: "#e8fdf0", color: "#1a7a45", label: "● Live" },
    COMPLETED: { bg: "#f0f0f0", color: "#555",    label: "Completed" },
    CANCELLED: { bg: "#fde8e8", color: "#a81a1a", label: "Cancelled" },
  };
  const s = map[status] || map.SCHEDULED;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
      background: s.bg, color: s.color, fontFamily: "'Inter', sans-serif",
    }}>
      {s.label}
    </span>
  );
}

function platformIcon(platform) {
  const map = {
    ZOOM: "🎥",
    GOOGLE_MEET: "📹",
    MICROSOFT_TEAMS: "💼",
    CUSTOM: "🔗",
  };
  return map[platform] || "🔗";
}

function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── Modal wrapper (same pattern as CurriculumPage) ────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(36,51,64,0.45)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: C.white, borderRadius: 20, border: `1.5px solid ${C.borderLight}`,
        boxShadow: `0 24px 64px rgba(56,73,89,0.22)`, width: "100%",
        maxWidth: 520, padding: "22px 22px", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 800, color: C.text, flex: 1, marginRight: 10 }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.textLight, fontSize: 16, fontWeight: 700, flexShrink: 0,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Field label helper ────────────────────────────────────────
function Label({ children }) {
  return (
    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Input({ ...props }) {
  return (
    <input {...props} style={{
      width: "100%", padding: "10px 14px", borderRadius: 12,
      border: `1.5px solid ${C.border}`, fontFamily: "'Inter', sans-serif",
      fontSize: 13, color: C.text, background: C.bg, outline: "none",
      marginBottom: 14, ...props.style,
    }} />
  );
}

function Select({ children, ...props }) {
  return (
    <select {...props} style={{
      width: "100%", padding: "10px 14px", borderRadius: 12,
      border: `1.5px solid ${C.border}`, fontFamily: "'Inter', sans-serif",
      fontSize: 13, color: C.text, background: C.bg, outline: "none",
      marginBottom: 14, cursor: "pointer",
    }}>
      {children}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function OnlineClassesPage() {
  const [liveClasses, setLiveClasses]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);   // null = create, obj = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => { fetchClasses(); }, []);

  async function fetchClasses() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/api/teacher/live-classes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveClasses(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filterStatus === "ALL"
    ? liveClasses
    : liveClasses.filter((c) => c.status === filterStatus);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
        .lc-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px) { .lc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .lc-grid { grid-template-columns: repeat(3, 1fr); } }
        .lc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(56,73,89,0.12) !important; }
        .lc-card { transition: transform 0.2s, box-shadow 0.2s; }
        .lc-action-btn:hover { opacity: 0.8; }
        .filter-btn { transition: all 0.15s; }
      `}</style>

      <div style={{ padding: "clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }} className="fade-up">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg, ${C.sky}, ${C.deep})`, flexShrink: 0 }} />
              <div>
                <h1 style={{ margin: 0, fontSize: "clamp(18px, 5vw, 26px)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>
                  Online Classes
                </h1>
                <p style={{ margin: 0, fontSize: 12, color: C.textLight, fontWeight: 500 }}>
                  Schedule and manage your live classes
                </p>
              </div>
            </div>
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
                borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.slate}, ${C.deep})`,
                color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={15} /> New Class
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, background: "#fee8e8", border: "1px solid #f5b0b0", marginBottom: 16, fontSize: 13, color: "#8b1c1c" }}>
            <AlertCircle size={14} /><span>{error}</span>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }} className="fade-up">
          {["ALL", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              className="filter-btn"
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${filterStatus === s ? C.deep : C.border}`,
                background: filterStatus === s ? C.deep : C.white,
                color: filterStatus === s ? "#fff" : C.textLight,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* ── Loading skeletons ── */}
        {loading ? (
          <div className="lc-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.borderLight}`, padding: 18 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <Pulse w={44} h={44} r={12} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Pulse w="60%" h={13} /><Pulse w="40%" h={10} />
                  </div>
                </div>
                <Pulse w="100%" h={8} r={99} /><div style={{ height: 10 }} />
                <Pulse w="80%" h={10} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: `${C.mist}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Video size={26} color={C.slate} />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.deep }}>No classes found</p>
            <p style={{ margin: 0, fontSize: 12, color: C.textLight }}>
              {filterStatus === "ALL" ? "Create your first live class" : `No ${filterStatus.toLowerCase()} classes`}
            </p>
          </div>
        ) : (
          <div className="lc-grid fade-up">
            {filtered.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                onEdit={() => { setEditTarget(cls); setShowModal(true); }}
                onDelete={() => setDeleteTarget(cls)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <ClassFormModal
          editTarget={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchClasses(); }}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <DeleteModal
          cls={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); fetchClasses(); }}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CLASS CARD
// ═══════════════════════════════════════════════════════════════
function ClassCard({ cls, onEdit, onDelete }) {
  const sectionNames = cls.sections?.map((s) => s.classSection?.name).filter(Boolean).join(", ") || "—";

  return (
    <div className="lc-card" style={{
      background: C.white, borderRadius: 16, border: `1.5px solid ${C.borderLight}`,
      padding: 18, display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "0 2px 8px rgba(56,73,89,0.06)",
    }}>
      {/* top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.mist}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
            {platformIcon(cls.platform)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cls.title}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.textLight, marginTop: 2 }}>{cls.subject?.name || "No subject"}</p>
          </div>
        </div>
        {statusBadge(cls.status)}
      </div>

      {/* meta rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <MetaRow icon={<Calendar size={12} color={C.slate} />} label={fmtDate(cls.startTime)} />
        <MetaRow icon={<Clock size={12} color={C.slate} />} label={`${fmtTime(cls.startTime)}${cls.endTime ? ` – ${fmtTime(cls.endTime)}` : ""}`} />
        <MetaRow icon={<Users size={12} color={C.slate} />} label={sectionNames} />
      </div>

      {/* divider */}
      <div style={{ height: 1, background: C.borderLight }} />

      {/* actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <a href={cls.meetingLink} target="_blank" rel="noreferrer" style={{
          flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px", borderRadius: 10, background: `linear-gradient(135deg, ${C.slate}, ${C.deep})`,
          color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
        }}>
          <ExternalLink size={13} /> Join
        </a>
        <button className="lc-action-btn" onClick={onEdit} style={{ flex: 1, padding: "8px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pencil size={13} color={C.slate} />
        </button>
        <button className="lc-action-btn" onClick={onDelete} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid #f5b0b0", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={13} color="#c0392b" />
        </button>
      </div>
    </div>
  );
}

function MetaRow({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span style={{ fontSize: 11, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CREATE / EDIT FORM MODAL
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  title: "", description: "", platform: "GOOGLE_MEET", meetingLink: "",
  startTime: "", endTime: "", status: "SCHEDULED",
  subjectId: "", academicYearId: "", classSectionIds: [],
};

function ClassFormModal({ editTarget, onClose, onSaved }) {
  const isEdit = !!editTarget;
  const [form, setForm]           = useState(isEdit ? mapEditToForm(editTarget) : EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [subjects, setSubjects]   = useState([]);
  const [ayears, setAyears]       = useState([]);
  const [sections, setSections]   = useState([]);

  useEffect(() => { loadDropdowns(); }, []);

  async function loadDropdowns() {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [sRes, aRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/teacher/live-classes/dropdowns/subjects`, { headers }),
        fetch(`${API_URL}/api/teacher/live-classes/dropdowns/academic-years`, { headers }),
        fetch(`${API_URL}/api/teacher/live-classes/dropdowns/class-sections`, { headers }),
      ]);
      const [s, a, c] = await Promise.all([sRes.json(), aRes.json(), cRes.json()]);
      setSubjects(s.data || []);
      setAyears(a.data || []);
      setSections(c.data || []);
    } catch (e) {
      setError("Failed to load dropdowns");
    }
  }

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function toggleSection(id) {
    setForm((f) => ({
      ...f,
      classSectionIds: f.classSectionIds.includes(id)
        ? f.classSectionIds.filter((x) => x !== id)
        : [...f.classSectionIds, id],
    }));
  }

  async function handleSave() {
    if (!form.title.trim())     return setError("Title is required");
    if (!form.meetingLink.trim()) return setError("Meeting link is required");
    if (!form.startTime)        return setError("Start time is required");
    if (!form.academicYearId)   return setError("Academic year is required");
    if (form.classSectionIds.length === 0) return setError("Select at least one class section");

    try {
      setSaving(true);
      setError("");
      const url    = isEdit ? `${API_URL}/api/teacher/live-classes/${editTarget.id}` : `${API_URL}/api/teacher/live-classes`;
      const method = isEdit ? "PUT" : "POST";
      const body   = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime:   form.endTime ? new Date(form.endTime).toISOString() : null,
        subjectId: form.subjectId || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Live Class" : "New Live Class"} onClose={onClose}>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "#fee8e8", border: "1px solid #f5b0b0", marginBottom: 14, fontSize: 12, color: "#8b1c1c" }}>
          <AlertCircle size={13} /><span>{error}</span>
        </div>
      )}

      <Label>Title *</Label>
      <Input placeholder="e.g. Math Revision – Chapter 5" value={form.title} onChange={(e) => set("title", e.target.value)} />

      <Label>Description</Label>
      <textarea
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Optional notes for students"
        rows={2}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.text, background: C.bg, outline: "none", resize: "vertical", marginBottom: 14 }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Platform *</Label>
          <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
            <option value="GOOGLE_MEET">Google Meet</option>
            <option value="ZOOM">Zoom</option>
            <option value="MICROSOFT_TEAMS">MS Teams</option>
            <option value="CUSTOM">Custom</option>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </div>

      <Label>Meeting Link *</Label>
      <Input placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={(e) => set("meetingLink", e.target.value)} />

      <Label>Recording URL</Label>
      <Input placeholder="https://drive.google.com/... (optional)" value={form.recordingUrl || ""} onChange={(e) => set("recordingUrl", e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Start Time *</Label>
          <Input type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
        </div>
        <div>
          <Label>End Time</Label>
          <Input type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
        </div>
      </div>

      <Label>Academic Year *</Label>
      <Select value={form.academicYearId} onChange={(e) => set("academicYearId", e.target.value)}>
        <option value="">Select academic year</option>
        {ayears.map((a) => <option key={a.id} value={a.id}>{a.name}{a.isActive ? " (Active)" : ""}</option>)}
      </Select>

      <Label>Subject (optional)</Label>
      <Select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
        <option value="">No specific subject</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>

      <Label>Class Sections * (select one or more)</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {sections.map((s) => {
          const selected = form.classSectionIds.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleSection(s.id)}
              style={{
                padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${selected ? C.deep : C.border}`,
                background: selected ? C.deep : C.bg,
                color: selected ? "#fff" : C.textLight,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              {s.name}
            </button>
          );
        })}
        {sections.length === 0 && <span style={{ fontSize: 12, color: C.textLight }}>Loading sections...</span>}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.textLight, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.slate}, ${C.deep})`, color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? "Update Class" : "Create Class"}
        </button>
      </div>
    </Modal>
  );
}

function mapEditToForm(cls) {
  return {
    title:           cls.title || "",
    description:     cls.description || "",
    platform:        cls.platform || "GOOGLE_MEET",
    meetingLink:     cls.meetingLink || "",
    recordingUrl:    cls.recordingUrl || "",
    startTime:       cls.startTime ? cls.startTime.slice(0, 16) : "",
    endTime:         cls.endTime   ? cls.endTime.slice(0, 16)   : "",
    status:          cls.status || "SCHEDULED",
    subjectId:       cls.subjectId || "",
    academicYearId:  cls.academicYearId || "",
    classSectionIds: cls.sections?.map((s) => s.classSectionId) || [],
  };
}

// ═══════════════════════════════════════════════════════════════
//  DELETE CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════
function DeleteModal({ cls, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");

  async function handleDelete() {
    try {
      setDeleting(true);
      const res = await fetch(`${API_URL}/api/teacher/live-classes/${cls.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      onDeleted();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal title="Cancel Live Class" onClose={onClose}>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>
        Are you sure you want to cancel <strong style={{ color: C.text }}>{cls.title}</strong>? This will mark it as cancelled.
      </p>
      {error && <p style={{ color: "#c0392b", fontSize: 12, margin: "0 0 12px" }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.textLight, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Keep
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "#c0392b", color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {deleting ? <><Loader2 size={14} className="animate-spin" /> Cancelling...</> : "Cancel Class"}
        </button>
      </div>
    </Modal>
  );
}