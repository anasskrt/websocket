'use client';
import { useState } from 'react';
import { User, GameScore } from '@/lib/types';
import { Zap, Target, Bomb, Star, Trophy, Plus, Shield, RotateCcw } from 'lucide-react';

interface GameAreaProps {
  user: User;
  onGameAction: (actionType: string, data: unknown) => void;
  score: GameScore;
  onResetScore?: () => void;
}

export default function GameArea({ user, onGameAction, score, onResetScore }: GameAreaProps) {
  const [lastAction, setLastAction] = useState<string>('');
  const [actionCount, setActionCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const performAction = (actionType: string, points: number, emoji: string) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setLastAction(`${emoji} ${actionType} (+${points} pts)`);
    setActionCount(prev => prev + 1);

    onGameAction(actionType, { 
      points, 
      userId: user.id,
      userName: user.name,
      timestamp: new Date()
    });

    setTimeout(() => setIsAnimating(false), 1000);
  };

  const handleResetScore = () => {
    if (onResetScore) {
      onResetScore();
      setShowResetConfirm(false);
    }
  };

  const gameActions = [
    {
      id: 'boom-click',
      name: 'Boom Click',
      emoji: '💥',
      points: 5,
      color: 'from-red-500 to-red-600',
      description: 'Cliquez pour faire exploser !'
    },
    {
      id: 'super-boom',
      name: 'Super Boom',
      emoji: '🎆',
      points: 15,
      color: 'from-purple-500 to-purple-600',
      description: 'Une explosion spectaculaire !'
    },
    {
      id: 'mega-blast',
      name: 'Mega Blast',
      emoji: '🚀',
      points: 25,
      color: 'from-blue-500 to-blue-600',
      description: 'L\'explosion ultime !'
    },
    {
      id: 'bonus-star',
      name: 'Bonus Star',
      emoji: '⭐',
      points: 10,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Une étoile bonus !'
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full flex flex-col">
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg flex items-center space-x-2">
            <Bomb size={20} />
            <span>Zone de Jeu</span>
          </h3>
          <div className="text-white/80 text-sm">
            Actions: {actionCount}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
            <Trophy size={32} className="mx-auto mb-2" />
            <h2 className="text-3xl font-bold mb-2">
              {score.global.toLocaleString()}
            </h2>
            <p className="text-yellow-100">Points Globaux</p>
            {lastAction && (
              <div className={`mt-4 text-sm font-medium transition-all duration-1000 ${
                isAnimating ? 'opacity-100 scale-110' : 'opacity-70 scale-100'
              }`}>
                Dernière action: {lastAction}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Target size={18} />
            <span>Actions disponibles</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {gameActions.map((action) => (
              <button
                key={action.id}
                onClick={() => performAction(action.name, action.points, action.emoji)}
                disabled={isAnimating}
                className={`
                  bg-gradient-to-br ${action.color} hover:scale-105 active:scale-95
                  disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed
                  text-white font-bold p-6 rounded-xl shadow-lg
                  transition-all duration-200 hover:shadow-xl
                  flex flex-col items-center space-y-2
                `}
              >
                <span className="text-3xl">{action.emoji}</span>
                <span className="text-sm font-medium">{action.name}</span>
                <div className="flex items-center space-x-1 text-xs opacity-90">
                  <Plus size={12} />
                  <span>{action.points} pts</span>
                </div>
                <p className="text-xs text-center opacity-75 leading-tight">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/5 rounded-lg p-3">
            <Zap size={20} className="mx-auto text-yellow-400 mb-1" />
            <p className="text-white font-bold">{actionCount}</p>
            <p className="text-white/60 text-xs">Vos actions</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <Star size={20} className="mx-auto text-cyan-400 mb-1" />
            <p className="text-white font-bold">
              {score.contributors.find(c => c.userId === user.id)?.points || 0}
            </p>
            <p className="text-white/60 text-xs">Vos points</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <Trophy size={20} className="mx-auto text-purple-400 mb-1" />
            <p className="text-white font-bold">
              {score.contributors.length > 0 
                ? Math.round(score.global / score.contributors.length) 
                : 0}
            </p>
            <p className="text-white/60 text-xs">Moyenne</p>
          </div>
        </div>

        {isAnimating && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-6xl animate-bounce">
              {lastAction.split(' ')[0]}
            </div>
          </div>
        )}

        {user.isAdmin && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield size={18} className="text-red-400" />
              <h5 className="text-white font-semibold">Contrôles Admin</h5>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw size={18} />
              <span>Réinitialiser le score global</span>
            </button>
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center space-x-2">
              <Shield size={20} className="text-red-400" />
              <span>Confirmer la réinitialisation</span>
            </h3>
            <p className="text-white/80 mb-6">
              Êtes-vous sûr de vouloir remettre le score global à zéro ? Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleResetScore}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}