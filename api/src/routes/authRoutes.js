const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ ok: false, error: "Email, password, and username required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim().toLowerCase();

    // Validate username format (alphanumeric and underscores only, 3-20 chars)
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      return res.status(400).json({ 
        ok: false, 
        error: "Username must be 3-20 characters (letters, numbers, underscores only)" 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [normalizedEmail, passwordHash, normalizedUsername]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ ok: true, user, token });
  } catch (err) {
    if (err.code === "23505") {
      // Check which field caused the duplicate
      if (err.constraint?.includes("email")) {
        return res.status(409).json({ ok: false, error: "Email already registered" });
      }
      if (err.constraint?.includes("username")) {
        return res.status(409).json({ ok: false, error: "Username already taken" });
      }
      return res.status(409).json({ ok: false, error: "Email or username already exists" });
    }
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await query(
      `SELECT id, email, username, password_hash
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const row = result.rows[0];
    if (!row) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: row.id, email: row.email, username: row.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      ok: true, 
      user: { id: row.id, email: row.email, username: row.username }, 
      token 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;