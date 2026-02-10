"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function CreateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("ESPN+");
  const [eventLabel, setEventLabel] = useState("");
  const [espnUrl, setEspnUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    try {
      const data = await apiFetch(`/events/${eventId}`);
      setEvent(data.event);
      // Pre-fill some fields
      setTitle(`${data.event.title} - Watch Party`);
      setEventLabel(data.event.title);
      if (data.event.espn_url) {
        setEspnUrl(data.event.espn_url);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/rooms", {
        method: "POST",
        body: JSON.stringify({
          title,
          event_id: eventId,
          provider,
          event_label: eventLabel,
          espn_url: espnUrl,
          description: description || null  // ADD THIS LINE
        })
      });

      // Redirect to the room detail page
      router.push(`/rooms/${data.room.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href={`/events/${eventId}`} className="text-sm text-gray-600 hover:text-black">
            ← Back to Event
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Start Streaming</h1>
          <p className="text-gray-600">Create your watch party room for: <span className="font-semibold">{event.title}</span></p>
        </div>

        <div className="bg-white rounded-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Room Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., John's Watch Party"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Give your stream a name so viewers can find it
              </p>
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Streaming Platform
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="ESPN+">ESPN+</option>
                <option value="ESPN">ESPN</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Event Label */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Label
              </label>
              <input
                type="text"
                value={eventLabel}
                onChange={(e) => setEventLabel(e.target.value)}
                placeholder="e.g., Game 7 - NBA Finals"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Room Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what to expect from your stream..."
                rows={3}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - Describe your commentary style, what you'll focus on, etc.
              </p>
            </div>

            {/* ESPN URL */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ESPN+ URL
              </label>
              <input
                type="url"
                value={espnUrl}
                onChange={(e) => setEspnUrl(e.target.value)}
                placeholder="https://plus.espn.com/..."
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where viewers with the extension can watch along with you
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">🎥 How streaming works:</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal ml-5">
                <li>Create your room</li>
                <li>Join the room and open ESPN+ in another tab</li>
                <li>Install the extension (if you haven't already)</li>
                <li>Your viewers will see your stream in the sidebar while watching the game</li>
              </ol>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
              <Link
                href={`/events/${eventId}`}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}