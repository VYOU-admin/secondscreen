const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const meRoutes = require("./routes/meRoutes");
require("dotenv").config();

const { initSocket } = require("./sockets/socket");
const { query } = require("./db");

const app = express();

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

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

initSocket(server);

