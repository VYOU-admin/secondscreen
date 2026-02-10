const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { query } = require("../db");

let io;

function verifySocketToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const token = socket.handshake.auth?.token || null;
    const user = verifySocketToken(token);

    if (!user) {
      socket.emit("chat_error", { error: "Unauthorized" });
      socket.disconnect(true);
      return;
    }

    socket.data.userId = user.userId || user.id || null;
    socket.data.email = user.email || "user";

    console.log("Socket connected:", socket.id, socket.data.email);

    socket.on("join_room", async ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      
      // Track participant in database
      try {
        await query(
          `INSERT INTO room_participants (room_id, user_id, username, joined_at, last_seen)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (room_id, user_id) 
           DO UPDATE SET last_seen = NOW()`,
          [roomId, socket.data.userId ? socket.data.userId.toString() : null, socket.data.email]
        );

        // Update viewer count
        const countResult = await query(
          `SELECT COUNT(*) as count FROM room_participants WHERE room_id = $1`,
          [roomId]
        );
        
        await query(
          `UPDATE rooms SET viewer_count = $1 WHERE id = $2`,
          [countResult.rows[0].count, roomId]
        );

        // Broadcast updated viewer count to all in room
        io.to(roomId).emit("viewer_count_update", { 
          roomId, 
          count: parseInt(countResult.rows[0].count) 
        });

        // Get and broadcast participant list
        const participantsResult = await query(
          `SELECT user_id, username, joined_at 
           FROM room_participants 
           WHERE room_id = $1 
           ORDER BY joined_at ASC`,
          [roomId]
        );
        
        io.to(roomId).emit("participants_update", { 
          roomId, 
          participants: participantsResult.rows 
        });

      } catch (err) {
        console.error("Error tracking participant:", err);
      }
      
      // Load chat history from database
      try {
        const result = await query(
          "SELECT user_email, message_text, created_at FROM messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT 100",
          [roomId]
        );
        
        const history = result.rows.map(row => ({
          from: row.user_email,
          text: row.message_text,
          ts: new Date(row.created_at).getTime()
        }));
        
        // Send history to this user only
        socket.emit("chat_history", { messages: history });
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
      
      socket.emit("chat_joined", { roomId });
    });

    socket.on("chat_message", async ({ roomId, text }) => {
      if (!roomId || !text) return;

      const msg = {
        roomId,
        text: String(text).slice(0, 500),
        from: socket.data.email,
        ts: Date.now()
      };

      // Save message to database
      try {
        await query(
          "INSERT INTO messages (room_id, user_email, message_text) VALUES ($1, $2, $3)",
          [roomId, socket.data.email, msg.text]
        );
      } catch (err) {
        console.error("Error saving message:", err);
      }

      // Broadcast message to all users in the room
      io.to(roomId).emit("chat_message", msg);
    });

    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id);
      
      // Remove from all rooms they were in
      try {
        const userId = socket.data.userId;
        if (userId) {
          // Get rooms user was in
          const roomsResult = await query(
            `SELECT room_id FROM room_participants WHERE user_id = $1`,
            [userId ? userId.toString() : null]
          );
          
          // Remove from participants
          await query(
            `DELETE FROM room_participants WHERE user_id = $1`,
            [userId ? userId.toString() : null]
          );

          // Update viewer counts and broadcast for each room
          for (const row of roomsResult.rows) {
            const roomId = row.room_id;
            
            const countResult = await query(
              `SELECT COUNT(*) as count FROM room_participants WHERE room_id = $1`,
              [roomId]
            );
            
            await query(
              `UPDATE rooms SET viewer_count = $1 WHERE id = $2`,
              [countResult.rows[0].count, roomId]
            );

            io.to(roomId).emit("viewer_count_update", { 
              roomId, 
              count: parseInt(countResult.rows[0].count) 
            });

            // Broadcast updated participants
            const participantsResult = await query(
              `SELECT user_id, username, joined_at 
               FROM room_participants 
               WHERE room_id = $1 
               ORDER BY joined_at ASC`,
              [roomId]
            );
            
            io.to(roomId).emit("participants_update", { 
              roomId, 
              participants: participantsResult.rows 
            });
          }
        }
      } catch (err) {
        console.error("Error cleaning up participant on disconnect:", err);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initSocket, getIO };