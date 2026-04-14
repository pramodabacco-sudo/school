import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔧 Safe number parser
const toNumber = (val, fallback = null) => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

// 🔧 Safe boolean parser
const toBoolean = (val) => {
  return val === true || val === "true" || val === 1 || val === "1";
};

export const processPayload = async (data = {}) => {
  try {
    const imei = String(data.device_id || "").trim();

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
          deviceNumber: data.device_number || null,
        },
      });

      console.log("🆕 New device created:", imei);
    } else {
      // 🔄 Update deviceNumber if changed
      if (data.device_number && device.deviceNumber !== data.device_number) {
        await prisma.device.update({
          where: { id: device.id },
          data: { deviceNumber: data.device_number },
        });
      }
    }

    // ⏱️ Normalize timestamp
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    // 📦 Handle batch GPS data (if present)
    if (Array.isArray(data.gps_data) && data.gps_data.length > 0) {
      for (const point of data.gps_data) {
        await prisma.deviceLocation.create({
          data: {
            deviceId: device.id,
            latitude: toNumber(point.lat),
            longitude: toNumber(point.lng),
            timestamp: point.timestamp ? new Date(point.timestamp) : timestamp,
            raw: point,
          },
        });
      }

      console.log("📦 Batch GPS data saved:", imei);
      return true;
    }

    // 📍 2. Save single location
    await prisma.deviceLocation.create({
      data: {
        deviceId: device.id,

        // 📍 GPS
        latitude: toNumber(data.device_last_lat),
        longitude: toNumber(data.device_last_long),
        altitude: toNumber(data.device_last_altitude),

        // 🔋 Basic
        battery: toNumber(data.battery_level),
        speed: toNumber(data.speed_kmph),
        signal: toNumber(data.signalLevel),

        // 🛰️ GPS quality
        satelliteCount: toNumber(data.satellite_count),
        heading: toNumber(data.heading),

        // 📈 Motion
        accelX: toNumber(data.accel_x),
        accelY: toNumber(data.accel_y),
        accelZ: toNumber(data.accel_z),

        accMagnitude: toNumber(data.acc_magnitude),
        motionAvg: toNumber(data.motion_avg),
        accStatus: data.acc_status || null,

        // 🔋 Advanced battery
        batteryVoltage: toNumber(data.battery_voltage_mV),
        batteryStatus: data.battery_status || null,

        // ⚙️ Flags
        historyFlag: toBoolean(data.history_flag),
        frequency: toNumber(data.frequency),

        // ⏱️ Time
        timestamp,

        // 🔥 Full payload
        raw: data,
      },
    });

    console.log("📍 Location saved:", imei);

    return true;
  } catch (err) {
    console.error("❌ DB Error:", err);
    return false;
  }
};
