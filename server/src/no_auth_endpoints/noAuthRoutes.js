// no_auth_endpoints/noAuthRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Mount in app.js:
//   import noAuthRoutes from "./no_auth_endpoints/noAuthRoutes.js";
//   app.use("/api/id-cards", noAuthRoutes);
// ─────────────────────────────────────────────────────────────────────────────

import express  from "express";
import multer   from "multer";
import { uploadTemplate, getAllOrders } from "./noAuthControlls.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, or WebP images allowed."));
  },
});

// 1. Upload template image — NO AUTH
// POST /api/id-cards/upload
// Form-data: file (image), title, description?
router.post("/upload", upload.single("file"), uploadTemplate);

// 3. Get all orders with full details — NO AUTH
// GET /api/id-cards/orders
// Query: ?schoolId= &status= &page= &limit=
router.get("/orders", getAllOrders);

export default router;