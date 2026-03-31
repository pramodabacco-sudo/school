// server/src/parent/routes/Certificatesroutes.js
// Mounted in parent.js as:
//   parent.use("/certificates", certificatesRoutes);
// Full path: GET /api/parent/certificates?studentId=<uuid>

import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { getCertificates } from "../controllers/Certificatescontroller.js";

const router = Router();
router.use(authMiddleware);

// GET /api/parent/certificates?studentId=<uuid>
router.get("/", getCertificates);

export default router;