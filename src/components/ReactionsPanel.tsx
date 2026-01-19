'use client';

import { useState } from 'react';
import { ReactionType, REACTION_CONFIGS, canAffordReaction } from '@/types/reactions';

interface ReactionsPanelProps {
  onReaction: (type: ReactionType) => void;
  balance: number;
  disabled?: boolean;
}

export function ReactionsPanel({ onReaction, balance, disabled = false }: ReactionsPanelProps) {
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);

  const reactions = Object.values(REACTION_CONFIGS);

  const handleReactionClick = (type: ReactionType) => {
    if (disabled || !canAffordReaction(balance, type)) return;
    
    setSelectedReaction(type);
    onReaction(type);
    
    // Reset selection after animation
    setTimeout(() => setSelectedReaction(null), 500);
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60 text-center mb-2">
        Send Reaction
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {reactions.map((reaction) => {
          const canAfford = canAffordReaction(balance, reaction.type);
          const isSelected = selectedReaction === reaction.type;
          
          return (
            <button
              key={reaction.type}
              onClick={() => handleReactionClick(reaction.type)}
              disabled={disabled || !canAfford}
              className={`
                relative group flex flex-col items-center justify-center p-2 rounded-lg
                transition-all duration-200 transform
                ${canAfford && !disabled 
                  ? 'hover:scale-110 hover:bg-white/10 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
                }
                ${isSelected ? 'scale-125 bg-white/20' : ''}
              `}
              title={`${reaction.name} (${reaction.cost} $PINDER)`}
            >
              <span className="text-2xl mb-1">{reaction.emoji}</span>
              <span className={`text-xs font-semibold ${reaction.color}`}>
                {reaction.cost}
              </span>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                            pointer-events-none z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 w-48 shadow-xl">
                  <div className="font-semibold mb-1">{reaction.name}</div>
                  <div className="text-gray-300 mb-2">{reaction.description}</div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="text-xs text-gray-400">Perks:</div>
                    <ul className="text-xs space-y-1">
                      {reaction.perks.slice(0, 2).map((perk, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-400 mr-1">•</span>
                          {perk}
                        </li>
                      ))}
                      {reaction.perks.length > 2 && (
                        <li className="text-gray-400">+{reaction.perks.length - 2} more...</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="text-xs text-center text-white/40 mt-2">
        Balance: {balance.toFixed(2)} $PINDER
      </div>
    </div>
  );
}
