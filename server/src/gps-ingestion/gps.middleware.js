const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_token";

export const validateToken = (req, res, next) => {
  try {
    const token = req.body?.api_token_data_auth;

    console.log("ENV TOKEN:", AUTH_TOKEN);
    console.log("REQ TOKEN:", token);

    if (!token || token !== AUTH_TOKEN) {
      console.log("❌ TOKEN MISMATCH");
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    console.log("✅ TOKEN MATCH");
    next();
  } catch (err) {
    next(err);
  }
};
