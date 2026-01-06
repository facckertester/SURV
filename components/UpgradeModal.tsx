import React from 'react';
import { UpgradeOption } from '../types';
import { Sparkles } from 'lucide-react';

interface Props {
  upgrades: UpgradeOption[];
  onSelect: (u: UpgradeOption) => void;
}

const UpgradeModal: React.FC<Props> = ({ upgrades, onSelect }) => {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-yellow-600/50 rounded-lg p-8 max-w-4xl w-full shadow-2xl shadow-yellow-900/20">
        <h2 className="text-4xl text-center text-yellow-500 fantasy-font mb-2 drop-shadow-lg">Level Up!</h2>
        <p className="text-center text-slate-400 mb-8 italic">Choose your destiny...</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upgrades.map((u) => {
            const isLegendary = u.rarity === 'legendary';
            return (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className={`group relative border p-6 rounded transition-all duration-200 text-left flex flex-col gap-2 ${
                  isLegendary 
                    ? 'bg-purple-900/40 border-purple-500 hover:bg-purple-900/60 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105' 
                    : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-yellow-500 hover:-translate-y-1'
                }`}
              >
                <div className={`absolute -inset-0.5 rounded blur transition duration-500 ${
                    isLegendary 
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-50 group-hover:opacity-75 animate-pulse' 
                    : 'bg-gradient-to-r from-yellow-600 to-purple-600 opacity-0 group-hover:opacity-30'
                }`}></div>
                
                {isLegendary && (
                    <div className="absolute -top-3 -right-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce z-10">
                        <Sparkles size={12} /> EVOLUTION
                    </div>
                )}

                <div className="relative z-10">
                    <h3 className={`text-xl font-bold ${isLegendary ? 'text-purple-100 group-hover:text-purple-50' : 'text-yellow-100 group-hover:text-yellow-400'}`}>
                        {u.name}
                    </h3>
                    <span className={`text-xs uppercase tracking-wider font-bold ${
                        isLegendary ? 'text-purple-300' : 
                        u.rarity === 'rare' ? 'text-blue-400' : 'text-slate-500'
                    }`}>
                        {u.rarity}
                    </span>
                    <p className={`text-sm mt-2 leading-relaxed ${isLegendary ? 'text-purple-200' : 'text-slate-300'}`}>
                        {u.description}
                    </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;