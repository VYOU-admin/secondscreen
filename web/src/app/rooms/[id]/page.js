"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = params.id;

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [joining, setJoining] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [toggleLiveLoading, setToggleLiveLoading] = useState(false);

  useEffect(() => {
    loadRoom();
    loadParticipants();
    
    // Refresh participants every 10 seconds
    const interval = setInterval(() => {
      loadParticipants();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [roomId]);

  async function loadRoom() {
    try {
      const data = await apiFetch(`/rooms/${roomId}`);
      setRoom(data.room);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadParticipants() {
    try {
      setLoadingParticipants(true);
      const data = await apiFetch(`/rooms/${roomId}/participants`);
      setParticipants(data.participants || []);
    } catch (err) {
      console.error("Error loading participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function toggleLiveStatus() {
    if (!room) return;
    
    setToggleLiveLoading(true);
    try {
      const newStatus = !room.is_live;
      await apiFetch(`/rooms/${roomId}`, {
        method: "PUT",
        body: JSON.stringify({ is_live: newStatus })
      });
      
      // Reload room to get updated status
      await loadRoom();
      setMsg(newStatus ? "✅ You're now live!" : "✅ Stream ended");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setToggleLiveLoading(false);
    }
  }

  async function joinRoom() {
    setMsg("");
    setJoining(true);
    try {
      // Set as active room
      await apiFetch(`/rooms/${roomId}/join`, { method: "POST" });
      
      // Also track as participant
      await apiFetch(`/rooms/${roomId}/enter`, { method: "POST" });
      
      // Reload participants to show updated count
      await loadParticipants();
      
      setMsg("✅ Joined! Now open ESPN+ in a tab — the extension sidebar will load this room automatically.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setJoining(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/events" className="text-blue-600 underline">← Back to Events</Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading room...</p>
      </div>
    );
  }

  const espnUrl = room.espn_url || room.event_espn_url || "https://plus.espn.com/";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={room.event_id ? `/events/${room.event_id}` : "/events"} className="text-sm text-gray-600 hover:text-black">
            ← Back to Event
          </Link>
          <Link href="/events" className="text-sm font-semibold">
            SecondScreen
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Room Header */}
        <div className="bg-white rounded-lg border p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{room.title}</h1>
                {room.is_live && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-2">
                Hosted by <span className="font-semibold">@{room.creator_username || "Unknown"}</span>
              </p>

              {room.event_title && (
                <p className="text-sm text-gray-500">
                  Event: {room.event_title} • {room.event_sport}
                </p>
              )}
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold">{room.viewer_count || 0}</div>
              <div className="text-sm text-gray-500">viewers</div>
            </div>
          </div>

          {room.event_label && (
            <div className="text-sm text-gray-600 mt-2">
              {room.provider} • {room.event_label}
            </div>
          )}

          {/* Go Live Button */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={toggleLiveStatus}
              disabled={toggleLiveLoading}
              className={`w-full p-3 rounded-lg font-semibold transition ${
                room.is_live 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-green-600 text-white hover:bg-green-700"
              } disabled:opacity-50`}
            >
              {toggleLiveLoading 
                ? "Updating..." 
                : room.is_live 
                  ? "🔴 End Stream" 
                  : "🎥 Go Live"}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {room.is_live 
                ? "You're currently streaming" 
                : "Start streaming to let viewers know you're live"}
            </p>
          </div>
        </div>

        {/* Participants Section */}
        {participants.length > 0 && (
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4">
              Currently Watching ({participants.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {participants.map((participant, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                    {participant.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {participant.display_name || participant.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">How to Join This Watch Party</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Join the Room</h3>
                <p className="text-sm text-gray-600">Click the button below to join this watch party</p>
                <button 
                  onClick={joinRoom} 
                  disabled={joining} 
                  className="mt-2 w-full bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {joining ? "Joining..." : "Join Room"}
                </button>
                {msg && <p className="text-sm mt-2">{msg}</p>}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Open ESPN+</h3>
                <p className="text-sm text-gray-600 mb-2">Open the game in a new tab</p>
                <a 
                  href={espnUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full text-center border-2 border-black p-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Open ESPN+ →
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Install Extension</h3>
                <p className="text-sm text-gray-600">The sidebar will appear with the stream and chat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Extension CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Don't have the extension yet?</h2>
          <p className="mb-6 opacity-90">
            Install our Chrome extension to watch with the streamer and chat in real-time
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Install Chrome Extension
          </button>
        </div>
      </div>
    </div>
  );
}