import React, { useState } from "react";
import { Medal, Search, FileText, X } from "lucide-react";

// ─── Design tokens (identical to CertificatesPage.jsx) ─────────
const C = {
    dark: "#384959",
    mid: "#6A89A7",
    light: "#88BDF2",
    pale: "#BDDDFC",
    bg: "#EDF3FA",
    white: "#ffffff",
    border: "rgba(136,189,242,0.30)",
};

// ─── Font + scoped CSS (identical to CertificatesPage.jsx) ─────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .cert-root, .cert-root * { font-family: 'Inter', sans-serif !important; box-sizing: border-box; }

  @keyframes cert-spin { to { transform: rotate(360deg); } }
  @keyframes cert-pulse { 0%,100%{ opacity:1; } 50%{ opacity:.45; } }

  .cert-sk { animation: cert-pulse 1.5s ease-in-out infinite; background: ${C.pale}; border-radius: 7px; }

  .cert-card {
    transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
    cursor: pointer;
  }
  .cert-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(56,73,89,0.12) !important;
    border-color: rgba(136,189,242,0.55) !important;
  }

  .cert-pill {
    transition: background 0.13s, color 0.13s, border-color 0.13s;
    cursor: pointer; border: none;
  }
  .cert-pill:hover { opacity: 0.82; }

  .cert-btn {
    transition: opacity 0.13s;
    cursor: pointer; border: none;
    font-family: 'Inter', sans-serif !important;
  }
  .cert-btn:hover { opacity: 0.85; }
  .cert-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .cert-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 1100px) { .cert-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 620px)  { .cert-grid { grid-template-columns: 1fr; gap: 12px; } }

  .cert-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }
  @media (max-width: 900px)  { .cert-stat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px)  { .cert-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

  .cert-page { padding: 24px 28px; }
  @media (max-width: 768px)  { .cert-page { padding: 16px; } }
  @media (max-width: 480px)  { .cert-page { padding: 12px 10px; } }

  .cert-search {
    display: flex; align-items: center; gap: 8px;
    background: ${C.white}; border: 1.5px solid ${C.border};
    border-radius: 10px; padding: 0 13px; height: 38px;
    width: 100%;
  }
  .cert-search input {
    border: none; outline: none; background: transparent;
    font-size: 13px; color: ${C.dark}; width: 100%;
    font-family: 'Inter', sans-serif !important;
  }
  .cert-search input::placeholder { color: ${C.mid}; }

  .cert-line-clamp2 {
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
`;

// ─── Stat Card (identical to CertificatesPage.jsx) ─────────────
function StatCard({ icon, label, value, color }) {
    return (
        <div style={{
            background: C.white, borderRadius: 12, padding: "16px 18px",
            border: `1px solid ${C.border}`,
            borderLeftWidth: 4, borderLeftColor: color, borderLeftStyle: "solid",
            position: "relative", overflow: "hidden",
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.mid, margin: 0 }}>
                    {label}
                </p>
                <span style={{ fontSize: 20, opacity: 0.22, lineHeight: 1 }}>{icon}</span>
            </div>
            <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 32, fontWeight: 900, color: C.dark, margin: 0, lineHeight: 1 }}>{value}</p>
            </div>
        </div>
    );
}

// ── Certificate Card (visual document style — UNCHANGED logic) ──
const CertificateCard = ({ cert, onView }) => (
    <div
        className="cert-card"
        onClick={() => onView(cert)}
        style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(56,73,89,0.06)",
            overflow: "hidden",
        }}
    >
        {/* Colored top bar */}
        <div style={{ height: 4, background: "#1e3a8a" }} />

        <div style={{ padding: "14px 16px" }}>
            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8" }}>
                    🏅 Achievement
                </span>
                {cert.hasRibbon && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: "#FEF9C3", color: "#92400E" }}>
                        🥇 Award
                    </span>
                )}
            </div>

            {/* Visual cert preview — UNCHANGED design from original */}
            <div style={{ position: "relative", aspectRatio: "4/3", background: C.white, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: 12 }}>
                {/* Top-left corner */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 64, height: 64, overflow: "hidden" }}>
                    <div style={{ position: "absolute", width: 0, height: 0, borderTop: "64px solid #1e3a8a", borderRight: "64px solid transparent" }} />
                    <div style={{ position: "absolute", width: 0, height: 0, borderTop: "56px solid #ca8a04", borderRight: "56px solid transparent" }} />
                </div>
                {/* Bottom-right corner */}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 64, height: 64, overflow: "hidden" }}>
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderBottom: "64px solid #1e3a8a", borderLeft: "64px solid transparent" }} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderBottom: "56px solid #ca8a04", borderLeft: "56px solid transparent" }} />
                </div>
                {/* Diagonal lines */}
                <svg style={{ position: "absolute", top: 8, right: 8, opacity: 0.2 }} width="80" height="80" viewBox="0 0 80 80">
                    <line x1="80" y1="0" x2="0" y2="80" stroke="#1e3a8a" strokeWidth="1" />
                    <line x1="80" y1="10" x2="10" y2="80" stroke="#1e3a8a" strokeWidth="1" />
                    <line x1="80" y1="20" x2="20" y2="80" stroke="#1e3a8a" strokeWidth="1" />
                </svg>
                {/* Content */}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 32px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "3px", color: "#1f2937", textTransform: "uppercase", margin: 0 }}>CERTIFICATE</p>
                    <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: "#2563eb", textTransform: "uppercase", margin: "2px 0 0" }}>OF ACHIEVEMENT</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", width: "100%" }}>
                        <div style={{ flex: 1, height: 1, background: "#d1d5db" }} />
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#9ca3af" }} />
                        <div style={{ flex: 1, height: 1, background: "#d1d5db" }} />
                    </div>
                    <p style={{ fontSize: 7, letterSpacing: "2px", color: "#9ca3af", textTransform: "uppercase", margin: 0 }}>PROUDLY PRESENTED TO</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#2563eb", margin: "4px 0 0" }}>{cert.recipient}</p>
                    <div style={{ width: 96, height: 1, background: "#d1d5db", margin: "8px auto" }} />
                    <p style={{ fontSize: 8, color: "#6b7280", margin: 0 }}>{cert.description}</p>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", marginTop: 12, padding: "0 8px" }}>
                        <div style={{ textAlign: "left" }}>
                            <p style={{ fontSize: 8, fontWeight: 500, color: "#1f2937", margin: 0 }}>{cert.date}</p>
                            <div style={{ width: 56, height: 1, background: "#9ca3af", marginTop: 2 }} />
                            <p style={{ fontSize: 6, letterSpacing: "2px", color: "#9ca3af", textTransform: "uppercase", margin: "2px 0 0" }}>DATE</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: -4 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fde68a, #f59e0b, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>★</div>
                            </div>
                            {cert.hasRibbon && (
                                <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                                    <div style={{ width: 8, height: 12, background: "#1d4ed8", borderRadius: "0 0 2px 2px" }} />
                                    <div style={{ width: 8, height: 12, background: "#1e40af", borderRadius: "0 0 2px 2px" }} />
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 8, fontWeight: 500, fontStyle: "italic", color: "#1f2937", margin: 0 }}>{cert.awarder}</p>
                            <div style={{ width: 56, height: 1, background: "#9ca3af", marginTop: 2, marginLeft: "auto" }} />
                            <p style={{ fontSize: 6, letterSpacing: "2px", color: "#9ca3af", textTransform: "uppercase", margin: "2px 0 0" }}>SIGNATURE</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title */}
            <p className="cert-line-clamp2" style={{ fontSize: 14, fontWeight: 800, color: C.dark, margin: "0 0 5px", lineHeight: 1.3 }}>
                {cert.description}
            </p>
            <p style={{ fontSize: 11, color: C.mid, margin: "0 0 12px" }}>
                🗓️ {cert.date} · {cert.awarder}
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: C.border, margin: "0 0 12px" }} />

            {/* CTA */}
            <button
                className="cert-btn"
                onClick={e => { e.stopPropagation(); onView(cert); }}
                style={{
                    width: "100%", padding: "8px 0", borderRadius: 9,
                    background: C.dark, color: C.white,
                    fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
            >
                <FileText size={12} /> View Certificate
            </button>
        </div>
    </div>
);

// ─── Certificate Modal ─────────────────────────────────────────
function CertificateModal({ selected, onClose }) {
    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(20,28,40,0.88)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "24px 16px", overflowY: "auto",
            }}
            onClick={onClose}
        >
            <div
                style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 580 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button onClick={onClose} style={{
                    position: "absolute", top: -16, right: -16, zIndex: 10,
                    width: 36, height: 36, borderRadius: "50%", background: C.white,
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}>
                    <X size={16} color={C.dark} />
                </button>

                {/* Full cert */}
                <div style={{ width: "100%", background: C.white, borderRadius: 12, boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }}>
                    {/* Corners */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 80, overflow: "hidden" }}>
                        <div style={{ position: "absolute", width: 0, height: 0, borderTop: "80px solid #1e3a8a", borderRight: "80px solid transparent" }} />
                        <div style={{ position: "absolute", width: 0, height: 0, borderTop: "68px solid #ca8a04", borderRight: "68px solid transparent" }} />
                    </div>
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 80, height: 80, overflow: "hidden" }}>
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderBottom: "80px solid #1e3a8a", borderLeft: "80px solid transparent" }} />
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderBottom: "68px solid #ca8a04", borderLeft: "68px solid transparent" }} />
                    </div>
                    <svg style={{ position: "absolute", top: 12, right: 12, opacity: 0.15 }} width="120" height="120" viewBox="0 0 80 80">
                        <line x1="80" y1="0" x2="0" y2="80" stroke="#1e3a8a" strokeWidth="1" />
                        <line x1="80" y1="10" x2="10" y2="80" stroke="#1e3a8a" strokeWidth="1" />
                        <line x1="80" y1="20" x2="20" y2="80" stroke="#1e3a8a" strokeWidth="1" />
                    </svg>
                    <div style={{ textAlign: "center", padding: "32px 48px 36px" }}>
                        <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: "4px", color: "#1f2937", textTransform: "uppercase", margin: 0 }}>CERTIFICATE</p>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "3px", color: "#2563eb", textTransform: "uppercase", margin: "4px 0 0" }}>OF ACHIEVEMENT</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                            <div style={{ flex: 1, height: 1, background: "#d1d5db" }} />
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#9ca3af" }} />
                            <div style={{ flex: 1, height: 1, background: "#d1d5db" }} />
                        </div>
                        <p style={{ fontSize: 10, letterSpacing: "3px", color: "#9ca3af", textTransform: "uppercase", margin: 0 }}>PROUDLY PRESENTED TO</p>
                        <p style={{ fontSize: 24, fontWeight: 800, color: "#2563eb", margin: "10px 0 0" }}>{selected.recipient}</p>
                        <div style={{ width: 120, height: 1, background: "#d1d5db", margin: "14px auto" }} />
                        <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{selected.description}</p>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 28, padding: "0 16px" }}>
                            <div style={{ textAlign: "left" }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", margin: 0 }}>{selected.date}</p>
                                <div style={{ width: 80, height: 1, background: "#9ca3af", marginTop: 4 }} />
                                <p style={{ fontSize: 9, letterSpacing: "2px", color: "#9ca3af", textTransform: "uppercase", margin: "4px 0 0" }}>DATE</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fde68a, #f59e0b, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>★</div>
                                </div>
                                {selected.hasRibbon && (
                                    <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                                        <div style={{ width: 10, height: 16, background: "#1d4ed8", borderRadius: "0 0 3px 3px" }} />
                                        <div style={{ width: 10, height: 16, background: "#1e40af", borderRadius: "0 0 3px 3px" }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ fontSize: 13, fontWeight: 600, fontStyle: "italic", color: "#1f2937", margin: 0 }}>{selected.awarder}</p>
                                <div style={{ width: 80, height: 1, background: "#9ca3af", marginTop: 4, marginLeft: "auto" }} />
                                <p style={{ fontSize: 9, letterSpacing: "2px", color: "#9ca3af", textTransform: "uppercase", margin: "4px 0 0" }}>SIGNATURE</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={onClose} style={{
                        padding: "10px 20px", borderRadius: 12,
                        background: "rgba(255,255,255,0.08)", color: C.pale,
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                    }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Data (UNCHANGED) ──────────────────────────────────────────
const certificates = [
    {
        id: 1,
        recipient: "Student XYZ Surname",
        description: "For completing the Science Fair with excellence",
        date: "15 Jan 2026",
        awarder: "Dr. Sharma",
        sealColor: "#f59e0b",
        hasRibbon: true,
    },
    {
        id: 2,
        recipient: "Student XYZ Surname",
        description: "For outstanding performance in Math Olympiad",
        date: "10 Dec 2025",
        awarder: "Ms. Patel",
        sealColor: "#f59e0b",
        hasRibbon: false,
    },
    {
        id: 3,
        recipient: "Student XYZ Surname",
        description: "For exceptional athletic performance",
        date: "20 Nov 2025",
        awarder: "Mr. Singh",
        sealColor: "#f59e0b",
        hasRibbon: true,
    },
    {
        id: 4,
        recipient: "Student XYZ Surname",
        description: "Description, example: for completing course",
        date: "25 Nov 2025",
        awarder: "Awarder",
        sealColor: "#f59e0b",
        hasRibbon: false,
    },
];

// ── Main Certificates Page ────────────────────────────────────────────────────
const Certificates = () => {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);

    const filtered = certificates.filter(c =>
        !search.trim() ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.recipient.toLowerCase().includes(search.toLowerCase()) ||
        c.awarder.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <style>{STYLE}</style>

            <div className="cert-root cert-page" style={{ minHeight: "100vh", background: C.bg }}>

                {/* ── Page title ── */}
                <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12, marginBottom: 22,
                }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 4, height: 48, background: C.dark, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: 0, lineHeight: 1.1 }}>
                                My Certificates
                            </h1>
                            <p style={{ fontSize: 12, color: C.mid, margin: "4px 0 0", fontWeight: 500 }}>
                                {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="cert-stat-grid">
                    <StatCard icon="🏅" label="Total" value={certificates.length} color={C.light} />
                    <StatCard icon="🎖️" label="With Ribbon" value={certificates.filter(c => c.hasRibbon).length} color="#0EA5E9" />
                    <StatCard icon="🏆" label="No Ribbon" value={certificates.filter(c => !c.hasRibbon).length} color="#F59E0B" />
                    <StatCard icon="⭐" label="Awarders" value={new Set(certificates.map(c => c.awarder)).size} color="#a855f7" />
                </div>

                {/* ── Filters panel ── */}
                <div style={{
                    background: C.white, borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "16px 18px",
                    marginBottom: 18,
                }}>
                    <div className="cert-search">
                        <Search size={13} color={C.mid} style={{ flexShrink: 0 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search certificates…"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                            >
                                <X size={13} color={C.mid} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Result count ── */}
                <p style={{ fontSize: 12, fontWeight: 600, color: C.mid, margin: "0 0 14px" }}>
                    Showing {filtered.length} of {certificates.length} certificate{certificates.length !== 1 ? "s" : ""}
                </p>

                {/* ── Certificate grid ── */}
                {filtered.length === 0 ? (
                    <div style={{
                        background: C.white, borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        padding: "64px 20px", textAlign: "center",
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: C.bg, border: `1.5px solid ${C.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 14px",
                        }}>
                            <Medal size={22} color={C.mid} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: "0 0 6px" }}>No Certificates Found</p>
                        <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>Try adjusting your search term.</p>
                    </div>
                ) : (
                    <div className="cert-grid">
                        {filtered.map(cert => (
                            <CertificateCard key={cert.id} cert={cert} onView={setSelected} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {selected && (
                <CertificateModal selected={selected} onClose={() => setSelected(null)} />
            )}
        </>
    );
};

export default Certificates;