// server/src/staffRoutes/superAdminActivityRoute.js

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  getSuperAdminActivities,
  getSuperAdminActivityById,
} from "../staffControlls/superAdminActivityController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getSuperAdminActivities);

router.get("/:id", getSuperAdminActivityById);

export default router;