import React, { useState, useEffect } from 'react';
import { UpgradeOption } from '../types';
import { Sparkles, Check, Gem } from 'lucide-react';

interface Props {
  rewards: UpgradeOption[];
  gold: number;
  onClose: () => void;
}

const ChestModal: React.FC<Props> = ({ rewards, gold, onClose }) => {
  const [state, setState] = useState<'DROP' | 'SHAKE' | 'OPEN' | 'REVEAL'>('DROP');
  const [particles, setParticles] = useState<Array<{id: number, tx: number, ty: number, color: string}>>([]);

  useEffect(() => {
    if (state === 'DROP') {
        const t = setTimeout(() => setState('SHAKE'), 600);
        return () => clearTimeout(t);
    }
    if (state === 'SHAKE') {
        const t = setTimeout(() => {
            setState('OPEN');
            createParticles();
        }, 1200);
        return () => clearTimeout(t);
    }
    if (state === 'OPEN') {
        const t = setTimeout(() => setState('REVEAL'), 1500);
        return () => clearTimeout(t);
    }
  }, [state]);

  const createParticles = () => {
      const p = [];
      for(let i=0; i<40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 150 + Math.random() * 150;
          p.push({
              id: i,
              tx: Math.cos(angle) * dist,
              ty: Math.sin(angle) * dist,
              color: Math.random() > 0.3 ? '#fbbf24' : '#ffffff' // Gold or White
          });
      }
      setParticles(p);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <style>{`
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes beams {
            0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
            20% { opacity: 1; }
            100% { opacity: 0; transform: scale(2) rotate(180deg); }
        }
        @keyframes particle {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
        .chest-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite; }
        .beam-effect { animation: beams 1.5s ease-out forwards; }
        .particle-effect { animation: particle 1s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center justify-center w-full max-w-2xl p-8 relative">
        
        {/* Particle Container - Behind Chest */}
        {state === 'OPEN' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {/* Radial Beams */}
                 <div className="absolute w-[800px] h-[800px] bg-gradient-conic from-yellow-500/0 via-yellow-500/30 to-yellow-500/0 beam-effect rounded-full blur-xl z-0" />
                 
                 {/* Particles */}
                 {particles.map(p => (
                     <div 
                        key={p.id}
                        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full particle-effect z-10"
                        style={{
                            backgroundColor: p.color,
                            '--tx': `${p.tx}px`,
                            '--ty': `${p.ty}px`
                        } as React.CSSProperties}
                     />
                 ))}
            </div>
        )}

        {state !== 'REVEAL' ? (
            <div className={`relative transition-all duration-300 transform 
                ${state === 'DROP' ? 'scale-0 opacity-0 translate-y-[-100px] animate-in slide-in-from-top duration-500 fade-in zoom-in' : 'scale-125 opacity-100'}
                ${state === 'SHAKE' ? 'chest-shake' : ''}
            `}>
                <div className="w-64 h-48 relative">
                     {/* Chest Base */}
                     <div className="absolute bottom-0 w-full h-3/4 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-xl border-4 border-amber-600 shadow-2xl z-10 overflow-hidden">
                        {/* Vertical Bands */}
                        <div className="absolute left-8 top-0 bottom-0 w-6 bg-amber-600 border-x border-amber-900/50" />
                        <div className="absolute right-8 top-0 bottom-0 w-6 bg-amber-600 border-x border-amber-900/50" />
                        {/* Lock Base */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/40 rounded-full blur-[2px]" />
                     </div>

                     {/* Chest Lid */}
                     <div className={`absolute top-0 w-full h-2/5 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-xl border-4 border-b-0 border-amber-500 z-20 origin-bottom transition-transform duration-300 ease-out
                         ${state === 'OPEN' ? '-rotate-[120deg] -translate-y-12' : 'rotate-0'}
                     `}>
                         {/* Lid Top Detail */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
                         <div className="absolute left-8 top-0 bottom-0 w-6 bg-amber-600 border-x border-amber-900/50" />
                         <div className="absolute right-8 top-0 bottom-0 w-6 bg-amber-600 border-x border-amber-900/50" />
                         
                         {/* Lock */}
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded border-2 border-yellow-200 shadow-lg z-30 flex items-center justify-center">
                             <div className="w-4 h-6 bg-black rounded-full" />
                         </div>
                     </div>

                     {/* Inner Glow (Visible when open) */}
                     <div className={`absolute top-1/2 left-4 right-4 h-2 bg-yellow-200 blur-md transition-opacity duration-300 z-15 ${state === 'OPEN' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                
                {state === 'OPEN' && (
                    <div className="absolute inset-0 bg-white animate-ping opacity-50 z-50 rounded-xl" />
                )}
            </div>
        ) : (
            <div className="w-full flex flex-col items-center animate-in zoom-in duration-500">
                <h2 className="text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 fantasy-font mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] tracking-widest">
                    TREASURE!
                </h2>
                
                <div className="bg-gradient-to-r from-slate-900/80 via-yellow-900/30 to-slate-900/80 border-y border-yellow-700/50 w-full py-4 mb-8 flex justify-center">
                     <div className="bg-yellow-950/80 border border-yellow-600 rounded-full px-8 py-2 text-yellow-200 flex items-center gap-3 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                        <Gem className="text-yellow-400 fill-yellow-400/20" size={20} />
                        <span className="font-bold text-xl tracking-wide">+{gold} Gold</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full mb-10">
                    {rewards.map((r, i) => (
                        <div 
                            key={i}
                            className="group bg-slate-800/80 border-2 border-yellow-600/60 p-5 rounded-xl flex items-center gap-5 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards hover:border-yellow-400 transition-colors"
                            style={{ animationDelay: `${i * 300}ms` }}
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-500 blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="bg-slate-900 p-4 rounded-full border border-yellow-700 relative z-10">
                                    <Sparkles className="text-yellow-400" size={28} />
                                </div>
                            </div>
                            
                            <div className="flex-1 text-left">
                                <h3 className="text-2xl font-bold text-yellow-100 mb-1">{r.name}</h3>
                                <p className="text-yellow-200/60 font-mono text-sm">{r.description}</p>
                            </div>
                            <div className="text-xs uppercase font-bold text-green-300 bg-green-900/40 px-3 py-1.5 rounded border border-green-500/30">
                                LEVEL UP
                            </div>
                        </div>
                    ))}
                    
                    {rewards.length === 0 && (
                        <div className="text-center text-slate-500 italic p-4 border border-slate-800 rounded">
                            The chest contained only gold...
                        </div>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="group bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-bold py-4 px-16 rounded-lg shadow-[0_0_30px_rgba(202,138,4,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(202,138,4,0.5)] flex items-center gap-3 border border-yellow-400/30"
                >
                    <Check size={28} className="group-hover:scale-110 transition-transform" /> 
                    <span className="text-xl">CLAIM REWARDS</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChestModal;