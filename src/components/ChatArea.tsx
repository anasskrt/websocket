'use client';
import { useState, useEffect, useRef } from 'react';
import { Message, User } from '@/lib/types';
import { formatTime, getAvatarUrl } from '@/lib/utils';
import { Send, MessageCircle } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string) => void;
}

export default function ChatArea({ messages, currentUser, onSendMessage }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getMessageTypeStyle = (type: Message['type']) => {
    switch (type) {
      case 'system':
        return 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100';
      case 'private':
        return 'bg-purple-500/20 border-purple-400/50 text-purple-100';
      default:
        return 'bg-white/10 border-white/20 text-white';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full flex flex-col">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-white font-bold text-lg flex items-center space-x-2">
          <MessageCircle size={20} />
          <span>Chat Global</span>
          <span className="bg-green-500 text-white text-sm px-2 py-1 rounded-full">
            {messages.length}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/40 text-6xl mb-4">💬</div>
            <p className="text-white/60">Aucun message pour le moment</p>
            <p className="text-white/40 text-sm mt-2">
              Commencez la conversation !
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender.id === currentUser.id;
            const isSystem = message.type === 'system';

            return (
              <div
                key={message.id}
                className={`p-3 rounded-lg border ${getMessageTypeStyle(message.type)} ${
                  isCurrentUser && !isSystem ? 'ml-4' : 'mr-4'
                }`}
              >
                {!isSystem && (
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={getAvatarUrl(message.sender.avatar)}
                      alt={`Avatar de ${message.sender.name}`}
                      className="w-6 h-6 rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML += `<div class="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs">${message.sender.avatar.split('-')[1]}</div>`;
                        }
                      }}
                    />
                    <span className="font-medium text-sm">
                      {isCurrentUser ? 'Vous' : message.sender.name}
                    </span>
                    {message.sender.isAdmin && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        ADMIN
                      </span>
                    )}
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}

                <div className={`${isSystem ? 'text-center font-medium' : ''}`}>
                  {isSystem && <span className="mr-2">🔔</span>}
                  {message.type === 'private' && <span className="mr-2">🔒</span>}
                  {message.content}
                </div>

                {message.type === 'private' && (
                  <div className="mt-2 text-xs opacity-70 flex items-center space-x-1">
                    <span>Message privé</span>
                    {message.recipient && (
                      <span>
                        {message.sender.id === currentUser.id 
                          ? `→ ${message.recipient.name}`
                          : `← ${message.sender.name}`
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/20">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
        
        <div className="mt-2 text-right text-white/40 text-xs">
          {newMessage.length}/500
        </div>
      </div>
    </div>
  );
}