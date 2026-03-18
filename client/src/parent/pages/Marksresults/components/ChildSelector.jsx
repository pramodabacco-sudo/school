// client/src/parent/pages/Marksresults/components/ChildSelector.jsx
// ─────────────────────────────────────────────────────────────────
//  Shown when a parent has more than one child linked to their account.
//  Renders a horizontal scrollable row of child cards.
//  Single-child parents never see this — the child is pre-selected.
// ─────────────────────────────────────────────────────────────────

import { User } from "lucide-react";
import { C, FONT } from "../tokens.js";

function initials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
}

export default function ChildSelector({ children, selectedId, onChange }) {
    if (!children || children.length <= 1) return null;

    return (
        <div style={{ marginBottom: 20 }}>
            {/* Label */}
            <p style={{
                margin: "0 0 10px",
                fontSize: 11,
                fontWeight: 800,
                color: C.mid,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                fontFamily: FONT.sans,
            }}>
                Select Child
            </p>

            {/* Scrollable row */}
            <div style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
            }}>
                {children.map((child) => {
                    const active = child.studentId === selectedId;
                    return (
                        <button
                            key={child.studentId}
                            onClick={() => onChange(child.studentId)}
                            style={{
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 14px",
                                borderRadius: 14,
                                border: active
                                    ? `1.5px solid ${C.light}`
                                    : `1.5px solid ${C.borderLight}`,
                                background: active
                                    ? `linear-gradient(135deg, ${C.light}22, ${C.pale}44)`
                                    : C.white,
                                cursor: "pointer",
                                fontFamily: FONT.sans,
                                transition: "all 0.15s",
                                boxShadow: active ? `0 2px 10px rgba(136,189,242,0.22)` : "none",
                                outline: "none",
                            }}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: active
                                    ? `linear-gradient(135deg, ${C.light}, ${C.dark})`
                                    : `linear-gradient(135deg, ${C.pale}, ${C.borderLight})`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 900,
                                color: active ? C.white : C.mid,
                                flexShrink: 0,
                            }}>
                                {child.profileImage
                                    ? (
                                        <img
                                            src={child.profileImage}
                                            alt={child.name}
                                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                        />
                                    )
                                    : initials(child.name)}
                            </div>

                            {/* Name + class */}
                            <div style={{ textAlign: "left" }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 500,
                                    color: active ? C.dark : C.textLight,
                                    whiteSpace: "nowrap",
                                }}>
                                    {child.name}
                                </p>
                                {child.className && (
                                    <p style={{
                                        margin: 0,
                                        fontSize: 10,
                                        color: active ? C.mid : C.textLight,
                                        fontWeight: 500,
                                    }}>
                                        {child.className}
                                    </p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}