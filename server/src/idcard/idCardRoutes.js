// server\src\idcard\idCardRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Mount in app.js:
//   import idCardRoutes    from "./main_backend/idCardRoutes.js";
//   import noAuthRoutes    from "./no_auth_endpoints/noAuthRoutes.js";
//   app.use("/api/id-cards", noAuthRoutes);   // no auth
//   app.use("/api/id-cards", idCardRoutes);   // superadmin auth
// ─────────────────────────────────────────────────────────────────────────────

import express        from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getTemplates,
  deleteTemplate,
  placeOrder,
  updateOrderStatus,
  getOrderStats,
} from "./idCardControlls.js";

const router = express.Router();

// ── Templates (SuperAdmin) ───────────────────────────────────────────────────

// GET    /api/id-cards/templates         — fetch all templates with signed URLs
router.get("/templates", authMiddleware, getTemplates);

// DELETE /api/id-cards/templates/:id     — delete a template
router.delete("/templates/:id", authMiddleware, deleteTemplate);

// ── Orders (SuperAdmin) ──────────────────────────────────────────────────────

// POST   /api/id-cards/orders/place      — place a new order for a school
router.post("/orders/place", authMiddleware, placeOrder);

// PATCH  /api/id-cards/orders/:id/status — update order status
router.patch("/orders/:id/status", authMiddleware, updateOrderStatus);

// GET    /api/id-cards/stats             — summary stats
router.get("/stats", authMiddleware, getOrderStats);

export default router;