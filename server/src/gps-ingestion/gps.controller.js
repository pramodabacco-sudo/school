import * as gpsService from "./gps.service.js";

export const handleLocation = async (req, res, next) => {
  try {
    await gpsService.processPayload(req.body);

    return res.status(200).json({
      status: "success",
      message: "OK",
    });
  } catch (error) {
    next(error);
  }
};
