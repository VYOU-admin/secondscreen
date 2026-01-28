const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

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

    socket.on("join_room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.emit("chat_joined", { roomId });
    });

    socket.on("chat_message", ({ roomId, text }) => {
      if (!roomId || !text) return;

      const msg = {
        roomId,
        text: String(text).slice(0, 500),
        from: socket.data.email,
        ts: Date.now()
      };

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

