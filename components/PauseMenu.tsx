import React from 'react';
import { Play, XSquare, Volume2 } from 'lucide-react';

interface Props {
  onResume: () => void;
  onQuit: () => void;
  stats: {
    kills: number;
    time: number;
    level: number;
  };
}

const PauseMenu: React.FC<Props> = ({ onResume, onQuit, stats }) => {
  const minutes = Math.floor(stats.time / 60);
  const seconds = stats.time % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-lg shadow-2xl max-w-md w-full relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent opacity-50"></div>

        <h2 className="text-4xl text-white fantasy-font text-center mb-2 tracking-widest drop-shadow-md">PAUSED</h2>
        <div className="h-px w-24 bg-slate-600 mx-auto mb-6"></div>

        {/* Current Run Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center text-slate-300 font-mono text-sm bg-slate-950/50 p-4 rounded border border-slate-800">
            <div className="flex flex-col">
                <span className="text-slate-500 text-xs uppercase">Time</span>
                <span className="text-lg text-yellow-500">{timeStr}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-slate-500 text-xs uppercase">Level</span>
                <span className="text-lg text-blue-500">{stats.level}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-slate-500 text-xs uppercase">Kills</span>
                <span className="text-lg text-red-500">{stats.kills}</span>
            </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onResume}
            className="group flex items-center justify-center gap-3 w-full py-4 bg-red-900/80 hover:bg-red-800 text-white rounded border border-red-700 hover:border-red-500 transition-all shadow-lg"
          >
            <Play size={20} className="fill-white group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-wider">RESUME GAME</span>
          </button>
          
          <div className="h-px bg-slate-800 w-full my-1"></div>

          <button 
            onClick={onQuit}
            className="flex items-center justify-center gap-3 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-all"
          >
            <XSquare size={20} />
            <span className="font-bold tracking-wider">QUIT TO MENU</span>
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6 italic">
            "Rest while you can, survivor."
        </p>
      </div>
    </div>
  );
};

export default PauseMenu;