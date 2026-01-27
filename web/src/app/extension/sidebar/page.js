"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ss_token");
}

export default function ExtensionSidebarPage() {
  const [status, setStatus] = useState("Loading…");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  function setPill(text) {
    try {
      window.parent.postMessage({ type: "SS_STATUS", text }, "*");
    } catch {}
  }

  async function refresh() {
    try {
      setError("");
      setStatus("Checking login…");
      setPill("Checking login…");

      const token = getToken();
      if (!token) {
        setStatus("Not logged in");
        setPill("Not logged in");
        setRoom(null);
        return;
      }

      const res = await fetch(`${API}/me/active-room`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (!data.room) {
        setStatus("No active room");
        setPill("No active room");
        setRoom(null);
        return;
      }

      setRoom(data.room);
      setStatus(`Loaded: ${data.room.title}`);
      setPill("Synced (auto)");
    } catch (err) {
      setRoom(null);
      setError(err.message);
      setStatus("Error");
      setPill("Error");
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000); // refresh every 5s
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "#000", color: "#fff", height: "100vh", padding: 12, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>SecondScreen</div>
        <button
          onClick={refresh}
          style={{
            border: "1px solid #333",
            background: "transparent",
            color: "#fff",
            borderRadius: 10,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 12 }}>{status}</div>

      {error && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Action needed</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Log in on <b>secondscreen-chi.vercel.app</b> and join a room.
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>Error: {error}</div>
        </div>
      )}

      {!room && !error && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600 }}>No active room</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Go to your site → Rooms → open the room → click <b>Join Room</b>.
          </div>
        </div>
      )}

      {room && (
        <>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{room.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {room.provider} • {room.event_label || "No label"}
            </div>
          </div>

          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>Creator Stream</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              (Placeholder) Next: store a playback URL in <code>room_streams</code> and render a video player here.
            </div>
          </div>

          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>Chat</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              (Placeholder) Next: connect Socket.IO for live chat.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
