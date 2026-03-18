import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Match exact designation "Junior Teacher" from DB
const isJunior = (designation = "") =>
  designation.trim().toLowerCase() === "junior teacher";

const calcLeaveDeduction = (monthlySalary, leaveDays) => {
  const daily = (Number(monthlySalary) * 12) / 365;
  return Math.round(daily * Number(leaveDays) * 100) / 100;
};

// GET JUNIOR TEACHERS BY SCHOOL
export const getJuniorTeachersBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const teachers = await prisma.teacherProfile.findMany({
      where: { schoolId },
      select: {
        id: true, firstName: true, lastName: true,
        department: true, designation: true, qualification: true,
        salary: true, user: { select: { email: true } },
      },
    });
    res.json(teachers.filter(t => isJunior(t.designation)));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// CREATE MONTHLY SALARY
export const createGroupBSalary = async (req, res) => {
  try {
    const { teacherId, month, year, bonus = 0, deductions = 0, leaveDays = 0 } = req.body;
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: { select: { email: true } } },
    });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    if (!teacher.salary) return res.status(400).json({ message: "Teacher salary not defined" });

    const existing = await prisma.groupBStaffSalary.findFirst({ where: { teacherId, month, year } });
    if (existing) return res.status(400).json({ message: "Salary already generated for this month" });

    const leaveDeduction = calcLeaveDeduction(teacher.salary, leaveDays);
    const totalDeductions = Number(deductions) + leaveDeduction;
    const netSalary = Number(teacher.salary) + Number(bonus) - totalDeductions;

    const salary = await prisma.groupBStaffSalary.create({
      data: {
        teacherId, schoolId: teacher.schoolId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        teacherEmail: teacher.user?.email || "",
        month, year,
        basicSalary: teacher.salary,
        bonus: Number(bonus), deductions: totalDeductions,
        netSalary, leaveDays: Number(leaveDays), leaveDeduction,
      },
    });
    res.json(salary);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET CURRENT MONTH LIST BY SCHOOL
export const getGroupBSalaryList = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();

    const records = await prisma.groupBStaffSalary.findMany({
      where: { schoolId, month, year },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, department: true, designation: true, salary: true, user: { select: { email: true } } },
        },
      },
    });

    res.json(records.map(r => ({
      id: r.id, salaryId: r.id, teacherId: r.teacherId,
      teacher: { id: r.teacher.id, firstName: r.teacher.firstName, lastName: r.teacher.lastName, department: r.teacher.department, designation: r.teacher.designation, user: { email: r.teacher.user?.email } },
      teacherName: r.teacherName, teacherEmail: r.teacherEmail,
      month: r.month, year: r.year,
      basicSalary: Number(r.basicSalary), bonus: Number(r.bonus),
      deductions: Number(r.deductions), leaveDays: r.leaveDays ?? 0,
      leaveDeduction: Number(r.leaveDeduction), netSalary: Number(r.netSalary),
      status: r.status, paymentDate: r.paymentDate,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET ALL HISTORY BY SCHOOL
export const getGroupBSalaryHistoryBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const history = await prisma.groupBStaffSalary.findMany({
      where: { schoolId },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, department: true, designation: true, user: { select: { email: true } } },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    res.json(history.map(r => ({
      id: r.id, teacherId: r.teacherId,
      teacher: { id: r.teacher.id, firstName: r.teacher.firstName, lastName: r.teacher.lastName, department: r.teacher.department, designation: r.teacher.designation, user: { email: r.teacher.user?.email } },
      teacherName: r.teacherName, teacherEmail: r.teacherEmail,
      month: r.month, year: r.year,
      basicSalary: Number(r.basicSalary), bonus: Number(r.bonus),
      deductions: Number(r.deductions), leaveDays: r.leaveDays ?? 0,
      leaveDeduction: Number(r.leaveDeduction), netSalary: Number(r.netSalary),
      status: r.status, paymentDate: r.paymentDate,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET SINGLE TEACHER HISTORY
export const getGroupBTeacherHistory = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const history = await prisma.groupBStaffSalary.findMany({
      where: { teacherId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// UPDATE SALARY
export const updateGroupBSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { bonus = 0, deductions = 0, leaveDays = 0 } = req.body;
    const existing = await prisma.groupBStaffSalary.findUnique({
      where: { id: salaryId },
      include: { teacher: { select: { salary: true } } },
    });
    if (!existing) return res.status(404).json({ message: "Salary record not found" });

    const leaveDeduction = calcLeaveDeduction(existing.teacher.salary, leaveDays);
    const totalDeductions = Number(deductions) + leaveDeduction;
    const netSalary = Number(existing.teacher.salary) + Number(bonus) - totalDeductions;

    const updated = await prisma.groupBStaffSalary.update({
      where: { id: salaryId },
      data: { bonus: Number(bonus), deductions: totalDeductions, leaveDays: Number(leaveDays), leaveDeduction, netSalary },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PAY SALARY
export const payGroupBSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const existing = await prisma.groupBStaffSalary.findUnique({ where: { id: salaryId } });
    if (!existing) return res.status(404).json({ message: "Salary record not found" });
    const salary = await prisma.groupBStaffSalary.update({
      where: { id: salaryId },
      data: { status: "PAID", paymentDate: new Date() },
    });
    res.json(salary);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// HOLD SALARY
export const holdGroupBSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const existing = await prisma.groupBStaffSalary.findUnique({ where: { id: salaryId } });
    if (!existing) return res.status(404).json({ message: "Salary record not found" });
    const salary = await prisma.groupBStaffSalary.update({
      where: { id: salaryId },
      data: { status: "HOLD" },
    });
    res.json(salary);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// DELETE SALARY
export const deleteGroupBSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const existing = await prisma.groupBStaffSalary.findUnique({ where: { id: salaryId } });
    if (!existing) return res.status(404).json({ message: "Salary record not found" });
    await prisma.groupBStaffSalary.delete({ where: { id: salaryId } });
    res.json({ message: "Salary record deleted successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};