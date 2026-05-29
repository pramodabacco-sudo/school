// src/superAdmin/pages/Subscription/PlansTimeline.jsx
import { useEffect, useState } from "react";
import {
  Crown, Shield, Zap, CalendarDays, Clock3,
  CheckCircle2, XCircle, Users, CreditCard, Sparkles,
  RefreshCw, Hourglass, Lock, Eye, EyeOff,
} from "lucide-react";
import { getToken } from "../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;

const PLAN_META = {
  silver: {
    icon: Shield, color: "#6A89A7", bg: "#EEF4FA",
    border: "#D7E6F5", text: "#425466", label: "Silver",
  },
  gold: {
    icon: Zap, color: "#88BDF2", bg: "#EDF6FF",
    border: "#CFE5FF", text: "#2563EB", label: "Gold",
  },
  premium: {
    icon: Crown, color: "#384959", bg: "#EEF2F7",
    border: "#D9E2EC", text: "#1E293B", label: "Premium",
  },
};

const getPlanMeta = (planName) => {
  if (!planName) return PLAN_META.silver;
  const key = String(planName).toLowerCase().trim();
  return PLAN_META[key] || PLAN_META.silver;
};

const getDaysLeft = (endDate) => {
  if (!endDate) return 0;
  return Math.max(0, Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)));
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ─── normalise a Subscription row into a display shape ───────────────────────
// /upgrade/timeline returns: { id, planName, userCount, paymentId, amount,
//                              startDate, endDate, status }
// /payment/latest returns:   { id, planName, userCount, razorpayPaymentId,
//                              amount, planStartDate, planEndDate, status }
const normalise = (s) => ({
  id:               s.id,
  planName:         s.planName  || s.plan?.name || "—",
  userCount:        s.userCount ?? 0,
  razorpayPaymentId: s.paymentId || s.razorpayPaymentId || null,
  amount:           s.amount    ?? 0,
  planStartDate:    s.startDate || s.planStartDate,
  planEndDate:      s.endDate   || s.planEndDate,
  // real active status = SUCCESS row + end date in future
  isRunning:        new Date(s.endDate || s.planEndDate) > new Date(),
});

export default function SubscriptionTimeline({ onUpgrade }) {
  const [items, setItems]     = useState([]);   // normalised, sorted
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => { fetchTimeline(); }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) { setItems([]); setLoading(false); return; }

      // ── Primary: subscription/timeline (has full Subscription history) ──────
      const res = await fetch(`${API_URL}/api/subscription/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();                 // { subscriptions: [...] }
      const raw  = data.subscriptions ?? [];

      if (raw.length === 0) {
        // ── Fallback: first-time buyer — try payment/latest ────────────────
        const r2 = await fetch(`${API_URL}/api/payment/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r2.ok) {
          const p = await r2.json();
          if (p?.planName && p?.status === "SUCCESS") {
            setItems([normalise({
              ...p,
              startDate: p.planStartDate,
              endDate:   p.planEndDate,
            })]);
            return;
          }
        }
        setItems([]);
        return;
      }

      // ── Sort: oldest first so timeline flows top→bottom chronologically ──
      const sorted = [...raw]
        .sort((a, b) => new Date(a.startDate || a.planStartDate) - new Date(b.startDate || b.planStartDate))
        .map(normalise);

      // ── Build display list ────────────────────────────────────────────────
      // Rule: show the plan whose end date is furthest in the future as the
      //       "next queued" plan, and the one currently running as "active".
      //       Everything else is expired history.
      //
      // After an upgrade the backend sets the new subscription's startDate
      // to "now" and EXPIRES the old one — BUT we still want to honour the
      // old plan's remaining days.  We detect this by checking if two
      // entries overlap in time (old endDate > new startDate).
      const display = buildDisplayList(sorted);
      setItems(display);

    } catch (err) {
      console.error("Timeline fetch error:", err);
      setError("Failed to load subscription details.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-3xl p-12 text-center shadow-sm">
        <p className="text-red-500 font-semibold">{error}</p>
        <button onClick={fetchTimeline}
          className="mt-4 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition">
          Retry
        </button>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <CreditCard size={28} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">No Subscription Yet</h2>
        <p className="text-gray-400 text-sm">Purchase a plan below to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles size={11} /> Subscription Timeline
          </div>
          <h2 className="text-2xl font-black text-[#384959]">Plan History</h2>
          <p className="text-sm text-gray-400 mt-1">Your active plan, renewal dates and previous upgrades.</p>
        </div>
        <button onClick={fetchTimeline}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* TIMELINE */}
      <div className="space-y-5">
        {items.map((item, index) => (
          <TimelineCard
            key={item.id}
            sub={item}
            isLast={index === items.length - 1}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single card ──────────────────────────────────────────────────────────────
function TimelineCard({ sub, isLast, onUpgrade }) {
  const meta     = getPlanMeta(sub.planName);
  const Icon     = meta.icon;
  const daysLeft = getDaysLeft(sub.planEndDate);

  const variant   = sub._variant || (sub.isRunning ? "current" : "expired");
  const isQueued  = variant === "queued";
  const isCurrent = variant === "current";

  // Show/hide body — queued cards start collapsed
  const [showBody, setShowBody] = useState(!isQueued);

  return (
    <div className="relative">
      {/* connector line to next card */}
      {!isLast && (
        <div className="absolute left-8 top-[110px] bottom-[-24px] w-[2px] bg-gray-200 z-0" />
      )}

      {/* ── QUEUED banner above card ─────────────────────────────────── */}
      {isQueued && (
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Lock size={13} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Next Plan · Starts after current plan ends ({formatDate(sub._startsAfter)})
          </span>
        </div>
      )}

      <div
        className={`relative z-10 rounded-2xl border bg-white shadow-sm overflow-hidden transition-opacity
          ${isQueued ? "opacity-80" : "opacity-100"}`}
        style={{ borderColor: isQueued ? "#FDE68A" : meta.border }}
      >
        {/* TOP BAND */}
        <div className="p-5 md:p-6" style={{ background: isQueued ? "#FFFBEB" : meta.bg }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Icon + name + status pill */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: isQueued ? "#F59E0B" : meta.color }}
              >
                {isQueued ? <Hourglass size={26} color="white" /> : <Icon size={26} color="white" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-2xl font-black" style={{ color: isQueued ? "#92400E" : meta.text }}>
                    {meta.label} Plan
                  </h3>
                  <StatusPill variant={variant} />
                </div>
                <p className="text-sm text-gray-500">
                  Activated for <strong>{sub.userCount ?? "—"}</strong> users
                </p>
              </div>
            </div>

            {/* Right side: pill + optional eye toggle */}
            <div className="flex items-center gap-3">

              {/* Days left — current plan */}
              {isCurrent && daysLeft > 0 && (
                <div className="bg-white border border-green-200 rounded-2xl px-5 py-3 min-w-[160px] shadow-sm text-center">
                  <div className="text-[10px] uppercase tracking-widest text-green-600 font-bold mb-0.5">Remaining</div>
                  <div className="text-3xl font-black text-green-700">{daysLeft}</div>
                  <div className="text-xs text-gray-400">days left</div>
                </div>
              )}

              {/* Starts In — queued plan */}
              {isQueued && sub._daysUntilStart > 0 && (
                <div className="bg-white border border-amber-200 rounded-2xl px-5 py-3 min-w-[140px] shadow-sm text-center">
                  <div className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">Starts In</div>
                  <div className="text-3xl font-black text-amber-600">{sub._daysUntilStart}</div>
                  <div className="text-xs text-gray-400">days</div>
                </div>
              )}

              {/* Eye toggle — only on queued cards */}
              {isQueued && (
                <button
                  onClick={() => setShowBody(v => !v)}
                  title={showBody ? "Hide details" : "Show details"}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all
                    ${showBody
                      ? "bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200"
                      : "bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500"
                    }`}
                >
                  {showBody ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BODY — collapsible for queued cards */}
        {showBody && (
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <InfoBox icon={<CalendarDays size={12} />} label="Start Date"
                value={formatDate(isQueued ? sub._startsAfter : sub.planStartDate)} />

              <InfoBox icon={<Clock3 size={12} />} label="Expiry Date"
                value={formatDate(sub.planEndDate)}
                warn={isCurrent && daysLeft < 30}
                warnText="Expiring soon!" />

              <InfoBox icon={<Users size={12} />} label="Users"
                value={sub.userCount ?? "—"} />

              <InfoBox icon={<CreditCard size={12} />} label="Payment ID"
                value={sub.razorpayPaymentId || "N/A"} small />
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Status</div>
                <div className={`text-sm font-bold ${
                  isCurrent ? "text-green-600"
                    : isQueued ? "text-amber-600"
                    : "text-red-500"
                }`}>
                  {isCurrent
                    ? (daysLeft > 0 ? "Currently Active" : "Plan Expired")
                    : isQueued
                    ? "Paid · Queued to Start"
                    : "Expired"}
                </div>
              </div>

              {isCurrent && onUpgrade && (
                <button onClick={onUpgrade}
                  className="px-5 py-2.5 rounded-xl bg-[#384959] text-white text-sm font-bold hover:opacity-90 transition flex items-center gap-2">
                  <Zap size={14} /> Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsed hint — shown when queued body is hidden */}
        {isQueued && !showBody && (
          <div className="px-5 py-3 border-t border-amber-100 flex items-center justify-between">
            <span className="text-xs text-amber-500 font-semibold">Details hidden · click eye to expand</span>
            <button
              onClick={() => setShowBody(true)}
              className="text-xs text-amber-600 font-bold underline underline-offset-2 hover:text-amber-700 transition"
            >
              Show
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ variant }) {
  if (variant === "current") return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 bg-green-100 text-green-700">
      <CheckCircle2 size={11} /> ACTIVE
    </span>
  );
  if (variant === "queued") return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 bg-amber-100 text-amber-700">
      <Hourglass size={11} /> QUEUED
    </span>
  );
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 bg-red-100 text-red-600">
      <XCircle size={11} /> EXPIRED
    </span>
  );
}

// ─── Info box ─────────────────────────────────────────────────────────────────
function InfoBox({ icon, label, value, warn, warnText, small }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
        {icon} {label}
      </div>
      <div className={`font-bold ${small ? "text-xs text-gray-600 break-all" : "text-base"} ${warn ? "text-red-500" : "text-gray-800"}`}>
        {value}
      </div>
      {warn && warnText && <div className="text-[10px] text-red-400 mt-0.5 font-semibold">{warnText}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Core logic: given an array of normalised subscriptions (sorted oldest→newest),
// decide which is "current" (running now), which is "queued" (paid but
// waiting for the current one to expire), and which are "expired".
//
// Scenario after an upgrade:
//   Old plan: startDate Jan 1 → endDate Dec 31  (still has 200 days left)
//   New plan: startDate Jul 1 → endDate Jul 1+1yr  (backend set this immediately)
//
// The backend marks the old subscription EXPIRED when a new one is created,
// but the user still has real time left on the old plan.
// We detect "overlap" = new plan's startDate < old plan's endDate.
// In that case we treat the old plan as CURRENT and new plan as QUEUED.
// ─────────────────────────────────────────────────────────────────────────────
function buildDisplayList(sorted) {
  const now = new Date();

  if (sorted.length === 0) return [];
  if (sorted.length === 1) {
    const s = sorted[0];
    return [{ ...s, _variant: s.isRunning ? "current" : "expired" }];
  }

  // Find the plan that is genuinely running (end date furthest in future
  // among plans whose end date > now), and see if there's a newer paid plan
  // that overlaps with it (i.e., would be "queued").
  const withDays = sorted.map(s => ({
    ...s,
    _endMs: new Date(s.planEndDate).getTime(),
    _startMs: new Date(s.planStartDate).getTime(),
  }));

  // The "current" plan = the one with the EARLIEST end date that is still
  // in the future (the plan the user is actually on right now).
  const futureOnes = withDays.filter(s => s._endMs > now.getTime());

  if (futureOnes.length === 0) {
    // All expired — just show them oldest→newest, all as expired
    return withDays.map(s => ({ ...s, _variant: "expired" }));
  }

  // Sort future ones by endDate ascending — earliest end = current running plan
  futureOnes.sort((a, b) => a._endMs - b._endMs);

  const current = futureOnes[0];
  const currentEndMs = current._endMs;

  const result = [];

  for (const s of withDays) {
    if (s.id === current.id) {
      result.push({ ...s, _variant: "current" });
      continue;
    }

    if (s._endMs <= now.getTime()) {
      // Truly expired (end date in past)
      result.push({ ...s, _variant: "expired" });
      continue;
    }

    // This plan is in the future but is NOT the current one.
    // It overlaps with the current plan → treat as QUEUED.
    // Its effective start = when the current plan ends.
    const daysUntilStart = Math.max(
      0,
      Math.ceil((currentEndMs - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    result.push({
      ...s,
      _variant: "queued",
      _startsAfter: new Date(currentEndMs).toISOString(),
      _daysUntilStart: daysUntilStart,
    });
  }

  // Display order: current first, then queued, then expired (newest first)
  const current_  = result.filter(s => s._variant === "current");
  const queued    = result.filter(s => s._variant === "queued");
  const expired   = result.filter(s => s._variant === "expired")
                          .sort((a, b) => b._endMs - a._endMs);

  return [...current_, ...queued, ...expired];
}