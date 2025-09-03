// Game Configuration
const GameConfig = {
    // Space dimensions
    SPACE_WIDTH: 4000,
    SPACE_HEIGHT: 3000,

    // Player settings
    PLAYER: {
        SIZE: 12,
        SPEED: 5,
        MAX_HEALTH: 100,
        MAX_SHIELD: 75,
        COLOR: '#00ffff',
        DASH_COOLDOWN: 60,
        INVULNERABLE_TIME: 120
    },

    // Camera settings
    CAMERA: {
        FOLLOW_SPEED: 0.3
    },

    // Weapon configurations
    WEAPONS: [
        { name: 'PHOTON', damage: 15, speed: 12, size: 3, color: '#00ffff', fireRate: 25, ammo: Infinity },
        { name: 'SCATTER', damage: 10, speed: 10, size: 2, color: '#ff6600', fireRate: 35, ammo: Infinity },
        { name: 'BEAM', damage: 25, speed: 18, size: 2, color: '#ff0000', fireRate: 15, ammo: 50 },
        { name: 'PLASMA', damage: 30, speed: 8, size: 5, color: '#ff00ff', fireRate: 20, ammo: 30 }
    ],

    // Enemy types and stats
    ENEMY_TYPES: {
        scout: { size: 6, speed: 2, health: 25, color: '#ff6666', points: 10 },
        fighter: { size: 8, speed: 1.8, health: 40, color: '#ff4444', points: 20 },
        bomber: { size: 12, speed: 1, health: 60, color: '#ff2222', points: 30 },
        cruiser: { size: 15, speed: 1.3, health: 80, color: '#ff0000', points: 50 },
        interceptor: { size: 7, speed: 2.5, health: 30, color: '#ff8888', points: 25 },
        miner: { size: 10, speed: 0.7, health: 50, color: '#ffaa44', points: 15 },
        drone: { size: 5, speed: 2.2, health: 20, color: '#ff9999', points: 8 }
    },

    // Space generation settings
    SPACE_GENERATION: {
        STAR_COUNT: 200,
        ASTEROID_COUNT: 80,
        PLANETS: [
            { name: 'Earth', x: 1900, y: 1500, size: 40, color: '#4488ff' },
            { name: 'Mars', x: 1600, y: 400, size: 25, color: '#ff4444' },
            { name: 'Jupiter', x: 2800, y: 600, size: 45, color: '#ffaa44' },
            { name: 'Saturn', x: 3200, y: 1800, size: 50, color: '#ffdd88' },
            { name: 'Alien World', x: 3400, y: 2200, size: 35, color: '#aa44ff' }
        ]
    },

    // Spawn rates and timing
    SPAWN_RATES: {
        ENEMY_CHANCE: 0.02,
        POWERUP_CHANCE: 0.001
    },
    
    // Wave system configuration
    WAVE_CONFIG: {
        BASE_ENEMIES_PER_WAVE: 8,
        ENEMIES_INCREASE_PER_WAVE: 2,
        WAVE_BREAK_DURATION: 180, // 3 seconds
        DIFFICULTY_SCALING: {
            HEALTH_PER_WAVE: 8,
            SPEED_PER_WAVE: 0.08,
            DAMAGE_PER_WAVE: 2
        }
    }
};

// Projectile class
class Projectile {
    constructor(x, y, vx, vy, weapon, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = weapon.size;
        this.color = weapon.color;
        this.damage = damage;
        this.life = 120; // 2 seconds at 60fps
        this.type = weapon.name;
        this.homing = false; // Will be set by game if homing shots are enabled
        this.speed = Math.sqrt(vx * vx + vy * vy); // Store original speed for homing
    }

    update(enemies = []) {
        // Homing behavior
        if (this.homing && enemies.length > 0) {
            // Find closest enemy
            let closestEnemy = null;
            let closestDistance = Infinity;

            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance && distance < 200) { // Homing range
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }

            // Adjust velocity towards closest enemy
            if (closestEnemy) {
                const dx = closestEnemy.x - this.x;
                const dy = closestEnemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    // Gradually turn towards target
                    const targetVx = (dx / distance) * this.speed;
                    const targetVy = (dy / distance) * this.speed;

                    const turnRate = 0.1; // How quickly projectile can turn
                    this.vx += (targetVx - this.vx) * turnRate;
                    this.vy += (targetVy - this.vy) * turnRate;

                    // Maintain speed
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (currentSpeed > 0) {
                        this.vx = (this.vx / currentSpeed) * this.speed;
                        this.vy = (this.vy / currentSpeed) * this.speed;
                    }
                }
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    isAlive() {
        return this.life > 0;
    }

    isInBounds(spaceWidth, spaceHeight) {
        return this.x > -50 && this.x < spaceWidth + 50 &&
            this.y > -50 && this.y < spaceHeight + 50;
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GameConfig.PLAYER.SIZE;
        this.speed = GameConfig.PLAYER.SPEED;
        this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        this.health = this.maxHealth;
        this.maxShield = GameConfig.PLAYER.MAX_SHIELD;
        this.shield = this.maxShield;
        this.color = GameConfig.PLAYER.COLOR;
        this.dashCooldown = 0;
        this.invulnerable = 0;
        this.angle = 0;
        this.shieldRegenDelay = 0; // Delay before shield starts regenerating
        this.damageFlash = 0; // Visual damage indicator
    }

    update(keys, canvas) {
        // Handle movement
        let dx = 0;
        let dy = 0;

        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Apply movement (will be modified by game's speed multiplier)
        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Keep player within bounds
        this.x = Math.max(this.size, Math.min(GameConfig.SPACE_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(GameConfig.SPACE_HEIGHT - this.size, this.y));

        // Handle dash
        if (keys[' '] && this.dashCooldown === 0) {
            this.dash(dx, dy, 1); // Default multiplier, will be overridden by game
        }

        // Update cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.shieldRegenDelay > 0) this.shieldRegenDelay--;
        if (this.damageFlash > 0) this.damageFlash--;

        // Shield regeneration (only after delay)
        if (this.shield < this.maxShield && this.shieldRegenDelay <= 0) {
            const regenRate = this.shieldRegenBonus ? 0.3 : 0.15; // Faster if upgraded
            this.shield = Math.min(this.maxShield, this.shield + regenRate);
        }
    }

    dash(dx, dy, multiplier = 1) {
        const dashDistance = 100 * multiplier;
        this.x += dx * dashDistance;
        this.y += dy * dashDistance;

        // Keep within bounds after dash
        this.x = Math.max(this.size, Math.min(GameConfig.SPACE_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(GameConfig.SPACE_HEIGHT - this.size, this.y));

        this.dashCooldown = GameConfig.PLAYER.DASH_COOLDOWN;
        this.invulnerable = 30;

        // Store dash damage flag for game to check
        this.dashingThisFrame = true;
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return false;

        console.log(`Player taking ${damage} damage. Health: ${this.health}, Shield: ${this.shield}, MaxShield: ${this.maxShield}`);

        let actualDamage = damage;

        if (this.shield > 0) {
            // Shield absorbs damage first
            const shieldDamage = Math.min(this.shield, damage);
            this.shield -= shieldDamage;
            actualDamage -= shieldDamage;
            console.log(`Shield absorbed ${shieldDamage} damage. Shield now: ${this.shield}`);
        }

        // Remaining damage goes to health
        if (actualDamage > 0) {
            this.health = Math.max(0, this.health - actualDamage);
            console.log(`Health took ${actualDamage} damage. Health now: ${this.health}`);
        }

        this.invulnerable = GameConfig.PLAYER.INVULNERABLE_TIME;
        this.shieldRegenDelay = 300; // 5 seconds at 60fps before shield starts regenerating
        this.damageFlash = 30; // Flash red for half a second
        return true;
    }

    isDead() {
        return this.health <= 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.dashCooldown = 0;
        this.invulnerable = 0;
        this.shieldRegenDelay = 0;
        this.damageFlash = 0;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type, wave = 1) {
        this.x = x;
        this.y = y;
        this.type = type;

        const config = GameConfig.ENEMY_TYPES[type];
        
        // Apply wave scaling
        const waveMultiplier = 1 + (wave - 1) * 0.15; // 15% increase per wave
        this.size = config.size;
        this.speed = config.speed + (wave - 1) * GameConfig.WAVE_CONFIG.DIFFICULTY_SCALING.SPEED_PER_WAVE;
        this.maxHealth = Math.floor(config.health + (wave - 1) * GameConfig.WAVE_CONFIG.DIFFICULTY_SCALING.HEALTH_PER_WAVE);
        this.health = this.maxHealth;
        this.color = config.color;
        this.points = Math.floor(config.points * waveMultiplier);
        this.damage = 20 + (wave - 1) * GameConfig.WAVE_CONFIG.DIFFICULTY_SCALING.DAMAGE_PER_WAVE;

        this.angle = 0;
        this.targetAngle = 0;
        this.behaviorTimer = 0;
    }

    update(player) {
        // Calculate angle to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.targetAngle = Math.atan2(dy, dx);

        // Smooth rotation towards player
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.angle += angleDiff * 0.1;

        // Move towards player
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.behaviorTimer++;
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    isDead() {
        return this.health <= 0;
    }

    getPoints() {
        return this.points;
    }
}

// Camera class
class Camera {
    constructor(spaceWidth, spaceHeight, canvas) {
        this.x = 0;
        this.y = 0;
        this.followSpeed = GameConfig.CAMERA.FOLLOW_SPEED;
        this.spaceWidth = spaceWidth;
        this.spaceHeight = spaceHeight;
        this.canvas = canvas;
    }

    update(player) {
        const targetX = player.x - this.canvas.width / 2;
        const targetY = player.y - this.canvas.height / 2;

        this.x += (targetX - this.x) * this.followSpeed;
        this.y += (targetY - this.y) * this.followSpeed;

        this.x = Math.max(0, Math.min(this.spaceWidth - this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.spaceHeight - this.canvas.height, this.y));
    }

    centerOnPlayer(player) {
        this.x = player.x - this.canvas.width / 2;
        this.y = player.y - this.canvas.height / 2;

        this.x = Math.max(0, Math.min(this.spaceWidth - this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.spaceHeight - this.canvas.height, this.y));
    }
}

// Main Game class
class Game {
    constructor() {
        console.log('Game constructor starting...');

        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 80;

        // Initialize game state
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        
        // Wave management
        this.waveInProgress = false;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        this.waveTransitionTimer = 0;
        this.waveStartDelay = 180; // 3 seconds at 60fps
        this.bloodlustTimer = 0; // For berserker bloodlust ability
        this.stealthTimer = 0; // For assassin stealth ability
        this.turrets = []; // For engineer auto-turrets
        this.gameRunning = false; // Start paused for class selection
        this.gameStarted = false;
        this.selectedClass = null;

        // Level system
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 200;
        this.showLevelUpMenu = false;
        this.levelUpOptions = [];

        // Player stats (tracked for upgrades)
        this.playerStats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            speedMultiplier: 1,
            maxHealthBonus: 0,
            maxShieldBonus: 0,
            multiShotCount: 0,
            piercingShots: false,
            dashDamage: false,
            explosiveShots: false,
            magneticField: false,
            shieldRegen: false,
            vampiric: false,
            // New class-specific abilities
            dashMultiplier: 1,
            stealthDash: false,
            shadowStrike: false,
            damageReduction: 0,
            thornsDamage: false,
            fortressMode: false,
            homingShots: false,
            criticalChance: 0,
            rangedBonus: false,
            headshotChance: 0,
            projectileSpeedMultiplier: 1,
            rageMode: false,
            bloodlust: false,
            rampage: false,
            autoTurret: false,
            autoRepair: false
        };

        // All possible upgrades with class restrictions
        this.upgradePool = [
            // Universal stat upgrades (available to all classes)
            { id: 'damage1', name: 'Weapon Upgrade', description: '+25% weapon damage', rarity: 'common', classes: ['all'], effect: () => this.playerStats.damageMultiplier += 0.25 },
            { id: 'damage2', name: 'Advanced Targeting', description: '+40% weapon damage', rarity: 'uncommon', classes: ['all'], effect: () => this.playerStats.damageMultiplier += 0.4 },
            { id: 'firerate1', name: 'Rapid Fire', description: '+30% fire rate', rarity: 'common', classes: ['all'], effect: () => this.playerStats.fireRateMultiplier += 0.3 },
            { id: 'firerate2', name: 'Auto-Loader', description: '+50% fire rate', rarity: 'uncommon', classes: ['all'], effect: () => this.playerStats.fireRateMultiplier += 0.5 },
            { id: 'speed1', name: 'Engine Boost', description: '+25% movement speed', rarity: 'common', classes: ['all'], effect: () => this.playerStats.speedMultiplier += 0.25 },
            { id: 'speed2', name: 'Afterburners', description: '+40% movement speed', rarity: 'uncommon', classes: ['all'], effect: () => this.playerStats.speedMultiplier += 0.4 },
            { id: 'health1', name: 'Hull Plating', description: '+30 max health', rarity: 'common', classes: ['all'], effect: () => { this.playerStats.maxHealthBonus += 30; this.player.maxHealth += 30; this.player.health += 30; } },
            { id: 'health2', name: 'Reinforced Hull', description: '+50 max health', rarity: 'uncommon', classes: ['all'], effect: () => { this.playerStats.maxHealthBonus += 50; this.player.maxHealth += 50; this.player.health += 50; } },
            { id: 'shield1', name: 'Shield Generator', description: '+25 max shield', rarity: 'common', classes: ['all'], effect: () => { this.playerStats.maxShieldBonus += 25; this.player.maxShield += 25; this.player.shield += 25; } },
            { id: 'shield2', name: 'Advanced Shields', description: '+40 max shield', rarity: 'uncommon', classes: ['all'], effect: () => { this.playerStats.maxShieldBonus += 40; this.player.maxShield += 40; this.player.shield += 40; } },

            // Class-specific special abilities
            { id: 'multishot1', name: 'Twin Cannons', description: 'Fire 2 projectiles', rarity: 'uncommon', classes: ['hunter', 'engineer', 'berserker'], effect: () => this.playerStats.multiShotCount = Math.max(this.playerStats.multiShotCount, 1) },
            { id: 'multishot2', name: 'Triple Threat', description: 'Fire 3 projectiles', rarity: 'rare', classes: ['hunter', 'engineer'], effect: () => this.playerStats.multiShotCount = Math.max(this.playerStats.multiShotCount, 2) },
            { id: 'piercing', name: 'Piercing Rounds', description: 'Shots pierce through enemies', rarity: 'rare', classes: ['hunter', 'tank'], effect: () => this.playerStats.piercingShots = true },
            { id: 'explosive', name: 'Explosive Rounds', description: 'Shots explode on impact', rarity: 'rare', classes: ['engineer', 'berserker', 'tank'], effect: () => this.playerStats.explosiveShots = true },
            {
                id: 'shieldregen', name: 'Shield Regenerator', description: 'Shields regenerate faster', rarity: 'uncommon', classes: ['tank', 'engineer'], effect: () => {
                    this.playerStats.shieldRegen = true;
                    this.player.shieldRegenBonus = true;
                }
            },
            { id: 'vampiric', name: 'Life Steal', description: 'Gain health when killing enemies', rarity: 'rare', classes: ['berserker', 'assassin'], effect: () => this.playerStats.vampiric = true },

            // Assassin-specific abilities
            { id: 'dashdamage', name: 'Ramming Speed', description: 'Dashing through enemies deals damage', rarity: 'rare', classes: ['assassin'], effect: () => this.playerStats.dashDamage = true },
            { id: 'shadowstrike', name: 'Shadow Strike', description: '+100% dash distance and damage', rarity: 'rare', classes: ['assassin'], effect: () => { this.playerStats.dashMultiplier += 1.0; this.playerStats.shadowStrike = true; } },
            { id: 'stealth', name: 'Cloaking Device', description: 'Brief invisibility after dash', rarity: 'uncommon', classes: ['assassin'], effect: () => this.playerStats.stealthDash = true },

            // Tank-specific abilities
            { id: 'armor', name: 'Reactive Armor', description: 'Reduce incoming damage by 25%', rarity: 'uncommon', classes: ['tank'], effect: () => this.playerStats.damageReduction += 0.25 },
            { id: 'thorns', name: 'Thorn Plating', description: 'Reflect damage to attackers', rarity: 'rare', classes: ['tank'], effect: () => this.playerStats.thornsDamage = true },
            { id: 'fortress', name: 'Fortress Mode', description: 'Stationary = +50% damage, +50% damage reduction', rarity: 'rare', classes: ['tank'], effect: () => this.playerStats.fortressMode = true },

            // Hunter-specific abilities
            { id: 'tracking', name: 'Target Tracking', description: 'Projectiles home in on enemies', rarity: 'rare', classes: ['hunter'], effect: () => this.playerStats.homingShots = true },
            { id: 'criticals', name: 'Critical Strikes', description: '20% chance for 3x damage', rarity: 'uncommon', classes: ['hunter', 'sniper'], effect: () => this.playerStats.criticalChance = 0.2 },
            { id: 'marksman', name: 'Marksman Training', description: '+50% damage at long range', rarity: 'uncommon', classes: ['hunter', 'sniper'], effect: () => this.playerStats.rangedBonus = true },

            // Sniper-specific abilities
            { id: 'headshot', name: 'Headshot Mastery', description: '50% chance for instant kill on low-health enemies', rarity: 'rare', classes: ['sniper'], effect: () => this.playerStats.headshotChance = 0.5 },
            { id: 'scope', name: 'Enhanced Scope', description: '+100% projectile speed and range', rarity: 'uncommon', classes: ['sniper'], effect: () => this.playerStats.projectileSpeedMultiplier += 1.0 },

            // Berserker-specific abilities
            { id: 'rage', name: 'Berserker Rage', description: 'Low health = higher damage and speed', rarity: 'uncommon', classes: ['berserker'], effect: () => this.playerStats.rageMode = true },
            { id: 'bloodlust', name: 'Bloodlust', description: 'Kills increase damage for 5 seconds', rarity: 'rare', classes: ['berserker'], effect: () => this.playerStats.bloodlust = true },
            { id: 'rampage', name: 'Rampage', description: 'Each kill reduces all cooldowns', rarity: 'rare', classes: ['berserker'], effect: () => this.playerStats.rampage = true },

            // Engineer-specific abilities
            { id: 'magnetic', name: 'Magnetic Field', description: 'Attract items from distance', rarity: 'uncommon', classes: ['engineer'], effect: () => this.playerStats.magneticField = true },
            {
                id: 'turret', name: 'Auto-Turret', description: 'Deploy a stationary turret', rarity: 'rare', classes: ['engineer'], effect: () => {
                    this.playerStats.autoTurret = true;
                    this.deployTurret();
                }
            },
            { id: 'repair', name: 'Auto-Repair', description: 'Slowly regenerate health over time', rarity: 'uncommon', classes: ['engineer'], effect: () => this.playerStats.autoRepair = true }
        ];

        // Initialize systems
        this.camera = new Camera(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT, this.canvas);
        this.player = new Player(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);

        // Class configurations - Reworked for better shield/health balance
        this.classConfigs = {
            tank: {
                healthMultiplier: 1.8,  // High health tank
                shieldMultiplier: 1.6,  // High shields too - ultimate defense
                speedMultiplier: 0.7,
                damageMultiplier: 1.0,
                fireRateMultiplier: 1.0,
                dashMultiplier: 1.0,
                special: null,
                startingWeapon: 0, // PHOTON
                playerColor: '#4488ff',
                description: 'Heavy armor, high health and shields'
            },
            hunter: {
                healthMultiplier: 0.9,   // Balanced health
                shieldMultiplier: 1.1,   // Slightly above average shields
                speedMultiplier: 1.0,
                damageMultiplier: 1.4,
                fireRateMultiplier: 1.5,
                dashMultiplier: 1.0,
                special: null,
                startingWeapon: 1, // SCATTER
                playerColor: '#ff8800',
                description: 'Balanced survivability, high damage output'
            },
            assassin: {
                healthMultiplier: 0.7,   // Slightly higher health for survivability
                shieldMultiplier: 0.5,   // Slightly higher shields
                speedMultiplier: 1.4,
                damageMultiplier: 1.3,
                fireRateMultiplier: 1.2, // Faster attacks for hit-and-run
                dashMultiplier: 1.8,
                special: null,
                startingWeapon: 3, // PLASMA
                playerColor: '#aa00ff',
                description: 'Fragile but fast, relies on mobility'
            },
            engineer: {
                healthMultiplier: 0.8,   // Lower health
                shieldMultiplier: 1.6,   // High shields but not overpowered
                speedMultiplier: 0.8,
                damageMultiplier: 0.9,   // Slightly lower damage to balance utility
                fireRateMultiplier: 1.0,
                dashMultiplier: 1.0,
                special: 'multishot_and_regen',
                startingWeapon: 0, // PHOTON
                playerColor: '#00ffaa',
                description: 'Shield specialist with support abilities'
            },
            berserker: {
                healthMultiplier: 1.5,   // High health
                shieldMultiplier: 0.6,   // Low shields - health-focused warrior
                speedMultiplier: 1.0,
                damageMultiplier: 1.0,
                fireRateMultiplier: 1.0,
                dashMultiplier: 1.0,
                special: 'rage_damage',
                startingWeapon: 0, // PHOTON
                playerColor: '#ff4444',
                description: 'High health warrior, low shields'
            },
            sniper: {
                healthMultiplier: 0.7,   // Low health
                shieldMultiplier: 1.3,   // Above average shields for protection
                speedMultiplier: 0.9,
                damageMultiplier: 2.0,
                fireRateMultiplier: 0.6, // Slightly faster fire rate
                dashMultiplier: 1.0,
                special: 'piercing_shots',
                startingWeapon: 2, // BEAM
                playerColor: '#00ff88',
                description: 'Long-range specialist with shield protection'
            }
        };

        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

        // Weapon system
        this.weapons = [...GameConfig.WEAPONS];
        this.currentWeapon = 0;
        this.fireTimer = 0;

        // Game object arrays
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.explosions = [];

        // Space objects
        this.stars = [];
        this.planets = [];
        this.asteroids = [];

        this.init();
    }

    init() {
        console.log('Initializing game...');

        this.generateSpaceObjects();
        this.spawnInitialEnemies();
        this.camera.centerOnPlayer(this.player);
        this.setupEventListeners();
        this.gameLoop();

        console.log('Game initialization complete!');
    }

    generateSpaceObjects() {
        // Generate stars
        for (let i = 0; i < GameConfig.SPACE_GENERATION.STAR_COUNT; i++) {
            this.stars.push({
                x: Math.random() * GameConfig.SPACE_WIDTH,
                y: Math.random() * GameConfig.SPACE_HEIGHT,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2
            });
        }

        // Generate planets
        this.planets = [...GameConfig.SPACE_GENERATION.PLANETS];

        // Generate asteroids
        for (let i = 0; i < GameConfig.SPACE_GENERATION.ASTEROID_COUNT; i++) {
            this.asteroids.push({
                x: Math.random() * GameConfig.SPACE_WIDTH,
                y: Math.random() * GameConfig.SPACE_HEIGHT,
                size: Math.random() * 15 + 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    spawnInitialEnemies() {
        // Spawn enemies around planets
        this.planets.forEach(planet => {
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = planet.size + 100 + Math.random() * 200;
                const x = planet.x + Math.cos(angle) * distance;
                const y = planet.y + Math.sin(angle) * distance;

                this.spawnEnemy(x, y);
            }
        });
    }

    spawnEnemy(x, y, type = null) {
        if (!type) {
            const types = Object.keys(GameConfig.ENEMY_TYPES);
            type = types[Math.floor(Math.random() * types.length)];
        }

        const enemy = new Enemy(x, y, type, this.wave);
        this.enemies.push(enemy);
        
        // Track enemies in current wave
        if (this.waveInProgress) {
            this.enemiesInWave++;
        }
    }

    startWave() {
        this.waveInProgress = true;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        
        // Calculate enemies for this wave
        const enemiesThisWave = GameConfig.WAVE_CONFIG.BASE_ENEMIES_PER_WAVE + 
                               (this.wave - 1) * GameConfig.WAVE_CONFIG.ENEMIES_INCREASE_PER_WAVE;
        
        // Spawn enemies for this wave
        for (let i = 0; i < enemiesThisWave; i++) {
            // Spawn enemies around the player but off-screen
            const angle = (i / enemiesThisWave) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 800 + Math.random() * 400;
            const x = this.player.x + Math.cos(angle) * distance;
            const y = this.player.y + Math.sin(angle) * distance;
            
            // Ensure enemies spawn within world bounds
            const clampedX = Math.max(50, Math.min(GameConfig.SPACE_WIDTH - 50, x));
            const clampedY = Math.max(50, Math.min(GameConfig.SPACE_HEIGHT - 50, y));
            
            this.spawnEnemy(clampedX, clampedY);
        }
        
        console.log(`Wave ${this.wave} started with ${enemiesThisWave} enemies`);
    }

    checkWaveCompletion() {
        if (this.waveInProgress && this.enemiesKilledInWave >= this.enemiesInWave) {
            this.completeWave();
        }
    }

    completeWave() {
        this.waveInProgress = false;
        this.wave++;
        this.waveTransitionTimer = GameConfig.WAVE_CONFIG.WAVE_BREAK_DURATION;
        
        // Bonus score for completing wave
        this.score += this.wave * 100;
        
        console.log(`Wave ${this.wave - 1} completed! Starting wave ${this.wave} in ${this.waveTransitionTimer / 60} seconds`);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Level up menu controls
            if (this.showLevelUpMenu) {
                const keyNum = parseInt(e.key);

                if (keyNum >= 1 && keyNum <= 3) {
                    this.selectUpgrade(keyNum - 1);
                } else if (e.key === 'Escape') {
                    this.showLevelUpMenu = false;
                    this.gameRunning = true;
                }
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;

            // Check level up menu clicks
            if (this.showLevelUpMenu && this.levelUpOptionBounds) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                for (let i = 0; i < this.levelUpOptionBounds.length; i++) {
                    const bounds = this.levelUpOptionBounds[i];
                    if (clickX >= bounds.x && clickX <= bounds.x + bounds.width &&
                        clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
                        this.selectUpgrade(i);
                        break;
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restart();
        });

        // Start game button
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('class-selection').classList.remove('hidden');
        });

        // Class selection
        document.querySelectorAll('.class-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const classType = e.currentTarget.getAttribute('data-class');
                this.selectClass(classType);
            });
        });
    }

    shoot() {
        if (this.fireTimer > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        this.fireTimer = Math.max(1, Math.floor(weapon.fireRate / this.playerStats.fireRateMultiplier));

        const angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

        // Apply stat modifiers
        let finalDamage = weapon.damage * this.playerStats.damageMultiplier;

        // Berserker rage damage - more damage when health is lower
        if (this.playerStats.rageDamage) {
            const healthPercent = this.player.health / this.player.maxHealth;
            const rageMultiplier = 1 + (1 - healthPercent) * 0.8; // Up to 80% more damage at low health
            finalDamage *= rageMultiplier;
        }

        // Bloodlust - damage increase after recent kills
        if (this.playerStats.bloodlust && this.bloodlustTimer > 0) {
            finalDamage *= 1.5; // 50% more damage during bloodlust
        }

        // Fortress Mode - bonus damage when stationary
        if (this.playerStats.fortressMode) {
            const isStationary = Math.abs(this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d']) === 0;
            if (isStationary) {
                finalDamage *= 1.5; // 50% more damage when not moving
            }
        }

        // Apply projectile speed multiplier
        const finalSpeed = weapon.speed * this.playerStats.projectileSpeedMultiplier;

        const projectile = new Projectile(
            this.player.x,
            this.player.y,
            Math.cos(angle) * finalSpeed,
            Math.sin(angle) * finalSpeed,
            weapon,
            finalDamage
        );

        // Add special properties
        projectile.piercing = this.playerStats.piercingShots;
        projectile.explosive = this.playerStats.explosiveShots;
        projectile.homing = this.playerStats.homingShots;

        this.projectiles.push(projectile);

        // Multi-shot ability
        if (this.playerStats.multiShotCount > 0) {
            for (let i = 1; i <= this.playerStats.multiShotCount; i++) {
                const spreadAngle = angle + (i % 2 === 1 ? 0.3 : -0.3) * Math.ceil(i / 2);
                const extraProjectile = new Projectile(
                    this.player.x,
                    this.player.y,
                    Math.cos(spreadAngle) * weapon.speed,
                    Math.sin(spreadAngle) * weapon.speed,
                    weapon,
                    finalDamage * 0.8 // Slightly less damage for extra shots
                );
                extraProjectile.piercing = this.playerStats.piercingShots;
                extraProjectile.explosive = this.playerStats.explosiveShots;
                extraProjectile.homing = this.playerStats.homingShots;
                this.projectiles.push(extraProjectile);
            }
        }

        this.projectiles.push(projectile);
    }

    update() {
        if (!this.gameRunning) return;

        // Update player
        const originalSpeed = this.player.speed;
        let finalSpeedMultiplier = this.playerStats.speedMultiplier;

        // Berserker rage mode - more speed when health is lower
        if (this.playerStats.rageMode) {
            const healthPercent = this.player.health / this.player.maxHealth;
            const rageSpeedBonus = (1 - healthPercent) * 0.5; // Up to 50% more speed at low health
            finalSpeedMultiplier += rageSpeedBonus;
        }

        this.player.speed = GameConfig.PLAYER.SPEED * finalSpeedMultiplier;
        this.player.dashingThisFrame = false; // Reset dash flag

        // Override dash method to use class multiplier
        const originalDash = this.player.dash;
        this.player.dash = (dx, dy) => {
            originalDash.call(this.player, dx, dy, this.playerStats.dashMultiplier);
        };

        this.player.update(this.keys, this.canvas);
        this.player.speed = originalSpeed; // Reset for consistency

        // Check stealth activation after dash
        if (this.player.dashingThisFrame && this.playerStats.stealthDash) {
            this.stealthTimer = 120; // 2 seconds of stealth
        }

        // Check dash damage
        if (this.player.dashingThisFrame && this.playerStats.dashDamage) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.size + this.player.size + 20) { // Slightly larger radius for dash
                    let dashDamage = 50;

                    // Shadow Strike - enhanced dash damage
                    if (this.playerStats.shadowStrike) {
                        dashDamage = 100; // Double damage

                        // Create shadow particles
                        for (let k = 0; k < 8; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 10,
                                vy: (Math.random() - 0.5) * 10,
                                size: 3,
                                color: '#8800ff',
                                life: 40,
                                decay: 0.94
                            });
                        }
                    }

                    enemy.takeDamage(dashDamage);

                    // Create dash particles
                    for (let j = 0; j < 8; j++) {
                        this.particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 12,
                            vy: (Math.random() - 0.5) * 12,
                            life: 20,
                            color: '#ffaa00',
                            size: 3
                        });
                    }

                    if (enemy.isDead()) {
                        const points = enemy.getPoints() * this.combo;
                        this.score += points;
                        this.experience += Math.floor(points / 2);

                        if (this.playerStats.vampiric) {
                            this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);
                        }

                        this.enemies.splice(i, 1);
                        
                        // Track wave progress
                        if (this.waveInProgress) {
                            this.enemiesKilledInWave++;
                        }
                    }
                }
            }
        }

        // Update camera
        this.camera.update(this.player);

        // Update mouse world coordinates
        this.mouse.worldX = this.mouse.x + this.camera.x;
        this.mouse.worldY = this.mouse.y + this.camera.y;

        // Handle shooting
        if (this.mouse.down) {
            this.shoot();
        }

        // Update timers
        if (this.fireTimer > 0) this.fireTimer--;

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.player);

            // Check collision with projectiles
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const projectile = this.projectiles[j];
                const dx = enemy.x - projectile.x;
                const dy = enemy.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.size + projectile.size) {
                    let finalDamage = projectile.damage;

                    // Critical hit chance
                    if (this.playerStats.criticalChance > 0 && Math.random() < this.playerStats.criticalChance) {
                        finalDamage *= 3; // 3x damage on crit
                        // Create crit particles
                        for (let k = 0; k < 8; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                size: 3,
                                color: '#ffff00',
                                life: 30,
                                decay: 0.95
                            });
                        }
                    }

                    // Ranged damage bonus
                    if (this.playerStats.rangedBonus) {
                        const distanceToPlayer = Math.sqrt((enemy.x - this.player.x) ** 2 + (enemy.y - this.player.y) ** 2);
                        if (distanceToPlayer > 200) { // Long range
                            finalDamage *= 1.5;
                        }
                    }

                    // Headshot chance (instant kill on low health enemies)
                    if (this.playerStats.headshotChance > 0 && Math.random() < this.playerStats.headshotChance) {
                        if (enemy.health <= enemy.maxHealth * 0.3) { // 30% health or less
                            finalDamage = enemy.health; // Instant kill
                            // Create headshot particles
                            for (let k = 0; k < 10; k++) {
                                this.particles.push({
                                    x: enemy.x,
                                    y: enemy.y - enemy.size,
                                    vx: (Math.random() - 0.5) * 6,
                                    vy: -Math.random() * 8,
                                    size: 2,
                                    color: '#ff0000',
                                    life: 50,
                                    decay: 0.96
                                });
                            }
                        }
                    }

                    enemy.takeDamage(finalDamage);

                    // Explosive shots
                    if (projectile.explosive) {
                        // Damage nearby enemies
                        for (let k = 0; k < this.enemies.length; k++) {
                            if (k === i) continue; // Skip the hit enemy
                            const otherEnemy = this.enemies[k];
                            const explosionDist = Math.sqrt((otherEnemy.x - enemy.x) ** 2 + (otherEnemy.y - enemy.y) ** 2);
                            if (explosionDist < 60) { // Explosion radius
                                otherEnemy.takeDamage(finalDamage * 0.5); // Half damage to nearby enemies
                            }
                        }

                        // Create explosion particles
                        for (let k = 0; k < 15; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 12,
                                vy: (Math.random() - 0.5) * 12,
                                size: 4,
                                color: '#ff6600',
                                life: 40,
                                decay: 0.92
                            });
                        }
                    }

                    // Remove projectile unless it's piercing
                    if (!projectile.piercing) {
                        this.projectiles.splice(j, 1);
                    }

                    if (enemy.isDead()) {
                        const points = enemy.getPoints() * this.combo;
                        this.score += points;
                        this.experience += Math.floor(points / 2); // Gain XP equal to half the points
                        this.combo = Math.min(10, this.combo + 1);
                        this.comboTimer = 180;

                        // Vampiric healing
                        if (this.playerStats.vampiric) {
                            this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);
                        }

                        // Bloodlust - damage increase after kills
                        if (this.playerStats.bloodlust) {
                            this.bloodlustTimer = 300; // 5 seconds at 60fps
                        }

                        // Rampage - reduce all cooldowns on kill
                        if (this.playerStats.rampage) {
                            // Reduce dash cooldown
                            if (this.player.dashCooldown > 0) {
                                this.player.dashCooldown = Math.max(0, this.player.dashCooldown - 30);
                            }
                            // Add other cooldown reductions here if needed
                        }

                        this.checkLevelUp();
                        this.enemies.splice(i, 1);
                        
                        // Track wave progress
                        if (this.waveInProgress) {
                            this.enemiesKilledInWave++;
                        }
                    }
                    break;
                }
            }

            // Check collision with player
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size + this.player.size) {
                let finalDamage = enemy.damage;

                // Apply damage reduction from armor
                if (this.playerStats.damageReduction > 0) {
                    finalDamage *= (1 - this.playerStats.damageReduction);
                }

                // Fortress Mode - additional damage reduction when stationary
                if (this.playerStats.fortressMode) {
                    const isStationary = !this.keys['w'] && !this.keys['a'] && !this.keys['s'] && !this.keys['d'];
                    if (isStationary) {
                        finalDamage *= 0.5; // 50% damage reduction when not moving
                    }
                }

                // Stealth - enemies can't see stealthed player
                if (this.stealthTimer > 0) {
                    continue; // Skip collision when stealthed
                }

                if (this.player.takeDamage(finalDamage)) {
                    // Thorn damage - reflect damage back to attacker
                    if (this.playerStats.thornsDamage) {
                        enemy.takeDamage(finalDamage * 0.5); // Reflect 50% of damage

                        // Create thorn particles
                        for (let k = 0; k < 6; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                size: 2,
                                color: '#ffaa00',
                                life: 35,
                                decay: 0.93
                            });
                        }
                    }

                    // Create hit particles
                    for (let k = 0; k < 5; k++) {
                        this.particles.push({
                            x: this.player.x,
                            y: this.player.y,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            life: 30,
                            color: '#ffaa00',
                            size: 2
                        });
                    }
                }
                // Remove enemy on contact (kamikaze style)
                this.enemies.splice(i, 1);
                
                // Track wave progress
                if (this.waveInProgress) {
                    this.enemiesKilledInWave++;
                }
                i--; // Adjust index since we removed an element
                continue;
            }

            // Check collision with turrets
            for (let t = 0; t < this.turrets.length; t++) {
                const turret = this.turrets[t];
                const tdx = enemy.x - turret.x;
                const tdy = enemy.y - turret.y;
                const tdistance = Math.sqrt(tdx * tdx + tdy * tdy);

                if (tdistance < enemy.size + 12) { // 12 is turret size
                    turret.health -= enemy.damage;

                    // Create hit particles
                    for (let k = 0; k < 3; k++) {
                        this.particles.push({
                            x: turret.x,
                            y: turret.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 25,
                            color: '#ff6600',
                            size: 2
                        });
                    }

                    // Remove enemy on contact
                    this.enemies.splice(i, 1);
                    
                    // Track wave progress
                    if (this.waveInProgress) {
                        this.enemiesKilledInWave++;
                    }
                    
                    i--; // Adjust index since we removed an element
                    break;
                }
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(this.enemies);

            if (!projectile.isAlive() || !projectile.isInBounds(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT)) {
                this.projectiles.splice(i, 1);
            }
        }

        // Wave management
        if (this.waveTransitionTimer > 0) {
            this.waveTransitionTimer--;
            if (this.waveTransitionTimer === 0) {
                this.startWave();
            }
        } else if (!this.waveInProgress && this.enemies.length === 0) {
            // Start first wave or next wave if no enemies remain
            this.startWave();
        }
        
        // Check wave completion
        this.checkWaveCompletion();

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            // Add some drag
            particle.vx *= 0.98;
            particle.vy *= 0.98;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.combo = 1;
            }
        }

        // Update bloodlust timer
        if (this.bloodlustTimer > 0) {
            this.bloodlustTimer--;
        }

        // Update stealth timer
        if (this.stealthTimer > 0) {
            this.stealthTimer--;
        }

        // Auto-repair - slowly regenerate health
        if (this.playerStats.autoRepair && this.player.health < this.player.maxHealth) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.2); // Slow health regen
        }

        // Update turrets
        this.updateTurrets();

        // Check for game over
        if (this.player.isDead()) {
            this.gameRunning = false;
            document.getElementById('game-over').classList.remove('hidden');
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Damage flash effect
        if (this.player.damageFlash > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.player.damageFlash / 30 * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Render stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1;

        // Render planets
        this.planets.forEach(planet => {
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Planet glow effect
            this.ctx.shadowColor = planet.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // Render asteroids
        this.ctx.fillStyle = '#666666';
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);

            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = asteroid.size * (0.8 + Math.sin(i * 2.3) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        });

        // Render player
        if (!(this.player.invulnerable > 0 && Math.floor(this.player.invulnerable / 5) % 2)) {
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);

            // Stealth effect - make player semi-transparent
            if (this.stealthTimer > 0) {
                this.ctx.globalAlpha = 0.3; // Very transparent when stealthed
            }

            // Calculate angle to mouse for ship rotation
            const angleToMouse = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
            this.ctx.rotate(angleToMouse);

            // Class-specific ship designs
            this.ctx.fillStyle = this.player.color;
            this.ctx.strokeStyle = this.player.color;
            this.ctx.lineWidth = 1.5;

            if (this.selectedClass === 'tank') {
                // Tank: Bulky, armored design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 2, 0);
                this.ctx.lineTo(this.player.size - 2, -5);
                this.ctx.lineTo(-this.player.size + 4, -4);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 4, 4);
                this.ctx.lineTo(this.player.size - 2, 5);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Armor plating
                this.ctx.fillStyle = '#6699ff';
                this.ctx.fillRect(-8, -3, 6, 6);
                this.ctx.fillRect(-2, -4, 4, 8);

            } else if (this.selectedClass === 'hunter') {
                // Hunter: Aggressive, angular design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 3, 0);
                this.ctx.lineTo(this.player.size - 2, -2);
                this.ctx.lineTo(-this.player.size + 2, -3);
                this.ctx.lineTo(-this.player.size - 2, 0);
                this.ctx.lineTo(-this.player.size + 2, 3);
                this.ctx.lineTo(this.player.size - 2, 2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Weapon pods
                this.ctx.fillStyle = '#ffaa44';
                this.ctx.fillRect(2, -5, 8, 2);
                this.ctx.fillRect(2, 3, 8, 2);

            } else if (this.selectedClass === 'assassin') {
                // Assassin: Sleek, blade-like design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 4, 0);
                this.ctx.lineTo(this.player.size - 6, -1);
                this.ctx.lineTo(-this.player.size + 1, -1);
                this.ctx.lineTo(-this.player.size - 1, 0);
                this.ctx.lineTo(-this.player.size + 1, 1);
                this.ctx.lineTo(this.player.size - 6, 1);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Stealth fins
                this.ctx.fillStyle = '#cc66ff';
                this.ctx.beginPath();
                this.ctx.moveTo(-4, -4);
                this.ctx.lineTo(-10, -2);
                this.ctx.lineTo(-8, 0);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(-4, 4);
                this.ctx.lineTo(-10, 2);
                this.ctx.lineTo(-8, 0);
                this.ctx.closePath();
                this.ctx.fill();

            } else if (this.selectedClass === 'engineer') {
                // Engineer: Utility-focused with tech details
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 1, 0);
                this.ctx.lineTo(this.player.size - 3, -4);
                this.ctx.lineTo(-this.player.size + 3, -3);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 3, 3);
                this.ctx.lineTo(this.player.size - 3, 4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Tech modules
                this.ctx.fillStyle = '#44ffcc';
                this.ctx.fillRect(-6, -2, 3, 4);
                this.ctx.fillRect(-2, -3, 2, 6);
                this.ctx.fillRect(2, -2, 2, 4);

            } else if (this.selectedClass === 'berserker') {
                // Berserker: Brutal, spiked design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 2, 0);
                this.ctx.lineTo(this.player.size - 1, -4);
                this.ctx.lineTo(-this.player.size + 2, -4);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 2, 4);
                this.ctx.lineTo(this.player.size - 1, 4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Battle spikes
                this.ctx.fillStyle = '#ff6666';
                this.ctx.beginPath();
                this.ctx.moveTo(-2, -6);
                this.ctx.lineTo(-6, -5);
                this.ctx.lineTo(-4, -3);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(-2, 6);
                this.ctx.lineTo(-6, 5);
                this.ctx.lineTo(-4, 3);
                this.ctx.closePath();
                this.ctx.fill();

            } else if (this.selectedClass === 'sniper') {
                // Sniper: Long, rifle-like design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 5, 0);
                this.ctx.lineTo(this.player.size - 8, -1);
                this.ctx.lineTo(-this.player.size + 1, -2);
                this.ctx.lineTo(-this.player.size - 2, 0);
                this.ctx.lineTo(-this.player.size + 1, 2);
                this.ctx.lineTo(this.player.size - 8, 1);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Scope/barrel
                this.ctx.fillStyle = '#66ff99';
                this.ctx.fillRect(6, -1, 8, 2);
                this.ctx.fillRect(-8, -1, 4, 2);

            } else {
                // Default design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 2, 0);
                this.ctx.lineTo(this.player.size - 4, -3);
                this.ctx.lineTo(-this.player.size + 2, -2);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 2, 2);
                this.ctx.lineTo(this.player.size - 4, 3);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Wing extensions
                this.ctx.fillStyle = '#0088cc';
                this.ctx.beginPath();
                this.ctx.moveTo(-2, -6);
                this.ctx.lineTo(-8, -4);
                this.ctx.lineTo(-6, -2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(-2, 6);
                this.ctx.lineTo(-8, 4);
                this.ctx.lineTo(-6, 2);
                this.ctx.closePath();
                this.ctx.fill();
            }

            // Cockpit
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(2, 0, 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Engine glow
            this.ctx.fillStyle = '#ff4400';
            this.ctx.beginPath();
            this.ctx.arc(-this.player.size + 1, 0, 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Engine trails when moving
            if (this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d']) {
                this.ctx.fillStyle = '#ff8800';
                this.ctx.beginPath();
                this.ctx.arc(-this.player.size - 3, 0, 1.5, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffaa00';
                this.ctx.beginPath();
                this.ctx.arc(-this.player.size - 6, 0, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Shield effect when active
            if (this.player.shield > this.player.maxShield * 0.3) {
                this.ctx.strokeStyle = '#00aaff';
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, this.player.size + 4, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }

            this.ctx.restore();
        }

        // Render enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Enemy health bar
            if (enemy.health < enemy.maxHealth) {
                const barWidth = enemy.size * 2;
                const barHeight = 3;
                const x = enemy.x - barWidth / 2;
                const y = enemy.y - enemy.size - 10;

                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(x, y, barWidth, barHeight);

                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
            }
        });

        // Render turrets
        this.turrets.forEach(turret => {
            // Turret base
            this.ctx.fillStyle = '#666666';
            this.ctx.beginPath();
            this.ctx.arc(turret.x, turret.y, 12, 0, Math.PI * 2);
            this.ctx.fill();

            // Turret cannon
            this.ctx.fillStyle = '#888888';
            this.ctx.beginPath();
            this.ctx.arc(turret.x, turret.y, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Turret health bar
            if (turret.health < turret.maxHealth) {
                const barWidth = 24;
                const barHeight = 3;
                const x = turret.x - barWidth / 2;
                const y = turret.y - 20;

                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(x, y, barWidth, barHeight);

                const healthPercent = turret.health / turret.maxHealth;
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
            }

            // Render turret projectiles
            turret.projectiles.forEach(projectile => {
                this.ctx.fillStyle = projectile.color;
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });

        // Render projectiles
        this.projectiles.forEach(projectile => {
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Render particles
        this.particles.forEach(particle => {
            const alpha = particle.life / 30;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Restore context
        this.ctx.restore();

        // Update UI elements
        const healthFill = document.getElementById('health-fill');
        const shieldFill = document.getElementById('shield-fill');
        const xpFill = document.getElementById('xp-fill');
        const levelElement = document.getElementById('level');
        const xpText = document.getElementById('xp-text');
        const scoreElement = document.getElementById('score');
        const waveElement = document.getElementById('wave');
        const comboElement = document.getElementById('combo');

        if (healthFill) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
        }

        if (shieldFill) {
            const shieldPercent = (this.player.shield / this.player.maxShield) * 100;
            shieldFill.style.width = `${shieldPercent}%`;
        }

        if (xpFill) {
            const xpPercent = (this.experience / this.experienceToNext) * 100;
            xpFill.style.width = `${xpPercent}%`;
        }

        if (levelElement) levelElement.textContent = this.level;
        if (xpText) xpText.textContent = `${this.experience}/${this.experienceToNext}`;
        if (scoreElement) scoreElement.textContent = this.score;
        if (waveElement) {
            if (this.waveTransitionTimer > 0) {
                const seconds = Math.ceil(this.waveTransitionTimer / 60);
                waveElement.textContent = `${this.wave} (Starting in ${seconds}s)`;
            } else if (this.waveInProgress) {
                const remaining = this.enemiesInWave - this.enemiesKilledInWave;
                waveElement.textContent = `${this.wave} (${remaining} enemies left)`;
            } else {
                waveElement.textContent = this.wave;
            }
        }
        if (comboElement) comboElement.textContent = `x${this.combo}`;

        // Render minimap
        this.renderMinimap();

        // Render level up menu
        if (this.showLevelUpMenu) {
            this.renderLevelUpMenu();
        }
    }

    checkLevelUp() {
        if (this.experience >= this.experienceToNext) {
            this.level++;
            this.experience -= this.experienceToNext;
            this.experienceToNext = Math.floor(this.experienceToNext * 1.8); // Increase XP requirement more significantly
            this.generateLevelUpOptions();
            this.showLevelUpMenu = true;
            this.gameRunning = false; // Pause game for level up
        }
    }

    generateLevelUpOptions() {
        this.levelUpOptions = [];
        const availableUpgrades = this.upgradePool.filter(upgrade => {
            // Filter by class compatibility
            if (!upgrade.classes.includes('all') && !upgrade.classes.includes(this.selectedClass)) {
                return false;
            }

            // Filter out upgrades that are already maxed or incompatible
            switch (upgrade.id) {
                // Multi-level upgrades
                case 'multishot2': return this.playerStats.multiShotCount < 2;
                case 'armor': return this.playerStats.damageReduction < 0.5; // Max 50% reduction
                case 'scope': return this.playerStats.projectileSpeedMultiplier < 2.0;

                // One-time abilities - can only be obtained once
                case 'piercing': return !this.playerStats.piercingShots && this.selectedClass !== 'sniper'; // Sniper already has piercing
                case 'dashdamage': return !this.playerStats.dashDamage;
                case 'explosive': return !this.playerStats.explosiveShots;
                case 'magnetic': return !this.playerStats.magneticField;
                case 'shieldregen': return !this.playerStats.shieldRegen;
                case 'vampiric': return !this.playerStats.vampiric;
                case 'shadowstrike': return !this.playerStats.shadowStrike;
                case 'thorns': return !this.playerStats.thornsDamage;
                case 'fortress': return !this.playerStats.fortressMode;
                case 'tracking': return !this.playerStats.homingShots;
                case 'criticals': return !this.playerStats.criticalChance;
                case 'marksman': return !this.playerStats.rangedBonus;
                case 'headshot': return !this.playerStats.headshotChance;
                case 'rage': return !this.playerStats.rageMode;
                case 'bloodlust': return !this.playerStats.bloodlust;
                case 'rampage': return !this.playerStats.rampage;
                case 'turret': return !this.playerStats.autoTurret;
                case 'repair': return !this.playerStats.autoRepair;
                case 'stealth': return !this.playerStats.stealthDash;

                // Prerequisites for advanced abilities
                case 'shadowstrike': return this.playerStats.dashDamage && !this.playerStats.shadowStrike; // Requires ramming speed first

                default: return true;
            }
        });

        // Generate 3 random options with rarity weighting
        for (let i = 0; i < 3 && availableUpgrades.length > 0; i++) {
            const rarityWeights = { common: 60, uncommon: 30, rare: 10 };
            const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
            const random = Math.random() * totalWeight;

            let targetRarity = 'common';
            let weightSum = 0;
            for (const [rarity, weight] of Object.entries(rarityWeights)) {
                weightSum += weight;
                if (random <= weightSum) {
                    targetRarity = rarity;
                    break;
                }
            }

            const rarityUpgrades = availableUpgrades.filter(u => u.rarity === targetRarity);
            const fallbackUpgrades = availableUpgrades.length > 0 ? availableUpgrades : this.upgradePool;
            const pool = rarityUpgrades.length > 0 ? rarityUpgrades : fallbackUpgrades;

            if (pool.length > 0) {
                const selectedIndex = Math.floor(Math.random() * pool.length);
                const selected = pool[selectedIndex];
                this.levelUpOptions.push(selected);

                // Remove from available to avoid duplicates
                const originalIndex = availableUpgrades.indexOf(selected);
                if (originalIndex > -1) {
                    availableUpgrades.splice(originalIndex, 1);
                }
            }
        }
    }

    selectUpgrade(index) {
        if (index >= 0 && index < this.levelUpOptions.length) {
            const upgrade = this.levelUpOptions[index];
            upgrade.effect();
            this.showLevelUpMenu = false;
            this.gameRunning = true;
        }
    }

    renderMinimap() {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 20;
        const minimapY = this.canvas.height - minimapSize - 20;

        // Minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

        const scaleX = minimapSize / GameConfig.SPACE_WIDTH;
        const scaleY = minimapSize / GameConfig.SPACE_HEIGHT;

        // Draw planets
        this.planets.forEach(planet => {
            const x = minimapX + planet.x * scaleX;
            const y = minimapY + planet.y * scaleY;
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.max(2, planet.size * scaleX), 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw player
        const playerX = minimapX + this.player.x * scaleX;
        const playerY = minimapY + this.player.y * scaleY;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw enemies
        this.ctx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            const x = minimapX + enemy.x * scaleX;
            const y = minimapY + enemy.y * scaleY;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // XP bar now rendered in HTML HUD instead of canvas

    renderLevelUpMenu() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL UP!', this.canvas.width / 2, 80);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Level ${this.level} - Choose an Upgrade`, this.canvas.width / 2, 110);

        // Upgrade options
        const optionWidth = 300;
        const optionHeight = 120;
        const spacing = 50;
        const totalWidth = (optionWidth * 3) + (spacing * 2);
        const startX = (this.canvas.width - totalWidth) / 2;
        const optionY = 180;

        // Store option bounds for click detection
        this.levelUpOptionBounds = [];

        for (let i = 0; i < this.levelUpOptions.length; i++) {
            const option = this.levelUpOptions[i];
            const optionX = startX + (i * (optionWidth + spacing));

            // Store bounds for click detection
            this.levelUpOptionBounds[i] = {
                x: optionX,
                y: optionY,
                width: optionWidth,
                height: optionHeight
            };

            // Rarity colors
            const rarityColors = {
                common: '#888888',
                uncommon: '#00aa00',
                rare: '#aa00aa'
            };

            // Option background
            this.ctx.fillStyle = 'rgba(20, 30, 50, 0.9)';
            this.ctx.fillRect(optionX, optionY, optionWidth, optionHeight);

            // Rarity border
            this.ctx.strokeStyle = rarityColors[option.rarity] || '#888888';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(optionX, optionY, optionWidth, optionHeight);

            // Hover effect (simple glow)
            this.ctx.shadowColor = rarityColors[option.rarity] || '#888888';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeRect(optionX, optionY, optionWidth, optionHeight);
            this.ctx.shadowBlur = 0;

            // Option content
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(option.name, optionX + optionWidth / 2, optionY + 30);

            // Description (word wrap)
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#cccccc';
            const words = option.description.split(' ');
            let line = '';
            let lineY = optionY + 55;

            for (let j = 0; j < words.length; j++) {
                const testLine = line + words[j] + ' ';
                const metrics = this.ctx.measureText(testLine);

                if (metrics.width > optionWidth - 20 && j > 0) {
                    this.ctx.fillText(line, optionX + optionWidth / 2, lineY);
                    line = words[j] + ' ';
                    lineY += 18;
                } else {
                    line = testLine;
                }
            }
            this.ctx.fillText(line, optionX + optionWidth / 2, lineY);

            // Rarity label
            this.ctx.fillStyle = rarityColors[option.rarity] || '#888888';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(option.rarity.toUpperCase(), optionX + optionWidth / 2, optionY + optionHeight - 10);

            // Key number
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`${i + 1}`, optionX + 20, optionY + 25);
        }

        // Instructions
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press 1-3 to select, or click on an option', this.canvas.width / 2, this.canvas.height - 50);

        this.ctx.textAlign = 'left';
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    selectClass(classType) {
        this.selectedClass = classType;
        const config = this.classConfigs[classType];

        if (!config) {
            console.error(`No configuration found for class: ${classType}`);
            return;
        }

        // Apply class bonuses to player
        this.player.maxHealth = Math.floor(GameConfig.PLAYER.MAX_HEALTH * config.healthMultiplier);
        this.player.health = this.player.maxHealth;
        this.player.maxShield = Math.floor(GameConfig.PLAYER.MAX_SHIELD * config.shieldMultiplier);
        this.player.shield = this.player.maxShield;



        // Apply class bonuses to player stats
        this.playerStats.speedMultiplier = config.speedMultiplier;
        this.playerStats.damageMultiplier = config.damageMultiplier;
        this.playerStats.fireRateMultiplier = config.fireRateMultiplier;
        this.playerStats.dashMultiplier = config.dashMultiplier;

        // Apply starting weapon
        this.currentWeapon = config.startingWeapon;

        // Apply visual changes
        this.player.color = config.playerColor;

        // Apply special class abilities
        if (config.special === 'multishot_and_regen') {
            // Engineer: Start with multi-shot and fast shield regen
            this.playerStats.multiShotCount = 1;
            this.playerStats.shieldRegen = true;
            this.player.shieldRegenBonus = true;
        } else if (config.special === 'rage_damage') {
            // Berserker: Damage increases as health decreases
            this.playerStats.rageDamage = true;
        } else if (config.special === 'piercing_shots') {
            // Sniper: Start with piercing shots
            this.playerStats.piercingShots = true;
        }

        // Update health bar styling
        const healthBar = document.querySelector('.health-bar');
        const shieldBar = document.querySelector('.shield-bar');
        if (healthBar) {
            healthBar.className = `health-bar ${classType}`;
        }
        if (shieldBar) {
            shieldBar.className = `shield-bar ${classType}`;
        }

        // Hide class selection and start game
        document.getElementById('class-selection').classList.add('hidden');
        this.gameRunning = true;
        this.gameStarted = true;
        
        // Start the first wave after a short delay
        this.waveTransitionTimer = 120; // 2 seconds
    }

    restart() {
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        
        // Reset wave management
        this.waveInProgress = false;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        this.waveTransitionTimer = this.waveStartDelay;
        this.bloodlustTimer = 0;
        this.gameRunning = false;
        this.gameStarted = false;
        this.selectedClass = null;

        // Reset level system
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 200;
        this.showLevelUpMenu = false;
        this.levelUpOptions = [];

        // Reset player stats to base values
        this.playerStats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            speedMultiplier: 1,
            maxHealthBonus: 0,
            maxShieldBonus: 0,
            multiShotCount: 0,
            piercingShots: false,
            dashDamage: false,
            explosiveShots: false,
            magneticField: false,
            shieldRegen: false,
            vampiric: false,
            // New class-specific abilities
            dashMultiplier: 1,
            stealthDash: false,
            shadowStrike: false,
            damageReduction: 0,
            thornsDamage: false,
            fortressMode: false,
            homingShots: false,
            criticalChance: 0,
            rangedBonus: false,
            headshotChance: 0,
            projectileSpeedMultiplier: 1,
            rageMode: false,
            bloodlust: false,
            rampage: false,
            autoTurret: false,
            autoRepair: false
        };

        // Reset player to base stats
        this.player.reset(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);
        this.player.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        this.player.health = this.player.maxHealth;
        this.player.maxShield = GameConfig.PLAYER.MAX_SHIELD;
        this.player.shield = this.player.maxShield;
        this.player.color = GameConfig.PLAYER.COLOR; // Reset to default color

        // Reset weapon
        this.currentWeapon = 0;

        this.camera.centerOnPlayer(this.player);

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.explosions = [];

        this.spawnInitialEnemies();

        // Hide game over screen and show start screen
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('class-selection').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');

        // Reset health bar styling
        const healthBar = document.querySelector('.health-bar');
        const shieldBar = document.querySelector('.shield-bar');
        if (healthBar) {
            healthBar.className = 'health-bar';
        }
        if (shieldBar) {
            shieldBar.className = 'shield-bar';
        }
    }

    deployTurret() {
        // Deploy a turret at player's current position
        const turret = {
            x: this.player.x,
            y: this.player.y,
            health: 100,
            maxHealth: 100,
            fireRate: 30,
            fireTimer: 0,
            range: 200,
            damage: 15,
            projectiles: []
        };
        this.turrets.push(turret);
    }

    updateTurrets() {
        for (let i = this.turrets.length - 1; i >= 0; i--) {
            const turret = this.turrets[i];

            // Update turret projectiles
            for (let j = turret.projectiles.length - 1; j >= 0; j--) {
                const projectile = turret.projectiles[j];
                projectile.update();

                if (!projectile.isAlive() || !projectile.isInBounds(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT)) {
                    turret.projectiles.splice(j, 1);
                    continue;
                }

                // Check collision with enemies
                for (let k = this.enemies.length - 1; k >= 0; k--) {
                    const enemy = this.enemies[k];
                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.size + projectile.size) {
                        // Hit enemy
                        if (enemy.takeDamage(turret.damage)) {
                            this.enemies.splice(k, 1);
                            this.score += enemy.getPoints();
                        }
                        turret.projectiles.splice(j, 1);
                        break;
                    }
                }
            }

            // Turret AI - find closest enemy and shoot
            if (turret.fireTimer <= 0) {
                let closestEnemy = null;
                let closestDistance = turret.range;

                for (const enemy of this.enemies) {
                    const dx = enemy.x - turret.x;
                    const dy = enemy.y - turret.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }

                if (closestEnemy) {
                    // Shoot at closest enemy
                    const dx = closestEnemy.x - turret.x;
                    const dy = closestEnemy.y - turret.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const vx = (dx / distance) * 12;
                    const vy = (dy / distance) * 12;

                    turret.projectiles.push(new Projectile(turret.x, turret.y, vx, vy, 3, '#00ffff', 60));
                    turret.fireTimer = turret.fireRate;
                }
            } else {
                turret.fireTimer--;
            }

            // Check if turret is destroyed
            if (turret.health <= 0) {
                this.turrets.splice(i, 1);
            }
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game...');
    new Game();
});