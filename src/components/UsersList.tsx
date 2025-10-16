'use client';
import { useState } from 'react';
import { User } from '@/lib/types';
import { getAvatarUrl, formatTime } from '@/lib/utils';
import { Crown, Shield, MessageSquare, Send, UserX } from 'lucide-react';

interface UsersListProps {
  users: User[];
  currentUser: User;
  onSendPrivateMessage?: (content: string, recipientId: string) => void;
  onKickUser?: (userId: string) => void;
}

export default function UsersList({ users, currentUser, onSendPrivateMessage, onKickUser }: UsersListProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [privateMessage, setPrivateMessage] = useState('');
  const [userToKick, setUserToKick] = useState<User | null>(null);
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isAdmin && !b.isAdmin) return -1;
    if (!a.isAdmin && b.isAdmin) return 1;
    return new Date(a.connectedAt).getTime() - new Date(b.connectedAt).getTime();
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full flex flex-col">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-white font-bold text-lg flex items-center space-x-2">
          <span>👥</span>
          <span>Joueurs connectés</span>
          <span className="bg-cyan-500 text-white text-sm px-2 py-1 rounded-full">
            {users.length}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedUsers.map((user) => {
          const isCurrentUser = user.id === currentUser.id;
          const isOnline = true;

          return (
            <div
              key={user.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isCurrentUser
                  ? 'bg-cyan-500/20 border border-cyan-400/50 ring-2 ring-cyan-400/30'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="relative">
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={`Avatar de ${user.name}`}
                  className="w-12 h-12 rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML += `<div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">${user.avatar.split('-')[1]}</div>`;
                    }
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-white font-medium truncate">
                    {user.name}
                  </p>
                  {isCurrentUser && (
                    <span className="text-cyan-300 text-xs bg-cyan-500/20 px-2 py-1 rounded-full">
                      Vous
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  {user.isAdmin && (
                    <div className="flex items-center space-x-1 text-red-300">
                      <Crown size={12} />
                      <span className="text-xs">Admin</span>
                    </div>
                  )}
                  <p className="text-white/60 text-xs">
                    Connecté à {formatTime(user.connectedAt)}
                  </p>
                </div>

                <p className="text-white/40 text-xs mt-1">
                  Dernière activité: {formatTime(user.lastActivity)}
                </p>
              </div>

              <div className="flex flex-col items-center space-y-1">
                {!isCurrentUser && onSendPrivateMessage && (
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="p-1 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 transition-colors"
                    title="Envoyer un message privé"
                  >
                    <MessageSquare size={14} />
                  </button>
                )}
                {!isCurrentUser && currentUser.isAdmin && onKickUser && (
                  <button
                    onClick={() => setUserToKick(user)}
                    className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
                    title="Expulser ce joueur"
                  >
                    <UserX size={14} />
                  </button>
                )}
                {user.isAdmin && (
                  <div title="Administrateur">
                    <Shield size={16} className="text-red-400" />
                  </div>
                )}
                <div 
                  className={`w-3 h-3 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                  title={isOnline ? 'En ligne' : 'Hors ligne'}
                />
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="text-center py-8">
            <div className="text-white/40 text-6xl mb-4">👻</div>
            <p className="text-white/60">Aucun joueur connecté</p>
            <p className="text-white/40 text-sm mt-2">
              Soyez le premier à rejoindre la partie !
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-white/60 text-sm">Joueurs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-cyan-300">
              {users.filter(u => u.isAdmin).length}
            </p>
            <p className="text-white/60 text-sm">Admins</p>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-bold text-lg mb-4">
              Message privé à {selectedUser.name}
            </h3>
            <div className="space-y-4">
              <textarea
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
                placeholder="Tapez votre message privé..."
                className="w-full h-24 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-xs">{privateMessage.length}/500</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setPrivateMessage('');
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (privateMessage.trim() && onSendPrivateMessage) {
                        onSendPrivateMessage(privateMessage.trim(), selectedUser.id);
                        setSelectedUser(null);
                        setPrivateMessage('');
                      }
                    }}
                    disabled={!privateMessage.trim()}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Send size={16} />
                    <span>Envoyer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {userToKick && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center space-x-2">
              <UserX size={20} className="text-red-400" />
              <span>Expulser un joueur</span>
            </h3>
            <p className="text-white/80 mb-6">
              Êtes-vous sûr de vouloir expulser <span className="font-bold">{userToKick.name}</span> de la partie ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setUserToKick(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (onKickUser) {
                    onKickUser(userToKick.id);
                    setUserToKick(null);
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Expulser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}