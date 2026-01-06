import React, { useState } from 'react';
import { Play, Trophy, Skull, Lock, User, Book, Zap, Heart, Wind, Sword, Maximize, ArrowLeft } from 'lucide-react';
import { GameStats } from '../types';
import { CHARACTERS } from '../constants';

interface Props {
  onStart: (characterId: string) => void;
  onAchievements: () => void;
  onLibrary: () => void;
  onPowerUp: () => void;
  stats: GameStats;
}

const MainMenu: React.FC<Props> = ({ onStart, onAchievements, onLibrary, onPowerUp, stats }) => {
  const [view, setView] = useState<'MAIN' | 'CHAR_SELECT'>('MAIN');

  if (view === 'CHAR_SELECT') {
      return (
          <div className="absolute inset-0 flex flex-col items-center bg-slate-950 z-50 overflow-y-auto p-6">
              <div className="max-w-6xl w-full">
                <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-slate-950 z-20 py-4">
                    <button 
                        onClick={() => setView('MAIN')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h2 className="text-4xl text-red-500 fantasy-font">Select Survivor</h2>
                    <div className="w-16"></div> {/* Spacer */}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {CHARACTERS.map(char => {
                        const unlocked = char.isUnlocked(stats);
                        const borderColor = unlocked ? char.color : '#334155';
                        const glowColor = unlocked ? `${char.color}40` : 'transparent';

                        return (
                            <button
                                key={char.id}
                                onClick={() => unlocked && onStart(char.id)}
                                disabled={!unlocked}
                                className={`relative group text-left rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                    unlocked 
                                    ? 'hover:-translate-y-1 hover:shadow-2xl' 
                                    : 'opacity-70 cursor-not-allowed grayscale-[0.8]'
                                }`}
                                style={{ 
                                    borderColor: borderColor,
                                    backgroundColor: '#0f172a', // Slate 900
                                    boxShadow: unlocked ? `0 0 15px ${glowColor}` : 'none'
                                }}
                            >
                                {/* Background Gradient Hover Effect */}
                                {unlocked && (
                                    <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                                        style={{ background: `linear-gradient(135deg, ${char.color} 0%, transparent 100%)` }}
                                    />
                                )}

                                <div className="relative p-5 z-10 flex flex-col h-full">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className={`text-2xl font-bold fantasy-font leading-none mb-1 ${unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                                                {char.name}
                                            </h3>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${unlocked ? 'opacity-80' : 'text-slate-600'}`} style={{ color: unlocked ? char.color : undefined }}>
                                                {char.title}
                                            </span>
                                        </div>
                                        <div 
                                            className="w-12 h-12 rounded-lg border-2 shadow-inner flex items-center justify-center bg-slate-800 shrink-0"
                                            style={{ borderColor: unlocked ? char.color : '#334155' }}
                                        >
                                            {unlocked ? <User style={{ color: char.color }} /> : <Lock className="text-slate-600" />}
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 mb-6">
                                        {unlocked ? (
                                            <p className="text-slate-400 text-sm italic leading-relaxed border-l-2 border-slate-700 pl-3">
                                                "{char.description}"
                                            </p>
                                        ) : (
                                            <div className="bg-red-950/40 border border-red-900/30 p-3 rounded flex items-start gap-3 mt-2">
                                                <Lock size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="text-red-400 text-[10px] font-bold uppercase">Locked</span>
                                                    <p className="text-red-200/70 text-xs font-medium">{char.unlockCondition}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="bg-slate-950/60 rounded p-3 grid grid-cols-2 gap-2 text-xs border border-slate-800/50">
                                        <div className="flex items-center gap-2 text-slate-300" title="Max Health">
                                            <Heart size={14} className={unlocked ? "text-red-500" : "text-slate-600"} />
                                            <span className="font-mono">{char.baseStats.maxHp} HP</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300" title="Movement Speed">
                                            <Wind size={14} className={unlocked ? "text-blue-400" : "text-slate-600"} />
                                            <span className="font-mono">{char.baseStats.speed} Spd</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300" title="Might">
                                            <Sword size={14} className={unlocked ? "text-orange-500" : "text-slate-600"} />
                                            <span className="font-mono">{Math.round(char.baseStats.might * 100)}% Dmg</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300" title="Area">
                                            <Maximize size={14} className={unlocked ? "text-cyan-500" : "text-slate-600"} />
                                            <span className="font-mono">{Math.round(char.baseStats.area * 100)}% Area</span>
                                        </div>
                                    </div>
                                    
                                    {unlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
                                            <div className="bg-black/60 backdrop-blur-sm px-6 py-2 rounded border border-white/20 text-white font-bold tracking-widest shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                                START
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
              </div>
          </div>
      )
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-900 to-black pointer-events-none" />
       
       <h1 className="text-6xl md:text-8xl text-red-600 fantasy-font mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] text-center animate-pulse">
         CRIMSON SURVIVOR
       </h1>
       <p className="text-slate-500 font-mono mb-12 text-sm tracking-[0.5em] uppercase">The Night is Endless</p>

       <div className="flex flex-col gap-4 w-full max-w-xs z-10">
           <button 
             onClick={() => setView('CHAR_SELECT')}
             className="group flex items-center justify-center gap-3 px-8 py-4 bg-red-800 hover:bg-red-700 text-white rounded border border-red-600 transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
           >
             <Play size={24} className="group-hover:fill-current" /> 
             <span className="font-bold text-xl tracking-wider">START GAME</span>
           </button>

           <button 
                onClick={onPowerUp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-200 rounded border border-yellow-700/50 transition-all hover:text-white hover:scale-105"
            >
                <Zap size={20} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg tracking-wider">POWER UP</span>
           </button>

           <div className="flex gap-4">
                <button 
                    onClick={onAchievements}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-all hover:text-white"
                >
                    <Trophy size={18} />
                    <span className="font-bold text-sm tracking-wider">RECORDS</span>
                </button>
                <button 
                    onClick={onLibrary}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-all hover:text-white"
                >
                    <Book size={18} />
                    <span className="font-bold text-sm tracking-wider">LIBRARY</span>
                </button>
           </div>
       </div>

       <div className="mt-16 text-slate-500 text-sm flex gap-8">
           <div className="flex flex-col items-center">
               <Skull size={16} className="mb-1" />
               <span>{stats.totalKills.toLocaleString()} KILLS</span>
           </div>
           <div className="flex flex-col items-center">
               <User size={16} className="mb-1" />
               <span>{CHARACTERS.filter(c => c.isUnlocked(stats)).length} / {CHARACTERS.length} CHARS</span>
           </div>
       </div>
    </div>
  );
};

export default MainMenu;