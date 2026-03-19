import { Router } from "express";
import {
  getGroupCStaff,
  createGroupCSalary,
  getGroupCSalaryList,
  getGroupCSalaryHistoryBySchool,
  getGroupCStaffHistory,
  updateGroupCSalary,
  payGroupCSalary,
  holdGroupCSalary,
  deleteGroupCSalary,
} from "../Controls/groupCController.js";

const router = Router();

// ── Staff list (from StaffProfile, groupType = "Group C") ──────────────────
router.get("/staff/:schoolId", getGroupCStaff);

// ── Salary CRUD ───────────────────────────────────────────────────────────
router.post("/salary/create",                     createGroupCSalary);
router.get("/salary/list/:schoolId",              getGroupCSalaryList);
router.get("/salary/history-by-school/:schoolId", getGroupCSalaryHistoryBySchool);
router.get("/salary/history/:staffId",            getGroupCStaffHistory);
router.put("/salary/update/:salaryId",            updateGroupCSalary);
router.patch("/salary/pay/:salaryId",             payGroupCSalary);
router.patch("/salary/hold/:salaryId",            holdGroupCSalary);
router.delete("/salary/delete/:salaryId",         deleteGroupCSalary);

export default router;