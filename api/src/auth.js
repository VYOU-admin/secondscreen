const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, error: "Missing Bearer token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, email, username }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
