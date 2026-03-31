// server/src/parent/controllers/profileController.js
// ═══════════════════════════════════════════════════════════════
//  Parent — Profile Controller + Redis caching
// ═══════════════════════════════════════════════════════════════

import { prisma } from "../../config/db.js";
import cache from "../../utils/cacheService.js";

async function verifyParentOwnsStudent(parentId, studentId) {
  const link = await prisma.studentParent.findFirst({
    where: { parentId, studentId },
  });
  return !!link;
}

// ── GET /api/parent/profile?studentId= ───────────────────────
export const getProfile = async (req, res) => {
  try {
    const parentId  = req.user?.id;
    const studentId = req.query.studentId;

    if (!parentId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!studentId)
      return res.status(400).json({ success: false, message: "studentId is required" });

    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns)
      return res.status(403).json({ success: false, message: "Access denied" });

    // ── Cache check ──────────────────────────────────────────
    const cacheKey = `parent:profile:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        personalInfo: true,
        enrollments: {
          include: {
            academicYear: true,
            classSection: {
              include: {
                stream:      true,
                course:      true,
                branch:      true,
                combination: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        parentLinks: {
          include: {
            parent: {
              select: {
                id: true, name: true, email: true,
                phone: true, occupation: true, profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    const response = { success: true, student };
    await cache.set(cacheKey, response);

    return res.json(response);
  } catch (err) {
    console.error("[parent/getProfile]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/parent/profile/documents?studentId= ─────────────
export const getDocuments = async (req, res) => {
  try {
    const parentId  = req.user?.id;
    const studentId = req.query.studentId;

    if (!parentId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!studentId)
      return res.status(400).json({ success: false, message: "studentId is required" });

    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns)
      return res.status(403).json({ success: false, message: "Access denied" });

    // ── Cache check ──────────────────────────────────────────
    const cacheKey = `parent:profile:documents:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const rawDocs = await prisma.studentDocumentInfo.findMany({
      where:   { studentId },
      orderBy: { uploadedAt: "desc" },
    });

    const documents = rawDocs.map(d => ({
      id:            d.id,
      documentName:  d.documentName,
      customLabel:   d.customLabel,
      fileType:      d.fileType,
      fileSizeBytes: d.fileSizeBytes,
      isVerified:    d.isVerified,
      verifiedAt:    d.verifiedAt,
      uploadedAt:    d.uploadedAt,
      url:           d.fileUrl ?? null,
    }));

    const response = { success: true, documents };
    await cache.set(cacheKey, response);

    return res.json(response);
  } catch (err) {
    console.error("[parent/getDocuments]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};