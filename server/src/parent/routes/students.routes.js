import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { getParentStudents } from "../controllers/students.controller.js";

const router = Router();

router.use(authMiddleware);

// GET /parent/students
router.get("/", getParentStudents);

export default router;