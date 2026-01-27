"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = params.id;

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/rooms");
        const found = (data.rooms || []).find((r) => r.id === roomId);
        setRoom(found || null);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [roomId]);

  async function joinRoom() {
    setMsg("");
    setJoining(true);
    try {
      await apiFetch(`/rooms/${roomId}/join`, { method: "POST" });
      setMsg("✅ Joined. Now open ESPN+ in a tab — the extension sidebar will load this room automatically.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setJoining(false);
    }
  }

  const espnUrl = room?.espn_url || "https://plus.espn.com/";

  return (
    <main className="max-w-3xl mx-auto p-6">
      <a className="underline" href="/rooms">← Back</a>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {room ? (
        <>
          <h1 className="text-2xl font-semibold mt-4">{room.title}</h1>
          <p className="opacity-70 mt-1">{room.provider} • {room.event_label || "No label"}</p>

          <div className="mt-6 space-y-3">
            <button onClick={joinRoom} disabled={joining} className="w-full bg-black text-white p-3 rounded">
              {joining ? "Joining..." : "Join Room"}
            </button>

            {msg && <p className="text-sm">{msg}</p>}

            <a className="block w-full text-center border p-3 rounded" href={espnUrl} target="_blank" rel="noreferrer">
              Open ESPN+ in new tab
            </a>

            <div className="border rounded p-3 text-sm">
              <div className="font-semibold mb-1">Next:</div>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click <b>Join Room</b></li>
                <li>Click <b>Open ESPN+</b></li>
                <li>Install extension (next step)</li>
                <li>Switch to ESPN+ tab — sidebar appears</li>
              </ol>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-6 opacity-70">Loading room…</p>
      )}
    </main>
  );
}
