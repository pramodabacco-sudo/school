// main_backend/idCardControlls.js
// ─────────────────────────────────────────────────────────────────────────────
// All filtering uses the new direct universityId + superAdminId columns
// on IdCardOrder and IdCardTemplate — no subqueries needed.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient }     from "@prisma/client";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl }     from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();

const r2 = new S3Client({
  region:   "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;

const getSignedImageUrl = async (key) => {
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return await getSignedUrl(r2, cmd, { expiresIn: 3600 });
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — extract caller identity from req.user (set by authMiddleware)
//
//   SuperAdmin JWT:  { id, role: "SUPER_ADMIN", universityId, userType }
//   Staff JWT:       { id, role: "ADMIN"|"TEACHER"|"FINANCE", schoolId,
//                      universityId, userType }
// ─────────────────────────────────────────────────────────────────────────────
const getCallerInfo = (req) => {
  const role         = req.user?.role        || null;
  const isSuperAdmin = role === "SUPER_ADMIN";
  return {
    role,
    isSuperAdmin,
    callerId:      req.user?.id            || null,   // SuperAdmin id OR staff User id
    userSchoolId:  req.user?.schoolId      || null,   // staff only
    universityId:  req.user?.universityId  || null,   // both
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET TEMPLATES — GET /api/id-cards/templates
//
//   SuperAdmin  → global defaults (schoolId=null, isDefault=true)
//                 + templates where superAdminId = caller id
//   Staff       → global defaults + templates where schoolId = their school
//   ?schoolId=  → SuperAdmin can further narrow to one school
// ─────────────────────────────────────────────────────────────────────────────
export const getTemplates = async (req, res) => {
  try {
    const { isSuperAdmin, callerId, userSchoolId } = getCallerInfo(req);
    const filterSchoolId = isSuperAdmin
      ? (req.query.schoolId || null)
      : userSchoolId;

    let where;
    if (isSuperAdmin) {
      if (filterSchoolId) {
        // Narrow to one specific school's templates + global defaults
        where = {
          isActive: true,
          OR: [
            { isDefault: true, schoolId: null },
            { schoolId: filterSchoolId, superAdminId: callerId },
          ],
        };
      } else {
        // All templates belonging to this super admin + global defaults
        where = {
          isActive: true,
          OR: [
            { isDefault: true, schoolId: null },
            { superAdminId: callerId },
          ],
        };
      }
    } else {
      // School staff — global defaults + own school's templates only
      if (!userSchoolId) return res.json({ templates: [] });
      where = {
        isActive: true,
        OR: [
          { isDefault: true, schoolId: null },
          { schoolId: userSchoolId },
        ],
      };
    }

    const templates = await prisma.idCardTemplate.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { uploadedAt: "desc" }],
    });

    const withUrls = await Promise.all(
      templates.map(async (t) => ({
        id:           t.id,
        title:        t.title,
        description:  t.description,
        imageKey:     t.imageKey,
        imageUrl:     t.imageKey ? await getSignedImageUrl(t.imageKey) : null,
        isDefault:    t.isDefault,
        schoolId:     t.schoolId,
        superAdminId: t.superAdminId,
        isOwn:        isSuperAdmin
                        ? t.superAdminId === callerId
                        : t.schoolId === userSchoolId,
        uploadedAt:   t.uploadedAt,
        templateType: t.templateType,
        templateKey:  t.templateKey,
        primaryColor: t.primaryColor,
        accentColor:  t.accentColor,
        // Parse elementLayout + cardBlocks from the JSON description envelope
        ...((() => {
          try {
            const parsed = t.description ? JSON.parse(t.description) : null;
            if (parsed && parsed.__meta) {
              return {
                description:   parsed.text   || null,
                elementLayout: parsed.elementLayout || null,
                cardBlocks:    parsed.cardBlocks    || null,
              };
            }
          } catch {}
          return { description: t.description, elementLayout: null, cardBlocks: null };
        })()),
      }))
    );

    return res.json({ templates: withUrls });
  } catch (err) {
    console.error("getTemplates error:", err);
    return res.status(500).json({ error: "Failed to fetch templates." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE TEMPLATE — DELETE /api/id-cards/templates/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.idCardTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: "Template not found." });

    if (template.imageKey) {
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: template.imageKey }));
    }
    await prisma.idCardTemplate.delete({ where: { id } });

    return res.json({ message: "Template deleted successfully." });
  } catch (err) {
    console.error("deleteTemplate error:", err);
    return res.status(500).json({ error: "Failed to delete template." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PLACE ORDER — POST /api/id-cards/orders/place
//   Saves superAdminId + universityId directly on the order row.
// ─────────────────────────────────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const { isSuperAdmin, callerId, userSchoolId, universityId } = getCallerInfo(req);

    const {
      schoolId: bodySchoolId, templateId,
      classDetails = [],
      contactName, contactPhone, contactEmail, notes,
    } = req.body;

    // Staff can only place orders for their own school
    const schoolId = isSuperAdmin ? bodySchoolId : userSchoolId;

    if (!schoolId)
      return res.status(400).json({ error: "schoolId is required." });
    if (!Array.isArray(classDetails) || classDetails.length === 0)
      return res.status(400).json({ error: "classDetails must be a non-empty array." });

    for (const cd of classDetails) {
      if (!cd.className)
        return res.status(400).json({ error: "className is required for each class." });
      if (!cd.studentCount || Number(cd.studentCount) < 1)
        return res.status(400).json({ error: `Invalid studentCount for "${cd.className}".` });
    }

    const school = await prisma.school.findUnique({
      where:  { id: schoolId },
      select: { name: true, universityId: true, superAdminId: true },
    });
    if (!school) return res.status(404).json({ error: "School not found." });

    const totalCards = classDetails.reduce((sum, cd) => sum + Number(cd.studentCount), 0);

    const order = await prisma.idCardOrder.create({
      data: {
        schoolId,
        schoolName:   school.name,
        templateId:   templateId || null,
        classDetails,
        totalCards,
        contactName:  contactName  || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        notes:        notes        || null,
        status:       "PENDING",
        // ── NEW: store ownership directly on the row ──
        superAdminId: isSuperAdmin ? callerId : (school.superAdminId || null),
        universityId: school.universityId || universityId || null,
      },
    });

    return res.status(201).json({ message: "Order placed successfully.", order });
  } catch (err) {
    console.error("placeOrder error:", err);
    return res.status(500).json({ error: "Failed to place order." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE ORDER STATUS — PATCH /api/id-cards/orders/:id/status
// ─────────────────────────────────────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const valid = ["PENDING","CONFIRMED","PROCESSING","DISPATCHED","DELIVERED","CANCELLED"];
    if (!valid.includes(status))
      return res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` });

    const order = await prisma.idCardOrder.update({
      where: { id },
      data:  { status },
    });

    return res.json({ message: "Status updated.", order });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ error: "Failed to update status." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATS — GET /api/id-cards/stats
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderStats = async (req, res) => {
  try {
    const { isSuperAdmin, callerId, userSchoolId } = getCallerInfo(req);

    // Direct filter using the new columns — no subquery needed
    let where;
    if (isSuperAdmin) {
      const specificSchoolId = req.query.schoolId || null;
      where = specificSchoolId
        ? { schoolId: specificSchoolId, superAdminId: callerId }
        : { superAdminId: callerId };
    } else {
      if (!userSchoolId) return res.json({ totalOrders: 0, totalCards: 0, statusBreakdown: {}, recentOrders: [] });
      where = { schoolId: userSchoolId };
    }

    const [totalOrders, totalCardsAgg, byStatus, recentOrders] = await Promise.all([
      prisma.idCardOrder.count({ where }),
      prisma.idCardOrder.aggregate({ where, _sum: { totalCards: true } }),
      prisma.idCardOrder.groupBy({
        where,
        by:     ["status"],
        _count: { _all: true },
        _sum:   { totalCards: true },
      }),
      prisma.idCardOrder.findMany({
        where,
        orderBy: { orderedAt: "desc" },
        take:    5,
        select: {
          id: true, schoolName: true,
          totalCards: true, status: true, orderedAt: true,
        },
      }),
    ]);

    const statusBreakdown = {};
    for (const row of byStatus) {
      statusBreakdown[row.status] = {
        orderCount: row._count._all,
        totalCards: row._sum.totalCards || 0,
      };
    }

    return res.json({
      totalOrders,
      totalCards: totalCardsAgg._sum.totalCards || 0,
      statusBreakdown,
      recentOrders,
    });
  } catch (err) {
    console.error("getOrderStats error:", err);
    return res.status(500).json({ error: "Failed to fetch stats." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL ORDERS — GET /api/id-cards/orders
// ─────────────────────────────────────────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    const { isSuperAdmin, callerId, userSchoolId } = getCallerInfo(req);

    // Direct filter using the new columns — no subquery needed
    let where;
    if (isSuperAdmin) {
      const specificSchoolId = req.query.schoolId || null;
      where = specificSchoolId
        ? { schoolId: specificSchoolId, superAdminId: callerId }
        : { superAdminId: callerId };
    } else {
      if (!userSchoolId) return res.json({ orders: [] });
      where = { schoolId: userSchoolId };
    }

    const orders = await prisma.idCardOrder.findMany({
      where,
      orderBy: { orderedAt: "desc" },
      include: {
        template: {
          select: {
            id: true, title: true, imageKey: true,
            templateType: true, templateKey: true,
            primaryColor: true, accentColor: true,
          },
        },
      },
    });

    const withUrls = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        template: o.template
          ? {
              ...o.template,
              imageUrl: o.template.imageKey
                ? await getSignedImageUrl(o.template.imageKey)
                : null,
            }
          : null,
      }))
    );

    return res.json({ orders: withUrls });
  } catch (err) {
    console.error("getOrders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TEMPLATE COLORS — PATCH /api/id-cards/templates/:id/colors
//
//   If a school user edits a global default → clone it for their school.
//   If a super admin or school user edits their own template → update in place.
// ─────────────────────────────────────────────────────────────────────────────
export const updateTemplateColors = async (req, res) => {
  try {
    const { id } = req.params;
    const { primaryColor, accentColor } = req.body;

    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    if (primaryColor && !hexRe.test(primaryColor))
      return res.status(400).json({ error: "primaryColor must be a valid hex color." });
    if (accentColor && !hexRe.test(accentColor))
      return res.status(400).json({ error: "accentColor must be a valid hex color." });

    const existing = await prisma.idCardTemplate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Template not found." });

    const { isSuperAdmin, callerId, userSchoolId, universityId } = getCallerInfo(req);

    // School user editing a global default → clone for their school
    if (!isSuperAdmin && existing.isDefault && existing.schoolId === null) {
      if (!userSchoolId) {
        return res.status(400).json({ error: "Cannot determine your school. Please re-login." });
      }

      // Fetch school's superAdminId + universityId for the clone row
      const school = await prisma.school.findUnique({
        where:  { id: userSchoolId },
        select: { superAdminId: true, universityId: true },
      });

      const cloned = await prisma.idCardTemplate.create({
        data: {
          title:        existing.title,
          description:  existing.description,
          templateType: existing.templateType,
          templateKey:  existing.templateKey,
          imageKey:     existing.imageKey,
          isDefault:    false,
          isActive:     true,
          schoolId:     userSchoolId,
          superAdminId: school?.superAdminId || null,
          universityId: school?.universityId || universityId || null,
          primaryColor: primaryColor || existing.primaryColor,
          accentColor:  accentColor  || existing.accentColor,
        },
      });

      return res.json({
        message:  "Template color customized for your school.",
        template: cloned,
        cloned:   true,
      });
    }

    // Normal in-place update
    const template = await prisma.idCardTemplate.update({
      where: { id },
      data: {
        ...(primaryColor ? { primaryColor } : {}),
        ...(accentColor  ? { accentColor }  : {}),
      },
    });

    return res.json({ message: "Template colors updated.", template, cloned: false });
  } catch (err) {
    console.error("updateTemplateColors error:", err);
    return res.status(500).json({ error: "Failed to update template colors." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE CODED TEMPLATE — POST /api/id-cards/templates/coded
//
//   SuperAdmin → isDefault=true, schoolId=null, superAdminId=callerId
//   Staff      → isDefault=false, schoolId=their school, superAdminId from school
// ─────────────────────────────────────────────────────────────────────────────
export const createCodedTemplate = async (req, res) => {
  try {
    const { title, templateKey, primaryColor, accentColor, description, elementLayout, cardBlocks } = req.body;

    if (!title)       return res.status(400).json({ error: "title is required." });
    if (!templateKey) return res.status(400).json({ error: "templateKey is required." });

    const resolvedPrimary = primaryColor || "#1a5c38";
    const resolvedAccent  = accentColor  || "#c9a84c";

    const { isSuperAdmin, callerId, userSchoolId, universityId } = getCallerInfo(req);

    if (!isSuperAdmin && !userSchoolId) {
      return res.status(400).json({ error: "Cannot determine your school. Please re-login." });
    }

    // Resolve schoolId + superAdminId + universityId for the new row
    let rowSchoolId    = isSuperAdmin ? null : userSchoolId;
    let rowSuperAdminId = isSuperAdmin ? callerId : null;
    let rowUniversityId = universityId || null;

    if (!isSuperAdmin && userSchoolId) {
      const school = await prisma.school.findUnique({
        where:  { id: userSchoolId },
        select: { superAdminId: true, universityId: true },
      });
      rowSuperAdminId = school?.superAdminId || null;
      rowUniversityId = school?.universityId || universityId || null;
    }

    // ── Upsert by title + owner scope ──────────────────────────────────────
    // If a template with the same name already exists for this owner, UPDATE
    // its colors/key instead of creating a duplicate.
    const existingByName = await prisma.idCardTemplate.findFirst({
      where: {
        title,
        templateType: "CODED",
        schoolId:     rowSchoolId,
        superAdminId: rowSuperAdminId,
      },
    });

    // Pack elementLayout + cardBlocks into the description field as a JSON envelope
    // (avoids needing a schema migration for new columns)
    const packDescription = (descText, elLayout, cbBlocks, existing) => {
      let prevParsed = null;
      try { prevParsed = existing?.description ? JSON.parse(existing.description) : null; } catch {}
      const prevEl = prevParsed?.__meta ? prevParsed.elementLayout : null;
      const prevCb = prevParsed?.__meta ? prevParsed.cardBlocks    : null;
      return JSON.stringify({
        __meta:        true,
        text:          descText  || (prevParsed?.__meta ? prevParsed.text : existing?.description) || null,
        elementLayout: elLayout  || prevEl || null,
        cardBlocks:    cbBlocks  || prevCb || null,
      });
    };

    if (existingByName) {
      // Update colors + layout in place — no duplicate error
      const updated = await prisma.idCardTemplate.update({
        where: { id: existingByName.id },
        data: {
          templateKey,
          primaryColor: resolvedPrimary,
          accentColor:  resolvedAccent,
          description:  packDescription(description, elementLayout, cardBlocks, existingByName),
        },
      });
      // Attach parsed fields to response so frontend can use them immediately
      const parsed = JSON.parse(updated.description || "{}");
      return res.json({
        template: { ...updated, elementLayout: parsed.elementLayout || null, cardBlocks: parsed.cardBlocks || null },
        updated: true,
      });
    }

    // No same-name template — create new
    const template = await prisma.idCardTemplate.create({
      data: {
        title,
        description:  packDescription(description, elementLayout, cardBlocks, null),
        templateType: "CODED",
        templateKey,
        primaryColor: resolvedPrimary,
        accentColor:  resolvedAccent,
        imageKey:     null,
        isDefault:    isSuperAdmin,
        isActive:     true,
        schoolId:     rowSchoolId,
        superAdminId: rowSuperAdminId,
        universityId: rowUniversityId,
      },
    });

    const parsedNew = JSON.parse(template.description || "{}");
    return res.status(201).json({
      template: { ...template, elementLayout: parsedNew.elementLayout || null, cardBlocks: parsedNew.cardBlocks || null },
    });
  } catch (err) {
    console.error("createCodedTemplate error:", err);
    return res.status(500).json({ error: "Failed to create coded template." });
  }
};