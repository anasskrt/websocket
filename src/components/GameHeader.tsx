'use client';
import { User, GameScore } from '@/lib/types';
import { formatTime, getAvatarUrl } from '@/lib/utils';
import { LogOut, Users, Trophy } from 'lucide-react';

interface GameHeaderProps {
  user: User;
  score: GameScore;
  userCount: number;
  onLogout: () => void;
}

export default function GameHeader({ user, score, userCount, onLogout }: GameHeaderProps) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">🎮 BoomParty</h1>
            <div className="hidden md:flex items-center space-x-4 text-white/80">
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <span>{userCount} joueur{userCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy size={20} />
                <span className="font-bold text-yellow-300">
                  {score.global.toLocaleString()} points
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
              <img
                src={getAvatarUrl(user.avatar)}
                alt={`Avatar de ${user.name}`}
                className="w-8 h-8 rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML += `<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">${user.avatar.split('-')[1]}</div>`;
                  }
                }}
              />
              <div className="hidden sm:block">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-white/60 text-xs">
                  Connecté à {formatTime(user.connectedAt)}
                </p>
              </div>
              {user.isAdmin && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  ADMIN
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white px-4 py-2 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>

        <div className="md:hidden mt-4 flex items-center justify-center space-x-6 text-white/80">
          <div className="flex items-center space-x-2">
            <Users size={18} />
            <span>{userCount} joueur{userCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy size={18} />
            <span className="font-bold text-yellow-300">
              {score.global.toLocaleString()} points
            </span>
          </div>
        </div>

        {score.contributors.length > 0 && (
          <div className="mt-2 text-center text-white/60 text-sm">
            Dernière action: {score.contributors[score.contributors.length - 1]?.userName} 
            {' '}à {formatTime(score.lastUpdate)}
          </div>
        )}
      </div>
    </header>
  );
}