import { uploadToCloud } from "./cloud.service.js";
import { prisma } from "../config/db.js"; // ✅ SAME INSTANCE

export async function saveBackup({ model, refId, data, action = "create" }) {
  try {

    // ✅ STEP 1: DEFINE NAME FIRST
 const name =
  data?.name ||
  data?.email ||              // 🔥 ADD THIS (VERY IMPORTANT)
  data?.username ||           // 🔥 ADD THIS
  data?.studentName ||
  data?.teacherName ||
  data?.label ||
  data?.title ||
  (data?.firstName && data?.lastName
    ? `${data.firstName} ${data.lastName}`
    : null) ||
  "unknown";

    // ✅ STEP 2: CREATE SAFE NAME
    const safeName = name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 30);

    // ✅ STEP 3: CREATE KEY
    const key = `${model}/${safeName}-${refId}/${action}-${Date.now()}.json`;

    const buffer = Buffer.from(JSON.stringify(data, null, 2));

    // ☁️ Upload
    await uploadToCloud(
      { buffer, mimetype: "application/json" },
      key
    );

    // 🔥 Extract schoolId
    const schoolId =
      data?.schoolId ||
      data?.school?.id ||
      data?.student?.schoolId ||
      data?.teacher?.schoolId ||
      null;

    // 🔥 Delete tracking
    const deletedAt = action === "delete" ? new Date() : null;

    // 🗄️ Save metadata
    await prisma.cloudBackup.create({
      data: {
        model,
        refId: String(refId),
        schoolId,
        name,
        fileKey: key,
        fileType: "application/json",
        deletedAt,
      },
    });

    console.log("✅ Backup saved:", key);

  } catch (error) {
    console.error("❌ Backup failed:", error.message);
  }
}