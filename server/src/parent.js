// server/src/parent.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";


//imports

import attendanceRoutes from "./parent/routes/attendance.routes.js";
import studentsRoutes from "./parent/routes/students.routes.js";
import marksRoutes    from "./parent/routes/marksRoutes.js";
import timetableRoutes  from "./parent/routes/timetableRoutes.js";




dotenv.config();           

const parent = express();

parent.use(  
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);

parent.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

parent.use("/attendance", attendanceRoutes);
parent.use("/students", studentsRoutes);
parent.use("/marks",      marksRoutes);
parent.use("/timetable",  timetableRoutes);






export default parent;