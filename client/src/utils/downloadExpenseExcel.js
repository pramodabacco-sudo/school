// client/src/utils/downloadExpenseExcel.js
//
// Usage:
//   downloadExpenseExcel(expenseSections, { preset, customFrom, customTo, schoolName })
//
// expenseSections shape:
// [{ key, label, color, icon, total, items: [{ id, label, amount, icon, createdAt? }] }]

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

// ── helpers ───────────────────────────────────────────────────────────────────

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
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
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
  if (preset === "custom" && customFrom && customTo)
    return { from: startOfDay(new Date(customFrom)), to: endOfDay(new Date(customTo)), label: `${isoDate(customFrom)} – ${isoDate(customTo)}` };
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
  return {
    top:    { style: "thin", color: c },
    bottom: { style: "thin", color: c },
    left:   { style: "thin", color: c },
    right:  { style: "thin", color: c },
  };
}

function boldBorder() {
  const c  = { argb: DESIGN.colors.secondary };
  const bc = { argb: DESIGN.colors.border };
  return {
    top:    { style: "medium", color: c },
    bottom: { style: "double", color: c },
    left:   { style: "thin",   color: bc },
    right:  { style: "thin",   color: bc },
  };
}

// ── PUBLIC EXPORT ─────────────────────────────────────────────────────────────

export function downloadExpenseExcel(expenseSections, options = {}) {
  const {
    preset     = "all",
    customFrom = null,
    customTo   = null,
    schoolName = "School",
  } = options;

  const dateRange = getDateRange(preset, customFrom, customTo);
  const rows      = flattenAndFilter(expenseSections, dateRange.from, dateRange.to);

  const run = (ExcelJS) => _generate(ExcelJS, rows, expenseSections, dateRange, schoolName);

  if (window.ExcelJS) {
    run(window.ExcelJS);
  } else {
    const script  = document.createElement("script");
    script.src    = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
    script.onload = () => run(window.ExcelJS);
    script.onerror = () => console.error("ExcelJS failed to load");
    document.head.appendChild(script);
  }
}

// ── workbook generator ────────────────────────────────────────────────────────

async function _generate(ExcelJS, rows, allSections, dateRange, schoolName) {
  const workbook   = new ExcelJS.Workbook();
  workbook.creator = schoolName;

  buildDetailSheet(workbook, rows, dateRange, schoolName);
  buildCategorySheet(workbook, rows, allSections, dateRange);
  buildDailySheet(workbook, rows, dateRange);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `${schoolName.replace(/\s+/g, "_")}_Expenses_${dateRange.label.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sheet: Expense Records ────────────────────────────────────────────────────

function buildDetailSheet(workbook, rows, dateRange, schoolName) {
  const ws = workbook.addWorksheet("Expense Records", { views: [{ showGridLines: true }] });

  ws.columns = [
    { width: 5,  style: { alignment: { horizontal: "center" } } },
    { width: 26 },
    { width: 30 },
    { width: 20, style: { numFmt: '"₹"#,##0.00', alignment: { horizontal: "right" } } },
    { width: 22, style: { alignment: { horizontal: "center" } } },
  ];

  // Row 1 — title
  ws.mergeCells("A1:E1");
  const r1 = ws.getRow(1); r1.height = 40;
  r1.getCell(1).value = `${schoolName.toUpperCase()} — EXPENSE LEDGER`;
  Object.assign(r1.getCell(1), {
    font:      { name: DESIGN.fontName, size: 15, bold: true, color: { argb: DESIGN.colors.white } },
    fill:      { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.primary } },
    alignment: { vertical: "middle", horizontal: "center" },
  });

  // Row 2 — date range info
  ws.mergeCells("A2:E2");
  const r2 = ws.getRow(2); r2.height = 22;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  r2.getCell(1).value = `Date Range: ${dateRange.label}  |  ${rows.length} record${rows.length !== 1 ? "s" : ""}  |  Generated: ${dateStr}`;
  Object.assign(r2.getCell(1), {
    font:      { name: DESIGN.fontName, size: 9, bold: true, color: { argb: DESIGN.colors.white } },
    fill:      { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.secondary } },
    alignment: { vertical: "middle", horizontal: "center" },
  });

  ws.getRow(3).height = 8; // spacer

  // Row 4 — column headers
  const headers = ["#", "Category", "Expense Item", "Amount (₹)", "Date Added"];
  const r4 = ws.getRow(4); r4.height = 28;
  headers.forEach((h, i) => {
    const cell     = r4.getCell(i + 1);
    cell.value     = h;
    cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.white } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.secondary } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "center" : i >= 3 ? "right" : "left" };
    cell.border    = thinBorder();
  });

  if (rows.length === 0) {
    ws.mergeCells("A5:E5");
    const warn = ws.getRow(5); warn.height = 30;
    warn.getCell(1).value = dateRange.from
      ? `⚠ No expenses found for the selected date range (${dateRange.label}). Ensure the backend returns "createdAt" per item.`
      : "⚠ No expense records found.";
    warn.getCell(1).font      = { name: DESIGN.fontName, size: 10, italic: true, color: { argb: DESIGN.colors.red } };
    warn.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.redBg } };
    warn.getCell(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    warn.getCell(1).border    = thinBorder();
    return;
  }

  // Data rows
  rows.forEach((row, idx) => {
    const wsRow  = ws.getRow(idx + 5);
    wsRow.height = 22;
    const bg     = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;

    wsRow.getCell(1).value = idx + 1;
    wsRow.getCell(2).value = row.category;
    wsRow.getCell(3).value = row.label;
    wsRow.getCell(4).value = row.amount;
    wsRow.getCell(5).value = row.createdAt
      ? row.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";

    for (let i = 1; i <= 5; i++) {
      const cell     = wsRow.getCell(i);
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = { name: DESIGN.fontName, size: 10, bold: i === 3 };
      cell.border    = thinBorder();
      cell.alignment = { vertical: "middle", horizontal: i === 1 ? "center" : i === 4 ? "right" : "left" };
    }
    wsRow.getCell(4).font = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.red } };
  });

  // Footer total row
  const footerRow  = ws.getRow(rows.length + 5);
  footerRow.height = 26;
  const total      = rows.reduce((a, r) => a + r.amount, 0);

  footerRow.getCell(1).value = "TOTAL";
  footerRow.getCell(2).value = `${rows.length} items`;
  footerRow.getCell(4).value = total;

  for (let i = 1; i <= 5; i++) {
    const cell     = footerRow.getCell(i);
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.totalBg } };
    cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.primary } };
    cell.border    = boldBorder();
    cell.alignment = { vertical: "middle", horizontal: i <= 2 ? "left" : "right" };
  }
  footerRow.getCell(4).font = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.red } };
}

// ── Sheet: Category Summary ───────────────────────────────────────────────────

function buildCategorySheet(workbook, rows, allSections, dateRange) {
  const ws = workbook.addWorksheet("Category Summary", { views: [{ showGridLines: true }] });

  ws.columns = [
    { width: 30 },
    { width: 14, style: { alignment: { horizontal: "right" } } },
    { width: 22, style: { numFmt: '"₹"#,##0.00', alignment: { horizontal: "right" } } },
    { width: 14, style: { alignment: { horizontal: "right" } } },
  ];

  // Title
  ws.mergeCells("A1:D1");
  const r1 = ws.getRow(1); r1.height = 34;
  r1.getCell(1).value = `EXPENSE CATEGORY SUMMARY — ${dateRange.label.toUpperCase()}`;
  Object.assign(r1.getCell(1), {
    font:      { name: DESIGN.fontName, size: 12, bold: true, color: { argb: DESIGN.colors.white } },
    fill:      { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.primary } },
    alignment: { vertical: "middle", horizontal: "center" },
  });

  // Sub-header
  const r2 = ws.getRow(2); r2.height = 24;
  ["Category", "Items", "Total Amount (₹)", "% of Total"].forEach((h, i) => {
    const cell     = r2.getCell(i + 1);
    cell.value     = h;
    cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.white } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.secondary } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right" };
    cell.border    = thinBorder();
  });

  const grandTotal = rows.reduce((a, r) => a + r.amount, 0);
  const catMap = {};
  for (const r of rows) {
    if (!catMap[r.category]) catMap[r.category] = { count: 0, total: 0 };
    catMap[r.category].count++;
    catMap[r.category].total += r.amount;
  }

  allSections.forEach(({ label }, idx) => {
    const count   = catMap[label]?.count || 0;
    const total   = catMap[label]?.total || 0;
    const row     = ws.getRow(idx + 3);
    row.height    = 22;
    const bg      = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;

    row.getCell(1).value = label;
    row.getCell(2).value = count;
    row.getCell(3).value = total;
    row.getCell(4).value = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) + "%" : "0%";

    for (let i = 1; i <= 4; i++) {
      const cell     = row.getCell(i);
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font      = { name: DESIGN.fontName, size: 10 };
      cell.border    = thinBorder();
      cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right" };
    }
    if (total > 0)
      row.getCell(3).font = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.red } };
  });

  // Grand total footer
  const footerRowNum = allSections.length + 3;
  const footer       = ws.getRow(footerRowNum);
  footer.height      = 28;

  footer.getCell(1).value = "GRAND TOTAL";
  footer.getCell(2).value = rows.length;
  footer.getCell(3).value = grandTotal;
  footer.getCell(4).value = "100%";

  for (let i = 1; i <= 4; i++) {
    const cell     = footer.getCell(i);
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.totalBg } };
    cell.font      = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.primary } };
    cell.border    = boldBorder();
    cell.alignment = { vertical: "middle", horizontal: i === 1 ? "left" : "right" };
  }
  footer.getCell(3).font = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.red } };
}

// ── Sheet: Daily Breakdown ────────────────────────────────────────────────────

function groupByDay(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!r.createdAt) continue;
    const key = r.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, { key, label: isoDate(r.createdAt), rows: [] });
    map.get(key).rows.push(r);
  }
  return new Map([...map.entries()].sort());
}

function buildDailySheet(workbook, rows, dateRange) {
  const ws = workbook.addWorksheet("Daily Breakdown", { views: [{ showGridLines: true }] });

  ws.columns = [
    { width: 26 },
    { width: 30 },
    { width: 20, style: { numFmt: '"₹"#,##0.00', alignment: { horizontal: "right" } } },
  ];

  // Title
  ws.mergeCells("A1:C1");
  const r1 = ws.getRow(1); r1.height = 34;
  r1.getCell(1).value = `DAILY EXPENSE BREAKDOWN — ${dateRange.label.toUpperCase()}`;
  Object.assign(r1.getCell(1), {
    font:      { name: DESIGN.fontName, size: 12, bold: true, color: { argb: DESIGN.colors.white } },
    fill:      { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.primary } },
    alignment: { vertical: "middle", horizontal: "center" },
  });

  const dayGroups = groupByDay(rows);
  let currentRow  = 2;

  if (dayGroups.size === 0) {
    ws.mergeCells(`A${currentRow}:C${currentRow}`);
    const warn     = ws.getRow(currentRow); warn.height = 30;
    warn.getCell(1).value     = "⚠ No dated expense records found.";
    warn.getCell(1).font      = { name: DESIGN.fontName, size: 10, italic: true, color: { argb: DESIGN.colors.red } };
    warn.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.redBg } };
    warn.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    return;
  }

  for (const { label, rows: dayRows } of dayGroups.values()) {
    // Day header
    ws.mergeCells(`A${currentRow}:C${currentRow}`);
    const dayHeader     = ws.getRow(currentRow); dayHeader.height = 26;
    dayHeader.getCell(1).value     = `📅  ${label}  —  ${dayRows.length} item${dayRows.length !== 1 ? "s" : ""}`;
    dayHeader.getCell(1).font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.white } };
    dayHeader.getCell(1).fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.dayHeader } };
    dayHeader.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    currentRow++;

    // Column sub-headers
    const subHeader = ws.getRow(currentRow); subHeader.height = 22;
    ["Category", "Expense Item", "Amount (₹)"].forEach((h, i) => {
      const cell     = subHeader.getCell(i + 1);
      cell.value     = h;
      cell.font      = { name: DESIGN.fontName, size: 9, bold: true, color: { argb: DESIGN.colors.primary } };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.accent } };
      cell.alignment = { vertical: "middle", horizontal: i === 2 ? "right" : "left" };
      cell.border    = thinBorder();
    });
    currentRow++;

    // Data rows
    dayRows.forEach((row, idx) => {
      const wsRow  = ws.getRow(currentRow); wsRow.height = 22;
      const bg     = idx % 2 === 0 ? DESIGN.colors.white : DESIGN.colors.zebra;

      wsRow.getCell(1).value = row.category;
      wsRow.getCell(2).value = row.label;
      wsRow.getCell(3).value = row.amount;

      for (let i = 1; i <= 3; i++) {
        const cell     = wsRow.getCell(i);
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.font      = { name: DESIGN.fontName, size: 10 };
        cell.border    = thinBorder();
        cell.alignment = { vertical: "middle", horizontal: i === 3 ? "right" : "left" };
      }
      wsRow.getCell(3).font = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.red } };
      currentRow++;
    });

    // Day subtotal
    const dayTotal  = dayRows.reduce((a, r) => a + r.amount, 0);
    const subtotal  = ws.getRow(currentRow); subtotal.height = 24;
    subtotal.getCell(1).value = "Day Total";
    subtotal.getCell(3).value = dayTotal;
    for (let i = 1; i <= 3; i++) {
      const cell     = subtotal.getCell(i);
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.totalBg } };
      cell.font      = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.primary } };
      cell.border    = boldBorder();
      cell.alignment = { vertical: "middle", horizontal: i === 3 ? "right" : "left" };
    }
    subtotal.getCell(3).font = { name: DESIGN.fontName, size: 10, bold: true, color: { argb: DESIGN.colors.red } };
    currentRow += 2; // spacer between days
  }

  // Grand total
  const grandTotal    = rows.reduce((a, r) => a + r.amount, 0);
  const grandRow      = ws.getRow(currentRow); grandRow.height = 28;
  grandRow.getCell(1).value = "GRAND TOTAL";
  grandRow.getCell(3).value = grandTotal;
  for (let i = 1; i <= 3; i++) {
    const cell     = grandRow.getCell(i);
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DESIGN.colors.totalBg } };
    cell.font      = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.primary } };
    cell.border    = boldBorder();
    cell.alignment = { vertical: "middle", horizontal: i === 3 ? "right" : "left" };
  }
  grandRow.getCell(3).font = { name: DESIGN.fontName, size: 11, bold: true, color: { argb: DESIGN.colors.red } };
}