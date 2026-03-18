import { useState, useEffect, useRef } from "react";
import {
  Trophy, AlertCircle, Loader2, CheckCircle2,
  Users, ClipboardCheck, Search, BookOpen,
  Star, Shield, Crown, Palette, Dumbbell,
} from "lucide-react";
import { getToken } from "../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;

const C = {
  slate:       "#6A89A7",
  mist:        "#BDDDFC",
  sky:         "#88BDF2",
  deep:        "#384959",
  bg:          "#EDF3FA",
  white:       "#FFFFFF",
  border:      "#C8DCF0",
  borderLight: "#DDE9F5",
  text:        "#243340",
  textLight:   "#6A89A7",
};

const CATEGORY = {
  ACADEMIC:   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", Icon: BookOpen     },
  ATTENDANCE: { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E", Icon: CheckCircle2 },
  SPORTS:     { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316", Icon: Dumbbell     },
  CULTURAL:   { bg: "#FDF4FF", text: "#7E22CE", dot: "#A855F7", Icon: Palette      },
  DISCIPLINE: { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E", Icon: Shield       },
  LEADERSHIP: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", Icon: Crown        },
  SPECIAL:    { bg: "#F0F9FF", text: "#0369A1", dot: "#0EA5E9", Icon: Star         },
};

// ── ResizeObserver hook — measures the ACTUAL content container width ──────────
function useContainerWidth(ref) {
  const [width, setWidth] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return width;
}

function Pulse({ w = "100%", h = 13, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: `${C.mist}55` }} />;
}

function IconBox({ Icon }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: `linear-gradient(135deg, ${C.sky}, ${C.deep})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 10px ${C.sky}44`,
    }}>
      <Icon size={17} color="#fff" strokeWidth={2} />
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: C.white, borderRadius: 18,
      border: `1.5px solid ${C.borderLight}`,
      boxShadow: "0 2px 16px rgba(56,73,89,0.06)",
      overflow: "hidden",
      minWidth: 0,   // critical — prevents grid blowout
    }}>
      {children}
    </div>
  );
}

function CardHeader({ Icon, title, sub }) {
  return (
    <div style={{
      padding: "14px 16px",
      background: `linear-gradient(90deg, ${C.bg}, ${C.white})`,
      borderBottom: `1.5px solid ${C.borderLight}`,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <IconBox Icon={Icon} />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Inter',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        <p style={{ margin: 0, fontSize: 11, color: C.textLight, fontFamily: "'Inter',sans-serif" }}>{sub}</p>
      </div>
    </div>
  );
}

const CategoryBadge = ({ category }) => {
  const c = CATEGORY[category] ?? CATEGORY.SPECIAL;
  return (
    <span style={{
      background: c.bg, color: c.text,
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      fontFamily: "'Inter',sans-serif", flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
      {category}
    </span>
  );
};

const CategoryIconBox = ({ category }) => {
  const c = CATEGORY[category] ?? CATEGORY.SPECIAL;
  const { Icon } = c;
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: c.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={13} color={c.text} strokeWidth={2} />
    </div>
  );
};

const Avatar = ({ name, image, size = 32 }) => {
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return image ? (
    <img src={image} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.sky}, ${C.deep})`,
      color: C.white, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, fontFamily: "'Inter',sans-serif",
    }}>
      {initials}
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function AwardsPage() {
  const containerRef = useRef(null);
  const containerWidth = useContainerWidth(containerRef);
  // 2-col only when container itself is wide enough (≥ 560px)
  const twoCol = containerWidth >= 560;

  const [tab, setTab]                         = useState("assign");
  const [classData, setClassData]             = useState(null);
  const [awardTypes, setAwardTypes]           = useState([]);
  const [history, setHistory]                 = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAward, setSelectedAward]     = useState(null);
  const [remarks, setRemarks]                 = useState("");
  const [search, setSearch]                   = useState("");
  const [loading, setLoading]                 = useState(true);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState("");
  const [toast, setToast]                     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        const [classRes, awardsRes] = await Promise.all([
          fetch(`${API_URL}/api/staff/awards/my-class`, { headers }),
          fetch(`${API_URL}/api/staff/awards/types`, { headers }),
        ]);
        const classJson  = await classRes.json();
        const awardsJson = await awardsRes.json();
        if (!classRes.ok)  throw new Error(classJson.message  ?? "Failed to load class");
        if (!awardsRes.ok) throw new Error(awardsJson.message ?? "Failed to load awards");
        setClassData(classJson.data ?? null);
        setAwardTypes(awardsJson.data ?? []);
      } catch (err) {
        setError(err.message ?? "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/staff/awards/given-by-me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed");
      setHistory(json.data ?? []);
    } catch {
      showToast("error", "Could not load history");
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAssign = async () => {
    if (!selectedStudent || !selectedAward) {
      showToast("error", "Please select both a student and an award");
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/api/staff/awards/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          awardId:   selectedAward.id,
          remarks:   remarks.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to assign award");
      showToast("success", json.message ?? "Award assigned successfully!");
      setSelectedStudent(null); setSelectedAward(null); setRemarks(""); setSearch("");
    } catch (err) {
      showToast("error", err.message ?? "Failed to assign award");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = (classData?.students ?? []).filter(s =>
    `${s.name} ${s.rollNumber ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const canSubmit = !submitting && !!selectedStudent && !!selectedAward;

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        .aw-fade { animation: fadeUp 0.4s ease forwards; }
        .aw-row:hover { background: ${C.bg} !important; }
      `}</style>

      {/* ── outer wrapper — gives ResizeObserver something to measure ── */}
      <div ref={containerRef} style={{
        width: "100%", minHeight: "100vh",
        background: C.bg, fontFamily: "'Inter',sans-serif",
        backgroundImage: `radial-gradient(circle at 15% 0%, ${C.mist}28 0%, transparent 50%)`,
        boxSizing: "border-box",
        padding: twoCol ? "24px 28px" : "16px 14px",
      }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 16, right: 16, zIndex: 9999,
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 12,
            background: toast.type === "success" ? "#F0FDF4" : "#FFF1F2",
            color:      toast.type === "success" ? "#15803D" : "#BE123C",
            border:    `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECDD3"}`,
            boxShadow: "0 4px 20px rgba(56,73,89,0.14)",
            fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif",
            animation: "slideIn 0.2s ease", maxWidth: "calc(100vw - 32px)",
          }}>
            {toast.type === "success" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 20 }} className="aw-fade">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, borderRadius: 99, flexShrink: 0, background: `linear-gradient(180deg,${C.sky},${C.deep})` }} />
            <h1 style={{ margin: 0, fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", fontFamily: "'Inter',sans-serif" }}>
              Student Awards
            </h1>
          </div>
          <p style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: C.textLight, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>
            {classData
              ? `${classData.classSection?.name ?? ""} · ${classData.academicYear?.name ?? ""} · ${classData.students?.length ?? 0} students`
              : "Recognise and celebrate student achievements"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, background: "#fee8e8", border: "1px solid #f5b0b0", marginBottom: 16, fontSize: 13, color: "#8b1c1c", fontFamily: "'Inter',sans-serif" }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /><span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8 }}><Pulse w={130} h={36} r={10}/><Pulse w={110} h={36} r={10}/></div>
            <div style={{ display: "grid", gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr", gap: 16 }}>
              {[1,2].map(i => (
                <div key={i} style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.borderLight}`, padding: 20 }}>
                  <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                    <Pulse w={40} h={40} r={12}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}><Pulse w="55%" h={13}/><Pulse w="35%" h={10}/></div>
                  </div>
                  {[1,2,3,4].map(j=>(
                    <div key={j} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                      <Pulse w={30} h={30} r={99}/>
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}><Pulse w="60%" h={11}/><Pulse w="35%" h={9}/></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

        ) : !classData ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"50px 0", gap:12 }}>
            <div style={{ width:60, height:60, borderRadius:18, background:`${C.sky}18`, border:`1px solid ${C.sky}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Trophy size={26} color={C.sky} strokeWidth={1.5}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0, fontFamily:"'Inter',sans-serif" }}>No class assigned</p>
            <p style={{ fontSize:12, color:C.textLight, margin:0, textAlign:"center", fontFamily:"'Inter',sans-serif" }}>You are not assigned as a class teacher for the current academic year</p>
          </div>

        ) : (
          <>
            {/* Tabs */}
            <div style={{ display:"inline-flex", gap:4, background:C.white, padding:4, borderRadius:12, marginBottom:20, boxShadow:"0 1px 4px rgba(56,73,89,0.08)" }}>
              {[{key:"assign",label:"Assign Award"},{key:"history",label:"Given by Me"}].map(t=>(
                <button key={t.key} onClick={()=>setTab(t.key)} style={{
                  padding:"7px 16px", borderRadius:9, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:600, fontFamily:"'Inter',sans-serif", transition:"all 0.15s", whiteSpace:"nowrap",
                  background: tab===t.key ? `linear-gradient(135deg,${C.slate},${C.deep})` : "transparent",
                  color: tab===t.key ? C.white : C.textLight,
                  boxShadow: tab===t.key ? "0 2px 8px rgba(56,73,89,0.25)" : "none",
                }}>{t.label}</button>
              ))}
            </div>

            {/* ── ASSIGN TAB ── */}
            {tab === "assign" && (
              <div className="aw-fade" style={{
                display: "grid",
                gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr",
                gap: 16,
                alignItems: "start",
                width: "100%",
              }}>

                {/* Student picker */}
                <Card>
                  <CardHeader Icon={Users} title="1. Select Student" sub={`${classData?.students?.length ?? 0} students in class`}/>

                  <div style={{ padding:"12px 14px", borderBottom:`1.5px solid ${C.borderLight}` }}>
                    <div style={{ position:"relative" }}>
                      <Search size={13} color={C.textLight} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                      <input
                        type="text" placeholder="Search by name or roll no..."
                        value={search} onChange={e=>setSearch(e.target.value)}
                        style={{
                          width:"100%", padding:"8px 10px 8px 30px",
                          border:`1.5px solid ${C.border}`, borderRadius:9,
                          fontSize:13, color:C.text, outline:"none",
                          fontFamily:"'Inter',sans-serif", background:C.bg, boxSizing:"border-box",
                        }}
                        onFocus={e=>e.target.style.borderColor=C.sky}
                        onBlur={e=>e.target.style.borderColor=C.border}
                      />
                    </div>
                  </div>

                  <div style={{ overflowY:"auto", maxHeight: twoCol ? 340 : 240 }}>
                    {filteredStudents.length===0 ? (
                      <div style={{ padding:"32px 20px", textAlign:"center", fontSize:13, color:C.textLight, fontFamily:"'Inter',sans-serif" }}>No students found</div>
                    ) : filteredStudents.map(s=>{
                      const sel = selectedStudent?.id===s.id;
                      return (
                        <button key={s.id} onClick={()=>setSelectedStudent(s)} style={{
                          width:"100%", display:"flex", alignItems:"center", gap:10,
                          padding:"9px 14px", border:"none", cursor:"pointer", textAlign:"left",
                          background: sel ? C.bg : C.white,
                          borderBottom:`1px solid ${C.borderLight}`,
                          borderLeft:`3px solid ${sel ? C.sky : "transparent"}`,
                          transition:"background 0.1s", fontFamily:"'Inter',sans-serif",
                        }}
                          onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background=C.bg; }}
                          onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background=C.white; }}
                        >
                          <Avatar name={s.name} image={s.profileImage}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:600, color:sel?C.slate:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</p>
                            {s.rollNumber && <p style={{ fontSize:10, color:C.textLight, margin:"1px 0 0" }}>Roll #{s.rollNumber}</p>}
                          </div>
                          {sel && <CheckCircle2 size={15} color={C.sky} style={{ flexShrink:0 }}/>}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Right column */}
                <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0 }}>

                  {/* Award picker */}
                  <Card>
                    <CardHeader Icon={Trophy} title="2. Select Award" sub={`${awardTypes.length} award types available`}/>
                    <div style={{ overflowY:"auto", maxHeight:240 }}>
                      {awardTypes.length===0 ? (
                        <div style={{ padding:"24px 20px", textAlign:"center", fontSize:13, color:C.textLight, fontFamily:"'Inter',sans-serif" }}>No award types configured yet</div>
                      ) : awardTypes.map(a=>{
                        const sel = selectedAward?.id===a.id;
                        return (
                          <button key={a.id} onClick={()=>setSelectedAward(a)} style={{
                            width:"100%", display:"flex", alignItems:"center", gap:10,
                            padding:"9px 14px", border:"none", cursor:"pointer", textAlign:"left",
                            background: sel ? C.bg : C.white,
                            borderBottom:`1px solid ${C.borderLight}`,
                            borderLeft:`3px solid ${sel ? C.sky : "transparent"}`,
                            transition:"background 0.1s", fontFamily:"'Inter',sans-serif",
                          }}
                            onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background=C.bg; }}
                            onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background=C.white; }}
                          >
                            <CategoryIconBox category={a.category}/>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:600, color:sel?C.slate:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</p>
                              {a.description && <p style={{ fontSize:11, color:C.textLight, margin:"1px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.description}</p>}
                            </div>
                            <CategoryBadge category={a.category}/>
                            {sel && <CheckCircle2 size={14} color={C.sky} style={{ marginLeft:4, flexShrink:0 }}/>}
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Confirm */}
                  <Card>
                    <CardHeader Icon={ClipboardCheck} title="3. Confirm & Submit" sub="Review and assign the award"/>
                    <div style={{ padding:"14px" }}>
                      <div style={{ background:C.bg, borderRadius:12, padding:"10px 12px", marginBottom:12, border:`1.5px solid ${C.borderLight}` }}>
                        {[["Student",selectedStudent?.name],["Award",selectedAward?.name]].map(([lbl,val])=>(
                          <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                            <span style={{ fontSize:12, color:C.textLight, fontFamily:"'Inter',sans-serif" }}>{lbl}</span>
                            <span style={{ fontSize:13, fontWeight:600, color:val?C.text:C.mist, fontFamily:"'Inter',sans-serif", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"60%" }}>{val ?? "—"}</span>
                          </div>
                        ))}
                        {selectedAward && (
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:7 }}>
                            <span style={{ fontSize:12, color:C.textLight, fontFamily:"'Inter',sans-serif" }}>Category</span>
                            <CategoryBadge category={selectedAward.category}/>
                          </div>
                        )}
                      </div>

                      <textarea rows={2} placeholder="Remarks (optional)" value={remarks} onChange={e=>setRemarks(e.target.value)}
                        style={{
                          width:"100%", padding:"8px 12px",
                          border:`1.5px solid ${C.border}`, borderRadius:9,
                          fontSize:13, color:C.text, fontFamily:"'Inter',sans-serif",
                          resize:"none", outline:"none", boxSizing:"border-box",
                          marginBottom:12, background:C.bg,
                        }}
                        onFocus={e=>e.target.style.borderColor=C.sky}
                        onBlur={e=>e.target.style.borderColor=C.border}
                      />

                      <button onClick={handleAssign} disabled={!canSubmit} style={{
                        width:"100%", padding:"11px", borderRadius:10, border:"none",
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        fontSize:13, fontWeight:700, fontFamily:"'Inter',sans-serif",
                        background: canSubmit ? `linear-gradient(135deg,${C.slate},${C.deep})` : C.border,
                        color: canSubmit ? C.white : C.textLight,
                        boxShadow: canSubmit ? "0 4px 14px rgba(56,73,89,0.28)" : "none",
                        transition:"all 0.15s",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}
                        onMouseEnter={e=>{ if(canSubmit) e.currentTarget.style.transform="translateY(-1px)"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; }}
                      >
                        {submitting
                          ? <><Loader2 size={14} className="animate-spin"/> Assigning…</>
                          : <><Trophy size={14}/> Assign Award</>}
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === "history" && (
              <div className="aw-fade" style={{ background:C.white, borderRadius:18, border:`1.5px solid ${C.borderLight}`, boxShadow:"0 2px 16px rgba(56,73,89,0.06)", overflow:"hidden" }}>
                {history.length===0 ? (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"50px 20px", gap:12 }}>
                    <div style={{ width:60, height:60, borderRadius:18, background:`${C.sky}18`, border:`1px solid ${C.sky}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Trophy size={26} color={C.sky} strokeWidth={1.5}/>
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0, fontFamily:"'Inter',sans-serif" }}>No awards assigned yet</p>
                    <p style={{ fontSize:12, color:C.textLight, margin:0, fontFamily:"'Inter',sans-serif" }}>Awards you assign will appear here</p>
                  </div>
                ) : twoCol ? (
                  /* desktop table */
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:C.bg }}>
                        {["Student","Award","Category","Date","Remarks"].map(h=>(
                          <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:0.8, textTransform:"uppercase", borderBottom:`1.5px solid ${C.borderLight}`, fontFamily:"'Inter',sans-serif" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h=>(
                        <tr key={h.id} className="aw-row" style={{ borderBottom:`1px solid ${C.borderLight}`, transition:"background 0.1s" }}>
                          <td style={{ padding:"11px 14px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                              <Avatar name={h.student?.name??""} image={h.student?.personalInfo?.profileImage} size={28}/>
                              <span style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Inter',sans-serif" }}>{h.student?.name??"—"}</span>
                            </div>
                          </td>
                          <td style={{ padding:"11px 14px", fontSize:13, fontWeight:500, color:C.text, fontFamily:"'Inter',sans-serif" }}>{h.award?.name??"—"}</td>
                          <td style={{ padding:"11px 14px" }}>{h.award?.category && <CategoryBadge category={h.award.category}/>}</td>
                          <td style={{ padding:"11px 14px", fontSize:12, color:C.textLight, fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap" }}>
                            {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                          </td>
                          <td style={{ padding:"11px 14px", fontSize:12, color:C.textLight, fontStyle:h.remarks?"normal":"italic", fontFamily:"'Inter',sans-serif" }}>{h.remarks??"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* mobile cards */
                  <div style={{ display:"flex", flexDirection:"column", gap:10, padding:12 }}>
                    {history.map(h=>(
                      <div key={h.id} style={{ borderRadius:13, border:`1.5px solid ${C.borderLight}`, padding:"12px 14px", background:C.bg }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                          <Avatar name={h.student?.name??""} image={h.student?.personalInfo?.profileImage} size={34}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, fontFamily:"'Inter',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.student?.name??"—"}</p>
                            <p style={{ margin:0, fontSize:11, color:C.textLight, fontFamily:"'Inter',sans-serif" }}>
                              {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                            </p>
                          </div>
                          {h.award?.category && <CategoryBadge category={h.award.category}/>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {h.award?.category && <CategoryIconBox category={h.award.category}/>}
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Inter',sans-serif" }}>{h.award?.name??"—"}</p>
                        </div>
                        {h.remarks && <p style={{ margin:"8px 0 0", fontSize:11, color:C.textLight, fontStyle:"italic", fontFamily:"'Inter',sans-serif" }}>"{h.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}