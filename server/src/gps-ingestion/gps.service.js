import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const processPayload = async (data = {}) => {
  try {
    const imei = String(data.device_id || "");

    if (!imei) {
      console.warn("⚠️ Missing IMEI");
      return false;
    }

    // 🔍 1. Find or create device
    let device = await prisma.device.findUnique({
      where: { imei },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          imei,
          name: `Device-${imei.slice(-4)}`,
        },
      });
      console.log("🆕 New device created:", imei);
    }

    // 📍 2. Save location
    await prisma.deviceLocation.create({
      data: {
        deviceId: device.id,
        latitude: Number(data.device_last_lat || 0),
        longitude: Number(data.device_last_long || 0),
        altitude: Number(data.device_last_altitude || 0),
        battery: Number(data.battery_level || 0),
        timestamp: data.date_time ? new Date(data.date_time) : new Date(),

        raw: data, // 🔥 store full payload
      },
    });

    console.log("📍 Location saved for:", imei);

    return true;
  } catch (err) {
    console.error("❌ DB Error:", err);
    return false;
  }
};
