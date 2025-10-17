'use client';
import { useState, useEffect } from "react";
import { User, BoomPartyGame } from "@/lib/types";
import { Bomb, Zap, Trophy, Heart, Send } from "lucide-react";

interface GameAreaProps {
  game: BoomPartyGame;
  currentUser: User;
  onSubmitWord: (word: string) => void;
  onStartGame: () => void;
  onStopGame: () => void;
}

export default function GameArea({
  game,
  currentUser,
  onSubmitWord,
  onStartGame,
  onStopGame,
}: GameAreaProps) {
  const [wordInput, setWordInput] = useState("");
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const isActivePlayer = game.bombState.activePlayerId === currentUser.id;
  const activePlayer = game.players.find(
    (p) => p.id === game.bombState.activePlayerId
  );
  const alivePlayers = game.players.filter((p) => p.isAlive);

  useEffect(() => {
    if (game.bombState.timeRemaining <= 5 && game.bombState.timeRemaining > 0) {
      setShakeAnimation(true);
      const timer = setTimeout(() => setShakeAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [game.bombState.timeRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordInput.trim() && isActivePlayer) {
      onSubmitWord(wordInput.trim().toUpperCase());
      setWordInput("");
    }
  };

  const getTimerColor = () => {
    const percentage =
      (game.bombState.timeRemaining / game.bombState.maxTime) * 100;
    if (percentage > 50) return "text-green-400";
    if (percentage > 25) return "text-yellow-400";
    return "text-red-400";
  };

  const getBombSize = () => {
    const percentage =
      (game.bombState.timeRemaining / game.bombState.maxTime) * 100;
    if (percentage > 50) return 80;
    if (percentage > 25) return 100;
    return 120;
  };

  if (game.status === "waiting") {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 h-full flex flex-col items-center justify-center">
        <Bomb size={120} className="text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-3xl font-bold text-white mb-4">Tic Tac Boom!</h2>
        <p className="text-white/80 mb-2 text-center max-w-md">
          Trouvez un mot contenant la syllabe affichée avant que la bombe
          n&apos;explose ! 💣
        </p>
        <p className="text-white/60 mb-8 text-sm text-center">
          Minimum {game.settings.minTime}s - Maximum {game.settings.maxTime}s
          par tour
        </p>

        {currentUser.isAdmin ? (
          <button
            onClick={onStartGame}
            disabled={alivePlayers.length < 2}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
          >
            {alivePlayers.length < 2
              ? "Attendez au moins 2 joueurs"
              : "🚀 Démarrer la partie"}
          </button>
        ) : (
          <div className="text-white/60 text-center">
            <p className="mb-2">En attente du démarrage...</p>
            <p className="text-sm">
              L&apos;admin peut lancer la partie dès que 2 joueurs sont présents
            </p>
          </div>
        )}

        <div className="mt-8 text-white/60 text-sm">
          <p className="font-semibold mb-2">
            Joueurs prêts: {alivePlayers.length}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {game.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full"
              >
                <span>{player.avatar}</span>
                <span className="text-xs">{player.name}</span>
                {player.isAdmin && (
                  <span className="text-yellow-400 text-xs">👑</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (game.status === "finished") {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 h-full flex flex-col items-center justify-center">
        <Trophy size={120} className="text-yellow-400 mb-6 animate-pulse" />
        <h2 className="text-4xl font-bold text-white mb-4">
          🎉 Partie terminée!
        </h2>
        {game.winner && (
          <div className="text-center mb-8">
            <p className="text-white/80 mb-2">Le gagnant est:</p>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 rounded-xl p-6">
              <div className="text-6xl mb-2">{game.winner.avatar}</div>
              <div className="text-3xl font-bold text-yellow-400">
                {game.winner.name}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4">Classement final:</h3>
          <div className="space-y-2">
            {game.players
              .sort((a, b) => (b.lives || 0) - (a.lives || 0))
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between space-x-4 px-4 py-2 rounded-lg ${
                    index === 0
                      ? "bg-yellow-500/20 border border-yellow-400/50"
                      : "bg-white/5"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-white/60 w-6">
                      #{index + 1}
                    </span>
                    <span className="text-2xl">{player.avatar}</span>
                    <span className="text-white font-medium">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart size={16} className="text-red-400" />
                    <span className="text-white font-bold">
                      {player.lives || 0}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {currentUser.isAdmin && (
          <button
            onClick={onStartGame}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🔄 Nouvelle partie
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 h-full flex flex-col">
      {/* Header avec scores */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg">
            <Zap size={20} className="text-yellow-400" />
            <span className="text-white font-bold">
              Tour {game.bombState.roundNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-white/80 text-sm">
            <span>Joueurs en vie: {alivePlayers.length}</span>
          </div>
        </div>
        {currentUser.isAdmin && (
          <button
            onClick={onStopGame}
            className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Arrêter la partie
          </button>
        )}
      </div>

      {/* Zone centrale de jeu */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        {/* Bombe et Timer */}
        <div className={`relative ${shakeAnimation ? "animate-shake" : ""}`}>
          <Bomb
            size={getBombSize()}
            className={`${getTimerColor()} transition-all duration-300`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-4xl font-bold ${getTimerColor()}`}>
              {game.bombState.timeRemaining}
            </div>
          </div>
        </div>

        {/* Syllabe courante */}
        <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-white/40 rounded-3xl p-8 shadow-2xl">
          <div className="text-center">
            <p className="text-white/80 text-lg mb-2">
              Trouvez un mot avec la syllabe:
            </p>
            <div className="text-8xl font-bold text-white tracking-wider">
              {game.bombState.currentLetter}
            </div>
          </div>
        </div>

        {/* Joueur actif */}
        {activePlayer && (
          <div
            className={`text-center ${isActivePlayer ? "animate-pulse" : ""}`}
          >
            <p className="text-white/60 mb-2">
              {isActivePlayer ? "C'est votre tour!" : "C'est le tour de:"}
            </p>
            <div
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl ${
                isActivePlayer
                  ? "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400"
                  : "bg-white/10"
              }`}
            >
              <span className="text-4xl">{activePlayer.avatar}</span>
              <div className="text-left">
                <div className="text-white font-bold text-xl">
                  {activePlayer.name}
                </div>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: activePlayer.lives || 0 }).map(
                    (_, i) => (
                      <Heart
                        key={i}
                        size={16}
                        className="text-red-400 fill-red-400"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input pour soumettre un mot */}
        {isActivePlayer && (
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex space-x-2">
              <input
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value.toUpperCase())}
                placeholder="Entrez un mot..."
                className="flex-1 bg-white/20 border-2 border-white/40 rounded-xl px-6 py-4 text-white placeholder-white/50 text-lg font-medium focus:outline-none focus:border-yellow-400 uppercase"
                autoFocus
              />
              <button
                type="submit"
                disabled={!wordInput.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold px-6 py-4 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                <Send size={24} />
              </button>
            </div>
          </form>
        )}

        {/* Mots déjà utilisés */}
        {game.bombState.usedWords.length > 0 && (
          <div className="w-full max-w-2xl">
            <p className="text-white/60 text-sm mb-2">Mots déjà utilisés:</p>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {game.bombState.usedWords.slice(-10).map((word, index) => (
                <span
                  key={index}
                  className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}