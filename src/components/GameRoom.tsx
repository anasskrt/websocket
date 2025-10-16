'use client';
import { useState, useEffect } from 'react';
import { User, Message } from "@/lib/types";
import { socketManager } from "@/lib/socket";
import UsersList from "@/components/UsersList";
import ChatArea from "@/components/ChatArea";
import GameHeader from "@/components/GameHeader";

interface GameRoomProps {
  user: User;
  onLogout: () => void;
}

export default function GameRoom({ user, onLogout }: GameRoomProps) {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    console.log("GameRoom mounted, setting up listeners for user:", user.name);

    socketManager.onUsersListUpdate((users: User[]) => {
      console.log("Received users list:", users);
      setConnectedUsers(users);
    });

    socketManager.onUserJoined((newUser: User) => {
      console.log("User joined:", newUser);
      if (newUser.id !== user.id) {
        setConnectedUsers((prev) => {
          const exists = prev.find((u) => u.id === newUser.id);
          if (exists) return prev;
          return [...prev, newUser];
        });
      }
    });

    socketManager.onMessageReceived((message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketManager.onError((error: string) => {
      console.error("Socket error:", error);
      
      if (error.includes("expulsé")) {
        alert(error);
        handleLogout();
      } else {
        setIsConnected(false);
      }
    });

    return () => {
      socketManager.removeAllListeners();
    };
  }, []);

  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      socketManager.sendGlobalMessage(content);
    }
  };

  const handleSendPrivateMessage = (content: string, recipientId: string) => {
    if (content.trim()) {
      socketManager.sendPrivateMessage(content, recipientId);
    }
  };

  const handleKickUser = (userId: string) => {
    if (user.isAdmin) {
      socketManager.kickUser(userId);
    }
  };

  const handleLogout = () => {
    socketManager.disconnect();
    onLogout();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Connexion perdue
          </h2>
          <p className="text-white/80 mb-6">
            La connexion au serveur a été interrompue.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      <GameHeader
        user={user}
        userCount={connectedUsers.length}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          <div className="lg:col-span-1">
            <UsersList
              users={connectedUsers}
              currentUser={user}
              onSendPrivateMessage={handleSendPrivateMessage}
              onKickUser={handleKickUser}
            />
          </div>

          <div className="lg:col-span-2">
            <ChatArea
              messages={messages}
              currentUser={user}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}