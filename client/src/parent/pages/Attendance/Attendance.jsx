import React, { useState, } from 'react';
import { Calendar, CheckCircle, XCircle, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useEffect } from "react";
import { getAuth } from "../../../auth/storage";


// ─── Stormy Morning palette (identical to Attendance.jsx) ─────
const C = {
    dark: "#384959",
    mid: "#6A89A7",
    light: "#88BDF2",
    pale: "#BDDDFC",
    bg: "#EDF3FA",
    white: "#ffffff",
};

// ─── Global CSS (identical to Attendance.jsx) ─────────────────
const ATT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: ${C.pale}; border-radius: 99px; }

  .att-page {
    min-height: 100vh;
    background: ${C.bg};
    font-family: 'Inter', sans-serif;
    background-image:
      radial-gradient(ellipse 70% 50% at 6% 0%,   rgba(136,189,242,0.20) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 95% 100%, rgba(189,221,252,0.13) 0%, transparent 50%);
    padding: 14px 12px 52px;
  }
  @media (min-width: 480px)  { .att-page { padding: 18px 18px 56px; } }
  @media (min-width: 768px)  { .att-page { padding: 22px 26px 60px; } }
  @media (min-width: 1024px) { .att-page { padding: 28px 32px 64px; } }

  /* Glass card */
  .att-card {
    background: linear-gradient(150deg, rgba(255,255,255,0.90) 0%, rgba(237,243,250,0.78) 100%);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1.5px solid rgba(136,189,242,0.26);
    border-radius: 20px;
    box-shadow: 0 2px 18px rgba(56,73,89,0.07);
    overflow: hidden;
  }

  /* Skeleton */
  .att-sk {
    background: linear-gradient(90deg,
      rgba(189,221,252,0.28) 25%,
      rgba(189,221,252,0.52) 50%,
      rgba(189,221,252,0.28) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 8px;
  }

  /* Stat grid */
  .att-stat-grid {
    display: grid; gap: 12px;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 768px) { .att-stat-grid { grid-template-columns: repeat(3, 1fr); } }

  /* Record table rows */
  .att-row { transition: background 0.14s; }
  .att-row:hover { background: ${C.bg} !important; }

  /* Animations */
  .a1 { animation: fadeUp .38s ease both .04s; }
  .a2 { animation: fadeUp .38s ease both .10s; }
  .a3 { animation: fadeUp .38s ease both .17s; }
  .a4 { animation: fadeUp .38s ease both .24s; }
  .a5 { animation: fadeUp .38s ease both .30s; }

  /* Grid cell hover */
  .att-grid-cell { transition: transform 0.12s, box-shadow 0.12s; cursor: default; }
  .att-grid-cell[title]:hover { transform: scale(1.18); box-shadow: 0 3px 10px rgba(56,73,89,0.18); z-index: 10; position: relative; }

  /* Year nav buttons */
  .att-year-btn {
    padding: 4px 10px; border-radius: 8px; border: 1.5px solid ${C.pale};
    background: rgba(237,243,250,0.90); color: ${C.dark};
    font-size: 12px; font-weight: 700; font-family: 'Inter', sans-serif;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
  }
  .att-year-btn:hover { border-color: ${C.light}; background: ${C.white}; }
`;


// ─── Stat card (identical to Attendance.jsx) ──────────────────
function StatCard({ label, value, Icon, accent, delay = "0s" }) {
    return (
        <div className="att-card" style={{
            padding: "16px",
            animation: `fadeUp .38s ease both ${delay}`,
            position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", bottom: -12, right: 10,
                opacity: 0.07, pointerEvents: "none",
            }}>
                <Icon size={52} color={accent} />
            </div>
            <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: `${accent}1A`, border: `1px solid ${accent}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
            }}>
                <Icon size={14} color={accent} />
            </div>
            <div style={{
                fontSize: 9, fontWeight: 800, color: C.mid,
                textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 5,
            }}>
                {label}
            </div>
            <div style={{
                fontSize: 28, fontWeight: 900, color: C.dark, lineHeight: 1,
                fontFamily: "'Sora', sans-serif",
            }}>
                {value ?? "—"}
            </div>
        </div>
    );
}

function Attendance() {
    const [selectedYear, setSelectedYear] = useState(2026);
    const [attendanceStats, setAttendanceStats] = useState({
        totalWorkingDays: 0,
        totalPresentDays: 0,
        totalAbsentDays: 0,
        percentage: 0,
    });
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);

    // Sample attendance data (UNCHANGED)


    const months = [
        { name: 'Jan', num: 1 }, { name: 'Feb', num: 2 }, { name: 'Mar', num: 3 },
        { name: 'Apr', num: 4 }, { name: 'May', num: 5 }, { name: 'Jun', num: 6 },
        { name: 'Jul', num: 7 }, { name: 'Aug', num: 8 }, { name: 'Sep', num: 9 },
        { name: 'Oct', num: 10 }, { name: 'Nov', num: 11 }, { name: 'Dec', num: 12 },
    ];

    const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

    const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

    const getCellStatus = (year, monthNum, dayNum) => {
        const key = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return attendanceData[key] || null;
    };

    // Status → Stormy Morning colours (matches Attendance.jsx statusStyle)
    const getCellBg = (status, isValidDay) => {
        if (!isValidDay || !status) return "rgba(241,245,249,0.30)";
        if (status === "present") return "rgba(187,247,208,0.85)";
        if (status === "absent") return "rgba(254,202,202,0.85)";
        if (status === "late") return "rgba(254,240,138,0.85)";
        return "rgba(241,245,249,0.30)";
    };

    const pct = attendanceStats?.percentage || 0;

    // Circular progress values (UNCHANGED logic)
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    const STATS = [
        {
            label: "Total Working Days",
            value: attendanceStats?.totalWorkingDays ?? 0,
            accent: C.light,
            Icon: TrendingUp,
            delay: "0.06s"
        },
        {
            label: "Total Present Days",
            value: attendanceStats?.totalPresentDays ?? 0,
            accent: "#22c55e",
            Icon: CheckCircle,
            delay: "0.12s"
        },
        {
            label: "Total Absent Days",
            value: attendanceStats?.totalAbsentDays ?? 0,
            accent: "#ef4444",
            Icon: XCircle,
            delay: "0.18s"
        },
    ];


    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const auth = getAuth();

                const res = await fetch(
                    `http://localhost:5000/api/parent/attendance?year=${selectedYear}&month=${new Date().getMonth() + 1}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth?.token}`,
                        },
                        credentials: "include", // optional but safe
                    }
                );

                if (!res.ok) {
                    throw new Error("API request failed");
                }

                const json = await res.json();

                if (!json.success) throw new Error(json.message);

                const data = json.data;

                setAttendanceStats({
                    totalWorkingDays: data.stats.totalDays,
                    totalPresentDays: data.stats.present,
                    totalAbsentDays: data.stats.absent,
                    percentage: data.stats.percentage,
                });

                const map = {};
                data.calendarDays.forEach((d) => {
                    const key = `${selectedYear}-${String(d.month).padStart(2, "0")}-${d.date.padStart(2, "0")}`;
                    map[key] = d.status;
                });

                setAttendanceData(map);

            } catch (err) {
                console.error("Attendance fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [selectedYear]);
    if (loading) {
        return <div style={{ padding: 20 }}>Loading attendance...</div>;
    }
    return (
        <>
            <style>{ATT_CSS}</style>

            <div className="att-page">

                {/* ── PAGE HEADER (identical to Attendance.jsx) ── */}
                <div className="a1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 4, height: 30, borderRadius: 99, flexShrink: 0,
                            background: `linear-gradient(180deg, ${C.light} 0%, ${C.dark} 100%)`,
                        }} />
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: "clamp(18px, 4vw, 25px)",
                                fontWeight: 900, color: C.dark, letterSpacing: "-0.5px",
                                fontFamily: "'Sora', sans-serif",
                            }}>
                                Attendance
                            </h1>
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: C.mid, fontWeight: 500 }}>
                                Annual overview · {selectedYear}
                            </p>
                        </div>
                    </div>

                    {/* Overall % pill (identical to Attendance.jsx) */}
                    <div className="att-card" style={{ padding: "10px 20px", textAlign: "center", minWidth: 90 }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
                            {pct}%
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: C.mid, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 3 }}>
                            Overall
                        </div>
                    </div>
                </div>

                {/* ── STAT CARDS ── */}
                <div className="att-stat-grid a2" style={{ marginBottom: 16 }}>
                    {STATS.map(s => <StatCard key={s.label} {...s} />)}
                </div>

                {/* ── TOP ROW: circular progress + goal card ── */}
                <div className="a3" style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>

                    {/* Circular progress — UNCHANGED */}
                    <div className="att-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, flex: "0 0 auto" }}>
                        <svg width="144" height="144" viewBox="0 0 144 144">
                            <circle cx="72" cy="72" r={radius} fill="none" stroke={C.pale} strokeWidth="10" />
                            <circle cx="72" cy="72" r={radius} fill="none" stroke={C.light} strokeWidth="10"
                                strokeDasharray={circumference} strokeDashoffset={circumference * 0.75}
                                strokeLinecap="round" transform="rotate(-90 72 72)" />
                            <circle cx="72" cy="72" r={radius} fill="none" stroke="#22c55e" strokeWidth="10"
                                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round" transform="rotate(-90 72 72)" />
                            <text x="72" y="72" textAnchor="middle" dominantBaseline="middle"
                                style={{ fontSize: "18px", fontWeight: "700", fill: "#16a34a", fontFamily: "'Sora', sans-serif" }}>
                                {pct}%
                            </text>
                        </svg>
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: C.mid, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 6 }}>Attendance Rate</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: C.dark, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>{pct}%</div>
                            <div style={{ fontSize: 11, color: C.mid, marginTop: 4, fontWeight: 500 }}>{selectedYear} Academic Year</div>
                        </div>
                    </div>

                    {/* Attendance Goal card (identical pattern to Attendance.jsx) */}
                    <div className="att-card" style={{ padding: "20px 18px", flex: 1, minWidth: 240 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: `${C.light}1A`, border: `1px solid ${C.light}30`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Award size={13} color={C.light} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Attendance Goal</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: ".07em" }}>Progress</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.dark }}>{pct}%</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 99, background: C.pale, overflow: "hidden", marginBottom: 18 }}>
                            <div style={{
                                height: "100%", borderRadius: 99,
                                width: `${Math.min(pct, 100)}%`,
                                background: `linear-gradient(90deg, ${C.light} 0%, ${C.dark} 100%)`,
                                transition: "width 0.8s cubic-bezier(.22,.68,0,1.2)",
                            }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                            {pct >= 95 ? (
                                <div style={{ padding: "11px 13px", borderRadius: 12, background: "#f0fdf4", borderLeft: "3px solid #22c55e" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>Excellent! 🎉</div>
                                    <div style={{ fontSize: 11, color: "#16a34a", marginTop: 3 }}>You're maintaining great attendance</div>
                                </div>
                            ) : pct >= 75 ? (
                                <div style={{ padding: "11px 13px", borderRadius: 12, background: "#fffbeb", borderLeft: "3px solid #f59e0b" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Keep it up!</div>
                                    <div style={{ fontSize: 11, color: "#d97706", marginTop: 3 }}>Aim for 95% — you're at {pct}%</div>
                                </div>
                            ) : (
                                <div style={{ padding: "11px 13px", borderRadius: 12, background: "#fef2f2", borderLeft: "3px solid #ef4444" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#991b1b" }}>
                                        <AlertCircle size={13} /> Attendance Low
                                    </div>
                                    <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>Below 75% — please improve</div>
                                </div>
                            )}
                            <div style={{ padding: "11px 13px", borderRadius: 12, background: "rgba(237,243,250,0.90)", borderLeft: `3px solid ${C.light}` }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>Target: 95%</div>
                                <div style={{ fontSize: 11, color: C.mid, marginTop: 3 }}>
                                    {pct >= 95 ? "On Track ✓" : `${(95 - pct).toFixed(1)}% to go`}
                                </div>
                            </div>
                            {attendanceStats.totalAbsentDays > 0 && (
                                <div style={{ padding: "11px 13px", borderRadius: 12, background: "#fef2f2", borderLeft: "3px solid #fca5a5" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c" }}>
                                        {attendanceStats.totalAbsentDays} absent day{attendanceStats.totalAbsentDays > 1 ? "s" : ""} this year
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── ATTENDANCE GRID ── */}
                <div className="att-card a4" style={{ overflow: "hidden" }}>
                    {/* Card header (identical pattern to Attendance.jsx section headers) */}
                    <div style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid rgba(136,189,242,0.18)",
                        background: `linear-gradient(90deg, ${C.bg} 0%, ${C.white} 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: `${C.light}1A`, border: `1px solid ${C.light}30`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Calendar size={13} color={C.light} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>My Attendance</span>
                        </div>

                        {/* Year selector — styled with att-year-btn */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button className="att-year-btn" onClick={() => setSelectedYear(y => y - 1)}>‹</button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark, minWidth: 48, textAlign: "center" }}>
                                {selectedYear}
                            </span>
                            <button className="att-year-btn" onClick={() => setSelectedYear(y => y + 1)}>›</button>
                        </div>
                    </div>

                    {/* Grid table */}
                    <div style={{ overflowX: "auto", padding: "14px 18px" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", minWidth: 700 }}>
                            <thead>
                                <tr>
                                    {/* Month label col */}
                                    <th style={{
                                        width: 36, fontSize: 9, fontWeight: 800, color: C.mid,
                                        textTransform: "uppercase", letterSpacing: ".07em",
                                        textAlign: "left", paddingBottom: 6, paddingRight: 6,
                                    }} />
                                    {days.map(d => (
                                        <th key={d} style={{
                                            width: 26, minWidth: 26, fontSize: 9, fontWeight: 800,
                                            color: C.mid, textAlign: "center", paddingBottom: 6,
                                        }}>
                                            {d}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {months.map(month => {
                                    const daysInMonth = getDaysInMonth(selectedYear, month.num);
                                    return (
                                        <tr key={month.name}>
                                            {/* Month label */}
                                            <td style={{
                                                fontSize: 10, fontWeight: 800, color: C.mid,
                                                textTransform: "uppercase", letterSpacing: ".07em",
                                                paddingRight: 8, whiteSpace: "nowrap",
                                                verticalAlign: "middle",
                                            }}>
                                                {month.name}
                                            </td>
                                            {days.map((d, idx) => {
                                                const dayNum = idx + 1;
                                                const isValid = dayNum <= daysInMonth;
                                                const status = isValid ? getCellStatus(selectedYear, month.num, dayNum) : null;
                                                const bg = getCellBg(status, isValid && !!status);
                                                const hasData = isValid && !!status;
                                                return (
                                                    <td key={d}
                                                        className="att-grid-cell"
                                                        title={hasData ? `${month.name} ${dayNum}, ${selectedYear}: ${status}` : ""}
                                                        style={{
                                                            width: 26, minWidth: 26, height: 22,
                                                            background: bg,
                                                            borderRadius: 5,
                                                            border: hasData
                                                                ? status === "present"
                                                                    ? "1px solid rgba(187,247,208,0.60)"
                                                                    : status === "absent"
                                                                        ? "1px solid rgba(254,202,202,0.60)"
                                                                        : "none"
                                                                : "1px solid rgba(136,189,242,0.12)",
                                                        }}
                                                    />
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend (identical to Attendance.jsx) */}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "0 18px 16px" }}>
                        {[
                            { bg: "rgba(187,247,208,0.85)", color: "#166534", label: "Present" },
                            { bg: "rgba(254,202,202,0.85)", color: "#991b1b", label: "Absent" },
                            { bg: "rgba(241,245,249,0.80)", color: "#94a3b8", label: "No Data" },
                        ].map(({ bg, color, label }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 4, background: bg, border: `1px solid ${color}22` }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}

export default Attendance;