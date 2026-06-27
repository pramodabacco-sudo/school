// client/src/superAdmin/pages/IdCards/idCardTemplates.js
// ─────────────────────────────────────────────────────────────────────────────
// All ID card template renderers live here.
// Each template is a React component that accepts:
//   { theme: { primary, accent }, logo, student }
// student shape:
//   { name, admissionNo, class, fatherName, busNo, bloodGroup, contactNo }
//
// Palette (defaults baked into every template):
//   #6A89A7  steel blue   — primary
//   #BDDDFC  sky tint     — soft backgrounds / chips
//   #88BDF2  sky blue     — accent
//   #384959  deep navy    — text / dark surfaces
//
// NOTE: theme.primary / theme.accent are passed in PER TEMPLATE RECORD.
// Each saved template keeps its own colors — changing one card's colors
// must never mutate another card's stored theme. See IdCardManagement.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { User, BookOpen, Hash, Users, Bus, Droplets, Phone, GraduationCap, Stethoscope, Calendar, Star, MapPin, Mail, Globe, Award, CreditCard, Clock, Briefcase, Heart } from "lucide-react";

// ── Palette tokens ────────────────────────────────────────────────────────────
export const PALETTE = {
  steel: "#6A89A7",
  sky:   "#BDDDFC",
  blue:  "#88BDF2",
  navy:  "#384959",
};

// ── Responsive card wrapper ───────────────────────────────────────────────────
export function ResponsiveCard({ cardWidth = 280, children }) {
  return (
    <div style={{ width: "100%", maxWidth: cardWidth, margin: "0 auto" }}>
      <div
        style={{ width: cardWidth, transformOrigin: "top left" }}
        className="id-card-scaler"
      >
        {children}
      </div>
      <style>{`
        .id-card-scaler { transform: scale(1); }
        @media (max-width: 320px) {
          .id-card-scaler {
            transform: scale(0.78);
            transform-origin: top left;
            margin-bottom: calc((${cardWidth}px * -0.22));
          }
        }
        @media (min-width: 321px) and (max-width: 399px) {
          .id-card-scaler {
            transform: scale(0.88);
            transform-origin: top left;
            margin-bottom: calc((${cardWidth}px * -0.12));
          }
        }
      `}</style>
    </div>
  );
}

// ── Sample data (used in previews) ───────────────────────────────────────────
export const SAMPLE_STUDENT = {
  name:        "Aaliya Fathima",
  admissionNo: "ADM-2024-042",
  class:       "Grade 7 — Section A",
  fatherName:  "Mr. Mohammed Aslam",
  busNo:       "07",
  bloodGroup:  "B+",
  contactNo:   "9876543210",
};

const DETAIL_ROWS = (s) => [
  { icon: Hash,     label: "Admission No.", value: s.admissionNo },
  { icon: BookOpen, label: "Class",         value: s.class },
  { icon: Users,    label: "Father's Name", value: s.fatherName },
  { icon: Bus,      label: "Bus No.",        value: s.busNo },
  { icon: Droplets, label: "Blood Group",   value: s.bloodGroup },
  { icon: Phone,    label: "Contact No.",   value: s.contactNo },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — Skyline Vertical
// Portrait card: deep navy header with sky-blue ribbon, circular photo,
// soft sky-tint detail panel. Clean, airy, modern.
// ─────────────────────────────────────────────────────────────────────────────
export function ClassicVerticalCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.navy;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  // If the caller passed orderedElements (from element editor), use them;
  // otherwise fall back to the static DETAIL_ROWS.
  const rows = s.orderedElements
    ? s.orderedElements.map(({ icon: iconName, label, value, id }) => {
        const iconMap = {
          Hash: Hash, BookOpen: BookOpen, Users: Users, Bus: Bus,
          Droplets: Droplets, Phone: Phone,
          Star: Star, MapPin: MapPin, Calendar: Calendar, Mail: Mail,
          Globe: Globe, Award: Award, CreditCard: CreditCard, Clock: Clock,
          Briefcase: Briefcase, Heart: Heart,
        };
        const Icon = iconMap[iconName] || Hash;
        // For built-in fields resolve the live student value via keyMap
        const keyMap = { adm: "admissionNo", cls: "class", father: "fatherName", bus: "busNo", blood: "bloodGroup", contact: "contactNo" };
        const liveVal = keyMap[id] ? (s[keyMap[id]] || value) : value;
        return { icon: Icon, label, value: liveVal };
      })
    : DETAIL_ROWS(s);

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 460, background: "white",
      borderRadius: 18, border: `2px solid ${primary}`,
      fontFamily: "'Segoe UI', sans-serif", overflow: "hidden",
      display: "flex", flexDirection: "column", position: "relative",
      boxShadow: "0 6px 24px rgba(56,73,89,0.12)",
    }}>
      <div style={{
        width: 38, height: 13, background: "#e8eef3",
        borderRadius: "0 0 8px 8px", position: "absolute",
        top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        border: `1px solid ${primary}33`,
      }} />

      <div style={{
        background: primary, minHeight: 100,
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 30, paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, left: -40, width: 110, height: 150,
          background: `${accent}33`, transform: "rotate(30deg)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -20, right: -40, width: 110, height: 150,
          background: `${accent}33`, transform: "rotate(-30deg)", pointerEvents: "none",
        }} />
        <div style={{
          width: 64, height: 64, background: "white",
          ...(s.logoShapeStyle || { borderRadius: "50%" }),
          border: `3px solid ${s.logoBorderColor || accent}`, overflow: "hidden", position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logo
            ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
            : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: primary }}>
                <BookOpen size={20} />
                <span style={{ fontSize: 7, fontWeight: 700, marginTop: 2 }}>LOGO</span>
              </div>}
        </div>
      </div>

      <div style={{ background: "white", borderBottom: `2px solid ${accent}`, textAlign: "center", padding: "8px 12px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: primary, letterSpacing: 1, textTransform: "uppercase", margin: 0, lineHeight: 1.2 }}>
          {s.schoolName || "School Name"}
        </p>
        {s.location !== undefined && (
          <p style={{ fontSize: 8, color: accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>
            {s.location || "Location"}
          </p>
        )}

      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "12px 16px 8px" }}>
        <div style={{
          width: 78, height: 96,
          ...(s.studentShapeStyle || { borderRadius: 10 }),
          border: `2px solid ${s.studentBorderColor || accent}`, background: "#f3f6fa",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={34} color="#9ca3af" />}
        </div>
      </div>

      <div style={{ background: accent, margin: "0 16px 8px", borderRadius: 8, padding: "6px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>
          {s.name}
        </p>
      </div>

      <div style={{ flex: 1, padding: "0 16px 8px" }}>
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Icon size={10} style={{ color: primary, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "#6b7280", minWidth: 72 }}>{label}</span>
            <span style={{ fontSize: 9, color: "#111827", fontWeight: 600 }}>: {value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: primary, padding: "8px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>
          {s.footerText || "Student ID Card"}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — Horizon Split
// Landscape card: steel-blue left panel with logo + photo, white right
// panel with name, detail grid and footer stripe.
// ─────────────────────────────────────────────────────────────────────────────
export function HorizontalSplitCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.steel;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 380, height: "auto", minHeight: 200, background: "white",
      borderRadius: 16, border: `2px solid ${primary}`,
      fontFamily: "'Segoe UI', sans-serif", overflow: "hidden",
      display: "flex", flexDirection: "row",
      boxShadow: "0 6px 24px rgba(56,73,89,0.10)",
    }}>
      <div style={{
        width: 120, background: primary,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "16px 8px", gap: 10,
      }}>
        <div style={{
          width: 52, height: 52, background: "white",
          ...(s.logoShapeStyle || { borderRadius: "50%" }),
          border: `2.5px solid ${accent}`, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} /> : <BookOpen size={18} color={primary} />}
        </div>
        <div style={{
          width: 72, height: 88, borderRadius: 10,
          border: `2px solid ${accent}`, background: "rgba(255,255,255,0.85)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={28} color="#9ca3af" />}
        </div>
        <p style={{ fontSize: 7, color: accent, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", margin: 0 }}>
          {s.schoolName || "School Name"}
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: accent, height: 6 }} />
        <div style={{ flex: 1, padding: "10px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: primary, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 2px" }}>
            {s.name}
          </p>
          <p style={{ fontSize: 8, color: accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 8px" }}>
            {s.footerText || "Student ID Card"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px" }}>
            {[
              { label: "Admission No", value: s.admissionNo },
              { label: "Class",        value: s.class },
              { label: "Father",       value: s.fatherName },
              { label: "Bus No.",       value: s.busNo },
              { label: "Blood Group",  value: s.bloodGroup },
              { label: "Contact",      value: s.contactNo },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 7, color: "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
                <p style={{ fontSize: 8, color: "#111827", fontWeight: 700, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: primary, padding: "4px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 7, color: accent, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Academic Year 2024–25
          </span>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{s.admissionNo}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — Minimal Modern
// Clean portrait card: thin top accent bar, circular photo, pill detail rows.
// ─────────────────────────────────────────────────────────────────────────────
export function MinimalModernCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.navy;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 260, minHeight: 400, background: "white",
      borderRadius: 18, border: `1.5px solid #e5e7eb`,
      fontFamily: "'Segoe UI', sans-serif", overflow: "hidden",
      display: "flex", flexDirection: "column",
      boxShadow: "0 4px 20px rgba(56,73,89,0.10)",
    }}>
      <div style={{ background: accent, height: 6 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 8px", borderBottom: `1px solid #f3f4f6` }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: primary,
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} /> : <BookOpen size={14} color="white" />}
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: primary, margin: 0, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.schoolName || "School Name"}</p>
          <p style={{ fontSize: 7, color: "#9ca3af", margin: 0, letterSpacing: 0.5 }}>{s.location || "Location"}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 8px" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          border: `3px solid ${accent}`, background: "#f3f6fa",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color="#9ca3af" />}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "0 16px 12px" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: primary, margin: "0 0 2px", letterSpacing: 0.3 }}>{s.name}</p>
        <p style={{ fontSize: 9, color: accent, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{s.class}</p>
      </div>

      <div style={{ height: 1, background: "#f3f4f6", margin: "0 16px" }} />

      <div style={{ flex: 1, padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "Admission No.", value: s.admissionNo },
          { label: "Father's Name", value: s.fatherName },
          { label: "Bus No.",        value: s.busNo },
          { label: "Blood Group",   value: s.bloodGroup },
          { label: "Contact No.",   value: s.contactNo },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f9fafb", borderRadius: 6, padding: "4px 8px",
          }}>
            <span style={{ fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
            <span style={{ fontSize: 9, color: primary, fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: primary, padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 8, color: accent, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{s.footerText || "Student ID Card"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — Royal South Indian
// Dark header with ornate logo circle, diagonal shine lines, photo in
// bordered frame, watermark crest in body.
// ─────────────────────────────────────────────────────────────────────────────
export function RoyalSouthIndianCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.navy;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 480, background: "white",
      borderRadius: 16, overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
      border: `3px solid ${primary}`, display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      <div style={{
        width: 36, height: 12, background: "#d1d5db", borderRadius: "0 0 6px 6px",
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 10,
      }} />

      <div style={{ background: primary, paddingTop: 28, paddingBottom: 12, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -10, left: "30%", width: 30, height: 200, background: "rgba(255,255,255,0.08)", transform: "rotate(20deg)" }} />
        <div style={{ position: "absolute", top: -10, left: "45%", width: 15, height: 200, background: "rgba(255,255,255,0.05)", transform: "rotate(20deg)" }} />

        <div style={{ position: "relative", zIndex: 1, marginBottom: 6 }}>
          <div style={{
            width: 74, height: 74, borderRadius: "50%", border: `3px solid ${accent}`,
            padding: 3, background: "white", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${accent}55`,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} /> : <BookOpen size={24} color={primary} />}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 900, color: "white", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", margin: "0 8px 1px", lineHeight: 1.2 }}>
          {s.schoolName || "School Name"}
        </p>
        <p style={{ fontSize: 7.5, color: accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
          {s.location || "Affiliated to CBSE · New Delhi"}
        </p>
      </div>

      <div style={{ height: 4, background: accent }} />

      <div style={{
        position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, 0)",
        width: 120, height: 120, borderRadius: "50%", border: `3px solid ${accent}15`, zIndex: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", border: `2px solid ${accent}10` }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 8, position: "relative", zIndex: 1 }}>
        <div style={{
          width: 82, height: 100,
          ...(s.studentShapeStyle || { borderRadius: 10 }),
          border: `2.5px solid ${s.studentBorderColor || accent}`,
          outline: `3px solid ${primary}20`, background: "#f9fafb", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="#9ca3af" />}
        </div>
      </div>

      <div style={{
        margin: "0 14px 10px", padding: "6px 10px", textAlign: "center", background: primary, borderRadius: 8,
        borderLeft: `4px solid ${accent}`, borderRight: `4px solid ${accent}`,
      }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{s.name}</p>
      </div>

      <div style={{ flex: 1, padding: "0 14px 8px", position: "relative", zIndex: 1 }}>
        {[
          { label: "Adm. No.",    value: s.admissionNo },
          { label: "Class",       value: s.class },
          { label: "Father",      value: s.fatherName },
          { label: "Bus No.",      value: s.busNo },
          { label: "Blood Group", value: s.bloodGroup },
          { label: "Contact",     value: s.contactNo },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: primary, minWidth: 62, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</span>
            <span style={{ fontSize: 8, color: accent, marginRight: 4, fontWeight: 900 }}>◆</span>
            <span style={{ fontSize: 9, color: "#1f2937", fontWeight: 600, flex: 1 }}>{value}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ background: accent, height: 3 }} />
        <div style={{ background: primary, padding: "5px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 7, color: accent, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{s.footerText || "Student ID Card"}</span>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>2024–25</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — Maroon & Cream (state-board style)
// Warm header, cream body, decorative dividers — kept for schools that
// want a traditional feel, recolored into the steel/navy palette by default.
// ─────────────────────────────────────────────────────────────────────────────
export function MaroonCreamCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.steel;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };
  const cream = "#f6fafe";

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 480, background: cream,
      borderRadius: 14, overflow: "hidden", fontFamily: "Georgia, serif",
      border: `3px double ${primary}`, display: "flex", flexDirection: "column",
    }}>
      <div style={{ height: 6, background: `repeating-linear-gradient(90deg, ${primary} 0px, ${primary} 8px, ${accent} 8px, ${accent} 16px)` }} />

      <div style={{ background: primary, padding: "16px 12px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%", background: cream, border: `3px solid ${accent}`,
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8,
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 5 }} /> : <BookOpen size={22} color={primary} />}
        </div>
        <p style={{ fontSize: 13, fontWeight: 900, color: cream, letterSpacing: 1, textTransform: "uppercase", textAlign: "center", margin: "0 0 2px" }}>
          {s.schoolName || "School Name"}
        </p>
        <p style={{ fontSize: 7.5, color: accent, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
          {s.location || "Est. 1985 · Location"}
        </p>
      </div>

      <div style={{ textAlign: "center", padding: "6px 0", background: cream }}>
        <span style={{ fontSize: 10, color: accent, letterSpacing: 4 }}>✦ ✦ ✦</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
        <div style={{
          width: 84, height: 104, background: "#eef5fb", border: `3px solid ${primary}`, borderRadius: 6,
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `3px 3px 0 ${accent}`,
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="#9ca3af" />}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "0 14px 8px" }}>
        <p style={{ fontSize: 14, fontWeight: 900, color: primary, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px" }}>{s.name}</p>
        <p style={{ fontSize: 9, color: accent, fontWeight: 700, margin: 0 }}>{s.class}</p>
      </div>

      <div style={{ margin: "0 14px 8px", borderTop: `1px solid ${primary}44` }} />

      <div style={{ flex: 1, padding: "0 14px 6px" }}>
        {[
          { label: "Admission No.", value: s.admissionNo },
          { label: "Father's Name", value: s.fatherName },
          { label: "Bus No.",        value: s.busNo },
          { label: "Blood Group",   value: s.bloodGroup },
          { label: "Contact No.",   value: s.contactNo },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dotted ${primary}33`, paddingBottom: 3, marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: primary, fontWeight: 700, fontFamily: "sans-serif" }}>{label}</span>
            <span style={{ fontSize: 8.5, color: "#1f2937", fontWeight: 600, fontFamily: "sans-serif" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "4px 0", background: cream }}>
        <span style={{ fontSize: 10, color: accent, letterSpacing: 4 }}>✦ ✦ ✦</span>
      </div>
      <div style={{ height: 4, background: `repeating-linear-gradient(90deg, ${primary} 0px, ${primary} 8px, ${accent} 8px, ${accent} 16px)` }} />
      <div style={{ background: primary, padding: "5px", textAlign: "center" }}>
        <span style={{ fontSize: 8, color: accent, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Student Identity Card</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 6 — Crisp Clean (formerly "CBSE Green")
// Clean structured layout — logo + school info row, photo + name side by
// side, academic year badge. No barcode strip.
// ─────────────────────────────────────────────────────────────────────────────
export function CBSEGreenCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.steel;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 440, background: "white",
      borderRadius: 12, overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
      border: `1.5px solid ${primary}`, display: "flex", flexDirection: "column",
    }}>
      <div style={{ background: primary, height: 8 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f4f8fc", borderBottom: `2px solid ${primary}` }}>
        <div style={{
          width: 56, height: 56, borderRadius: 8, border: `2px solid ${primary}`, background: "white",
          overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} /> : <BookOpen size={20} color={primary} />}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 900, color: primary, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 1px", lineHeight: 1.2 }}>
            {s.schoolName || "School Name"}
          </p>
          <p style={{ fontSize: 7, color: "#6b7280", margin: "0 0 1px" }}>{s.location || "Affiliated to CBSE, New Delhi"}</p>
          <span style={{ fontSize: 7, fontWeight: 700, color: "white", background: accent, padding: "1px 6px", borderRadius: 10 }}>
            Academic Year 2024–25
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px 8px" }}>
        <div style={{
          width: 76, height: 94, borderRadius: 8, border: `2px solid ${primary}`, background: "#f9fafb",
          overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={30} color="#9ca3af" />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: primary, textTransform: "uppercase", margin: "0 0 3px", lineHeight: 1.2 }}>{s.name}</p>
          <div style={{ display: "inline-block", background: accent, color: "white", fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 6, marginBottom: 4 }}>
            {s.class}
          </div>
          <p style={{ fontSize: 8, color: "#6b7280", margin: 0 }}>
            Adm: <strong style={{ color: primary }}>{s.admissionNo}</strong>
          </p>
        </div>
      </div>

      <div style={{ margin: "0 12px", borderTop: `1.5px solid ${primary}22` }} />

      <div style={{ flex: 1, padding: "8px 12px" }}>
        {[
          { label: "Father's Name", value: s.fatherName },
          { label: "Bus No.",        value: s.busNo },
          { label: "Blood Group",   value: s.bloodGroup },
          { label: "Contact No.",   value: s.contactNo },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 8, marginBottom: 4, background: "#f8fbfe", border: `1px solid ${primary}18` }}>
            <span style={{ fontSize: 8, color: "#6b7280", minWidth: 70, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 9, color: primary, fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: primary, padding: "5px", textAlign: "center" }}>
        <span style={{ fontSize: 8, color: accent, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{s.footerText || "Student ID Card"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 7 — Corporate Sidebar
// Thin left colored sidebar with vertical school name, large right white
// area with photo, name and clean detail rows.
// ─────────────────────────────────────────────────────────────────────────────
export function CorporateSidebarCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.navy;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 480, background: "white",
      borderRadius: 14, overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
      border: `1.5px solid #e5e7eb`, display: "flex", flexDirection: "row",
      boxShadow: "0 2px 16px rgba(56,73,89,0.10)",
    }}>
      <div style={{ width: 44, background: primary, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "white", border: `2px solid ${accent}`,
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} /> : <BookOpen size={14} color={primary} />}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10 }}>
          <p style={{
            fontSize: 8, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: 2, margin: 0,
            writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)",
          }}>
            {s.schoolName || "School Name"}
          </p>
        </div>

        <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 4, background: accent }} />

        <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: primary, letterSpacing: 1.5, textTransform: "uppercase" }}>{s.footerText || "Student ID Card"}</span>
          <span style={{ fontSize: 7, fontWeight: 700, color: "white", background: accent, padding: "1px 6px", borderRadius: 8 }}>2024–25</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
          <div style={{
            width: 80, height: 96, borderRadius: 10, border: `2.5px solid ${primary}`, background: "#f9fafb",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color="#9ca3af" />}
          </div>
        </div>

        <div style={{ padding: "0 12px 6px", textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: primary, textTransform: "uppercase", margin: "0 0 2px", lineHeight: 1.2 }}>{s.name}</p>
          <p style={{ fontSize: 8.5, color: accent, fontWeight: 700, margin: 0 }}>{s.class}</p>
        </div>

        <div style={{ margin: "0 12px 6px", height: 1, background: `${primary}20` }} />

        <div style={{ flex: 1, padding: "0 12px 8px" }}>
          {[
            { label: "Adm. No.", value: s.admissionNo },
            { label: "Father",   value: s.fatherName },
            { label: "Bus No.",   value: s.busNo },
            { label: "Blood",    value: s.bloodGroup },
            { label: "Contact",  value: s.contactNo },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ fontSize: 7.5, color: "#9ca3af", minWidth: 46, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, paddingTop: 1 }}>{label}</span>
              <span style={{ fontSize: 9, color: "#111827", fontWeight: 700, flex: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 4, background: accent }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 8 — Wave Gradient
// Modern portrait card with a soft diagonal wave divider between a navy
// header and a sky-tint body. Friendly, contemporary feel.
// ─────────────────────────────────────────────────────────────────────────────
export function WaveGradientCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.navy;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 470, background: "#ffffff",
      borderRadius: 18, overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
      border: `1.5px solid ${primary}22`, position: "relative",
      boxShadow: "0 8px 28px rgba(56,73,89,0.14)",
    }}>
      <div style={{ position: "relative", background: primary, paddingTop: 22, paddingBottom: 46 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: "white", border: `2px solid ${accent}`,
            overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} /> : <BookOpen size={16} color={primary} />}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: 0.6, textTransform: "uppercase", margin: 0, lineHeight: 1.2 }}>{s.schoolName || "School Name"}</p>
            <p style={{ fontSize: 7.5, color: accent, fontWeight: 700, letterSpacing: 1, margin: 0 }}>{s.location || "Location"}</p>
          </div>
        </div>
        {/* Wave divider */}
        <svg viewBox="0 0 280 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 40, display: "block" }}>
          <path d="M0,20 C70,45 210,-5 280,20 L280,40 L0,40 Z" fill="#ffffff" />
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: -52, position: "relative", zIndex: 2 }}>
        <div style={{
          width: 88, height: 88,
          ...(s.studentShapeStyle || { borderRadius: "50%" }),
          border: `4px solid ${s.studentBorderColor || accent}`, background: "#f3f6fa",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(56,73,89,0.18)",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="#9ca3af" />}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "10px 16px 6px" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: primary, margin: "0 0 2px" }}>{s.name}</p>
        <span style={{ display: "inline-block", fontSize: 8.5, fontWeight: 700, color: "white", background: accent, padding: "2px 10px", borderRadius: 12 }}>
          {s.class}
        </span>
      </div>

      <div style={{ flex: 1, padding: "10px 16px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { icon: Hash,     label: "Admission No.", value: s.admissionNo },
          { icon: Users,    label: "Father's Name", value: s.fatherName },
          { icon: Bus,      label: "Bus No.",        value: s.busNo },
          { icon: Droplets, label: "Blood Group",   value: s.bloodGroup },
          { icon: Phone,    label: "Contact No.",   value: s.contactNo },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3f6fa", borderRadius: 8, padding: "5px 10px" }}>
            <Icon size={11} style={{ color: primary, flexShrink: 0 }} />
            <span style={{ fontSize: 8, color: "#6b7280", flex: 1 }}>{label}</span>
            <span style={{ fontSize: 8.5, color: "#111827", fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: primary, padding: "8px 16px", textAlign: "center", marginTop: 6 }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>{s.footerText || "Student ID Card"}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 9 — Academic Badge
// Portrait card styled like a credential/badge — centered crest, a
// shield-shaped name plate, and labeled stat chips for class & blood group.
// ─────────────────────────────────────────────────────────────────────────────
export function AcademicBadgeCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.steel;
  const accent  = theme?.accent  || PALETTE.blue;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 480, background: "white",
      borderRadius: 16, overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
      border: `2px solid ${primary}`, display: "flex", flexDirection: "column",
      boxShadow: "0 6px 22px rgba(56,73,89,0.12)",
    }}>
      <div style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, padding: "18px 16px 14px", textAlign: "center" }}>
        <div style={{
          width: 60, height: 60, margin: "0 auto 8px", borderRadius: "50%", background: "white",
          border: "3px solid white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 5 }} /> : <GraduationCap size={26} color={primary} />}
        </div>
        <p style={{ fontSize: 12, fontWeight: 800, color: "white", letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>{s.schoolName || "School Name"}</p>
        <p style={{ fontSize: 7.5, color: "rgba(255,255,255,0.85)", fontWeight: 600, letterSpacing: 1.5, margin: 0 }}>{s.location || "STUDENT IDENTITY CARD"}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: -20 }}>
        <div style={{
          width: 84, height: 100,
          ...(s.studentShapeStyle || { borderRadius: 10 }),
          border: `3px solid ${s.studentBorderColor || "white"}`, background: "#f3f6fa",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(56,73,89,0.2)",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="#9ca3af" />}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "10px 16px 8px" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: primary, margin: "0 0 6px" }}>{s.name}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: primary, background: `${accent}28`, padding: "3px 10px", borderRadius: 12 }}>{s.class}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "white", background: primary, padding: "3px 10px", borderRadius: 12 }}>{s.bloodGroup}</span>
        </div>
      </div>

      <div style={{ margin: "0 16px", borderTop: `1px dashed ${primary}40` }} />

      <div style={{ flex: 1, padding: "10px 16px" }}>
        {[
          { label: "Admission No.", value: s.admissionNo },
          { label: "Father's Name", value: s.fatherName },
          { label: "Bus No.",        value: s.busNo },
          { label: "Contact No.",   value: s.contactNo },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 8.5, color: "#9ca3af", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 9, color: "#111827", fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: primary, padding: "7px", textAlign: "center" }}>
        <span style={{ fontSize: 8, color: "white", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9 }}>Valid for Academic Year 2024–25</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 10 — Medical-Info Focus
// Portrait card that foregrounds blood group / emergency contact in a
// prominent strip — useful for younger grades / transport-heavy schools.
// ─────────────────────────────────────────────────────────────────────────────
export function MedicalFocusCard({ theme, logo, student = SAMPLE_STUDENT }) {
  const primary = theme?.primary || PALETTE.navy;
  const accent  = theme?.accent  || PALETTE.steel;
  const s = { ...SAMPLE_STUDENT, ...student };

  return (
    <div style={{
      width: "100%", maxWidth: 280, minHeight: 480, background: "white",
      borderRadius: 14, overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
      border: `1.5px solid ${primary}33`, display: "flex", flexDirection: "column",
      boxShadow: "0 4px 18px rgba(56,73,89,0.10)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: primary }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: "white",
          overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} /> : <BookOpen size={16} color={primary} />}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: 0.6, textTransform: "uppercase", margin: 0, lineHeight: 1.2 }}>{s.schoolName || "School Name"}</p>
          <p style={{ fontSize: 7.5, color: "rgba(255,255,255,0.75)", margin: 0 }}>Student Identity Card</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "14px 14px 8px" }}>
        <div style={{
          width: 72, height: 88, borderRadius: 8, border: `2px solid ${primary}`, background: "#f3f6fa",
          overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={28} color="#9ca3af" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: primary, margin: "0 0 3px", lineHeight: 1.2 }}>{s.name}</p>
          <p style={{ fontSize: 8.5, color: accent, fontWeight: 700, margin: "0 0 4px" }}>{s.class}</p>
          <p style={{ fontSize: 8, color: "#6b7280", margin: 0 }}>Adm: <strong style={{ color: "#111827" }}>{s.admissionNo}</strong></p>
        </div>
      </div>

      {/* Emergency / medical strip — the signature element */}
      <div style={{ margin: "4px 14px 10px", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${accent}55` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: `${accent}1a` }}>
          <Stethoscope size={11} color={primary} />
          <span style={{ fontSize: 8, fontWeight: 800, color: primary, letterSpacing: 0.5, textTransform: "uppercase" }}>In Case of Emergency</span>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, padding: "6px 10px", borderRight: `1px solid ${accent}33` }}>
            <p style={{ fontSize: 7, color: "#9ca3af", margin: "0 0 1px", textTransform: "uppercase" }}>Blood Group</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: primary, margin: 0 }}>{s.bloodGroup}</p>
          </div>
          <div style={{ flex: 1.4, padding: "6px 10px" }}>
            <p style={{ fontSize: 7, color: "#9ca3af", margin: "0 0 1px", textTransform: "uppercase" }}>Contact No.</p>
            <p style={{ fontSize: 11, fontWeight: 800, color: primary, margin: 0 }}>{s.contactNo}</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 14px 8px" }}>
        {[
          { icon: Users, label: "Father's Name", value: s.fatherName },
          { icon: Bus,   label: "Bus No.",        value: s.busNo },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <Icon size={10} style={{ color: primary, flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, color: "#6b7280", minWidth: 78 }}>{label}</span>
            <span style={{ fontSize: 8.5, color: "#111827", fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: primary, padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Calendar size={10} color={accent} />
        <span style={{ fontSize: 7.5, color: accent, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Academic Year 2024–25</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────
export const TEMPLATE_REGISTRY = {
  CLASSIC_VERTICAL:  ClassicVerticalCard,
  NAVY_HORIZONTAL:   HorizontalSplitCard,
  MINIMAL_MODERN:    MinimalModernCard,
  ROYAL_SOUTH:       RoyalSouthIndianCard,
  MAROON_CREAM:      MaroonCreamCard,
  CBSE_GREEN:        CBSEGreenCard,
  CORPORATE_SIDEBAR: CorporateSidebarCard,
  WAVE_GRADIENT:     WaveGradientCard,
  ACADEMIC_BADGE:    AcademicBadgeCard,
  MEDICAL_FOCUS:     MedicalFocusCard,
};

// Helper: resolve which component to render for a given template record
export function getTemplateComponent(templateKey) {
  return TEMPLATE_REGISTRY[templateKey] || ClassicVerticalCard;
}

// Layout metadata used by the picker UI (label + natural width/height, for scaling)
export const TEMPLATE_META = {
  CLASSIC_VERTICAL:  { label: "Skyline Vertical",   width: 280, height: 460 },
  NAVY_HORIZONTAL:   { label: "Horizon Split",       width: 380, height: 200 },
  MINIMAL_MODERN:    { label: "Minimal Modern",      width: 260, height: 400 },
  ROYAL_SOUTH:       { label: "Royal South Indian",  width: 280, height: 480 },
  MAROON_CREAM:      { label: "Maroon & Cream",      width: 280, height: 480 },
  CBSE_GREEN:        { label: "Crisp Clean",         width: 280, height: 440 },
  CORPORATE_SIDEBAR: { label: "Corporate Sidebar",   width: 280, height: 480 },
  WAVE_GRADIENT:     { label: "Wave Gradient",       width: 280, height: 470 },
  ACADEMIC_BADGE:    { label: "Academic Badge",      width: 280, height: 480 },
  MEDICAL_FOCUS:     { label: "Medical Focus",       width: 280, height: 480 },
};