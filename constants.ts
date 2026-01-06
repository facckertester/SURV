import { Achievement, Character, GameStats, PowerUpConfig, Player } from './types';

export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const PLAYER_BASE_SPEED = 3.5;
export const PLAYER_BASE_HP = 100;
export const PLAYER_PICKUP_RANGE = 100;

export const SPAWN_RATE_INITIAL = 60; 
export const WAVE_DURATION = 3600;

export const COLORS = {
  player: '#3b82f6',
  gem: '#10b981', 
  damageText: '#f87171',
  background: '#0f0f11',
  
  // Weapon Colors
  shadowBolt: '#818cf8', // Indigo
  obsidianShard: '#475569', // Slate
  spectralShield: '#67e8f9', // Cyan
  corrosiveAura: '#84cc16', // Lime
  thunderStrike: '#e879f9', // Fuchsia
  plasmaCutter: '#fb923c', // Orange
  bloodSiphon: '#dc2626', // Red-600
  umbralBarrage: '#4c1d95', // Violet-900 (Dark Purple)
  
  // New Weapons (Wave 1)
  frostNova: '#22d3ee', // Cyan-400
  whirlingAxe: '#a16207', // Yellow-700
  flameBreath: '#f97316', // Orange-500
  voidTrap: '#581c87', // Purple-900
  ricochetBlade: '#94a3b8', // Slate-400

  // New Weapons (Wave 2)
  vortexOrb: '#7c3aed', // Violet-600
  infernoGrenade: '#b91c1c', // Red-700
  phantomDaggers: '#e2e8f0', // Slate-200

  // Props
  destructible: '#b45309', // Amber-700
  gold: '#fbbf24', // Amber-400
};

export const PASSIVE_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  maxLevel: number;
  stat: keyof Player['stats'];
  increase: number;
  icon: string; 
}> = {
  'spinach': { name: 'Dark Arts', description: 'Increases Might by 10%.', maxLevel: 5, stat: 'might', increase: 0.1, icon: 'skull' },
  'empty_tome': { name: 'Chrono Shard', description: 'Reduces Cooldowns by 8%.', maxLevel: 5, stat: 'cooldownReduction', increase: 0.08, icon: 'clock' },
  'candelabrador': { name: 'Void Expander', description: 'Increases Area by 10%.', maxLevel: 5, stat: 'area', increase: 0.1, icon: 'maximize' },
  'bracer': { name: 'Wind Gauntlet', description: 'Increases Projectile Speed by 10%.', maxLevel: 5, stat: 'speed', increase: 0.1, icon: 'wind' },
  'clover': { name: 'Fortune Die', description: 'Increases Luck by 10%. Critical hits deal 2x damage.', maxLevel: 5, stat: 'luck', increase: 0.1, icon: 'clover' },
  'wings': { name: 'Swift Boots', description: 'Increases Move Speed by 10%.', maxLevel: 5, stat: 'moveSpeed', increase: 0.1, icon: 'footprints' },
  'attractorb': { name: 'Magnetic Amulet', description: 'Increases Pickup Range by 25%.', maxLevel: 5, stat: 'magnet', increase: 0.25, icon: 'magnet' },
  'pummarola': { name: 'Regen Heart', description: 'Recover 0.2 HP/s.', maxLevel: 5, stat: 'recovery', increase: 0.2, icon: 'heart' },
  'duplicator': { name: 'Mirror Echo', description: 'Increases Projectile Amount by 1.', maxLevel: 2, stat: 'amount', increase: 1, icon: 'copy' }
};

export const POWER_UPS: PowerUpConfig[] = [
  { 
    id: 'might', name: 'Might', description: 'Increases damage dealt by 5%.', icon: '⚔️',
    baseCost: 200, costMultiplier: 1.5, maxLevel: 5, statKey: 'might', valuePerLevel: 0.05 
  },
  { 
    id: 'armor', name: 'Vitality', description: 'Increases Max HP by 10%.', icon: '❤️',
    baseCost: 150, costMultiplier: 1.3, maxLevel: 5, statKey: 'maxHp', valuePerLevel: 0.1 
  },
  { 
    id: 'recovery', name: 'Recovery', description: 'Recover 0.2 HP per second.', icon: '💖',
    baseCost: 300, costMultiplier: 1.7, maxLevel: 5, statKey: 'recovery', valuePerLevel: 0.2 
  },
  { 
    id: 'cooldown', name: 'Haste', description: 'Reduces cooldowns by 2.5%.', icon: '⚡',
    baseCost: 400, costMultiplier: 1.8, maxLevel: 5, statKey: 'cooldownReduction', valuePerLevel: 0.025 
  },
  { 
    id: 'area', name: 'Area', description: 'Increases attack area by 5%.', icon: '💥',
    baseCost: 300, costMultiplier: 1.5, maxLevel: 5, statKey: 'area', valuePerLevel: 0.05 
  },
  { 
    id: 'speed', name: 'Speed', description: 'Increases projectile speed by 5%.', icon: '🏹',
    baseCost: 200, costMultiplier: 1.4, maxLevel: 3, statKey: 'speed', valuePerLevel: 0.05 
  },
  { 
    id: 'growth', name: 'Growth', description: 'Increases XP gain by 5%.', icon: '🌱',
    baseCost: 500, costMultiplier: 2.0, maxLevel: 5, statKey: 'growth', valuePerLevel: 0.05 
  },
  { 
    id: 'greed', name: 'Greed', description: 'Increases Gold gain by 10%.', icon: '💰',
    baseCost: 400, costMultiplier: 1.8, maxLevel: 5, statKey: 'greed', valuePerLevel: 0.1 
  },
  { 
    id: 'luck', name: 'Luck', description: 'Increases Crit Chance by 5%.', icon: '🍀',
    baseCost: 600, costMultiplier: 2.0, maxLevel: 3, statKey: 'luck', valuePerLevel: 0.05 
  },
  { 
    id: 'magnet', name: 'Magnet', description: 'Increases pickup range by 15%.', icon: '🧲',
    baseCost: 250, costMultiplier: 1.4, maxLevel: 3, statKey: 'magnet', valuePerLevel: 0.15 
  }
];

export const ENEMY_STATS = {
  BAT: { hp: 10, speed: 2, damage: 5, xp: 1, radius: 10, color: '#ef4444' }, 
  ZOMBIE: { hp: 25, speed: 1.2, damage: 10, xp: 3, radius: 14, color: '#22c55e' },
  SKELETON: { hp: 50, speed: 1.5, damage: 15, xp: 5, radius: 14, color: '#cbd5e1' },
  GHOST: { hp: 15, speed: 2.8, damage: 8, xp: 2, radius: 12, color: '#94a3b8' },
  BOSS: { hp: 3000, speed: 2.5, damage: 40, xp: 1000, radius: 45, color: '#a855f7' },
};

export const CHARACTERS: Character[] = [
  {
    id: 'kael',
    name: 'Kael',
    title: 'The Riftwalker',
    description: 'Balanced stats. Starts with Shadow Bolt.',
    unlockCondition: 'Unlocked by default.',
    isUnlocked: () => true,
    baseStats: { maxHp: 100, speed: 3.5, might: 1.0, area: 1.0, cooldownReduction: 0 },
    startingWeaponId: 'shadow_bolt',
    color: '#3b82f6' // Blue
  },
  {
    id: 'lyra',
    name: 'Lyra',
    title: 'Pyromancer',
    description: 'High damage, low HP. Starts with Plasma Cutter.',
    unlockCondition: 'Kill 500 enemies total.',
    isUnlocked: (s) => s.totalKills >= 500,
    baseStats: { maxHp: 70, speed: 4.0, might: 1.3, area: 1.1, cooldownReduction: 0 },
    startingWeaponId: 'plasma_cutter',
    color: '#fb923c' // Orange
  },
  {
    id: 'grom',
    name: 'Grom',
    title: 'Ironclad',
    description: 'Very tanky, slow. Starts with Obsidian Shard.',
    unlockCondition: 'Survive for 10 minutes total.',
    isUnlocked: (s) => s.totalTime >= 600,
    baseStats: { maxHp: 160, speed: 2.8, might: 1.1, area: 1.2, cooldownReduction: 0 },
    startingWeaponId: 'obsidian_shard',
    color: '#475569' // Slate
  },
  {
    id: 'vex',
    name: 'Vex',
    title: 'Void Soul',
    description: 'Fast cooldowns, fragile. Starts with Spectral Shield.',
    unlockCondition: 'Reach Level 10 in a single run.',
    isUnlocked: (s) => s.maxLevel >= 10,
    baseStats: { maxHp: 50, speed: 3.8, might: 0.9, area: 1.0, cooldownReduction: 0.2 },
    startingWeaponId: 'spectral_shield',
    color: '#a855f7' // Purple
  },
  {
    id: 'seraphina',
    name: 'Seraphina',
    title: 'Wind Dancer',
    description: 'Incredibly fast. High cooldown reduction. Starts with Spectral Shield.',
    unlockCondition: 'Collect 1000 gems in total.',
    isUnlocked: (s) => (s.totalGems || 0) >= 1000,
    baseStats: { maxHp: 60, speed: 4.5, might: 0.9, area: 1.0, cooldownReduction: 0.25 },
    startingWeaponId: 'spectral_shield',
    color: '#f472b6' // Pink-400
  },
  {
    id: 'darius',
    name: 'Darius',
    title: 'Crimson Lord',
    description: 'Sustains through bloodshed. Starts with Blood Siphon.',
    unlockCondition: 'Kill 1500 enemies total.',
    isUnlocked: (s) => s.totalKills >= 1500,
    baseStats: { maxHp: 140, speed: 3.2, might: 1.0, area: 1.0, cooldownReduction: 0 },
    startingWeaponId: 'blood_siphon',
    color: '#dc2626' // Red
  },
  {
    id: 'isolde',
    name: 'Isolde',
    title: 'Frost Queen',
    description: 'Master of cold. Starts with Frost Nova.',
    unlockCondition: 'Reach Level 25 in a single run.',
    isUnlocked: (s) => s.maxLevel >= 25,
    baseStats: { maxHp: 80, speed: 3.4, might: 1.1, area: 1.3, cooldownReduction: 0.1 },
    startingWeaponId: 'frost_nova',
    color: '#06b6d4' // Cyan-500
  },
  {
    id: 'grimwald',
    name: 'Grimwald',
    title: 'The Executioner',
    description: 'Brutal melee fighter. Starts with Whirling Axe.',
    unlockCondition: 'Kill 3000 enemies total.',
    isUnlocked: (s) => s.totalKills >= 3000,
    baseStats: { maxHp: 150, speed: 3.0, might: 1.4, area: 1.0, cooldownReduction: 0 },
    startingWeaponId: 'whirling_axe',
    color: '#d97706' // Amber-600
  },
  {
    id: 'ignis',
    name: 'Ignis',
    title: 'The Bombardier',
    description: 'Explosive expert. Starts with Inferno Grenade.',
    unlockCondition: 'Kill 4000 enemies total.',
    isUnlocked: (s) => s.totalKills >= 4000,
    baseStats: { maxHp: 120, speed: 2.6, might: 1.5, area: 1.2, cooldownReduction: 0 },
    startingWeaponId: 'inferno_grenade',
    color: '#b91c1c' // Red-700
  },
  {
    id: 'elara',
    name: 'Elara',
    title: 'Phantom Blade',
    description: 'Swift and deadly. Starts with Phantom Daggers.',
    unlockCondition: 'Survive for 25 minutes total.',
    isUnlocked: (s) => s.totalTime >= 1500,
    baseStats: { maxHp: 75, speed: 4.2, might: 1.1, area: 1.0, cooldownReduction: 0.1 },
    startingWeaponId: 'phantom_daggers',
    color: '#cbd5e1' // Slate-300
  }
];

export const WEAPON_DEFINITIONS: Record<string, { name: string, description: string, unlockCondition: (s: GameStats) => boolean, unlockText: string }> = {
  'shadow_bolt': {
    name: 'Shadow Bolt',
    description: 'Fires energy bolts at nearest enemy.',
    unlockCondition: () => true,
    unlockText: 'Unlocked'
  },
  'obsidian_shard': {
    name: 'Obsidian Shard',
    description: 'Lobs heavy rocks in a high arc.',
    unlockCondition: (s) => s.maxLevel >= 5,
    unlockText: 'Reach Level 5.'
  },
  'spectral_shield': {
    name: 'Spectral Shield',
    description: 'Revolving energy crystals protect you.',
    unlockCondition: (s) => s.totalKills >= 200,
    unlockText: 'Kill 200 enemies.'
  },
  'corrosive_aura': {
    name: 'Corrosive Aura',
    description: 'Creates a toxic zone around you.',
    unlockCondition: (s) => s.totalTime >= 300,
    unlockText: 'Survive 5 minutes.'
  },
  'thunder_strike': {
    name: 'Thunder Strike',
    description: 'Calls down orbital lightning strikes.',
    unlockCondition: (s) => s.bossesKilled >= 1,
    unlockText: 'Kill a Boss.'
  },
  'plasma_cutter': {
    name: 'Plasma Cutter',
    description: 'Shoots a piercing wave horizontally.',
    unlockCondition: (s) => s.gamesPlayed >= 3,
    unlockText: 'Play 3 games.'
  },
  'blood_siphon': {
    name: 'Blood Siphon',
    description: 'Projectile that heals you on hit.',
    unlockCondition: (s) => s.totalKills >= 1000,
    unlockText: 'Kill 1000 enemies.'
  },
  'frost_nova': {
    name: 'Frost Nova',
    description: 'Emits a freezing pulse that damages nearby enemies.',
    unlockCondition: (s) => s.maxLevel >= 15,
    unlockText: 'Reach Level 15.'
  },
  'whirling_axe': {
    name: 'Whirling Axe',
    description: 'Spirals outward, slicing everything in its path.',
    unlockCondition: (s) => s.totalKills >= 2500,
    unlockText: 'Kill 2500 enemies.'
  },
  'flame_breath': {
    name: 'Flame Breath',
    description: 'Spews a cone of fire in front of you.',
    unlockCondition: (s) => s.totalTime >= 1200, // 20 mins
    unlockText: 'Survive 20 minutes.'
  },
  'void_trap': {
    name: 'Void Trap',
    description: 'Places a zone that damages enemies inside it.',
    unlockCondition: (s) => s.gamesPlayed >= 5,
    unlockText: 'Play 5 games.'
  },
  'ricochet_blade': {
    name: 'Ricochet Blade',
    description: 'Bounces between multiple enemies.',
    unlockCondition: (s) => (s.maxKills || 0) >= 300, // 300 kills in one game
    unlockText: 'Get 300 kills in one run.'
  },
  'vortex_orb': {
    name: 'Vortex Orb',
    description: 'Pulls nearby enemies into a crushing void.',
    unlockCondition: (s) => s.maxLevel >= 30,
    unlockText: 'Reach Level 30.'
  },
  'inferno_grenade': {
    name: 'Inferno Grenade',
    description: 'Explodes on impact, dealing massive area damage.',
    unlockCondition: (s) => s.totalKills >= 4000,
    unlockText: 'Kill 4000 enemies.'
  },
  'phantom_daggers': {
    name: 'Phantom Daggers',
    description: 'Fires a spread of daggers behind you.',
    unlockCondition: (s) => s.totalTime >= 1500,
    unlockText: 'Survive 25 minutes.'
  }
};

export const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlocked'>[] = [
  {
    id: 'novice_hunter',
    title: 'Novice Hunter',
    description: 'Kill 500 enemies in total.',
    condition: (s) => s.totalKills >= 500,
    icon: '🗡️'
  },
  {
    id: 'veteran_slayer',
    title: 'Veteran Slayer',
    description: 'Kill 5,000 enemies in total.',
    condition: (s) => s.totalKills >= 5000,
    icon: '💀'
  },
  {
    id: 'elite_slayer',
    title: 'Elite Slayer',
    description: 'Kill 20,000 enemies in total.',
    condition: (s) => s.totalKills >= 20000,
    icon: '🩸'
  },
  {
    id: 'gold_rush',
    title: 'Gold Rush',
    description: 'Collect 5,000 Gold total.',
    condition: (s) => (s.gold || 0) >= 5000,
    icon: '🪙'
  },
  {
    id: 'midas_touch',
    title: 'Midas Touch',
    description: 'Collect 50,000 Gold total.',
    condition: (s) => (s.gold || 0) >= 50000,
    icon: '👑'
  },
  {
    id: 'rampage',
    title: 'Rampage',
    description: 'Kill 1,500 enemies in a single run.',
    condition: (s) => (s.maxKills || 0) >= 1500,
    icon: '🌪️'
  },
  {
    id: 'annihilator',
    title: 'Annihilator',
    description: 'Kill 3,000 enemies in a single run.',
    condition: (s) => (s.maxKills || 0) >= 3000,
    icon: '☄️'
  },
  {
    id: 'weapon_collector',
    title: 'Weapon Collector',
    description: 'Unlock 5 different weapons.',
    condition: (s) => Object.values(WEAPON_DEFINITIONS).filter(w => w.unlockCondition(s)).length >= 5,
    icon: '🛡️'
  },
  {
    id: 'master_of_arms',
    title: 'Master of Arms',
    description: 'Unlock 10 different weapons.',
    condition: (s) => Object.values(WEAPON_DEFINITIONS).filter(w => w.unlockCondition(s)).length >= 10,
    icon: '⚔️'
  },
  {
    id: 'seasoned_veteran',
    title: 'Seasoned Veteran',
    description: 'Play 50 games.',
    condition: (s) => s.gamesPlayed >= 50,
    icon: '🎖️'
  },
  {
    id: 'immortal',
    title: 'Immortal',
    description: 'Play for a total of 5 hours.',
    condition: (s) => s.totalTime >= 18000,
    icon: '🕰️'
  },
  {
    id: 'technomancer',
    title: 'Technomancer',
    description: 'Purchase 20 Power Up levels.',
    condition: (s) => Object.values(s.powerUps || {}).reduce((a, b) => a + b, 0) >= 20,
    icon: '💸'
  },
  {
    id: 'survivor',
    title: 'Survivor',
    description: 'Survive for a total of 30 minutes.',
    condition: (s) => s.totalTime >= 1800,
    icon: '⏳'
  },
  {
    id: 'marathon',
    title: 'Marathon',
    description: 'Play for a total of 2 hours.',
    condition: (s) => s.totalTime >= 7200,
    icon: '🏃'
  },
  {
    id: 'awakened',
    title: 'Awakened',
    description: 'Reach Level 20 in a single run.',
    condition: (s) => s.maxLevel >= 20,
    icon: '✨'
  },
  {
    id: 'master_survivor',
    title: 'Master Survivor',
    description: 'Reach Level 40 in a single run.',
    condition: (s) => s.maxLevel >= 40,
    icon: '🌟'
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Defeat a Boss.',
    condition: (s) => s.bossesKilled >= 1,
    icon: '👑'
  },
  {
    id: 'boss_hunter',
    title: 'Boss Hunter',
    description: 'Defeat 5 Bosses total.',
    condition: (s) => s.bossesKilled >= 5,
    icon: '👹'
  },
  {
    id: 'treasure_hunter',
    title: 'Treasure Hunter',
    description: 'Collect 2,000 gems in total.',
    condition: (s) => (s.totalGems || 0) >= 2000,
    icon: '💎'
  },
  {
    id: 'gem_hoarder',
    title: 'Gem Hoarder',
    description: 'Collect 10,000 gems in total.',
    condition: (s) => (s.totalGems || 0) >= 10000,
    icon: '💰'
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Play 10 games.',
    condition: (s) => s.gamesPlayed >= 10,
    icon: '🎮'
  }
];