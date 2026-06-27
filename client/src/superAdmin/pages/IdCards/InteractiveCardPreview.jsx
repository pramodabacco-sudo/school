// client/src/superAdmin/pages/IdCards/InteractiveCardPreview.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Pencil, Trash2, ChevronUp, ChevronDown, Plus, X, Check,
  Hash, BookOpen, Users, Bus, Droplets, Phone,
  Star, MapPin, Calendar, Mail, Globe, Award,
  CreditCard, Clock, Briefcase, Heart, Save,
} from "lucide-react";
import { getTemplateComponent, SAMPLE_STUDENT, TEMPLATE_META } from "./idCardTemplates.jsx";

const PAL = { steel: "#6A89A7", sky: "#BDDDFC", blue: "#88BDF2", navy: "#384959" };
const C = {
  primary: PAL.navy, secondary: "#64748a", border: "#dbe6ef",
  bgSoft: "#f4f8fb", accent: PAL.blue, accentDeep: PAL.steel,
  surface: "#ffffff", danger: "#ef4444", dangerBg: "#fef2f2",
};

export const DEFAULT_CARD_BLOCKS = [
  { id: "header",     label: "Header / Logo",     type: "header",   deletable: false, text: "",            visible: true },
  { id: "schoolName", label: "School Name",        type: "text",     deletable: true,  text: "School Name", visible: true },
  { id: "location",   label: "Location / Tagline", type: "text",     deletable: true,  text: "Location",    visible: true },
  { id: "photo",      label: "Student Photo",      type: "photo",    deletable: true,  text: "",            visible: true },
  { id: "nameBand",   label: "Student Name Band",  type: "nameBand", deletable: true,  text: "",            visible: true },
  { id: "footer",     label: "Footer Text",        type: "text",     deletable: true,  text: "STUDENT ID CARD", visible: true },
];

const ICON_MAP = {
  Hash, BookOpen, Users, Bus, Droplets, Phone,
  Star, MapPin, Calendar, Mail, Globe, Award,
  CreditCard, Clock, Briefcase, Heart,
};

// ── Floating toolbar ──────────────────────────────────────────────────────────
function Toolbar({ onEdit, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, canDelete, canEdit = true, onClose }) {
  return (
    <div
      style={{
        position: "absolute", top: -44, left: "50%", transform: "translateX(-50%)",
        zIndex: 200, display: "flex", gap: 3, alignItems: "center",
        background: "white", borderRadius: 10, padding: "5px 7px",
        boxShadow: "0 4px 24px rgba(56,73,89,0.28)",
        border: `1.5px solid ${C.border}`, whiteSpace: "nowrap",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {canEdit && <TBtn title="Edit" onClick={onEdit} color={C.accentDeep} bg="#eaf3fd"><Pencil size={11} /></TBtn>}
      <TBtn title="Move up"   onClick={onMoveUp}   disabled={!canMoveUp}   color={C.primary} bg={C.bgSoft}><ChevronUp   size={12} /></TBtn>
      <TBtn title="Move down" onClick={onMoveDown} disabled={!canMoveDown} color={C.primary} bg={C.bgSoft}><ChevronDown size={12} /></TBtn>
      {canDelete && <TBtn title="Delete" onClick={onDelete} color={C.danger} bg={C.dangerBg}><Trash2 size={11} /></TBtn>}
      <TBtn title="Close" onClick={onClose} color={C.secondary} bg="#f3f4f6"><X size={11} /></TBtn>
      <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid white" }} />
    </div>
  );
}
function TBtn({ title, onClick, disabled, color, bg, children }) {
  return (
    <button title={title} onClick={disabled ? undefined : onClick}
      style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: disabled ? "#f3f4f6" : bg, color: disabled ? "#d1d5db" : color, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
      {children}
    </button>
  );
}

// ── FIX 1: Inline edit (no popup) ── replaces EditPopover
// Shows right inside the zone row — input + Save + Cancel
function InlineEdit({ label, initialValue, onSave, onCancel }) {
  const [val, setVal] = useState(initialValue || "");
  return (
    <div
      style={{ background: "white", border: `1.5px solid ${C.accentDeep}`, borderRadius: 10, padding: "8px 10px", margin: "2px 0", boxShadow: "0 4px 16px rgba(56,73,89,0.14)", zIndex: 100, position: "relative" }}
      onClick={(e) => e.stopPropagation()}
    >
      <p style={{ fontSize: 10, fontWeight: 700, color: C.secondary, margin: "0 0 5px", textTransform: "uppercase" }}>{label}</p>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
        style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 12, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "white", color: C.secondary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onSave(val)} style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: "none", background: C.accentDeep, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Save size={11} /> Save
        </button>
      </div>
    </div>
  );
}

// ── FIX 2: Shape picker popup for photo/logo ──────────────────────────────────
const SHAPES = [
  { key: "square",  label: "Square",  br: "3px",  clip: "none" },
  { key: "rounded", label: "Rounded", br: "12px", clip: "none" },
  { key: "circle",  label: "Circle",  br: "50%",  clip: "none" },
  { key: "hexagon", label: "Hexagon", br: "0",    clip: "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)" },
];
const BORDER_OPTS = [
  { key: "accent",  label: "Accent"  },
  { key: "primary", label: "Primary" },
  { key: "white",   label: "White"   },
  { key: "none",    label: "None"    },
];

function ShapeSVG({ shape, size = 44, borderColor = "#88BDF2" }) {
  const r = size / 2;
  const id = `sp_${shape}_${size}`;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + (r - 3) * Math.cos(a)},${r + (r - 3) * Math.sin(a)}`;
  }).join(" ");

  const clipShape = shape === "circle"  ? <circle cx={r} cy={r} r={r - 2} />
                  : shape === "rounded" ? <rect x={2} y={2} width={size-4} height={size-4} rx={10} />
                  : shape === "hexagon" ? <polygon points={pts} />
                  : <rect x={2} y={2} width={size-4} height={size-4} rx={2} />;

  const stroke = shape === "circle"  ? <circle cx={r} cy={r} r={r-2} fill="none" stroke={borderColor} strokeWidth={2} />
               : shape === "rounded" ? <rect x={2} y={2} width={size-4} height={size-4} rx={10} fill="none" stroke={borderColor} strokeWidth={2} />
               : shape === "hexagon" ? <polygon points={pts} fill="none" stroke={borderColor} strokeWidth={2} />
               : <rect x={2} y={2} width={size-4} height={size-4} rx={2} fill="none" stroke={borderColor} strokeWidth={2} />;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs><clipPath id={id}>{clipShape}</clipPath></defs>
      <rect width={size} height={size} fill="#eef3f8" clipPath={`url(#${id})`} />
      <g clipPath={`url(#${id})`}>
        <circle cx={r} cy={r * 0.72} r={r * 0.28} fill="#c4cdd8" />
        <ellipse cx={r} cy={r * 1.55} rx={r * 0.42} ry={r * 0.3} fill="#c4cdd8" />
      </g>
      {stroke}
    </svg>
  );
}

function ShapePickerModal({ target, photoStyles, onChange, onClose, theme }) {
  const accentColor  = theme?.accent  || PAL.blue;
  const primaryColor = theme?.primary || PAL.navy;
  const shapeKey  = target === "logo" ? "logoShape"    : "studentShape";
  const borderKey = target === "logo" ? "logoBorder"   : "studentBorder";
  const borderColorMap = { accent: accentColor, primary: primaryColor, white: "#ffffff", none: "#e5e7eb" };
  const current = photoStyles || {};

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(15,23,33,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 18, padding: 22, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(56,73,89,0.22)", border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: C.primary, margin: 0 }}>
            {target === "logo" ? "School Logo" : "Student Photo"} Shape
          </p>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color={C.secondary} /></button>
        </div>

        {/* Shape grid */}
        <p style={{ fontSize: 10, fontWeight: 700, color: C.secondary, marginBottom: 8, textTransform: "uppercase" }}>Shape</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {SHAPES.map((s) => {
            const selected = (current[shapeKey] || "rounded") === s.key;
            return (
              <button key={s.key} onClick={() => { onChange({ ...current, [shapeKey]: s.key }); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 12, cursor: "pointer", border: `2px solid ${selected ? accentColor : C.border}`, background: selected ? "#eaf3fd" : "white", transition: "all 0.12s" }}>
                <ShapeSVG shape={s.key} size={44} borderColor={borderColorMap[current[borderKey] || "accent"]} />
                <span style={{ fontSize: 10, fontWeight: 700, color: selected ? C.accentDeep : C.secondary }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Border color */}
        <p style={{ fontSize: 10, fontWeight: 700, color: C.secondary, marginBottom: 8, textTransform: "uppercase" }}>Border Color</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {BORDER_OPTS.map((b) => {
            const selected = (current[borderKey] || "accent") === b.key;
            return (
              <button key={b.key} onClick={() => onChange({ ...current, [borderKey]: b.key })}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, border: `2px solid ${selected ? accentColor : C.border}`, background: selected ? "#eaf3fd" : "white", cursor: "pointer" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: borderColorMap[b.key], border: `1px solid ${C.border}` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: selected ? C.accentDeep : C.secondary }}>{b.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live preview */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "12px", borderRadius: 12, background: C.bgSoft, border: `1px dashed ${C.border}` }}>
          {["logo", "student"].map((t) => {
            const sk = t === "logo" ? "logoShape" : "studentShape";
            const bk = t === "logo" ? "logoBorder" : "studentBorder";
            const shape = current[sk] || "rounded";
            const bc    = borderColorMap[current[bk] || "accent"];
            return (
              <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <ShapeSVG shape={shape} size={50} borderColor={bc} />
                <span style={{ fontSize: 9, color: C.secondary, fontWeight: 600 }}>{t === "logo" ? "Logo" : "Photo"}</span>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={{ width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 10, border: "none", background: C.accentDeep, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

// ── Add element popup ─────────────────────────────────────────────────────────
function AddBlockPopup({ onAdd, onClose }) {
  const [text, setText] = useState("");
  const [err,  setErr]  = useState("");
  const submit = () => {
    if (!text.trim()) { setErr("Please enter text."); return; }
    onAdd({ type: "text", text: text.trim() });
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, padding: 20, width: "100%", maxWidth: 340, boxShadow: "0 16px 48px rgba(56,73,89,0.2)", border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: C.primary, margin: 0 }}>Add Text Element</p>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color={C.secondary} /></button>
        </div>
        <input autoFocus value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} placeholder="e.g. Academic Year 2024–25"
          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${err ? C.danger : C.border}`, outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
        {err && <p style={{ fontSize: 10, color: C.danger, marginBottom: 8 }}>{err}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: "white", color: C.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: C.accentDeep, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Plus size={12} /> Add</button>
        </div>
      </div>
    </div>
  );
}

// ── Shape helpers ─────────────────────────────────────────────────────────────
function getShapeStyle(shape) {
  if (shape === "circle")  return { borderRadius: "50%",  clipPath: "none" };
  if (shape === "square")  return { borderRadius: "3px",  clipPath: "none" };
  if (shape === "hexagon") return { borderRadius: 0, clipPath: "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)" };
  return { borderRadius: "12px", clipPath: "none" };
}
function getBorderColor(key, accent, primary) {
  if (key === "primary") return primary;
  if (key === "white")   return "#ffffff";
  if (key === "none")    return "transparent";
  return accent;
}

// ── Clickable overlay zone ────────────────────────────────────────────────────
function Zone({ label, isSelected, onClick, children, style: extra }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "relative", cursor: "pointer",
        outline: isSelected ? `2px solid ${PAL.steel}` : hov ? `1.5px dashed ${PAL.blue}` : "2px solid transparent",
        outlineOffset: 1, borderRadius: 4, transition: "outline 0.1s",
        overflow: "visible",  // allow Toolbar at top:-44 to be clickable
        ...extra,
      }}
    >
      {hov && !isSelected && (
        <div style={{ position: "absolute", top: 2, right: 2, zIndex: 50, background: PAL.steel, color: "white", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 5, pointerEvents: "none" }}>{label}</div>
      )}
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InteractiveCardPreview({
  templateKey = "CLASSIC_VERTICAL",
  theme, logo,
  cardBlocks, onChange,
  elements, onChangeElements,
  photoStyles, onPhotoStylesChange,
}) {
  const primary = theme?.primary || PAL.navy;
  const accent  = theme?.accent  || PAL.blue;

  const ps = photoStyles || {};
  const studentShapeStyle  = getShapeStyle(ps.studentShape  || "rounded");
  const studentBorderColor = getBorderColor(ps.studentBorder || "accent", accent, primary);
  const logoShapeStyle     = getShapeStyle(ps.logoShape      || "circle");
  const logoBorderColor    = getBorderColor(ps.logoBorder    || "accent", accent, primary);

  const [selectedId, setSelectedId]       = useState(null);
  const [inlineEditId, setInlineEditId]   = useState(null); // FIX 1: inline edit, no popup
  const [shapeTarget, setShapeTarget]     = useState(null); // FIX 2: "logo"|"student"|null
  const [showAddPopup, setShowAddPopup]   = useState(false);

  const containerRef = useRef();
  useEffect(() => {
    const h = () => { setSelectedId(null); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const getBlock    = (id) => cardBlocks.find((b) => b.id === id) || {};
  const getBlockIdx = (id) => cardBlocks.findIndex((b) => b.id === id);

  const moveBlock = useCallback((id, dir) => {
    const arr = [...cardBlocks];
    const i = arr.findIndex((b) => b.id === id);
    const t = i + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    onChange(arr); setSelectedId(null);
  }, [cardBlocks, onChange]);

  const deleteBlock = useCallback((id) => {
    onChange(cardBlocks.map((b) => b.id === id ? { ...b, visible: false } : b));
    setSelectedId(null);
  }, [cardBlocks, onChange]);

  const saveBlockText = useCallback((id, text) => {
    onChange(cardBlocks.map((b) => b.id === id ? { ...b, text } : b));
    setInlineEditId(null); setSelectedId(null);
  }, [cardBlocks, onChange]);

  const addBlock = useCallback(({ type, text }) => {
    onChange([...cardBlocks, { id: `custom_${Date.now()}`, label: text, type, text, deletable: true, visible: true }]);
  }, [cardBlocks, onChange]);

  const moveElement = useCallback((id, dir) => {
    const arr = [...elements];
    const i = arr.findIndex((e) => e.id === id);
    const t = i + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    onChangeElements(arr); setSelectedId(null);
  }, [elements, onChangeElements]);

  const deleteElement = useCallback((id) => {
    onChangeElements(elements.map((e) => e.id === id ? { ...e, hidden: true } : e));
    setSelectedId(null);
  }, [elements, onChangeElements]);

  const saveElementLabel = useCallback((id, label) => {
    onChangeElements(elements.map((e) => e.id === id ? { ...e, label } : e));
    setInlineEditId(null); setSelectedId(null);
  }, [elements, onChangeElements]);

  const visibleElements = elements.filter((e) => !e.hidden);

  const TemplateComp = getTemplateComponent(templateKey);
  const meta = TEMPLATE_META[templateKey] || { width: 280, height: 460 };
  const isHoriz = templateKey === "NAVY_HORIZONTAL";

  // Build student object for preview — includes shape styles so template renders them
  const previewStudent = {
    ...SAMPLE_STUDENT,
    schoolName: getBlock("schoolName").visible !== false ? (getBlock("schoolName").text || "School Name") : undefined,
    location:   getBlock("location").visible   !== false ? (getBlock("location").text   || "Location")   : undefined,
    footerText: getBlock("footer").text || "STUDENT ID CARD",
    orderedElements: visibleElements,
    extraElements:   visibleElements.filter((e) => e.type === "custom"),
    // Shape styles — read by idCardTemplates.jsx to apply dynamic shapes
    logoShapeStyle:      logoShapeStyle,
    logoBorderColor:     logoBorderColor,
    studentShapeStyle:   studentShapeStyle,
    studentBorderColor:  studentBorderColor,
  };

  // ── Zone definitions — position each over the right area of the card ────────
  const zones = {
    header:     isHoriz ? { top: 0, left: 0, width: "32%", height: "100%" }         : { top: 0, left: 0, right: 0, height: "22%" },
    schoolName: isHoriz ? { bottom: 30, left: "32%", right: 0, height: 26 }         : { top: "22%", left: 0, right: 0, height: 26 },
    location:   isHoriz ? { bottom: 14, left: "32%", right: 0, height: 18 }         : { top: "28%", left: 0, right: 0, height: 18 },
    photo:      isHoriz ? { top: "20%", left: "5%", width: "22%", height: "52%" }   : { top: "32%", left: "22%", right: "22%", height: "22%" },
    nameBand:   isHoriz ? { top: "8%", left: "32%", right: 0, height: "18%" }       : { top: "55%", left: "5%", right: "5%", height: "8%" },
    footer:     { bottom: 0, left: 0, right: 0, height: "8%" },
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }} onClick={() => { setSelectedId(null); setInlineEditId(null); }}>

      {/* ── Photo/Logo shape controls floating above card ── */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShapeTarget("logo"); }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${C.border}`, background: "white", color: C.accentDeep, fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 6px rgba(56,73,89,0.1)" }}>
          <div style={{ width: 16, height: 16, borderRadius: ps.logoShape === "circle" ? "50%" : ps.logoShape === "hexagon" ? 0 : ps.logoShape === "square" ? 2 : 4, background: logoBorderColor, clipPath: ps.logoShape === "hexagon" ? "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)" : "none" }} />
          Logo Shape
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShapeTarget("student"); }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${C.border}`, background: "white", color: C.accentDeep, fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 6px rgba(56,73,89,0.1)" }}>
          <div style={{ width: 16, height: 16, borderRadius: ps.studentShape === "circle" ? "50%" : ps.studentShape === "hexagon" ? 0 : ps.studentShape === "square" ? 2 : 4, background: studentBorderColor, clipPath: ps.studentShape === "hexagon" ? "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)" : "none" }} />
          Photo Shape
        </button>
      </div>

      {/* ── Card + overlay wrapper ── */}
      <div style={{ position: "relative", width: "100%", maxWidth: meta.width, margin: "0 auto" }}>

        {/* Layer 1: Real template */}
        <TemplateComp theme={{ primary, accent }} logo={logo} student={previewStudent} />

        {/* Layer 2: Transparent overlay zones — overflow:visible so toolbars above card are clickable */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "visible" }}>

          {/* HEADER */}
          {getBlock("header").visible !== false && (
            <Zone label="Header" isSelected={selectedId === "header"}
              onClick={() => setSelectedId(selectedId === "header" ? null : "header")}
              style={{ position: "absolute", pointerEvents: "all", ...zones.header }}>
              {selectedId === "header" && (
                <Toolbar canEdit={false} canDelete={false}
                  onMoveUp={() => moveBlock("header", -1)} canMoveUp={false}
                  onMoveDown={() => moveBlock("header", 1)} canMoveDown={false}
                  onClose={() => setSelectedId(null)} />
              )}
            </Zone>
          )}

          {/* SCHOOL NAME */}
          {getBlock("schoolName").visible !== false && (
            <Zone label="School Name" isSelected={selectedId === "schoolName"}
              onClick={() => setSelectedId(selectedId === "schoolName" ? null : "schoolName")}
              style={{ position: "absolute", pointerEvents: "all", ...zones.schoolName }}>
              {selectedId === "schoolName" && inlineEditId !== "schoolName" && (
                <Toolbar canEdit onEdit={() => { setInlineEditId("schoolName"); }}
                  onDelete={() => deleteBlock("schoolName")} canDelete={getBlock("schoolName").deletable}
                  onMoveUp={() => moveBlock("schoolName", -1)} canMoveUp={getBlockIdx("schoolName") > 0}
                  onMoveDown={() => moveBlock("schoolName", 1)} canMoveDown={getBlockIdx("schoolName") < cardBlocks.length - 1}
                  onClose={() => setSelectedId(null)} />
              )}
              {inlineEditId === "schoolName" && (
                <InlineEdit label="School Name" initialValue={getBlock("schoolName").text}
                  onSave={(v) => saveBlockText("schoolName", v)} onCancel={() => setInlineEditId(null)} />
              )}
            </Zone>
          )}

          {/* LOCATION */}
          {getBlock("location").visible !== false && (
            <Zone label="Location" isSelected={selectedId === "location"}
              onClick={() => setSelectedId(selectedId === "location" ? null : "location")}
              style={{ position: "absolute", pointerEvents: "all", ...zones.location }}>
              {selectedId === "location" && inlineEditId !== "location" && (
                <Toolbar canEdit onEdit={() => setInlineEditId("location")}
                  onDelete={() => deleteBlock("location")} canDelete={getBlock("location").deletable}
                  onMoveUp={() => moveBlock("location", -1)} canMoveUp={getBlockIdx("location") > 0}
                  onMoveDown={() => moveBlock("location", 1)} canMoveDown={getBlockIdx("location") < cardBlocks.length - 1}
                  onClose={() => setSelectedId(null)} />
              )}
              {inlineEditId === "location" && (
                <InlineEdit label="Location / Tagline" initialValue={getBlock("location").text}
                  onSave={(v) => saveBlockText("location", v)} onCancel={() => setInlineEditId(null)} />
              )}
            </Zone>
          )}

          {/* PHOTO */}
          {getBlock("photo").visible !== false && (
            <Zone label="Student Photo" isSelected={selectedId === "photo"}
              onClick={() => setSelectedId(selectedId === "photo" ? null : "photo")}
              style={{ position: "absolute", pointerEvents: "all", ...zones.photo }}>
              {selectedId === "photo" && (
                <Toolbar canEdit={false}
                  onDelete={() => deleteBlock("photo")} canDelete={true}
                  onMoveUp={() => moveBlock("photo", -1)} canMoveUp={getBlockIdx("photo") > 0}
                  onMoveDown={() => moveBlock("photo", 1)} canMoveDown={getBlockIdx("photo") < cardBlocks.length - 1}
                  onClose={() => setSelectedId(null)} />
              )}
            </Zone>
          )}

          {/* NAME BAND */}
          {getBlock("nameBand").visible !== false && (
            <Zone label="Name Band" isSelected={selectedId === "nameBand"}
              onClick={() => setSelectedId(selectedId === "nameBand" ? null : "nameBand")}
              style={{ position: "absolute", pointerEvents: "all", ...zones.nameBand }}>
              {selectedId === "nameBand" && (
                <Toolbar canEdit={false}
                  onDelete={() => deleteBlock("nameBand")} canDelete={true}
                  onMoveUp={() => moveBlock("nameBand", -1)} canMoveUp={getBlockIdx("nameBand") > 0}
                  onMoveDown={() => moveBlock("nameBand", 1)} canMoveDown={getBlockIdx("nameBand") < cardBlocks.length - 1}
                  onClose={() => setSelectedId(null)} />
              )}
            </Zone>
          )}

          {/* DETAIL ROWS */}
          <div style={{
            position: "absolute", pointerEvents: "all",
            ...(isHoriz ? { top: "28%", left: "32%", right: 0, bottom: "15%" } : { top: "64%", left: 0, right: 0, bottom: "9%" }),
          }}>
            {visibleElements.map((el, idx) => {
              const elKey = `el_${el.id}`;
              const isSel = selectedId === elKey;
              return (
                <Zone key={el.id} label={el.label} isSelected={isSel}
                  onClick={() => setSelectedId(isSel ? null : elKey)}
                  style={{ marginBottom: 1 }}>
                  {isSel && inlineEditId !== elKey && (
                    <Toolbar canEdit onEdit={() => setInlineEditId(elKey)}
                      onDelete={() => deleteElement(el.id)} canDelete={true}
                      onMoveUp={() => moveElement(el.id, -1)} canMoveUp={idx > 0}
                      onMoveDown={() => moveElement(el.id, 1)} canMoveDown={idx < visibleElements.length - 1}
                      onClose={() => setSelectedId(null)} />
                  )}
                  {inlineEditId === elKey && (
                    <InlineEdit label={el.label} initialValue={el.label}
                      onSave={(v) => saveElementLabel(el.id, v)} onCancel={() => setInlineEditId(null)} />
                  )}
                  <div style={{ height: isHoriz ? 18 : 16 }} />
                </Zone>
              );
            })}
          </div>

          {/* FOOTER */}
          {getBlock("footer").visible !== false && (
            <Zone label="Footer" isSelected={selectedId === "footer"}
              onClick={() => setSelectedId(selectedId === "footer" ? null : "footer")}
              style={{ position: "absolute", pointerEvents: "all", ...zones.footer }}>
              {selectedId === "footer" && inlineEditId !== "footer" && (
                <Toolbar canEdit onEdit={() => setInlineEditId("footer")}
                  onDelete={() => deleteBlock("footer")} canDelete={true}
                  onMoveUp={() => moveBlock("footer", -1)} canMoveUp={getBlockIdx("footer") > 0}
                  onMoveDown={() => moveBlock("footer", 1)} canMoveDown={getBlockIdx("footer") < cardBlocks.length - 1}
                  onClose={() => setSelectedId(null)} />
              )}
              {inlineEditId === "footer" && (
                <InlineEdit label="Footer Text" initialValue={getBlock("footer").text}
                  onSave={(v) => saveBlockText("footer", v)} onCancel={() => setInlineEditId(null)} />
              )}
            </Zone>
          )}
        </div>

        {/* Add element button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowAddPopup(true); }}
          style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, border: "none", background: C.accentDeep, color: "white", fontSize: 10, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px rgba(106,137,167,0.35)", whiteSpace: "nowrap", zIndex: 20 }}>
          <Plus size={11} /> Add Element
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 10, color: C.secondary, marginTop: 30 }}>
        Click any section to edit · hover to see zones
      </p>

      {/* Shape picker modal */}
      {shapeTarget && (
        <ShapePickerModal
          target={shapeTarget}
          photoStyles={ps}
          onChange={(newStyles) => { onPhotoStylesChange && onPhotoStylesChange(newStyles); }}
          onClose={() => setShapeTarget(null)}
          theme={theme}
        />
      )}

      {showAddPopup && <AddBlockPopup onAdd={addBlock} onClose={() => setShowAddPopup(false)} />}
    </div>
  );
}