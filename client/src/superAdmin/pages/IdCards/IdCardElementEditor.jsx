// client/src/superAdmin/pages/IdCards/IdCardElementEditor.jsx

import React, { useState, useRef, useCallback } from "react";
import {
  GripVertical, Trash2, Plus, Pencil, Check, X,
  Hash, BookOpen, Users, Bus, Droplets, Phone,
  Star, MapPin, Calendar, Mail, Globe, Award,
  CreditCard, Clock, Briefcase, Heart,
} from "lucide-react";

const PAL = { steel: "#6A89A7", sky: "#BDDDFC", blue: "#88BDF2", navy: "#384959" };
const COLORS = {
  primary: PAL.navy, secondary: "#64748a", border: "#dbe6ef",
  bgSoft: "#f4f8fb", accent: PAL.blue, accentDeep: PAL.steel,
  surface: "#ffffff", danger: "#ef4444", dangerBg: "#fef2f2",
};

const ICON_MAP = {
  Hash, BookOpen, Users, Bus, Droplets, Phone,
  Star, MapPin, Calendar, Mail, Globe, Award,
  CreditCard, Clock, Briefcase, Heart,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

export const DEFAULT_ELEMENTS = [
  { id: "adm",     type: "field", icon: "Hash",     label: "Admission No.", value: "ADM-2024-042",        hidden: false },
  { id: "cls",     type: "field", icon: "BookOpen", label: "Class",         value: "Grade 7 — Section A", hidden: false },
  { id: "father",  type: "field", icon: "Users",    label: "Father's Name", value: "Mr. Mohammed Aslam",  hidden: false },
  { id: "bus",     type: "field", icon: "Bus",      label: "Bus No.",        value: "07",                  hidden: false },
  { id: "blood",   type: "field", icon: "Droplets", label: "Blood Group",   value: "B+",                  hidden: false },
  { id: "contact", type: "field", icon: "Phone",    label: "Contact No.",   value: "9876543210",          hidden: false },
];

export const DEFAULT_PHOTO_STYLES = {
  studentShape:  "rounded",
  studentBorder: "accent",
  logoShape:     "circle",
  logoBorder:    "accent",
};

// ── Tiny Icon renderer ────────────────────────────────────────────────────────
function RowIcon({ name, size = 12, color }) {
  const Icon = ICON_MAP[name] || Hash;
  return <Icon size={size} color={color} />;
}

// ── Single draggable row ──────────────────────────────────────────────────────
function ElementRow({ el, index, total, onMove, onEdit, onDelete, onToggle, editing, onSaveEdit, onCancelEdit }) {
  const [draft, setDraft] = useState({ label: el.label, value: el.value, icon: el.icon });

  React.useEffect(() => {
    if (editing) setDraft({ label: el.label, value: el.value, icon: el.icon });
  }, [editing]);

  const rowStyle = {
    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
    borderRadius: 10, border: `1.5px solid ${el.hidden ? "#e5e7eb" : COLORS.border}`,
    background: el.hidden ? "#f9fafb" : COLORS.surface,
    opacity: el.hidden ? 0.45 : 1, marginBottom: 6, userSelect: "none",
  };

  return (
    <div style={rowStyle}>
      <div style={{ cursor: "grab", color: COLORS.secondary, flexShrink: 0, display: "flex", alignItems: "center" }}>
        <GripVertical size={15} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <button disabled={index === 0} onClick={() => onMove(index, index - 1)} style={{ width: 16, height: 16, padding: 0, border: "none", background: "none", cursor: index === 0 ? "not-allowed" : "pointer", color: index === 0 ? "#d1d5db" : COLORS.accentDeep, fontSize: 10, lineHeight: 1 }}>▲</button>
        <button disabled={index === total - 1} onClick={() => onMove(index, index + 1)} style={{ width: 16, height: 16, padding: 0, border: "none", background: "none", cursor: index === total - 1 ? "not-allowed" : "pointer", color: index === total - 1 ? "#d1d5db" : COLORS.accentDeep, fontSize: 10, lineHeight: 1 }}>▼</button>
      </div>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.bgSoft, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <RowIcon name={editing ? draft.icon : el.icon} size={11} color={COLORS.accentDeep} />
      </div>

      {editing ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: COLORS.secondary, marginBottom: 3 }}>ICON</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {ICON_OPTIONS.map((name) => {
                const Ic = ICON_MAP[name];
                return (
                  <button key={name} title={name} onClick={() => setDraft((d) => ({ ...d, icon: name }))} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${draft.icon === name ? COLORS.accentDeep : COLORS.border}`, background: draft.icon === name ? "#eaf3fd" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                    <Ic size={12} color={draft.icon === name ? COLORS.accentDeep : COLORS.secondary} />
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: COLORS.secondary, marginBottom: 2 }}>LABEL</p>
              <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. House" style={{ width: "100%", padding: "5px 8px", borderRadius: 7, fontSize: 11, border: `1.5px solid ${COLORS.border}`, outline: "none" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: COLORS.secondary, marginBottom: 2 }}>SAMPLE VALUE</p>
              <input value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} placeholder="e.g. Blue House" style={{ width: "100%", padding: "5px 8px", borderRadius: 7, fontSize: 11, border: `1.5px solid ${COLORS.border}`, outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => onSaveEdit(el.id, draft)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "none", background: COLORS.accentDeep, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Check size={11} /> Save
            </button>
            <button onClick={onCancelEdit} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1px solid ${COLORS.border}`, background: "white", color: COLORS.secondary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, display: "block" }}>{el.label}</span>
          <span style={{ fontSize: 10, color: COLORS.secondary }}>{el.value}</span>
        </div>
      )}

      {!editing && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button title={el.hidden ? "Show" : "Hide"} onClick={() => onToggle(el.id)} style={{ width: 26, height: 26, borderRadius: 7, border: `1.5px solid ${el.hidden ? "#d1fae5" : COLORS.border}`, background: el.hidden ? "#f0fdf4" : COLORS.bgSoft, color: el.hidden ? "#15803d" : COLORS.secondary, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {el.hidden ? "👁" : "🙈"}
          </button>
          <button title="Edit" onClick={() => onEdit(el.id)} style={{ width: 26, height: 26, borderRadius: 7, border: `1.5px solid ${COLORS.border}`, background: COLORS.bgSoft, color: COLORS.accentDeep, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pencil size={11} />
          </button>
          {el.type === "custom" && (
            <button title="Delete" onClick={() => onDelete(el.id)} style={{ width: 26, height: 26, borderRadius: 7, border: "1.5px solid #fecaca", background: COLORS.dangerBg, color: COLORS.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add-element popup ─────────────────────────────────────────────────────────
function AddElementPopup({ onAdd, onClose }) {
  const [form, setForm] = useState({ label: "", value: "", icon: "Star" });
  const [err, setErr] = useState("");

  const submit = () => {
    if (!form.label.trim()) { setErr("Label is required."); return; }
    onAdd(form);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,33,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 18, padding: 24, width: "100%", maxWidth: 380, border: `1px solid ${COLORS.border}`, boxShadow: "0 16px 48px rgba(56,73,89,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: COLORS.primary, margin: 0 }}>Add Custom Field</p>
            <p style={{ fontSize: 11, color: COLORS.secondary, margin: "2px 0 0" }}>Appears in the detail rows on the card</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={COLORS.secondary} />
          </button>
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, color: COLORS.secondary, marginBottom: 6 }}>CHOOSE ICON</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {ICON_OPTIONS.map((name) => {
            const Ic = ICON_MAP[name];
            return (
              <button key={name} title={name} onClick={() => setForm((f) => ({ ...f, icon: name }))} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${form.icon === name ? COLORS.accentDeep : COLORS.border}`, background: form.icon === name ? "#eaf3fd" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                <Ic size={14} color={form.icon === name ? COLORS.accentDeep : COLORS.secondary} />
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.secondary, display: "block", marginBottom: 4 }}>LABEL <span style={{ color: COLORS.danger }}>*</span></label>
            <input autoFocus value={form.label} onChange={(e) => { setForm((f) => ({ ...f, label: e.target.value })); setErr(""); }} placeholder="e.g. House Name, Roll No." style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${err ? COLORS.danger : COLORS.border}`, outline: "none", boxSizing: "border-box" }} />
            {err && <p style={{ fontSize: 10, color: COLORS.danger, margin: "3px 0 0" }}>{err}</p>}
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.secondary, display: "block", marginBottom: 4 }}>SAMPLE VALUE <span style={{ fontSize: 9, fontWeight: 400 }}>(shows in preview)</span></label>
            <input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="e.g. Blue House" style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${COLORS.border}`, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ padding: "8px 12px", borderRadius: 10, background: COLORS.bgSoft, border: `1px dashed ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "white", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RowIcon name={form.icon} size={11} color={COLORS.accentDeep} />
          </div>
          <span style={{ fontSize: 10, color: "#6b7280", minWidth: 60 }}>{form.label || "Label"}</span>
          <span style={{ fontSize: 10, color: "#111827", fontWeight: 600 }}>: {form.value || "Value"}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "white", color: COLORS.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: COLORS.accentDeep, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Plus size={13} /> Add Field
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Photo & Logo Styles ───────────────────────────────────────────────────────
const SHAPES = [
  { key: "square",  label: "Square"  },
  { key: "rounded", label: "Rounded" },
  { key: "circle",  label: "Circle"  },
  { key: "hexagon", label: "Hexagon" },
];
const BORDER_STYLES = [
  { key: "accent",  label: "Accent"  },
  { key: "primary", label: "Primary" },
  { key: "white",   label: "White"   },
  { key: "none",    label: "None"    },
];

function ShapeDemo({ shape, size = 38, borderColor = "#88BDF2" }) {
  const r = size / 2;
  const clipId = `cd_${shape}_${Math.random().toString(36).slice(2)}`;

  const getClip = () => {
    if (shape === "circle")  return <clipPath id={clipId}><circle cx={r} cy={r} r={r - 2} /></clipPath>;
    if (shape === "rounded") return <clipPath id={clipId}><rect x={2} y={2} width={size - 4} height={size - 4} rx={8} /></clipPath>;
    if (shape === "hexagon") {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${r + (r - 3) * Math.cos(a)},${r + (r - 3) * Math.sin(a)}`;
      }).join(" ");
      return <clipPath id={clipId}><polygon points={pts} /></clipPath>;
    }
    return <clipPath id={clipId}><rect x={2} y={2} width={size - 4} height={size - 4} rx={2} /></clipPath>;
  };

  const getStroke = () => {
    if (shape === "circle")  return <circle cx={r} cy={r} r={r - 2} fill="none" stroke={borderColor} strokeWidth={2} />;
    if (shape === "rounded") return <rect x={2} y={2} width={size - 4} height={size - 4} rx={8} fill="none" stroke={borderColor} strokeWidth={2} />;
    if (shape === "hexagon") {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${r + (r - 3) * Math.cos(a)},${r + (r - 3) * Math.sin(a)}`;
      }).join(" ");
      return <polygon points={pts} fill="none" stroke={borderColor} strokeWidth={2} />;
    }
    return <rect x={2} y={2} width={size - 4} height={size - 4} rx={2} fill="none" stroke={borderColor} strokeWidth={2} />;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>{getClip()}</defs>
      <rect width={size} height={size} fill="#f0f4f8" clipPath={`url(#${clipId})`} />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={r} cy={r * 0.72} r={r * 0.28} fill="#c4cdd8" />
        <ellipse cx={r} cy={r * 1.55} rx={r * 0.42} ry={r * 0.3} fill="#c4cdd8" />
      </g>
      {getStroke()}
    </svg>
  );
}

function PhotoStylesPanel({ photoStyles, onPhotoStylesChange, theme }) {
  const accentColor  = theme?.accent  || "#88BDF2";
  const primaryColor = theme?.primary || "#384959";
  const borderColorMap = { accent: accentColor, primary: primaryColor, white: "#ffffff", none: "#e5e7eb" };
  const set = (key, val) => onPhotoStylesChange({ ...photoStyles, [key]: val });

  const Section = ({ title, shapeKey, borderKey }) => (
    <div>
      <p style={{ fontSize: 10, fontWeight: 800, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 9, color: COLORS.secondary, margin: "0 0 6px" }}>Shape</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {SHAPES.map((s) => (
          <button key={s.key} onClick={() => set(shapeKey, s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 7px", borderRadius: 10, cursor: "pointer", border: `2px solid ${photoStyles[shapeKey] === s.key ? accentColor : COLORS.border}`, background: photoStyles[shapeKey] === s.key ? "#eaf3fd" : "white" }}>
            <ShapeDemo shape={s.key} size={36} borderColor={borderColorMap[photoStyles[borderKey]]} />
            <span style={{ fontSize: 9, fontWeight: 600, color: photoStyles[shapeKey] === s.key ? COLORS.accentDeep : COLORS.secondary }}>{s.label}</span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 9, color: COLORS.secondary, margin: "0 0 5px" }}>Border Color</p>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {BORDER_STYLES.map((b) => (
          <button key={b.key} onClick={() => set(borderKey, b.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, border: `2px solid ${photoStyles[borderKey] === b.key ? accentColor : COLORS.border}`, background: photoStyles[borderKey] === b.key ? "#eaf3fd" : "white", cursor: "pointer" }}>
            <div style={{ width: 13, height: 13, borderRadius: 3, background: borderColorMap[b.key], border: `1px solid ${COLORS.border}` }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: photoStyles[borderKey] === b.key ? COLORS.accentDeep : COLORS.secondary }}>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: COLORS.surface, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "16px 14px", marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: COLORS.primary, margin: 0 }}>Photo & Logo Styles</p>
          <p style={{ fontSize: 10, color: COLORS.secondary, margin: "2px 0 0" }}>Shape and border for student photo and school logo</p>
        </div>
        <button onClick={() => onPhotoStylesChange(DEFAULT_PHOTO_STYLES)} style={{ fontSize: 10, fontWeight: 600, color: COLORS.secondary, background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "3px 8px", cursor: "pointer" }}>Reset</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Section title="Student Photo" shapeKey="studentShape" borderKey="studentBorder" />
        <Section title="School Logo"   shapeKey="logoShape"    borderKey="logoBorder"    />
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function IdCardElementEditor({ elements, onChange, photoStyles, onPhotoStylesChange, theme }) {
  const [editingId, setEditingId]       = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);

  const handleMove = useCallback((from, to) => {
    const arr = [...elements];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  }, [elements, onChange]);

  const handleToggle = useCallback((id) => {
    onChange(elements.map((el) => el.id === id ? { ...el, hidden: !el.hidden } : el));
  }, [elements, onChange]);

  const handleSaveEdit = useCallback((id, draft) => {
    onChange(elements.map((el) => el.id === id ? { ...el, ...draft } : el));
    setEditingId(null);
  }, [elements, onChange]);

  const handleDelete = useCallback((id) => {
    onChange(elements.filter((el) => el.id !== id));
  }, [elements, onChange]);

  const handleAdd = useCallback((form) => {
    onChange([...elements, {
      id: `custom_${Date.now()}`, type: "custom",
      icon: form.icon, label: form.label.trim(),
      value: form.value.trim() || "—", hidden: false,
    }]);
  }, [elements, onChange]);

  const visible = elements.filter((e) => !e.hidden);
  const hidden  = elements.filter((e) => e.hidden);

  return (
    <>
      {/* Card Fields panel */}
      <div style={{ background: COLORS.surface, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: COLORS.primary, margin: 0 }}>Step 2b — Card Fields</p>
            <p style={{ fontSize: 10, color: COLORS.secondary, margin: "2px 0 0" }}>Reorder ↕ · Edit ✏️ · Hide 🙈 · Add custom rows</p>
          </div>
          <button onClick={() => setShowAddPopup(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: "none", background: COLORS.accentDeep, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(106,137,167,0.25)" }}>
            <Plus size={12} /> Add Field
          </button>
        </div>

        <div>
          {elements.map((el, idx) => (
            <ElementRow
              key={el.id} el={el} index={idx} total={elements.length}
              onMove={handleMove} onEdit={setEditingId}
              onDelete={handleDelete} onToggle={handleToggle}
              editing={editingId === el.id}
              onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}`, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: COLORS.secondary }}><span style={{ fontWeight: 700, color: "#10b981" }}>{visible.length}</span> visible</span>
          {hidden.length > 0 && <span style={{ fontSize: 10, color: COLORS.secondary }}><span style={{ fontWeight: 700, color: "#f59e0b" }}>{hidden.length}</span> hidden</span>}
          <span style={{ fontSize: 10, color: COLORS.secondary }}><span style={{ fontWeight: 700, color: PAL.steel }}>{elements.filter((e) => e.type === "custom").length}</span> custom</span>
          <button onClick={() => onChange(DEFAULT_ELEMENTS)} style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: COLORS.secondary, background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "3px 8px", cursor: "pointer" }}>Reset fields</button>
        </div>

        {showAddPopup && <AddElementPopup onAdd={handleAdd} onClose={() => setShowAddPopup(false)} />}
      </div>

      {/* Photo & Logo Styles panel */}
      {photoStyles && onPhotoStylesChange && (
        <PhotoStylesPanel photoStyles={photoStyles} onPhotoStylesChange={onPhotoStylesChange} theme={theme} />
      )}
    </>
  );
}