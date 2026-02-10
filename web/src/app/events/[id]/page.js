"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventAndRooms();
  }, [eventId]);

  async function loadEventAndRooms() {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/${eventId}`);
      setEvent(data.event);
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Event not found"}</p>
          <Link href="/events" className="text-blue-600 underline">← Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/events" className="text-sm text-gray-600 hover:text-black">
            ← Back to Events
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-lg border p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">{event.sport}</span>
                {event.league && <span>• {event.league}</span>}
              </div>
              
              <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
              
              {event.description && (
                <p className="text-gray-600 mb-4">{event.description}</p>
              )}
              
              <div className="text-sm text-gray-500">
                Starts: {new Date(event.start_time).toLocaleString()}
              </div>
            </div>

            {event.image_url && (
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-48 h-32 object-cover rounded-lg ml-8"
              />
            )}
          </div>

          {event.espn_url && (
            <div className="mt-6 pt-6 border-t">
              <a 
                href={event.espn_url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                Watch on ESPN+ →
              </a>
            </div>
          )}
        </div>

        {/* Rooms Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Watch Parties & Streams</h2>
            <p className="text-gray-600 text-sm mt-1">
              {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
            </p>
          </div>
          <Link 
            href={`/events/${eventId}/create-room`}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Start Streaming
          </Link>
        </div>

        {/* Rooms List */}
        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-600 mb-4">No rooms yet. Be the first to start streaming!</p>
            <Link 
              href={`/events/${eventId}/create-room`}
              className="inline-block px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
            >
              Start Streaming
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{room.title}</h3>
                      {room.is_live && (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          LIVE
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Hosted by <span className="font-medium">@{room.creator_username || "Unknown"}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Hosted by <span className="font-medium">@{room.creator_username || "Unknown"}</span>
                    </div>
                    
                    {/* ADD THIS NEW SECTION HERE */}
                    {room.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    {/* END OF NEW SECTION */}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>👥 {room.viewer_count || 0} viewers</span>
                    </div>
                  </div>

                  <Link 
                    href={`/rooms/${room.id}`}
                    className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
                  >
                    Join Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extension Reminder */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-2">📺 Want to watch the game with streamers?</h3>
          <p className="text-sm text-gray-700 mb-3">
            Install our Chrome extension to watch ESPN+ with live commentary from streamers in your sidebar.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Install Extension
          </button>
        </div>
      </div>
    </div>
  );
}