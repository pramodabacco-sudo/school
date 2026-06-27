// client/src/superAdmin/pages/IdCards/IdCardManagement.jsx
import React, { useEffect, useState, useRef } from "react";
import { getToken, getUser } from "../../../auth/storage";
import {
  Upload, LayoutTemplate, ShoppingBag, Trash2,
  RefreshCw, CheckCircle, X, ShoppingCart, Eye,
  Palette, RotateCcw, BookOpen, Pencil, Check, Loader2,
} from "lucide-react";
import IdCardElementEditor, { DEFAULT_ELEMENTS, DEFAULT_PHOTO_STYLES } from "./IdCardElementEditor";
import InteractiveCardPreview, { DEFAULT_CARD_BLOCKS } from "./InteractiveCardPreview";
import {
  ClassicVerticalCard,
  HorizontalSplitCard,
  MinimalModernCard,
  RoyalSouthIndianCard,
  MaroonCreamCard,
  CBSEGreenCard,
  CorporateSidebarCard,
  WaveGradientCard,
  AcademicBadgeCard,
  MedicalFocusCard,
  getTemplateComponent,
  TEMPLATE_META,
  SAMPLE_STUDENT,
} from "./idCardTemplates.jsx";

const API = import.meta.env.VITE_API_URL;

// ── Palette ───────────────────────────────────────────────────────────────────
// #6A89A7 steel · #BDDDFC sky · #88BDF2 blue · #384959 navy
const PAL = {
  steel: "#6A89A7",
  sky:   "#BDDDFC",
  blue:  "#88BDF2",
  navy:  "#384959",
};

const STATUS_CONFIG = {
  PENDING:    { label: "Pending",    color: PAL.steel, bg: "#eef3f8" },
  CONFIRMED:  { label: "Confirmed",  color: PAL.blue,  bg: "#eaf3fd" },
  PROCESSING: { label: "Processing", color: "#8b5cf6", bg: "#f5f3ff" },
  DISPATCHED: { label: "Dispatched", color: "#f59e0b", bg: "#fffbeb" },
  DELIVERED:  { label: "Delivered",  color: "#10b981", bg: "#f0fdf4" },
  CANCELLED:  { label: "Cancelled",  color: "#ef4444", bg: "#fef2f2" },
};

const COLORS = {
  primary:   PAL.navy,
  secondary: "#64748a",
  border:    "#dbe6ef",
  bgSoft:    "#f4f8fb",
  accent:    PAL.blue,
  accentDeep:PAL.steel,
  surface:   "#ffffff",
};

// ── Sample student for ID card preview ───────────────────────────────────────
const SAMPLE = {
  name:        "Aaliya Fathima",
  admissionNo: "ADM-2024-042",
  class:       "Grade 7 — Section A",
  fatherName:  "Mr. Mohammed Aslam",
  busNo:       "07",
  bloodGroup:  "B+",
  contactNo:   "9876543210",
};

const DEFAULT_THEME = {
  primary: PAL.navy,
  accent:  PAL.blue,
};

const PRESETS = [
  { primary: PAL.navy,  accent: PAL.blue,  label: "Navy Blue" },
  { primary: PAL.steel, accent: PAL.blue,  label: "Steel Sky" },
  { primary: PAL.navy,  accent: PAL.steel, label: "Navy Steel" },
  { primary: "#1e3a5f", accent: "#e8b84b", label: "Classic Gold" },
  { primary: "#7b1f1f", accent: "#d4a853", label: "Maroon Gold" },
];

// ── IDCardPreview ──────────────────────────────────────────────────────────────
function IDCardPreview({ theme, logo }) {
  return <ClassicVerticalCard theme={theme} logo={logo} student={SAMPLE_STUDENT} />;
}

// ── MiniCard thumbnail — tiny version for template picker ─────────────────────
function MiniCard({ primary, accent }) {
  return (
    <div style={{
      width: "100%", background: "white", borderRadius: 8,
      border: `1.5px solid ${primary}`, overflow: "hidden", fontFamily: "sans-serif",
    }}>
      <div style={{ background: primary, padding: "6px 4px", textAlign: "center" }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: "white",
          border: `1.5px solid ${accent}`, margin: "0 auto 3px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 8, color: primary }}>★</span>
        </div>
      </div>
      <div style={{ padding: "4px", textAlign: "center" }}>
        <div style={{ width: 24, height: 30, background: "#f3f4f6", borderRadius: 3, margin: "0 auto 3px", border: `1px solid ${accent}` }} />
        <div style={{ background: accent, borderRadius: 3, padding: "1px 4px", marginBottom: 3 }}>
          <span style={{ fontSize: 7, color: "white", fontWeight: 700 }}>STUDENT NAME</span>
        </div>
        {["Class", "Father", "Blood"].map((l) => (
          <div key={l} style={{ display: "flex", gap: 2, marginBottom: 1 }}>
            <span style={{ fontSize: 6, color: "#9ca3af", flex: 1, textAlign: "left" }}>{l}</span>
            <span style={{ fontSize: 6, color: "#374151", fontWeight: 600 }}>——</span>
          </div>
        ))}
      </div>
      <div style={{ background: primary, padding: "2px 4px", textAlign: "center" }}>
        <span style={{ fontSize: 6, color: accent, fontWeight: 700, letterSpacing: 1 }}>ID CARD</span>
      </div>
    </div>
  );
}

// ── Color row ─────────────────────────────────────────────────────────────────
function ColorRow({ label, hint, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg border" style={{ background: value, borderColor: COLORS.border }} />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
            className="w-10 h-8 rounded cursor-pointer border-0 p-0"
            style={{ background: "transparent" }} />
          <span className="text-xs font-mono" style={{ color: COLORS.secondary }}>{value}</span>
        </div>
      </div>
      {hint && <p className="text-[10px] mt-1 px-1" style={{ color: COLORS.secondary }}>{hint}</p>}
    </div>
  );
}

// ── Available base templates for customization (all 10 layouts) ──────────────
const BASE_TEMPLATES = [
  { key: "CLASSIC_VERTICAL",  label: "Skyline Vertical",  Component: ClassicVerticalCard  },
  { key: "NAVY_HORIZONTAL",   label: "Horizon Split",     Component: HorizontalSplitCard  },
  { key: "MINIMAL_MODERN",    label: "Minimal Modern",    Component: MinimalModernCard    },
  { key: "ROYAL_SOUTH",       label: "Royal South Indian",Component: RoyalSouthIndianCard },
  { key: "MAROON_CREAM",      label: "Maroon & Cream",    Component: MaroonCreamCard      },
  { key: "CBSE_GREEN",        label: "Crisp Clean",       Component: CBSEGreenCard        },
  { key: "CORPORATE_SIDEBAR", label: "Corporate Sidebar", Component: CorporateSidebarCard },
  { key: "WAVE_GRADIENT",     label: "Wave Gradient",     Component: WaveGradientCard     },
  { key: "ACADEMIC_BADGE",    label: "Academic Badge",    Component: AcademicBadgeCard    },
  { key: "MEDICAL_FOCUS",     label: "Medical Focus",     Component: MedicalFocusCard     },
];

// ── Customize tab content ─────────────────────────────────────────────────────
function CustomizeTab({ onTemplateSaved, initialData, onClearInitial }) {
  const [selectedKey, setSelectedKey] = useState(initialData?.templateKey || "CLASSIC_VERTICAL");
  const [theme, setTheme]             = useState(initialData ? { primary: initialData.primaryColor, accent: initialData.accentColor } : DEFAULT_THEME);
  const [logo, setLogo]               = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [themeName, setThemeName]         = useState(initialData?.title || "");
  // ── Element editor state ──────────────────────────────────────────────────
  const [elements, setElements] = useState(
    initialData?.elementLayout?.length ? initialData.elementLayout.map((e) => ({ ...e, hidden: false })) : DEFAULT_ELEMENTS
  );
  // ── Card block (structural zones) state ───────────────────────────────────
  const [cardBlocks, setCardBlocks] = useState(
    initialData?.cardBlocks?.length ? initialData.cardBlocks : DEFAULT_CARD_BLOCKS
  );
  // ── Photo / logo shape styles ─────────────────────────────────────────────
  const [photoStyles, setPhotoStyles] = useState(DEFAULT_PHOTO_STYLES);
  const logoRef = useRef();

  // When initialData changes (e.g. user clicks Edit on a different template), reload all state
  const prevInitialRef = useRef(null);
  useEffect(() => {
    if (!initialData || initialData === prevInitialRef.current) return;
    prevInitialRef.current = initialData;
    setSelectedKey(initialData.templateKey || "CLASSIC_VERTICAL");
    setTheme({ primary: initialData.primaryColor || DEFAULT_THEME.primary, accent: initialData.accentColor || DEFAULT_THEME.accent });
    setThemeName(initialData.title || "");
    setElements(initialData.elementLayout?.length
      ? initialData.elementLayout.map((e) => ({ ...e, hidden: false }))
      : DEFAULT_ELEMENTS);
    setCardBlocks(initialData.cardBlocks?.length ? initialData.cardBlocks : DEFAULT_CARD_BLOCKS);
  }, [initialData]);

  const setColor = (key) => (val) => setTheme((t) => ({ ...t, [key]: val }));

  // Reset card blocks whenever the user picks a new layout
  const handleSelectKey = (key) => {
    setSelectedKey(key);
    setCardBlocks(DEFAULT_CARD_BLOCKS);
    if (onClearInitial) onClearInitial();
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (file) setLogo(URL.createObjectURL(file));
  };

  const handleSaveClick = () => {
    const base = BASE_TEMPLATES.find((t) => t.key === selectedKey);
    // If editing an existing template, pre-fill its name; otherwise use layout label
    if (!themeName) setThemeName(initialData?.title || base?.label || "");
    setSaveError("");
    setShowNamePopup(true);
  };

  const handleConfirmSave = async () => {
    if (!themeName.trim()) { setSaveError("Please enter a name."); return; }
    setSaving(true);
    setSaveError("");
    try {
      const token = getToken();
      // Serialize element layout so backend / print engine can honour it
      const visibleElements = elements
        .filter((el) => !el.hidden)
        .map(({ id, type, icon, label, value }) => ({ id, type, icon, label, value }));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/id-cards/templates/coded`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:        themeName.trim(),
          templateKey:  selectedKey,
          primaryColor: theme.primary,
          accentColor:  theme.accent,
          description:  `Custom theme based on ${selectedKey}`,
          elementLayout: visibleElements,   // ← new: field order + custom rows
          // Save ALL blocks including hidden (visible:false) so deletions are preserved on reload
          cardBlocks: cardBlocks.map(({ id, type, text, visible }) => ({ id, type, text, visible })),
        }),
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(text); }
      if (!res.ok) throw new Error(data.error || "Save failed");
      // data.updated === true  → same name, colors updated in place (no error)
      // data.alreadyExists is no longer returned by the new backend
      setShowNamePopup(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onTemplateSaved) onTemplateSaved();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Build a student preview object that respects element customisation
  const previewStudent = elements.reduce((acc, el) => {
    if (el.hidden) return acc;
    // Map element id → SAMPLE_STUDENT key so the card template uses live values
    const keyMap = {
      adm:     "admissionNo",
      cls:     "class",
      father:  "fatherName",
      bus:     "busNo",
      blood:   "bloodGroup",
      contact: "contactNo",
    };
    if (keyMap[el.id]) acc[keyMap[el.id]] = el.value;
    return acc;
  }, {
    name:        "Aaliya Fathima",
    admissionNo: undefined,
    class:       undefined,
    fatherName:  undefined,
    busNo:       undefined,
    bloodGroup:  undefined,
    contactNo:   undefined,
    // pass extra custom rows directly so card renderers can pick them up
    extraElements: elements.filter((el) => !el.hidden && el.type === "custom"),
    // pass full ordered elements (hidden already filtered) for renderers that
    // want to drive the rows themselves
    orderedElements: elements.filter((el) => !el.hidden),
  });

  // Resolve the live preview component
  const PreviewComp = BASE_TEMPLATES.find((t) => t.key === selectedKey)?.Component || ClassicVerticalCard;

  return (
    <div className="space-y-5">

      {/* ── Step 1: Pick a template layout ── */}
      <div className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.primary }}>
          Step 1 — Pick a Layout
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BASE_TEMPLATES.map(({ key, label, Component }) => (
            <div
              key={key}
              onClick={() => handleSelectKey(key)}
              className="cursor-pointer rounded-xl overflow-hidden transition-all hover:opacity-90"
              style={{
                border: `2px solid ${selectedKey === key ? COLORS.accent : COLORS.border}`,
                background: selectedKey === key ? COLORS.bgSoft : "white",
              }}
            >
              <div style={{
                background: "#eef3f8", height: 120, overflow: "hidden",
                display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 4,
              }}>
                <div style={{
                  flexShrink: 0,
                  transform: key === "NAVY_HORIZONTAL" ? "scale(0.22)" : "scale(0.27)",
                  transformOrigin: "top center",
                  width: key === "NAVY_HORIZONTAL" ? 380 : 280,
                }}>
                  <Component theme={theme} logo={null} student={SAMPLE_STUDENT} />
                </div>
              </div>
              <div className="px-2 py-2">
                <p className="text-[11px] font-bold truncate" style={{ color: selectedKey === key ? COLORS.accentDeep : COLORS.primary }}>
                  {label}
                </p>
                {selectedKey === key && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: COLORS.accent, color: "white" }}>
                    ✓ Selected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 2: Customize colors + logo ── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Left controls */}
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.primary }}>
            Step 2 — Customize Colors & Logo
          </p>

          {/* Logo */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <p className="text-xs font-bold" style={{ color: COLORS.primary }}>School Logo</p>
            <div
              onClick={() => logoRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl cursor-pointer hover:opacity-80 transition-all"
              style={{ border: `2px dashed ${COLORS.border}`, background: COLORS.bgSoft }}>
              {logo
                ? <img src={logo} alt="Logo" className="h-12 object-contain" />
                : <>
                    <Upload size={18} style={{ color: COLORS.secondary }} />
                    <p className="text-xs font-semibold" style={{ color: COLORS.secondary }}>Click to upload logo</p>
                    <p className="text-[10px]" style={{ color: COLORS.secondary }}>PNG or JPG recommended</p>
                  </>}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            {logo && (
              <button onClick={() => setLogo(null)} className="w-full text-xs font-semibold py-1.5 rounded-lg"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary }}>
                Remove Logo
              </button>
            )}
          </div>

          {/* Colors */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2">
              <Palette size={13} style={{ color: COLORS.primary }} />
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.primary }}>Colors</p>
            </div>
            <ColorRow label="Primary Color" hint="Header, footer, icons" value={theme.primary} onChange={setColor("primary")} />
            <ColorRow label="Accent Color"  hint="Ribbon, name band, borders" value={theme.accent} onChange={setColor("accent")} />

            {/* Presets */}
            <div>
              <p className="text-[10px] font-bold mb-2" style={{ color: COLORS.secondary }}>Quick presets</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map((preset) => (
                  <button key={preset.label}
                    onClick={() => setTheme({ primary: preset.primary, accent: preset.accent })}
                    title={preset.label}
                    className="flex gap-0.5 rounded-lg overflow-hidden border transition-all hover:scale-105 active:scale-95"
                    style={{ borderColor: COLORS.border }}>
                    <div style={{ width: 20, height: 20, background: preset.primary }} />
                    <div style={{ width: 20, height: 20, background: preset.accent }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={handleSaveClick}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: saved ? "#10b981" : COLORS.accentDeep }}>
              {saved ? "✓ Saved to Templates!" : "Save Theme"}
            </button>
            <button onClick={() => { setTheme(DEFAULT_THEME); setLogo(null); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary, background: "white" }}>
              <RotateCcw size={13} /> Reset Colors
            </button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-wide self-start" style={{ color: COLORS.primary }}>
            Step 3 — Live Preview
          </p>
          <div className="w-full flex items-center justify-center rounded-2xl p-4 sm:p-8 overflow-visible"
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: 520, paddingBottom: 40 }}>
            <div style={{ width: "100%", maxWidth: 320 }}>
              <InteractiveCardPreview
                templateKey={selectedKey}
                theme={theme}
                logo={logo}
                cardBlocks={cardBlocks}
                onChange={setCardBlocks}
                elements={elements}
                onChangeElements={setElements}
                photoStyles={photoStyles}
                onPhotoStylesChange={setPhotoStyles}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 2b: Card Fields editor ── */}
      <IdCardElementEditor elements={elements} onChange={setElements} theme={theme} photoStyles={photoStyles} onPhotoStylesChange={setPhotoStyles} />

      {/* ── Name Popup ── */}
      {showNamePopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,33,0.55)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white", border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold" style={{ color: COLORS.primary }}>Name this Theme</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.secondary }}>Appears in template picker when placing orders</p>
              </div>
              <button onClick={() => setShowNamePopup(false)} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: COLORS.secondary }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-3 mb-4 p-3 rounded-xl" style={{ background: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: theme.primary }} />
              <div style={{ width: 28, height: 28, borderRadius: 6, background: theme.accent }} />
              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold" style={{ color: COLORS.primary }}>{theme.primary} · {theme.accent}</p>
                <p className="text-[10px]" style={{ color: COLORS.secondary }}>
                  {BASE_TEMPLATES.find((t) => t.key === selectedKey)?.label} layout
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder="e.g. Navy Blue Theme, Our School Colors…"
              value={themeName}
              onChange={(e) => { setThemeName(e.target.value); setSaveError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmSave()}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl text-sm mb-2"
              style={{ border: `1px solid ${saveError ? "#ef4444" : COLORS.border}`, outline: "none" }}
            />
            {saveError && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>{saveError}</p>}

            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowNamePopup(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary }}>Cancel</button>
              <button onClick={handleConfirmSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: saving ? "#9bc4ee" : COLORS.accentDeep }}>
                {saving ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 10 coded templates to seed into DB ────────────────────────────────────────
const CODED_TEMPLATES = [
  { templateKey: "CLASSIC_VERTICAL",  title: "Skyline Vertical",   primaryColor: PAL.navy,  accentColor: PAL.blue,  description: "Traditional portrait card with colored header" },
  { templateKey: "NAVY_HORIZONTAL",   title: "Horizon Split",      primaryColor: PAL.steel, accentColor: PAL.blue,  description: "Modern landscape card with colored left panel" },
  { templateKey: "MINIMAL_MODERN",    title: "Minimal Modern",     primaryColor: PAL.navy,  accentColor: PAL.blue,  description: "Clean minimal card with circular photo" },
  { templateKey: "ROYAL_SOUTH",       title: "Royal South Indian", primaryColor: PAL.navy,  accentColor: PAL.blue,  description: "Ornate logo ring with diamond detail rows" },
  { templateKey: "MAROON_CREAM",      title: "Maroon & Cream",     primaryColor: PAL.steel, accentColor: PAL.blue,  description: "Soft cream body with ornate dividers" },
  { templateKey: "CBSE_GREEN",        title: "Crisp Clean",        primaryColor: PAL.steel, accentColor: PAL.blue,  description: "Structured layout with academic year badge" },
  { templateKey: "CORPORATE_SIDEBAR", title: "Corporate Sidebar",  primaryColor: PAL.navy,  accentColor: PAL.blue,  description: "Professional style with vertical sidebar" },
  { templateKey: "WAVE_GRADIENT",     title: "Wave Gradient",      primaryColor: PAL.navy,  accentColor: PAL.blue,  description: "Friendly wave-divider header with floating photo" },
  { templateKey: "ACADEMIC_BADGE",    title: "Academic Badge",     primaryColor: PAL.steel, accentColor: PAL.blue,  description: "Credential-style badge with gradient crest header" },
  { templateKey: "MEDICAL_FOCUS",     title: "Medical Focus",      primaryColor: PAL.navy,  accentColor: PAL.steel, description: "Foregrounds blood group & emergency contact" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function IdCardManagement() {
  const [tab, setTab]             = useState("templates");
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [schools, setSchools]                   = useState([]);
  const [schoolClasses, setSchoolClasses]       = useState([]);
  const [loadingClasses, setLoadingClasses]     = useState(false);
  const [expandedClass, setExpandedClass]       = useState(null);
  const [classStudents, setClassStudents]       = useState({});
  const [loadingStudents, setLoadingStudents]   = useState({});
  const [loading, setLoading]     = useState(false);

  const [uploadModal, setUploadModal]         = useState(false);
  const [orderModal, setOrderModal]           = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [fullPreviewTemplate, setFullPreviewTemplate] = useState(null); // FIX 4
  const [editTemplateData, setEditTemplateData]       = useState(null); // Edit template → loads into CustomizeTab

  const [uploadForm, setUploadForm]   = useState({ title: "", description: "", file: null });
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef();
  const seededRef    = useRef(false);

  // ── Per-card color editing state ──────────────────────────────────────────
  // Keyed by template id. Editing card A's colors only ever reads/writes
  // editingColors[A.id] and savingColorId === A.id, so card B's state and
  // the `templates` rows for every other card are never touched.
  const [editingColorId, setEditingColorId] = useState(null);
  const [editingColors, setEditingColors]    = useState({ primary: "", accent: "" });
  const [savingColorId, setSavingColorId]    = useState(null);
  const [colorSaveError, setColorSaveError]  = useState("");

  const [orderForm, setOrderForm] = useState({
    schoolId: "", templateId: "", contactName: "",
    contactPhone: "", contactEmail: "", notes: "",
    classDetails: [{ className: "", studentCount: "" }],
  });
  const [orderError, setOrderError]     = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  // Derive the current user's schoolId once (null for super-admins)
  const currentUser   = getUser();
  const userSchoolId  = currentUser?.schoolId || currentUser?.university?.id || null;
  const isSuperAdmin  = currentUser?.role === "SUPER_ADMIN";

  const fetchTemplates = async (schoolId = null) => {
    setLoading(true);
    try {
      // School users: always pass their own schoolId so the backend filters correctly.
      // Super-admins: use the explicit schoolId arg (e.g. from the order modal filter).
      const effectiveSchoolId = isSuperAdmin ? schoolId : userSchoolId;
      const url = effectiveSchoolId
        ? `${API}/api/id-cards/templates?schoolId=${effectiveSchoolId}`
        : `${API}/api/id-cards/templates`;
      const res  = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // School users: always scope to own school. SuperAdmin: no filter (sees all).
      const url = (!isSuperAdmin && userSchoolId)
        ? `${API}/api/id-cards/orders?schoolId=${userSchoolId}`
        : `${API}/api/id-cards/orders`;
      const res  = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSchools = async () => {
    try {
      const res  = await fetch(`${API}/api/schools`, { headers: authHeaders() });
      const data = await res.json();
      setSchools(data.schools || data || []);
    } catch (err) { console.error(err); }
  };

  const fetchClassesForSchool = async (schoolId) => {
    if (!schoolId) { setSchoolClasses([]); return; }
    setLoadingClasses(true);
    try {
      const res  = await fetch(`${API}/api/class-sections?schoolId=${schoolId}`, { headers: authHeaders() });
      const data = await res.json();
      setSchoolClasses(data.classSections || data.classes || data || []);
    } catch (err) { console.error(err); setSchoolClasses([]); }
    finally { setLoadingClasses(false); }
  };

  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedCodedTemplates();
    }
    if (tab === "templates") fetchTemplates();
    else if (tab === "orders") fetchOrders();
  }, [tab]);

  // Seed the 10 coded templates into DB on first load (safe — backend skips duplicates)
  const seedCodedTemplates = async () => {
    try {
      await Promise.all(
        CODED_TEMPLATES.map((t) =>
          fetch(`${API}/api/id-cards/templates/coded`, {
            method:  "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body:    JSON.stringify(t),
          })
        )
      );
    } catch (err) {
      console.error("seedCodedTemplates error:", err);
    }
  };

  const handleUpload = async () => {
    setUploadError("");
    if (!uploadForm.file)  { setUploadError("Please select an image."); return; }
    if (!uploadForm.title) { setUploadError("Title is required."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadForm.file);
      fd.append("title", uploadForm.title);
      fd.append("description", uploadForm.description);
      // Only pass schoolId for school staff — SuperAdmins upload global templates (no schoolId)
      if (!isSuperAdmin && userSchoolId) fd.append("schoolId", userSchoolId);
      const res  = await fetch(`${API}/api/id-cards/upload`, {
        method: "POST",
        headers: authHeaders(),  // include auth token
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadModal(false);
      setUploadForm({ title: "", description: "", file: null });
      fetchTemplates();
    } catch (err) { setUploadError(err.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await fetch(`${API}/api/id-cards/templates/${id}`, { method: "DELETE", headers: authHeaders() });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) { console.error(err); }
  };

  // ── Open the inline color editor for ONE specific card ───────────────────
  const openColorEditor = (t) => {
    setColorSaveError("");
    setEditingColorId(t.id);
    setEditingColors({
      primary: t.primaryColor || PAL.navy,
      accent:  t.accentColor  || PAL.blue,
    });
  };

  const closeColorEditor = () => {
    setEditingColorId(null);
    setColorSaveError("");
  };

  // ── Save colors for ONLY the card being edited ────────────────────────────
  // When a school user edits a global default, the backend CLONES it for their
  // school and returns { cloned: true, template: <new row> }. In that case we
  // replace the original card in local state with the cloned one so the UI
  // reflects the school-scoped copy going forward.
  const handleSaveCardColors = async (templateId) => {
    setSavingColorId(templateId);
    setColorSaveError("");
    try {
      const res = await fetch(`${API}/api/id-cards/templates/${templateId}/colors`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: editingColors.primary,
          accentColor:  editingColors.accent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update colors");

      if (data.cloned) {
        // Backend created a school-scoped clone — swap the original card out
        setTemplates((prev) => prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                id:           data.template.id,  // new clone id
                schoolId:     data.template.schoolId,
                isDefault:    false,
                primaryColor: data.template.primaryColor,
                accentColor:  data.template.accentColor,
              }
            : t
        ));
      } else {
        // Normal in-place update
        setTemplates((prev) => prev.map((t) =>
          t.id === templateId
            ? { ...t, primaryColor: editingColors.primary, accentColor: editingColors.accent }
            : t
        ));
      }
      setEditingColorId(null);
    } catch (err) {
      setColorSaveError(err.message);
    } finally {
      setSavingColorId(null);
    }
  };

  const fetchStudentsForClass = async (cls) => {
    if (classStudents[cls.id]) return;
    setLoadingStudents((p) => ({ ...p, [cls.id]: true }));
    try {
      const res  = await fetch(
        `${API}/api/students?classSectionId=${cls.id}&schoolId=${orderForm.schoolId}&limit=200&page=1`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      setClassStudents((p) => ({ ...p, [cls.id]: data.students || [] }));
    } catch (err) { console.error(err); }
    finally { setLoadingStudents((p) => ({ ...p, [cls.id]: false })); }
  };

  const openOrderModal = () => {
    fetchSchools();
    setSchoolClasses([]); setExpandedClass(null);
    setClassStudents({}); setLoadingStudents({});
    setOrderForm({ schoolId: "", templateId: "", contactName: "", contactPhone: "", contactEmail: "", notes: "", classDetails: [] });
    setOrderError(""); setOrderSuccess(false);
    setOrderModal(true);
  };

  const totalCards = orderForm.classDetails.reduce((sum, r) => sum + (Number(r.studentCount) || 0), 0);

  const handlePlaceOrder = async () => {
    setOrderError("");
    if (!orderForm.schoolId) { setOrderError("Please select a school."); return; }
    const validClasses = orderForm.classDetails.filter((r) => r.className && Number(r.studentCount) > 0);
    if (validClasses.length === 0) { setOrderError("Add at least one class with student count."); return; }
    setPlacingOrder(true);
    try {
      const res = await fetch(`${API}/api/id-cards/orders/place`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: orderForm.schoolId, templateId: orderForm.templateId || null,
          contactName: orderForm.contactName || null, contactPhone: orderForm.contactPhone || null,
          contactEmail: orderForm.contactEmail || null, notes: orderForm.notes || null,
          classDetails: validClasses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      setOrderSuccess(true);
      fetchOrders();
      setTimeout(() => { setOrderModal(false); setOrderSuccess(false); }, 2000);
    } catch (err) { setOrderError(err.message); }
    finally { setPlacingOrder(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`${API}/api/id-cards/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6" style={{ background: COLORS.bgSoft }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: COLORS.primary }}>ID Card Management</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: COLORS.secondary }}>Manage templates, customize design and place orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tab === "templates" && (
            <button onClick={() => setUploadModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: COLORS.accentDeep }}>
              <Upload size={13} /> Upload Template
            </button>
          )}
          <button onClick={openOrderModal}
            className="flex items-center gap-2 px-3 bg-blue-500 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90"
             >
            <ShoppingCart size={13} /> Place Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#e3ecf3" }}>
        {[
          { key: "templates", label: "Templates", icon: LayoutTemplate },
          { key: "orders",    label: "Orders",    icon: ShoppingBag },
          { key: "customize", label: "Customize", icon: Palette },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === key ? "#fff" : "transparent",
              color:      tab === key ? COLORS.primary : COLORS.secondary,
              boxShadow:  tab === key ? "0 1px 6px rgba(56,73,89,0.14)" : "none",
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Templates Tab ── */}
      {tab === "templates" && (
        loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="animate-spin" style={{ color: COLORS.accentDeep }} />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 rounded-2xl"
            style={{ border: `2px dashed ${COLORS.border}`, background: "#fff" }}>
            <LayoutTemplate size={40} style={{ color: COLORS.border }} />
            <p className="mt-3 font-semibold" style={{ color: COLORS.secondary }}>No templates yet</p>
            <p className="text-sm mt-1" style={{ color: COLORS.secondary }}>Upload an ID card design template</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => {
              const isEditing = editingColorId === t.id;
              const isSavingThis = savingColorId === t.id;
              const meta = TEMPLATE_META[t.templateKey];
              const cardWidth  = meta?.width  || 280;
              const cardHeight = meta?.height || 480;
              // Scale so every template's thumbnail fits the SAME box height
              // (THUMB_BOX_H), regardless of that template's natural size —
              // this is what removes the empty gap under shorter/landscape cards.
              const THUMB_BOX_H = 150;
              const scale = Math.min(THUMB_BOX_H / cardHeight, 220 / cardWidth);

              return (
              <div key={t.id} className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${isEditing ? COLORS.accentDeep : COLORS.border}`,
                  boxShadow: isEditing ? `0 0 0 3px ${COLORS.blue}33` : "0 1px 4px rgba(56,73,89,0.06)",
                }}>

                {/* Thumbnail — live card preview for CODED, image for UPLOADED */}
                <div className="relative p-3 flex items-center justify-center" style={{ background: "#eef3f8", height: THUMB_BOX_H, overflow: "hidden" }}>
                  {t.templateType === "CODED" ? (
                    <div style={{
                      width: cardWidth, height: cardHeight,
                      transform: `scale(${scale})`, transformOrigin: "center center", flexShrink: 0,
                    }}>
                      {(() => {
                        const Comp = getTemplateComponent(t.templateKey);
                        const savedElements = t.elementLayout || null;
                        // Reconstruct saved cardBlocks state to restore schoolName, location, footer
                        const savedBlocks = t.cardBlocks || [];
                        const getB = (id) => savedBlocks.find((b) => b.id === id) || {};
                        const schoolNameBlock = getB("schoolName");
                        const locationBlock   = getB("location");
                        const footerBlock     = getB("footer");
                        // Reconstruct saved photoStyles from cardBlocks metadata
                        const savedPhotoStyles = t.photoStyles || null;
                        const getShape = (shape) => {
                          if (shape === "circle")  return { borderRadius: "50%",  clipPath: "none" };
                          if (shape === "square")  return { borderRadius: "3px",  clipPath: "none" };
                          if (shape === "hexagon") return { borderRadius: 0, clipPath: "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)" };
                          return { borderRadius: "12px", clipPath: "none" };
                        };
                        const getBC = (key, acc, pri) => key === "primary" ? pri : key === "white" ? "#fff" : key === "none" ? "transparent" : acc;
                        const acc = t.accentColor  || PAL.blue;
                        const pri = t.primaryColor || PAL.navy;
                        const thumbStudent = {
                          ...SAMPLE_STUDENT,
                          ...(savedElements ? { orderedElements: savedElements, extraElements: savedElements.filter((e) => e.type === "custom") } : {}),
                          schoolName: schoolNameBlock.visible !== false ? (schoolNameBlock.text || undefined) : undefined,
                          location:   locationBlock.visible   !== false ? (locationBlock.text   || undefined) : undefined,
                          footerText: footerBlock.text || undefined,
                          ...(savedPhotoStyles ? {
                            logoShapeStyle:     getShape(savedPhotoStyles.logoShape),
                            logoBorderColor:    getBC(savedPhotoStyles.logoBorder, acc, pri),
                            studentShapeStyle:  getShape(savedPhotoStyles.studentShape),
                            studentBorderColor: getBC(savedPhotoStyles.studentBorder, acc, pri),
                          } : {}),
                        };
                        return (
                          <Comp
                            theme={{ primary: pri, accent: acc }}
                            logo={null}
                            student={thumbStudent}
                          />
                        );
                      })()}
                    </div>
                  ) : t.imageUrl ? (
                    <>
                      <img src={t.imageUrl} alt={t.title} className="w-full object-cover" style={{ maxHeight: 120 }} />
                      <button onClick={() => setPreviewTemplate(t)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg"
                        style={{ background: "rgba(56,73,89,0.6)" }}>
                        <Eye size={13} color="#fff" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center" style={{ minHeight: 100 }}>
                      <LayoutTemplate size={32} style={{ color: COLORS.border }} />
                    </div>
                  )}
                  {/* FIX 4: View Full button for CODED templates */}
                  {t.templateType === "CODED" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setFullPreviewTemplate(t); }}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: "rgba(56,73,89,0.65)", color: "white", border: "none", cursor: "pointer" }}>
                      <Eye size={11} /> View
                    </button>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-bold text-sm truncate" style={{ color: COLORS.primary }}>{t.title}</p>

                  {/* Type badge */}
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-1"
                    style={{
                      background: t.templateType === "CODED" ? "#eaf3fd" : "#eef3f8",
                      color:      t.templateType === "CODED" ? COLORS.accentDeep : COLORS.steel,
                    }}>
                    {t.templateType === "CODED" ? "⚡ Built-in Template" : "🖼 Uploaded Design"}
                  </span>

                  {t.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: COLORS.secondary }}>{t.description}</p>}

                  {/* ── Per-card color editor — CODED templates only ── */}
                  {t.templateType === "CODED" && !isEditing && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: t.primaryColor, border: "1px solid rgba(0,0,0,0.08)" }} title="Primary" />
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: t.accentColor, border: "1px solid rgba(0,0,0,0.08)" }} title="Accent" />
                      <button onClick={() => openColorEditor(t)}
                        className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                        style={{ background: COLORS.bgSoft, color: COLORS.accentDeep }}>
                        <Pencil size={10} /> Recolor
                      </button>
                    </div>
                  )}

                  {t.templateType === "CODED" && isEditing && (
                    <div className="mt-3 p-3 rounded-xl space-y-2.5" style={{ background: COLORS.bgSoft, border: `1px solid ${COLORS.border}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.secondary }}>
                        Editing colors for <span style={{ color: COLORS.primary }}>this card only</span>
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: COLORS.primary }}>Primary</span>
                        <div className="flex items-center gap-1.5">
                          <input type="color" value={editingColors.primary}
                            onChange={(e) => setEditingColors((p) => ({ ...p, primary: e.target.value }))}
                            className="w-8 h-7 rounded cursor-pointer border-0 p-0" style={{ background: "transparent" }} />
                          <span className="text-[10px] font-mono" style={{ color: COLORS.secondary }}>{editingColors.primary}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: COLORS.primary }}>Accent</span>
                        <div className="flex items-center gap-1.5">
                          <input type="color" value={editingColors.accent}
                            onChange={(e) => setEditingColors((p) => ({ ...p, accent: e.target.value }))}
                            className="w-8 h-7 rounded cursor-pointer border-0 p-0" style={{ background: "transparent" }} />
                          <span className="text-[10px] font-mono" style={{ color: COLORS.secondary }}>{editingColors.accent}</span>
                        </div>
                      </div>

                      {colorSaveError && <p className="text-[10px]" style={{ color: "#ef4444" }}>{colorSaveError}</p>}

                      <div className="flex gap-2 pt-1">
                        <button onClick={closeColorEditor}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold"
                          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary, background: "white" }}>
                          Cancel
                        </button>
                        <button onClick={() => handleSaveCardColors(t.id)} disabled={isSavingThis}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white"
                          style={{ background: isSavingThis ? "#9bc4ee" : COLORS.accentDeep }}>
                          {isSavingThis ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          {isSavingThis ? "Saving…" : "Save This Card"}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs mt-2" style={{ color: COLORS.secondary }}>
                    {new Date(t.uploadedAt).toLocaleDateString("en-IN")}
                  </p>

                  {/* Allow delete for uploaded templates AND own (non-default) coded templates */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {/* Edit in Customize tab — CODED templates only */}
                    {t.templateType === "CODED" && (
                      <button onClick={() => {
                          setEditTemplateData({
                            title:       t.title,
                            templateKey: t.templateKey,
                            primaryColor: t.primaryColor,
                            accentColor:  t.accentColor,
                            elementLayout: t.elementLayout || null,
                            cardBlocks:    t.cardBlocks    || null,
                          });
                          setTab("customize");
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: "#eaf3fd", color: COLORS.accentDeep }}>
                        <Pencil size={11} /> Edit
                      </button>
                    )}
                    {(t.templateType !== "CODED" || (!t.isDefault && t.isOwn)) && (
                      <button onClick={() => handleDelete(t.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: "#fef2f2", color: "#ef4444" }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Orders Tab ── */}
      {tab === "orders" && (
        loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="animate-spin" style={{ color: COLORS.accentDeep }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 rounded-2xl"
            style={{ border: `2px dashed ${COLORS.border}`, background: "#fff" }}>
            <ShoppingBag size={40} style={{ color: COLORS.border }} />
            <p className="mt-3 font-semibold" style={{ color: COLORS.secondary }}>No orders yet</p>
            <button onClick={openOrderModal}
              className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: COLORS.navy }}>
              Place First Order
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 800 }}>
                <thead>
                  <tr style={{ background: COLORS.bgSoft, borderBottom: `1px solid ${COLORS.border}` }}>
                    {["School", "Template", "Classes & Count", "Total Cards", "Contact", "Ordered On", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-bold text-xs" style={{ color: COLORS.secondary }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const sc      = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                    const classes = Array.isArray(order.classDetails) ? order.classDetails : [];
                    return (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: COLORS.primary }}>{order.schoolName}</p>
                        </td>
                        <td className="px-4 py-3">
                          {order.template
                            ? <div className="flex items-center gap-2">
                                {order.template.imageUrl && <img src={order.template.imageUrl} alt="" className="w-10 h-6 object-cover rounded" />}
                                <span className="text-xs font-medium" style={{ color: COLORS.primary }}>{order.template.title}</span>
                              </div>
                            : <span className="text-xs" style={{ color: COLORS.secondary }}>No template</span>}
                        </td>
                        <td className="px-4 py-3" style={{ maxWidth: 200 }}>
                          <div className="flex flex-wrap gap-1">
                            {classes.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: "#eaf3fd", color: COLORS.accentDeep }}>
                                {c.className} ({c.studentCount})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-lg" style={{ color: COLORS.primary }}>{order.totalCards}</span>
                        </td>
                        <td className="px-4 py-3">
                          {order.contactName
                            ? <><p className="text-xs font-medium" style={{ color: COLORS.primary }}>{order.contactName}</p>
                               <p className="text-xs" style={{ color: COLORS.secondary }}>{order.contactPhone || order.contactEmail || ""}</p></>
                            : <span className="text-xs" style={{ color: COLORS.secondary }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: COLORS.secondary }}>
                          {new Date(order.orderedAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <select value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-xs font-bold rounded-full px-3 py-1 appearance-none cursor-pointer"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, outline: "none" }}>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <option key={key} value={key}>{cfg.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Customize Tab ── */}
      {tab === "customize" && <CustomizeTab onTemplateSaved={fetchTemplates} initialData={editTemplateData} onClearInitial={() => setEditTemplateData(null)} />}

      {/* ── Upload Modal ── */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,33,0.55)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>Upload ID Card Template</h2>
            {uploadError && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>{uploadError}</div>}
            <div onClick={() => fileInputRef.current?.click()}
              className="mb-4 rounded-xl flex flex-col items-center justify-center cursor-pointer"
              style={{ border: `2px dashed ${uploadForm.file ? COLORS.accentDeep : COLORS.border}`, padding: "24px", background: uploadForm.file ? "#eaf3fd" : COLORS.bgSoft }}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => setUploadForm((p) => ({ ...p, file: e.target.files[0] }))} />
              {uploadForm.file
                ? <><img src={URL.createObjectURL(uploadForm.file)} alt="Preview" className="max-h-32 rounded-lg object-contain mb-2" />
                    <p className="text-xs font-semibold" style={{ color: COLORS.accentDeep }}>{uploadForm.file.name}</p></>
                : <><Upload size={28} style={{ color: COLORS.border }} />
                    <p className="text-sm mt-2 font-semibold" style={{ color: COLORS.secondary }}>Click to select image</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.secondary }}>JPEG, PNG, WebP — max 5 MB</p></>}
            </div>
            <input type="text" placeholder="Template title *" value={uploadForm.title}
              onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full mb-3 px-4 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
            <textarea placeholder="Description (optional)" value={uploadForm.description}
              onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
              rows={2} className="w-full mb-4 px-4 py-2.5 rounded-xl text-sm resize-none"
              style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
            <div className="flex gap-3">
              <button onClick={() => { setUploadModal(false); setUploadError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary }}>Cancel</button>
              <button onClick={handleUpload} disabled={uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: uploading ? "#9bc4ee" : COLORS.accentDeep }}>
                {uploading ? "Uploading…" : "Upload Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Modal ── */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,33,0.55)" }}>
          <div className="w-full max-w-2xl rounded-2xl" style={{ background: "#fff", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: COLORS.primary }}>Place ID Card Order</h2>
                <p className="text-sm" style={{ color: COLORS.secondary }}>Select school, template and enter class details</p>
              </div>
              <button onClick={() => setOrderModal(false)} className="p-2 rounded-lg" style={{ background: COLORS.bgSoft }}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {orderSuccess && (
                <div className="p-4 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: "#f0fdf4", color: "#15803d" }}>
                  <CheckCircle size={16} /> Order placed successfully!
                </div>
              )}
              {orderError && <div className="p-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>{orderError}</div>}
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: COLORS.primary }}>School *</label>
                <select value={orderForm.schoolId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setOrderForm((p) => ({ ...p, schoolId: sid, classDetails: [], templateId: "" }));
                    fetchClassesForSchool(sid);
                    if (sid) fetchTemplates(sid);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{ border: `1px solid ${COLORS.border}`, outline: "none" }}>
                  <option value="">Select a school</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: COLORS.primary }}>Template (optional)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div onClick={() => setOrderForm((p) => ({ ...p, templateId: "" }))}
                    className="rounded-xl p-2 cursor-pointer text-center text-xs font-semibold"
                    style={{ border: `2px solid ${!orderForm.templateId ? COLORS.accentDeep : COLORS.border}`, background: !orderForm.templateId ? "#eaf3fd" : "#fff", color: !orderForm.templateId ? COLORS.accentDeep : COLORS.secondary }}>
                    No template
                  </div>
                  {templates.map((t) => {
                    const isSelected = orderForm.templateId === t.id;
                    return (
                      <div key={t.id} onClick={() => setOrderForm((p) => ({ ...p, templateId: t.id }))}
                        className="rounded-xl overflow-hidden cursor-pointer transition-all"
                        style={{ border: `2px solid ${isSelected ? COLORS.accentDeep : COLORS.border}`, background: isSelected ? "#eaf3fd" : "#fff" }}>
                        {t.templateType === "CODED" ? (
                          <div style={{ background: "#eef3f8", overflow: "hidden", height: 120, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 4 }}>
                            {(() => {
                              const Comp = getTemplateComponent(t.templateKey);
                              const savedElements = t.elementLayout || null;
                              const savedBlocks   = t.cardBlocks    || [];
                              const getB = (id) => savedBlocks.find((b) => b.id === id) || {};
                              const thumbStudent = {
                                ...SAMPLE_STUDENT,
                                schoolName: getB("schoolName").text || t.title || "School Name",
                                location:   getB("location").visible !== false ? (getB("location").text || null) : undefined,
                                footerText: getB("footer").text || "STUDENT ID CARD",
                                ...(savedElements ? { orderedElements: savedElements, extraElements: savedElements.filter(e => e.type === "custom") } : {}),
                              };
                              const isHoriz = t.templateKey === "NAVY_HORIZONTAL";
                              return (
                                <div style={{
                                  flexShrink: 0,
                                  transform: isHoriz ? "scale(0.22)" : "scale(0.27)",
                                  transformOrigin: "top center",
                                  width: isHoriz ? 380 : 280,
                                }}>
                                  <Comp theme={{ primary: t.primaryColor || PAL.navy, accent: t.accentColor || PAL.blue }} logo={null} student={thumbStudent} />
                                </div>
                              );
                            })()}
                          </div>
                        ) : t.imageUrl ? (
                          <img src={t.imageUrl} alt={t.title} className="w-full h-16 object-cover" />
                        ) : (
                          <div style={{ height: 80, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <LayoutTemplate size={24} style={{ color: COLORS.border }} />
                          </div>
                        )}
                        <p className="text-xs font-semibold text-center py-1.5 px-2 truncate"
                          style={{ color: isSelected ? COLORS.accentDeep : COLORS.primary }}>
                          {t.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold" style={{ color: COLORS.primary }}>Classes & Student Count *</label>
                  {orderForm.schoolId && !loadingClasses && schoolClasses.length > 0 && (
                    <button onClick={() => setOrderForm((p) => ({ ...p, classDetails: schoolClasses.map((c) => ({ className: c.name, studentCount: c._count?.studentEnrollments || 0, studentIds: [] })) }))}
                      className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "#eaf3fd", color: COLORS.accentDeep }}>
                      + Add All Classes
                    </button>
                  )}
                </div>
                {!orderForm.schoolId && <p className="text-xs py-3 text-center rounded-xl" style={{ background: COLORS.bgSoft, color: COLORS.secondary }}>Select a school first</p>}
                {orderForm.schoolId && loadingClasses && <p className="text-xs py-3 text-center rounded-xl" style={{ background: COLORS.bgSoft, color: COLORS.secondary }}>Loading classes…</p>}
                {!loadingClasses && schoolClasses.length > 0 && (
                  <div className="space-y-2">
                    {schoolClasses.map((cls) => {
                      const existing   = orderForm.classDetails.find((r) => r.className === cls.name);
                      const isSelected = !!existing;
                      const isExpanded = expandedClass === cls.id;
                      const students   = classStudents[cls.id] || [];
                      const isLoadingStu = loadingStudents[cls.id];
                      const selectedIds  = new Set(existing?.studentIds || []);
                      const totalInClass = cls._count?.studentEnrollments || 0;
                      return (
                        <div key={cls.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isSelected ? COLORS.accentDeep : COLORS.border}` }}>
                          <div className="flex items-center gap-3 p-3" style={{ background: isSelected ? "#eaf3fd" : "#fff" }}>
                            <input type="checkbox" checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allIds = (classStudents[cls.id] || []).map(s => s.id);
                                  setOrderForm((p) => ({ ...p, classDetails: [...p.classDetails, { className: cls.name, studentCount: totalInClass, studentIds: allIds }] }));
                                  if (!classStudents[cls.id]) fetchStudentsForClass(cls);
                                } else {
                                  setOrderForm((p) => ({ ...p, classDetails: p.classDetails.filter((r) => r.className !== cls.name) }));
                                  if (expandedClass === cls.id) setExpandedClass(null);
                                }
                              }}
                              className="w-4 h-4 cursor-pointer flex-shrink-0" style={{ accentColor: COLORS.accentDeep }} />
                            <span className="flex-1 text-sm font-semibold" style={{ color: isSelected ? COLORS.accentDeep : COLORS.primary }}>{cls.name}</span>
                            {isSelected && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: COLORS.accentDeep }}>{existing.studentCount} students</span>}
                            {!isSelected && totalInClass > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLORS.bgSoft, color: COLORS.secondary }}>{totalInClass} students</span>}
                            {isSelected && (
                              <button onClick={() => { if (!isExpanded) { fetchStudentsForClass(cls); setExpandedClass(cls.id); } else setExpandedClass(null); }}
                                className="text-xs font-semibold px-2 py-1 rounded-lg"
                                style={{ background: isExpanded ? COLORS.accentDeep : "#dbeafe", color: isExpanded ? "#fff" : COLORS.accentDeep }}>
                                {isExpanded ? "▲ Hide" : "▼ Students"}
                              </button>
                            )}
                          </div>
                          {isSelected && isExpanded && (
                            <div style={{ borderTop: `1px solid ${COLORS.border}`, background: "#f8fafc" }}>
                              {isLoadingStu ? <p className="text-xs text-center py-3" style={{ color: COLORS.secondary }}>Loading…</p>
                              : students.length === 0 ? <p className="text-xs text-center py-3" style={{ color: COLORS.secondary }}>No students found</p>
                              : <>
                                  <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: `1px solid ${COLORS.border}`, background: "#f1f5f9" }}>
                                    <input type="checkbox" checked={selectedIds.size === students.length}
                                      onChange={(e) => {
                                        const allIds = e.target.checked ? students.map(s => s.id) : [];
                                        setOrderForm((p) => ({ ...p, classDetails: p.classDetails.map((r) => r.className === cls.name ? { ...r, studentIds: allIds, studentCount: allIds.length } : r) }));
                                      }}
                                      className="w-4 h-4 cursor-pointer" style={{ accentColor: COLORS.accentDeep }} />
                                    <span className="text-xs font-bold" style={{ color: COLORS.primary }}>Select All ({students.length})</span>
                                  </div>
                                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                    {students.map((stu) => {
                                      const checked = selectedIds.has(stu.id);
                                      const name = stu.personalInfo ? `${stu.personalInfo.firstName} ${stu.personalInfo.lastName}` : stu.name;
                                      const admNo = stu.enrollments?.[0]?.admissionNumber || "—";
                                      return (
                                        <label key={stu.id} className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                                          style={{ borderBottom: `1px solid ${COLORS.border}`, background: checked ? "#eaf3fd" : "#fff" }}>
                                          <input type="checkbox" checked={checked}
                                            onChange={(e) => {
                                              const newIds = e.target.checked ? [...selectedIds, stu.id] : [...selectedIds].filter(id => id !== stu.id);
                                              setOrderForm((p) => ({ ...p, classDetails: p.classDetails.map((r) => r.className === cls.name ? { ...r, studentIds: newIds, studentCount: newIds.length } : r) }));
                                            }}
                                            className="w-4 h-4 cursor-pointer flex-shrink-0" style={{ accentColor: COLORS.accentDeep }} />
                                          <span className="text-sm flex-1" style={{ color: COLORS.primary }}>{name}</span>
                                          <span className="text-xs" style={{ color: COLORS.secondary }}>#{admNo}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {orderForm.schoolId && !loadingClasses && schoolClasses.length === 0 && (
                  <p className="text-xs py-3 text-center rounded-xl" style={{ background: "#fffbeb", color: "#b45309" }}>No classes found for this school.</p>
                )}
                {totalCards > 0 && (
                  <div className="mt-3 px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-between" style={{ background: "#f0fdf4", color: "#15803d" }}>
                    <span>{orderForm.classDetails.filter(r => r.studentCount).length} classes selected</span>
                    <span>Total: {totalCards} cards</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold mb-2 block" style={{ color: COLORS.primary }}>Contact Person (optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" placeholder="Name" value={orderForm.contactName} onChange={(e) => setOrderForm((p) => ({ ...p, contactName: e.target.value }))} className="px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
                  <input type="text" placeholder="Phone" value={orderForm.contactPhone} onChange={(e) => setOrderForm((p) => ({ ...p, contactPhone: e.target.value }))} className="px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
                  <input type="email" placeholder="Email" value={orderForm.contactEmail} onChange={(e) => setOrderForm((p) => ({ ...p, contactEmail: e.target.value }))} className="px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: COLORS.primary }}>Notes (optional)</label>
                <textarea placeholder="Any special instructions..." value={orderForm.notes} onChange={(e) => setOrderForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setOrderModal(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary }}>Cancel</button>
              <button onClick={handlePlaceOrder} disabled={placingOrder} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: placingOrder ? "#6ee7b7" : "#10b981" }}>
                {placingOrder ? "Placing Order…" : `Place Order${totalCards > 0 ? ` (${totalCards} cards)` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(15,23,33,0.85)" }} onClick={() => setPreviewTemplate(null)}>
          <div className="w-full sm:w-auto sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#fff", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div className="min-w-0 flex-1 mr-3">
                <p className="font-bold text-sm truncate" style={{ color: COLORS.primary }}>{previewTemplate.title}</p>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5" style={{ background: previewTemplate.isDefault ? "#eaf3fd" : "#f0fdf4", color: previewTemplate.isDefault ? COLORS.accentDeep : "#15803d" }}>
                  {previewTemplate.isDefault ? "🌐 Platform Default" : "⭐ Your Design"}
                </span>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-lg" style={{ width: 34, height: 34, background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <img src={previewTemplate.imageUrl} alt={previewTemplate.title} style={{ width: "100%", height: "auto", display: "block" }} />
              {previewTemplate.description && <p className="px-4 py-3 text-sm" style={{ color: COLORS.secondary }}>{previewTemplate.description}</p>}
            </div>
            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <button onClick={() => setPreviewTemplate(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: COLORS.primary }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FIX 4: Full Template Preview Modal for CODED templates ── */}
      {fullPreviewTemplate && (() => {
        const ft = fullPreviewTemplate;
        const Comp = getTemplateComponent(ft.templateKey);
        const meta = TEMPLATE_META[ft.templateKey] || { width: 280, height: 460 };
        const savedElements = ft.elementLayout || null;
        // Restore cardBlocks-driven text (schoolName, location, footerText) for View modal
        const savedBlocks = ft.cardBlocks || null;
        const getBlockText = (id, fallback) => {
          if (!savedBlocks) return fallback;
          const b = savedBlocks.find((b) => b.id === id);
          return (b && b.visible !== false && b.text) ? b.text : (b?.visible === false ? undefined : fallback);
        };
        const thumbStudent = {
          ...SAMPLE_STUDENT,
          schoolName: getBlockText("schoolName", "School Name"),
          location:   getBlockText("location", null),
          footerText: getBlockText("footer", "STUDENT ID CARD"),
          ...(savedElements ? {
            orderedElements: savedElements,
            extraElements:   savedElements.filter((e) => e.type === "custom"),
          } : {}),
        };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,33,0.88)" }}
            onClick={() => setFullPreviewTemplate(null)}>
            <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: "#f4f8fb", maxHeight: "95vh", maxWidth: 480, width: "100%" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ background: "white", borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: COLORS.primary }}>{ft.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: ft.primaryColor || PAL.navy }} />
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: ft.accentColor  || PAL.blue  }} />
                    <span className="text-[10px]" style={{ color: COLORS.secondary }}>{ft.primaryColor} · {ft.accentColor}</span>
                  </div>
                </div>
                <button onClick={() => setFullPreviewTemplate(null)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={15} color={COLORS.secondary} />
                </button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-6">
                <div style={{ width: meta.width, flexShrink: 0 }}>
                  <Comp
                    theme={{ primary: ft.primaryColor || PAL.navy, accent: ft.accentColor || PAL.blue }}
                    logo={null} student={thumbStudent}
                  />
                </div>
              </div>
              {savedElements && savedElements.length > 0 && (
                <div className="flex-shrink-0 px-4 pb-3" style={{ borderTop: `1px solid ${COLORS.border}`, background: "white" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide pt-3 mb-2" style={{ color: COLORS.secondary }}>Saved Fields</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedElements.map((el) => (
                      <span key={el.id} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#eaf3fd", color: COLORS.accentDeep }}>{el.label}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-shrink-0 px-4 py-3" style={{ background: "white", borderTop: `1px solid ${COLORS.border}` }}>
                <button onClick={() => setFullPreviewTemplate(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: COLORS.primary }}>Close Preview</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}