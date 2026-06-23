// no_auth_endpoints/noAuthControlls.js
// ─────────────────────────────────────────────────────────────────────────────
// NO AUTH REQUIRED — used via Postman by platform team / separate project
//
// 1. POST /api/id-cards/upload     → Upload template image to Cloudflare R2
// 3. GET  /api/id-cards/orders     → Get all orders with full details
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient }     from "@prisma/client";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl }     from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 }    from "uuid";

const prisma = new PrismaClient();

// ── Cloudflare R2 client ─────────────────────────────────────────────────────
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
// 1. UPLOAD TEMPLATE — POST /api/id-cards/upload
//    NO AUTH
//    Form-data: { file, title, description?, schoolId? (omit = platform default), isDefault? }
//    - No schoolId  → isDefault=true  → visible to ALL schools
//    - With schoolId → isDefault=false → visible ONLY to that school
// ─────────────────────────────────────────────────────────────────────────────
export const uploadTemplate = async (req, res) => {
  try {
    const { title, description, schoolId } = req.body;
    const file = req.file;

    if (!file)  return res.status(400).json({ error: "Image file is required." });
    if (!title) return res.status(400).json({ error: "title is required." });

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype))
      return res.status(400).json({ error: "Only JPEG, PNG, or WebP images are allowed." });

    const ext      = file.originalname.split(".").pop().toLowerCase();
    const imageKey = `id-card-templates/${uuidv4()}.${ext}`;

    // Upload to R2
    await r2.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         imageKey,
      Body:        file.buffer,
      ContentType: file.mimetype,
    }));

    // No schoolId = platform default (visible to all)
    // With schoolId = school's own template (visible only to them)
    const isDefault = !schoolId;

    const template = await prisma.idCardTemplate.create({
      data: {
        title,
        description: description || null,
        imageKey,
        schoolId:   schoolId || null,
        isDefault,
      },
    });

    return res.status(201).json({
      message: isDefault
        ? "Platform default template uploaded — visible to all schools."
        : "School custom template uploaded — visible only to this school.",
      template: {
        id:          template.id,
        title:       template.title,
        description: template.description,
        imageKey:    template.imageKey,
        isDefault:   template.isDefault,
        schoolId:    template.schoolId,
        isActive:    template.isActive,
        uploadedAt:  template.uploadedAt,
      },
    });
  } catch (err) {
    console.error("uploadTemplate error:", err);
    return res.status(500).json({ error: "Failed to upload template." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET ALL ORDERS — GET /api/id-cards/orders
//    NO AUTH
//    Query: ?schoolId=  ?status=  ?page=1  ?limit=50
//    Returns full order details including classes, cards, contact, template
// ─────────────────────────────────────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const { schoolId, status, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (schoolId) where.schoolId = schoolId;
    if (status)   where.status   = status;

    const [orders, total] = await Promise.all([
      prisma.idCardOrder.findMany({
        where,
        orderBy: { orderedAt: "desc" },
        skip,
        take: Number(limit),
        include: {
          template: { select: { id: true, title: true, imageKey: true } },
          school:   { select: { id: true, name: true, phone: true, email: true } },
        },
      }),
      prisma.idCardOrder.count({ where }),
    ]);

    // Attach signed image URL to template
    const ordersWithUrls = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        template: o.template
          ? { ...o.template, imageUrl: await getSignedImageUrl(o.template.imageKey) }
          : null,
      }))
    );

    return res.json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      orders:     ordersWithUrls,
    });
  } catch (err) {
    console.error("getAllOrders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
};