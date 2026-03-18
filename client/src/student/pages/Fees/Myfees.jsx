// student/pages/MyFees.jsx
import React, { useState, useEffect } from "react";
import {
  GraduationCap, CheckCircle, Clock, AlertCircle,
  BookOpen, Bus, FlaskConical, FileText, X,
  IndianRupee, ChevronDown, Sparkles, CreditCard,
} from "lucide-react";
import PageLayout from "../../components/PageLayout";

const API_URL = import.meta.env.VITE_API_URL;

const getStudentAuth = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return { name: auth.user?.name || "Student", email: auth.user?.email || "" };
  } catch { return { name: "Student", email: "" }; }
};

const FEE_META = {
  collegeFee:   { label: "College Fee",   icon: <GraduationCap size={14} />, color: "bg-slate-100 text-slate-600"     },
  tuitionFee:   { label: "Tuition Fee",   icon: <BookOpen size={14} />,      color: "bg-blue-100 text-blue-600"       },
  examFee:      { label: "Exam Fee",      icon: <FileText size={14} />,      color: "bg-violet-100 text-violet-600"   },
  transportFee: { label: "Transport Fee", icon: <Bus size={14} />,           color: "bg-amber-100 text-amber-600"     },
  booksFee:     { label: "Books Fee",     icon: <BookOpen size={14} />,      color: "bg-emerald-100 text-emerald-600" },
  labFee:       { label: "Lab Fee",       icon: <FlaskConical size={14} />,  color: "bg-red-100 text-red-500"         },
  miscFee:      { label: "Miscellaneous", icon: <IndianRupee size={14} />,   color: "bg-gray-100 text-gray-500"       },
};

const MODES = ["UPI", "Net Banking", "Cash", "Card", "Cheque"];

// ─────────────────────────────────────────────────────────────────────────────
// PAY MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PayModal({ record, onClose, onSuccess }) {
  const totalFees  = Number(record.fees || 0);
  const alreadyPaid = Number(record.paidAmount || 0);
  const remaining   = Math.max(0, totalFees - alreadyPaid);

  // step: "choose" | "full" | "emi" | "done"
  const [step,      setStep]      = useState("choose");
  const [mode,      setMode]      = useState("UPI");
  const [paying,    setPaying]    = useState(false);
  const [payErr,    setPayErr]    = useState("");

  // EMI
  const [emiCount,  setEmiCount]  = useState(3);
  const [emiList,   setEmiList]   = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const [emiMode,   setEmiMode]   = useState("UPI");
  const [emiPaying, setEmiPaying] = useState(false);

  // Build EMI rows whenever emiCount changes
  useEffect(() => {
    if (step !== "emi") return;
    const base = Math.floor(remaining / emiCount);
    const rem  = remaining - base * emiCount;
    setEmiList(Array.from({ length: emiCount }, (_, i) => ({
      id: i + 1,
      label: `Instalment ${i + 1}`,
      amount: i === emiCount - 1 ? base + rem : base,
      status: "pending", date: null, mode: null,
    })));
    setConfirmId(null);
  }, [emiCount, step]);

  const emiPaid    = emiList.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const emiPending = emiList.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const allEmiDone = emiList.length > 0 && emiPending === 0;

  // ── Full pay ─────────────────────────────────────────────────────────────
  const handleFullPay = async () => {
    setPaying(true); setPayErr("");
    try {
      const res = await fetch(`${API_URL}/api/finance/updateStudentFinance/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paidAmount:    totalFees,
          paymentStatus: "PAID",
          paymentMode:   mode,
          paymentDate:   new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onSuccess(updated);
      setStep("done");
    } catch (e) { setPayErr(e.message || "Payment failed."); }
    finally { setPaying(false); }
  };

  // ── EMI instalment pay ────────────────────────────────────────────────────
  const handleConfirmEmi = async (emi) => {
    setEmiPaying(true); setPayErr("");
    const today   = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const updated = emiList.map(e => e.id === emi.id ? { ...e, status: "paid", date: today, mode: emiMode } : e);
    const nowPaid = alreadyPaid + updated.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
    const allDone = updated.every(e => e.status === "paid");
    try {
      const res = await fetch(`${API_URL}/api/finance/updateStudentFinance/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paidAmount:    nowPaid,
          paymentStatus: allDone ? "PAID" : "PARTIAL",
          paymentMode:   emiMode,
          paymentDate:   new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const serverRecord = await res.json();
      setEmiList(updated);
      setConfirmId(null);
      onSuccess(serverRecord);
    } catch (e) { setPayErr(e.message || "Payment failed."); }
    finally { setEmiPaying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e2d3d] to-[#3a6080] flex items-center justify-center">
              <CreditCard size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Fee Payment</p>
              <p className="text-xs text-slate-400">{record.name} · {record.course}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Summary mini-cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { lbl: "Total",     val: `₹${Number(record.fees || 0).toLocaleString("en-IN")}`, cls: "text-slate-800" },
              { lbl: "Paid",      val: alreadyPaid > 0 ? `₹${alreadyPaid.toLocaleString("en-IN")}` : "—",            cls: "text-emerald-700" },
              { lbl: "Due",       val: `₹${remaining.toLocaleString("en-IN")}`,                cls: remaining > 0 ? "text-red-600" : "text-emerald-700" },
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.lbl}</p>
                <p className={`text-sm font-bold ${s.cls}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* ── DONE state ── */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <p className="text-base font-bold text-slate-800">Payment Successful!</p>
              <p className="text-sm text-slate-500">Your fee record has been updated.<br />The finance office can see this payment.</p>
              <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#1e2d3d] to-[#3a6080] text-white text-sm font-bold rounded-xl">
                Close
              </button>
            </div>
          )}

          {/* ── Already fully paid ── */}
          {step !== "done" && remaining === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle size={32} className="text-emerald-500" />
              <p className="text-sm font-bold text-emerald-800">All fees have been paid!</p>
            </div>
          )}

          {/* ── CHOOSE step ── */}
          {step === "choose" && remaining > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 text-center mb-4">
                How would you like to pay <span className="text-slate-800">₹{remaining.toLocaleString("en-IN")}</span>?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep("full")}
                  className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center hover:border-[#3a6080] hover:shadow-md transition-all"
                >
                  <div className="text-2xl mb-2">💳</div>
                  <p className="text-xs font-bold text-slate-700">Pay Full Amount</p>
                  <p className="text-[10px] text-slate-400 mt-1">₹{remaining.toLocaleString("en-IN")} at once</p>
                </button>
                <button
                  onClick={() => setStep("emi")}
                  className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center hover:border-[#3a6080] hover:shadow-md transition-all"
                >
                  <div className="text-2xl mb-2">📅</div>
                  <p className="text-xs font-bold text-slate-700">Pay in Instalments</p>
                  <p className="text-[10px] text-slate-400 mt-1">Split into EMIs</p>
                </button>
              </div>
            </div>
          )}

          {/* ── FULL PAY step ── */}
          {step === "full" && remaining > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
              <button onClick={() => setStep("choose")} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">
                ← Back
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Amount to pay</p>
                  <p className="text-2xl font-bold text-slate-800">₹{remaining.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Payment Mode</p>
                  <select
                    value={mode} onChange={e => setMode(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-semibold outline-none"
                  >
                    {MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              {payErr && <p className="text-xs text-red-500">{payErr}</p>}
              <button
                onClick={handleFullPay}
                disabled={paying}
                className="w-full py-3 bg-gradient-to-r from-[#1e2d3d] to-[#3a6080] text-white text-sm font-bold rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity"
              >
                {paying ? "Processing…" : `Confirm Payment — ₹${remaining.toLocaleString("en-IN")}`}
              </button>
            </div>
          )}

          {/* ── EMI step ── */}
          {step === "emi" && remaining > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <button onClick={() => setStep("choose")} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Instalments:</span>
                  {[2, 3, 4, 6].map(n => (
                    <button
                      key={n} onClick={() => setEmiCount(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${emiCount === n ? "bg-gradient-to-br from-[#1e2d3d] to-[#3a6080] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* EMI table */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="grid grid-cols-[1fr_auto_auto_auto] bg-gradient-to-r from-[#1e2d3d] to-[#3a6080] px-3 py-2.5">
                  {["Instalment", "Amount", "Status", "Action"].map(h => (
                    <p key={h} className="text-[10px] font-bold text-white/75 uppercase tracking-wide">{h}</p>
                  ))}
                </div>
                {emiList.map((emi, i) => (
                  <div key={emi.id} className={`grid grid-cols-[1fr_auto_auto_auto] items-center px-3 py-3 gap-2 border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <p className="text-xs font-semibold text-slate-700">{emi.label}</p>
                    <p className="text-xs font-bold text-slate-800">₹{emi.amount.toLocaleString("en-IN")}</p>
                    <div>
                      {emi.status === "paid"
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"><CheckCircle size={9}/> Paid</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full"><Clock size={9}/> Pending</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {emi.status === "paid" && <span className="text-slate-300 text-xs">—</span>}
                      {emi.status === "pending" && confirmId !== emi.id && (
                        <button
                          onClick={() => setConfirmId(emi.id)}
                          className="text-[11px] font-bold bg-gradient-to-r from-[#1e2d3d] to-[#3a6080] text-white px-3 py-1 rounded-lg"
                        >
                          Pay
                        </button>
                      )}
                      {emi.status === "pending" && confirmId === emi.id && (
                        <div className="flex items-center gap-1">
                          <select
                            value={emiMode} onChange={e => setEmiMode(e.target.value)}
                            className="text-[11px] border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-700 outline-none"
                          >
                            {MODES.map(m => <option key={m}>{m}</option>)}
                          </select>
                          <button
                            onClick={() => handleConfirmEmi(emi)} disabled={emiPaying}
                            className="w-7 h-7 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center disabled:opacity-50"
                          >✓</button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Footer row */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center px-3 py-2.5 bg-slate-100 border-t-2 border-slate-200 gap-2">
                  <p className="text-xs font-bold text-slate-700">Total</p>
                  <p className="text-xs font-bold text-slate-800">₹{remaining.toLocaleString("en-IN")}</p>
                  <p className={`text-[10px] font-bold ${emiPending > 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {emiPending > 0 ? `₹${emiPending.toLocaleString("en-IN")} left` : "✓ Done"}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-700">
                    {emiPaid > 0 ? `₹${emiPaid.toLocaleString("en-IN")} paid` : ""}
                  </p>
                </div>
              </div>

              {payErr && <p className="text-xs text-red-500">{payErr}</p>}

              {allEmiDone && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">All instalments paid! Finance page is updated.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function MyFees() {
  const [auth]      = useState(getStudentAuth);
  const [record,    setRecord]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [breakdown, setBreakdown] = useState(null);
  const [showBreak, setShowBreak] = useState(false);
  const [showPay,   setShowPay]   = useState(false);

  useEffect(() => {
    if (!auth.email) { setError("No student email found in session."); setLoading(false); return; }
    fetch(`${API_URL}/api/finance/myFees?email=${encodeURIComponent(auth.email)}`, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? "No fee record found for your account." : "Failed to load fees.");
        return r.json();
      })
      .then(data => {
        setRecord(data);
        try { if (data.feeBreakdown) setBreakdown(JSON.parse(data.feeBreakdown)); } catch {}
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [auth.email]);

  // Called by PayModal on every successful payment — updates record in-place
  const handlePaymentSuccess = (updatedRecord) => {
    setRecord(updatedRecord);
    try { if (updatedRecord.feeBreakdown) setBreakdown(JSON.parse(updatedRecord.feeBreakdown)); } catch {}
  };

  const totalFees  = Number(record?.fees || 0);
  const paidAmount = Number(record?.paidAmount || 0);
  const remaining  = Math.max(0, totalFees - paidAmount);
  const pct        = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 0;
  const status     = record?.paymentStatus || (remaining === 0 && totalFees > 0 ? "PAID" : "UNPAID");
  const isPaid     = status === "PAID";
  const isPartial  = status === "PARTIAL";

  // ── Patch breakdown: derive collegeFee for old records that didn't store it ──
  const patchedBreakdown = (() => {
    if (!breakdown) return null;
    const b = { ...breakdown };
    if (!Number(b.collegeFee) && totalFees > 0) {
      const otherSum = ["tuitionFee","examFee","transportFee","booksFee","labFee","miscFee"]
        .reduce((s, k) => s + Number(b[k] || 0), 0);
      const customSum = (b.customFees || []).reduce((s, c) => s + Number(c.amount || 0), 0);
      const derived = Math.max(0, totalFees - otherSum - customSum);
      if (derived > 0) b.collegeFee = derived;
    }
    return b;
  })();

  const FEE_ORDER = ["collegeFee","tuitionFee","examFee","transportFee","booksFee","labFee","miscFee"];

  const breakdownRows = patchedBreakdown
    ? Object.entries(patchedBreakdown)
        .filter(([k, v]) => k !== "customFees" && Number(v) > 0)
        .map(([k, v]) => ({
          key: k,
          ...(FEE_META[k] || { label: k, icon: <IndianRupee size={14} />, color: "bg-gray-100 text-gray-500" }),
          amount: Number(v),
        }))
        .sort((a, b) => {
          const ai = FEE_ORDER.indexOf(a.key);
          const bi = FEE_ORDER.indexOf(b.key);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })
    : [];
  const customRows = patchedBreakdown?.customFees?.filter(c => Number(c.amount) > 0) || [];

  return (
    <PageLayout>
    <div className="min-h-screen bg-slate-100 pb-16">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e2d3d] via-[#2d4a63] to-[#3a6080] px-6 pt-9 pb-20">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="absolute -bottom-10 left-[40%] w-52 h-52 rounded-full bg-[#88bdf2]/[0.06] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">SchoolHub</p>
            <p className="text-[10px] text-white/50">Student Portal</p>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold text-white/55 tracking-wide mb-1">Welcome back</p>
          <p className="text-2xl font-bold text-white tracking-tight">{auth.name}</p>
          <p className="text-xs text-white/50 mt-1.5">Here's your fee summary for this academic year</p>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-9 h-9 rounded-full border-[3px] border-slate-200 border-t-slate-500 animate-spin" />
          <span className="text-sm text-slate-400">Loading your fee details…</span>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-6 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-sm text-slate-500 max-w-xs">{error}</p>
        </div>
      )}

      {/* ── Main content ── */}
      {!loading && !error && record && (
        <>
          {/* Floating summary card */}
          <div className="px-5 -mt-14 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">

              {/* Total + status */}
              <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Fee Amount</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl text-slate-400 font-semibold">₹</span>
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">{totalFees.toLocaleString("en-IN")}</span>
                  </div>
                  {/* Pay Now button — only when fees are due */}
                  {!isPaid && (
                    <button
                      onClick={() => setShowPay(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e2d3d] to-[#3a6080] text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:opacity-90 transition-opacity"
                    >
                      <CreditCard size={13} />
                      Pay Now
                    </button>
                  )}
                </div>
                <div className="mt-2.5">
                  {isPaid    && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700"><CheckCircle size={11}/> Fully Paid</span>}
                  {isPartial && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700"><Clock size={11}/> Partially Paid</span>}
                  {!isPaid && !isPartial && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700"><AlertCircle size={11}/> Payment Pending</span>}
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-5 py-4">
                <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>Payment Progress</span>
                  <span className="font-bold text-slate-700">{pct}% paid</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isPaid ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-[#3a6080] to-[#88bdf2]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Three stats */}
              <div className="grid grid-cols-3 border-t border-slate-100">
                {[
                  { lbl: "Total",     val: `₹${totalFees.toLocaleString("en-IN")}`,                          cls: "text-slate-800" },
                  { lbl: "Paid",      val: paidAmount > 0 ? `₹${paidAmount.toLocaleString("en-IN")}` : "—",  cls: paidAmount > 0 ? "text-emerald-700" : "text-slate-400" },
                  { lbl: "Remaining", val: `₹${remaining.toLocaleString("en-IN")}`,                          cls: remaining > 0 ? "text-red-600" : "text-emerald-700" },
                ].map((s, i) => (
                  <div key={i} className={`py-3.5 text-center ${i < 2 ? "border-r border-slate-100" : ""}`}>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.lbl}</p>
                    <p className={`text-sm font-bold ${s.cls}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 mt-6 space-y-4">

            {/* Status banner */}
            {isPaid ? (
              <div className="flex items-center gap-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">All fees cleared!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {record.paymentMode ? `Paid via ${record.paymentMode}` : "Your account is fully settled"}
                    {record.paymentDate ? ` on ${new Date(record.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800">₹{remaining.toLocaleString("en-IN")} remaining</p>
                  <p className="text-xs text-red-500 mt-0.5">Tap "Pay Now" above or contact the accounts office</p>
                </div>
                <button
                  onClick={() => setShowPay(true)}
                  className="flex-shrink-0 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Pay Now
                </button>
              </div>
            )}

            {/* Fee Breakdown */}
            {(breakdownRows.length > 0 || customRows.length > 0) && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  Fee Breakdown <span className="flex-1 h-px bg-slate-200" />
                </p>
                <div className="bg-white rounded-2xl shadow-sm shadow-slate-900/5 overflow-hidden">
                  <button
                    onClick={() => setShowBreak(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e2d3d] to-[#3a6080] flex items-center justify-center flex-shrink-0">
                        <IndianRupee size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">View Breakdown</p>
                        <p className="text-xs text-slate-400">{breakdownRows.length + customRows.length} fee component{breakdownRows.length + customRows.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <ChevronDown size={17} className={`text-slate-400 transition-transform duration-200 ${showBreak ? "rotate-180" : ""}`} />
                  </button>

                  {showBreak && (
                    <div className="border-t border-slate-100">
                      {breakdownRows.map(row => (
                        <div key={row.key} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${row.color}`}>{row.icon}</div>
                          <span className="flex-1 text-sm font-semibold text-slate-700">{row.label}</span>
                          <span className="text-sm font-bold text-slate-800">₹{row.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      {customRows.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={14} />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-slate-700">
                            {c.label || "Custom Fee"}
                            <span className="ml-2 text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide">custom</span>
                          </span>
                          <span className="text-sm font-bold text-slate-800">₹{Number(c.amount).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border-t-2 border-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                          <IndianRupee size={14} />
                        </div>
                        <span className="flex-1 text-sm font-extrabold text-slate-800">Grand Total</span>
                        <span className="text-base font-extrabold text-slate-800">₹{totalFees.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student Details */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                Student Details <span className="flex-1 h-px bg-slate-200" />
              </p>
              <div className="bg-white rounded-2xl shadow-sm shadow-slate-900/5 overflow-hidden">
                {[
                  { key: "Name",    val: record.name   || "—" },
                  { key: "Email",   val: record.email  || "—" },
                  { key: "Course",  val: record.course || "—" },
                  { key: "Phone",   val: record.phone  || "—" },
                  ...(record.paymentMode ? [{ key: "Payment Mode", val: record.paymentMode }] : []),
                  ...(record.paymentDate ? [{ key: "Last Payment",  val: new Date(record.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }] : []),
                ].map((item, i, arr) => (
                  <div key={item.key} className={`flex justify-between items-center px-4 py-3 ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}>
                    <span className="text-sm text-slate-500 font-medium">{item.key}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ── Pay Modal ── */}
      {showPay && record && (
        <PayModal
          record={record}
          onClose={() => setShowPay(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
    </PageLayout>
  );
}