import React, { useState } from 'react';
import { ArrowLeft, Lock, Sword, User, Sparkles, Skull, Clock, Maximize, Wind, Clover, Magnet, Heart, Copy, Zap, Crosshair, Repeat, Shield, Flame, Axe, Orbit, Droplets, Snowflake, Bomb } from 'lucide-react';
import { GameStats } from '../types';
import { CHARACTERS, WEAPON_DEFINITIONS, COLORS, PASSIVE_DEFINITIONS } from '../constants';

interface Props {
  stats: GameStats;
  onBack: () => void;
}

const getPassiveIcon = (id: string) => {
    const size = 24;
    switch(id) {
        case 'spinach': return <Skull size={size} className="text-red-400" />;
        case 'empty_tome': return <Clock size={size} className="text-yellow-400" />;
        case 'candelabrador': return <Maximize size={size} className="text-cyan-400" />;
        case 'bracer': return <Wind size={size} className="text-slate-300" />;
        case 'clover': return <Clover size={size} className="text-green-400" />;
        case 'wings': return <Wind size={size} className="text-slate-200" />;
        case 'attractorb': return <Magnet size={size} className="text-blue-400" />;
        case 'pummarola': return <Heart size={size} className="text-pink-400" />;
        case 'duplicator': return <Copy size={size} className="text-indigo-400" />;
        default: return <Zap size={size} className="text-white" />;
    }
};

const getPassiveColor = (id: string) => {
    switch(id) {
        case 'spinach': return '#f87171';
        case 'empty_tome': return '#facc15';
        case 'candelabrador': return '#22d3ee';
        case 'bracer': return '#cbd5e1';
        case 'clover': return '#4ade80';
        case 'wings': return '#e2e8f0';
        case 'attractorb': return '#60a5fa';
        case 'pummarola': return '#f472b6';
        case 'duplicator': return '#818cf8';
        default: return '#94a3b8';
    }
};

const getWeaponIcon = (id: string, unlocked: boolean) => {
    const size = 24;
    if (!unlocked) return <Lock size={size} className="text-slate-500" />;
    
    switch(id) {
        case 'shadow_bolt': return <Zap size={size} className="text-indigo-400" />;
        case 'obsidian_shard': return <Skull size={size} className="text-slate-400" />;
        case 'spectral_shield': return <Shield size={size} className="text-cyan-400" />;
        case 'corrosive_aura': return <Skull size={size} className="text-lime-400" />; // Reusing skull for toxic
        case 'thunder_strike': return <Zap size={size} className="text-fuchsia-400" />;
        case 'plasma_cutter': return <Orbit size={size} className="text-orange-400" />;
        case 'blood_siphon': return <Droplets size={size} className="text-red-500" />;
        case 'frost_nova': return <Snowflake size={size} className="text-cyan-300" />;
        case 'whirling_axe': return <Axe size={size} className="text-yellow-600" />;
        case 'flame_breath': return <Flame size={size} className="text-orange-500" />;
        case 'void_trap': return <Crosshair size={size} className="text-purple-800" />; // Trap
        case 'ricochet_blade': return <Sword size={size} className="text-slate-300" />;
        case 'vortex_orb': return <Orbit size={size} className="text-violet-600" />;
        case 'inferno_grenade': return <Bomb size={size} className="text-red-600" />;
        case 'phantom_daggers': return <Sword size={size} className="text-slate-200" />;
        default: return <Sword size={size} className="text-white" />;
    }
};

const formatEffect = (stat: string, val: number) => {
    if (stat === 'amount') return `+${val} Amount`;
    if (stat === 'recovery') return `+${val} HP/sec`;
    // Format camelCase to Title Case (e.g. cooldownReduction -> Cooldown Reduction)
    const formattedStat = stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `+${Math.round(val * 100)}% ${formattedStat}`;
};

// Detailed stats mapping for display in Library
const WEAPON_DETAILS: Record<string, { dmg: string | number, cd: string, type: string, note?: string }> = {
    'shadow_bolt': { dmg: 15, cd: '0.8s', type: 'Projectile', note: 'Nearest Target' },
    'obsidian_shard': { dmg: 35, cd: '1.3s', type: 'Lobbed', note: 'High Arc' },
    'spectral_shield': { dmg: 15, cd: '3.0s', type: 'Orbital', note: 'Defensive' },
    'corrosive_aura': { dmg: 5, cd: '0.5s', type: 'Aura', note: 'Damage Zone' },
    'thunder_strike': { dmg: 50, cd: '1.5s', type: 'Instant', note: 'Random Target' },
    'plasma_cutter': { dmg: 25, cd: '1.0s', type: 'Wave', note: 'Infinite Pierce' },
    'blood_siphon': { dmg: 10, cd: '1.2s', type: 'Projectile', note: 'Heals Player' },
    'frost_nova': { dmg: 10, cd: '3.0s', type: 'Area', note: 'Freezes Enemies' },
    'whirling_axe': { dmg: 20, cd: '2.0s', type: 'Spiral', note: 'Expanding Orbit' },
    'flame_breath': { dmg: 8, cd: '1.5s', type: 'Cone', note: 'Short Range' },
    'void_trap': { dmg: 4, cd: '3.3s', type: 'Trap', note: 'Lingering Zone' },
    'ricochet_blade': { dmg: 15, cd: '1.2s', type: 'Projectile', note: 'Bounces' },
    'vortex_orb': { dmg: 5, cd: '3.0s', type: 'Projectile', note: 'Pull Effect' },
    'inferno_grenade': { dmg: 40, cd: '1.6s', type: 'Lobbed', note: 'Explodes' },
    'phantom_daggers': { dmg: 15, cd: '0.8s', type: 'Projectile', note: 'Rear Fire' },
    // Evolutions (in case they are added later)
    'umbral_barrage': { dmg: 25, cd: '0.7s', type: 'Barrage', note: 'Massive Dmg' },
};

const LibraryScreen: React.FC<Props> = ({ stats, onBack }) => {
  const [tab, setTab] = useState<'CHARACTERS' | 'WEAPONS' | 'PASSIVES'>('CHARACTERS');

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-slate-950 z-50 p-8 overflow-y-auto">
      <div className="max-w-5xl w-full">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
            <ArrowLeft size={20} /> Back to Menu
            </button>
            <h2 className="text-4xl text-yellow-500 fantasy-font">
                Library
            </h2>
            <div className="w-24"></div> {/* Spacer */}
        </div>

        <div className="flex gap-4 mb-8 justify-center flex-wrap">
            <button 
                onClick={() => setTab('CHARACTERS')}
                className={`px-6 py-2 rounded flex items-center gap-2 font-bold transition-all ${tab === 'CHARACTERS' ? 'bg-red-800 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <User size={18} /> Survivors
            </button>
            <button 
                onClick={() => setTab('WEAPONS')}
                className={`px-6 py-2 rounded flex items-center gap-2 font-bold transition-all ${tab === 'WEAPONS' ? 'bg-red-800 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Sword size={18} /> Arsenal
            </button>
            <button 
                onClick={() => setTab('PASSIVES')}
                className={`px-6 py-2 rounded flex items-center gap-2 font-bold transition-all ${tab === 'PASSIVES' ? 'bg-red-800 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Sparkles size={18} /> Passives
            </button>
        </div>

        {tab === 'CHARACTERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                {CHARACTERS.map(char => {
                    const unlocked = char.isUnlocked(stats);
                    const borderColor = unlocked ? char.color : '#334155';
                    const glowColor = unlocked ? `${char.color}40` : 'transparent';
                    
                    return (
                        <div 
                            key={char.id} 
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                            style={{ 
                                borderColor: borderColor,
                                backgroundColor: '#0f172a', // Slate 900
                                boxShadow: unlocked ? `0 0 20px ${glowColor}` : 'none'
                            }}
                        >
                            {/* Background Gradient Effect */}
                            {unlocked && (
                                <div 
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{ background: `linear-gradient(135deg, ${char.color} 0%, transparent 100%)` }}
                                />
                            )}

                            <div className="relative p-5 z-10">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div 
                                        className="w-16 h-16 rounded-full shadow-lg border-2 border-slate-700 flex items-center justify-center text-2xl relative overflow-hidden" 
                                        style={{ backgroundColor: unlocked ? char.color : '#1e293b' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                                        <div className="relative z-10">
                                            {unlocked ? <User className="text-white/50" /> : <Lock className="text-slate-500" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-bold fantasy-font ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                                            {char.name}
                                        </h3>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${unlocked ? 'text-white/60' : 'text-slate-600'}`}>
                                            {char.title}
                                        </p>
                                    </div>
                                </div>
                                
                                {unlocked ? (
                                    <>
                                        <p className="text-slate-400 text-sm italic mb-6 min-h-[40px] leading-relaxed border-l-2 border-slate-700 pl-3">
                                            "{char.description}"
                                        </p>
                                        
                                        {/* Stats Grid */}
                                        <div className="bg-slate-950/50 rounded-lg p-3 grid grid-cols-2 gap-y-3 gap-x-4 mb-4 border border-slate-800/50">
                                            <div className="flex items-center gap-2 text-xs text-slate-300" title="Max Health">
                                                <Heart size={14} className="text-red-500" />
                                                <span className="font-mono">{char.baseStats.maxHp} HP</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-300" title="Movement Speed">
                                                <Wind size={14} className="text-blue-400" />
                                                <span className="font-mono">{char.baseStats.speed} Speed</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-300" title="Damage Multiplier">
                                                <Sword size={14} className="text-orange-500" />
                                                <span className={`font-mono ${char.baseStats.might !== 1 ? 'text-orange-300 font-bold' : ''}`}>
                                                    {Math.round(char.baseStats.might * 100)}% Might
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-300" title="Area Multiplier">
                                                <Maximize size={14} className="text-cyan-500" />
                                                <span className={`font-mono ${char.baseStats.area !== 1 ? 'text-cyan-300 font-bold' : ''}`}>
                                                    {Math.round(char.baseStats.area * 100)}% Area
                                                </span>
                                            </div>
                                            {char.baseStats.cooldownReduction > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold col-span-2">
                                                    <Clock size={14} />
                                                    <span className="font-mono">-{Math.round(char.baseStats.cooldownReduction * 100)}% Cooldowns</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Starting Weapon Section */}
                                        <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-bold uppercase">Starting Weapon</span>
                                            <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm bg-yellow-900/10 px-2 py-1 rounded border border-yellow-900/30">
                                                <Sword size={14} />
                                                {WEAPON_DEFINITIONS[char.startingWeaponId]?.name || 'Unknown'}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-6 p-4 bg-slate-950/80 rounded border border-red-900/30 text-center flex flex-col items-center justify-center min-h-[140px]">
                                        <Lock className="mb-3 text-slate-700" size={32} />
                                        <p className="text-red-900/80 font-bold uppercase text-xs mb-2">Locked Condition</p>
                                        <p className="text-slate-500 text-sm font-medium">{char.unlockCondition}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {tab === 'WEAPONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                {Object.entries(WEAPON_DEFINITIONS).map(([id, def]) => {
                    const unlocked = def.unlockCondition(stats);
                    const details = WEAPON_DETAILS[id];
                    // Infer color from constant mapping if possible, else gray
                    // @ts-ignore
                    const color = COLORS[id.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] || '#64748b'; 
                    const borderColor = unlocked ? color : '#334155';
                    const glowColor = unlocked ? `${color}40` : 'transparent';

                    return (
                        <div 
                            key={id} 
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                            style={{ 
                                borderColor: borderColor,
                                backgroundColor: '#0f172a',
                                boxShadow: unlocked ? `0 0 20px ${glowColor}` : 'none'
                            }}
                        >
                            {/* Background Gradient */}
                            {unlocked && (
                                <div 
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
                                />
                            )}

                            <div className="relative p-5 z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div 
                                        className="w-16 h-16 rounded-lg shadow-lg border-2 border-slate-700 flex items-center justify-center text-2xl relative overflow-hidden bg-slate-800"
                                        style={{ borderColor: unlocked ? color : '#334155' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                                        <div className="relative z-10">
                                            {getWeaponIcon(id, unlocked)}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold fantasy-font ${unlocked ? 'text-slate-200' : 'text-slate-600'}`}>
                                            {def.name}
                                        </h3>
                                        {unlocked && details && (
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {details.type}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {unlocked ? (
                                    <>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[40px]">
                                            {def.description}
                                        </p>
                                        
                                        {details && (
                                            <div className="bg-slate-950/50 rounded-lg p-3 grid grid-cols-2 gap-y-3 gap-x-4 border border-slate-800/50">
                                                <div className="flex items-center gap-2 text-xs text-slate-300" title="Base Damage">
                                                    <Sword size={14} className="text-red-500" />
                                                    <span className="font-mono text-red-200">{details.dmg} Dmg</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-300" title="Cooldown">
                                                    <Clock size={14} className="text-yellow-500" />
                                                    <span className="font-mono text-yellow-200">{details.cd} CD</span>
                                                </div>
                                                {details.note && (
                                                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold col-span-2 bg-emerald-950/30 p-1.5 rounded border border-emerald-900/50">
                                                        <Zap size={14} />
                                                        <span>{details.note}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="mt-6 p-4 bg-slate-950/80 rounded border border-red-900/30 text-center flex flex-col items-center justify-center min-h-[140px]">
                                        <Lock className="mb-3 text-slate-700" size={32} />
                                        <p className="text-red-900/80 font-bold uppercase text-xs mb-2">Locked</p>
                                        <p className="text-slate-500 text-sm font-medium">{def.unlockText}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {tab === 'PASSIVES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                {Object.entries(PASSIVE_DEFINITIONS).map(([id, def]) => {
                    const color = getPassiveColor(id);
                    const glowColor = `${color}40`;
                    
                    return (
                        <div 
                            key={id} 
                            className="relative group rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                            style={{ 
                                borderColor: color,
                                backgroundColor: '#0f172a',
                                boxShadow: `0 0 20px ${glowColor}`
                            }}
                        >
                            {/* Background Gradient */}
                            <div 
                                className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
                            />

                            <div className="relative p-5 z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div 
                                        className="w-16 h-16 rounded-lg shadow-lg border-2 border-slate-700 flex items-center justify-center text-2xl relative overflow-hidden bg-slate-800"
                                        style={{ borderColor: color }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                                        <div className="relative z-10">
                                            {getPassiveIcon(id)}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold fantasy-font text-slate-200">
                                            {def.name}
                                        </h3>
                                        <div className="text-xs text-slate-500 font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800 inline-block mt-1">
                                            Max Level: {def.maxLevel}
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[40px]">
                                    {def.description}
                                </p>
                                
                                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Per Level Bonus</p>
                                    <div className="flex items-center gap-2">
                                        <ArrowLeft size={14} className="text-emerald-500 rotate-90" />
                                        <p className="text-sm font-mono text-emerald-400 font-bold">
                                            {formatEffect(def.stat, def.increase)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

      </div>
    </div>
  );
};

export default LibraryScreen;