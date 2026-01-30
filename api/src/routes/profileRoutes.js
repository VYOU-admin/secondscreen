const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

// Get current user's profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, username, display_name, bio, profile_picture_url, created_at
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Update current user's profile
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { display_name, bio, profile_picture_url } = req.body;

    // Validate inputs
    if (display_name && display_name.length > 50) {
      return res.status(400).json({ ok: false, error: "Display name too long (max 50 characters)" });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ ok: false, error: "Bio too long (max 500 characters)" });
    }

    const result = await query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           profile_picture_url = COALESCE($3, profile_picture_url)
       WHERE id = $4
       RETURNING id, email, username, display_name, bio, profile_picture_url, created_at`,
      [display_name, bio, profile_picture_url, req.user.userId]
    );

    const user = result.rows[0];
    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get any user's public profile by username
router.get("/:username", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, display_name, bio, profile_picture_url, created_at
       FROM users
       WHERE username = $1`,
      [req.params.username]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;