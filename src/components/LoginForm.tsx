'use client';
import { useState } from 'react';
import { User, AVATARS } from '@/lib/types';
import { validateUsername, createUser, getAvatarUrl, generateRandomAvatar } from '@/lib/utils';
import { socketManager } from '@/lib/socket';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateUsername(name)) {
      setError('Le nom doit contenir entre 3 et 20 caractères (lettres, chiffres, espaces, tirets et underscores uniquement)');
      return;
    }

    setIsLoading(true);

    try {
      const user = createUser(name, selectedAvatar);
      const socket = socketManager.connect();

      socket.on('connect', () => {
        console.log('Socket connected, setting up listeners before joining');
        
        socket.on('users:list', (users) => {
          console.log('LoginForm received users:list:', users);
        });
        
        console.log('Now joining game with user:', user.name);
        socketManager.joinGame({ name: user.name, avatar: user.avatar });
      });

      socket.on('user:joined', (serverUser: User) => {
        console.log('User joined successfully:', serverUser);
        onLogin(serverUser);
        setIsLoading(false);
      });

      socket.on('error', (errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);
      });

    } catch {
      setError('Erreur de connexion au serveur');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 BoomParty</h1>
          <p className="text-white/80">Rejoignez la partie multijoueur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-white font-medium mb-2">
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="Entrez votre nom"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-4">
              Choisissez votre avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedAvatar === avatar
                      ? 'border-cyan-400 bg-cyan-400/20'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  disabled={isLoading}
                >
                  <img
                    src={getAvatarUrl(avatar)}
                    alt={`Avatar ${avatar}`}
                    className="w-12 h-12 rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">${avatar.split('-')[1]}</div>`;
                      }
                    }}
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </span>
            ) : (
              'Rejoindre la partie'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-white/60 text-sm">
          <p>Prêt pour une expérience multijoueur épique ?</p>
        </div>
      </div>
    </div>
  );
}