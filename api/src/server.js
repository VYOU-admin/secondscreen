const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const meRoutes = require("./routes/meRoutes");
const http = require("http");
const { Server } = require("./sockets/socket");
// const jwt = require("jsonwebtoken");
require("dotenv").config();

const { initSocket } = require("./sockets/socket");
const { query } = require("./db");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API running" });
});

app.get("/db-check", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);
app.use("/me", meRoutes);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_ORIGIN,
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// function verifySocketToken(token) {
//   if (!token) return null;
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET);
//   } catch {
//     return null;
//   }
// }

// io.on("connection", (socket) => {
//   const token = socket.handshake.auth?.token || null;
//   const user = verifySocketToken(token);

//   if (!user) {
//     socket.emit("chat_error", { error: "Unauthorized" });
//     socket.disconnect(true);
//     return;
//   }

//   socket.data.userId = user.userId || user.id || null;
//   socket.data.email = user.email || "user";

//   socket.on("join_room", ({ roomId }) => {
//     if (!roomId) return;
//     socket.join(roomId);
//     socket.emit("chat_joined", { roomId });
//   });

//   socket.on("chat_message", ({ roomId, text }) => {
//     if (!roomId || !text) return;
//     const msg = {
//       roomId,
//       text: String(text).slice(0, 500),
//       from: socket.data.email,
//       ts: Date.now()
//     };
//     io.to(roomId).emit("chat_message", msg);
//   });
// });

initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});



