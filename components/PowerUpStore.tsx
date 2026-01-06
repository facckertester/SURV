import React, { useState } from 'react';
import { ArrowLeft, Coins, ArrowUp, Sword, Heart, Zap, Clock, Maximize, Wind, Sprout, Clover, Magnet, Lock, Activity } from 'lucide-react';
import { GameStats, PowerUpConfig } from '../types';
import { POWER_UPS } from '../constants';
import { persistStats } from '../services/storageService';

interface Props {
  stats: GameStats;
  onBack: () => void;
  onUpdateStats: (newStats: GameStats) => void;
}

const getPowerUpColor = (statKey: string) => {
    switch(statKey) {
        case 'might': return '#ef4444'; // Red
        case 'maxHp': return '#b91c1c'; // Dark Red
        case 'recovery': return '#f472b6'; // Pink
        case 'cooldownReduction': return '#facc15'; // Yellow
        case 'area': return '#06b6d4'; // Cyan
        case 'speed': return '#3b82f6'; // Blue
        case 'growth': return '#10b981'; // Emerald
        case 'greed': return '#fbbf24'; // Amber
        case 'luck': return '#4ade80'; // Green
        case 'magnet': return '#818cf8'; // Indigo
        default: return '#94a3b8';
    }
};

const getPowerUpIcon = (statKey: string, size: number = 24) => {
    switch(statKey) {
        case 'might': return <Sword size={size} />;
        case 'maxHp': return <Heart size={size} />;
        case 'recovery': return <Activity size={size} />;
        case 'cooldownReduction': return <Clock size={size} />;
        case 'area': return <Maximize size={size} />;
        case 'speed': return <Wind size={size} />;
        case 'growth': return <Sprout size={size} />;
        case 'greed': return <Coins size={size} />;
        case 'luck': return <Clover size={size} />;
        case 'magnet': return <Magnet size={size} />;
        default: return <Zap size={size} />;
    }
};

const PowerUpStore: React.FC<Props> = ({ stats, onBack, onUpdateStats }) => {
  const [currentGold, setCurrentGold] = useState(stats.gold || 0);
  const [powerUpLevels, setPowerUpLevels] = useState(stats.powerUps || {});

  const buyUpgrade = (config: PowerUpConfig) => {
    const currentLevel = powerUpLevels[config.id] || 0;
    if (currentLevel >= config.maxLevel) return;

    const cost = Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
    if (currentGold >= cost) {
      const newGold = currentGold - cost;
      const newLevels = { ...powerUpLevels, [config.id]: currentLevel + 1 };
      
      setCurrentGold(newGold);
      setPowerUpLevels(newLevels);

      const newStats = { ...stats, gold: newGold, powerUps: newLevels };
      persistStats(newStats);
      onUpdateStats(newStats);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-slate-950 z-50 p-6 overflow-y-auto">
      <div className="max-w-6xl w-full">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-slate-950/95 backdrop-blur z-20 py-4 px-2">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <h2 className="text-4xl text-yellow-500 fantasy-font drop-shadow-md">
                Power Up Store
            </h2>
            <div className="flex items-center gap-2 bg-slate-900 px-5 py-2 rounded-full border border-yellow-700/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <Coins className="text-yellow-400 fill-yellow-400/20" size={20} />
                <span className="text-yellow-100 font-mono font-bold text-xl tracking-wide">{currentGold.toLocaleString()}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {POWER_UPS.map(pu => {
                const level = powerUpLevels[pu.id] || 0;
                const isMax = level >= pu.maxLevel;
                const cost = Math.floor(pu.baseCost * Math.pow(pu.costMultiplier, level));
                const canAfford = currentGold >= cost;
                const color = getPowerUpColor(pu.statKey);
                const glowColor = `${color}40`;

                return (
                    <div 
                        key={pu.id} 
                        className="relative group rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 bg-[#0f172a] flex flex-col"
                        style={{ 
                            borderColor: isMax ? '#334155' : color,
                            boxShadow: isMax ? 'none' : `0 0 20px -5px ${glowColor}` 
                        }}
                    >
                        {/* Header Background Gradient */}
                        <div 
                            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
                            style={{ background: `linear-gradient(180deg, ${color} 0%, transparent 100%)` }}
                        />

                        <div className="relative p-5 flex flex-col h-full z-10">
                            {/* Icon & Level Row */}
                            <div className="flex justify-between items-start mb-4">
                                <div 
                                    className="w-14 h-14 rounded-lg shadow-lg border-2 border-slate-700 flex items-center justify-center text-2xl relative overflow-hidden bg-slate-800"
                                    style={{ borderColor: color, color: color }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                                    <div className="relative z-10">
                                        {getPowerUpIcon(pu.statKey, 28)}
                                    </div>
                                </div>
                                <div className={`text-xs font-bold px-2.5 py-1 rounded border ${isMax ? 'bg-green-900/30 border-green-700/50 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                                    LVL {level} / {pu.maxLevel}
                                </div>
                            </div>

                            {/* Name & Desc */}
                            <div className="mb-4 flex-grow">
                                <h3 className={`text-xl font-bold fantasy-font mb-2 ${isMax ? 'text-slate-400' : 'text-slate-200'}`}>
                                    {pu.name}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed min-h-[40px]">
                                    {pu.description}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6 border border-slate-700/50">
                                <div 
                                    className="h-full transition-all duration-500" 
                                    style={{ 
                                        width: `${(level / pu.maxLevel) * 100}%`,
                                        backgroundColor: color,
                                        boxShadow: `0 0 10px ${color}`
                                    }}
                                />
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => buyUpgrade(pu)}
                                disabled={isMax || !canAfford}
                                className={`w-full py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all relative overflow-hidden group/btn ${
                                    isMax 
                                    ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700'
                                    : canAfford 
                                        ? 'text-white shadow-lg hover:scale-[1.02] active:scale-95' 
                                        : 'bg-slate-900 text-red-400/60 cursor-not-allowed border border-red-900/20 grayscale'
                                }`}
                                style={!isMax && canAfford ? {
                                    background: `linear-gradient(to bottom, #ca8a04, #854d0e)`, // Gold gradient
                                    borderTop: '1px solid #fde047',
                                    borderBottom: '1px solid #713f12'
                                } : {}}
                            >
                                {isMax ? (
                                    <>
                                        <Lock size={16} /> MAXED OUT
                                    </>
                                ) : (
                                    <>
                                        {canAfford ? (
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                        ) : null}
                                        
                                        <ArrowUp size={18} className={canAfford ? "animate-bounce" : ""} />
                                        <div className="flex items-center gap-1">
                                            <span>{cost.toLocaleString()}</span>
                                            <Coins size={14} className={canAfford ? "text-yellow-200" : "text-red-400/60"} />
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default PowerUpStore;