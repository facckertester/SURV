import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/Engine';
import Overlay from './components/Overlay';
import UpgradeModal from './components/UpgradeModal';
import MainMenu from './components/MainMenu';
import AchievementsScreen from './components/AchievementsScreen';
import LibraryScreen from './components/LibraryScreen';
import PowerUpStore from './components/PowerUpStore';
import PauseMenu from './components/PauseMenu';
import ChestModal from './components/ChestModal';
import { Player, UpgradeOption, GameStats } from './types';
import { generateFlavorText } from './services/geminiService';
import { loadStats, saveStats } from './services/storageService';
import { WEAPON_DEFINITIONS } from './constants';

enum AppState {
  MENU,
  ACHIEVEMENTS,
  LIBRARY,
  POWER_UP,
  PLAYING,
  PAUSED,
  LEVEL_UP,
  GAME_OVER,
  CHEST_REWARD
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.MENU);
  const [playerState, setPlayerState] = useState<Player | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [upgrades, setUpgrades] = useState<UpgradeOption[]>([]);
  const [chestRewards, setChestRewards] = useState<{ rewards: UpgradeOption[], gold: number }>({ rewards: [], gold: 0 });
  const [flavorText, setFlavorText] = useState("");
  const [gameStats, setGameStats] = useState<GameStats>(loadStats());
  
  useEffect(() => {
      setGameStats(loadStats());
  }, [appState === AppState.MENU]);

  // Handle Pause Key (Escape)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Escape') {
              if (appState === AppState.PLAYING) {
                  togglePause(true);
              } else if (appState === AppState.PAUSED) {
                  togglePause(false);
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState]);

  const togglePause = (shouldPause: boolean) => {
      if (!engineRef.current) return;
      
      if (shouldPause) {
          engineRef.current.isPaused = true;
          setAppState(AppState.PAUSED);
      } else {
          engineRef.current.isPaused = false;
          setAppState(AppState.PLAYING);
      }
  };

  // Initialize game
  const startGame = (characterId: string) => {
    if (!canvasRef.current) return;
    
    // Clean up old instance logic usually handled by engine loop check
    
    const engine = new GameEngine(
      canvasRef.current,
      characterId,
      (options) => {
        setUpgrades(options);
        setAppState(AppState.LEVEL_UP);
        triggerFlavor('LEVEL_UP', engine);
      },
      (stats) => {
        setAppState(AppState.GAME_OVER);
        triggerFlavor('GAME_OVER', engine);
        // Persist stats
        const newStats = saveStats(stats);
        setGameStats(newStats);
      },
      () => {
        triggerFlavor('BOSS_SPAWN', engine);
      },
      () => {
          handleChestOpen(engine);
      }
    );
    
    engineRef.current = engine;
    engine.start();
    setAppState(AppState.PLAYING);
    setFlavorText("");
  };

  const handleChestOpen = (engine: GameEngine) => {
      const isRare = Math.random() < 0.2; // Could potentially check chest property
      const rewardCount = isRare ? 3 : 1;
      const goldAmount = Math.floor((Math.random() * 200) + 100) * engine.player.stats.greed;
      
      const rewards: UpgradeOption[] = [];
      const upgradableWeapons = engine.player.weapons.filter(w => w.level < w.maxLevel);
      
      // Select random upgradable weapons
      for(let i = 0; i < rewardCount; i++) {
          if (upgradableWeapons.length > 0) {
              const weaponIndex = Math.floor(Math.random() * upgradableWeapons.length);
              const weapon = upgradableWeapons[weaponIndex];
              
              // We create a "fake" upgrade option that auto-applies
              rewards.push({
                  id: `chest_upgrade_${weapon.id}_${Date.now()}_${i}`,
                  name: WEAPON_DEFINITIONS[weapon.id].name,
                  description: `Upgraded to Level ${weapon.level + 1}`,
                  rarity: 'rare',
                  type: 'WEAPON',
                  apply: (p) => {
                      const w = p.weapons.find(x => x.id === weapon.id)!;
                      if (w.level < w.maxLevel) {
                          w.level++;
                          if (w.level % 2 === 0) w.damage *= 1.2;
                          if (w.level % 3 === 0) w.amount += 1;
                          w.area *= 1.1;
                      }
                  }
              });
              
              // Simulate level up for the selection pool logic (though visual only here until applied)
              // Actually we won't remove it from pool to allow "multilevel" in one chest?
              // For simplicity, let's just allow it.
          }
      }

      setChestRewards({ rewards, gold: Math.floor(goldAmount) });
      setAppState(AppState.CHEST_REWARD);
  };

  const closeChestModal = () => {
      if (!engineRef.current) return;
      
      // Apply rewards
      chestRewards.rewards.forEach(r => r.apply(engineRef.current!.player));
      
      // Add gold directly to run collection
      engineRef.current.goldCollected += chestRewards.gold;
      
      engineRef.current.isPaused = false;
      setAppState(AppState.PLAYING);
  }

  const triggerFlavor = async (situation: 'LEVEL_UP' | 'GAME_OVER' | 'BOSS_SPAWN', engine: GameEngine) => {
      const text = await generateFlavorText({
          level: engine.player.level,
          kills: engine.score,
          healthPercent: (engine.player.hp / engine.player.maxHp) * 100,
          situation
      });
      setFlavorText(text);
      setTimeout(() => setFlavorText(""), 4000);
  };

  // Sync UI Loop
  useEffect(() => {
    let interval: number;
    // We update stats even when paused to ensure PauseMenu has latest data if it was just triggered
    if ((appState === AppState.PLAYING || appState === AppState.PAUSED) && engineRef.current) {
      interval = window.setInterval(() => {
        const eng = engineRef.current!;
        setPlayerState({ ...eng.player });
        setScore(eng.score);
        setTime(Math.floor(eng.frameCount / 60));
      }, 100); 
    }
    return () => clearInterval(interval);
  }, [appState]);

  const handleUpgradeSelect = (u: UpgradeOption) => {
    if (engineRef.current) {
      u.apply(engineRef.current.player);
      engineRef.current.isPaused = false;
      setAppState(AppState.PLAYING);
    }
  };

  const toMenu = () => {
      // Force stop engine updates
      if(engineRef.current) engineRef.current.isGameOver = true;
      setAppState(AppState.MENU);
  }

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {appState === AppState.MENU && (
        <MainMenu 
            onStart={startGame} 
            onAchievements={() => setAppState(AppState.ACHIEVEMENTS)}
            onLibrary={() => setAppState(AppState.LIBRARY)}
            onPowerUp={() => setAppState(AppState.POWER_UP)}
            stats={gameStats}
        />
      )}

      {appState === AppState.ACHIEVEMENTS && (
          <AchievementsScreen stats={gameStats} onBack={toMenu} />
      )}

      {appState === AppState.LIBRARY && (
          <LibraryScreen stats={gameStats} onBack={toMenu} />
      )}

      {appState === AppState.POWER_UP && (
          <PowerUpStore 
             stats={gameStats} 
             onBack={toMenu} 
             onUpdateStats={(s) => setGameStats(s)}
          />
      )}

      {(appState === AppState.PLAYING || appState === AppState.PAUSED) && (
        <Overlay player={playerState} score={score} time={time} flavorText={flavorText} />
      )}

      {appState === AppState.PAUSED && playerState && (
          <PauseMenu 
            onResume={() => togglePause(false)} 
            onQuit={toMenu}
            stats={{ kills: score, time: time, level: playerState.level }}
          />
      )}

      {appState === AppState.LEVEL_UP && (
        <UpgradeModal upgrades={upgrades} onSelect={handleUpgradeSelect} />
      )}
      
      {appState === AppState.CHEST_REWARD && (
          <ChestModal 
            rewards={chestRewards.rewards} 
            gold={chestRewards.gold} 
            onClose={closeChestModal} 
          />
      )}

      {appState === AppState.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur z-50 animate-in zoom-in duration-500">
           <h2 className="text-6xl text-white fantasy-font mb-4 drop-shadow-lg">YOU DIED</h2>
           <div className="text-center mb-8 bg-black/40 p-6 rounded-lg border border-red-500/30">
             <p className="text-2xl text-red-200 mb-2">Survived: {Math.floor(time / 60)}m {time % 60}s</p>
             <p className="text-2xl text-red-200">Kills: {score}</p>
             <p className="text-xl text-slate-400 mt-4">Level Reached: {playerState?.level}</p>
             {flavorText && <p className="text-lg italic text-red-300 mt-4 border-t border-red-500/20 pt-4">"{flavorText}"</p>}
           </div>
           
           <div className="flex gap-4">
               <button 
                 onClick={toMenu}
                 className="px-8 py-4 bg-white text-red-900 hover:bg-slate-200 rounded text-xl font-bold transition-all border border-red-800"
               >
                 BACK TO MENU
               </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;