"use client";

import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ExtensionSidebarPage() {
  const [status, setStatus] = useState("Waiting for token…");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);

  // Keep the latest token available to refresh() without stale-closure issues
  const tokenRef = useRef(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  function setPill(text) {
    try {
      window.parent.postMessage({ type: "SS_STATUS", text }, "*");
    } catch {}
  }

  async function refresh() {
    try {
      setError("");

      const t = tokenRef.current;
      if (!t) {
        setRoom(null);
        setStatus("Not logged in");
        setPill("Not logged in");
        return;
      }

      setStatus("Loading room…");
      setPill("Loading…");

      const res = await fetch(`${API}/me/active-room`, {
        headers: { Authorization: `Bearer ${t}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (!data.room) {
        setRoom(null);
        setStatus("No active room");
        setPill("No active room");
        return;
      }

      setRoom(data.room);
      setStatus(`Loaded: ${data.room.title}`);
      setPill("Synced (auto)");
    } catch (err) {
      setRoom(null);
      setStatus("Error");
      setPill("Error");
      setError(err?.message || "Unknown error");
    }
  }

  useEffect(() => {
    // Listen for token from the extension (content script)
    function onMsg(e) {
      if (e?.data?.type === "SS_TOKEN") {
        const incoming = e.data.token || null;
        setToken(incoming);
        // Small delay to ensure state/ref updates before refresh
        setTimeout(() => refresh(), 50);
      }
    }

    window.addEventListener("message", onMsg);

    // Poll every 5 seconds in case active_room changes
    const interval = setInterval(() => refresh(), 5000);

    // Initial paint
    refresh();

    return () => {
      window.removeEventListener("message", onMsg);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        height: "100vh",
        padding: 12,
        fontFamily: "system-ui"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8
        }}
      >
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

      <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 12 }}>
        {status}
      </div>

      {error && (
        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12
          }}
        >
          <div style={{ fontWeight: 600 }}>Action needed</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Make sure you’re logged in on{" "}
            <b>secondscreen-chi.vercel.app</b> and joined a room.
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Error: {error}
          </div>
        </div>
      )}

      {!token && !error && (
        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: 12,
            padding: 12
          }}
        >
          <div style={{ fontWeight: 600 }}>Not logged in</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Open <b>secondscreen-chi.vercel.app</b> in a tab, log in, and refresh
            ESPN+.
          </div>
        </div>
      )}

      {token && !room && !error && status.includes("No active room") && (
        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: 12,
            padding: 12
          }}
        >
          <div style={{ fontWeight: 600 }}>No active room</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Go to your site → Rooms → open the room → click <b>Join Room</b>.
          </div>
        </div>
      )}

      {room && (
        <>
          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12
            }}
          >
            <div style={{ fontWeight: 600 }}>{room.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {room.provider} • {room.event_label || "No label"}
            </div>
          </div>

          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12
            }}
          >
            <div style={{ fontWeight: 600 }}>Creator Stream</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              (Placeholder) Next: store a playback URL in{" "}
              <code>room_streams</code> and render a video player here.
            </div>
          </div>

          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: 12,
              padding: 12
            }}
          >
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
