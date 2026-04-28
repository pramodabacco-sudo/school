// src/superadmin/DeleteAccount.routes.js

import express from "express";
import { deleteAccount } from "../controllers/DeleteAccount.controller.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

const router = express.Router();

// 🔥 DELETE ACCOUNT ROUTE
router.delete("/", authMiddleware, deleteAccount);

export default router;