// server/src/parent/routes/marksRoutes.js
// ═══════════════════════════════════════════════════════════════
//  Parent Marks & Report Card Routes
//  All routes require:
//    • Parent auth middleware  → req.parent
//    • Query param             → ?studentId=<uuid>
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
  getExamGroups,
  getReportCard,
  getTermSummary,
} from "../controllers/marksController.js";

const router = Router();
router.use(authMiddleware);

// GET /marks/exam-groups?studentId=<uuid>
router.get("/exam-groups", getExamGroups);

// GET /marks/report/:assessmentGroupId?studentId=<uuid>
router.get("/report/:assessmentGroupId", getReportCard);

// GET /marks/term-summary/:termId?studentId=<uuid>
router.get("/term-summary/:termId", getTermSummary);

export default router;