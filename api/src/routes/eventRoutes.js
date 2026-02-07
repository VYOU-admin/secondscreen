const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

// Get all events (with optional filters)
router.get("/", async (req, res) => {
  try {
    const { sport, status } = req.query;
    
    let sql = `
      SELECT e.*, 
             COUNT(DISTINCT r.id) as room_count,
             COUNT(DISTINCT r.id) FILTER (WHERE r.is_live = true) as live_room_count
      FROM events e
      LEFT JOIN rooms r ON r.event_id = e.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (sport) {
      conditions.push(`e.sport = $${params.length + 1}`);
      params.push(sport);
    }
    
    if (status === 'live') {
      conditions.push(`e.start_time <= NOW() AND (e.end_time IS NULL OR e.end_time >= NOW())`);
    } else if (status === 'upcoming') {
      conditions.push(`e.start_time > NOW()`);
    } else if (status === 'past') {
      conditions.push(`e.end_time < NOW()`);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    
    sql += ` GROUP BY e.id ORDER BY e.start_time DESC`;
    
    const result = await query(sql, params);
    res.json({ ok: true, events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get single event with its rooms
router.get("/:id", async (req, res) => {
  try {
    const eventResult = await query(
      `SELECT e.*, u.username as creator_username
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id::text
       WHERE e.id = $1`,
      [req.params.id]
    );
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }
    
    const roomsResult = await query(
      `SELECT r.*, u.username as creator_username
       FROM rooms r
       LEFT JOIN users u ON r.created_by = u.id::text
       WHERE r.event_id = $1
       ORDER BY r.is_live DESC, r.viewer_count DESC`,
      [req.params.id]
    );
    
    res.json({ 
      ok: true, 
      event: eventResult.rows[0],
      rooms: roomsResult.rows 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Create new event
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, sport, league, start_time, end_time, description, espn_url, image_url } = req.body;
    
    if (!title || !sport || !start_time) {
      return res.status(400).json({ 
        ok: false, 
        error: "Title, sport, and start_time are required" 
      });
    }
    
    const result = await query(
      `INSERT INTO events (title, sport, league, start_time, end_time, description, espn_url, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, sport, league, start_time, end_time, description, espn_url, image_url, req.user.userId.toString()]
    );
    
    res.json({ ok: true, event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Update event
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { title, sport, league, start_time, end_time, description, espn_url, image_url } = req.body;
    
    const result = await query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           sport = COALESCE($2, sport),
           league = COALESCE($3, league),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           description = COALESCE($6, description),
           espn_url = COALESCE($7, espn_url),
           image_url = COALESCE($8, image_url)
       WHERE id = $9 AND created_by = $10
       RETURNING *`,
      [title, sport, league, start_time, end_time, description, espn_url, image_url, req.params.id, req.user.userId.toString()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Event not found or unauthorized" });
    }
    
    res.json({ ok: true, event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;