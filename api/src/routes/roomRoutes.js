const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, provider, event_label, espn_url, creator_user_id, created_at
       FROM rooms
       ORDER BY created_at DESC`
    );
    res.json({ ok: true, rooms: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const roomId = req.params.id;

    const roomRes = await query(`SELECT id FROM rooms WHERE id = $1`, [roomId]);
    if (!roomRes.rows[0]) return res.status(404).json({ ok: false, error: "Room not found" });

    await query(`UPDATE users SET active_room_id = $1 WHERE id = $2`, [roomId, req.user.userId]);

    res.json({ ok: true, active_room_id: roomId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
