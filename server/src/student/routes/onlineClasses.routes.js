// server/src/student/routes/onlineClasses.routes.js

import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
  getLiveClasses,
  getLiveClassById,
} from "../controllers/onlineClasses.controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/",     getLiveClasses);
router.get("/:id",  getLiveClassById);

export default router;

// ── Register in student.js ────────────────────────────────────
// import onlineClassesRouter from "./student/routes/onlineClasses.routes.js";
// student.use("/online-classes", onlineClassesRouter);