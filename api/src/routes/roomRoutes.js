const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

// Get all rooms (optionally filtered by event)
router.get("/", async (req, res) => {
  try {
    const { event_id } = req.query;
    
    let sql = `
      SELECT r.*, u.username as creator_username,
             e.title as event_title, e.sport as event_sport
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id::text
      LEFT JOIN events e ON r.event_id = e.id
    `;
    
    const params = [];
    if (event_id) {
      sql += ` WHERE r.event_id = $1`;
      params.push(event_id);
    }
    
    sql += ` ORDER BY r.is_live DESC, r.viewer_count DESC, r.created_at DESC`;
    
    const result = await query(sql, params);
    res.json({ ok: true, rooms: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get single room details
router.get("/:id", async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.username as creator_username,
              e.title as event_title, e.sport as event_sport, e.espn_url as event_espn_url
       FROM rooms r
       LEFT JOIN users u ON r.created_by = u.id::text
       LEFT JOIN events e ON r.event_id = e.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }
    
    res.json({ ok: true, room: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Create new room
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, event_id, provider, event_label, espn_url } = req.body;
    
    if (!title || !event_id) {
      return res.status(400).json({ 
        ok: false, 
        error: "Title and event_id are required" 
      });
    }
    
    // Verify event exists
    const eventCheck = await query(`SELECT id FROM events WHERE id = $1`, [event_id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }
    
    const result = await query(
      `INSERT INTO rooms (title, event_id, provider, event_label, espn_url, created_by, creator_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, event_id, provider, event_label, espn_url, req.user.userId.toString(), req.user.userId]
    );
    
    res.json({ ok: true, room: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Join a room (set as user's active room)
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

// Update room status (go live, update viewer count, etc.)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { is_live, viewer_count } = req.body;
    
    const result = await query(
      `UPDATE rooms 
       SET is_live = COALESCE($1, is_live),
           viewer_count = COALESCE($2, viewer_count)
       WHERE id = $3 AND created_by = $4
       RETURNING *`,
      [is_live, viewer_count, req.params.id, req.user.userId.toString()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Room not found or unauthorized" });
    }
    
    res.json({ ok: true, room: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;