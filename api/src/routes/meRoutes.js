const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  res.json({ ok: true, me: req.user });
});

router.get("/active-room", requireAuth, async (req, res) => {
  try {
    const userRes = await query(
      `SELECT active_room_id
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    const activeRoomId = userRes.rows[0]?.active_room_id;
    if (!activeRoomId) return res.json({ ok: true, room: null });

    const roomRes = await query(
      `SELECT r.id, r.title, r.provider, r.event_label, r.espn_url, r.creator_user_id,
              rs.is_live, rs.playback_url, rs.target_delay_ms, rs.updated_at
       FROM rooms r
       LEFT JOIN room_streams rs ON rs.room_id = r.id
       WHERE r.id = $1`,
      [activeRoomId]
    );

    res.json({ ok: true, room: roomRes.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
