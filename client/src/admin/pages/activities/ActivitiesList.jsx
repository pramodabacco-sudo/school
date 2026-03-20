// client/src/admin/pages/activities/ActivitiesList.jsx
// Redesigned to match Gallery.jsx design system — fully responsive + datetime support

import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy, Users, Plus, X, Edit2, Trash2, Loader2,
  CheckCircle, AlertCircle, Search, Star, Swords,
  Music, BookOpen, ChevronRight, Dumbbell, Brain,
  Calendar, MapPin, Archive, RefreshCw, FolderOpen, Clock,
} from "lucide-react";
import { getToken } from "../../../auth/storage.js";

/* ── Design tokens (Gallery-identical) ── */
const C = {
  slate: "#6A89A7", mist: "#BDDDFC", sky: "#88BDF2", deep: "#384959",
  bg: "#EDF3FA", white: "#FFFFFF", border: "#C8DCF0", borderLight: "#DDE9F5",
  text: "#243340", textLight: "#6A89A7",
};

const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/admin/activities`;

const CATEGORY_META = {
  SPORTS:   { label:"Sports",   color:"#f59e0b", Icon:Dumbbell },
  CULTURAL: { label:"Cultural", color:"#a855f7", Icon:Music    },
  ACADEMIC: { label:"Academic", color:"#22c55e", Icon:Brain    },
  OTHER:    { label:"Other",    color:"#6A89A7", Icon:Star     },
};

const EVENT_TYPE_META = {
  COMPETITION:   { label:"Competition",   color:"#f59e0b", Icon:Swords  },
  CULTURAL:      { label:"Cultural",      color:"#a855f7", Icon:Music   },
  PARTICIPATION: { label:"Participation", color:"#22c55e", Icon:Star    },
  CEREMONY:      { label:"Ceremony",      color:"#88BDF2", Icon:Trophy  },
};

const EVENT_STATUS_META = {
  DRAFT:     { label:"Draft",     color:"#94a3b8" },
  PUBLISHED: { label:"Published", color:"#22c55e" },
  COMPLETED: { label:"Completed", color:"#6366f1" },
  CANCELLED: { label:"Cancelled", color:"#ef4444" },
};

const apiFetch = async (url, opts = {}) => {
  const res  = await fetch(url, { headers:{ "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
};

/* ── Helpers ── */
function formatDateTime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const date = d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
  return { date, time, hasTime: isoStr.length > 10 };
}

/* ── Skeleton pulse (Gallery-style) ── */
function Pulse({ w = "100%", h = 13, r = 8 }) {
  return (
    <div className="animate-pulse" style={{ width:w, height:h, borderRadius:r, background:`${C.mist}55`, flexShrink:0 }}/>
  );
}

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };
  return { toasts, push };
}
function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:50, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none", maxWidth:"calc(100vw - 40px)" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"10px 16px", borderRadius:12, fontSize:13, fontWeight:600,
          boxShadow:"0 4px 20px rgba(56,73,89,0.18)",
          background: t.type === "success" ? "#f0fdf4" : "#fef2f2",
          border:`1.5px solid ${t.type === "success" ? "#86efac" : "#fca5a5"}`,
          color: t.type === "success" ? "#166534" : "#991b1b",
        }}>
          {t.type === "success" ? <CheckCircle size={14}/> : <AlertCircle size={14}/>} {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Modal (Gallery-style, responsive) ── */
function Modal({ title, subtitle, icon: Icon, onClose, children, wide }) {
  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:40, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 12px", background:"rgba(0,0,0,0.40)", backdropFilter:"blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="modal-box"
        style={{ background:C.white, borderRadius:20, border:`1.5px solid ${C.borderLight}`, boxShadow:"0 20px 60px rgba(56,73,89,0.18)", width:"100%", maxWidth: wide ? 680 : 480, maxHeight:"92vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding:"16px 20px", borderBottom:`1.5px solid ${C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:C.white, zIndex:10, borderRadius:"20px 20px 0 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {Icon && (
              <div style={{ width:34, height:34, borderRadius:10, background:`${C.sky}22`, border:`1.5px solid ${C.sky}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon size={15} color={C.sky}/>
              </div>
            )}
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.text }}>{title}</p>
              {subtitle && <p style={{ margin:0, fontSize:11, color:C.textLight }}>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.borderLight}`, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textLight, flexShrink:0 }}
          >
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:"20px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Form atoms ── */
const Label = ({ children, required }) => (
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" }}>
    {children}{required && <span style={{ color:"#ef4444", marginLeft:2 }}>*</span>}
  </label>
);

const Input = (p) => (
  <input
    style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"10px 14px", fontSize:13, color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" }}
    onFocus={e => (e.target.style.borderColor = C.sky)}
    onBlur={e  => (e.target.style.borderColor = C.border)}
    {...p}
  />
);

const Select = ({ children, ...p }) => (
  <select
    style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"10px 14px", fontSize:13, color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" }}
    onFocus={e => (e.target.style.borderColor = C.sky)}
    onBlur={e  => (e.target.style.borderColor = C.border)}
    {...p}
  >
    {children}
  </select>
);

const Textarea = (p) => (
  <textarea
    rows={3}
    style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"10px 14px", fontSize:13, color:C.text, background:C.bg, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit" }}
    onFocus={e => (e.target.style.borderColor = C.sky)}
    onBlur={e  => (e.target.style.borderColor = C.border)}
    {...p}
  />
);

/* ── Buttons ── */
function PrimaryBtn({ children, onClick, loading, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display:"flex", alignItems:"center", gap:7,
        padding: small ? "7px 14px" : "9px 20px",
        borderRadius:10, border:"none",
        background:`linear-gradient(135deg, ${C.slate}, ${C.deep})`,
        color:"#fff", fontSize: small ? 12 : 13, fontWeight:700,
        cursor:(loading || disabled) ? "not-allowed" : "pointer",
        opacity:(loading || disabled) ? 0.65 : 1, flexShrink:0,
        whiteSpace:"nowrap",
      }}
      onMouseEnter={e => { if (!loading && !disabled) e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={e => { if (!loading && !disabled) e.currentTarget.style.opacity = "1"; }}
    >
      {loading ? <Loader2 size={12} className="animate-spin"/> : children}
    </button>
  );
}

function OutlineBtn({ children, onClick, small, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:6,
        padding: small ? "7px 14px" : "9px 18px",
        borderRadius:10,
        border: danger ? "1.5px solid #fecaca" : `1.5px solid ${C.borderLight}`,
        background: danger ? "#fef2f2" : C.white,
        color: danger ? "#991b1b" : C.text,
        fontSize: small ? 12 : 13, fontWeight:600,
        cursor:"pointer", flexShrink:0, whiteSpace:"nowrap",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? "#fee2e2" : C.bg)}
      onMouseLeave={e => (e.currentTarget.style.background = danger ? "#fef2f2" : C.white)}
    >
      {children}
    </button>
  );
}

/* ── Pill toggle group ── */
function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            style={{
              padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
              background: active ? o.color : o.color + "18",
              color:      active ? "#fff"  : o.color,
              border:     `1.5px solid ${o.color}`,
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Class Section Picker ── */
function ClassPicker({ classSections, selected, onToggle }) {
  const byGrade = classSections.reduce((acc, cs) => {
    const g = cs.class?.name ?? "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(cs);
    return acc;
  }, {});

  return (
    <div style={{ borderRadius:11, overflow:"hidden", maxHeight:220, overflowY:"auto", border:`1.5px solid ${C.borderLight}`, background:C.bg }}>
      {Object.entries(byGrade).map(([grade, sections]) => (
        <div key={grade} style={{ padding:"10px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
          <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.04em" }}>{grade}</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {sections.map(cs => {
              const sel = selected.includes(cs.id);
              return (
                <button key={cs.id} type="button" onClick={() => onToggle(cs.id)}
                  style={{
                    fontSize:12, padding:"4px 12px", borderRadius:8, fontWeight:600, cursor:"pointer", transition:"all 0.15s",
                    background: sel ? C.deep : C.mist,
                    color:      sel ? C.white : C.text,
                    border:     `1.5px solid ${sel ? C.deep : C.borderLight}`,
                  }}>
                  {cs.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Form row helper — collapses on mobile ── */
function FormRow({ children, cols = 1 }) {
  return (
    <div className={`form-row form-row-${cols}`}>
      {children}
    </div>
  );
}

/* ── Divider ── */
function FormDivider() {
  return <div style={{ height:1, background:C.borderLight, margin:"4px 0" }}/>;
}

/* ══════════════════════════════════════════════════════════════
   ACTIVITY FORM MODAL
══════════════════════════════════════════════════════════════ */
function ActivityFormModal({ editing, academicYears, classSections, onClose, onSaved, pushToast }) {
  const isEdit = !!editing;
  const [form, setForm] = useState({
    name:              editing?.name              ?? "",
    description:       editing?.description       ?? "",
    category:          editing?.category          ?? "SPORTS",
    participationType: editing?.participationType ?? "TEAM",
    academicYearId:    editing?.academicYearId    ?? (academicYears.find(y => y.isActive)?.id ?? ""),
    classIds:          editing?.activityClasses?.map(ac => ac.classSection.id) ?? [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const save = async () => {
    if (!form.name.trim())      return pushToast("Activity name is required", "error");
    if (!form.academicYearId)   return pushToast("Academic year is required", "error");
    setSaving(true);
    try {
      const body = { ...form, classSectionIds: form.classIds };
      isEdit
        ? await apiFetch(`${API}/${editing.id}`, { method:"PUT", body:JSON.stringify(body) })
        : await apiFetch(API, { method:"POST", body:JSON.stringify(body) });
      pushToast(isEdit ? "Activity updated!" : "Activity created!");
      onSaved();
    } catch(e) { pushToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      title={isEdit ? "Edit Activity" : "New Activity"}
      subtitle={isEdit ? "Update activity details" : "Create a new activity"}
      icon={BookOpen}
      onClose={onClose}
      wide
    >
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <Label required>Activity Name</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Cricket, Dance Club"/>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="About this activity…"/>
        </div>
        <FormDivider/>
        <div>
          <Label required>Category</Label>
          <PillGroup
            options={Object.entries(CATEGORY_META).map(([v, m]) => ({ value:v, label:m.label, color:m.color }))}
            value={form.category}
            onChange={v => set("category", v)}
          />
        </div>
        <div>
          <Label required>Participation Type</Label>
          <PillGroup
            options={[
              { value:"TEAM",       label:"Team",       color:C.slate  },
              { value:"INDIVIDUAL", label:"Individual", color:"#22c55e" },
            ]}
            value={form.participationType}
            onChange={v => set("participationType", v)}
          />
        </div>
        <FormDivider/>
        <div>
          <Label required>Academic Year</Label>
          <Select value={form.academicYearId} onChange={e => set("academicYearId", e.target.value)}>
            <option value="">Select year</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? " (Active)" : ""}</option>)}
          </Select>
        </div>
        <div>
          <Label>
            Eligible Classes{" "}
            <span style={{ textTransform:"none", fontWeight:500, letterSpacing:0 }}>(leave empty = all classes)</span>
          </Label>
          <ClassPicker classSections={classSections} selected={form.classIds}
            onToggle={id => set("classIds", form.classIds.includes(id) ? form.classIds.filter(x => x !== id) : [...form.classIds, id])}/>
          {form.classIds.length > 0 && (
            <p style={{ fontSize:11, color:C.textLight, marginTop:6 }}>
              {form.classIds.length} class{form.classIds.length !== 1 ? "es" : ""} selected
            </p>
          )}
        </div>
        <div style={{ display:"flex", gap:10, paddingTop:4, borderTop:`1.5px solid ${C.borderLight}`, marginTop:4 }}>
          <PrimaryBtn onClick={save} loading={saving}>
            <CheckCircle size={13}/> {isEdit ? "Save Changes" : "Create Activity"}
          </PrimaryBtn>
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   EVENT FORM MODAL — with datetime-local support
══════════════════════════════════════════════════════════════ */
function EventFormModal({ editing, academicYears, classSections, onClose, onSaved, pushToast }) {
  const isEdit = !!editing;

  /* Normalise stored ISO string → datetime-local value (YYYY-MM-DDTHH:mm) */
  const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    name:                editing?.name                ?? "",
    description:         editing?.description        ?? "",
    eventType:           editing?.eventType          ?? "COMPETITION",
    participationMode:   editing?.participationMode  ?? "TEAM",
    status:              editing?.status             ?? "DRAFT",
    eventDate:           toLocalInput(editing?.eventDate),
    venue:               editing?.venue              ?? "",
    academicYearId:      editing?.academicYearId     ?? (academicYears.find(y => y.isActive)?.id ?? ""),
    maxTeamsPerClass:    editing?.maxTeamsPerClass    ?? "",
    maxStudentsPerClass: editing?.maxStudentsPerClass ?? "",
    classIds:            editing?.eligibleClasses?.map(ec => ec.classSection.id) ?? [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const save = async () => {
    if (!form.name.trim())    return pushToast("Event name is required", "error");
    if (!form.academicYearId) return pushToast("Academic year is required", "error");
    setSaving(true);
    try {
      const body = {
        ...form,
        /* Convert datetime-local back to ISO string for the server */
        eventDate:           form.eventDate ? new Date(form.eventDate).toISOString() : null,
        classSectionIds:     form.classIds,
        maxTeamsPerClass:    form.maxTeamsPerClass    ? parseInt(form.maxTeamsPerClass)    : null,
        maxStudentsPerClass: form.maxStudentsPerClass ? parseInt(form.maxStudentsPerClass) : null,
      };
      isEdit
        ? await apiFetch(`${API}/events/${editing.id}`, { method:"PUT", body:JSON.stringify(body) })
        : await apiFetch(`${API}/events`, { method:"POST", body:JSON.stringify(body) });
      pushToast(isEdit ? "Event updated!" : "Event created!");
      onSaved();
    } catch(e) { pushToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      title={isEdit ? "Edit Event" : "New Event"}
      subtitle={isEdit ? "Update event details" : "Create a new school event"}
      icon={Trophy}
      onClose={onClose}
      wide
    >
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <Label required>Event Name</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Annual Day, Interclass Basketball Tournament"/>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Details about this event…"/>
        </div>
        <FormDivider/>
        <div>
          <Label required>Event Type</Label>
          <PillGroup
            options={Object.entries(EVENT_TYPE_META).map(([v, m]) => ({ value:v, label:m.label, color:m.color }))}
            value={form.eventType}
            onChange={v => set("eventType", v)}
          />
        </div>
        <div>
          <Label required>Participation Mode</Label>
          <PillGroup
            options={[
              { value:"INDIVIDUAL", label:"Individual", color:"#22c55e" },
              { value:"TEAM",       label:"Team",       color:C.slate   },
              { value:"BOTH",       label:"Both",       color:"#a855f7" },
            ]}
            value={form.participationMode}
            onChange={v => set("participationMode", v)}
          />
        </div>
        <div>
          <Label required>Status</Label>
          <PillGroup
            options={Object.entries(EVENT_STATUS_META).map(([v, m]) => ({ value:v, label:m.label, color:m.color }))}
            value={form.status}
            onChange={v => set("status", v)}
          />
        </div>
        <FormDivider/>
        {/* ── Date + Time (datetime-local) + Venue on same row ── */}
        <FormRow cols={2}>
          <div>
            <Label>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                <Calendar size={11}/> Event Date &amp; Time
              </span>
            </Label>
            <Input
              type="datetime-local"
              value={form.eventDate}
              onChange={e => set("eventDate", e.target.value)}
            />
            <p style={{ margin:"5px 0 0", fontSize:10, color:C.textLight }}>
              Date and time are both saved
            </p>
          </div>
          <div>
            <Label>Venue</Label>
            <Input value={form.venue} onChange={e => set("venue", e.target.value)} placeholder="e.g. School Auditorium"/>
          </div>
        </FormRow>
        <div>
          <Label required>Academic Year</Label>
          <Select value={form.academicYearId} onChange={e => set("academicYearId", e.target.value)}>
            <option value="">Select year</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? " (Active)" : ""}</option>)}
          </Select>
        </div>
        <FormRow cols={2}>
          <div>
            <Label>Max Teams / Class</Label>
            <Input type="number" min="1" value={form.maxTeamsPerClass} onChange={e => set("maxTeamsPerClass", e.target.value)} placeholder="No limit"/>
          </div>
          <div>
            <Label>Max Students / Class</Label>
            <Input type="number" min="1" value={form.maxStudentsPerClass} onChange={e => set("maxStudentsPerClass", e.target.value)} placeholder="No limit"/>
          </div>
        </FormRow>
        <FormDivider/>
        <div>
          <Label>
            Eligible Classes{" "}
            <span style={{ textTransform:"none", fontWeight:500, letterSpacing:0 }}>(leave empty = all classes)</span>
          </Label>
          <ClassPicker classSections={classSections} selected={form.classIds}
            onToggle={id => set("classIds", form.classIds.includes(id) ? form.classIds.filter(x => x !== id) : [...form.classIds, id])}/>
          {form.classIds.length > 0 && (
            <p style={{ fontSize:11, color:C.textLight, marginTop:6 }}>
              {form.classIds.length} class{form.classIds.length !== 1 ? "es" : ""} selected
            </p>
          )}
        </div>
        <div style={{ display:"flex", gap:10, paddingTop:4, borderTop:`1.5px solid ${C.borderLight}`, marginTop:4, flexWrap:"wrap" }}>
          <PrimaryBtn onClick={save} loading={saving}>
            <CheckCircle size={13}/> {isEdit ? "Save Changes" : "Create Event"}
          </PrimaryBtn>
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   EVENT CARD — used on mobile / tablet instead of table row
══════════════════════════════════════════════════════════════ */
function EventCard({ ev, onEdit, onArchive }) {
  const et = EVENT_TYPE_META[ev.eventType]  ?? EVENT_TYPE_META.COMPETITION;
  const st = EVENT_STATUS_META[ev.status]   ?? EVENT_STATUS_META.DRAFT;
  const classes = ev.eligibleClasses?.map(ec => ec.classSection?.name).filter(Boolean) ?? [];
  const dt = formatDateTime(ev.eventDate);

  return (
    <div className="act-card" style={{ borderRadius:16, padding:16, background:C.white, border:`1.5px solid ${C.borderLight}`, boxShadow:"0 2px 8px rgba(56,73,89,0.06)" }}>
      {/* Title row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10, gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ margin:0, fontWeight:700, fontSize:14, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.name}</h3>
          {ev.venue && (
            <p style={{ margin:"3px 0 0", fontSize:11, color:C.textLight, display:"flex", alignItems:"center", gap:3 }}>
              <MapPin size={9}/>{ev.venue}
            </p>
          )}
        </div>
        <div className="row-actions" style={{ display:"flex", gap:4, flexShrink:0 }}>
          <button onClick={onEdit}
            style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.borderLight}`, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = `${C.sky}18`)}
            onMouseLeave={e => (e.currentTarget.style.background = C.bg)}>
            <Edit2 size={12} color={C.textLight}/>
          </button>
          <button onClick={onArchive}
            style={{ width:28, height:28, borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}>
            <Archive size={12} color="#ef4444"/>
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background:et.color + "18", color:et.color }}>{et.label}</span>
        <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background:`${C.mist}`, color:C.text, textTransform:"capitalize" }}>{ev.participationMode?.toLowerCase()}</span>
        <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background:st.color + "18", color:st.color }}>{st.label}</span>
      </div>

      {/* Meta row */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, paddingTop:10, borderTop:`1px solid ${C.borderLight}`, alignItems:"center" }}>
        {dt && (
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <Calendar size={10} color={C.textLight}/>
            <span style={{ fontSize:11, color:C.textLight }}>{dt.date}</span>
            {dt.hasTime && (
              <>
                <Clock size={10} color={C.textLight} style={{ marginLeft:2 }}/>
                <span style={{ fontSize:11, color:C.textLight }}>{dt.time}</span>
              </>
            )}
          </div>
        )}
        {classes.length > 0 && (
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {classes.slice(0, 2).map(c => (
              <span key={c} style={{ fontSize:11, padding:"2px 6px", borderRadius:6, background:`${C.sky}15`, color:C.sky, fontWeight:500 }}>{c}</span>
            ))}
            {classes.length > 2 && <span style={{ fontSize:11, color:C.textLight }}>+{classes.length - 2}</span>}
          </div>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:14 }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:C.text }}>{ev._count?.teams ?? 0}</p>
            <p style={{ margin:0, fontSize:10, color:C.textLight }}>Teams</p>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:C.text }}>{ev._count?.participants ?? 0}</p>
            <p style={{ margin:0, fontSize:10, color:C.textLight }}>Participants</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function ActivitiesList() {
  const [tab,           setTab]           = useState("activities");
  const [activities,    setActivities]    = useState([]);
  const [events,        setEvents]        = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterYear,    setFilterYear]    = useState("");
  const [modal,         setModal]         = useState(null);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const { toasts, push } = useToast();

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterYear ? `?academicYearId=${filterYear}` : "";
      const [a, e, y, cs] = await Promise.all([
        apiFetch(API + qs),
        apiFetch(`${API}/events` + qs),
        apiFetch(`${API}/academic-years`),
        apiFetch(`${API}/class-sections`),
      ]);
      setActivities(a.data);
      setEvents(e.data);
      setAcademicYears(y.data);
      setClassSections(cs.data);
    } catch(err) { push(err.message, "error"); }
    finally { setLoading(false); }
  }, [filterYear, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const archive = async (type, id) => {
    if (!window.confirm(`Archive this ${type}?`)) return;
    try {
      await apiFetch(`${API}${type === "event" ? "/events" : ""}/${id}`, { method:"DELETE" });
      push(`${type === "event" ? "Event" : "Activity"} archived`);
      load();
    } catch(e) { push(e.message, "error"); }
  };

  const filtActs = activities.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  const filtEvts = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label:"Activities",   value:activities.length,                                             Icon:BookOpen,     color:C.sky      },
    { label:"Events",       value:events.length,                                                 Icon:Trophy,       color:"#a855f7"  },
    { label:"Published",    value:events.filter(e => e.status === "PUBLISHED").length,           Icon:CheckCircle,  color:"#22c55e"  },
    { label:"Competitions", value:events.filter(e => e.eventType === "COMPETITION").length,      Icon:Swords,       color:"#f59e0b"  },
  ];

  const tabs = [
    { key:"activities", label:"Activities", count:activities.length },
    { key:"events",     label:"Events",     count:events.length     },
  ];

  return (
    <>
      {/* ── Responsive CSS ── */}
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .act-card { transition: all 0.2s; }
        .act-card:hover { transform:translateY(-3px) !important; box-shadow:0 8px 24px rgba(56,73,89,0.13) !important; }
        .act-card:hover .row-actions { opacity:1 !important; }
        .ev-row:hover { background: ${C.sky}08 !important; }
        .ev-row:hover .row-actions { opacity:1 !important; }
        .row-actions { opacity:0; transition:opacity 0.15s; }

        /* form-row responsive grid */
        .form-row { display:grid; gap:12; }
        .form-row-1 { grid-template-columns: 1fr; }
        .form-row-2 { grid-template-columns: repeat(2, 1fr); }
        .form-row-3 { grid-template-columns: repeat(3, 1fr); }

        /* Events desktop table — hidden below 900px */
        .ev-table { display:block; }
        .ev-cards  { display:none; }

        /* Tabs scroll on small screens */
        .tab-bar { display:inline-flex; padding:4px; borderRadius:12px; background:${C.bg}; border:1.5px solid ${C.borderLight}; flex-shrink:0; }

        /* Page header action buttons */
        .header-actions { display:flex; gap:10; align-items:center; flex-wrap:wrap; }

        /* Card toolbar */
        .card-toolbar { padding:14px 18px; border-bottom:1.5px solid ${C.borderLight}; display:flex; align-items:center; gap:12; flex-wrap:wrap; background:linear-gradient(90deg,${C.bg} 0%,${C.white} 100%); }

        /* stats grid */
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14; margin-bottom:24px; }

        /* acts grid */
        .acts-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16; }

        /* ── Tablet (≤900px): events switch to cards ── */
        @media (max-width: 900px) {
          .ev-table { display:none !important; }
          .ev-cards  { display:flex; flex-direction:column; gap:12; }
        }

        /* ── Mobile (≤640px) ── */
        @media (max-width: 640px) {
          .form-row-2 { grid-template-columns: 1fr !important; }
          .form-row-3 { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap:10px; }
          .acts-grid  { grid-template-columns: 1fr !important; }
          .header-actions { gap:6px; }
          .header-actions .hide-mobile { display:none !important; }
          .card-toolbar { padding:10px 12px; gap:8px; }
          .acts-page { padding:16px 12px !important; }
          .modal-box { border-radius:16px !important; }
          .tab-bar { overflow-x:auto; max-width:100%; }
        }

        /* ── Touch: always show row-actions ── */
        @media (hover: none) {
          .row-actions { opacity:1 !important; }
        }
      `}</style>
      <Toast toasts={toasts}/>

      <div className="acts-page" style={{ minHeight:"100vh", background:C.bg, padding:"28px 30px", fontFamily:"'Inter', sans-serif", backgroundImage:`radial-gradient(ellipse at 0% 0%, ${C.mist}40 0%, transparent 55%)` }}>

        {/* ── Page Header ── */}
        <div className="fade-up" style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                <div style={{ width:4, height:28, borderRadius:99, background:`linear-gradient(180deg, ${C.sky}, ${C.deep})`, flexShrink:0 }}/>
                <h1 style={{ margin:0, fontSize:"clamp(18px,4vw,28px)", fontWeight:900, color:C.text, letterSpacing:"-0.6px" }}>
                  Activities & Events
                </h1>
              </div>
              <p style={{ margin:0, paddingLeft:14, fontSize:12, color:C.textLight, fontWeight:500 }}>
                Manage clubs, sports, and school programs
              </p>
            </div>
            <div className="header-actions">
              <button onClick={refresh}
                style={{ width:40, height:40, borderRadius:12, border:`1.5px solid ${C.borderLight}`, background:C.white, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textLight, flexShrink:0 }}
                onMouseEnter={e => (e.currentTarget.style.background = `${C.mist}55`)}
                onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
              </button>
              <OutlineBtn onClick={() => setModal({ type:"activity", data:null })}>
                <Plus size={13}/> <span className="hide-mobile">New</span> Activity
              </OutlineBtn>
              <PrimaryBtn onClick={() => setModal({ type:"event", data:null })}>
                <Plus size={13}/> <span className="hide-mobile">New</span> Event
              </PrimaryBtn>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="fade-up stats-grid">
          {stats.map(({ label, value, Icon, color }) => (
            <div key={label} style={{ borderRadius:16, padding:"16px 18px", background:C.white, borderLeft:`4px solid ${color}`, boxShadow:"0 2px 12px rgba(56,73,89,0.07)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
                  <p style={{ margin:"6px 0 0", fontSize:26, fontWeight:900, color }}>{loading ? "—" : value}</p>
                </div>
                <Icon size={30} color={color} style={{ opacity:0.15 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main card ── */}
        <div className="fade-up" style={{ background:C.white, borderRadius:20, border:`1.5px solid ${C.borderLight}`, boxShadow:"0 2px 20px rgba(56,73,89,0.07)", overflow:"hidden" }}>

          {/* Card header: tabs + search + year filter */}
          <div className="card-toolbar">
            {/* Tab switcher */}
            <div className="tab-bar" style={{ display:"inline-flex", padding:4, borderRadius:12, background:C.bg, border:`1.5px solid ${C.borderLight}`, flexShrink:0 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:700, transition:"all 0.18s",
                    background: tab === t.key ? C.deep : "transparent",
                    color:      tab === t.key ? "#fff" : C.textLight,
                    whiteSpace:"nowrap",
                  }}>
                  {t.label}
                  <span style={{ fontSize:11, padding:"1px 6px", borderRadius:20, fontWeight:700, background: tab === t.key ? "rgba(255,255,255,0.2)" : C.mist, color: tab === t.key ? "#fff" : C.textLight }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position:"relative", flex:1, minWidth:160 }}>
              <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.textLight }}/>
              <input
                style={{ width:"100%", paddingLeft:34, paddingRight:12, paddingTop:8, paddingBottom:8, borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:13, color:C.text, outline:"none", boxSizing:"border-box" }}
                placeholder={`Search ${tab}…`}
                value={search} onChange={e => setSearch(e.target.value)}
                onFocus={ev => (ev.target.style.borderColor = C.sky)}
                onBlur={ev  => (ev.target.style.borderColor = C.border)}
              />
            </div>

            {/* Year filter */}
            <select
              style={{ padding:"8px 12px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:13, color:C.text, outline:"none", flexShrink:0, maxWidth:160, minWidth:100 }}
              value={filterYear} onChange={e => setFilterYear(e.target.value)}
              onFocus={ev => (ev.target.style.borderColor = C.sky)}
              onBlur={ev  => (ev.target.style.borderColor = C.border)}
            >
              <option value="">All Years</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? " ✓" : ""}</option>)}
            </select>
          </div>

          {/* ── Content area ── */}
          <div style={{ padding:18 }}>
            {loading ? (

              /* Skeleton */
              tab === "activities" ? (
                <div className="acts-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ borderRadius:16, border:`1.5px solid ${C.borderLight}`, padding:18, display:"flex", flexDirection:"column", gap:10 }}>
                      <Pulse h={16} w="65%"/> <Pulse h={11} w="45%"/>
                      <div style={{ display:"flex", gap:8 }}><Pulse h={22} w={70} r={20}/><Pulse h={22} w={80} r={20}/></div>
                      <div style={{ paddingTop:12, borderTop:`1px solid ${C.borderLight}`, display:"flex", gap:16 }}>
                        <Pulse h={14} w="30%"/> <Pulse h={14} w="30%"/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ borderRadius:16, border:`1.5px solid ${C.borderLight}`, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                        <Pulse h={14} w="35%"/> <Pulse h={20} w={80} r={20}/> <Pulse h={20} w={70} r={20}/>
                      </div>
                      <Pulse h={12} w="20%"/>
                    </div>
                  ))}
                </div>
              )

            ) : tab === "activities" ? (

              /* ── Activities grid ── */
              filtActs.length === 0 ? (
                <div style={{ padding:"60px 20px", textAlign:"center" }}>
                  <div style={{ width:60, height:60, borderRadius:18, background:`${C.sky}18`, border:`1px solid ${C.sky}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <BookOpen size={26} color={C.sky} strokeWidth={1.5}/>
                  </div>
                  <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.text }}>No activities found</p>
                  <p style={{ margin:"5px 0 14px", fontSize:12, color:C.textLight }}>Create your first activity to get started</p>
                  <PrimaryBtn onClick={() => setModal({ type:"activity", data:null })}>
                    <Plus size={13}/> Create First Activity
                  </PrimaryBtn>
                </div>
              ) : (
                <div className="acts-grid">
                  {filtActs.map(act => {
                    const cat = CATEGORY_META[act.category] ?? CATEGORY_META.OTHER;
                    return (
                      <div key={act.id}
                        className="act-card"
                        style={{ borderRadius:16, padding:18, background:C.white, border:`1.5px solid ${C.borderLight}`, boxShadow:"0 2px 8px rgba(56,73,89,0.06)", position:"relative" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <h3 style={{ margin:0, fontWeight:700, fontSize:14, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.name}</h3>
                            <p style={{ margin:"3px 0 0", fontSize:11, color:C.textLight }}>{act.academicYear?.name}</p>
                          </div>
                          <div className="row-actions" style={{ display:"flex", gap:4, flexShrink:0 }}>
                            <button onClick={() => setModal({ type:"activity", data:act })}
                              style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.borderLight}`, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = `${C.sky}18`)}
                              onMouseLeave={e => (e.currentTarget.style.background = C.bg)}>
                              <Edit2 size={12} color={C.textLight}/>
                            </button>
                            <button onClick={() => archive("activity", act.id)}
                              style={{ width:28, height:28, borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
                              onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}>
                              <Archive size={12} color="#ef4444"/>
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                          <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4, background:cat.color + "18", color:cat.color }}>
                            <cat.Icon size={10}/>{cat.label}
                          </span>
                          <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background: act.participationType === "TEAM" ? "#dbeafe" : "#f0fdf4", color: act.participationType === "TEAM" ? "#1d4ed8" : "#166534" }}>
                            {act.participationType === "TEAM" ? "Team" : "Individual"}
                          </span>
                          {act.activityClasses?.slice(0, 2).map(ac => (
                            <span key={ac.classSection.id} style={{ fontSize:11, padding:"3px 7px", borderRadius:6, background:`${C.sky}15`, color:C.sky, fontWeight:500 }}>
                              {ac.classSection.name}
                            </span>
                          ))}
                          {(act.activityClasses?.length ?? 0) > 2 && (
                            <span style={{ fontSize:11, padding:"3px 7px", borderRadius:6, background:`${C.sky}15`, color:C.sky, fontWeight:500 }}>
                              +{act.activityClasses.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div style={{ display:"flex", gap:16, paddingTop:12, borderTop:`1px solid ${C.borderLight}` }}>
                          <div>
                            <p style={{ margin:0, fontSize:16, fontWeight:800, color:C.text }}>{act._count?.enrollments ?? 0}</p>
                            <p style={{ margin:0, fontSize:11, color:C.textLight }}>Enrolled</p>
                          </div>
                          <div>
                            <p style={{ margin:0, fontSize:16, fontWeight:800, color:C.text }}>{act._count?.events ?? 0}</p>
                            <p style={{ margin:0, fontSize:11, color:C.textLight }}>Events</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )

            ) : (

              /* ── Events ── */
              filtEvts.length === 0 ? (
                <div style={{ padding:"60px 20px", textAlign:"center" }}>
                  <div style={{ width:60, height:60, borderRadius:18, background:`${C.sky}18`, border:`1px solid ${C.sky}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <Trophy size={26} color={C.sky} strokeWidth={1.5}/>
                  </div>
                  <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.text }}>No events found</p>
                  <p style={{ margin:"5px 0 14px", fontSize:12, color:C.textLight }}>Create your first event to get started</p>
                  <PrimaryBtn onClick={() => setModal({ type:"event", data:null })}>
                    <Plus size={13}/> Create First Event
                  </PrimaryBtn>
                </div>
              ) : (
                <>
                  {/* ── Desktop table (≥900px) ── */}
                  <div className="ev-table" style={{ borderRadius:14, overflow:"hidden", border:`1.5px solid ${C.borderLight}` }}>
                    {/* Table header */}
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1.4fr 1fr 56px 56px 60px", gap:0, padding:"10px 16px", background:`${C.bg}`, borderBottom:`1.5px solid ${C.borderLight}` }}>
                      {["Event", "Type", "Mode", "Status", "Date & Time", "Classes", "Teams", "People", ""].map(h => (
                        <p key={h} style={{ margin:0, fontSize:10, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</p>
                      ))}
                    </div>

                    {/* Rows */}
                    {filtEvts.map((ev, i) => {
                      const et      = EVENT_TYPE_META[ev.eventType]  ?? EVENT_TYPE_META.COMPETITION;
                      const st      = EVENT_STATUS_META[ev.status]   ?? EVENT_STATUS_META.DRAFT;
                      const classes = ev.eligibleClasses?.map(ec => ec.classSection?.name).filter(Boolean) ?? [];
                      const dt      = formatDateTime(ev.eventDate);
                      return (
                        <div key={ev.id}
                          className="ev-row"
                          style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1.4fr 1fr 56px 56px 60px", gap:0, padding:"12px 16px", borderBottom: i < filtEvts.length - 1 ? `1px solid ${C.bg}` : "none", alignItems:"center", transition:"background 0.15s" }}>

                          {/* Name + venue */}
                          <div>
                            <p style={{ margin:0, fontWeight:700, fontSize:13, color:C.text }}>{ev.name}</p>
                            {ev.venue && (
                              <p style={{ margin:"2px 0 0", fontSize:11, color:C.textLight, display:"flex", alignItems:"center", gap:3 }}>
                                <MapPin size={9}/>{ev.venue}
                              </p>
                            )}
                          </div>

                          {/* Type */}
                          <div>
                            <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background:et.color + "18", color:et.color }}>
                              {et.label}
                            </span>
                          </div>

                          {/* Mode */}
                          <div>
                            <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background:C.mist, color:C.text, textTransform:"capitalize" }}>
                              {ev.participationMode?.toLowerCase()}
                            </span>
                          </div>

                          {/* Status */}
                          <div>
                            <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600, background:st.color + "18", color:st.color }}>
                              {st.label}
                            </span>
                          </div>

                          {/* Date & Time */}
                          <div>
                            {dt ? (
                              <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                                <span style={{ fontSize:11, color:C.textLight, display:"flex", alignItems:"center", gap:4 }}>
                                  <Calendar size={10}/>{dt.date}
                                </span>
                                {dt.hasTime && (
                                  <span style={{ fontSize:11, color:C.sky, display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
                                    <Clock size={10}/>{dt.time}
                                  </span>
                                )}
                              </div>
                            ) : <span style={{ fontSize:11, color:C.textLight }}>—</span>}
                          </div>

                          {/* Classes */}
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {classes.length === 0
                              ? <span style={{ fontSize:11, color:C.textLight }}>All</span>
                              : <>
                                  {classes.slice(0, 2).map(c => (
                                    <span key={c} style={{ fontSize:11, padding:"2px 6px", borderRadius:6, background:`${C.sky}15`, color:C.sky, fontWeight:500 }}>{c}</span>
                                  ))}
                                  {classes.length > 2 && <span style={{ fontSize:11, color:C.textLight }}>+{classes.length - 2}</span>}
                                </>
                            }
                          </div>

                          {/* Teams */}
                          <div style={{ textAlign:"center" }}>
                            <p style={{ margin:0, fontSize:14, fontWeight:800, color:C.text }}>{ev._count?.teams ?? 0}</p>
                          </div>

                          {/* Participants */}
                          <div style={{ textAlign:"center" }}>
                            <p style={{ margin:0, fontSize:14, fontWeight:800, color:C.text }}>{ev._count?.participants ?? 0}</p>
                          </div>

                          {/* Actions */}
                          <div className="row-actions" style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
                            <button onClick={() => setModal({ type:"event", data:ev })}
                              style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.borderLight}`, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = `${C.sky}18`)}
                              onMouseLeave={e => (e.currentTarget.style.background = C.bg)}>
                              <Edit2 size={12} color={C.textLight}/>
                            </button>
                            <button onClick={() => archive("event", ev.id)}
                              style={{ width:28, height:28, borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
                              onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}>
                              <Archive size={12} color="#ef4444"/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Mobile / Tablet cards (≤900px) ── */}
                  <div className="ev-cards acts-grid">
                    {filtEvts.map(ev => (
                      <EventCard
                        key={ev.id}
                        ev={ev}
                        onEdit={() => setModal({ type:"event", data:ev })}
                        onArchive={() => archive("event", ev.id)}
                      />
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type === "activity" && (
        <ActivityFormModal
          editing={modal.data}
          academicYears={academicYears}
          classSections={classSections}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          pushToast={push}
        />
      )}
      {modal?.type === "event" && (
        <EventFormModal
          editing={modal.data}
          academicYears={academicYears}
          classSections={classSections}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          pushToast={push}
        />
      )}
    </>
  );
}