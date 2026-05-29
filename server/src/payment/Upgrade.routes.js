import express from "express";
import {
  createUpgradeOrder,
  verifyUpgradePayment,
  getMySubscription,
  getSubscriptionTimeline,
  getLatestUpgradeDetails,
} from "./Upgrade.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ All routes require auth — superAdmin must be logged in
router.get("/me",              requireAuth, getMySubscription);
router.get("/timeline",        requireAuth, getSubscriptionTimeline);
router.get("/latest-details",  requireAuth, getLatestUpgradeDetails);

// ✅ Create order + verify — separate from the public payment flow
router.post("/create-order",    requireAuth, createUpgradeOrder);
router.post("/verify-payment",  requireAuth, verifyUpgradePayment);

export default router;