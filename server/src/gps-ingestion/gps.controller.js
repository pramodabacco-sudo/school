import { processPayload } from "./gps.service.js";

export const handleLocation = async (req, res, next) => {
  try {
    const payload = req.body;

    // ⚠️ Basic validation
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({
        status: "error",
        message: "Invalid payload",
      });
    }

    if (!payload.device_id) {
      return res.status(400).json({
        status: "error",
        message: "Missing device_id",
      });
    }

    // 🚀 Process payload
    const result = await processPayload(payload);

    if (!result) {
      return res.status(400).json({
        status: "error",
        message: "Failed to process payload",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "OK",
    });
  } catch (error) {
    next(error);
  }
};
