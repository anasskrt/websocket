"use client";
import { useState } from "react";
import { User } from "@/lib/types";
import LoginForm from "@/components/LoginForm";
import GameRoom from "@/components/GameRoom";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <main className="min-h-screen">
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <GameRoom user={user} onLogout={handleLogout} />
      )}
    </main>
  );
}
