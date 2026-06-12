// src/biometric/biometric.routes.js

import express from "express";
import {
  receivePunch,
  getSchools,
  getClasses,
  getDevicesFull,
  addDevice,
  toggleDevice,
  searchPersons,
  getMappings,
  assignMapping,
  deactivateMapping,
  getStats,
  getLogs,
} from "./biometric.controller.js";

const router = express.Router();

// ── Health ────────────────────────────────────────────────────────────────────
router.get("/test", (_req, res) =>
  res.json({ success: true, message: "Biometric API Working" })
);

// ── Dashboard stats ───────────────────────────────────────────────────────────
router.get("/stats", getStats);

// ── Device punch (called by biometric hardware) ───────────────────────────────
router.post("/punch", receivePunch);

// ── Schools & Classes ─────────────────────────────────────────────────────────
router.get("/schools", getSchools);
router.get("/classes", getClasses);   // ?schoolId=  → class sections with student counts

// ── Devices ───────────────────────────────────────────────────────────────────
// GET  /api/biometric/devices?schoolId=&includeInactive=true
// POST /api/biometric/devices
// PATCH /api/biometric/devices/:id/toggle
router.get   ("/devices",             getDevicesFull);
router.post  ("/devices",             addDevice);
router.patch ("/devices/:id/toggle",  toggleDevice);

// ── Person search ─────────────────────────────────────────────────────────────
// GET /api/biometric/persons?schoolId=&personType=&q=
router.get("/persons", searchPersons);

// ── Enrollment mappings ───────────────────────────────────────────────────────
// GET   /api/biometric/mappings?schoolId=&personType=&isActive=
// POST  /api/biometric/mappings
// PATCH /api/biometric/mappings/:id/deactivate
router.get  ("/mappings",                 getMappings);
router.post ("/mappings",                 assignMapping);
router.patch("/mappings/:id/deactivate",  deactivateMapping);

// ── Punch logs ────────────────────────────────────────────────────────────────
// GET /api/biometric/logs?schoolId=&from=&to=&personType=&mapped=&page=&limit=
router.get("/logs", getLogs);

export default router;