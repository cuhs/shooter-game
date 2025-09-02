// Game Configuration
const GameConfig = {
    // Space dimensions
    SPACE_WIDTH: 4000,
    SPACE_HEIGHT: 3000,

    // Player settings
    PLAYER: {
        SIZE: 12,
        SPEED: 8,
        MAX_HEALTH: 100,
        MAX_SHIELD: 50,
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
        { name: 'PHOTON', damage: 15, speed: 12, size: 3, color: '#00ffff', fireRate: 8, ammo: Infinity },
        { name: 'SCATTER', damage: 10, speed: 10, size: 2, color: '#ff6600', fireRate: 12, ammo: Infinity },
        { name: 'BEAM', damage: 25, speed: 18, size: 2, color: '#ff0000', fireRate: 4, ammo: 50 },
        { name: 'PLASMA', damage: 30, speed: 8, size: 5, color: '#ff00ff', fireRate: 6, ammo: 30 }
    ],

    // Enemy types and stats
    ENEMY_TYPES: {
        scout: { size: 6, speed: 3, health: 25, color: '#ff6666', points: 10 },
        fighter: { size: 8, speed: 2.5, health: 40, color: '#ff4444', points: 20 },
        bomber: { size: 12, speed: 1.5, health: 60, color: '#ff2222', points: 30 },
        cruiser: { size: 15, speed: 2, health: 80, color: '#ff0000', points: 50 },
        interceptor: { size: 7, speed: 4, health: 30, color: '#ff8888', points: 25 },
        miner: { size: 10, speed: 1, health: 50, color: '#ffaa44', points: 15 },
        drone: { size: 5, speed: 3.5, health: 20, color: '#ff9999', points: 8 }
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
    }

    update() {
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

        // Apply movement
        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Keep player within bounds
        this.x = Math.max(this.size, Math.min(GameConfig.SPACE_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(GameConfig.SPACE_HEIGHT - this.size, this.y));

        // Handle dash
        if (keys[' '] && this.dashCooldown === 0) {
            this.dash(dx, dy);
        }

        // Update cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.shieldRegenDelay > 0) this.shieldRegenDelay--;
        if (this.damageFlash > 0) this.damageFlash--;

        // Shield regeneration (only after delay)
        if (this.shield < this.maxShield && this.shieldRegenDelay <= 0) {
            this.shield = Math.min(this.maxShield, this.shield + 0.15);
        }
    }

    dash(dx, dy) {
        const dashDistance = 100;
        this.x += dx * dashDistance;
        this.y += dy * dashDistance;

        // Keep within bounds after dash
        this.x = Math.max(this.size, Math.min(GameConfig.SPACE_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(GameConfig.SPACE_HEIGHT - this.size, this.y));

        this.dashCooldown = GameConfig.PLAYER.DASH_COOLDOWN;
        this.invulnerable = 30;
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return false;

        console.log(`Player taking ${damage} damage. Health: ${this.health}, Shield: ${this.shield}`);
        
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
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        const config = GameConfig.ENEMY_TYPES[type];
        this.size = config.size;
        this.speed = config.speed;
        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.color = config.color;
        this.points = config.points;
        this.damage = 20;

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
        this.gameRunning = true;

        // Initialize systems
        this.camera = new Camera(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT, this.canvas);
        this.player = new Player(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);

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

        const enemy = new Enemy(x, y, type);
        this.enemies.push(enemy);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
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

        this.canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restart();
        });
    }

    shoot() {
        if (this.fireTimer > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        this.fireTimer = weapon.fireRate;

        const angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

        const projectile = new Projectile(
            this.player.x,
            this.player.y,
            Math.cos(angle) * weapon.speed,
            Math.sin(angle) * weapon.speed,
            weapon,
            weapon.damage
        );

        this.projectiles.push(projectile);
    }

    update() {
        if (!this.gameRunning) return;

        // Update player
        this.player.update(this.keys, this.canvas);

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
                    enemy.takeDamage(projectile.damage);
                    this.projectiles.splice(j, 1);

                    if (enemy.isDead()) {
                        this.score += enemy.getPoints() * this.combo;
                        this.combo = Math.min(10, this.combo + 1);
                        this.comboTimer = 180;
                        this.enemies.splice(i, 1);
                    }
                    break;
                }
            }

            // Check collision with player
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size + this.player.size) {
                if (this.player.takeDamage(enemy.damage)) {
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
                i--; // Adjust index since we removed an element
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();

            if (!projectile.isAlive() || !projectile.isInBounds(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT)) {
                this.projectiles.splice(i, 1);
            }
        }

        // Spawn random enemies
        if (Math.random() < GameConfig.SPAWN_RATES.ENEMY_CHANCE && this.enemies.length < 15) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 800;
            const x = this.player.x + Math.cos(angle) * distance;
            const y = this.player.y + Math.sin(angle) * distance;

            if (x > 0 && x < GameConfig.SPACE_WIDTH && y > 0 && y < GameConfig.SPACE_HEIGHT) {
                this.spawnEnemy(x, y);
            }
        }

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
            
            // Calculate angle to mouse for ship rotation
            const angleToMouse = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
            this.ctx.rotate(angleToMouse);

            // Main ship body (sleek fighter design)
            this.ctx.fillStyle = this.player.color;
            this.ctx.strokeStyle = this.player.color;
            this.ctx.lineWidth = 1.5;
            
            // Main hull
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
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (waveElement) waveElement.textContent = this.wave;
        if (comboElement) comboElement.textContent = `x${this.combo}`;

        // Render UI (fallback text on canvas)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Health: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`, this.canvas.width - 200, this.canvas.height - 60);
        this.ctx.fillText(`Shield: ${Math.ceil(this.player.shield)}/${this.player.maxShield}`, this.canvas.width - 200, this.canvas.height - 40);

        // Render minimap
        this.renderMinimap();
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

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    restart() {
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameRunning = true;

        this.player.reset(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);
        this.camera.centerOnPlayer(this.player);

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.explosions = [];

        this.spawnInitialEnemies();

        document.getElementById('game-over').classList.add('hidden');
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game...');
    new Game();
});