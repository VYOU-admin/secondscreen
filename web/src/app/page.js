"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // Redirect logged-in users to rooms
      router.push("/events");
    }
  }, [router]);

  // Don't show landing page if user is logged in (they'll be redirected)
  if (isLoggedIn) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Bar */}
      <nav className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">SecondScreen</div>
          <div className="flex gap-3">
            <Link 
              href="/login" 
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 transition"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Watch Sports Together.<br />
          Stream Your Commentary.
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          SecondScreen lets you watch live sports with friends while creators stream their 
          commentary in real-time. Join watch parties, chat with other fans, and experience 
          the game like never before.
        </p>

        <div className="flex gap-4 justify-center">
          <Link 
            href="/register" 
            className="px-8 py-4 rounded-lg bg-black text-white text-lg font-semibold hover:bg-gray-800 transition"
          >
            Get Started Free
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 rounded-lg border-2 border-gray-300 text-lg font-semibold hover:bg-gray-50 transition"
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Create or Join a Room</h3>
            <p className="text-gray-600">
              Pick a game or event you want to watch. Create your own watch party or join an existing one.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Install the Extension</h3>
            <p className="text-gray-600">
              Add our Chrome extension to your browser. It creates a sidebar on ESPN+ and other sports sites.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Watch & Chat Live</h3>
            <p className="text-gray-600">
              Watch the game with creator commentary streaming live. Chat with other viewers in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Sports Watching?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of fans watching together on SecondScreen.
          </p>
          <Link 
            href="/register" 
            className="inline-block px-8 py-4 rounded-lg bg-white text-black text-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign Up Now - It's Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600 text-sm">
          © 2025 SecondScreen. All rights reserved.
        </div>
      </footer>
    </main>
  );
}