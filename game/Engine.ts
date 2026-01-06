import { 
  Entity, Player, Enemy, Gem, Projectile, DamageText, VisualParticle, Chest, Destructible, Pickup,
  EntityType, EnemyType, PickupType, Vector2, Weapon, UpgradeOption, Character 
} from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_STATS, COLORS, PLAYER_PICKUP_RANGE, CHARACTERS, WEAPON_DEFINITIONS, POWER_UPS, PASSIVE_DEFINITIONS } from '../constants';
import { loadStats } from '../services/storageService';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bgPattern: CanvasPattern | null = null;
  
  player: Player;
  enemies: Enemy[] = [];
  gems: Gem[] = [];
  chests: Chest[] = [];
  destructibles: Destructible[] = [];
  pickups: Pickup[] = [];
  projectiles: Projectile[] = [];
  damageTexts: DamageText[] = [];
  particles: VisualParticle[] = [];
  
  keys: Set<string> = new Set();
  
  frameCount: number = 0;
  score: number = 0;
  gemsCollected: number = 0;
  goldCollected: number = 0;
  isPaused: boolean = false;
  isGameOver: boolean = false;
  bossKilled: boolean = false;
  
  // Callbacks
  onLevelUp: (options: any[]) => void;
  onGameOver: (stats: { kills: number; time: number; level: number; bossKilled: boolean; gemsCollected: number; goldCollected: number }) => void;
  onBossSpawn: () => void;
  onChestOpen: () => void;

  constructor(
    canvas: HTMLCanvasElement, 
    characterId: string,
    onLevelUp: (opts: any[]) => void, 
    onGameOver: (stats: { kills: number; time: number; level: number; bossKilled: boolean; gemsCollected: number; goldCollected: number }) => void,
    onBossSpawn: () => void,
    onChestOpen: () => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; 
    this.onLevelUp = onLevelUp;
    this.onGameOver = onGameOver;
    this.onBossSpawn = onBossSpawn;
    this.onChestOpen = onChestOpen;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);

    this.createBackgroundPattern();
    this.player = this.createPlayer(characterId);
    
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('resize', () => {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.createBackgroundPattern(); 
    });
  }

  createBackgroundPattern() {
      const size = 256;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const oCtx = offscreen.getContext('2d')!;

      oCtx.fillStyle = '#0a0a0c'; 
      oCtx.fillRect(0, 0, size, size);
      
      for(let i=0; i<40; i++) {
          oCtx.fillStyle = Math.random() > 0.5 ? '#111113' : '#050505';
          const s = Math.random() * 40 + 10;
          oCtx.fillRect(Math.random() * size, Math.random() * size, s, s);
      }

      oCtx.strokeStyle = '#1a1a1e';
      oCtx.lineWidth = 2;
      oCtx.beginPath();
      oCtx.moveTo(0, size);
      oCtx.lineTo(size, 0);
      oCtx.stroke();
      
      oCtx.strokeStyle = '#141416';
      oCtx.lineWidth = 1;
      oCtx.strokeRect(0, 0, size, size);

      this.bgPattern = this.ctx.createPattern(offscreen, 'repeat');
  }

  createPlayer(characterId: string): Player {
    const char = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
    const stats = loadStats();
    
    let bonusMight = 0;
    let bonusHp = 0;
    let bonusRecovery = 0;
    let bonusCooldown = 0;
    let bonusArea = 0;
    let bonusSpeed = 0;
    let bonusGrowth = 0;
    let bonusGreed = 0;
    let bonusLuck = 0;
    let bonusMagnet = 0;

    POWER_UPS.forEach(pu => {
        const level = stats.powerUps[pu.id] || 0;
        const val = level * pu.valuePerLevel;
        switch(pu.statKey) {
            case 'might': bonusMight += val; break;
            case 'maxHp': bonusHp += (char.baseStats.maxHp * val); break;
            case 'recovery': bonusRecovery += val; break;
            case 'cooldownReduction': bonusCooldown += val; break;
            case 'area': bonusArea += val; break;
            case 'speed': bonusSpeed += val; break;
            case 'growth': bonusGrowth += val; break;
            case 'greed': bonusGreed += val; break;
            case 'luck': bonusLuck += val; break;
            case 'magnet': bonusMagnet += val; break;
        }
    });

    const startingWeapon = this.getWeaponConfig(char.startingWeaponId);

    return {
      id: 'player',
      type: EntityType.PLAYER,
      characterId: char.id,
      pos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      radius: 12,
      color: char.color,
      markedForDeletion: false,
      hp: char.baseStats.maxHp + bonusHp,
      maxHp: char.baseStats.maxHp + bonusHp,
      speed: char.baseStats.speed,
      pickupRange: PLAYER_PICKUP_RANGE * (1 + bonusMagnet),
      weapons: [startingWeapon],
      passives: [],
      xp: 0,
      level: 1,
      nextLevelXp: 50,
      facingRight: true,
      stats: {
          might: char.baseStats.might + bonusMight,
          cooldownReduction: Math.min(0.5, char.baseStats.cooldownReduction + bonusCooldown),
          area: char.baseStats.area + bonusArea,
          speed: 1 + bonusSpeed,
          lifesteal: char.baseStats.lifesteal || 0,
          greed: 1 + bonusGreed,
          growth: 1 + bonusGrowth,
          luck: bonusLuck,
          recovery: bonusRecovery,
          amount: 0,
          moveSpeed: 1,
          magnet: 1 + bonusMagnet
      }
    };
  }

  getWeaponConfig(id: string): Weapon {
      switch(id) {
          case 'shadow_bolt':
              return { id, name: 'Shadow Bolt', description: 'Fires energy bolts.', level: 1, maxLevel: 8, cooldown: 50, cooldownTimer: 0, damage: 15, area: 1, speed: 7, duration: 60, amount: 1, type: 'PROJECTILE' };
          case 'umbral_barrage':
              return { id, name: 'Umbral Barrage', description: 'Evolution: Void destruction.', level: 1, maxLevel: 1, cooldown: 45, cooldownTimer: 0, damage: 25, area: 1.5, speed: 8, duration: 80, amount: 5, type: 'PROJECTILE' };
          case 'obsidian_shard':
              return { id, name: 'Obsidian Shard', description: 'Heavy lobbed projectile.', level: 1, maxLevel: 8, cooldown: 80, cooldownTimer: 0, damage: 35, area: 1.5, speed: 1, duration: 120, amount: 1, type: 'PROJECTILE' };
          case 'spectral_shield':
              return { id, name: 'Spectral Shield', description: 'Orbiting crystals.', level: 1, maxLevel: 8, cooldown: 180, cooldownTimer: 0, damage: 15, area: 1.2, speed: 1, duration: 180, amount: 1, type: 'ORBITAL' };
          case 'corrosive_aura':
              return { id, name: 'Corrosive Aura', description: 'Toxic zone.', level: 1, maxLevel: 8, cooldown: 30, cooldownTimer: 0, damage: 5, area: 1.2, speed: 0, duration: 0, amount: 1, type: 'AURA' };
          case 'thunder_strike':
              return { id, name: 'Thunder Strike', description: 'Orbital lightning.', level: 1, maxLevel: 8, cooldown: 90, cooldownTimer: 0, damage: 50, area: 1, speed: 0, duration: 0, amount: 2, type: 'INSTANT' };
          case 'plasma_cutter':
              return { id, name: 'Plasma Cutter', description: 'Horizontal wave.', level: 1, maxLevel: 8, cooldown: 60, cooldownTimer: 0, damage: 25, area: 1, speed: 8, duration: 100, amount: 1, type: 'PROJECTILE' };
          case 'blood_siphon':
              return { id, name: 'Blood Siphon', description: 'Heals on hit.', level: 1, maxLevel: 8, cooldown: 70, cooldownTimer: 0, damage: 10, area: 1, speed: 6, duration: 60, amount: 1, type: 'PROJECTILE' };
          case 'frost_nova':
              return { id, name: 'Frost Nova', description: 'Freezing pulse.', level: 1, maxLevel: 8, cooldown: 180, cooldownTimer: 0, damage: 10, area: 1.5, speed: 0, duration: 0, amount: 1, type: 'INSTANT' };
          case 'whirling_axe':
              return { id, name: 'Whirling Axe', description: 'Spiraling projectile.', level: 1, maxLevel: 8, cooldown: 120, cooldownTimer: 0, damage: 20, area: 1, speed: 5, duration: 150, amount: 1, type: 'PROJECTILE' };
          case 'flame_breath':
              return { id, name: 'Flame Breath', description: 'Spews a cone of fire in front of you.', level: 1, maxLevel: 8, cooldown: 90, cooldownTimer: 0, damage: 8, area: 1, speed: 5, duration: 40, amount: 3, type: 'PROJECTILE' };
          case 'void_trap':
              return { id, name: 'Void Trap', description: 'Static damaging zone.', level: 1, maxLevel: 8, cooldown: 200, cooldownTimer: 0, damage: 4, area: 1, speed: 0, duration: 300, amount: 1, type: 'PROJECTILE' };
          case 'ricochet_blade':
              return { id, name: 'Ricochet Blade', description: 'Bouncing blade.', level: 1, maxLevel: 8, cooldown: 70, cooldownTimer: 0, damage: 15, area: 1, speed: 7, duration: 180, amount: 1, type: 'PROJECTILE' };
          case 'vortex_orb':
              return { id, name: 'Vortex Orb', description: 'Pulls enemies in.', level: 1, maxLevel: 8, cooldown: 180, cooldownTimer: 0, damage: 5, area: 1.2, speed: 2, duration: 180, amount: 1, type: 'PROJECTILE' };
          case 'inferno_grenade':
              return { id, name: 'Inferno Grenade', description: 'Explodes on impact.', level: 1, maxLevel: 8, cooldown: 100, cooldownTimer: 0, damage: 40, area: 1.5, speed: 1, duration: 80, amount: 1, type: 'PROJECTILE' };
          case 'phantom_daggers':
              return { id, name: 'Phantom Daggers', description: 'Fires backwards.', level: 1, maxLevel: 8, cooldown: 45, cooldownTimer: 0, damage: 15, area: 1, speed: 8, duration: 80, amount: 2, type: 'PROJECTILE' };
          default:
              return { id, name: 'Unknown', description: '?', level: 1, maxLevel: 1, cooldown: 100, cooldownTimer: 0, damage: 1, area: 1, speed: 1, duration: 1, amount: 1, type: 'PROJECTILE' };
      }
  }

  start() {
    this.loop();
  }

  loop = () => {
    if (!this.isPaused && !this.isGameOver) {
      this.update();
      this.draw();
    }
    requestAnimationFrame(this.loop);
  };

  update() {
    this.frameCount++;
    
    // Recovery
    if (this.player.stats.recovery > 0 && this.frameCount % 60 === 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.stats.recovery);
    }

    // Input & Movement
    let dx = 0;
    let dy = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy += 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) { dx -= 1; this.player.facingRight = false; }
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) { dx += 1; this.player.facingRight = true; }
    
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = this.player.speed * this.player.stats.moveSpeed;
      this.player.pos.x += (dx / length) * moveSpeed;
      this.player.pos.y += (dy / length) * moveSpeed;
    }
    
    // Safety check for player position
    if (isNaN(this.player.pos.x) || isNaN(this.player.pos.y)) {
        this.player.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    this.handleSpawning();
    this.updateEnemies();
    this.updateProjectiles();
    this.updateGems();
    this.updateWeapons();
    this.updateParticles();
    this.updateChests(); 
    this.updateDestructibles();
    this.updatePickups();
    this.checkCollisions();
    this.cleanup();
  }

  handleSpawning() {
    const difficultyMultiplier = 1 + (this.frameCount / 3600); 
    const spawnRate = Math.max(5, Math.floor(50 / difficultyMultiplier));
    
    if (this.frameCount % spawnRate === 0) {
      this.spawnEnemy();
    }

    if (this.frameCount > 0 && this.frameCount % 3600 === 0) {
        this.spawnBoss();
    }

    if (this.frameCount % 300 === 0 && this.destructibles.length < 10) {
        this.spawnDestructible();
    }
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(window.innerWidth, window.innerHeight) / 2 + 100;
    const spawnPos = {
      x: this.player.pos.x + Math.cos(angle) * distance,
      y: this.player.pos.y + Math.sin(angle) * distance
    };

    let type: EnemyType = EnemyType.BAT;
    const minutes = this.frameCount / 3600;
    const r = Math.random();

    if (minutes > 5) {
        if (r < 0.2) type = EnemyType.GHOST;
        else if (r < 0.5) type = EnemyType.SKELETON;
        else type = EnemyType.ZOMBIE;
    } else if (minutes > 2) {
        if (r < 0.1) type = EnemyType.GHOST;
        else if (r < 0.6) type = EnemyType.SKELETON;
        else type = EnemyType.ZOMBIE;
    } else if (minutes > 1) {
        if (r < 0.6) type = EnemyType.ZOMBIE;
        else type = EnemyType.BAT;
    }

    const stats = ENEMY_STATS[type];

    this.enemies.push({
      id: Math.random().toString(36),
      type: EntityType.ENEMY,
      enemyType: type,
      pos: spawnPos,
      radius: stats.radius,
      color: stats.color,
      hp: stats.hp * (1 + minutes * 0.4),
      maxHp: stats.hp * (1 + minutes * 0.4),
      speed: stats.speed + (minutes * 0.1),
      damage: stats.damage,
      xpValue: stats.xp,
      opacity: type === EnemyType.GHOST ? 0.6 : 1.0,
      markedForDeletion: false,
      animationOffset: Math.random() * Math.PI * 2,
      visualVariant: Math.floor(Math.random() * 3)
    });
  }

  spawnDestructible() {
      const angle = Math.random() * Math.PI * 2;
      const dist = 400 + Math.random() * 200;
      this.destructibles.push({
          id: 'dest_' + Date.now(),
          type: EntityType.DESTRUCTIBLE,
          pos: { x: this.player.pos.x + Math.cos(angle) * dist, y: this.player.pos.y + Math.sin(angle) * dist },
          hp: 1,
          radius: 15,
          color: COLORS.destructible,
          markedForDeletion: false
      });
  }

  spawnBoss() {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(window.innerWidth, window.innerHeight) / 2 + 150;
      const stats = ENEMY_STATS.BOSS;
      
      this.enemies.push({
        id: 'boss-' + Date.now(),
        type: EntityType.ENEMY,
        enemyType: EnemyType.BOSS,
        pos: {
            x: this.player.pos.x + Math.cos(angle) * distance,
            y: this.player.pos.y + Math.sin(angle) * distance
        },
        radius: stats.radius,
        color: stats.color,
        hp: stats.hp * (1 + (this.frameCount / 3600) * 0.8),
        maxHp: stats.hp,
        speed: stats.speed,
        damage: stats.damage,
        xpValue: stats.xp,
        markedForDeletion: false,
        animationOffset: 0,
        visualVariant: 0
      });
      
      this.onBossSpawn();
  }

  updateEnemies() {
    this.enemies.forEach(enemy => {
      if (enemy.stunTimer && enemy.stunTimer > 0) {
          enemy.stunTimer--;
          return; 
      }

      const dx = this.player.pos.x - enemy.pos.x;
      const dy = this.player.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        enemy.pos.x += (dx / dist) * enemy.speed;
        enemy.pos.y += (dy / dist) * enemy.speed;
      }
      
      this.enemies.forEach(other => {
          if (enemy === other) return;
          const odx = enemy.pos.x - other.pos.x;
          const ody = enemy.pos.y - other.pos.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          if (odist < enemy.radius + other.radius && odist > 0) {
             const pushFactor = 0.05;
             enemy.pos.x += (odx / odist) * pushFactor;
             enemy.pos.y += (ody / odist) * pushFactor;
          }
      });
    });
  }

  updateProjectiles() {
    this.projectiles.forEach(p => {
      if (p.behavior === 'STRAIGHT') {
          p.pos.x += p.velocity.x;
          p.pos.y += p.velocity.y;
      } else if (p.behavior === 'ARC') {
          p.pos.x += p.velocity.x;
          p.pos.y += p.velocity.y;
          if (p.gravity) p.velocity.y += p.gravity;
      } else if (p.behavior === 'ORBIT') {
          if (p.orbitAngle !== undefined && p.orbitDistance !== undefined && p.orbitSpeed !== undefined) {
             p.orbitAngle += p.orbitSpeed;
             if (p.orbitGrowth && p.orbitGrowth > 0) {
                 p.orbitDistance += p.orbitGrowth;
             }
             p.pos.x = this.player.pos.x + Math.cos(p.orbitAngle) * p.orbitDistance;
             p.pos.y = this.player.pos.y + Math.sin(p.orbitAngle) * p.orbitDistance;
          }
      } else if (p.behavior === 'STATIONARY') {
          // Do nothing
      }

      if (p.pullRadius && p.pullForce) {
          this.enemies.forEach(e => {
             const dx = p.pos.x - e.pos.x;
             const dy = p.pos.y - e.pos.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             if (dist < p.pullRadius!) {
                 e.pos.x += (dx / dist) * p.pullForce!;
                 e.pos.y += (dy / dist) * p.pullForce!;
             }
          });
      }

      if (p.duration === 1 && p.onHitEffect === 'EXPLODE') {
          this.triggerExplosion(p);
      }

      p.duration--;
      if (p.duration <= 0) p.markedForDeletion = true;
    });
  }

  updateGems() {
      this.gems.forEach(g => {
          const dx = this.player.pos.x - g.pos.x;
          const dy = this.player.pos.y - g.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const range = this.player.pickupRange * this.player.stats.magnet;

          if (g.isVacuumed || dist < range) {
              const pullSpeed = g.isVacuumed ? 15 : (8 + (range - dist) * 0.1);
              g.pos.x += (dx / dist) * pullSpeed;
              g.pos.y += (dy / dist) * pullSpeed;
              
              if (dist < this.player.radius) {
                  this.player.xp += g.value * this.player.stats.growth;
                  this.gemsCollected++; 
                  g.markedForDeletion = true;
                  this.checkLevelUp();
              }
          }
      });
  }

  updateDestructibles() {
      // Static entities
  }

  updatePickups() {
      this.pickups.forEach(p => {
          const dx = this.player.pos.x - p.pos.x;
          const dy = this.player.pos.y - p.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const range = this.player.pickupRange * this.player.stats.magnet;

          if (dist < range) {
              const pullSpeed = 8;
              p.pos.x += (dx / dist) * pullSpeed;
              p.pos.y += (dy / dist) * pullSpeed;

              if (dist < this.player.radius) {
                  this.applyPickupEffect(p);
                  p.markedForDeletion = true;
              }
          }
      });
  }

  applyPickupEffect(p: Pickup) {
      switch(p.pickupType) {
          case PickupType.GOLD:
              const gold = Math.ceil(p.value * this.player.stats.greed);
              this.goldCollected += gold;
              this.addDamageText(this.player.pos, gold, false, 'HEAL'); 
              break;
          case PickupType.CHICKEN:
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + p.value);
              this.addDamageText(this.player.pos, p.value, false, 'HEAL');
              break;
          case PickupType.VACUUM:
              this.gems.forEach(g => g.isVacuumed = true);
              break;
          case PickupType.ROSARY:
              const screenW = window.innerWidth;
              const screenH = window.innerHeight;
              this.enemies.forEach(e => {
                  if (e.enemyType === EnemyType.BOSS) return;
                  if (Math.abs(e.pos.x - this.player.pos.x) < screenW/2 + 100 &&
                      Math.abs(e.pos.y - this.player.pos.y) < screenH/2 + 100) {
                          e.hp = 0;
                          this.handleEnemyDeath(e);
                  }
              });
              this.particles.push({
                  id: Math.random().toString(),
                  type: EntityType.VISUAL_PARTICLE,
                  pos: { ...this.player.pos },
                  life: 10,
                  maxLife: 10,
                  renderType: 'EXPLOSION', 
                  radius: 0, 
                  color: '#fff',
                  markedForDeletion: false
              });
              break;
      }
  }
  
  updateChests() {
      this.chests.forEach(c => {
          const dx = this.player.pos.x - c.pos.x;
          const dy = this.player.pos.y - c.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.player.radius + c.radius) {
              c.markedForDeletion = true;
              this.isPaused = true;
              this.onChestOpen();
          }
      });
  }

  updateParticles() {
    this.particles.forEach(p => {
        if (p.velocity) {
            p.pos.x += p.velocity.x;
            p.pos.y += p.velocity.y;
            p.velocity.x *= 0.95;
            p.velocity.y *= 0.95;
        }
        if (p.gravity) {
            if (!p.velocity) p.velocity = {x: 0, y: 0};
            p.velocity.y += p.gravity;
        }
        p.life--;
        if (p.life <= 0) p.markedForDeletion = true;
    });
    this.damageTexts.forEach(t => {
      t.pos.x += t.velocity.x;
      t.pos.y += t.velocity.y;
      t.life -= 0.02;
      t.opacity = Math.max(0, t.life);
      if (t.life <= 0) t.markedForDeletion = true;
    });
  }

  updateWeapons() {
    this.player.weapons.forEach(w => {
        const effectiveCooldown = w.cooldown * (1 - this.player.stats.cooldownReduction);
        const amount = w.amount + this.player.stats.amount;

        if (w.cooldownTimer > 0) {
            w.cooldownTimer--;
        }

        if (w.cooldownTimer <= 0) {
             if (w.id === 'shadow_bolt') {
                 this.fireShadowBolt(w, amount);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'umbral_barrage') {
                 this.fireUmbralBarrage(w, amount);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'obsidian_shard') {
                 for(let i=0; i<amount; i++) {
                     const offset = (i - (amount-1)/2) * 0.3;
                     this.fireObsidian(w, offset);
                 }
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'corrosive_aura') {
                 this.pulseCorrosive(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'thunder_strike') {
                 this.strikeThunder(w, amount);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'plasma_cutter') {
                 this.firePlasma(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'blood_siphon') {
                 this.fireBloodSiphon(w, amount);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'frost_nova') {
                 this.fireFrostNova(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'whirling_axe') {
                 for(let i=0; i<amount; i++) {
                     setTimeout(() => this.spawnWhirlingAxe(w, i, amount), i * 500);
                 }
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'flame_breath') {
                 this.fireFlameBreath(w, amount);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'void_trap') {
                 this.spawnVoidTrap(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'ricochet_blade') {
                 this.fireRicochetBlade(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'vortex_orb') {
                 this.fireVortexOrb(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'inferno_grenade') {
                 this.fireInfernoGrenade(w);
                 w.cooldownTimer = effectiveCooldown;
             } else if (w.id === 'phantom_daggers') {
                 this.firePhantomDaggers(w, amount);
                 w.cooldownTimer = effectiveCooldown;
             }
        }

        if (w.id === 'spectral_shield') {
            const activeShields = this.projectiles.filter(p => p.weaponId === 'spectral_shield' && !p.markedForDeletion);
            if (activeShields.length < amount && w.cooldownTimer <= 0) {
                for (let i = 0; i < amount; i++) {
                    this.spawnShield(w, i, amount);
                }
                w.cooldownTimer = effectiveCooldown + w.duration;
            }
        }
    });
  }

  fireShadowBolt(w:Weapon, amount: number) { this.genericFire(w, amount, 'STRAIGHT', COLORS.shadowBolt); }
  
  fireUmbralBarrage(w:Weapon, amount: number) { 
     const nearest = this.getNearestEnemy();
      if (!nearest) return; 
      const dx = nearest.pos.x - this.player.pos.x;
      const dy = nearest.pos.y - this.player.pos.y;
      const baseAngle = Math.atan2(dy, dx);
      for (let i = 0; i < amount; i++) {
          const spread = 0.2; 
          const angle = baseAngle - (spread * (amount - 1)) / 2 + spread * i;
          const vx = Math.cos(angle);
          const vy = Math.sin(angle);
          this.projectiles.push({
              id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos },
              velocity: { x: vx * w.speed * this.player.stats.speed, y: vy * w.speed * this.player.stats.speed },
              damage: w.damage * this.player.stats.might, duration: 120, pierce: 3, radius: 8 * this.player.stats.area,
              color: COLORS.umbralBarrage, markedForDeletion: false, weaponId: w.id, behavior: 'STRAIGHT', knockback: 8
          });
      }
  }
  fireObsidian(w:Weapon, offset:number) { 
      const baseVy = -9;
      const vx = (this.player.facingRight ? 3 : -3) + (offset * 4);
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { x: this.player.pos.x, y: this.player.pos.y - 20 },
          velocity: { x: vx * this.player.stats.speed, y: baseVy * this.player.stats.speed }, damage: w.damage * this.player.stats.might * 1.5,
          duration: 120, pierce: 999, radius: 10 * this.player.stats.area, color: COLORS.obsidianShard, markedForDeletion: false,
          weaponId: w.id, behavior: 'ARC', gravity: 0.25, knockback: 10
      });
  }
  spawnShield(w:Weapon, i:number, t:number) { 
      const angle = (Math.PI * 2 * i) / t;
      const distance = 80 * this.player.stats.area;
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { x: this.player.pos.x, y: this.player.pos.y }, velocity: { x: 0, y: 0 },
          damage: w.damage * this.player.stats.might, duration: w.duration, pierce: 999, radius: 8, color: COLORS.spectralShield,
          markedForDeletion: false, weaponId: w.id, behavior: 'ORBIT', orbitAngle: angle, orbitDistance: distance, orbitSpeed: 0.05 * this.player.stats.speed, knockback: 15
      });
  }
  pulseCorrosive(w:Weapon) { 
      const range = w.area * 50 * this.player.stats.area;
      this.enemies.forEach(e => {
          const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
          if (dist < range + e.radius) {
              this.applyDamage(e, w.damage * this.player.stats.might, w.id);
              const push = 1; const angle = Math.atan2(e.pos.y - this.player.pos.y, e.pos.x - this.player.pos.x);
              e.pos.x += Math.cos(angle) * push; e.pos.y += Math.sin(angle) * push;
              if (e.hp <= 0 && !e.markedForDeletion) this.handleEnemyDeath(e);
          }
      });
  }
  strikeThunder(w:Weapon, amount: number) { 
      const onScreenEnemies = this.enemies.filter(e => {
          const dx = Math.abs(e.pos.x - this.player.pos.x); const dy = Math.abs(e.pos.y - this.player.pos.y);
          return dx < window.innerWidth/2 && dy < window.innerHeight/2;
      });
      if (onScreenEnemies.length === 0) return;
      for (let i=0; i < amount; i++) {
          if (onScreenEnemies.length === 0) break;
          const idx = Math.floor(Math.random() * onScreenEnemies.length);
          const target = onScreenEnemies.splice(idx, 1)[0];
          
          this.applyDamage(target, w.damage * this.player.stats.might, w.id);
          
          if (target.hp <= 0 && !target.markedForDeletion) this.handleEnemyDeath(target);
          this.particles.push({
              id: Math.random().toString(), type: EntityType.VISUAL_PARTICLE, pos: { x: target.pos.x, y: target.pos.y - 300 },
              targetPos: { x: target.pos.x, y: target.pos.y }, life: 15, maxLife: 15, renderType: 'LIGHTNING', width: 3 * this.player.stats.area,
              radius: 0, color: COLORS.thunderStrike, markedForDeletion: false
          });
      }
  }
  firePlasma(w:Weapon) { 
      const vx = this.player.facingRight ? 1 : -1;
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { x: this.player.pos.x, y: this.player.pos.y },
          velocity: { x: vx * w.speed * this.player.stats.speed, y: 0 }, damage: w.damage * this.player.stats.might,
          duration: w.duration, pierce: 999, radius: 20 * this.player.stats.area, color: COLORS.plasmaCutter, markedForDeletion: false,
          weaponId: w.id, behavior: 'STRAIGHT', knockback: 12
      });
  }
  fireBloodSiphon(w:Weapon, amount: number) { 
      const nearest = this.getNearestEnemy();
      if (nearest) {
          for(let i=0; i<amount; i++) {
              setTimeout(() => {
                  if (nearest && !nearest.markedForDeletion) {
                     this.spawnProjectile(nearest, w, COLORS.bloodSiphon, 1, 'STRAIGHT');
                  }
              }, i * 150);
          }
      }
  }
  fireFrostNova(w:Weapon) {
      const range = 150 * w.area * this.player.stats.area;
      this.particles.push({
          id: Math.random().toString(), type: EntityType.VISUAL_PARTICLE, pos: { ...this.player.pos },
          life: 20, maxLife: 20, renderType: 'FROST_NOVA', radius: range, color: COLORS.frostNova, markedForDeletion: false
      });
      this.enemies.forEach(e => {
          const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
          if (dist < range) {
              this.applyDamage(e, w.damage * this.player.stats.might, w.id);
              const angle = Math.atan2(e.pos.y - this.player.pos.y, e.pos.x - this.player.pos.x);
              e.pos.x += Math.cos(angle) * 30; e.pos.y += Math.sin(angle) * 30;
              if (e.hp <= 0 && !e.markedForDeletion) this.handleEnemyDeath(e);
          }
      });
  }
  spawnWhirlingAxe(w:Weapon, index:number, total: number) {
      const startAngle = (Math.PI * 2 * index) / total;
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos }, velocity: { x: 0, y: 0 },
          damage: w.damage * this.player.stats.might, duration: w.duration, pierce: 999, radius: 12 * this.player.stats.area,
          color: COLORS.whirlingAxe, markedForDeletion: false, weaponId: w.id, behavior: 'ORBIT', orbitAngle: startAngle,
          orbitDistance: 10, orbitGrowth: 4, orbitSpeed: 0.15 * this.player.stats.speed, knockback: 10
      });
  }
  fireFlameBreath(w:Weapon, amount: number) {
      const baseAngle = this.player.facingRight ? 0 : Math.PI;
      for(let i=0; i<amount; i++) {
          setTimeout(() => {
              const spread = (Math.random() - 0.5) * 0.5; const angle = baseAngle + spread;
              const vx = Math.cos(angle); const vy = Math.sin(angle);
              this.projectiles.push({
                  id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos },
                  velocity: { x: vx * w.speed * this.player.stats.speed, y: vy * w.speed * this.player.stats.speed },
                  damage: w.damage * this.player.stats.might, duration: w.duration, pierce: 999, radius: 8 * this.player.stats.area,
                  color: COLORS.flameBreath, markedForDeletion: false, weaponId: w.id, behavior: 'STRAIGHT', knockback: 2
              });
          }, i * 50);
      }
  }
  spawnVoidTrap(w:Weapon) {
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos }, velocity: { x: 0, y: 0 },
          damage: w.damage * this.player.stats.might, duration: w.duration, pierce: 999, radius: 60 * this.player.stats.area,
          color: COLORS.voidTrap, markedForDeletion: false, weaponId: w.id, behavior: 'STATIONARY', knockback: 0
      });
  }
  fireRicochetBlade(w:Weapon) {
      const nearest = this.getNearestEnemy();
      if (!nearest) return;
      const dx = nearest.pos.x - this.player.pos.x; const dy = nearest.pos.y - this.player.pos.y; const dist = Math.hypot(dx, dy);
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos },
          velocity: { x: (dx/dist) * w.speed * this.player.stats.speed, y: (dy/dist) * w.speed * this.player.stats.speed },
          damage: w.damage * this.player.stats.might, duration: 180, pierce: 3 + Math.floor(w.level / 2),
          radius: 6 * this.player.stats.area, color: COLORS.ricochetBlade, markedForDeletion: false, weaponId: w.id,
          behavior: 'STRAIGHT', knockback: 4, lastHitId: 'player'
      });
  }
  fireVortexOrb(w:Weapon) {
      const nearest = this.getNearestEnemy();
      let vx = 1, vy = 0;
      if (nearest) { const dx = nearest.pos.x - this.player.pos.x; const dy = nearest.pos.y - this.player.pos.y; const dist = Math.hypot(dx, dy); vx = dx/dist; vy = dy/dist; }
      else { vx = this.player.facingRight ? 1 : -1; }
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos },
          velocity: { x: vx * w.speed, y: vy * w.speed }, damage: w.damage * this.player.stats.might, duration: w.duration, pierce: 999,
          radius: 10, color: COLORS.vortexOrb, markedForDeletion: false, weaponId: w.id, behavior: 'STRAIGHT', knockback: 0,
          pullRadius: 120 * w.area * this.player.stats.area, pullForce: 1.5
      });
  }
  fireInfernoGrenade(w:Weapon) {
      const baseVy = -6; const vx = (this.player.facingRight ? 4 : -4);
      this.projectiles.push({
          id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { x: this.player.pos.x, y: this.player.pos.y - 15 },
          velocity: { x: vx * this.player.stats.speed, y: baseVy * this.player.stats.speed }, damage: w.damage * this.player.stats.might,
          duration: w.duration, pierce: 1, radius: 8, color: COLORS.infernoGrenade, markedForDeletion: false,
          weaponId: w.id, behavior: 'ARC', gravity: 0.2, knockback: 0, onHitEffect: 'EXPLODE'
      });
  }
  firePhantomDaggers(w:Weapon, amount: number) {
      const baseAngle = this.player.facingRight ? Math.PI : 0;
      for(let i=0; i<amount; i++) {
          const spread = (Math.random() - 0.5) * 0.4; const angle = baseAngle + spread;
          const vx = Math.cos(angle); const vy = Math.sin(angle);
          this.projectiles.push({
              id: Math.random().toString(36), type: EntityType.PROJECTILE, pos: { ...this.player.pos },
              velocity: { x: vx * w.speed * this.player.stats.speed, y: vy * w.speed * this.player.stats.speed },
              damage: w.damage * this.player.stats.might, duration: w.duration, pierce: 2, radius: 4, color: COLORS.phantomDaggers,
              markedForDeletion: false, weaponId: w.id, behavior: 'STRAIGHT', knockback: 4
          });
      }
  }
  triggerExplosion(p:Projectile) {
      this.particles.push({
          id: Math.random().toString(), type: EntityType.VISUAL_PARTICLE, pos: { ...p.pos }, life: 20, maxLife: 20, renderType: 'EXPLOSION',
          radius: 60 * this.player.stats.area, color: '#ef4444', markedForDeletion: false
      });
      const range = 60 * this.player.stats.area;
      this.enemies.forEach(e => {
          const dist = Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y);
          if (dist < range) {
              this.applyDamage(e, p.damage, p.weaponId); 
              const angle = Math.atan2(e.pos.y - p.pos.y, e.pos.x - p.pos.x);
              e.pos.x += Math.cos(angle) * 15; e.pos.y += Math.sin(angle) * 15;
              if (e.hp <= 0 && !e.markedForDeletion) this.handleEnemyDeath(e);
          }
      });
  }

  genericFire(w: Weapon, amount: number, behavior: any, color: string) {
      const nearest = this.getNearestEnemy();
      if (nearest) {
          for(let i=0; i<amount; i++) {
                setTimeout(() => {
                    if (nearest && !nearest.markedForDeletion) {
                        this.spawnProjectile(nearest, w, color, 1, behavior);
                    }
                }, i * 100);
          }
      }
  }

  getNearestEnemy(): Enemy | null {
      let nearest: Enemy | null = null;
      let minDist = 600; 
      for (const e of this.enemies) {
        const d = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
        if (d < minDist) { minDist = d; nearest = e; }
      }
      return nearest;
  }

  spawnProjectile(target: Enemy, weapon: Weapon, color: string, pierce: number, behavior: any) {
      const dx = target.pos.x - this.player.pos.x;
      const dy = target.pos.y - this.player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      this.projectiles.push({
          id: Math.random().toString(36),
          type: EntityType.PROJECTILE,
          pos: { ...this.player.pos },
          velocity: { x: (dx/dist) * weapon.speed * this.player.stats.speed, y: (dy/dist) * weapon.speed * this.player.stats.speed },
          damage: weapon.damage * this.player.stats.might,
          duration: 120,
          pierce: pierce,
          radius: 6 * this.player.stats.area,
          color: color,
          markedForDeletion: false,
          weaponId: weapon.id,
          behavior: behavior,
          knockback: 5
      });
  }

  handleEnemyDeath(e: Enemy) {
      e.markedForDeletion = true;
      this.spawnBloodParticles(e.pos, e.color);

      if (e.enemyType === EnemyType.BOSS) {
          this.bossKilled = true;
          this.chests.push({
              id: Math.random().toString(), type: EntityType.CHEST, pos: { ...e.pos }, radius: 20, color: '#d4af37', markedForDeletion: false, isRare: Math.random() < 0.2
          });
          this.enemies.forEach(en => { if(en.enemyType !== EnemyType.BOSS) en.hp = 0; });
      } else {
        this.gems.push({
            id: Math.random().toString(), type: EntityType.GEM, pos: { ...e.pos }, value: e.xpValue, radius: 4, color: COLORS.gem, markedForDeletion: false
        });
      }
      this.score++;
  }

  spawnImpactParticles(pos: Vector2, color: string) {
      const count = 4;
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          this.particles.push({
              id: Math.random().toString(),
              type: EntityType.VISUAL_PARTICLE,
              pos: { ...pos },
              life: 15,
              maxLife: 15,
              renderType: 'SPARK',
              radius: Math.random() * 2 + 1,
              color: color,
              markedForDeletion: false,
              velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
          });
      }
  }

  spawnBloodParticles(pos: Vector2, color: string) {
      const count = 6;
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          this.particles.push({
              id: Math.random().toString(),
              type: EntityType.VISUAL_PARTICLE,
              pos: { ...pos },
              life: 30,
              maxLife: 30,
              renderType: 'BLOOD',
              radius: Math.random() * 2 + 2,
              color: color,
              markedForDeletion: false,
              velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
              gravity: 0.1
          });
      }
  }

  spawnCritParticles(pos: Vector2) {
      const count = 5;
      for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const speed = 4;
          this.particles.push({
              id: Math.random().toString(),
              type: EntityType.VISUAL_PARTICLE,
              pos: { ...pos },
              life: 20,
              maxLife: 20,
              renderType: 'CRIT',
              radius: 4,
              color: '#fbbf24',
              markedForDeletion: false,
              velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
          });
      }
  }

  checkCollisions() {
      this.projectiles.forEach(p => {
          this.destructibles.forEach(d => {
              const dist = Math.hypot(p.pos.x - d.pos.x, p.pos.y - d.pos.y);
              if (dist < d.radius + p.radius) {
                  d.hp -= p.damage;
                  if (d.hp <= 0 && !d.markedForDeletion) {
                      d.markedForDeletion = true;
                      this.spawnPickup(d.pos);
                  }
                  p.markedForDeletion = true;
              }
          });

          this.enemies.forEach(e => {
              if (p.markedForDeletion || e.markedForDeletion) return;
              let hit = false;
              if (p.weaponId === 'plasma_cutter') {
                  const width = p.radius * 2; const height = p.radius * 4; 
                  if (Math.abs(p.pos.x - e.pos.x) < width && Math.abs(p.pos.y - e.pos.y) < height) hit = true;
              } else if (p.weaponId === 'void_trap') {
                   const dist = Math.hypot(p.pos.x - e.pos.x, p.pos.y - e.pos.y);
                   if (dist < p.radius + e.radius) {
                       if (this.frameCount % 20 === 0) {
                           this.applyDamage(e, p.damage, p.weaponId); 
                           if (e.hp <= 0) this.handleEnemyDeath(e);
                       }
                       return; 
                   }
              } else {
                  const dist = Math.hypot(p.pos.x - e.pos.x, p.pos.y - e.pos.y);
                  if (dist < p.radius + e.radius) {
                      if (p.weaponId === 'ricochet_blade' && p.lastHitId === e.id) return;
                      hit = true;
                  }
              }

              if (hit) {
                  if (p.onHitEffect === 'EXPLODE') { this.triggerExplosion(p); p.markedForDeletion = true; return; }
                  
                  this.spawnImpactParticles(e.pos, p.color); 
                  this.applyDamage(e, p.damage, p.weaponId); 

                  if (p.weaponId === 'blood_siphon' && this.player.hp < this.player.maxHp) {
                          const heal = 1 * this.player.stats.might; this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
                          this.addDamageText(this.player.pos, heal, false, 'HEAL'); 
                  }
                  if (this.player.stats.lifesteal > 0 && this.player.hp < this.player.maxHp) {
                      const heal = p.damage * this.player.stats.lifesteal; this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
                      if (heal >= 1 || Math.random() < 0.1) this.addDamageText(this.player.pos, heal, false, 'HEAL');
                  }
                  const angle = Math.atan2(e.pos.y - p.pos.y, e.pos.x - p.pos.x);
                  e.pos.x += Math.cos(angle) * p.knockback; e.pos.y += Math.sin(angle) * p.knockback;

                  if (p.weaponId === 'ricochet_blade') {
                      p.lastHitId = e.id;
                      if (p.pierce > 0) {
                          p.pierce--;
                          let newTarget: Enemy | null = null; let minD = 500;
                          for(const cand of this.enemies) { if (cand !== e && !cand.markedForDeletion) { const d = Math.hypot(cand.pos.x - p.pos.x, cand.pos.y - p.pos.y); if (d < minD) { minD = d; newTarget = cand; } } }
                          if (newTarget) { const ndx = newTarget.pos.x - p.pos.x; const ndy = newTarget.pos.y - p.pos.y; const ndist = Math.hypot(ndx, ndy); const speed = Math.hypot(p.velocity.x, p.velocity.y); p.velocity = { x: (ndx/ndist)*speed, y: (ndy/ndist)*speed }; } else { const rndAngle = Math.random() * Math.PI * 2; const speed = Math.hypot(p.velocity.x, p.velocity.y); p.velocity = { x: Math.cos(rndAngle)*speed, y: Math.sin(rndAngle)*speed }; }
                      } else { p.markedForDeletion = true; }
                  } else {
                      if (p.pierce < 100) { p.pierce--; if (p.pierce <= 0) p.markedForDeletion = true; }
                  }
                  if (e.hp <= 0 && !e.markedForDeletion) this.handleEnemyDeath(e);
              }
          });
      });

      if (this.frameCount % 10 === 0) { 
        this.enemies.forEach(e => {
            const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
            if (dist < e.radius + this.player.radius) {
                this.player.hp -= e.damage;
                this.addDamageText(this.player.pos, e.damage, false, 'PLAYER_DAMAGE');
                if (this.player.hp <= 0) {
                    this.isGameOver = true;
                    this.onGameOver({
                        kills: this.score, time: Math.floor(this.frameCount / 60), level: this.player.level,
                        bossKilled: this.bossKilled, gemsCollected: this.gemsCollected, goldCollected: this.goldCollected
                    });
                }
            }
        });
      }
  }

  applyDamage(target: Enemy, amount: number, sourceId: string) {
       const isCrit = Math.random() < this.player.stats.luck;
       let finalAmount = isCrit ? amount * 2 : amount;
       finalAmount = Math.max(1, Math.floor(finalAmount));
    
       if (isCrit) {
           this.spawnCritParticles(target.pos);
       }

       target.hp -= finalAmount;
       
       const existingText = this.damageTexts.find(t => t.id === target.lastDamageTextId && !t.markedForDeletion);
       
       if (existingText && existingText.life > 0.4) {
           existingText.value += finalAmount;
           existingText.text = Math.floor(existingText.value).toString();
           existingText.life = 0.8; 
           existingText.pos.y = target.pos.y - target.radius - 15; 
           existingText.pos.x = target.pos.x + (Math.random()*10 - 5);
           if (isCrit) existingText.isCrit = true;
       } else {
           const textEntity = this.addDamageText(target.pos, finalAmount, isCrit, 'DAMAGE');
           if (textEntity) {
               target.lastDamageTextId = textEntity.id;
           }
       }
  }

  spawnPickup(pos: Vector2) {
      const r = Math.random();
      let type = PickupType.GOLD;
      let val = 10;
      let color = COLORS.gold;

      if (r < 0.1) { type = PickupType.CHICKEN; val = 30; color = '#e11d48'; } 
      else if (r < 0.15) { type = PickupType.VACUUM; val = 0; color = '#06b6d4'; } 
      else if (r < 0.16) { type = PickupType.ROSARY; val = 0; color = '#f8fafc'; } 
      else { type = PickupType.GOLD; val = 10; color = COLORS.gold; }

      this.pickups.push({
          id: Math.random().toString(),
          type: EntityType.PICKUP,
          pickupType: type,
          pos: { ...pos },
          radius: 10,
          value: val,
          color: color,
          markedForDeletion: false
      });
  }

  addDamageText(pos: Vector2, amount: number, isCrit: boolean, variant: 'DAMAGE' | 'PLAYER_DAMAGE' | 'HEAL' = 'DAMAGE'): DamageText | null {
      if (amount < 0.5 && variant !== 'HEAL') return null;
      if (amount <= 0) return null;
      
      let color = '#fff';
      if (variant === 'PLAYER_DAMAGE') color = '#ef4444';
      if (variant === 'HEAL') color = '#22c55e';
      
      const newText: DamageText = {
          id: Math.random().toString(),
          type: EntityType.TEXT_PARTICLE,
          pos: { x: pos.x, y: pos.y - 10 },
          text: Math.round(amount).toString(),
          value: amount,
          velocity: { x: (Math.random() - 0.5), y: -1 },
          life: 0.8,
          opacity: 1.0,
          radius: 0,
          color: color,
          markedForDeletion: false,
          isCrit: isCrit
      };
      
      this.damageTexts.push(newText);
      return newText;
  }

  checkLevelUp() {
      if (this.player.xp >= this.player.nextLevelXp) {
          this.player.level++; this.player.xp -= this.player.nextLevelXp; this.player.nextLevelXp = Math.floor(this.player.nextLevelXp * 1.3);
          this.isPaused = true; this.onLevelUp(this.generateUpgrades());
      }
  }

  generateUpgrades(): UpgradeOption[] {
      const options: UpgradeOption[] = []; const priorityOptions: UpgradeOption[] = []; const stats = loadStats();
      
      const shadowBolt = this.player.weapons.find(w => w.id === 'shadow_bolt');
      if (shadowBolt && shadowBolt.level >= shadowBolt.maxLevel) {
          priorityOptions.push({
              id: 'evolve_shadow_bolt', name: 'Umbral Barrage', description: 'EVOLUTION: Unleash the true power of the void. Replaces Shadow Bolt.',
              rarity: 'legendary', type: 'WEAPON', apply: (p) => { p.weapons = p.weapons.filter(w => w.id !== 'shadow_bolt'); p.weapons.push(this.getWeaponConfig('umbral_barrage')); }
          });
      }
      
      const makeWeaponUpgrade = (weaponId: string) => {
          const def = WEAPON_DEFINITIONS[weaponId]; const existing = this.player.weapons.find(w => w.id === weaponId);
          if (existing) {
              if (existing.level >= existing.maxLevel) return; 
              options.push({
                  id: `upgrade_${weaponId}`, name: `${def.name} ${existing.level + 1}`, description: `Level ${existing.level + 1}: Increases power/amount.`, rarity: 'common', type: 'WEAPON',
                  apply: (p) => { const w = p.weapons.find(x => x.id === weaponId)!; w.level++; if (w.level % 2 === 0) w.damage *= 1.2; if (w.level % 3 === 0) w.amount += 1; w.area *= 1.1; }
              });
          } else {
              if (this.player.weapons.length >= 6) return; 
              if (!def.unlockCondition(stats)) return; 
              options.push({ id: `new_${weaponId}`, name: def.name, description: def.description, rarity: 'rare', type: 'WEAPON', apply: (p) => { p.weapons.push(this.getWeaponConfig(weaponId)); } });
          }
      };
      Object.keys(WEAPON_DEFINITIONS).forEach(id => makeWeaponUpgrade(id));

      Object.entries(PASSIVE_DEFINITIONS).forEach(([id, def]) => {
          const existing = this.player.passives.find(p => p.id === id);
          if (existing) {
              if (existing.level >= existing.maxLevel) return;
              options.push({
                  id: `upgrade_${id}`, name: `${def.name} ${existing.level + 1}`, description: `${def.description} (Lvl ${existing.level + 1})`, rarity: 'common', type: 'PASSIVE',
                  apply: (p) => {
                      const passive = p.passives.find(x => x.id === id)!;
                      passive.level++;
                      // @ts-ignore
                      p.stats[def.stat] += def.increase;
                  }
              });
          } else {
              if (this.player.passives.length >= 6) return;
              options.push({
                  id: `new_${id}`, name: def.name, description: def.description, rarity: 'common', type: 'PASSIVE',
                  apply: (p) => {
                      p.passives.push({ id, name: def.name, description: def.description, level: 1, maxLevel: def.maxLevel, icon: def.icon });
                      // @ts-ignore
                      p.stats[def.stat] += def.increase;
                  }
              });
          }
      });

      if (options.length === 0 && priorityOptions.length === 0) {
          options.push({ id: 'heal_fallback', name: 'Crimson Vial', description: 'Heal 30 HP.', rarity: 'common', type: 'PASSIVE', apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 30); } });
      }
      
      const shuffled = options.sort(() => 0.5 - Math.random());
      const result = [...priorityOptions];
      const remainingSlots = 3 - result.length;
      if (remainingSlots > 0) { result.push(...shuffled.slice(0, remainingSlots)); }
      return result;
  }

  cleanup() {
      this.enemies = this.enemies.filter(e => !e.markedForDeletion);
      this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
      this.gems = this.gems.filter(g => !g.markedForDeletion);
      this.chests = this.chests.filter(c => !c.markedForDeletion);
      this.damageTexts = this.damageTexts.filter(t => !t.markedForDeletion);
      this.particles = this.particles.filter(p => !p.markedForDeletion);
      this.destructibles = this.destructibles.filter(d => !d.markedForDeletion);
      this.pickups = this.pickups.filter(p => !p.markedForDeletion);
  }

  drawPlayer() {
      const ctx = this.ctx;
      const p = this.player;
      const t = this.frameCount;

      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, p.radius + 4, p.radius, p.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      const dir = p.facingRight ? 1 : -1;
      ctx.scale(dir, 1);

      const isFloater = ['kael', 'vex', 'seraphina', 'isolde'].includes(p.characterId);
      const bob = isFloater ? Math.sin(t * 0.05) * 3 : 0;
      const breathe = isFloater ? 0 : Math.sin(t * 0.1) * 0.03;

      ctx.translate(0, bob);
      if (!isFloater) ctx.scale(1, 1 - breathe);

      if (p.characterId === 'grom') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-10, -12, 20, 24); 
          ctx.fillStyle = '#475569';
          ctx.beginPath(); ctx.arc(0, -12, 11, Math.PI, 0); ctx.lineTo(11, -8); ctx.lineTo(-11, -8); ctx.fill();
          ctx.fillStyle = '#0ea5e9'; 
          ctx.shadowColor = '#0ea5e9'; ctx.shadowBlur = 5;
          ctx.fillRect(2, -14, 8, 3);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-16, -14); ctx.lineTo(-10, -4); ctx.fill(); 
          ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(16, -14); ctx.lineTo(10, -4); ctx.fill(); 

      } else if (p.characterId === 'lyra') {
          ctx.fillStyle = '#ea580c';
          ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, -10); ctx.lineTo(12, 12); ctx.lineTo(-12, 12); ctx.fill();
          ctx.fillStyle = '#fdba74'; 
          ctx.beginPath(); ctx.arc(0, -12, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f97316';
          const flameOffset = Math.sin(t * 0.2) * 2;
          ctx.beginPath(); 
          ctx.moveTo(-9, -14); 
          ctx.quadraticCurveTo(0, -25 + flameOffset, 9, -14); 
          ctx.lineTo(9, -10); ctx.lineTo(-9, -10); 
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(4, -11, 2, 0, Math.PI * 2); ctx.fill();

      } else if (p.characterId === 'kael') {
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 10); ctx.lineTo(-10, 10); ctx.fill();
          ctx.fillStyle = '#172554';
          ctx.beginPath(); ctx.arc(0, -12, 10, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#60a5fa';
          ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(3, -11, 2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 1;
          const runeRot = t * 0.05;
          ctx.save(); ctx.translate(0, -25); ctx.rotate(runeRot);
          ctx.strokeRect(-4, -4, 8, 8);
          ctx.restore();

      } else if (p.characterId === 'vex') {
          ctx.fillStyle = '#581c87';
          ctx.beginPath(); 
          ctx.arc(0, 0, 12 + Math.sin(t*0.2), 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = '#a855f7'; 
          ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 15;
          ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff';
          ctx.fillRect(2, -4, 4, 2);
          ctx.fillRect(6, -2, 2, 2);

      } else if (p.characterId === 'seraphina') {
          ctx.fillStyle = '#db2777';
          ctx.beginPath(); ctx.ellipse(0, 0, 8, 14, 0, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fce7f3';
          ctx.beginPath(); ctx.arc(0, -14, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-4, -10);
          const tipY = Math.sin(t * 0.2) * 5;
          ctx.quadraticCurveTo(-15, -10, -25, -5 + tipY);
          ctx.stroke();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(4, -14, 1.5, 0, Math.PI*2); ctx.fill();

      } else if (p.characterId === 'darius') {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-9, -10, 18, 20);
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(-14, -18); ctx.lineTo(-5, -10); ctx.fill();
          ctx.beginPath(); ctx.moveTo(9, -10); ctx.lineTo(14, -18); ctx.lineTo(5, -10); ctx.fill();
          ctx.fillStyle = '#991b1b';
          ctx.beginPath(); ctx.arc(0, -12, 9, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fca5a5';
          ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 5;
          ctx.beginPath(); ctx.arc(3, -11, 2, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;

      } else if (p.characterId === 'isolde') {
          ctx.fillStyle = '#0891b2';
          ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 12); ctx.lineTo(-10, 12); ctx.fill();
          ctx.fillStyle = '#cffafe'; 
          ctx.beginPath(); ctx.arc(0, -12, 8, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#a5f3fc';
          ctx.beginPath();
          ctx.moveTo(-8, -14); ctx.lineTo(-5, -20); ctx.lineTo(0, -16); ctx.lineTo(5, -20); ctx.lineTo(8, -14);
          ctx.fill();
          ctx.fillStyle = '#164e63';
          ctx.beginPath(); ctx.arc(3, -11, 1.5, 0, Math.PI*2); ctx.fill();

      } else if (p.characterId === 'grimwald') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-10, -10, 20, 20);
          ctx.fillStyle = '#451a03';
          ctx.beginPath(); ctx.arc(0, -12, 10, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI, false); ctx.fill();

      } else if (p.characterId === 'ignis') {
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath(); ctx.rect(-9, -10, 18, 20); ctx.fill();
          ctx.fillStyle = '#fecaca';
          ctx.beginPath(); ctx.arc(0, -12, 9, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#333';
          ctx.beginPath(); 
          ctx.arc(2, -13, 4, 0, Math.PI*2); 
          ctx.arc(7, -13, 4, 0, Math.PI*2); 
          ctx.fill();
          ctx.fillStyle = '#4ade80'; 
          ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 5;
          ctx.beginPath(); ctx.arc(2, -13, 2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(7, -13, 2, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;

      } else if (p.characterId === 'elara') {
          ctx.fillStyle = '#334155';
          ctx.beginPath(); ctx.ellipse(0, 2, 8, 12, 0, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath(); ctx.arc(0, -10, 8, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(0, -4, 8, -8); ctx.lineTo(8, -2); ctx.quadraticCurveTo(0, 4, -8, -2); ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-12, -4 + Math.sin(t*0.3)*3); ctx.stroke();
          ctx.fillStyle = '#334155';
          ctx.beginPath(); ctx.arc(3, -12, 1.5, 0, Math.PI*2); ctx.fill();

      } else {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(4, -3, 3.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(5.5, -3, 1.5, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
  }

  draw() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    const cx = (window.innerWidth / 2) - this.player.pos.x;
    const cy = (window.innerHeight / 2) - this.player.pos.y;

    if (this.bgPattern) {
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.fillStyle = this.bgPattern;
        const viewX = this.player.pos.x - window.innerWidth / 2;
        const viewY = this.player.pos.y - window.innerHeight / 2;
        this.ctx.fillRect(viewX - 100, viewY - 100, window.innerWidth + 200, window.innerHeight + 200);
        this.ctx.restore();
    } else {
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    
    this.ctx.save();
    this.ctx.translate(cx, cy);

    this.destructibles.forEach(d => {
        this.ctx.fillStyle = d.color;
        this.ctx.beginPath();
        this.ctx.fillRect(d.pos.x - 4, d.pos.y, 8, 20);
        this.ctx.arc(d.pos.x, d.pos.y, 8, 0, Math.PI, false);
        this.ctx.fill();
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.shadowColor = '#f59e0b';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(d.pos.x, d.pos.y - 5, 6 + Math.sin(this.frameCount * 0.2)*2, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    });

    this.pickups.forEach(p => {
        this.ctx.fillStyle = p.color;
        this.ctx.save();
        this.ctx.translate(p.pos.x, p.pos.y + Math.sin(this.frameCount * 0.1) * 3);
        if (p.pickupType === PickupType.GOLD) {
            this.ctx.shadowColor = COLORS.gold; this.ctx.shadowBlur = 5;
            this.ctx.beginPath(); this.ctx.arc(0, 0, 6, 0, Math.PI*2); this.ctx.fill();
            this.ctx.fillStyle = '#fff'; this.ctx.font = '8px Arial'; this.ctx.textAlign = 'center'; this.ctx.fillText('$', 0, 3);
            this.ctx.shadowBlur = 0;
        } else if (p.pickupType === PickupType.CHICKEN) {
             this.ctx.fillRect(-6, -4, 12, 8); 
             this.ctx.fillStyle = '#fff'; this.ctx.fillRect(4, -4, 2, 8); 
        } else if (p.pickupType === PickupType.VACUUM) {
             this.ctx.shadowColor = '#06b6d4'; this.ctx.shadowBlur = 10;
             this.ctx.beginPath(); this.ctx.arc(0, 0, 8, 0, Math.PI*2); this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 2; this.ctx.stroke();
             this.ctx.fillStyle = p.color; this.ctx.fill();
             this.ctx.shadowBlur = 0;
        } else { 
             this.ctx.beginPath(); this.ctx.arc(0, 0, 6, 0, Math.PI*2); this.ctx.fill();
             this.ctx.strokeStyle = '#94a3b8'; this.ctx.beginPath(); this.ctx.arc(0, -10, 2, 0, Math.PI*2); this.ctx.stroke();
        }
        this.ctx.restore();
    });

    this.gems.forEach(g => {
        this.ctx.fillStyle = g.color;
        this.ctx.beginPath();
        this.ctx.moveTo(g.pos.x, g.pos.y - g.radius);
        this.ctx.lineTo(g.pos.x + g.radius, g.pos.y);
        this.ctx.lineTo(g.pos.x, g.pos.y + g.radius);
        this.ctx.lineTo(g.pos.x - g.radius, g.pos.y);
        this.ctx.fill();
    });

    this.chests.forEach(c => {
        const x = c.pos.x; const y = c.pos.y; const w = 30; const h = 20;
        this.ctx.save(); this.ctx.translate(x, y);
        this.ctx.shadowColor = '#eab308'; this.ctx.shadowBlur = 15 + Math.sin(this.frameCount * 0.1) * 5;
        this.ctx.fillStyle = '#92400e'; this.ctx.fillRect(-w/2, -h/2, w, h);
        this.ctx.fillStyle = '#fbbf24'; this.ctx.fillRect(-w/2, -h/4, w, h/4); this.ctx.fillRect(-4, -h/2, 8, h);
        this.ctx.fillStyle = '#000'; this.ctx.fillRect(-2, -2, 4, 4);
        this.ctx.restore();
    });

    const aura = this.player.weapons.find(w => w.id === 'corrosive_aura');
    if (aura) {
        const range = aura.area * 50 * this.player.stats.area;
        const grad = this.ctx.createRadialGradient(this.player.pos.x, this.player.pos.y, range * 0.2, this.player.pos.x, this.player.pos.y, range);
        grad.addColorStop(0, 'rgba(132, 204, 22, 0)');
        grad.addColorStop(0.8, 'rgba(132, 204, 22, 0.2)');
        grad.addColorStop(1, 'rgba(132, 204, 22, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(this.player.pos.x, this.player.pos.y, range, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.save();
        this.ctx.translate(this.player.pos.x, this.player.pos.y);
        this.ctx.rotate(this.frameCount * 0.02);
        this.ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 20]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, range * 0.7, 0, Math.PI*2);
        this.ctx.stroke();
        this.ctx.rotate(this.frameCount * 0.03);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, range * 0.9, 0, Math.PI*2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    this.enemies.forEach(e => {
        this.ctx.save();
        this.ctx.translate(e.pos.x, e.pos.y);
        
        if (this.player.pos.x < e.pos.x) {
            this.ctx.scale(-1, 1);
        }

        this.ctx.globalAlpha = e.opacity || 1;
        this.ctx.shadowBlur = 0;

        if (e.enemyType === EnemyType.BOSS) {
            this.ctx.shadowBlur = 20; 
            this.ctx.shadowColor = e.color; 
            const pulse = Math.sin(this.frameCount * 0.1) * 3;
            this.ctx.fillStyle = '#2e1065'; 
            this.ctx.beginPath();
            this.ctx.arc(0, 0, e.radius + pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#a855f7'; 
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            const spikes = 10; 
            for(let i=0; i<=spikes; i++) { 
                const angle = (Math.PI * 2 * i) / spikes + (this.frameCount * 0.02); 
                const rInner = e.radius * 0.8;
                const rOuter = e.radius * 1.2; 
                const cx = Math.cos(angle); 
                const cy = Math.sin(angle); 
                if(i===0) this.ctx.moveTo(cx * rInner, cy * rInner); 
                this.ctx.lineTo(cx * rOuter, cy * rOuter); 
                this.ctx.lineTo(Math.cos(angle + 0.1) * rInner, Math.sin(angle + 0.1) * rInner);
            }
            this.ctx.stroke();
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ef4444';
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(-10, -5); this.ctx.lineTo(-5, 0); this.ctx.lineTo(-12, 2); this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(10, -5); this.ctx.lineTo(5, 0); this.ctx.lineTo(12, 2); this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.save();
            if (this.player.pos.x < e.pos.x) this.ctx.scale(-1, 1);
            this.ctx.fillStyle = 'black'; 
            this.ctx.fillRect(-30, -e.radius - 20, 60, 6);
            this.ctx.fillStyle = '#dc2626'; 
            this.ctx.fillRect(-29, -e.radius - 19, 58 * (e.hp / e.maxHp), 4);
            this.ctx.restore();

        } else if (e.enemyType === EnemyType.BAT) {
            const flap = Math.sin(this.frameCount * 0.4 + e.animationOffset) * 10;
            this.ctx.fillStyle = '#1e293b'; 
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(10, -10 + flap, 15, -5 + flap/2);
            this.ctx.quadraticCurveTo(8, 5, 0, 2); 
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(-10, -10 + flap, -15, -5 + flap/2);
            this.ctx.quadraticCurveTo(-8, 5, 0, 2); 
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(2, -2, 1.5, 0, Math.PI * 2);
            this.ctx.arc(5, -2, 1.5, 0, Math.PI * 2); 
            this.ctx.fill();

        } else if (e.enemyType === EnemyType.ZOMBIE) {
            const wobble = Math.sin(this.frameCount * 0.15 + e.animationOffset) * 0.1;
            this.ctx.rotate(wobble);
            this.ctx.fillStyle = e.visualVariant === 1 ? '#365314' : '#15803d'; 
            this.ctx.beginPath();
            this.ctx.roundRect(-8, -6, 16, 14, 4);
            this.ctx.fill();
            this.ctx.fillStyle = '#86efac'; 
            this.ctx.beginPath();
            this.ctx.arc(0, -8, 7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#86efac';
            this.ctx.beginPath();
            this.ctx.roundRect(4, -4, 10, 3, 1.5); 
            this.ctx.roundRect(4, 1, 10, 3, 1.5); 
            this.ctx.fill();
            this.ctx.fillStyle = '#14532d'; 
            this.ctx.beginPath();
            this.ctx.arc(2, -9, 2, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = '#fca5a5'; 
            if (e.visualVariant === 2) {
                this.ctx.beginPath();
                this.ctx.arc(-3, -11, 2.5, 0, Math.PI*2);
                this.ctx.fill();
            }

        } else if (e.enemyType === EnemyType.SKELETON) {
            const bounce = Math.abs(Math.sin(this.frameCount * 0.15 + e.animationOffset)) * 2;
            this.ctx.translate(0, -bounce);
            this.ctx.strokeStyle = '#e2e8f0'; 
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -4); this.ctx.lineTo(0, 8);
            this.ctx.moveTo(-5, -2); this.ctx.lineTo(5, -2);
            this.ctx.moveTo(-4, 2); this.ctx.lineTo(4, 2);
            this.ctx.moveTo(-3, 6); this.ctx.lineTo(3, 6);
            this.ctx.stroke();
            this.ctx.fillStyle = '#f1f5f9';
            this.ctx.beginPath();
            this.ctx.arc(0, -8, 6.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#e2e8f0';
            this.ctx.fillRect(-3, -4, 6, 4);
            this.ctx.fillStyle = '#0f172a';
            this.ctx.beginPath();
            this.ctx.arc(2, -9, 1.5, 0, Math.PI * 2);
            this.ctx.arc(-1, -9, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.save();
            this.ctx.translate(8, 2);
            this.ctx.rotate(-0.5);
            this.ctx.fillStyle = '#713f12'; 
            this.ctx.fillRect(0, -4, 2, 8);
            this.ctx.fillStyle = '#94a3b8'; 
            this.ctx.beginPath();
            this.ctx.moveTo(0, -4);
            this.ctx.quadraticCurveTo(8, -10, 2, -14);
            this.ctx.lineTo(0, -4);
            this.ctx.fill();
            this.ctx.restore();

        } else if (e.enemyType === EnemyType.GHOST) {
            const float = Math.sin(this.frameCount * 0.05 + e.animationOffset) * 3;
            this.ctx.translate(0, float);
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(34, 211, 238, 0.5)'; 
            this.ctx.fillStyle = 'rgba(207, 250, 254, 0.8)'; 
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 8, Math.PI, 0); 
            const t = this.frameCount * 0.15 + e.animationOffset;
            this.ctx.lineTo(8, 8);
            this.ctx.quadraticCurveTo(4, 4 + Math.sin(t)*3, 0, 10);
            this.ctx.quadraticCurveTo(-4, 4 + Math.cos(t)*3, -8, 8);
            this.ctx.lineTo(-8, -6);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#06b6d4'; 
            this.ctx.beginPath();
            this.ctx.arc(3, -6, 2, 0, Math.PI*2);
            this.ctx.arc(-1, -6, 2, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(1, -2, 1.5, 0, Math.PI*2);
            this.ctx.fill();

        } else {
            this.ctx.fillStyle = e.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    });

    this.drawPlayer();

    this.projectiles.forEach(p => {
        this.ctx.save();
        this.ctx.translate(p.pos.x, p.pos.y);
        
        if (isNaN(p.pos.x) || isNaN(p.pos.y)) {
            this.ctx.restore();
            return;
        }

        switch (p.weaponId) {
            case 'shadow_bolt': {
                const angle = Math.atan2(p.velocity.y, p.velocity.x);
                this.ctx.rotate(angle);
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = p.color;
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.8, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.ellipse(-p.radius, 0, p.radius * 2, p.radius, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            }
            case 'umbral_barrage': {
                const angle = Math.atan2(p.velocity.y, p.velocity.x);
                this.ctx.rotate(angle);
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = '#a855f7'; 
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.radius * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = 0.8;
                for(let i=0; i<3; i++) {
                    const offset = (this.frameCount * 0.5) + (i * 2);
                    this.ctx.beginPath();
                    this.ctx.ellipse(-p.radius, Math.sin(offset)*4, p.radius * 2.5, p.radius * 0.5, 0, 0, Math.PI*2);
                    this.ctx.fill();
                }
                break;
            }
            case 'obsidian_shard': {
                this.ctx.rotate(this.frameCount * 0.1);
                this.ctx.fillStyle = '#334155';
                this.ctx.beginPath();
                this.ctx.moveTo(-p.radius, -p.radius*0.5);
                this.ctx.lineTo(0, -p.radius);
                this.ctx.lineTo(p.radius, -p.radius*0.5);
                this.ctx.lineTo(p.radius*0.5, p.radius);
                this.ctx.lineTo(-p.radius*0.8, p.radius*0.8);
                this.ctx.fill();
                break;
            }
            case 'spectral_shield': {
                this.ctx.rotate(this.frameCount * 0.1);
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.fillStyle = '#a5f3fc'; 
                this.ctx.shadowColor = '#0891b2';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -p.radius);
                this.ctx.lineTo(p.radius*0.6, 0);
                this.ctx.lineTo(0, p.radius);
                this.ctx.lineTo(-p.radius*0.6, 0);
                this.ctx.fill();
                break;
            }
            case 'whirling_axe': {
                this.ctx.rotate(this.frameCount * 0.3);
                this.ctx.fillStyle = '#94a3b8'; 
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.arc(0, 0, p.radius, 0, Math.PI/2);
                this.ctx.lineTo(0,0);
                this.ctx.arc(0, 0, p.radius, Math.PI, Math.PI*1.5);
                this.ctx.fill();
                this.ctx.fillStyle = '#451a03'; 
                this.ctx.fillRect(-2, -p.radius, 4, p.radius*2);
                break;
            }
            case 'plasma_cutter': {
                const angle = Math.atan2(p.velocity.y, p.velocity.x);
                this.ctx.rotate(angle);
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillRect(-p.radius, -p.radius/2, p.radius*4, p.radius);
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(-p.radius, -p.radius/4, p.radius*3, p.radius/2);
                break;
            }
            case 'flame_breath':
            case 'inferno_grenade': {
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.fillStyle = '#ef4444';
                this.ctx.shadowColor = '#f97316';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            }
            case 'phantom_daggers':
            case 'ricochet_blade': {
                const angle = Math.atan2(p.velocity.y, p.velocity.x);
                this.ctx.rotate(angle);
                this.ctx.fillStyle = '#e2e8f0';
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = '#fff';
                this.ctx.beginPath();
                this.ctx.moveTo(p.radius, 0);
                this.ctx.lineTo(-p.radius, p.radius/3);
                this.ctx.lineTo(-p.radius, -p.radius/3);
                this.ctx.fill();
                break;
            }
            case 'blood_siphon': {
                const angle = Math.atan2(p.velocity.y, p.velocity.x) - Math.PI/2;
                this.ctx.rotate(angle);
                this.ctx.fillStyle = '#dc2626';
                this.ctx.beginPath();
                this.ctx.moveTo(0, -p.radius);
                this.ctx.bezierCurveTo(p.radius, -p.radius/3, p.radius, p.radius, 0, p.radius);
                this.ctx.bezierCurveTo(-p.radius, p.radius, -p.radius, -p.radius/3, 0, -p.radius);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.ellipse(p.radius/3, -p.radius/3, p.radius/4, p.radius/6, Math.PI/4, 0, Math.PI*2);
                this.ctx.fill();
                break;
            }
            case 'frost_nova': {
                // Should technically be particle, but if bullet logic is used
                this.ctx.strokeStyle = '#a5f3fc';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.radius, 0, Math.PI*2);
                this.ctx.stroke();
                break;
            }
            case 'vortex_orb': {
                 this.ctx.rotate(this.frameCount * -0.2);
                 this.ctx.fillStyle = '#4c1d95';
                 this.ctx.beginPath();
                 this.ctx.arc(0, 0, p.radius, 0, Math.PI*2);
                 this.ctx.fill();
                 this.ctx.strokeStyle = '#8b5cf6';
                 this.ctx.lineWidth = 2;
                 for(let i=0; i<4; i++) {
                     this.ctx.rotate(Math.PI/2);
                     this.ctx.beginPath();
                     this.ctx.arc(p.radius, 0, p.radius/2, 0, Math.PI*2);
                     this.ctx.stroke();
                 }
                 break;
            }
            case 'void_trap': {
                this.ctx.shadowColor = '#581c87';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = '#a855f7';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.radius, 0, Math.PI*2);
                this.ctx.stroke();
                this.ctx.fillStyle = 'rgba(88, 28, 135, 0.3)';
                this.ctx.fill();
                // Runes
                this.ctx.save();
                this.ctx.rotate(this.frameCount * 0.05);
                this.ctx.beginPath();
                this.ctx.moveTo(0, -p.radius + 5);
                this.ctx.lineTo(p.radius - 5, p.radius/2);
                this.ctx.lineTo(-p.radius + 5, p.radius/2);
                this.ctx.closePath();
                this.ctx.stroke();
                this.ctx.restore();
                break;
            }
            default: {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore(); // CRITICAL: Reset transform for next projectile
    });

    this.particles.forEach(p => {
        this.ctx.save();
        const lifeRatio = p.life / p.maxLife;
        this.ctx.globalCompositeOperation = 'lighter';
        
        if (p.renderType === 'LIGHTNING' && p.targetPos) {
            this.ctx.beginPath(); 
            this.ctx.strokeStyle = p.color; 
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.lineWidth = p.width || 2; 
            this.ctx.globalAlpha = lifeRatio;
            
            const steps = 5;
            let cx = p.pos.x;
            let cy = p.pos.y;
            this.ctx.moveTo(cx, cy);
            
            const dx = (p.targetPos.x - p.pos.x) / steps;
            const dy = (p.targetPos.y - p.pos.y) / steps;

            for(let i=1; i<steps; i++) {
                cx += dx;
                cy += dy;
                const offset = (Math.random() - 0.5) * 20;
                this.ctx.lineTo(cx + offset, cy + offset);
            }
            this.ctx.lineTo(p.targetPos.x, p.targetPos.y);
            this.ctx.stroke(); 

        } else if (p.renderType === 'EXPLOSION') {
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = lifeRatio * 0.8;
            this.ctx.beginPath();
            this.ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(p.pos.x, p.pos.y, p.radius * (2 - lifeRatio), 0, Math.PI * 2);
            this.ctx.stroke();

        } else if (p.renderType === 'FROST_NOVA') {
            this.ctx.shadowColor = '#22d3ee';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = '#67e8f9';
            this.ctx.lineWidth = 4;
            this.ctx.globalAlpha = lifeRatio;
            this.ctx.beginPath();
            this.ctx.arc(p.pos.x, p.pos.y, p.radius * (1.5 - lifeRatio * 0.5), 0, Math.PI*2);
            this.ctx.stroke();

        } else if (p.renderType === 'SPARK') {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = lifeRatio;
            this.ctx.beginPath();
            this.ctx.arc(p.pos.x, p.pos.y, p.radius * lifeRatio, 0, Math.PI * 2);
            this.ctx.fill();

        } else if (p.renderType === 'BLOOD') {
            this.ctx.globalCompositeOperation = 'source-over'; 
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = lifeRatio * 0.8;
            this.ctx.beginPath();
            this.ctx.arc(p.pos.x, p.pos.y, p.radius * lifeRatio, 0, Math.PI * 2);
            this.ctx.fill();

        } else if (p.renderType === 'CRIT') {
            this.ctx.translate(p.pos.x, p.pos.y);
            this.ctx.rotate(this.frameCount * 0.2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = lifeRatio;
            this.ctx.fillRect(-p.radius/2, -p.radius/2, p.radius, p.radius);
        }
        
        this.ctx.restore();
    });

    this.damageTexts.forEach(t => {
        this.ctx.save();
        this.ctx.globalAlpha = t.opacity;
        const updatePop = t.life > 0.6 ? 1.5 : 1.0;
        
        if (t.isCrit) {
             this.ctx.font = 'bold 32px Inter';
             this.ctx.fillStyle = '#fbbf24'; 
             this.ctx.shadowColor = '#d97706';
             this.ctx.shadowBlur = 10;
        } else {
             this.ctx.font = 'bold 16px Inter';
             this.ctx.fillStyle = t.color;
             this.ctx.shadowBlur = 0;
        }
        
        const valueScale = 1 + (t.value / 1000); 
        const finalScale = Math.min(2.5, valueScale * updatePop);

        this.ctx.translate(t.pos.x, t.pos.y);
        this.ctx.scale(finalScale, finalScale);
        
        this.ctx.fillText(t.text, 0, 0);
        
        if (t.isCrit && t.life > 0.7) {
            this.ctx.globalCompositeOperation = 'overlay';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(t.text, 0, 0);
        }

        this.ctx.restore();
    });

    this.ctx.restore();

    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const gradient = this.ctx.createRadialGradient(
        width / 2, height / 2, height / 2,
        width / 2, height / 2, height
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }
}