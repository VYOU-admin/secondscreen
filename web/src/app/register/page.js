"use client";
import { useState } from "react";
import { apiFetch, setToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, username })
      });
      setToken(data.token);
      router.push("/rooms");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <div className="text-sm mb-1">Email</div>
          <input 
            className="w-full border p-2 rounded" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Username</div>
          <input 
            className="w-full border p-2 rounded" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-20 characters (letters, numbers, underscores)"
            required 
          />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Password</div>
          <input 
            className="w-full border p-2 rounded" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-black text-white p-2 rounded">
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <a className="underline" href="/login">Log in</a>
      </p>
    </main>
  );
}