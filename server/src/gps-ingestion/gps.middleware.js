const AUTH_TOKEN = process.env.AUTH_TOKEN;

export const validateToken = (req, res, next) => {
  try {
    if (!AUTH_TOKEN) {
      return res.status(500).json({
        status: "error",
        message: "Server misconfiguration: AUTH_TOKEN missing",
      });
    }

    const token = req.body?.api_token_data_auth;

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