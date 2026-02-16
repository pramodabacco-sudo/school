//server\src\modules\auth\auth.routes.js
import express from "express";
import {
  staffLoginController,
  studentLoginController,
  parentLoginController,
} from "./auth.controller.js";

const router = express.Router();

// STAFF
router.post("/staff/login", staffLoginController);

// STUDENT
router.post("/student/login", studentLoginController);

// PARENT
router.post("/parent/login", parentLoginController);

export default router;
