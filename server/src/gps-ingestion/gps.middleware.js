const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error("❌ AUTH_TOKEN is not set in environment");
}

export const validateToken = (req, res, next) => {
  try {
    const token = req.body?.api_token_data_auth;

    // ❗ Strict validation (production)
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Missing api_token_data_auth",
      });
    }

    if (token !== AUTH_TOKEN) {
      return res.status(401).json({
        status: "error",
        message: "Invalid api_token_data_auth",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
