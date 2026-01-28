"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ExtensionSidebarPage() {
  const [status, setStatus] = useState("Waiting for token…");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);

  const [chatStatus, setChatStatus] = useState("Disconnected");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  const socketRef = useRef(null);
  const tokenRef = useRef(null);
  const roomIdRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  function setPill(text) {
    try {
      window.parent.postMessage({ type: "SS_STATUS", text }, "*");
    } catch {}
  }

  async function refreshRoom() {
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

  function connectSocketIfPossible(nextRoom) {
    const t = tokenRef.current;
    if (!t) return;
    if (!nextRoom?.id) return;

    // Already connected to same room
    if (socketRef.current && roomIdRef.current === nextRoom.id && socketRef.current.connected) return;

    // Reset old socket
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    roomIdRef.current = nextRoom.id;
    setChatStatus("Connecting…");

    const s = io(API, {
      transports: ["websocket", "polling"],
      auth: { token: t }
    });

    socketRef.current = s;

    s.on("connect", () => {
      setChatStatus("Connected");
      s.emit("join_room", { roomId: nextRoom.id });
    });

    s.on("chat_joined", () => {
      setChatStatus("Joined room");
    });

    s.on("disconnect", () => {
      setChatStatus("Disconnected");
    });

    s.on("connect_error", (e) => {
      setChatStatus("Connect error");
      console.error("socket connect_error:", e?.message || e);
    });

    s.on("chat_error", (payload) => {
      setChatStatus("Chat error");
      console.error("chat_error:", payload);
    });

    s.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, msg].slice(-200));
    });
  }

  function sendMessage() {
    const s = socketRef.current;
    if (!s || !s.connected) return;

    const text = draft.trim();
    if (!text) return;

    const rid = roomIdRef.current;
    if (!rid) return;

    s.emit("chat_message", { roomId: rid, text });
    setDraft("");
  }

  useEffect(() => {
    function onMsg(e) {
      if (e?.data?.type === "SS_TOKEN") {
        setToken(e.data.token || null);
        setTimeout(() => refreshRoom(), 50);
      }
    }

    window.addEventListener("message", onMsg);

    refreshRoom();
    const interval = setInterval(() => refreshRoom(), 5000);

    return () => {
      window.removeEventListener("message", onMsg);
      clearInterval(interval);
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (room?.id) connectSocketIfPossible(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div style={{ background: "#000", color: "#fff", height: "100vh", padding: 12, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>SecondScreen</div>
        <button
          onClick={refreshRoom}
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
          <div style={{ fontWeight: 600 }}>Error</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>{error}</div>
        </div>
      )}

      {!token && !error && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Not logged in</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Open <b>secondscreen-chi.vercel.app</b>, log in, then refresh ESPN+.
          </div>
        </div>
      )}

      {token && !room && !error && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12, marginBottom: 12 }}>
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
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Chat: <b>{chatStatus}</b>
            </div>
          </div>

          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Live Chat</div>

            <div
              style={{
                height: 220,
                overflowY: "auto",
                border: "1px solid #222",
                borderRadius: 10,
                padding: 8,
                background: "#0b0b0b",
                marginBottom: 10
              }}
            >
              {messages.length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.7 }}>No messages yet.</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} style={{ fontSize: 12, marginBottom: 6 }}>
                    <span style={{ opacity: 0.75 }}>{m.from}:</span> {m.text}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  padding: "10px 10px",
                  borderRadius: 10,
                  border: "1px solid #333",
                  background: "#000",
                  color: "#fff",
                  fontSize: 12
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  border: "1px solid #333",
                  background: "#000",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
