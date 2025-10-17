"use client";

import { useState, useEffect } from "react";
import type { BoomPartyGame } from "@/lib/types";

interface GameSettingsProps {
  game: BoomPartyGame | null;
  isAdmin: boolean;
  onUpdateSettings: (settings: {
    minTime: number;
    maxTime: number;
    startingLives: number;
  }) => void;
}

export default function GameSettings({
  game,
  isAdmin,
  onUpdateSettings,
}: GameSettingsProps) {
  const [minTime, setMinTime] = useState(10);
  const [maxTime, setMaxTime] = useState(30);
  const [startingLives, setStartingLives] = useState(3);
  const [errorMsg, setErrorMsg] = useState("");

  // Synchroniser avec les paramètres du jeu
  useEffect(() => {
    if (game?.settings) {
      setMinTime(game.settings.minTime);
      setMaxTime(game.settings.maxTime);
      setStartingLives(game.settings.startingLives);
    }
  }, [game?.settings]);

  // Effacer le message d'erreur après 3 secondes
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider les paramètres
    if (minTime >= maxTime) {
      setErrorMsg("Le temps minimum doit être inférieur au temps maximum");
      return;
    }
    
    if (minTime < 5 || maxTime > 60) {
      setErrorMsg("Le temps doit être entre 5 et 60 secondes");
      return;
    }
    
    if (startingLives < 1 || startingLives > 10) {
      setErrorMsg("Le nombre de vies doit être entre 1 et 10");
      return;
    }

    onUpdateSettings({ minTime, maxTime, startingLives });
    setErrorMsg("");
  };

  if (!isAdmin) {
    return null;
  }

  const isGameActive = game?.status === "playing";

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        ⚙️ Paramètres du jeu
      </h3>

      {/* Message d'erreur */}
      {errorMsg && (
        <div className="bg-red-500/90 border-2 border-red-400 text-white px-3 py-2 rounded-lg text-sm mb-4 animate-shake">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Temps minimum de la bombe */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Temps minimum de la bombe: {minTime}s
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={minTime}
            onChange={(e) => setMinTime(Number(e.target.value))}
            disabled={isGameActive}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     [&::-webkit-slider-thumb]:appearance-none 
                     [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-blue-500
                     [&::-moz-range-thumb]:w-4 
                     [&::-moz-range-thumb]:h-4 
                     [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-blue-500
                     [&::-moz-range-thumb]:border-0"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>5s</span>
            <span>30s</span>
          </div>
        </div>

        {/* Temps maximum de la bombe */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Temps maximum de la bombe: {maxTime}s
          </label>
          <input
            type="range"
            min="10"
            max="60"
            value={maxTime}
            onChange={(e) => setMaxTime(Number(e.target.value))}
            disabled={isGameActive}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     [&::-webkit-slider-thumb]:appearance-none 
                     [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-blue-500
                     [&::-moz-range-thumb]:w-4 
                     [&::-moz-range-thumb]:h-4 
                     [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-blue-500
                     [&::-moz-range-thumb]:border-0"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>10s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Nombre de vies */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Nombre de vies par joueur: {startingLives}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={startingLives}
            onChange={(e) => setStartingLives(Number(e.target.value))}
            disabled={isGameActive}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     [&::-webkit-slider-thumb]:appearance-none 
                     [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-red-500
                     [&::-moz-range-thumb]:w-4 
                     [&::-moz-range-thumb]:h-4 
                     [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-red-500
                     [&::-moz-range-thumb]:border-0"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>1 vie</span>
            <span>10 vies</span>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <button
          type="submit"
          disabled={isGameActive}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 
                   disabled:cursor-not-allowed text-white font-medium py-2 px-4 
                   rounded-lg transition-colors"
        >
          {isGameActive ? "⚠️ Partie en cours" : "💾 Sauvegarder les paramètres"}
        </button>

        {isGameActive && (
          <p className="text-xs text-yellow-300 text-center">
            Les paramètres ne peuvent être modifiés que lorsque le jeu est arrêté
          </p>
        )}
      </form>
    </div>
  );
}
