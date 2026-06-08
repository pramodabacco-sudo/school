// client/src/utils/downloadExpenseExcel.js
//
// Supports three download modes controlled by `options.mode`:
//
//   "dateRange"  (default) — existing behaviour: filter by preset/custom range,
//                            produce "Expense Records" + "Category Summary" sheets.
//
//   "daily"      — one sheet per day found in the data (or filtered range),
//                  each sheet lists that day's expenses + daily total.
//                  Also produces a "Daily Summary" overview sheet.
//
//   "monthly"    — one sheet per month found in the data (or filtered range),
//                  each sheet lists that month's expenses + monthly total.
//                  Also produces a "Monthly Summary" overview sheet.
//
// Usage (Expense.jsx):
//   downloadExpenseExcel(allSections, { mode: "daily",    preset: "thisMonth", schoolName })
//   downloadExpenseExcel(allSections, { mode: "monthly",  preset: "all",       schoolName })
//   downloadExpenseExcel(allSections, { mode: "dateRange",preset: "today",     schoolName })

const DESIGN = {
  fontName: "Segoe UI",
  colors: {
    primary:   "1C3044",
    secondary: "27435B",
    accent:    "EEF4F8",
    zebra:     "F7FAFC",
    white:     "FFFFFF",
    green:     "1E4620",
    greenBg:   "E8F5E9",
    red:       "7A1C1C",
    redBg:     "FFEBEE",
    border:    "D0E1ED",
    totalBg:   "E1EDF5",
    dayHeader: "2E4D66",
  },
};

// ── date helpers ──────────────────────────────────────────────────────────────

function isoDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function endOfDay(d) {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}

function getDateRange(preset, customFrom, customTo) {
  const now = new Date();

  if (preset === "today")
    return { from: startOfDay(now), to: endOfDay(now), label: `Today (${isoDate(now)})` };

  if (preset === "yesterday") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return { from: startOfDay(y), to: endOfDay(y), label: `Yesterday (${isoDate(y)})` };
  }
  if (preset === "thisWeek") {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { from: startOfDay(mon), to: endOfDay(now), label: `This Week (${isoDate(mon)} – ${isoDate(now)})` };
  }
  if (preset === "thisMonth") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfDay(first), to: endOfDay(now), label: `This Month (${isoDate(first)} – ${isoDate(now)})` };
  }
  if (preset === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last  = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: startOfDay(first), to: endOfDay(last), label: `Last Month (${isoDate(first)} – ${isoDate(last)})` };
  }
  if (preset === "custom" && customFrom && customTo) {
    return {
      from:  startOfDay(new Date(customFrom)),
      to:    endOfDay(new Date(customTo)),
      label: `${isoDate(customFrom)} – ${isoDate(customTo)}`,
    };
  }
  return { from: null, to: null, label: "All Time" };
}

function flattenAndFilter(expenseSections, from, to) {
  const rows = [];
  for (const sec of expenseSections) {
    for (const item of sec.items) {
      rows.push({
        category:  sec.label,
        color:     sec.color,
        label:     item.label,
        amount:    Number(item.amount || 0),
        icon:      item.icon,
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
      });
    }
  }
  if (!from || !to) return rows;
  return rows.filter((r) => r.createdAt && r.createdAt >= from && r.createdAt <= to);
}

// ── border helpers ────────────────────────────────────────────────────────────

function thinBorder() {
  const c = { argb: DESIGN.colors.border };
  return { top: { style: "thin", color: c }, left: { style: "thin", color: c },
           bottom: { style: "thin", color: c }, right: { style: "thin", color: c } };
}

function boldBorder() {
  const c = { argb: DESIGN.colors.secondary };
  return { top: { style: "medium", color: c }, bottom: { style: "double", color: c },
           left: { style: "thin", color: { argb: DESIGN.colors.border } },
           right: { style: "thin", color: { argb: DESIGN.colors.border } } };
}

// ── sheet helpers ─────────────────────────────────────────────────────────────

function applyTitleRow(ws, cols, text, bgArgb = DESIGN.colors.primary) {
  ws.mergeCells(`A1:${String.fromCharCode(64 + cols)}1`);
  const r = ws.getRow(1); r.height = 38;
  const c = r.getCell(1);
  c.value     = text;
  c.font      = { name: DESIGN.fontName, size: 13, bold: true, color: { argb: DESIGN.colors.white } };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
  c.alignment = { vertical: "middle", horizontal: "center" };
}

function applyHeaderRow(ws, rowNum, headers, bgArgb = DESIGN.colors.secondary) {
  const r = ws.getRow(rowNum); r.height = 26;
  headers.forEach((h, i) => {
    const cell    = r.getCell(i + 1);
    cell.value     = h;
    cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.white } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "center" : i >= headers.length - 1 ? "right" : "left" };
    cell.border    = thinBorder();
  });
}

function writeDataRows(ws, startRow, rows, colCount) {
  rows.forEach((row, idx) => {
    const rn  = startRow + idx;
    const wr  = ws.getRow(rn); wr.height = 22;
    const bg  = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;

    row.forEach((val, ci) => {
      const cell    = wr.getCell(ci + 1);
      cell.value     = val;
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = { name: DESIGN.fontName, size: 10 };
      cell.border    = thinBorder();
      cell.alignment = { vertical: "middle", horizontal: ci === 0 ? "center" : ci === colCount - 1 ? "right" : "left" };
    });

    // Colour the amount column (last)
    wr.getCell(colCount).font = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.red } };
  });
}

function writeTotalRow(ws, rowNum, colCount, labelCol, label, total) {
  const r = ws.getRow(rowNum); r.height = 28;
  for (let i = 1; i <= colCount; i++) {
    const cell = r.getCell(i);
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.totalBg } };
    cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.primary } };
    cell.border    = boldBorder();
    cell.alignment = { vertical: "middle", horizontal: i <= labelCol ? "left" : "right" };
  }
  r.getCell(1).value       = label;
  r.getCell(colCount).value = total;
  r.getCell(colCount).font  = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.red } };
}

// ── Sheet: Expense Records (existing) ────────────────────────────────────────

function buildDetailSheet(workbook, rows, dateRange, schoolName) {
  const ws = workbook.addWorksheet("Expense Records", { views: [{ showGridLines: true }] });
  ws.columns = [
    { width: 5 }, { width: 26 }, { width: 30 },
    { width: 20, style: { numFmt: '"₹"#,##0.00' } }, { width: 22 },
  ];

  applyTitleRow(ws, 5, `${schoolName.toUpperCase()} — EXPENSE LEDGER`);

  // sub-header
  ws.mergeCells("A2:E2");
  const r2 = ws.getRow(2); r2.height = 20;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  r2.getCell(1).value =
    `Date Range: ${dateRange.label}  |  ${rows.length} record${rows.length !== 1 ? "s" : ""}  |  Generated: ${dateStr}`;
  r2.getCell(1).font      = { name: DESIGN.fontName, size: 9, bold: true, color: { argb: DESIGN.colors.white } };
  r2.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.secondary } };
  r2.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  ws.getRow(3).height = 8; // spacer

  applyHeaderRow(ws, 4, ["#", "Category", "Expense Item", "Amount (₹)", "Date Added"]);

  if (rows.length === 0) {
    ws.mergeCells("A5:E5");
    const warn = ws.getRow(5); warn.height = 30;
    warn.getCell(1).value     = `⚠ No expenses found for the selected date range (${dateRange.label}).`;
    warn.getCell(1).font      = { name: DESIGN.fontName, size: 10, italic: true, color: { argb: DESIGN.colors.red } };
    warn.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.redBg } };
    warn.getCell(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    warn.getCell(1).border    = thinBorder();
    return;
  }

  writeDataRows(ws, 5, rows.map((r, i) => [
    i + 1, r.category, r.label, r.amount,
    r.createdAt ? isoDate(r.createdAt) : "—",
  ]), 5);

  // Amount is col 4; Date Added is col 5 — total must land in col 4 explicitly
  const footerRowNum = rows.length + 5;
  const grandTotal   = rows.reduce((a, r) => a + r.amount, 0);
  const fr = ws.getRow(footerRowNum); fr.height = 28;
  for (let i = 1; i <= 5; i++) {
    const cell = fr.getCell(i);
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.totalBg } };
    cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.primary } };
    cell.border    = boldBorder();
    cell.alignment = { vertical: "middle", horizontal: i <= 2 ? "left" : "right" };
  }
  fr.getCell(1).value = `TOTAL  (${rows.length} items)`;
  fr.getCell(4).value = grandTotal;
  fr.getCell(4).font  = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.red } };
  fr.getCell(5).value = "";
}

// ── Sheet: Category Summary (existing) ───────────────────────────────────────

function buildCategorySheet(workbook, rows, allSections, dateRange) {
  const ws = workbook.addWorksheet("Category Summary", { views: [{ showGridLines: true }] });
  ws.columns = [{ width: 30 }, { width: 14 }, { width: 22, style: { numFmt: '"₹"#,##0.00' } }, { width: 14 }];

  applyTitleRow(ws, 4, `EXPENSE CATEGORY SUMMARY — ${dateRange.label.toUpperCase()}`);
  applyHeaderRow(ws, 2, ["Category", "Items", "Total Amount (₹)", "% of Total"]);

  const grandTotal = rows.reduce((a, r) => a + r.amount, 0);
  const catMap     = {};
  for (const r of rows) {
    if (!catMap[r.category]) catMap[r.category] = { count: 0, total: 0 };
    catMap[r.category].count++;
    catMap[r.category].total += r.amount;
  }

  const catRows = allSections.map((s) => ({
    label: s.label,
    count: catMap[s.label]?.count || 0,
    total: catMap[s.label]?.total || 0,
  }));

  catRows.forEach(({ label, count, total }, idx) => {
    const rn  = idx + 3;
    const row = ws.getRow(rn); row.height = 22;
    const bg  = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;
    const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) + "%" : "0%";

    [label, count, total, pct].forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value     = v;
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = { name: DESIGN.fontName, size: 10, ...(i === 2 && total > 0 ? { bold: true, color: { argb: DESIGN.colors.red } } : {}) };
      cell.border    = thinBorder();
      cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right" };
    });
  });

  writeTotalRow(ws, catRows.length + 3, 4, 1, "GRAND TOTAL", grandTotal);
  ws.getRow(catRows.length + 3).getCell(2).value = rows.length;
  ws.getRow(catRows.length + 3).getCell(4).value = "100%";
}

// ── Daily report ──────────────────────────────────────────────────────────────

/**
 * Groups rows by calendar day.
 * Returns Map<"YYYY-MM-DD" → { label: string, rows: [...] }> sorted ascending.
 */
function groupByDay(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!r.createdAt) continue;
    const key = r.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: isoDate(r.createdAt),
        rows: [],
      });
    }
    map.get(key).rows.push(r);
  }
  return new Map([...map.entries()].sort());
}

function buildDailySummarySheet(workbook, dayMap, dateRange, schoolName) {
  const ws = workbook.addWorksheet("Daily Summary", { views: [{ showGridLines: true }] });
  ws.columns = [
    { width: 22 }, { width: 14 },
    { width: 24, style: { numFmt: '"₹"#,##0.00' } }, { width: 18 },
  ];

  applyTitleRow(ws, 4, `${schoolName.toUpperCase()} — DAILY EXPENSE SUMMARY`);
  ws.mergeCells("A2:D2");
  const r2 = ws.getRow(2); r2.height = 18;
  r2.getCell(1).value     = `Period: ${dateRange.label}  |  Generated: ${isoDate(new Date())}`;
  r2.getCell(1).font      = { name: DESIGN.fontName, size: 9, bold: true, color: { argb: DESIGN.colors.white } };
  r2.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.secondary } };
  r2.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  applyHeaderRow(ws, 3, ["Date", "No. of Expenses", "Total Amount (₹)", "Cumulative (₹)"]);

  const days = [...dayMap.values()];
  let cumulative = 0;

  days.forEach(({ label, rows }, idx) => {
    const dayTotal = rows.reduce((a, r) => a + r.amount, 0);
    cumulative    += dayTotal;
    const rn = idx + 4;
    const wr = ws.getRow(rn); wr.height = 22;
    const bg = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;

    [label, rows.length, dayTotal, cumulative].forEach((v, i) => {
      const cell = wr.getCell(i + 1);
      cell.value     = v;
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = {
        name: DESIGN.fontName, size: 10,
        ...(i === 2 ? { bold: true, color: { argb: DESIGN.colors.red } } : {}),
        ...(i === 3 ? { color: { argb: DESIGN.colors.dayHeader } } : {}),
      };
      cell.border    = thinBorder();
      cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right" };
    });
  });

  const footerRow = days.length + 4;
  writeTotalRow(ws, footerRow, 4, 1, "GRAND TOTAL",
    days.reduce((a, d) => a + d.rows.reduce((s, r) => s + r.amount, 0), 0));
  ws.getRow(footerRow).getCell(2).value = days.reduce((a, d) => a + d.rows.length, 0);
  ws.getRow(footerRow).getCell(2).font  = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.primary } };
  ws.getRow(footerRow).getCell(2).alignment = { vertical: "middle", horizontal: "right" };
}

function buildDaySheet(workbook, dayLabel, rows) {
  // Sheet name: "01 Jun 2025" etc. — Excel tab names max 31 chars
  const sheetName = dayLabel.slice(0, 31);
  const ws = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });
  ws.columns = [
    { width: 5 }, { width: 26 }, { width: 30 },
    { width: 20, style: { numFmt: '"₹"#,##0.00' } },
  ];

  applyTitleRow(ws, 4, `EXPENSES — ${dayLabel.toUpperCase()}`, DESIGN.colors.dayHeader);
  applyHeaderRow(ws, 2, ["#", "Category", "Expense Item", "Amount (₹)"], DESIGN.colors.dayHeader);

  if (rows.length === 0) {
    ws.getRow(3).getCell(1).value = "No records for this day.";
    return;
  }

  writeDataRows(ws, 3, rows.map((r, i) => [i + 1, r.category, r.label, r.amount]), 4);
  writeTotalRow(ws, rows.length + 3, 4, 2, `TOTAL  (${rows.length} items)`,
    rows.reduce((a, r) => a + r.amount, 0));
}

// ── Monthly report ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function groupByMonth(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!r.createdAt) continue;
    const d   = r.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        rows:  [],
      });
    }
    map.get(key).rows.push(r);
  }
  return new Map([...map.entries()].sort());
}

function buildMonthlySummarySheet(workbook, monthMap, dateRange, schoolName) {
  const ws = workbook.addWorksheet("Monthly Summary", { views: [{ showGridLines: true }] });
  ws.columns = [
    { width: 22 }, { width: 14 },
    { width: 24, style: { numFmt: '"₹"#,##0.00' } }, { width: 18 },
  ];

  applyTitleRow(ws, 4, `${schoolName.toUpperCase()} — MONTHLY EXPENSE SUMMARY`);
  ws.mergeCells("A2:D2");
  const r2 = ws.getRow(2); r2.height = 18;
  r2.getCell(1).value     = `Period: ${dateRange.label}  |  Generated: ${isoDate(new Date())}`;
  r2.getCell(1).font      = { name: DESIGN.fontName, size: 9, bold: true, color: { argb: DESIGN.colors.white } };
  r2.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.secondary } };
  r2.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  applyHeaderRow(ws, 3, ["Month", "No. of Expenses", "Total Amount (₹)", "Cumulative (₹)"]);

  const months = [...monthMap.values()];
  let cumulative = 0;

  months.forEach(({ label, rows }, idx) => {
    const monthTotal = rows.reduce((a, r) => a + r.amount, 0);
    cumulative      += monthTotal;
    const rn = idx + 4;
    const wr = ws.getRow(rn); wr.height = 22;
    const bg = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;

    [label, rows.length, monthTotal, cumulative].forEach((v, i) => {
      const cell = wr.getCell(i + 1);
      cell.value     = v;
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = {
        name: DESIGN.fontName, size: 10,
        ...(i === 2 ? { bold: true, color: { argb: DESIGN.colors.red } } : {}),
        ...(i === 3 ? { color: { argb: DESIGN.colors.dayHeader } } : {}),
      };
      cell.border    = thinBorder();
      cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right" };
    });
  });

  const footerRow = months.length + 4;
  writeTotalRow(ws, footerRow, 4, 1, "GRAND TOTAL",
    months.reduce((a, m) => a + m.rows.reduce((s, r) => s + r.amount, 0), 0));
  ws.getRow(footerRow).getCell(2).value = months.reduce((a, m) => a + m.rows.length, 0);
  ws.getRow(footerRow).getCell(2).font  = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.primary } };
  ws.getRow(footerRow).getCell(2).alignment = { vertical: "middle", horizontal: "right" };
}

function buildMonthSheet(workbook, monthLabel, rows) {
  const sheetName = monthLabel.slice(0, 31);
  const ws = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });
  ws.columns = [
    { width: 5 }, { width: 26 }, { width: 30 },
    { width: 20, style: { numFmt: '"₹"#,##0.00' } }, { width: 22 },
  ];

  applyTitleRow(ws, 5, `EXPENSES — ${monthLabel.toUpperCase()}`, DESIGN.colors.primary);
  applyHeaderRow(ws, 2, ["#", "Category", "Expense Item", "Amount (₹)", "Date"]);

  if (rows.length === 0) {
    ws.getRow(3).getCell(1).value = "No records for this month.";
    return;
  }

  writeDataRows(ws, 3, rows.map((r, i) => [
    i + 1, r.category, r.label, r.amount,
    r.createdAt ? isoDate(r.createdAt) : "—",
  ]), 5);

  writeTotalRow(ws, rows.length + 3, 5, 2, `TOTAL  (${rows.length} items)`,
    rows.reduce((a, r) => a + r.amount, 0));
}

// ── workbook generator ────────────────────────────────────────────────────────

async function _generate(ExcelJS, expenseSections, options, dateRange, rows) {
  const { mode = "dateRange", schoolName = "School" } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = schoolName;

  if (mode === "daily") {
    const dayMap = groupByDay(rows);
    if (dayMap.size === 0) {
      // fallback: empty summary
      buildDailySummarySheet(workbook, dayMap, dateRange, schoolName);
    } else {
      buildDailySummarySheet(workbook, dayMap, dateRange, schoolName);
      for (const day of dayMap.values()) {
        buildDaySheet(workbook, day.label, day.rows);
      }
    }
  } else if (mode === "monthly") {
    const monthMap = groupByMonth(rows);
    if (monthMap.size === 0) {
      buildMonthlySummarySheet(workbook, monthMap, dateRange, schoolName);
    } else {
      buildMonthlySummarySheet(workbook, monthMap, dateRange, schoolName);
      for (const month of monthMap.values()) {
        buildMonthSheet(workbook, month.label, month.rows);
      }
    }
  } else {
    // dateRange (default)
    buildDetailSheet(workbook, rows, dateRange, schoolName);
    buildCategorySheet(workbook, rows, expenseSections, dateRange);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const today    = new Date().toISOString().slice(0, 10);
  const modeTag  = mode === "daily" ? "Daily" : mode === "monthly" ? "Monthly" : "DateRange";
  const rangeTag = dateRange.label.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
  const link     = document.createElement("a");
  link.href      = URL.createObjectURL(blob);
  link.download  = `Expenses_${schoolName.replace(/\s+/g, "-")}_${modeTag}_${rangeTag}_${today}.xlsx`;
  link.click();
}

// ── public entry point ────────────────────────────────────────────────────────

/**
 * @param {Array}  expenseSections  - full sections array from Expense.jsx state
 * @param {Object} options
 *   @param {"dateRange"|"daily"|"monthly"} [options.mode="dateRange"]
 *   @param {string} [options.preset="all"]        - "today"|"yesterday"|"thisWeek"|"thisMonth"|"lastMonth"|"custom"|"all"
 *   @param {string} [options.customFrom]           - ISO date string
 *   @param {string} [options.customTo]             - ISO date string
 *   @param {string} [options.schoolName="School"]
 */
export function downloadExpenseExcel(expenseSections, options = {}) {
  const {
    mode       = "dateRange",
    preset     = "all",
    customFrom = null,
    customTo   = null,
    schoolName = "School",
  } = options;

  const dateRange = getDateRange(preset, customFrom, customTo);
  const rows      = flattenAndFilter(expenseSections, dateRange.from, dateRange.to);

  const run = (ExcelJS) => _generate(ExcelJS, expenseSections, { mode, schoolName }, dateRange, rows);

  if (window.ExcelJS) {
    run(window.ExcelJS);
  } else {
    const script    = document.createElement("script");
    script.src      = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
    script.onload   = () => run(window.ExcelJS);
    script.onerror  = () => console.error("ExcelJS failed to load");
    document.head.appendChild(script);
  }
}