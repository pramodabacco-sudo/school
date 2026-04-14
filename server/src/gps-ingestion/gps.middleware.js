const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_token";

export const validateToken = (req, res, next) => {
  try {
    // 🔑 Support token from multiple sources (device flexibility)
    const token =
      req.body?.api_token_data_auth ||
      req.headers["x-api-token"] ||
      req.headers["authorization"]?.replace("Bearer ", "");

    // ⚠️ Do NOT log full tokens in production
    console.log("🔐 Token received:", token ? "YES" : "NO");

    if (!token || token !== AUTH_TOKEN) {
      console.warn("❌ Unauthorized request");

      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    console.log("✅ Token validated");
    next();
  } catch (err) {
    next(err);
  }
};
