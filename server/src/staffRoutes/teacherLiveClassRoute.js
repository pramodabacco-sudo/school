// server/src/staffRoutes/teacherLiveClassRoute.js

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  getAttendance,
  markAttendance,
  // dropdowns
  getSubjectsDropdown,
  getAcademicYearsDropdown,
  getClassSectionsDropdown,
} from "../staffControlls/teacherLiveClassController.js";

const router = Router();
router.use(authMiddleware);

// Dropdowns
router.get("/dropdowns/subjects",       getSubjectsDropdown);
router.get("/dropdowns/academic-years", getAcademicYearsDropdown);
router.get("/dropdowns/class-sections", getClassSectionsDropdown);



// Attendance
router.get("/:id/attendance",  getAttendance);
router.post("/:id/attendance", markAttendance);

// CRUD
router.get("/",       getLiveClasses);
router.get("/:id",    getLiveClassById);
router.post("/",      createLiveClass);
router.put("/:id",    updateLiveClass);
router.delete("/:id", deleteLiveClass);

export default router;

// ── Register in staff.js ─────────────────────────────────────
// import teacherLiveClassRoute from "./staffRoutes/teacherLiveClassRoute.js";
// staff.use("/api/teacher/live-classes", teacherLiveClassRoute);