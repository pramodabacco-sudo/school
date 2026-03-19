import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js"; // ✅ same as teachersRoutes
import {
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
} from "../staffControlls/staffController.js";

const router = express.Router();

/*
  Base Path (from server):
  /api/staff/profiles
*/

// ✅ authMiddleware added to every route — same pattern as teachersRoutes.js
// This populates req.user from the JWT so schoolId is available in controllers

router.get("/", authMiddleware, getStaff);
router.post("/", authMiddleware, createStaff);
router.patch("/:id", authMiddleware, updateStaff);
router.delete("/:id", authMiddleware, deleteStaff);

export default router;