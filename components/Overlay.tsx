import React from 'react';
import { Player } from '../types';
import { 
    Zap, Sword, Shield, Skull, Flame, Axe, Orbit, 
    CircleDashed, Snowflake, Droplets, Bomb,
    Clock, Maximize, Heart, Clover, Wind, Magnet, Copy
} from 'lucide-react';

interface OverlayProps {
  player: Player | null;
  score: number;
  time: number;
  flavorText: string;
}

// Map weapon/passive IDs to Lucide icons and colors for the HUD
const getIcon = (id: string, isPassive: boolean = false) => {
    const size = 18;
    if (isPassive) {
        switch(id) {
            case 'spinach': return <Skull size={size} className="text-red-400" />;
            case 'empty_tome': return <Clock size={size} className="text-yellow-400" />;
            case 'candelabrador': return <Maximize size={size} className="text-cyan-400" />;
            case 'bracer': return <Wind size={size} className="text-slate-300" />;
            case 'clover': return <Clover size={size} className="text-green-400" />;
            case 'wings': return <Wind size={size} className="text-slate-200" />; // Footprints not in list, using Wind
            case 'attractorb': return <Magnet size={size} className="text-blue-400" />;
            case 'pummarola': return <Heart size={size} className="text-pink-400" />;
            case 'duplicator': return <Copy size={size} className="text-indigo-400" />;
            default: return <CircleDashed size={size} className="text-white" />;
        }
    }

    switch(id) {
        case 'shadow_bolt': return <Zap size={size} className="text-indigo-400" />;
        case 'umbral_barrage': return <Zap size={size} className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" />;
        case 'obsidian_shard': return <Skull size={size} className="text-slate-400" />;
        case 'spectral_shield': return <Shield size={size} className="text-cyan-400" />;
        case 'corrosive_aura': return <CircleDashed size={size} className="text-lime-400" />;
        case 'thunder_strike': return <Zap size={size} className="text-fuchsia-400" />;
        case 'plasma_cutter': return <Orbit size={size} className="text-orange-400" />;
        case 'blood_siphon': return <Droplets size={size} className="text-red-500" />;
        case 'frost_nova': return <Snowflake size={size} className="text-cyan-300" />;
        case 'whirling_axe': return <Axe size={size} className="text-yellow-600" />;
        case 'flame_breath': return <Flame size={size} className="text-orange-500" />;
        case 'void_trap': return <CircleDashed size={size} className="text-purple-800" />;
        case 'ricochet_blade': return <Sword size={size} className="text-slate-300" />;
        case 'vortex_orb': return <Orbit size={size} className="text-violet-600" />;
        case 'inferno_grenade': return <Bomb size={size} className="text-red-600" />;
        case 'phantom_daggers': return <Sword size={size} className="text-slate-200" />;
        default: return <Sword size={size} className="text-white" />;
    }
};

const Overlay: React.FC<OverlayProps> = ({ player, score, time, flavorText }) => {
  if (!player) return null;

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const xpPercent = (player.xp / player.nextLevelXp) * 100;
  const hpPercent = (player.hp / player.maxHp) * 100;

  // Inventory Slots (Max 6 shown for style)
  const maxSlots = 6;
  const filledWeaponSlots = player.weapons.slice(0, maxSlots);
  const emptyWeaponSlots = Array(Math.max(0, maxSlots - filledWeaponSlots.length)).fill(null);

  const filledPassiveSlots = player.passives.slice(0, maxSlots);
  const emptyPassiveSlots = Array(Math.max(0, maxSlots - filledPassiveSlots.length)).fill(null);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar Container */}
      <div className="flex justify-between items-start w-full">
         
         {/* Left: Player Stats */}
         <div className="flex flex-col gap-2">
             <div 
                className="bg-slate-900/90 p-2 rounded-br-xl border-l-4 border-b border-r border-t-0 shadow-lg flex items-center gap-3 pr-6"
                style={{ borderColor: player.color }}
             >
                <div 
                    className="w-10 h-10 rounded border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-xl font-bold font-mono"
                    style={{ color: player.color, borderColor: `${player.color}60` }}
                >
                    {player.level}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Survivor Level</span>
                    {/* XP Bar Small */}
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-blue-500" style={{ width: `${xpPercent}%` }} />
                    </div>
                </div>
             </div>
         </div>

         {/* Center: Timer & Kill Count */}
         <div className="flex flex-col items-center pt-2">
             <div className="bg-gradient-to-b from-black/80 to-transparent px-8 pb-4 rounded-b-xl">
                 <h1 className="text-4xl font-bold fantasy-font text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest">{timeStr}</h1>
                 <div className="flex items-center justify-center gap-2 text-red-500 font-mono font-bold mt-1 drop-shadow-md bg-black/40 px-3 py-0.5 rounded-full text-sm border border-red-900/30">
                     <Skull size={14} /> 
                     <span>{score.toLocaleString()}</span>
                 </div>
             </div>
         </div>

         {/* Right: Weapons & Passives Inventory */}
         <div className="flex flex-col items-end gap-1 pointer-events-auto">
             {/* Weapons Row */}
             <div className="flex gap-1 mb-1">
                 {filledWeaponSlots.map((w, i) => (
                     <div 
                        key={`w-${i}`} 
                        className="group relative w-10 h-10 bg-slate-900/90 border border-slate-600 rounded shadow-lg flex items-center justify-center cursor-help"
                     >
                         <div className="absolute -top-1 -right-1 bg-black border border-slate-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold z-10">
                            {w.level}
                         </div>
                         <div className="opacity-90">{getIcon(w.id, false)}</div>
                         {w.cooldownTimer > 0 && (
                             <div 
                                className="absolute inset-0 bg-black/60 origin-bottom animate-pulse"
                                style={{ height: `${(w.cooldownTimer / w.cooldown) * 100}%` }}
                             />
                         )}
                         
                         {/* Weapon Tooltip */}
                         <div className="absolute right-full top-0 mr-3 w-48 p-3 bg-slate-950/95 border border-slate-600 rounded-lg shadow-xl hidden group-hover:block z-50 text-left backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-200">
                            <h4 className="text-sm font-bold text-yellow-400 mb-1 flex justify-between items-center">
                                {w.name}
                                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">LVL {w.level}</span>
                            </h4>
                            <div className="h-px w-full bg-slate-800 mb-2"></div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{w.description}</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-mono flex gap-2">
                                <span>DMG: {Math.round(w.damage)}</span>
                                <span>CD: {(w.cooldown / 60).toFixed(1)}s</span>
                            </div>
                         </div>
                     </div>
                 ))}
                 {emptyWeaponSlots.map((_, i) => (
                     <div key={`we-${i}`} className="w-10 h-10 bg-black/40 border border-slate-800 rounded flex items-center justify-center">
                         <div className="w-1 h-1 rounded-full bg-slate-800" />
                     </div>
                 ))}
             </div>

             {/* Passives Row */}
             <div className="flex gap-1">
                 {filledPassiveSlots.map((p, i) => (
                     <div 
                        key={`p-${i}`} 
                        className="group relative w-8 h-8 bg-slate-900/90 border border-slate-700 rounded shadow-lg flex items-center justify-center cursor-help"
                     >
                         <div className="absolute -bottom-1 -right-1 bg-black border border-slate-700 text-slate-300 text-[8px] w-3 h-3 flex items-center justify-center rounded-full font-bold z-10">
                            {p.level}
                         </div>
                         <div className="opacity-80">{getIcon(p.id, true)}</div>

                         {/* Passive Tooltip */}
                         <div className="absolute right-full bottom-0 mr-3 w-40 p-3 bg-slate-950/95 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50 text-left backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-200">
                            <h4 className="text-xs font-bold text-blue-300 mb-1 flex justify-between items-center">
                                {p.name}
                                <span className="text-[9px] text-slate-500">LVL {p.level}</span>
                            </h4>
                            <div className="h-px w-full bg-slate-800 mb-2"></div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{p.description}</p>
                         </div>
                     </div>
                 ))}
                 {emptyPassiveSlots.map((_, i) => (
                     <div key={`pe-${i}`} className="w-8 h-8 bg-black/20 border border-slate-900 rounded flex items-center justify-center">
                         <div className="w-1 h-1 rounded-full bg-slate-900" />
                     </div>
                 ))}
             </div>
         </div>
      </div>

      {/* Flavor Text Toast */}
      {flavorText && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-black/70 text-purple-200 px-8 py-3 rounded border border-purple-900/50 backdrop-blur animate-in slide-in-from-top-4 fade-in duration-500 text-center max-w-lg shadow-[0_0_30px_rgba(147,51,234,0.2)]">
             <span className="fantasy-font italic text-xl tracking-wide">"{flavorText}"</span>
          </div>
      )}

      {/* Bottom Center: Health Bar */}
      <div className="self-center w-full max-w-xl mb-6">
          <div className="relative">
              {/* Heart Icon Floating */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-slate-900 border-2 border-red-900 rounded-full p-1.5 shadow-lg">
                  <div className={`w-3 h-3 rounded-full bg-red-500 ${hpPercent < 30 ? 'animate-ping' : ''}`} />
              </div>

              <div 
                className="w-full h-5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden relative shadow-lg"
              >
                   <div 
                      className="h-full transition-all duration-200 ease-out relative"
                      style={{ 
                          width: `${hpPercent}%`, 
                          backgroundColor: hpPercent < 30 ? '#ef4444' : player.color, // Red if low health
                          boxShadow: `0 0 10px ${player.color}`
                      }}
                   >
                       {/* Gloss effect */}
                       <div className="absolute top-0 left-0 w-full h-[50%] bg-white/20" />
                   </div>
                   
                   {/* Text Overlay */}
                   <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 drop-shadow-md tracking-wider font-mono">
                      {Math.ceil(player.hp)} / {Math.ceil(player.maxHp)} HP
                   </span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Overlay;