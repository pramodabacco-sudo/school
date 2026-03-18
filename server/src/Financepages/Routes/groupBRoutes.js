import { Router } from "express";
import {
  getJuniorTeachersBySchool,
  createGroupBSalary,
  getGroupBSalaryList,
  getGroupBSalaryHistoryBySchool,
  getGroupBTeacherHistory,
  updateGroupBSalary,
  payGroupBSalary,
  holdGroupBSalary,
  deleteGroupBSalary,
} from "../Controls/groupBController.js";

const router = Router();

// Junior teachers dropdown
router.get("/junior-teachers/:schoolId", getJuniorTeachersBySchool);

// Salary CRUD
router.post("/salary/create",                      createGroupBSalary);
router.get("/salary/list/:schoolId",               getGroupBSalaryList);
router.get("/salary/history-by-school/:schoolId",  getGroupBSalaryHistoryBySchool);
router.get("/salary/history/:teacherId",           getGroupBTeacherHistory);
router.put("/salary/update/:salaryId",             updateGroupBSalary);
router.patch("/salary/pay/:salaryId",              payGroupBSalary);
router.patch("/salary/hold/:salaryId",             holdGroupBSalary);
router.delete("/salary/delete/:salaryId",          deleteGroupBSalary);

export default router;