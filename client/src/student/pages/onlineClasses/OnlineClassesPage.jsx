// client/src/student/pages/onlineClasses/OnlineClassesPage.jsx

import React, { useState, useEffect } from "react";
import {
  Video,
  ExternalLink,
  Users,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
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

function attendanceBadge(attendance) {
  if (!attendance?.length) return null;
  const rec = attendance[0];
  if (rec.isPresent) {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#e8fdf0", color: "#1a7a45" }}>
        <CheckCircle2 size={10} /> Attended
      </span>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#fde8e8", color: "#a81a1a" }}>
      <XCircle size={10} /> Absent
    </span>
  );
}

function platformIcon(platform) {
  const map = {
    ZOOM:             "🎥",
    GOOGLE_MEET:      "📹",
    MICROSOFT_TEAMS:  "💼",
    CUSTOM:           "🔗",
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

function MetaRow({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span style={{ fontSize: 11, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CLASS CARD
// ═══════════════════════════════════════════════════════════════
function ClassCard({ cls }) {
  const teacherName = cls.teacher
    ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
    : "—";

  const isLive      = cls.status === "LIVE";
  const isCancelled = cls.status === "CANCELLED";
  const canJoin     = (isLive || cls.status === "SCHEDULED") && !isCancelled && cls.meetingLink;

  return (
    <div
      className="lc-card"
      style={{
        background: C.white,
        borderRadius: 16,
        border: isLive
          ? "1.5px solid #6fcf97"
          : `1.5px solid ${C.borderLight}`,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: isLive
          ? "0 4px 16px rgba(27,174,96,0.10)"
          : "0 2px 8px rgba(56,73,89,0.06)",
        opacity: isCancelled ? 0.6 : 1,
      }}
    >
      {/* top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: isLive ? "#e8fdf0" : `${C.mist}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 20,
          }}>
            {platformIcon(cls.platform)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cls.title}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.textLight, marginTop: 2 }}>
              {cls.subject?.name || "General"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {statusBadge(cls.status)}
          {attendanceBadge(cls.attendance)}
        </div>
      </div>

      {/* meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <MetaRow icon={<Calendar size={12} color={C.slate} />} label={fmtDate(cls.startTime)} />
        <MetaRow
          icon={<Clock size={12} color={C.slate} />}
          label={`${fmtTime(cls.startTime)}${cls.endTime ? ` – ${fmtTime(cls.endTime)}` : ""}`}
        />
        <MetaRow icon={<BookOpen size={12} color={C.slate} />} label={teacherName} />
      </div>

      {/* description */}
      {cls.description && (
        <p style={{ margin: 0, fontSize: 11, color: C.textLight, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
          {cls.description}
        </p>
      )}

      {/* divider */}
      <div style={{ height: 1, background: C.borderLight }} />

      {/* join button */}
      {canJoin ? (
        <a
          href={cls.meetingLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px", borderRadius: 10,
            background: isLive
              ? "linear-gradient(135deg, #27ae60, #1a7a45)"
              : `linear-gradient(135deg, ${C.slate}, ${C.deep})`,
            color: "#fff", fontSize: 12, fontWeight: 700,
            textDecoration: "none", fontFamily: "'Inter', sans-serif",
          }}
        >
          <ExternalLink size={13} />
          {isLive ? "Join Now" : "Join Class"}
        </a>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "9px", borderRadius: 10, background: C.bg,
          fontSize: 12, fontWeight: 600, color: C.textLight,
          fontFamily: "'Inter', sans-serif",
        }}>
          {isCancelled ? "Cancelled" : "Class Ended"}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function OnlineClassesPage() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => { fetchClasses(); }, []);

  async function fetchClasses() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/online-classes`, {
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

  // counts for tab badges
  const counts = liveClasses.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
        .lc-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px)  { .lc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .lc-grid { grid-template-columns: repeat(3, 1fr); } }
        .lc-card { transition: transform 0.2s, box-shadow 0.2s; }
        .lc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(56,73,89,0.12) !important; }
        .filter-btn { transition: all 0.15s; }
      `}</style>

      <div style={{ padding: "clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }} className="fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg, ${C.sky}, ${C.deep})`, flexShrink: 0 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(18px, 5vw, 26px)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>
                Online Classes
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: C.textLight, fontWeight: 500 }}>
                Your scheduled and live classes
              </p>
            </div>
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
          {["ALL", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"].map((s) => {
            const count = s === "ALL" ? liveClasses.length : (counts[s] || 0);
            return (
              <button
                key={s}
                className="filter-btn"
                onClick={() => setFilterStatus(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${filterStatus === s ? C.deep : C.border}`,
                  background: filterStatus === s ? C.deep : C.white,
                  color: filterStatus === s ? "#fff" : C.textLight,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                    background: filterStatus === s ? "rgba(255,255,255,0.25)" : `${C.mist}99`,
                    color: filterStatus === s ? "#fff" : C.slate,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="lc-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.borderLight}`, padding: 18 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <Pulse w={44} h={44} r={12} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Pulse w="60%" h={13} />
                    <Pulse w="40%" h={10} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <Pulse w="50%" h={10} />
                  <Pulse w="60%" h={10} />
                  <Pulse w="45%" h={10} />
                </div>
                <Pulse w="100%" h={36} r={10} />
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
              {filterStatus === "ALL" ? "No online classes scheduled yet" : `No ${filterStatus.toLowerCase()} classes`}
            </p>
          </div>
        ) : (
          <div className="lc-grid fade-up">
            {filtered.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}