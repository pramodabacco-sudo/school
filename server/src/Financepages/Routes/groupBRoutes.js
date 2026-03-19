import { Router } from "express";
import {
  getGroupBStaff,
  createGroupBSalary,
  getGroupBSalaryList,
  getGroupBSalaryHistoryBySchool,
  getGroupBStaffHistory,
  updateGroupBSalary,
  payGroupBSalary,
  holdGroupBSalary,
  deleteGroupBSalary,
} from "../Controls/groupBController.js";

const router = Router();

// ── Staff list (from StaffProfile, groupType = "Group B") ──────────────────
router.get("/staff/:schoolId", getGroupBStaff);

// ── Salary CRUD ───────────────────────────────────────────────────────────
router.post("/salary/create",                     createGroupBSalary);
router.get("/salary/list/:schoolId",              getGroupBSalaryList);
router.get("/salary/history-by-school/:schoolId", getGroupBSalaryHistoryBySchool);
router.get("/salary/history/:staffId",            getGroupBStaffHistory);
router.put("/salary/update/:salaryId",            updateGroupBSalary);
router.patch("/salary/pay/:salaryId",             payGroupBSalary);
router.patch("/salary/hold/:salaryId",            holdGroupBSalary);
router.delete("/salary/delete/:salaryId",         deleteGroupBSalary);

export default router;