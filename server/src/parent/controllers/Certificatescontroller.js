// server/src/parent/controllers/Certificatescontroller.js
// ═══════════════════════════════════════════════════════════════
//  Parent — Certificates Controller + Redis caching
// ═══════════════════════════════════════════════════════════════

import { prisma } from "../../config/db.js";
import { getCachedSignedUrl } from "../../lib/urlCache.js";
import cache from "../../utils/cacheService.js";

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, msg,  status = 400) => res.status(status).json({ success: false, message: msg });

async function verifyParentOwnsStudent(parentId, studentId) {
  const link = await prisma.studentParent.findFirst({
    where: { parentId, studentId },
  });
  return !!link;
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/parent/certificates?studentId=
// ═══════════════════════════════════════════════════════════════
export const getCertificates = async (req, res) => {
  try {
    const parentId  = req.user?.id;
    const studentId = req.query.studentId;

    if (!parentId)  return err(res, "Unauthorized", 401);
    if (!studentId) return err(res, "studentId is required", 400);

    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns) return err(res, "Access denied", 403);

    // ── Cache check ──────────────────────────────────────────
    // NOTE: Signed URLs expire, so we use a shorter TTL key for certificates.
    // The signed URLs themselves are cached separately by getCachedSignedUrl.
    const cacheKey = `parent:certificates:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return ok(res, { data: JSON.parse(cached) });

    // ── Student + enrollment ──────────────────────────────────
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { personalInfo: true },
    });
    if (!student) return err(res, "Student not found", 404);

    const enrollment = await prisma.studentEnrollment.findFirst({
      where:   { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        academicYear: true,
        classSection: { include: { school: true } },
      },
    });

    const schoolId = enrollment?.classSection?.schoolId ?? null;

    // ── Fetch all certificates ────────────────────────────────
    const rawCerts = await prisma.certificate.findMany({
      where:   { studentId },
      orderBy: { issuedDate: "desc" },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    // ── Resolve signed URLs for UPLOADED certificates ─────────
    const certificates = await Promise.all(
      rawCerts.map(async (c) => {
        let fileUrl = c.fileUrl ?? null;
        if (c.source === "UPLOADED" && c.fileKey && schoolId) {
          try {
            fileUrl = await getCachedSignedUrl(schoolId, c.fileKey, 3600);
          } catch (e) {
            console.warn("[parent/getCertificates] signed URL error:", e.message);
          }
        }
        return {
          id:              c.id,
          title:           c.title ?? c.achievementText ?? "Certificate",
          achievementText: c.achievementText,
          description:     c.description ?? null,
          category:        c.category,
          source:          c.source,
          issuedDate:      c.issuedDate,
          academicYear:    c.academicYear ?? enrollment?.academicYear?.name ?? null,
          fileUrl,
          fileKey:         c.fileKey ?? null,
          fileType:        c.fileType ?? null,
          status:          c.status,
          eventName:       c.eventName ?? null,
          studentName:     c.studentName,
          uploadedBy:      c.uploadedBy ?? null,
        };
      })
    );

    // ── Stats ─────────────────────────────────────────────────
    const stats = {
      total:      certificates.length,
      uploaded:   certificates.filter(c => c.source === "UPLOADED").length,
      event:      certificates.filter(c => c.source === "EVENT").length,
      manual:     certificates.filter(c => c.source === "MANUAL").length,
      calculated: certificates.filter(c => c.source === "CALCULATED").length,
    };

    const school = enrollment?.classSection?.school
      ? {
          name:    enrollment.classSection.school.name,
          logoUrl: enrollment.classSection.school.logoUrl ?? null,
        }
      : {};

    const data = {
      student: {
        id:           studentId,
        firstName:    student.personalInfo?.firstName ?? student.name.split(" ")[0],
        lastName:     student.personalInfo?.lastName  ?? "",
        profileImage: student.personalInfo?.profileImage ?? null,
        classSection: enrollment?.classSection?.name ?? null,
        academicYear: enrollment?.academicYear?.name ?? null,
      },
      school,
      stats,
      certificates,
    };

    await cache.set(cacheKey, data);
    return ok(res, { data });

  } catch (e) {
    console.error("[parent/getCertificates]", e);
    return err(res, e.message ?? "Server error", 500);
  }
};