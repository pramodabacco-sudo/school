// client/src/teacher/pages/timetable/TimetablePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Clock, Users, AlertCircle,
  RefreshCw, CalendarDays, Zap,
} from "lucide-react";
import { getToken } from "../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;

/* ── Design tokens (Stormy Morning) ── */
const C = {
  slate: "#6A89A7", mist: "#BDDDFC", sky: "#88BDF2", deep: "#384959",
  deepDark: "#243340",
  bg: "#EDF3FA", white: "#FFFFFF", border: "#C8DCF0", borderLight: "#DDE9F5",
  text: "#243340", textLight: "#6A89A7",
};

const WEEK_DAYS = [
  { key: "MONDAY",    short: "Mon" },
  { key: "TUESDAY",   short: "Tue" },
  { key: "WEDNESDAY", short: "Wed" },
  { key: "THURSDAY",  short: "Thu" },
  { key: "FRIDAY",    short: "Fri" },
  { key: "SATURDAY",  short: "Sat" },
  { key: "SUNDAY",    short: "Sun" },
];

const JS_DAY_TO_KEY = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
};

const DAY_LABELS = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const toMinutes = (t = "00:00") => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/* ── Skeleton ── */
function Pulse({ w = "100%", h = 13, r = 8 }) {
  return <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: `${C.mist}55` }}/>;
}

/* ── Period card — handles both REGULAR and EXTRA types ── */
function PeriodCard({ entry, isSelectedToday }) {
  const pd         = entry.periodDefinition;
  const isExtra    = entry.type === "EXTRA";

  const isNow = isSelectedToday && (() => {
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    return cur >= toMinutes(entry.startTime) && cur < toMinutes(entry.endTime);
  })();

  return (
    <div
      style={{
        borderRadius: 13,
        border: `1.5px solid ${isNow ? C.sky : isExtra ? C.border : C.borderLight}`,
        background: isNow ? `${C.sky}08` : isExtra ? `${C.mist}22` : C.bg,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${C.sky}28`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>

        {/* Left strip — period number or extra icon */}
        <div style={{
          width: 52, flexShrink: 0,
          background: isNow
            ? `linear-gradient(180deg, ${C.sky}, ${C.deep})`
            : isExtra
              ? `linear-gradient(180deg, ${C.slate}33, ${C.slate}18)`
              : `linear-gradient(180deg, ${C.slate}22, ${C.deep}18)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRight: `1.5px solid ${isNow ? C.sky : C.borderLight}`,
        }}>
          {isExtra
            ? <Zap size={18} color={isNow ? C.white : C.slate} strokeWidth={2}/>
            : (
              <span style={{ fontSize: 18, fontWeight: 900, color: isNow ? C.white : C.slate, fontFamily: "'Inter', sans-serif" }}>
                {pd.periodNumber}
              </span>
            )
          }
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

          {/* Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 80, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={11} color={C.textLight}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'Inter', sans-serif" }}>
                {entry.startTime}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={11} style={{ opacity: 0 }}/>
              <span style={{ fontSize: 11, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>
                {entry.endTime}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 36, background: C.borderLight, flexShrink: 0 }}/>

          {/* Subject + class section */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <BookOpen size={13} color={isNow ? C.sky : C.slate}/>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.subject?.name ?? "—"}
              </span>
              {entry.subject?.code && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: `${C.sky}18`, color: C.deep, fontFamily: "'Inter', sans-serif" }}>
                  {entry.subject.code}
                </span>
              )}
              {isNow && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: C.sky, color: C.white, fontFamily: "'Inter', sans-serif" }}>
                  NOW
                </span>
              )}
              {isExtra && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${C.mist}55`, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
                  EXTRA
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={11} color={C.textLight}/>
              <span style={{ fontSize: 12, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>
                {entry.classSection?.name ?? "—"}
              </span>
            </div>
          </div>

          {/* Right badge — period label or extra class reason */}
          <div style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: `${C.mist}55`, color: C.slate, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              {isExtra ? (entry.reason || entry.extraClassType || "Extra") : pd.label}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══ */
export default function TimetablePage() {
  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState(todayKey ?? "MONDAY");
  const [schedule,    setSchedule]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [refreshKey,  setRefreshKey]  = useState(0);

  const fetchSchedule = useCallback(async (day) => {
    setLoading(true);
    setError("");
    try {
      // Always use /today for today's day — gets specificDate extra classes too
      const endpoint = day === todayKey
        ? `${API_URL}/api/teacher/timetable/today`
        : `${API_URL}/api/teacher/timetable/day/${day}`;

      const res  = await fetch(endpoint, { headers: { Authorization: `Bearer ${getToken()}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || `HTTP ${res.status}`);
      setSchedule(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [todayKey, refreshKey]);

  useEffect(() => { fetchSchedule(selectedDay); }, [selectedDay, fetchSchedule]);

  const isToday        = (day) => day === todayKey;
  const isSelectedToday = isToday(selectedDay);

  // Always derive from currently loaded schedule (fixes Bug 1)
  const entries     = schedule?.entries ?? [];
  const firstEntry  = entries[0];
  const lastEntry   = entries[entries.length - 1];
  const schoolStart = firstEntry?.startTime ?? null;
  const schoolEnd   = lastEntry?.endTime    ?? null;
  const totalPeriods = schedule?.totalPeriods ?? 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
        .tt-page { padding: 20px 16px; }
        @media (min-width: 480px)  { .tt-page { padding: 20px 20px; } }
        @media (min-width: 768px)  { .tt-page { padding: 24px 28px; } }
        @media (min-width: 1024px) { .tt-page { padding: 28px 32px; } }
        .day-btn:hover { background: ${C.mist}55 !important; }
      `}</style>

      <div className="tt-page" style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", backgroundImage: `radial-gradient(circle at 15% 0%, ${C.mist}28 0%, transparent 50%)` }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }} className="fade-up">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg, ${C.sky}, ${C.deep})`, flexShrink: 0 }}/>
                <h1 style={{ margin: 0, fontSize: "clamp(18px,5vw,26px)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>My Timetable</h1>
              </div>
              <p style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: C.textLight, fontWeight: 500 }}>
                {schedule?.academicYear?.name ?? "Loading…"}
              </p>
            </div>
            <button onClick={() => setRefreshKey(k => k + 1)}
              style={{ width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${C.borderLight}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textLight }}
              onMouseEnter={e => (e.currentTarget.style.background = `${C.mist}55`)}
              onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
            </button>
          </div>
        </div>

        {/* Stat cards — always reflect selected day, not hardcoded to today */}
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Classes",     value: loading ? "—" : String(totalPeriods), Icon: BookOpen,    sub: `${DAY_LABELS[selectedDay]} periods` },
            { label: "Start Time",  value: loading ? "—" : (schoolStart ?? "—"), Icon: Clock,       sub: "first class" },
            { label: "End Time",    value: loading ? "—" : (schoolEnd   ?? "—"), Icon: Clock,       sub: "last class"  },
            { label: "Day",         value: DAY_LABELS[selectedDay],               Icon: CalendarDays, sub: isSelectedToday ? "today" : "viewing" },
          ].map(({ label, value, Icon, sub }) => (
            <div key={label} style={{ borderRadius: 16, padding: "18px 20px", background: C.white, borderLeft: `4px solid ${C.sky}`, boxShadow: "0 2px 12px rgba(56,73,89,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Inter', sans-serif" }}>{label}</p>
                  <p style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 900, color: C.deep, fontFamily: "'Inter', sans-serif" }}>{value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>{sub}</p>
                </div>
                <Icon size={32} color={C.sky} style={{ opacity: 0.18 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Day selector */}
        <div className="fade-up" style={{ borderRadius: 18, padding: "16px 18px", marginBottom: 20, background: C.white, border: `1.5px solid ${C.borderLight}`, boxShadow: "0 2px 12px rgba(56,73,89,0.06)" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Inter', sans-serif" }}>
            Select Day
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {WEEK_DAYS.map(({ key, short }) => {
              const active = selectedDay === key;
              const today  = isToday(key);
              return (
                <button key={key}
                  className={active ? "" : "day-btn"}
                  onClick={() => setSelectedDay(key)}
                  style={{ position: "relative", padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${active ? C.deep : C.borderLight}`, background: active ? `linear-gradient(135deg, ${C.slate}, ${C.deep})` : C.white, color: active ? C.white : C.textLight, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}>
                  {short}
                  {today && (
                    <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: C.sky, border: `2px solid ${C.white}` }}/>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule list */}
        <div className="fade-up" style={{ background: C.white, borderRadius: 18, border: `1.5px solid ${C.borderLight}`, boxShadow: "0 2px 16px rgba(56,73,89,0.06)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "14px 18px", borderBottom: `1.5px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, background: `linear-gradient(90deg, ${C.bg}, ${C.white})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.sky}, ${C.deep})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${C.sky}44`, flexShrink: 0 }}>
                <CalendarDays size={17} color="#fff" strokeWidth={2}/>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Inter', sans-serif" }}>
                  {DAY_LABELS[selectedDay]}
                  {isSelectedToday && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${C.sky}18`, color: C.deep, fontFamily: "'Inter', sans-serif" }}>TODAY</span>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>
                  {loading ? "Loading…" : `${totalPeriods} period${totalPeriods !== 1 ? "s" : ""}`}
                  {!loading && schoolStart && schoolEnd && (
                    <span style={{ marginLeft: 8 }}>· {schoolStart} – {schoolEnd}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: 18 }}>

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, background: `${C.mist}55`, border: `1px solid ${C.border}`, marginBottom: 16, fontSize: 13, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }}/> {error}
              </div>
            )}

            {/* Skeletons */}
            {loading && !error && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ borderRadius: 13, border: `1.5px solid ${C.borderLight}`, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: 52, background: `${C.mist}33`, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                      <Pulse w={24} h={24} r={6}/>
                    </div>
                    <div style={{ flex: 1, padding: "16px 18px", display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 80 }}>
                        <Pulse w={65} h={12}/><Pulse w={45} h={10}/>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <Pulse w="50%" h={14}/><Pulse w="30%" h={10}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && entries.length === 0 && (
              <div style={{ padding: "50px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `${C.sky}18`, border: `1px solid ${C.sky}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={26} color={C.sky} strokeWidth={1.5}/>
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text, fontFamily: "'Inter', sans-serif" }}>No classes scheduled</p>
                <p style={{ margin: 0, fontSize: 12, color: C.textLight, fontFamily: "'Inter', sans-serif" }}>No periods assigned for {DAY_LABELS[selectedDay]}</p>
              </div>
            )}

            {/* Period cards */}
            {!loading && !error && entries.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {entries.map((entry, i) => (
                  <PeriodCard key={entry.id ?? i} entry={entry} isSelectedToday={isSelectedToday}/>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}