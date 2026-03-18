// server/src/staffRoutes/teacherTimetableRoute.js

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getTodaySchedule,
  getDaySchedule,
  getWeekSchedule,
} from "../staffControlls/teacherTimetableController.js";

const router = Router();
router.use(authMiddleware);

// GET /api/teacher/timetable/today        → today's periods
// GET /api/teacher/timetable/week         → full week grouped by day
// GET /api/teacher/timetable/day/:weekday → specific day e.g. /day/MONDAY

router.get("/today",         getTodaySchedule);
router.get("/week",          getWeekSchedule);
router.get("/day/:weekday",  getDaySchedule);

export default router;

// ── Register in staff.js ─────────────────────────────────────────────────────
// import teacherTimetableRoute from "./staffRoutes/teacherTimetableRoute.js";
// staff.use("/api/teacher/timetable", teacherTimetableRoute);