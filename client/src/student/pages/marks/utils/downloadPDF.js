// client/src/student/pages/marks/utils/downloadPDF.js
// Single-page A4 portrait — tight, formal, school mark sheet.
//
// FIX: Logo (and student photo) are converted to base64 data-URLs before
//      being injected into the hidden iframe.  Browsers block cross-origin
//      image loads inside doc.write() iframes, so a raw https:// signed URL
//      never renders.  Converting to data: avoids that entirely.

import { GRADE_SCALE } from "../tokens.js";

function rl(status) {
  if (status === "pass") return "P";
  if (status === "fail") return "F";
  return "AB";
}

// ── Convert any URL (https or data:) to a base64 data-URL ────────
// Returns null on failure so the caller can show a placeholder.
async function toDataUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:")) return url; // already base64

  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Build a one-line address string from parts ───────────────────
function buildAddress(enrollment) {
  const parts = [
    enrollment?.schoolAddress,
    enrollment?.schoolCity,
    enrollment?.schoolState,
  ].filter(Boolean);
  return parts.join(", ");
}

// ── Build a contact line: phone · email ──────────────────────────
function buildContact(enrollment) {
  const parts = [
    enrollment?.schoolPhone  ? `Ph: ${enrollment.schoolPhone}`    : null,
    enrollment?.schoolEmail  ? `Email: ${enrollment.schoolEmail}` : null,
  ].filter(Boolean);
  return parts.join("  ·  ");
}

// ═══════════════════════════════════════════════════════════════
//  Main export — now async so callers must await it
// ═══════════════════════════════════════════════════════════════
export async function downloadReportPDF(reportData) {
  if (!reportData) return;

  const { student, enrollment, exam, subjectResults, summary } = reportData;

  // ── School ───────────────────────────────────────────────────
  const schoolName    = (enrollment?.schoolName   ?? "SCHOOL NAME").toUpperCase();
  const schoolAddr    = buildAddress(enrollment);
  const schoolContact = buildContact(enrollment);

  // ── Convert logo & student photo to base64 ───────────────────
  // This is the key fix: signed R2 URLs won't load inside a doc.write() iframe
  // unless they're converted to data: URLs first.
  const [logoDataUrl, studentPhotoDataUrl] = await Promise.all([
    toDataUrl(enrollment?.schoolLogoUrl ?? null),
    toDataUrl(student?.profileImage     ?? null),
  ]);

  // ── Exam / student meta ──────────────────────────────────────
  const className    = enrollment?.className    ?? "—";
  const academicYear = enrollment?.academicYear ?? "—";
  const examName     = exam?.name              ?? "Examination";
  const termName     = exam?.term?.name        ?? "";
  const studentName  = (student?.name          ?? "—").toUpperCase();
  const admNo        = student?.admissionNumber ?? "—";
  const rollNo       = student?.rollNumber      ?? "—";
  const grade        = enrollment?.grade        ?? "";
  const section      = enrollment?.section      ?? "";
  const dob          = student?.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—";
  const gender       = student?.gender ?? "—";
  const today        = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const examTitle    = [termName, examName].filter(Boolean).join(" — ").toUpperCase();
  const overallResult = summary?.hasFail ? "FAIL" : "PASS";

  // ── Subject rows ─────────────────────────────────────────────
  const subjects    = subjectResults ?? [];
  const subjectRows = subjects.map((s, i) => {
    const absent  = s.isAbsent;
    const minMark = s.passingMarks != null ? Math.floor(s.maxMarks * 0.33) : "—";
    const bg      = i % 2 === 0 ? "#f9f9f9" : "#fff";
    return `
      <tr style="background:${bg};${absent ? "color:#666;font-style:italic;" : ""}">
        <td class="tc">${i + 1}</td>
        <td class="tl" style="font-weight:600;">
          ${s.subjectName}${s.subjectCode
            ? `&nbsp;<span style="font-size:6pt;font-weight:400;color:#666;">(${s.subjectCode})</span>`
            : ""}
        </td>
        <td class="tc">${s.maxMarks}</td>
        <td class="tc">${s.passingMarks ?? "—"}</td>
        <td class="tc">${minMark}</td>
        <td class="tc fw" style="font-size:9.5pt;">${absent ? "AB" : (s.marksObtained ?? "—")}</td>
        <td class="tc">${absent ? "—" : (s.percentage != null ? `${s.percentage}%` : "—")}</td>
        <td class="tc fw" style="font-family:'Times New Roman',serif;font-size:9pt;">${absent ? "—" : (s.grade ?? "—")}</td>
        <td class="tc fw">${rl(s.resultStatus)}</td>
      </tr>`;
  }).join("");

  // ── Grade scale rows ─────────────────────────────────────────
  const gradeRows = GRADE_SCALE.map(g => `
    <tr>
      <td class="tc fw" style="font-family:'Times New Roman',serif;">${g.grade}</td>
      <td class="tc">${g.min}–${g.max}%</td>
      <td class="tl">${g.label}</td>
    </tr>`).join("");

  // ── Logo HTML (data-URL or placeholder) ─────────────────────
  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="Logo"
         style="height:56px;width:56px;object-fit:contain;border-radius:4px;" />`
    : `<div style="width:56px;height:56px;border:0.8px dashed #bbb;display:flex;
         align-items:center;justify-content:center;font-size:5.5pt;color:#bbb;
         font-style:italic;text-align:center;line-height:1.3;">School<br>Logo</div>`;

  // ── Student photo HTML (data-URL or placeholder) ────────────
  const studentPhotoHtml = studentPhotoDataUrl
    ? `<img src="${studentPhotoDataUrl}" alt="Student"
         style="width:48px;height:58px;object-fit:cover;border-radius:2px;border:0.8px solid #ccc;" />`
    : `<div style="width:48px;height:58px;border:0.8px dashed #bbb;display:flex;
         align-items:center;justify-content:center;font-size:5.5pt;color:#bbb;
         font-style:italic;text-align:center;line-height:1.3;">Student<br>Photo</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Mark Sheet — ${studentName}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  @page{
    size:A4 portrait;
    margin:8mm 10mm;
  }

  html,body{
    width:190mm;
    font-family:'Times New Roman',Times,serif;
    font-size:7.8pt;
    color:#000;
    background:#fff;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  /* ── Outer double-border frame ── */
  .page{
    width:190mm;
    border:2.5px double #000;
    position:relative;
  }
  .page::after{
    content:'';
    position:absolute;
    inset:4px;
    border:0.6px solid #888;
    pointer-events:none;
    z-index:0;
  }
  .page > * { position:relative; z-index:1; }

  /* ══════════════════════════════════════
     SCHOOL HEADER  (logo | text)
  ══════════════════════════════════════ */
  .hdr{
    display:grid;
    grid-template-columns:64px 1fr;
    align-items:center;
    gap:8px;
    padding:6px 10px 5px;
    border-bottom:2px solid #000;
  }
  .hdr-logo{
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .hdr-body{ text-align:center; }
  .hdr-name{
    font-size:14pt;
    font-weight:900;
    letter-spacing:1.5px;
    text-transform:uppercase;
    line-height:1.1;
  }
  .hdr-addr{
    font-size:6.5pt;
    color:#444;
    margin-top:2px;
    line-height:1.4;
  }
  .hdr-contact{
    font-size:6pt;
    color:#555;
    margin-top:1px;
  }
  .hdr-rule{
    border:none;
    border-top:0.8px solid #999;
    margin:3px 20mm 2px;
  }
  .hdr-doc{
    font-size:10pt;
    font-weight:900;
    letter-spacing:4px;
    text-transform:uppercase;
  }
  .hdr-exam{
    font-size:7pt;
    color:#333;
    margin-top:2px;
    font-style:italic;
    letter-spacing:0.3px;
  }

  /* ══════════════════════════════════════
     STUDENT INFO
  ══════════════════════════════════════ */
  .info-table{
    width:100%;
    border-collapse:collapse;
    border-bottom:1.5px solid #000;
  }
  .info-table td{
    border:none;
    border-right:1px solid #aaa;
    padding:3px 6px;
    vertical-align:top;
  }
  .info-table td:last-child{ border-right:none; }
  .info-table .photo-cell{
    width:64px;
    border-left:1px solid #aaa;
    border-right:none;
    text-align:center;
    vertical-align:middle;
  }
  .info-table tr.info-divider td{
    border-top:1px solid #aaa;
  }
  .lbl{
    font-size:5.8pt;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:0.4px;
    color:#444;
  }
  .val{
    font-size:8pt;
    font-weight:700;
    margin-top:1px;
    line-height:1.2;
  }

  /* ══════════════════════════════════════
     SECTION HEADING
  ══════════════════════════════════════ */
  .sec-head{
    font-size:7pt;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:2.5px;
    text-align:center;
    background:#ececec;
    border-bottom:1.5px solid #000;
    padding:3px 0;
  }

  /* ══════════════════════════════════════
     MARKS TABLE
  ══════════════════════════════════════ */
  table{ width:100%; border-collapse:collapse; }
  th,td{
    border:0.6px solid #bbb;
    padding:2.8px 3px;
    vertical-align:middle;
    line-height:1.25;
  }
  th{
    background:#ececec;
    font-size:6.2pt;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:0.3px;
    text-align:center;
    border-color:#888;
  }
  td{ font-size:7.8pt; }
  .tc{ text-align:center; }
  .tl{ text-align:left!important; padding-left:5px!important; }
  .fw{ font-weight:700; }
  .marks-table{ border:1.5px solid #000; }
  .marks-table thead th{ border-bottom:1.5px solid #000; }

  .tot-row td{
    border-top:2px solid #000!important;
    background:#ececec;
    font-weight:800;
    font-size:8.5pt;
  }

  /* ══════════════════════════════════════
     SUMMARY STRIP
  ══════════════════════════════════════ */
  .sum-strip{
    display:grid;
    grid-template-columns:1fr 1fr 1fr 1fr 1fr;
    border:1.5px solid #000;
    border-top:none;
  }
  .sc{
    padding:4px 5px;
    border-right:1px solid #999;
    text-align:center;
  }
  .sc:last-child{ border-right:none; }
  .slbl{
    font-size:5.5pt;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:0.5px;
    color:#444;
  }
  .sval{
    font-size:12pt;
    font-weight:900;
    line-height:1.1;
    margin-top:1px;
  }
  .ssub{ font-size:6pt; color:#555; margin-top:1px; }

  /* ══════════════════════════════════════
     BOTTOM 3-PANEL ROW
  ══════════════════════════════════════ */
  .bottom-row{
    display:grid;
    grid-template-columns:140px 1fr 150px;
    border:1.5px solid #000;
    border-top:none;
  }
  .panel-title{
    font-size:6pt;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:1.5px;
    text-align:center;
    background:#ececec;
    border-bottom:1px solid #999;
    padding:2.5px 0;
  }
  .grade-panel{ border-right:1px solid #999; }
  .grade-inner{ padding:5px 6px; }
  .grade-mini td{ border-color:#ccc; padding:2.5px 5px; font-size:7pt; }
  .rem-panel{
    border-right:1px solid #999;
    display:flex;
    flex-direction:column;
  }
  .rem-body{
    flex:1;
    padding:6px 10px;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .rem-lines{
    flex:1;
    display:flex;
    flex-direction:column;
    justify-content:space-evenly;
    padding:4px 0;
  }
  .rem-line{ border-bottom:0.7px solid #ccc; height:1px; }
  .rem-sig{ border-top:0.8px solid #000; padding-top:3px; margin-top:8px; }
  .rem-sig-lbl{ font-size:6pt; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
  .sig-panel{
    padding:6px 8px;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .sig-block{ text-align:center; }
  .sig-space{ height:28px; }
  .sig-draw{ border-top:0.8px solid #000; margin:0 4px 2px; }
  .sig-lbl{ font-size:6pt; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
  .stamp-wrap{ text-align:center; }
  .stamp-box{
    border:0.8px dashed #aaa;
    height:40px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:6pt;
    color:#aaa;
    font-style:italic;
  }
  .stamp-lbl{ font-size:5.5pt; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

  /* ══════════════════════════════════════
     FOOTER
  ══════════════════════════════════════ */
  .doc-footer{
    border-top:1.5px solid #000;
    padding:3px 8px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:6pt;
    color:#444;
    background:#fafafa;
  }

  @media print{
    html,body{ overflow:hidden; }
    .page{ page-break-after:avoid; page-break-inside:avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ══════════════════ HEADER ══════════════════ -->
  <div class="hdr">
    <div class="hdr-logo">${logoHtml}</div>
    <div class="hdr-body">
      <div class="hdr-name">${schoolName}</div>
      ${schoolAddr    ? `<div class="hdr-addr">${schoolAddr}</div>`       : ""}
      ${schoolContact ? `<div class="hdr-contact">${schoolContact}</div>` : ""}
      <hr class="hdr-rule"/>
      <div class="hdr-doc">Student Mark Sheet</div>
      <div class="hdr-exam">${examTitle}&nbsp;&nbsp;·&nbsp;&nbsp;Academic Year: ${academicYear}</div>
    </div>
  </div>

  <!-- ══════════════════ STUDENT INFO ══════════════════ -->
  <table class="info-table">
    <tbody>
      <tr>
        <td style="width:28%;">
          <div class="lbl">Student Name</div>
          <div class="val" style="font-size:8.5pt;letter-spacing:0.3px;">${studentName}</div>
        </td>
        <td style="width:15%;">
          <div class="lbl">Roll No.</div>
          <div class="val">${rollNo}</div>
        </td>
        <td style="width:19%;">
          <div class="lbl">Admission No.</div>
          <div class="val">${admNo}</div>
        </td>
        <td style="width:22%;">
          <div class="lbl">Class &amp; Section</div>
          <div class="val">${grade ? grade : ""}${section ? " – " + section : ""} ${className}</div>
        </td>
        <td class="photo-cell" rowspan="2">
          ${studentPhotoHtml}
        </td>
      </tr>
      <tr class="info-divider">
        <td>
          <div class="lbl">Date of Birth</div>
          <div class="val">${dob}</div>
        </td>
        <td>
          <div class="lbl">Gender</div>
          <div class="val">${gender}</div>
        </td>
        <td>
          <div class="lbl">Academic Year</div>
          <div class="val">${academicYear}</div>
        </td>
        <td>
          <div class="lbl">Exam</div>
          <div class="val">${examName}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- ══════════════════ MARKS TABLE ══════════════════ -->
  <div class="sec-head">Subject-wise Marks Statement</div>

  <table class="marks-table">
    <thead>
      <tr>
        <th style="width:22px;">#</th>
        <th class="tl" style="width:auto;">Subject</th>
        <th style="width:46px;">Max<br>Marks</th>
        <th style="width:46px;">Pass<br>Marks</th>
        <th style="width:46px;">Min<br>Marks</th>
        <th style="width:56px;">Marks<br>Obtained</th>
        <th style="width:50px;">Overall<br>%</th>
        <th style="width:38px;">Grade</th>
        <th style="width:38px;">Result</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRows}
    </tbody>
    <tfoot>
      <tr class="tot-row">
        <td class="tc">—</td>
        <td class="tl">Grand Total</td>
        <td class="tc">${summary?.totalMax ?? "—"}</td>
        <td class="tc">—</td>
        <td class="tc">—</td>
        <td class="tc" style="font-size:10pt;">${summary?.totalObtained ?? "—"}</td>
        <td class="tc">${summary?.percentage ?? "—"}%</td>
        <td class="tc" style="font-family:'Times New Roman',serif;font-size:10pt;">${summary?.grade ?? "—"}</td>
        <td class="tc" style="font-size:9pt;letter-spacing:1px;">${overallResult}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ══════════════════ SUMMARY STRIP ══════════════════ -->
  <div class="sum-strip">
    <div class="sc">
      <div class="slbl">Total Obtained</div>
      <div class="sval">${summary?.totalObtained ?? "—"}<span style="font-size:7pt;font-weight:400;"> / ${summary?.totalMax ?? "—"}</span></div>
    </div>
    <div class="sc">
      <div class="slbl">Percentage</div>
      <div class="sval">${summary?.percentage ?? "—"}%</div>
    </div>
    <div class="sc">
      <div class="slbl">Grade</div>
      <div class="sval">${summary?.grade ?? "—"}</div>
      <div class="ssub">${summary?.gradeLabel ?? ""}</div>
    </div>
    <div class="sc">
      <div class="slbl">Class Rank</div>
      <div class="sval">${summary?.rank != null ? `#${summary.rank}` : "—"}</div>
      <div class="ssub">of ${summary?.totalStudentsInClass ?? "—"} students</div>
    </div>
    <div class="sc" style="${summary?.hasFail ? "border:2px solid #000;margin:-1px;" : ""}">
      <div class="slbl">Final Result</div>
      <div class="sval" style="font-size:14pt;letter-spacing:2px;${summary?.hasFail ? "text-decoration:underline;" : ""}">${overallResult}</div>
    </div>
  </div>

  <!-- ══════════════════ BOTTOM 3-PANEL ══════════════════ -->
  <div class="bottom-row">

    <!-- Grade Scale -->
    <div class="grade-panel">
      <div class="panel-title">Grading Scale</div>
      <div class="grade-inner">
        <table class="grade-mini">
          <tbody>${gradeRows}</tbody>
        </table>
        <div style="font-size:6pt;color:#555;margin-top:5px;line-height:1.6;">
          P = Pass &nbsp;·&nbsp; F = Fail &nbsp;·&nbsp; AB = Absent
        </div>
      </div>
    </div>

    <!-- Class Teacher's Remarks -->
    <div class="rem-panel">
      <div class="panel-title">Class Teacher's Remarks</div>
      <div class="rem-body">
        <div class="rem-lines">
          <div class="rem-line"></div>
          <div class="rem-line"></div>
          <div class="rem-line"></div>
          <div class="rem-line"></div>
          <div class="rem-line"></div>
          <div class="rem-line"></div>
          <div class="rem-line"></div>
          <div class="rem-line"></div>
        </div>
        <div class="rem-sig">
          <div class="rem-sig-lbl">Class Teacher's Signature &amp; Date</div>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="sig-panel">
      <div class="panel-title" style="margin:-6px -8px 0; padding:2.5px 0;">Signatures</div>
      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-evenly; padding-top:6px;">
        <div class="sig-block">
          <div class="sig-space"></div>
          <div class="sig-draw"></div>
          <div class="sig-lbl">Principal</div>
        </div>
        <div class="sig-block">
          <div class="sig-space"></div>
          <div class="sig-draw"></div>
          <div class="sig-lbl">Parent / Guardian</div>
        </div>
      </div>
      <div class="stamp-wrap">
        <div class="stamp-box">School Stamp</div>
        <div class="stamp-lbl">Office Seal</div>
      </div>
    </div>

  </div>

  <!-- ══════════════════ FOOTER ══════════════════ -->
  <div class="doc-footer">
    <span>* Computer-generated mark sheet &nbsp;|&nbsp; P = Pass &nbsp; F = Fail &nbsp; AB = Absent</span>
    <span>${schoolName} &nbsp;|&nbsp; Date of Issue: ${today}</span>
  </div>

</div><!-- /.page -->

<script>
  (function() {
    var page = document.querySelector('.page');
    if (!page) return;
    var maxPx = (297 - 16) * 3.7795;
    var h = page.scrollHeight;
    if (h > maxPx) {
      var s = maxPx / h;
      page.style.transform = 'scale(' + s + ')';
      page.style.transformOrigin = 'top left';
    }
  })();
</script>
</body>
</html>`;

  // ── Print via hidden iframe ───────────────────────────────────
  // Images are already embedded as data: URLs so no network load needed.
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 3000);
    }, 400); // shorter delay is fine — no images to wait for
  } catch {
    const win = window.open("", "_blank", "width=820,height=1060");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }
}