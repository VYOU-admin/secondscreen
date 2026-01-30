"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiFetch("/profile/me");
      setUser(data.user);
      setDisplayName(data.user.display_name || "");
      setBio(data.user.bio || "");
      setProfilePicture(data.user.profile_picture_url || "");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await apiFetch("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          display_name: displayName || null,
          bio: bio || null,
          profile_picture_url: profilePicture || null
        })
      });
      
      setUser(data.user);
      setSuccess("Profile updated successfully!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <a href="/rooms" className="text-sm underline">← Back to Rooms</a>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600 mb-2">Account Info</div>
        <div className="space-y-1">
          <div><span className="font-medium">Email:</span> {user.email}</div>
          <div><span className="font-medium">Username:</span> @{user.username}</div>
          <div className="text-xs text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <div className="text-sm mb-1 font-medium">Display Name</div>
          <input 
            className="w-full border p-2 rounded" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we display your name?"
            maxLength={50}
          />
          <div className="text-xs text-gray-500 mt-1">Optional (max 50 characters)</div>
        </label>

        <label className="block">
          <div className="text-sm mb-1 font-medium">Bio</div>
          <textarea 
            className="w-full border p-2 rounded" 
            rows={4}
            value={bio} 
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            Optional (max 500 characters) • {bio.length}/500
          </div>
        </label>

        <label className="block">
          <div className="text-sm mb-1 font-medium">Profile Picture URL</div>
          <input 
            className="w-full border p-2 rounded" 
            value={profilePicture} 
            onChange={(e) => setProfilePicture(e.target.value)}
            placeholder="https://example.com/your-photo.jpg"
            type="url"
          />
          <div className="text-xs text-gray-500 mt-1">Optional • Must be a valid URL</div>
        </label>

        {profilePicture && (
          <div className="border rounded p-4">
            <div className="text-sm font-medium mb-2">Preview:</div>
            <img 
              src={profilePicture} 
              alt="Profile preview" 
              className="w-24 h-24 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                setError("Invalid image URL");
              }}
            />
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button 
          type="submit"
          disabled={loading} 
          className="w-full bg-black text-white p-3 rounded font-medium"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
}