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

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initSocket, getIO };