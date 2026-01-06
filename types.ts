export type Vector2 = { x: number; y: number };

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  GEM = 'GEM',
  CHEST = 'CHEST',
  PROJECTILE = 'PROJECTILE',
  TEXT_PARTICLE = 'TEXT_PARTICLE',
  VISUAL_PARTICLE = 'VISUAL_PARTICLE',
  AURA = 'AURA',
  DESTRUCTIBLE = 'DESTRUCTIBLE',
  PICKUP = 'PICKUP'
}

export enum EnemyType {
  BAT = 'BAT',
  ZOMBIE = 'ZOMBIE',
  SKELETON = 'SKELETON',
  GHOST = 'GHOST',
  BOSS = 'BOSS'
}

export enum PickupType {
  GOLD = 'GOLD',
  CHICKEN = 'CHICKEN',
  VACUUM = 'VACUUM',
  ROSARY = 'ROSARY'
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  radius: number;
  color: string;
  markedForDeletion: boolean;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  unlockCondition: string; // Text description
  isUnlocked: (stats: GameStats) => boolean;
  baseStats: {
    maxHp: number;
    speed: number;
    might: number;
    area: number;
    cooldownReduction: number;
    lifesteal?: number;
  };
  startingWeaponId: string;
  color: string;
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  icon: string; // Lucide icon identifier
}

export interface Player extends Entity {
  type: EntityType.PLAYER;
  characterId: string;
  hp: number;
  maxHp: number;
  speed: number;
  pickupRange: number;
  weapons: Weapon[];
  passives: Passive[];
  xp: number;
  level: number;
  nextLevelXp: number;
  facingRight: boolean;
  stats: {
    might: number; // Damage multiplier
    cooldownReduction: number; // 0 to 1
    area: number; // Area multiplier
    speed: number; // Projectile speed multiplier
    lifesteal: number; // 0 to 1 (percentage of damage healed)
    greed: number; // Gold multiplier
    luck: number; // Crit chance (0-1)
    recovery: number; // HP per second
    growth: number; // XP multiplier
    amount: number; // Bonus projectile amount
    moveSpeed: number; // Movement speed multiplier
    magnet: number; // Pickup range multiplier
  };
}

export interface Enemy extends Entity {
  type: EntityType.ENEMY;
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  opacity?: number; 
  animationOffset: number; // 0 to Math.PI * 2
  visualVariant: number;   // Integer for slight visual differences
  stunTimer?: number; // New: Frames remaining for stun
  lastDamageTextId?: string; // For damage number clumping
}

export interface Gem extends Entity {
  type: EntityType.GEM;
  value: number;
  isVacuumed?: boolean;
}

export interface Destructible extends Entity {
  type: EntityType.DESTRUCTIBLE;
  hp: number;
}

export interface Pickup extends Entity {
  type: EntityType.PICKUP;
  pickupType: PickupType;
  value: number;
}

export interface Chest extends Entity {
  type: EntityType.CHEST;
  isRare: boolean; // For potential triple/penta chests later
}

export interface DamageText extends Entity {
  type: EntityType.TEXT_PARTICLE;
  text: string;
  value: number; // Numeric value for aggregation
  velocity: Vector2;
  life: number;
  opacity: number;
  isCrit: boolean; // Visual style
}

export interface VisualParticle extends Entity {
  type: EntityType.VISUAL_PARTICLE;
  life: number;
  maxLife: number;
  renderType: 'LIGHTNING' | 'EXPLOSION' | 'FROST_NOVA' | 'SPARK' | 'BLOOD' | 'CRIT';
  targetPos?: Vector2;
  width?: number;
  radius: number;
  velocity?: Vector2;
  gravity?: number;
}

export interface Projectile extends Entity {
  type: EntityType.PROJECTILE;
  velocity: Vector2;
  damage: number;
  duration: number;
  pierce: number;
  weaponId: string;
  behavior: 'STRAIGHT' | 'ARC' | 'ORBIT' | 'STATIONARY';
  knockback: number;
  orbitAngle?: number;
  orbitDistance?: number;
  orbitSpeed?: number;
  orbitGrowth?: number; // For spiraling projectiles
  gravity?: number;
  rotation?: number; // Visual rotation
  lastHitId?: string; // For ricochet to avoid hitting same enemy immediately
  pullRadius?: number; // New: Range to pull enemies in
  pullForce?: number; // New: Strength of pull
  onHitEffect?: 'EXPLODE' | 'STUN'; // New: Special on-hit logic
}

export interface Weapon {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cooldown: number;
  cooldownTimer: number;
  damage: number;
  area: number;
  speed: number;
  duration: number;
  amount: number;
  type: 'PROJECTILE' | 'AURA' | 'ORBITAL' | 'INSTANT';
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  type: 'WEAPON' | 'PASSIVE';
  apply: (player: Player) => void;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: (stats: GameStats) => boolean;
  unlocked: boolean;
  icon: string;
}

export interface PowerUpConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  statKey: 'might' | 'cooldownReduction' | 'area' | 'speed' | 'greed' | 'growth' | 'luck' | 'recovery' | 'magnet' | 'maxHp';
  valuePerLevel: number;
}

export interface GameStats {
  totalKills: number;
  totalTime: number; // seconds
  maxLevel: number;
  gamesPlayed: number;
  bossesKilled: number;
  unlockedWeapons: string[];
  totalGems: number;
  maxKills: number;
  gold: number;
  powerUps: Record<string, number>; // powerUpId -> level
}