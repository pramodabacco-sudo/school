// src/superAdmin/pages/FinanceReports/FinanceReports.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Users, Briefcase, Receipt, Download, Calendar,
  TrendingUp, TrendingDown, IndianRupee, Filter, RefreshCw,
  ChevronDown, CheckCircle, Clock, AlertCircle, X, Search,
  ArrowUpRight, FileSpreadsheet, Layers
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => {
  try { return JSON.parse(localStorage.getItem("auth"))?.token; } catch { return null; }
};
const getUniversityId = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth"));
    return (
      auth?.user?.universityId ||
      auth?.university?.id ||
      auth?.user?.university?.id ||
      null
    );
  } catch {
    return null;
  }
};
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_00_00_000) return "₹" + (v / 1_00_00_000).toFixed(2) + "Cr";
  if (v >= 1_00_000)    return "₹" + (v / 1_00_000).toFixed(2) + "L";
  if (v >= 1_000)       return "₹" + (v / 1_000).toFixed(1) + "K";
  return fmt(v);
};

function getDateRange(preset, customFrom, customTo) {
  const now = new Date();
  const sod = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const eod = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
  if (preset === "today")     return { from: sod(now), to: eod(now) };
  if (preset === "yesterday") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return { from: sod(y), to: eod(y) };
  }
  if (preset === "thisWeek") {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7));
    return { from: sod(mon), to: eod(now) };
  }
  if (preset === "thisMonth") {
    return { from: sod(new Date(now.getFullYear(), now.getMonth(), 1)), to: eod(now) };
  }
  if (preset === "lastMonth") {
    const f = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const l = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: sod(f), to: eod(l) };
  }
  if (preset === "thisYear") {
    return { from: sod(new Date(now.getFullYear(), 0, 1)), to: eod(now) };
  }
  if (preset === "custom" && customFrom && customTo) {
    return { from: sod(new Date(customFrom)), to: eod(new Date(customTo)) };
  }
  return { from: null, to: null };
}

function inRange(dateStr, from, to) {
  if (!from || !to) return true;
  const d = new Date(dateStr);
  return d >= from && d <= to;
}

const STATUS_COLOR = {
  PAID:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  PENDING: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  HOLD:    { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500"  },
  PARTIAL: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400"    },
  UNPAID:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
};

// ── Category color palette ────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6",
];

// ── Data Normalization Helpers ────────────────────────────────────────────────
function normalizeStaffRecords(raw) {
  const { teacherSalary=[], adminSalary=[], financeSalary=[], groupBSalary=[], groupCSalary=[], groupDSalary=[] } = raw;

  const mapTeacher = (r) => ({
    ...r,
    _name:  r.teacherName  || r._name  || "—",
    _email: r.teacherEmail || r._email || "—",
    _group: "Teacher",
    _date:  r.paymentDate  || r.createdAt,
  });

  const mapAdmin = (r) => ({
    ...r,
    _name:  r.adminName  || r._name  || "—",
    _email: r.adminEmail || r._email || "—",
    _group: "Admin",
    _date:  r.paymentDate || r.createdAt,
  });

  const mapFinance = (r) => ({
    ...r,
    _name:  r.financeName  || r._name  || "—",
    _email: r.financeEmail || r._email || "—",
    _group: "Finance",
    _date:  r.paymentDate  || r.createdAt,
  });

  const mapGroupB = (r) => ({
    ...r,
    _name:  r.staffName  || r._name  || "—",
    _email: r.staffEmail || r._email || "—",
    _group: "Group B",
    _date:  r.paymentDate || r.createdAt,
  });

  const mapGroupC = (r) => ({
    ...r,
    _name:  r.staffName  || r._name  || "—",
    _email: r.staffEmail || r._email || "—",
    _group: "Group C",
    _date:  r.paymentDate || r.createdAt,
  });

  const mapGroupD = (r) => ({
    ...r,
    _name:  r.name        || r._name  || "—",
    _email: r.email       || r._email || "—",
    _group: "Group D",
    _date:  r.createdAt,
    basicSalary: Number(r.basicSalary || 0),
    bonus:       Number(r.allowances  || 0),
    deductions:  0,
    netSalary:   Number(r.basicSalary || 0) + Number(r.allowances || 0),
    leaveDays:   0,
    status:      r.salaryPaid ? "PAID" : "PENDING",
  });

  return [
    ...teacherSalary.map(mapTeacher),
    ...adminSalary.map(mapAdmin),
    ...financeSalary.map(mapFinance),
    ...groupBSalary.map(mapGroupB),
    ...groupCSalary.map(mapGroupC),
    ...groupDSalary.map(mapGroupD),
  ];
}

function normalizeExpenses(raw) {
  const colorMap = {};
  let colorIndex = 0;

  return raw.map((r) => {
    let category = "Uncategorized";
    if (r.category && typeof r.category === "string") {
      category = r.category;
    } else if (Array.isArray(r.categories) && r.categories.length > 0) {
      const first = r.categories[0];
      category = first?.category?.name || first?.name || "Uncategorized";
    }

    if (!colorMap[category]) {
      colorMap[category] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
      colorIndex++;
    }

    return {
      id:            r.id,
      label:         r.label || "—",
      amount:        Number(r.amount || 0),
      createdAt:     r.createdAt,
      category,
      categoryColor: r.categoryColor || colorMap[category],
    };
  });
}

// ── Excel Export Utility ──────────────────────────────────────────────────────
function exportToExcel(data, filename, headers, rowMapper) {
  const loadAndRun = (ExcelJS) => _buildExcel(ExcelJS, data, filename, headers, rowMapper);
  if (window.ExcelJS) { loadAndRun(window.ExcelJS); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
  s.onload = () => loadAndRun(window.ExcelJS);
  document.head.appendChild(s);
}

async function _buildExcel(ExcelJS, data, filename, headers, rowMapper) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Report");
  const NAVY  = "1C3044";
  const NAVY2 = "27435B";
  const LIGHT = "EEF4F8";
  const thin  = {
    top:    { style:"thin", color:{argb:"D0E1ED"} },
    left:   { style:"thin", color:{argb:"D0E1ED"} },
    bottom: { style:"thin", color:{argb:"D0E1ED"} },
    right:  { style:"thin", color:{argb:"D0E1ED"} },
  };

  ws.columns = headers.map(h => ({ width: h.width || 20 }));

  ws.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
  const r1 = ws.getRow(1); r1.height = 36;
  r1.getCell(1).value = filename.replace(/_/g, " ").toUpperCase();
  r1.getCell(1).font      = { name:"Calibri", size:14, bold:true, color:{argb:"FFFFFF"} };
  r1.getCell(1).fill      = { type:"pattern", pattern:"solid", fgColor:{argb:NAVY} };
  r1.getCell(1).alignment = { vertical:"middle", horizontal:"center" };

  ws.mergeCells(`A2:${String.fromCharCode(64 + headers.length)}2`);
  const r2 = ws.getRow(2); r2.height = 20;
  r2.getCell(1).value = `Generated: ${new Date().toLocaleString("en-IN")}  |  ${data.length} records`;
  r2.getCell(1).font      = { name:"Calibri", size:9, color:{argb:"FFFFFF"} };
  r2.getCell(1).fill      = { type:"pattern", pattern:"solid", fgColor:{argb:NAVY2} };
  r2.getCell(1).alignment = { vertical:"middle", horizontal:"center" };

  ws.getRow(3).height = 8;

  const hr = ws.getRow(4); hr.height = 26;
  headers.forEach((h, i) => {
    const cell = hr.getCell(i + 1);
    cell.value     = h.label;
    cell.font      = { name:"Calibri", size:10, bold:true, color:{argb:"FFFFFF"} };
    cell.fill      = { type:"pattern", pattern:"solid", fgColor:{argb:NAVY} };
    cell.alignment = { vertical:"middle", horizontal: h.align || "left" };
    cell.border    = thin;
  });

  data.forEach((item, idx) => {
    const row = ws.getRow(idx + 5);
    row.height = 20;
    const values = rowMapper(item, idx);
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value     = v;
      cell.fill      = { type:"pattern", pattern:"solid", fgColor:{argb: idx % 2 === 0 ? "FFFFFF" : LIGHT} };
      cell.font      = { name:"Calibri", size:10 };
      cell.border    = thin;
      cell.alignment = { vertical:"middle", horizontal: headers[i]?.align || "left" };
    });
  });

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`;
  a.click();
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border ${color.border} ${color.bg} group transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1 ${color.label}`}>{label}</p>
          <p className={`text-xl sm:text-2xl font-bold ${color.value} leading-none truncate`}>{value}</p>
          {sub && <p className={`text-xs mt-1.5 line-clamp-1 ${color.sub}`}>{sub}</p>}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color.icon}`}>
          <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 flex-wrap">
          {trend >= 0
            ? <TrendingUp size={12} className="text-emerald-500" />
            : <TrendingDown size={12} className="text-red-500" />}
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">vs prev period</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function TableWrapper({ children, loading, empty }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#1C3044] animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading data…</p>
    </div>
  );
  if (empty) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <Layers size={32} className="opacity-30" />
      <p className="text-sm font-medium">No records found for this period</p>
    </div>
  );
  return children;
}

// ── Date Filter Bar ───────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { key: "today",     label: "Today"      },
  { key: "yesterday", label: "Yesterday"  },
  { key: "thisWeek",  label: "This Week"  },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisYear",  label: "This Year"  },
  { key: "all",       label: "All Time"   },
  { key: "custom",    label: "Custom"     },
];

function DateFilterBar({ preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 w-full">
      <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
        <Calendar size={15} />
        <span className="text-xs font-bold uppercase tracking-wider">Period</span>
      </div>
      <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
        {DATE_PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-grow sm:flex-grow-0 text-center ${
              preset === p.key
                ? "bg-[#1C3044] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto justify-between sm:justify-start">
          <input
            type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            max={customTo || undefined}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#1C3044] w-[45%] sm:w-auto"
          />
          <span className="text-slate-400 text-xs">–</span>
          <input
            type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            min={customFrom || undefined}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#1C3044] w-[45%] sm:w-auto"
          />
        </div>
      )}
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────────────────────
function StudentsTab({ dateRange }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res    = await fetch(`${API_URL}/api/superadmin-finance/student-finance`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const result = await res.json();
        if (!res.ok) { setData([]); return; }
        setData(Array.isArray(result?.data) ? result.data : []);
      } catch (e) {
        console.error("Student Finance Load Error:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = data.filter(s => {
    const inDate      = inRange(s.paymentDate || s.createdAt, dateRange.from, dateRange.to);
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    return inDate && matchSearch;
  });

  const totalFees = filtered.reduce((a, s) => a + Number(s.fees || 0), 0);
  const totalPaid = filtered.reduce((a, s) => a + Number(s.paidAmount || 0), 0);
  const totalDue  = Math.max(0, totalFees - totalPaid);
  const paidCount = filtered.filter(s =>
    Number(s.paidAmount || 0) >= Number(s.fees || 0) && Number(s.fees || 0) > 0
  ).length;

  const handleExport = () => {
    exportToExcel(
      filtered,
      "Student_Fee_Report",
      [
        { label: "#",            width: 5,  align: "center" },
        { label: "Student Name", width: 24 },
        { label: "Email",        width: 28 },
        { label: "Course / Class", width: 18 },
        { label: "Total Fees",   width: 16, align: "right"  },
        { label: "Amount Paid",  width: 16, align: "right"  },
        { label: "Amount Due",   width: 16, align: "right"  },
        { label: "Payment Mode", width: 16, align: "center" },
        { label: "Payment Date", width: 16, align: "center" },
        { label: "Status",       width: 12, align: "center" },
      ],
      (s, idx) => {
        const paid   = Number(s.paidAmount || 0);
        const fees   = Number(s.fees || 0);
        const due    = Math.max(0, fees - paid);
        const status = fees > 0 && due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
        return [
          idx + 1, s.name || "—", s.email || "—", s.course || "—",
          fees, paid, due, s.paymentMode || "—",
          s.paymentDate ? new Date(s.paymentDate).toLocaleDateString("en-IN") : "—",
          status,
        ];
      }
    );
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Fees" value={fmtShort(totalFees)} sub={`${filtered.length} students`} icon={IndianRupee}
          color={{ bg:"bg-blue-50", border:"border-blue-100", icon:"bg-blue-100 text-blue-600", label:"text-blue-500", value:"text-blue-800", sub:"text-blue-400" }} />
        <KpiCard label="Collected" value={fmtShort(totalPaid)} sub={`${filtered.length > 0 ? Math.round((totalPaid/totalFees)*100)||0 : 0}% collection rate`} icon={CheckCircle}
          color={{ bg:"bg-emerald-50", border:"border-emerald-100", icon:"bg-emerald-100 text-emerald-600", label:"text-emerald-500", value:"text-emerald-800", sub:"text-emerald-400" }} />
        <KpiCard label="Pending" value={fmtShort(totalDue)} sub={`${filtered.length - paidCount} unpaid accounts`} icon={AlertCircle}
          color={{ bg:"bg-red-50", border:"border-red-100", icon:"bg-red-100 text-red-500", label:"text-red-400", value:"text-red-700", sub:"text-red-300" }} />
        <KpiCard label="Fully Paid" value={paidCount} sub={`of ${filtered.length} students`} icon={Users}
          color={{ bg:"bg-slate-50", border:"border-slate-200", icon:"bg-slate-100 text-slate-600", label:"text-slate-400", value:"text-slate-700", sub:"text-slate-400" }} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Student Fee Records</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">{filtered.length}</span>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow xs:flex-grow-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1C3044] w-full sm:w-36"
              />
            </div>
            <button onClick={handleExport}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1C3044] text-white rounded-lg text-xs font-semibold hover:bg-[#27435B] transition-colors w-full xs:w-auto">
              <FileSpreadsheet size={12} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <TableWrapper loading={loading} empty={!loading && filtered.length === 0}>
            <table className="w-full text-[12px] min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#","Name","Email","Course","Total Fees","Paid","Due","Mode","Date","Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const paid   = Number(s.paidAmount || 0);
                  const fees   = Number(s.fees || 0);
                  const due    = Math.max(0, fees - paid);
                  const status = fees > 0 && due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
                  return (
                    <tr key={s.id ?? i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap">{s.email}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{s.course || "—"}</span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-700 whitespace-nowrap">{fmt(fees)}</td>
                      <td className="px-4 py-2.5 font-semibold text-emerald-600 whitespace-nowrap">{paid > 0 ? fmt(paid) : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 font-bold text-red-500 whitespace-nowrap">{due > 0 ? fmt(due) : <span className="text-emerald-400 font-bold">✓</span>}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{s.paymentMode || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap">{s.paymentDate ? new Date(s.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF4F8] border-t-2 border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">TOTALS — {filtered.length} records</td>
                  <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{fmt(totalFees)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">{fmt(totalPaid)}</td>
                  <td className="px-4 py-3 font-bold text-red-500 whitespace-nowrap">{fmt(totalDue)}</td>
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">
                    {filtered.length > 0 ? `${Math.round((totalPaid/totalFees)*100)||0}% collected` : ""}
                  </td>
                </tr>
              </tfoot>
            </table>
          </TableWrapper>
        </div>
      </div>
    </div>
  );
}

// ── Staff Tab ─────────────────────────────────────────────────────────────────
function StaffTab({ dateRange }) {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res    = await fetch(`${API_URL}/api/superadmin-finance/staff-salary`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const result = await res.json();
        if (!res.ok) { setData([]); return; }
        const normalized = normalizeStaffRecords(result.data || {});
        setData(normalized);
      } catch (e) {
        console.error("Staff Salary Load Error:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const groups = [
    "ALL",
    ...Array.from(
      new Set(data.map(d => d._group).filter(g => g != null && g !== ""))
    ),
  ];

  const filtered = data.filter(r => {
    const inDate      = inRange(r._date || r.createdAt, dateRange.from, dateRange.to);
    const matchGroup  = groupFilter === "ALL" || r._group === groupFilter;
    const matchSearch = !search ||
      r._name?.toLowerCase().includes(search.toLowerCase()) ||
      r._email?.toLowerCase().includes(search.toLowerCase());
    return inDate && matchGroup && matchSearch;
  });

  const totalNet   = filtered.reduce((a, r) => a + Number(r.netSalary   || 0), 0);
  const totalBasic = filtered.reduce((a, r) => a + Number(r.basicSalary || 0), 0);
  const paid       = filtered.filter(r => r.status === "PAID").length;
  const pending    = filtered.filter(r => r.status === "PENDING").length;

  const handleExport = () => {
    exportToExcel(
      filtered,
      "Staff_Salary_Report",
      [
        { label: "#",            width: 5,  align: "center" },
        { label: "Name",         width: 24 },
        { label: "Email",        width: 26 },
        { label: "Group",        width: 22 },
        { label: "Month/Year",   width: 14, align: "center" },
        { label: "Basic Salary", width: 16, align: "right"  },
        { label: "Bonus",        width: 14, align: "right"  },
        { label: "Deductions",   width: 14, align: "right"  },
        { label: "Leave Days",   width: 12, align: "center" },
        { label: "Net Salary",   width: 16, align: "right"  },
        { label: "Status",       width: 12, align: "center" },
        { label: "Payment Date", width: 16, align: "center" },
      ],
      (r, idx) => {
        const mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return [
          idx + 1, r._name || "—", r._email || "—", r._group || "—",
          r.month && r.year ? `${mn[r.month-1]} ${r.year}` : "—",
          Number(r.basicSalary || 0), Number(r.bonus || 0), Number(r.deductions || 0),
          r.leaveDays || 0, Number(r.netSalary || 0), r.status || "—",
          r.paymentDate ? new Date(r.paymentDate).toLocaleDateString("en-IN") : "—",
        ];
      }
    );
  };

  const monthLabel = (r) => {
    const mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return r.month && r.year ? `${mn[r.month-1]} ${r.year}` : "—";
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Net Payout" value={fmtShort(totalNet)} sub={`${filtered.length} records`} icon={IndianRupee}
          color={{ bg:"bg-blue-50", border:"border-blue-100", icon:"bg-blue-100 text-blue-600", label:"text-blue-500", value:"text-blue-800", sub:"text-blue-400" }} />
        <KpiCard label="Paid Salaries" value={paid} sub={`${filtered.length > 0 ? Math.round((paid/filtered.length)*100) : 0}% cleared`} icon={CheckCircle}
          color={{ bg:"bg-emerald-50", border:"border-emerald-100", icon:"bg-emerald-100 text-emerald-600", label:"text-emerald-500", value:"text-emerald-800", sub:"text-emerald-400" }} />
        <KpiCard label="Pending" value={pending} sub="awaiting payment" icon={Clock}
          color={{ bg:"bg-amber-50", border:"border-amber-100", icon:"bg-amber-100 text-amber-600", label:"text-amber-500", value:"text-amber-800", sub:"text-amber-400" }} />
        <KpiCard label="Total Basic" value={fmtShort(totalBasic)} sub="gross salary base" icon={Briefcase}
          color={{ bg:"bg-slate-50", border:"border-slate-200", icon:"bg-slate-100 text-slate-600", label:"text-slate-400", value:"text-slate-700", sub:"text-slate-400" }} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Briefcase size={15} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Staff Salary Records</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">{filtered.length}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full md:w-auto">
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-[#1C3044] cursor-pointer bg-white w-full sm:w-auto"
            >
              {groups.map((g, i) => (
                <option key={`grp-${i}-${g}`} value={g}>
                  {g === "ALL" ? "All Groups" : g}
                </option>
              ))}
            </select>
            <div className="relative flex-grow sm:flex-grow-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1C3044] w-full sm:w-32"
              />
            </div>
            <button onClick={handleExport}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1C3044] text-white rounded-lg text-xs font-semibold hover:bg-[#27435B] transition-colors w-full sm:w-auto">
              <FileSpreadsheet size={12} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <TableWrapper loading={loading} empty={!loading && filtered.length === 0}>
            <table className="w-full text-[12px] min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#","Name","Group","Period","Basic","Bonus","Deductions","Leave Days","Net Salary","Status","Paid On"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id ?? `staff-${i}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{r._name || "—"}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="bg-[#EEF4F8] text-[#27435B] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{r._group}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{monthLabel(r)}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-700 whitespace-nowrap">{fmt(r.basicSalary)}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-semibold whitespace-nowrap">
                      {Number(r.bonus || 0) > 0 ? fmt(r.bonus) : <span className="text-slate-200">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-red-400 font-semibold whitespace-nowrap">
                      {Number(r.deductions || 0) > 0 ? fmt(r.deductions) : <span className="text-slate-200">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.leaveDays || 0}d</td>
                    <td className="px-4 py-2.5 font-bold text-[#1C3044] whitespace-nowrap">{fmt(r.netSalary)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status || "PENDING"} /></td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF4F8] border-t-2 border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">TOTALS — {filtered.length} records</td>
                  <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{fmt(totalBasic)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">{fmt(filtered.reduce((a,r) => a + Number(r.bonus || 0), 0))}</td>
                  <td className="px-4 py-3 font-bold text-red-400 whitespace-nowrap">{fmt(filtered.reduce((a,r) => a + Number(r.deductions || 0), 0))}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{filtered.reduce((a,r) => a + (r.leaveDays || 0), 0)}d</td>
                  <td className="px-4 py-3 font-bold text-[#1C3044] whitespace-nowrap">{fmt(totalNet)}</td>
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{paid}/{filtered.length} paid</td>
                </tr>
              </tfoot>
            </table>
          </TableWrapper>
        </div>
      </div>
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────
function ExpensesTab({ dateRange }) {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/superadmin-finance/expenses`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const result = await res.json();
        if (!res.ok) { setData([]); return; }
        const raw        = Array.isArray(result?.data) ? result.data : [];
        const normalized = normalizeExpenses(raw);
        setData(normalized);
      } catch (e) {
        console.error("Expense Load Error:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cats = [
    "ALL",
    ...Array.from(
      new Set(data.map(d => d.category).filter(c => c != null && c !== ""))
    ),
  ];

  const filtered = data.filter(r => {
    const inDate      = inRange(r.createdAt, dateRange.from, dateRange.to);
    const matchCat    = catFilter === "ALL" || r.category === catFilter;
    const matchSearch = !search ||
      r.label?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase());
    return inDate && matchCat && matchSearch;
  });

  const totalAmt = filtered.reduce((a, r) => a + Number(r.amount || 0), 0);

  const catData = {};
  filtered.forEach(r => {
    if (!catData[r.category]) {
      catData[r.category] = { total: 0, color: r.categoryColor };
    }
    catData[r.category].total += Number(r.amount || 0);
  });

  const sortedCats = Object.entries(catData).sort((a, b) => b[1].total - a[1].total);
  const topCat     = sortedCats[0];

  const handleExport = () => {
    exportToExcel(
      filtered,
      "Expense_Report",
      [
        { label: "#",           width: 5,  align: "center" },
        { label: "Category",    width: 22 },
        { label: "Description", width: 30 },
        { label: "Amount",      width: 16, align: "right"  },
        { label: "Date Added",  width: 18, align: "center" },
      ],
      (r, idx) => [
        idx + 1, r.category || "—", r.label || "—",
        Number(r.amount || 0),
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—",
      ]
    );
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Expenses" value={fmtShort(totalAmt)} sub={`${filtered.length} expense items`} icon={TrendingDown}
          color={{ bg:"bg-red-50", border:"border-red-100", icon:"bg-red-100 text-red-500", label:"text-red-400", value:"text-red-700", sub:"text-red-300" }} />
        <KpiCard label="Categories" value={sortedCats.length} sub="active expense types" icon={Layers}
          color={{ bg:"bg-slate-50", border:"border-slate-200", icon:"bg-slate-100 text-slate-600", label:"text-slate-400", value:"text-slate-700", sub:"text-slate-400" }} />
        <KpiCard
          label="Top Category"
          value={topCat ? topCat[0].split(" ")[0] : "—"}
          sub={topCat ? fmt(topCat[1].total) : "no data"}
          icon={BarChart3}
          color={{ bg:"bg-purple-50", border:"border-purple-100", icon:"bg-purple-100 text-purple-600", label:"text-purple-400", value:"text-purple-700", sub:"text-purple-400" }}
        />
        <KpiCard label="Avg per Item" value={fmtShort(filtered.length > 0 ? totalAmt / filtered.length : 0)} sub="average expense" icon={Receipt}
          color={{ bg:"bg-amber-50", border:"border-amber-100", icon:"bg-amber-100 text-amber-600", label:"text-amber-500", value:"text-amber-800", sub:"text-amber-400" }} />
      </div>

      {sortedCats.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Category Breakdown</p>

          <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-3">
            {sortedCats.map(([cat, { total, color }], i) => (
              <div
                key={`bar-${i}-${cat}`}
                style={{
                  width: `${totalAmt > 0 ? (total / totalAmt) * 100 : 0}%`,
                  background: color,
                }}
                title={`${cat}: ${fmt(total)}`}
                className="h-full"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {sortedCats.map(([cat, { total, color }], i) => (
              <div key={`legend-${i}-${cat}`} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-slate-500 truncate max-w-[100px] sm:max-w-none">{cat}</span>
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{fmt(total)}</span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  ({totalAmt > 0 ? Math.round((total / totalAmt) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Expense Records</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">{filtered.length}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full md:w-auto">
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-[#1C3044] cursor-pointer bg-white w-full sm:w-auto"
            >
              {cats.map((c, i) => (
                <option key={`cat-opt-${i}-${c}`} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>
            <div className="relative flex-grow sm:flex-grow-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1C3044] w-full sm:w-32"
              />
            </div>
            <button onClick={handleExport}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1C3044] text-white rounded-lg text-xs font-semibold hover:bg-[#27435B] transition-colors w-full sm:w-auto">
              <FileSpreadsheet size={12} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <TableWrapper loading={loading} empty={!loading && filtered.length === 0}>
            <table className="w-full text-[12px] min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#","Category","Description","Amount","Date Added"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id ?? `exp-${i}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          background: (r.categoryColor || "#94a3b8") + "22",
                          color:       r.categoryColor || "#64748b",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.categoryColor || "#94a3b8" }} />
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{r.label || "—"}</td>
                    <td className="px-4 py-2.5 font-bold text-red-600 whitespace-nowrap">{fmt(r.amount)}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF4F8] border-t-2 border-slate-200">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">TOTAL — {filtered.length} items</td>
                  <td className="px-4 py-3 font-bold text-red-600 whitespace-nowrap">{fmt(totalAmt)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </TableWrapper>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "students", label: "Students", icon: Users,    desc: "Fee collections & payments" },
  { key: "staff",    label: "Staff",    icon: Briefcase, desc: "Salary records"              },
  { key: "expenses", label: "Expenses", icon: Receipt,   desc: "Operational costs"           },
];

export default function FinanceReports() {
  const [activeTab,   setActiveTab]   = useState("students");
  const [preset,      setPreset]      = useState("thisMonth");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");
  const universityId = getUniversityId();

  const dateRange   = getDateRange(preset, customFrom, customTo);
  const presetLabel = DATE_PRESETS.find(p => p.key === preset)?.label || "Custom";

  return (
    <div className="min-h-screen bg-slate-50 font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#1C3044] to-[#2d4a64] px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 size={18} color="#fff" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-none">Finance Reports</h1>
                <p className="text-xs text-white/50 mt-1">{presetLabel} · All-in-one financial overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60 bg-white/10 rounded-xl px-3 py-2 border border-white/15 self-start sm:self-center">
              <Calendar size={12} className="flex-shrink-0" />
              <span className="whitespace-nowrap">
                {dateRange.from
                  ? dateRange.from.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                  : "All time"}
              </span>
              {dateRange.to && dateRange.from && (
                <>
                  <span>–</span>
                  <span className="whitespace-nowrap">{dateRange.to.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-4 w-full">
        {/* Date Filter */}
        <DateFilterBar
          preset={preset}       setPreset={setPreset}
          customFrom={customFrom} setCustomFrom={setCustomFrom}
          customTo={customTo}   setCustomTo={setCustomTo}
        />

        {/* Tabs */}
{/* Tabs */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 sm:p-1.5 w-full">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-[#1C3044] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <tab.icon size={14} className="flex-shrink-0" />
                {/* Displays full name on tablet (sm) and up, truncated only on very small mobile devices */}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
              </button>
            ))}
          </div>

        {/* Tab description */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            {React.createElement(TABS.find(t => t.key === activeTab)?.icon || Users, { size: 12, className: "flex-shrink-0" })}
            <span>{TABS.find(t => t.key === activeTab)?.desc}</span>
          </div>
          {!universityId && (
            <span className="sm:ml-auto text-amber-500 font-medium flex items-center gap-1">
              <AlertCircle size={11} className="flex-shrink-0" />
              University ID not found – some data may not load
            </span>
          )}
        </div>

        {/* Tab Content */}
        <div className="w-full overflow-hidden">
          {activeTab === "students" && <StudentsTab dateRange={dateRange} />}
          {activeTab === "staff"    && <StaffTab    dateRange={dateRange} />}
          {activeTab === "expenses" && <ExpensesTab dateRange={dateRange} />}
        </div>
      </div>
    </div>
  );
}