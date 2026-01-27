"use client";
import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/rooms");
        setRooms(data.rooms || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rooms</h1>
        <button onClick={logout} className="border px-3 py-2 rounded">Log out</button>
      </div>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      <div className="mt-6 space-y-3">
        {rooms.map((r) => (
          <div key={r.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm opacity-70">{r.provider} • {r.event_label || "No label"}</div>
            </div>
            <Link className="underline" href={`/rooms/${r.id}`}>Open</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
