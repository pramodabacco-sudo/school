// client/src/parent/pages/Marksresults/tokens.js
// Re-exports the same Stormy Morning palette used by the student marks page.
// All sub-components (SummaryCards, SubjectTable, etc.) import from this file
// so they remain identical in both portals.

export {
  C,
  GRADE_SCALE,
  calcGrade,
  pctColor,
  FONT,
  GLOBAL_CSS,
} from "../../../student/pages/marks/tokens.js";