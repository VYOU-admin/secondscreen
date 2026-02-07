"use client";
import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all"); // all, live, upcoming
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [filter]);

  async function loadEvents() {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const data = await apiFetch(`/events${params}`);
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) return "Live Now";
    if (hours < 24) return `Starts in ${hours}h`;
    return `Starts in ${days}d`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/events" className="text-xl font-bold">SecondScreen</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/events" className="font-semibold">Events</Link>
              <Link href="/profile" className="text-gray-600 hover:text-black">Profile</Link>
            </div>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/events/create" 
              className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Create Event
            </Link>
            <button 
              onClick={logout} 
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Events</h1>
          <p className="text-gray-600">Find sports events and join watch parties with live commentary</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all" 
                ? "bg-black text-white" 
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter("live")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "live" 
                ? "bg-black text-white" 
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            🔴 Live Now
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "upcoming" 
                ? "bg-black text-white" 
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            📅 Upcoming
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-600 mb-4">No events found.</p>
            <Link 
              href="/events/create" 
              className="inline-block px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
            >
              Create the First Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link 
                key={event.id} 
                href={`/events/${event.id}`}
                className="bg-white rounded-lg border hover:shadow-lg transition overflow-hidden"
              >
                {/* Event Image */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 h-48 flex items-center justify-center relative">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-white text-4xl">🏆</div>
                  )}
                  
                  {/* Live indicator */}
                  {parseInt(event.live_room_count) > 0 && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="bg-gray-100 px-2 py-1 rounded">{event.sport}</span>
                    {event.league && <span>• {event.league}</span>}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatDate(event.start_time)}
                    </span>
                    <span className="font-medium">
                      {event.room_count || 0} {parseInt(event.room_count) === 1 ? 'room' : 'rooms'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}