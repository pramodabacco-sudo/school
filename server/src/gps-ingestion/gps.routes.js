import express from "express";
const router = express.Router();

import * as controller from "./gps.controller.js";
import { validateToken } from "./gps.middleware.js";

router.post("/location", validateToken, controller.handleLocation);

export default router;
