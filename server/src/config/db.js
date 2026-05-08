// server/src/config/db.js

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { saveBackup } from "../utils/cloudBackup.js";
import { getFullData } from "../utils/getFullData.js";

export const prisma = new PrismaClient();

// ⚠️ Use same instance (avoid multiple DB connections)
const rawPrisma = prisma;

prisma.$use(async (params, next) => {
  let beforeData = null;
  let beforeUpdate = null;

  // ==============================
  // 🔹 PRE-FETCH (BEFORE DELETE)
  // ==============================
  if (params.action === "delete" && params.args?.where && rawPrisma[params.model]) {
    try {
      beforeData = await rawPrisma[params.model].findUnique({
        where: params.args.where,
      });
    } catch (e) {
      console.warn("Pre-delete fetch failed:", e.message);
    }
  }

  // ==============================
  // 🔹 PRE-FETCH (BEFORE UPDATE)
  // ==============================
  if (params.action === "update" && params.args?.where && rawPrisma[params.model]) {
    try {
      beforeUpdate = await rawPrisma[params.model].findUnique({
        where: params.args.where,
      });
    } catch (e) {
      console.warn("Pre-update fetch failed:", e.message);
    }
  }

  // ==============================
  // 🔹 EXECUTE ORIGINAL QUERY
  // ==============================
  const result = await next(params);

  // ==============================
  // ❌ SKIP BULK OPERATIONS
  // ==============================
  // if (params.action.endsWith("Many")) {
  //   return result;
  // }

  // ==============================
  // 🔥 ONLY TRACK WRITE OPERATIONS
  // ==============================
  if (["create", "update", "delete"].includes(params.action)) {
    try {
      let fullData = params.action === "delete" ? beforeData : result;

      // ==============================
      // 🔥 HANDLE STUDENT FULL DATA
      // ==============================
      if (
        [
          "Student",
          "StudentPersonalInfo",
          "StudentEnrollment",
          "StudentDocumentInfo",
          "StudentParent",
        ].includes(params.model)
      ) {
        const studentId =
          result?.id ||
          result?.studentId ||
          beforeData?.id ||
          beforeData?.studentId;

        if (studentId) {
          fullData = await rawPrisma.student.findUnique({
            where: { id: studentId },
            include: {
              personalInfo: true,
              documents: true,
              enrollments: {
                include: {
                  classSection: true,
                  academicYear: true,
                },
              },
              parentLinks: {
                include: { parent: true },
              },
            },
          });
        }
      }

      // ==============================
      // 🔥 OTHER MODELS (GENERIC)
      // ==============================
      else if (fullData?.id) {
        const fetched = await getFullData(params.model, fullData.id);
        if (fetched) fullData = fetched;
      }

      // ==============================
      // 🔥 NORMALIZE MODEL NAME
      // ==============================
      let modelName = params.model;

      if (
        [
          "StudentPersonalInfo",
          "StudentEnrollment",
          "StudentDocumentInfo",
          "StudentParent",
        ].includes(params.model)
      ) {
        modelName = "Student";
      }

      // ==============================
      // 🔥 FIX refId
      // ==============================
      let refId =
        result?.id ||
        result?.studentId ||
        beforeData?.id ||
        beforeData?.studentId ||
        params.args?.where?.id ||
        "unknown";

      if (
        [
          "StudentPersonalInfo",
          "StudentEnrollment",
          "StudentDocumentInfo",
          "StudentParent",
        ].includes(params.model)
      ) {
        refId = result?.studentId || beforeData?.studentId;
      }

      // ==============================
      // 🔥 ENSURE schoolId EXISTS
      // ==============================
      if (fullData && !fullData.schoolId && result?.schoolId) {
        fullData.schoolId = result.schoolId;
      }

      // ==============================
      // 🔥 DETECT SOFT DELETE
      // ==============================
      const isSoftDelete =
        params.action === "update" &&
        (params.args?.data?.isArchived === true ||
         params.args?.data?.isDeleted === true);

      // ==============================
      // 🔥 NON-BLOCKING CLOUD BACKUP
      // ==============================
      if (fullData) {
        await saveBackup({
  userId: params?.context?.userId || null,
  timestamp: new Date(),
  model: modelName,
  refId: String(refId),
  data:
    params.action === "update"
      ? { before: beforeUpdate, after: fullData }
      : fullData,
  action: isSoftDelete ? "softDelete" : params.action,
});
      }

    } catch (err) {
      console.error("Backup error:", err.message);
    }
  }

  return result;
});