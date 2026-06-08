// server/src/controllers/superAdminFinance.controller.js
//
// READ-ONLY finance aggregation for SuperAdmin.
// Fetches data across ALL schools under the logged-in university.
//
// req.user.universityId is set by authMiddleware by normalising:
//   decoded.universityId  (new flat JWT)
//   decoded.university?.id (old nested JWT)
//
// NO writes — pure SELECT queries only.

import { prisma } from "../config/db.js";

// ─── tiny helper ─────────────────────────────────────────────────────────────
const toNum = (v) => Number(v || 0);

// ─────────────────────────────────────────────────────────────────────────────
// 1. STUDENT FINANCE
//    GET /api/superadmin-finance/student-finance
//
//    StudentFinance → school → university
//    Note: paidAmount / paymentDate / paymentMode may not exist in your current
//    schema.  We return them as-is (null/undefined) and the frontend handles
//    them gracefully with `|| 0` / `|| "—"` guards.
// ─────────────────────────────────────────────────────────────────────────────
export const getUniversityStudentFinance = async (req, res) => {
  try {
    const universityId = req.user?.universityId;

    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "universityId missing in token",
      });
    }

    const data = await prisma.studentList.findMany({
      where: {
        deletedAt: null,
        school: { universityId },
      },
      include: {
        school: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const normalized = data.map((s) => ({
      id:          String(s.id),
      name:        s.name,
      email:       s.email,
      phone:       s.phone,
      course:      s.course       || null,
      fees:        Number(s.fees        || 0),
      paidAmount:  Number(s.paidAmount  || 0),
      paymentMode: s.paymentMode  || null,
      paymentDate: s.paymentDate  || null,
      school:      s.school,
      createdAt:   s.createdAt,
    }));

    return res.json({
      success: true,
      count: normalized.length,
      data: normalized,
    });

  } catch (error) {
    console.error("[superAdminFinance] getUniversityStudentFinance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student finance",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. STAFF SALARY  (all 6 salary tables merged)
//    GET /api/superadmin-finance/staff-salary
//
//    Returns:
//    {
//      teacherSalary:  [...],
//      adminSalary:    [...],
//      financeSalary:  [...],
//      groupBSalary:   [...],
//      groupCSalary:   [...],
//      groupDSalary:   [...],
//    }
//
//    Each array item is normalised so the frontend normalizeStaffRecords()
//    helper can map it with _name / _email / _group / _date fields.
//
//    Soft-deleted records (deletedAt != null) are excluded everywhere.
// ─────────────────────────────────────────────────────────────────────────────
export const getUniversityStaffSalary = async (req, res) => {
  try {
    const universityId = req.user?.universityId;

    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "universityId missing in token — check authMiddleware",
      });
    }

    // ── Resolve school IDs for this university once ───────────────────────
    // Used for models that store schoolId directly.
    const schools = await prisma.school.findMany({
      where: { universityId },
      select: { id: true },
    });
    const schoolIds = schools.map((s) => s.id);

    if (schoolIds.length === 0) {
      // University exists but has no schools yet — return empty arrays
      return res.json({
        success: true,
        data: {
          teacherSalary: [],
          adminSalary:   [],
          financeSalary: [],
          groupBSalary:  [],
          groupCSalary:  [],
          groupDSalary:  [],
        },
      });
    }

    // ── Run all 6 queries in parallel ────────────────────────────────────
    const [
      teacherSalary,
      adminSalary,
      financeSalary,
      groupBSalary,
      groupCSalary,
      groupDSalary,
    ] = await Promise.all([

      // ── Teacher ──────────────────────────────────────────────────────
      // TeacherMonthlySalary has schoolId directly.
      // Snapshot fields: teacherName, teacherEmail.
      // Has soft-delete (deletedAt).
      prisma.teacherMonthlySalary.findMany({
        where: {
          schoolId: { in: schoolIds },
          deletedAt: null,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),

      // ── Admin ────────────────────────────────────────────────────────
      // AdminMonthlySalary has schoolId directly.
      // Snapshot fields: adminName, adminEmail.
      // No deletedAt in schema — omit filter.
      prisma.adminMonthlySalary.findMany({
        where: {
          schoolId: { in: schoolIds },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),

      // ── Finance ──────────────────────────────────────────────────────
      // FinanceMonthlySalary has NO direct schoolId column in the schema.
      // It links through: finance (User) → school → universityId.
      // We filter via the nested relation.
      prisma.financeMonthlySalary.findMany({
        where: {
          finance: {
            school: { universityId },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),

      // ── Group B ──────────────────────────────────────────────────────
      // GroupBStaffSalary has schoolId directly.
      // Snapshot fields: staffName, staffEmail, staffRole.
      // Has soft-delete (deletedAt).
      prisma.groupBStaffSalary.findMany({
        where: {
          schoolId: { in: schoolIds },
          deletedAt: null,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),

      // ── Group C ──────────────────────────────────────────────────────
      // GroupCStaffSalary has schoolId directly.
      // Same shape as Group B.
      // Has soft-delete (deletedAt).
      prisma.groupCStaffSalary.findMany({
        where: {
          schoolId: { in: schoolIds },
          deletedAt: null,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),

      // ── Group D ──────────────────────────────────────────────────────
      // GroupDStaffSalary has schoolId directly.
      // DIFFERENT schema: uses Int id, name/designation fields,
      // salaryPaid boolean (not a SalaryStatus enum), has deletedAt.
      prisma.groupDStaffSalary.findMany({
        where: {
          schoolId: { in: schoolIds },
          deletedAt: null,
        },
        orderBy: [{ id: "desc" }],
      }),
    ]);

    // ── Normalise each array so _name / _email / _group / _date
    //    are always present — matching what normalizeStaffRecords()
    //    on the frontend expects. ──────────────────────────────────────────
    //
    //    Teacher  → teacherName, teacherEmail
    //    Admin    → adminName, adminEmail
    //    Finance  → financeName, financeEmail
    //    Group B  → staffName, staffEmail
    //    Group C  → staffName, staffEmail
    //    Group D  → name (no email column), salaryPaid boolean

    const normTeacher = teacherSalary.map((r) => ({
      ...r,
      basicSalary: toNum(r.basicSalary),
      bonus:       toNum(r.bonus),
      deductions:  toNum(r.deductions),
      netSalary:   toNum(r.netSalary),
      // Alias fields the frontend normalizer reads
      _name:   r.teacherName  || "—",
      _email:  r.teacherEmail || "—",
      _group:  "Teacher",
      _date:   r.paymentDate  || r.createdAt,
    }));

    const normAdmin = adminSalary.map((r) => ({
      ...r,
      basicSalary: toNum(r.basicSalary),
      bonus:       toNum(r.bonus),
      deductions:  toNum(r.deductions),
      netSalary:   toNum(r.netSalary),
      _name:   r.adminName  || "—",
      _email:  r.adminEmail || "—",
      _group:  "Admin",
      _date:   r.paymentDate || r.createdAt,
    }));

    const normFinance = financeSalary.map((r) => ({
      ...r,
      basicSalary: toNum(r.basicSalary),
      bonus:       toNum(r.bonus),
      deductions:  toNum(r.deductions),
      netSalary:   toNum(r.netSalary),
      _name:   r.financeName  || "—",
      _email:  r.financeEmail || "—",
      _group:  "Finance",
      _date:   r.paymentDate  || r.createdAt,
    }));

    const normGroupB = groupBSalary.map((r) => ({
      ...r,
      basicSalary: toNum(r.basicSalary),
      bonus:       toNum(r.bonus),
      deductions:  toNum(r.deductions),
      netSalary:   toNum(r.netSalary),
      _name:   r.staffName  || "—",
      _email:  r.staffEmail || "—",
      _group:  "Group B",
      _date:   r.paymentDate || r.createdAt,
    }));

    const normGroupC = groupCSalary.map((r) => ({
      ...r,
      basicSalary: toNum(r.basicSalary),
      bonus:       toNum(r.bonus),
      deductions:  toNum(r.deductions),
      netSalary:   toNum(r.netSalary),
      _name:   r.staffName  || "—",
      _email:  r.staffEmail || "—",
      _group:  "Group C",
      _date:   r.paymentDate || r.createdAt,
    }));

    // Group D has a completely different shape — map it carefully
    const normGroupD = groupDSalary.map((r) => ({
      // keep raw fields
      id:          r.id,
      schoolId:    r.schoolId,
      createdAt:   r.createdAt,
      month:       null,  // GroupD has no month/year columns
      year:        null,
      leaveDays:   0,
      leaveDeduction: 0,
      paymentDate: null,
      // financials
      basicSalary: toNum(r.basicSalary),
      bonus:       toNum(r.allowances),   // GroupD calls it allowances
      deductions:  0,
      netSalary:   toNum(r.basicSalary) + toNum(r.allowances),
      // status — GroupD uses a boolean, convert to string for the UI badge
      status:      r.salaryPaid ? "PAID" : "PENDING",
      // normalised identity fields
      _name:  r.name        || r.designation || "—",
      _email: "—",           // GroupD has no email column
      _group: "Group D",
      _date:  r.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        teacherSalary: normTeacher,
        adminSalary:   normAdmin,
        financeSalary: normFinance,
        groupBSalary:  normGroupB,
        groupCSalary:  normGroupC,
        groupDSalary:  normGroupD,
      },
    });
  } catch (error) {
    console.error("[superAdminFinance] getUniversityStaffSalary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch salary data",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXPENSES
//    GET /api/superadmin-finance/expenses
//
//    Expense → school → university
//    Expense → ExpenseCategoryMap → ExpenseCategory
//
//    The existing school-level expenseController returns data grouped by
//    category.  The SuperAdmin finance page (ExpensesTab) expects a FLAT array:
//    [{ id, label, amount, createdAt, category, categoryColor }]
//
//    We fetch all non-deleted expenses with their category relation and flatten
//    them here so normalizeExpenses() on the frontend can work correctly.
// ─────────────────────────────────────────────────────────────────────────────
export const getUniversityExpenses = async (req, res) => {
  try {
    const universityId = req.user?.universityId;

    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "universityId missing in token — check authMiddleware",
      });
    }

    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,           // exclude soft-deleted
        school: { universityId },  // scope to this university
      },
      include: {
        school: {
          select: { id: true, name: true },
        },
        // ExpenseCategoryMap → ExpenseCategory
        categories: {
          include: {
            category: {
              select: { id: true, name: true, color: true, icon: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Flatten for the frontend ──────────────────────────────────────────
    // The frontend normalizeExpenses() already handles the nested shape, but
    // we do a light server-side flatten too so the payload is clean:
    //   category  → string name of the first category (or "Uncategorized")
    //   categoryColor → color from ExpenseCategory
    //
    // The raw `categories` array is also included so normalizeExpenses() can
    // re-derive it if needed.

    const flat = expenses.map((exp) => {
      const firstCat = exp.categories?.[0]?.category;
      return {
        id:            exp.id,
        label:         exp.label,
        amount:        Number(exp.amount || 0),
        icon:          exp.icon,
        createdAt:     exp.createdAt,
        schoolId:      exp.schoolId,
        school:        exp.school,
        // Flattened category info — matches what normalizeExpenses() expects
        category:      firstCat?.name  || "Uncategorized",
        categoryColor: firstCat?.color || null,
        // Raw nested relation kept so the frontend normalizer can also use it
        categories:    exp.categories,
      };
    });

    return res.json({
      success: true,
      count: flat.length,
      data: flat,
    });
  } catch (error) {
    console.error("[superAdminFinance] getUniversityExpenses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
};


// TEMPORARY DEBUG — delete after confirming
export const debugUniversityChain = async (req, res) => {
  try {
    const universityId = req.user?.universityId;

    const tokenShape = {
      universityId:     req.user?.universityId   ?? "MISSING",
      "university?.id": req.user?.university?.id ?? "MISSING",
      role:             req.user?.role            ?? "MISSING",
    };

    if (!universityId) {
      return res.json({ problem: "universityId missing from token", tokenShape });
    }

    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: { id: true, name: true },
    });

    const schools = await prisma.school.findMany({
      where: { universityId },
      select: { id: true, name: true },
    });
    const schoolIds = schools.map((s) => s.id);

    const [tc, ac, bc, cc, dc, sc] = await Promise.all([
      prisma.teacherMonthlySalary.count({ where: { schoolId: { in: schoolIds } } }),
      prisma.adminMonthlySalary.count({   where: { schoolId: { in: schoolIds } } }),
      prisma.groupBStaffSalary.count({    where: { schoolId: { in: schoolIds } } }),
      prisma.groupCStaffSalary.count({    where: { schoolId: { in: schoolIds } } }),
      prisma.groupDStaffSalary.count({    where: { schoolId: { in: schoolIds } } }),
      prisma.studentList.count({ where: { schoolId: { in: schoolIds }, deletedAt: null } }),
    ]);

    const anyStudentFinance = await prisma.studentFinance.findFirst({
      include: { school: { select: { universityId: true, name: true } } },
    });

    const anyTeacherSalary = await prisma.teacherMonthlySalary.findFirst({
      select: { id: true, schoolId: true },
    });

    return res.json({
      tokenShape,
      university,
      schools,
      rowCounts: {
        teacherSalary:  tc,
        adminSalary:    ac,
        groupBSalary:   bc,
        groupCSalary:   cc,
        groupDSalary:   dc,
        studentFinance: sc,
      },
      crossCheck: {
        firstStudentFinanceInDB: anyStudentFinance ?? "no rows",
        firstTeacherSalaryInDB:  anyTeacherSalary  ?? "no rows",
        yourSchoolIds:           schoolIds,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};