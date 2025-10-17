'use client';
import { useState, useEffect } from 'react';
import { User, Message, BoomPartyGame } from "@/lib/types";
import { socketManager } from "@/lib/socket";
import UsersList from "@/components/UsersList";
import ChatArea from "@/components/ChatArea";
import GameArea from "@/components/GameArea";
import GameHeader from "@/components/GameHeader";
import GameSettings from "@/components/GameSettings";

interface GameRoomProps {
  user: User;
  onLogout: () => void;
}

export default function GameRoom({ user, onLogout }: GameRoomProps) {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [wordError, setWordError] = useState<string>("");
  const [expelledMessage, setExpelledMessage] = useState<string>("");
  const [game, setGame] = useState<BoomPartyGame>({
    isActive: false,
    status: "waiting",
    players: [],
    bombState: {
      currentLetter: "",
      timeRemaining: 0,
      maxTime: 0,
      activePlayerId: null,
      usedWords: [],
      roundNumber: 0,
    },
    winner: null,
    settings: {
      minTime: 10,
      maxTime: 30,
      startingLives: 3,
    },
  });

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

    socketManager.onGameUpdated((updatedGame: BoomPartyGame) => {
      console.log("Game updated:", updatedGame);
      setGame(updatedGame);
    });

    socketManager.onBombTick((timeRemaining: number) => {
      setGame((prev) => ({
        ...prev,
        bombState: {
          ...prev.bombState,
          timeRemaining,
        },
      }));
    });

    socketManager.onWordRejected((reason: string) => {
      setWordError(reason);
    });

    socketManager.onError((error: string) => {
      console.error("Socket error:", error);
      // Si l'erreur contient une indication d'expulsion, afficher un modal
      const lower = (error || "").toLowerCase();
      if (
        lower.includes("expuls") ||
        lower.includes("expulsé") ||
        lower.includes("expulse")
      ) {
        setExpelledMessage(error);
        return;
      }

      setIsConnected(false);
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

  const handleStartGame = () => {
    if (user.isAdmin) {
      socketManager.startGame();
    }
  };

  const handleStopGame = () => {
    if (user.isAdmin) {
      socketManager.stopGame();
    }
  };

  const handleSubmitWord = (word: string) => {
    socketManager.submitWord(word);
  };

  const handleUpdateSettings = (settings: {
    minTime: number;
    maxTime: number;
    startingLives: number;
  }) => {
    if (user.isAdmin) {
      socketManager.updateGameSettings(settings);
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

  // Modal d'expulsion
  if (expelledMessage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Vous avez été expulsé
          </h2>
          <p className="text-white/80 mb-6">{expelledMessage}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setExpelledMessage("");
                handleLogout();
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Retour à l'accueil
            </button>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          <div className="lg:col-span-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent space-y-4">
            <GameSettings
              game={game}
              isAdmin={user.isAdmin}
              onUpdateSettings={handleUpdateSettings}
            />
            <UsersList
              users={connectedUsers}
              currentUser={user}
              onSendPrivateMessage={handleSendPrivateMessage}
              onKickUser={handleKickUser}
            />
          </div>

          <div className="lg:col-span-2">
            <GameArea
              game={game}
              currentUser={user}
              onSubmitWord={handleSubmitWord}
              onStartGame={handleStartGame}
              onStopGame={handleStopGame}
              errorMessage={wordError}
              onClearError={() => setWordError("")}
            />
          </div>

          <div className="lg:col-span-1">
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