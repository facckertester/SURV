import React from 'react';
import { ArrowLeft, Lock, CheckCircle2, Clock, Skull, Crosshair, BarChart3, Gem, Crown, Hourglass } from 'lucide-react';
import { Achievement, GameStats } from '../types';
import { ACHIEVEMENTS_LIST } from '../constants';

interface Props {
  stats: GameStats;
  onBack: () => void;
}

const colorStyles: Record<string, string> = {
  blue: 'text-blue-400 hover:border-blue-500/50',
  green: 'text-green-400 hover:border-green-500/50',
  red: 'text-red-400 hover:border-red-500/50',
  yellow: 'text-yellow-400 hover:border-yellow-500/50',
  purple: 'text-purple-400 hover:border-purple-500/50',
  emerald: 'text-emerald-400 hover:border-emerald-500/50',
  orange: 'text-orange-400 hover:border-orange-500/50',
  cyan: 'text-cyan-400 hover:border-cyan-500/50',
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: keyof typeof colorStyles }> = ({ label, value, icon, color }) => {
  const styles = colorStyles[color];
  const textColor = styles.split(' ')[0];
  const borderColor = styles.split(' ')[1];
  
  return (
    <div className={`bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4 transition-colors ${borderColor}`}>
        <div className={`p-3 rounded-full bg-slate-950 border border-slate-800 ${textColor}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">{label}</p>
            <p className="text-xl font-bold text-slate-200 font-mono">{value}</p>
        </div>
    </div>
  );
};

const AchievementsScreen: React.FC<Props> = ({ stats, onBack }) => {
  const totalAchievements = ACHIEVEMENTS_LIST.length;
  const unlockedAchievements = ACHIEVEMENTS_LIST.filter(a => a.condition(stats)).length;
  const progressPercent = Math.round((unlockedAchievements / totalAchievements) * 100);

  const avgTimeSeconds = stats.gamesPlayed > 0 ? Math.floor(stats.totalTime / stats.gamesPlayed) : 0;
  const avgMinutes = Math.floor(avgTimeSeconds / 60);
  const avgSeconds = avgTimeSeconds % 60;

  const totalHours = Math.floor(stats.totalTime / 3600);
  const totalMinutes = Math.floor((stats.totalTime % 3600) / 60);

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-slate-950 z-50 p-8 overflow-y-auto">
      <div className="max-w-5xl w-full">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Back to Menu
        </button>

        <h2 className="text-4xl text-yellow-500 fantasy-font mb-6 border-b border-slate-800 pb-4">
            Grim Records
        </h2>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <StatCard 
              label="Games Played" 
              value={stats.gamesPlayed} 
              icon={<Crosshair size={20} />} 
              color="blue"
            />
            <StatCard 
              label="Total Playtime" 
              value={`${totalHours}h ${totalMinutes}m`} 
              icon={<Hourglass size={20} />} 
              color="cyan"
            />
            <StatCard 
              label="Avg. Survival" 
              value={`${avgMinutes}m ${avgSeconds}s`} 
              icon={<Clock size={20} />} 
              color="green"
            />
             <StatCard 
              label="Completion" 
              value={`${progressPercent}%`} 
              icon={<BarChart3 size={20} />} 
              color="yellow"
            />
            
            <StatCard 
              label="Total Kills" 
              value={stats.totalKills.toLocaleString()} 
              icon={<Skull size={20} />} 
              color="red"
            />
            <StatCard 
              label="Best Kill Streak" 
              value={(stats.maxKills || 0).toLocaleString()} 
              icon={<Crown size={20} />} 
              color="orange"
            />
            <StatCard 
              label="Gems Collected" 
              value={(stats.totalGems || 0).toLocaleString()} 
              icon={<Gem size={20} />} 
              color="emerald"
            />
            <StatCard 
              label="Bosses Slain" 
              value={stats.bossesKilled} 
              icon={<Skull size={20} />} 
              color="purple"
            />
        </div>

        <h3 className="text-2xl text-slate-300 fantasy-font mb-4 flex items-center gap-2">
            Achievements <span className="text-sm font-sans text-slate-500 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">{unlockedAchievements} / {totalAchievements}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {ACHIEVEMENTS_LIST.map((ach) => {
                const unlocked = ach.condition(stats);
                return (
                    <div 
                        key={ach.id}
                        className={`p-6 rounded-lg border ${
                            unlocked 
                            ? 'bg-slate-900 border-yellow-600/50 shadow-[0_0_15px_rgba(202,138,4,0.1)]' 
                            : 'bg-slate-900/50 border-slate-800 opacity-60'
                        } flex items-center gap-4 transition-all`}
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-slate-800 border ${unlocked ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-600'}`}>
                            {unlocked ? ach.icon : <Lock size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-xl font-bold ${unlocked ? 'text-yellow-100' : 'text-slate-400'}`}>
                                {ach.title}
                            </h3>
                            <p className="text-slate-400 text-sm">{ach.description}</p>
                        </div>
                        {unlocked && <CheckCircle2 className="text-green-500" />}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default AchievementsScreen;