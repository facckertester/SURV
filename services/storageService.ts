import { GameStats } from '../types';

const STORAGE_KEY = 'crimson_survivor_stats_v3';

const DEFAULT_STATS: GameStats = {
  totalKills: 0,
  totalTime: 0,
  maxLevel: 1,
  gamesPlayed: 0,
  bossesKilled: 0,
  unlockedWeapons: ['shadow_bolt'],
  totalGems: 0,
  maxKills: 0,
  gold: 0,
  powerUps: {}
};

export const loadStats = (): GameStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATS;
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_STATS, ...parsed };
  } catch (e) {
    console.error("Failed to load stats", e);
    return DEFAULT_STATS;
  }
};

export const saveStats = (
  newData?: { kills: number; time: number; level: number; bossKilled?: boolean; gemsCollected: number; goldCollected: number }
) => {
  const stats = loadStats();
  
  let newStats: GameStats = { ...stats };

  if (newData) {
    newStats = {
      ...stats,
      totalKills: stats.totalKills + newData.kills,
      totalTime: stats.totalTime + newData.time,
      maxLevel: Math.max(stats.maxLevel, newData.level),
      gamesPlayed: stats.gamesPlayed + 1,
      bossesKilled: stats.bossesKilled + (newData.bossKilled ? 1 : 0),
      totalGems: (stats.totalGems || 0) + newData.gemsCollected,
      maxKills: Math.max(stats.maxKills || 0, newData.kills),
      gold: (stats.gold || 0) + newData.goldCollected
    };
  } else {
      // Just saving existing state (e.g. after buying upgrades)
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  } catch (e) {
    console.error("Failed to save stats", e);
  }
  
  return newStats;
};

// Directly save stats object (used by PowerUpStore)
export const persistStats = (stats: GameStats) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error("Failed to save stats", e);
    }
}

export const clearStats = () => {
    localStorage.removeItem(STORAGE_KEY);
}