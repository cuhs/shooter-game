class GalacticDefender {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 80;

        // Space/Camera system
        this.space = {
            width: 4000,
            height: 3000
        };

        this.camera = {
            x: 0,
            y: 0,
            followSpeed: 0.3
        };



        // Spaceship state
        this.player = {
            x: this.space.width / 2,
            y: this.space.height / 2,
            size: 12,
            speed: 8,
            maxHealth: 100,
            health: 100,
            maxShield: 50,
            shield: 50,
            color: '#00ffff',
            dashCooldown: 0,
            invulnerable: 0,
            angle: 0,
            thrust: 0
        };

        // Game state
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameRunning = true;
        this.waveInProgress = false;
        this.enemiesRemaining = 0;

        // Special abilities
        this.abilities = {
            timeFreeze: { cooldown: 0, maxCooldown: 600, duration: 0, maxDuration: 180 },
            shield: { cooldown: 0, maxCooldown: 480, duration: 0, maxDuration: 300 },
            nuke: { cooldown: 0, maxCooldown: 900, charges: 3 },
            magnetism: { cooldown: 0, maxCooldown: 360, duration: 0, maxDuration: 240 },
            multishot: { cooldown: 0, maxCooldown: 420, duration: 0, maxDuration: 360 }
        };

        // Environmental effects
        this.screenShake = 0;
        this.slowMotion = 1;
        this.magneticField = false;

        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

        // Space objects
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.powerups = [];
        this.explosions = [];
        this.asteroids = [];
        this.planets = [];
        this.stars = [];

        // Space weapon system
        this.weapons = [
            { name: 'PHOTON', damage: 15, speed: 12, size: 3, color: '#00ffff', fireRate: 8, ammo: Infinity },
            { name: 'SCATTER', damage: 10, speed: 10, size: 2, color: '#ff6600', fireRate: 12, ammo: Infinity },
            { name: 'BEAM', damage: 25, speed: 18, size: 2, color: '#ff0000', fireRate: 4, ammo: 50 },
            { name: 'PLASMA', damage: 30, speed: 8, size: 5, color: '#ff00ff', fireRate: 6, ammo: 30 }
        ];
        this.currentWeapon = 0;
        this.fireTimer = 0;

        // Upgrades
        this.upgrades = {
            damage: 1,
            fireRate: 1,
            speed: 1,
            health: 1,
            shield: 1
        };

        this.setupEventListeners();
        this.generateSpaceObjects();
        this.spawnSpaceEnemies();

        // Initialize camera position to center on player
        this.updateCameraImmediate();

        // Initialize mouse world coordinates
        this.mouse.worldX = this.mouse.x + this.camera.x;
        this.mouse.worldY = this.mouse.y + this.camera.y;

        this.gameLoop();
    }



    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Weapon switching
            if (e.key >= '1' && e.key <= '4') {
                this.currentWeapon = parseInt(e.key) - 1;
            }

            if (e.key === ' ') {
                e.preventDefault();
                this.dash();
            }

            if (e.key.toLowerCase() === 'r') {
                this.reload();
            }

            // Special abilities
            if (e.key.toLowerCase() === 'q') this.activateTimeFreeze();
            if (e.key.toLowerCase() === 'e') this.activateShield();
            if (e.key.toLowerCase() === 'f') this.activateNuke();
            if (e.key.toLowerCase() === 'c') this.activateMagnetism();
            if (e.key.toLowerCase() === 'x') this.activateMultishot();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            // Convert to world coordinates for shooting (with safety checks)
            if (this.camera && this.camera.x !== undefined && this.camera.y !== undefined) {
                this.mouse.worldX = this.mouse.x + this.camera.x;
                this.mouse.worldY = this.mouse.y + this.camera.y;
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }

    generateSpaceObjects() {
        // Generate background stars
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.space.width,
                y: Math.random() * this.space.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        // Generate planets
        const planetData = [
            { name: 'Earth', x: 1900, y: 1500, size: 40, color: '#4488ff' },
            { name: 'Mars', x: 1600, y: 400, size: 25, color: '#ff4444' },
            { name: 'Jupiter', x: 2800, y: 600, size: 60, color: '#ffaa44' },
            { name: 'Saturn', x: 3200, y: 1800, size: 50, color: '#ffdd88' },
            { name: 'Alien World', x: 2800, y: 1800, size: 35, color: '#aa44ff' }
        ];

        planetData.forEach(planet => {
            this.planets.push({
                ...planet,
                orbit: Math.random() * Math.PI * 2,
                orbitSpeed: 0.001 + Math.random() * 0.002
            });
        });

        // Generate asteroids
        for (let i = 0; i < 80; i++) {
            this.asteroids.push({
                x: Math.random() * this.space.width,
                y: Math.random() * this.space.height,
                size: Math.random() * 30 + 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                color: '#666666',
                health: 50 + Math.random() * 100
            });
        }
    }

    spawnSpaceEnemies() {
        // Spawn initial enemies across space
        for (let i = 0; i < 60; i++) {
            this.spawnSpaceEnemy();
        }

        // Spawn powerups across sectors
        for (let i = 0; i < 20; i++) {
            this.spawnSpacePowerup();
        }
    }

    spawnSpaceEnemy() {
        const enemyTypes = ['scout', 'fighter', 'bomber', 'cruiser', 'interceptor', 'miner', 'drone'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        const x = Math.random() * this.space.width;
        const y = Math.random() * this.space.height;

        const enemy = {
            x: x,
            y: y,
            type: enemyType,
            ...this.getEnemyStats(enemyType),
            angle: Math.random() * Math.PI * 2,
            shootTimer: 0,
            splitTimer: 0,
            patrolCenter: { x: x, y: y },
            patrolRadius: 150 + Math.random() * 200
        };

        this.enemies.push(enemy);
    }

    spawnSpacePowerup() {
        const x = Math.random() * this.space.width;
        const y = Math.random() * this.space.height;

        const types = ['health', 'shield', 'damage', 'speed', 'weapon'];
        const type = types[Math.floor(Math.random() * types.length)];

        const powerup = {
            x: x,
            y: y,
            type: type,
            size: 30,
            color: this.getPowerupColor(type),
            pulse: 0,
            lifetime: 1800 // 30 seconds
        };

        this.powerups.push(powerup);
    }

    spawnRandomEnemy() {
        // Simple space-wide enemy spawning
        if (Math.random() > 0.02) return; // 2% chance per frame

        const enemyTypes = ['scout', 'fighter', 'bomber', 'cruiser', 'interceptor', 'miner', 'drone'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        // Spawn near player but off-screen
        const angle = Math.random() * Math.PI * 2;
        const distance = 400 + Math.random() * 200;
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;

        // Make sure it's within space bounds - same as player bounds
        const enemySize = 20; // Use average enemy size for spawning bounds
        const clampedX = Math.max(enemySize, Math.min(this.space.width - enemySize, x));
        const clampedY = Math.max(enemySize, Math.min(this.space.height - enemySize, y));

        const enemy = {
            x: clampedX,
            y: clampedY,
            type: enemyType,
            ...this.getEnemyStats(enemyType),
            angle: Math.random() * Math.PI * 2,
            shootTimer: 0,
            splitTimer: 0,
            patrolCenter: { x: clampedX, y: clampedY },
            patrolRadius: 100 + Math.random() * 100
        };

        this.enemies.push(enemy);
    }

    getEnemyStats(type) {
        const baseHealth = 25 + this.wave * 8;
        switch (type) {
            case 'scout':
                return {
                    size: 6,
                    speed: 2 + this.wave * 0.1,
                    health: baseHealth * 0.6,
                    maxHealth: baseHealth * 0.6,
                    color: '#ff4444',
                    points: 15,
                    shape: 'triangle'
                };
            case 'fighter':
                return {
                    size: 8,
                    speed: 1.8 + this.wave * 0.08,
                    health: baseHealth,
                    maxHealth: baseHealth,
                    color: '#ffaa00',
                    points: 20,
                    shape: 'diamond'
                };
            case 'bomber':
                return {
                    size: 10,
                    speed: 1.2 + this.wave * 0.05,
                    health: baseHealth * 1.5,
                    maxHealth: baseHealth * 1.5,
                    color: '#ff6600',
                    points: 30,
                    shape: 'square'
                };
            case 'cruiser':
                return {
                    size: 14,
                    speed: 1 + this.wave * 0.04,
                    health: baseHealth * 2.5,
                    maxHealth: baseHealth * 2.5,
                    color: '#ff0000',
                    points: 50,
                    shape: 'hexagon'
                };
            case 'mothership':
                return {
                    size: 20,
                    speed: 0.8 + this.wave * 0.03,
                    health: baseHealth * 4,
                    maxHealth: baseHealth * 4,
                    color: '#aa0000',
                    points: 100,
                    shape: 'circle'
                };
            case 'interceptor':
                return {
                    size: 7,
                    speed: 2.5 + this.wave * 0.12,
                    health: baseHealth * 0.8,
                    maxHealth: baseHealth * 0.8,
                    color: '#ffff00',
                    points: 25,
                    shape: 'triangle'
                };
            case 'miner':
                return {
                    size: 12,
                    speed: 0.8 + this.wave * 0.03,
                    health: baseHealth * 1.8,
                    maxHealth: baseHealth * 1.8,
                    color: '#888888',
                    points: 35,
                    shape: 'square'
                };
            case 'drone':
                return {
                    size: 5,
                    speed: 1.5 + this.wave * 0.08,
                    health: baseHealth * 0.4,
                    maxHealth: baseHealth * 0.4,
                    color: '#666666',
                    points: 10,
                    shape: 'circle'
                };
            case 'phantom':
                return {
                    size: 9,
                    speed: 2.2 + this.wave * 0.1,
                    health: baseHealth * 1.2,
                    maxHealth: baseHealth * 1.2,
                    color: '#8800ff',
                    points: 40,
                    shape: 'diamond'
                };
            case 'wraith':
                return {
                    size: 11,
                    speed: 1.8 + this.wave * 0.07,
                    health: baseHealth * 1.6,
                    maxHealth: baseHealth * 1.6,
                    color: '#4400ff',
                    points: 45,
                    shape: 'hexagon'
                };
            case 'destroyer':
                return {
                    size: 16,
                    speed: 1.1 + this.wave * 0.04,
                    health: baseHealth * 3,
                    maxHealth: baseHealth * 3,
                    color: '#ff0044',
                    points: 75,
                    shape: 'hexagon'
                };
            case 'battleship':
                return {
                    size: 22,
                    speed: 0.9 + this.wave * 0.02,
                    health: baseHealth * 5,
                    maxHealth: baseHealth * 5,
                    color: '#880000',
                    points: 150,
                    shape: 'circle'
                };
        }
    }

    spawnPowerup() {
        const types = ['health', 'shield', 'damage', 'speed', 'weapon'];
        const type = types[Math.floor(Math.random() * types.length)];

        const powerup = {
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: Math.random() * (this.canvas.height - 100) + 50,
            type: type,
            size: 30,
            color: this.getPowerupColor(type),
            pulse: 0,
            lifetime: 600 // 10 seconds at 60fps
        };

        this.powerups.push(powerup);
    }

    getPowerupColor(type) {
        switch (type) {
            case 'health': return '#00ff00';
            case 'shield': return '#00ffff';
            case 'damage': return '#ff0000';
            case 'speed': return '#ffff00';
            case 'weapon': return '#ff00ff';
            default: return '#ffffff';
        }
    }

    dash() {
        if (this.player.dashCooldown > 0) return;

        this.player.dashCooldown = 120; // 2 seconds at 60fps

        // Make sure we have valid world coordinates
        if (this.mouse.worldX === undefined || this.mouse.worldY === undefined) {
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
        }

        // Dash towards mouse
        const dx = this.mouse.worldX - this.player.x;
        const dy = this.mouse.worldY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const dashDistance = 100;
            this.player.x += (dx / dist) * dashDistance;
            this.player.y += (dy / dist) * dashDistance;

            // Keep in bounds
            this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
            this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));

            // Brief invulnerability
            this.player.invulnerable = 30;

            // Dash effect
            for (let i = 0; i < 15; i++) {
                this.createParticle(this.player.x, this.player.y, '#00ffff', 2);
            }
        }
    }

    shoot() {
        if (this.fireTimer > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo <= 0) return;

        this.fireTimer = Math.max(1, weapon.fireRate - this.upgrades.fireRate);

        if (weapon.ammo !== Infinity) {
            weapon.ammo--;
        }

        // Make sure we have valid world coordinates
        if (this.mouse.worldX === undefined || this.mouse.worldY === undefined) {
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
        }

        const angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

        if (weapon.name === 'SCATTER') {
            // Fire 3 projectiles in a scatter pattern
            for (let i = -1; i <= 1; i++) {
                const spreadAngle = angle + (i * 0.3);
                this.createProjectile(spreadAngle, weapon);
            }
        } else if (this.abilities.multishot.duration > 0) {
            // Multishot ability - fire 8 projectiles in all directions
            for (let i = 0; i < 8; i++) {
                const multishotAngle = (Math.PI * 2 / 8) * i;
                this.createProjectile(multishotAngle, weapon);
            }
        } else {
            this.createProjectile(angle, weapon);
        }
    }

    createProjectile(angle, weapon) {
        const projectile = {
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            size: weapon.size,
            color: weapon.color,
            damage: weapon.damage * this.upgrades.damage,
            life: 120,
            type: weapon.name
        };
        this.projectiles.push(projectile);
    }

    reload() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.name === 'LASER') weapon.ammo = 50;
        if (weapon.name === 'PLASMA') weapon.ammo = 30;
    }

    // Special Abilities
    activateTimeFreeze() {
        if (this.abilities.timeFreeze.cooldown > 0) return;

        this.abilities.timeFreeze.cooldown = this.abilities.timeFreeze.maxCooldown;
        this.abilities.timeFreeze.duration = this.abilities.timeFreeze.maxDuration;

        // Visual effect
        this.screenShake = 15;
        for (let i = 0; i < 50; i++) {
            this.createParticle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                '#00ffff', 3
            );
        }
    }

    activateShield() {
        if (this.abilities.shield.cooldown > 0) return;

        this.abilities.shield.cooldown = this.abilities.shield.maxCooldown;
        this.abilities.shield.duration = this.abilities.shield.maxDuration;

        // Visual effect
        for (let i = 0; i < 30; i++) {
            this.createParticle(this.player.x, this.player.y, '#00ffff', 2);
        }
    }

    activateNuke() {
        if (this.abilities.nuke.cooldown > 0 || this.abilities.nuke.charges <= 0) return;

        this.abilities.nuke.cooldown = this.abilities.nuke.maxCooldown;
        this.abilities.nuke.charges--;

        // Damage all enemies on screen
        this.enemies.forEach((enemy, index) => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 300) { // Nuke radius
                enemy.health -= 999; // Instant kill
                this.score += enemy.points * this.combo;
                this.createExplosion(enemy.x, enemy.y, '#ff00ff');
                this.enemies.splice(index, 1);
                this.enemiesRemaining--;
            }
        });

        // Massive screen shake and particles
        this.screenShake = 30;
        for (let i = 0; i < 100; i++) {
            this.createParticle(
                this.player.x + (Math.random() - 0.5) * 600,
                this.player.y + (Math.random() - 0.5) * 600,
                '#ff00ff', 4
            );
        }
    }

    activateMagnetism() {
        if (this.abilities.magnetism.cooldown > 0) return;

        this.abilities.magnetism.cooldown = this.abilities.magnetism.maxCooldown;
        this.abilities.magnetism.duration = this.abilities.magnetism.maxDuration;
        this.magneticField = true;

        // Visual effect
        for (let i = 0; i < 40; i++) {
            this.createParticle(this.player.x, this.player.y, '#ffff00', 2);
        }
    }

    activateMultishot() {
        if (this.abilities.multishot.cooldown > 0) return;

        this.abilities.multishot.cooldown = this.abilities.multishot.maxCooldown;
        this.abilities.multishot.duration = this.abilities.multishot.maxDuration;

        // Visual effect
        for (let i = 0; i < 25; i++) {
            this.createParticle(this.player.x, this.player.y, '#ff6600', 2);
        }
    }

    updateAbilities() {
        // Update cooldowns
        Object.keys(this.abilities).forEach(key => {
            if (this.abilities[key].cooldown > 0) {
                this.abilities[key].cooldown--;
            }
            if (this.abilities[key].duration > 0) {
                this.abilities[key].duration--;

                // End effects when duration expires
                if (this.abilities[key].duration === 0) {
                    if (key === 'magnetism') this.magneticField = false;
                }
            }
        });
    }

    update() {
        if (!this.gameRunning) return;

        // Update timers
        if (this.player.dashCooldown > 0) this.player.dashCooldown--;
        if (this.player.invulnerable > 0) this.player.invulnerable--;
        if (this.fireTimer > 0) this.fireTimer--;
        if (this.comboTimer > 0) this.comboTimer--;
        else if (this.combo > 1) {
            this.combo = Math.max(1, this.combo - 1);
            this.comboTimer = 180;
        }

        // Update abilities
        this.updateAbilities();

        // Update screen effects
        if (this.screenShake > 0) {
            this.screenShake--;
            this.canvas.style.transform = `translate(${(Math.random() - 0.5) * this.screenShake}px, ${(Math.random() - 0.5) * this.screenShake}px)`;
        } else {
            this.canvas.style.transform = 'translate(0, 0)';
        }

        // Player movement
        let moveX = 0, moveY = 0;
        if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
        if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }

        this.player.x += moveX * this.player.speed * this.upgrades.speed;
        this.player.y += moveY * this.player.speed * this.upgrades.speed;

        // Keep player in space bounds - account for UI bar at top
        const topOffset = 80; // Account for HUD height
        this.player.x = Math.max(this.player.size, Math.min(this.space.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size + topOffset, Math.min(this.space.height - this.player.size, this.player.y));

        // Update camera to follow player
        this.updateCamera();

        // Update mouse world coordinates with safety checks
        if (this.mouse.x !== undefined && this.mouse.y !== undefined &&
            this.camera.x !== undefined && this.camera.y !== undefined) {
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
        }

        // Shooting
        if (this.mouse.down) {
            this.shoot();
        }

        // Shield regeneration
        if (this.player.shield < this.player.maxShield) {
            this.player.shield = Math.min(this.player.maxShield, this.player.shield + 0.2);
        }

        // Update enemies (affected by time freeze)
        if (this.abilities.timeFreeze.duration <= 0) {
            this.updateEnemies();
        } else {
            // Enemies move very slowly during time freeze
            if (Math.random() < 0.1) this.updateEnemies();
        }

        // Update projectiles (always move at normal speed)
        this.updateProjectiles();

        // Update particles
        this.updateParticles();

        // Update powerups
        this.updatePowerups();

        // Update explosions
        this.updateExplosions();

        // Continuous enemy spawning
        this.spawnRandomEnemy();

        // Remove enemies that are too far from player
        this.cullDistantEnemies();

        // Occasionally spawn powerups
        if (Math.random() < 0.001) {
            this.spawnSpacePowerup();
        }

        // Check for upgrade unlocks
        this.checkUpgradeUnlock();

        this.updateUI();
    }

    updateCamera() {
        // Smooth camera following
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;

        this.camera.x += (targetX - this.camera.x) * this.camera.followSpeed;
        this.camera.y += (targetY - this.camera.y) * this.camera.followSpeed;

        // Keep camera within world bounds
        this.camera.x = Math.max(0, Math.min(this.space.width - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.space.height - this.canvas.height, this.camera.y));
    }

    updateCameraImmediate() {
        // Immediately center camera on player (for initialization)
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // Keep camera within world bounds
        this.camera.x = Math.max(0, Math.min(this.space.width - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.space.height - this.canvas.height, this.camera.y));
    }

    cullDistantEnemies() {
        // Remove enemies that are too far from player
        this.enemies = this.enemies.filter(enemy => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < 800; // Keep enemies within 800 pixels
        });

        // Remove powerups that are too far
        this.powerups = this.powerups.filter(powerup => {
            const dx = powerup.x - this.player.x;
            const dy = powerup.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < 600;
        });
    }

    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                enemy.x += (dx / dist) * enemy.speed;
                enemy.y += (dy / dist) * enemy.speed;
            }

            // Check collision with player
            if (this.player.invulnerable <= 0 && dist < this.player.size + enemy.size) {
                this.damagePlayer(enemy.maxHealth * 0.3);

                // Remove enemy on contact
                this.enemies.splice(index, 1);
                this.enemiesRemaining--;

                // Explosion
                this.createExplosion(enemy.x, enemy.y, enemy.color);
            }
        });
    }

    updateProjectiles() {
        this.projectiles = this.projectiles.filter(proj => {
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life--;

            // Check collision with enemies
            this.enemies.forEach((enemy, enemyIndex) => {
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < proj.size + enemy.size) {
                    enemy.health -= proj.damage;
                    proj.life = 0;

                    // Create hit effect
                    for (let i = 0; i < 5; i++) {
                        this.createParticle(enemy.x, enemy.y, proj.color, 1);
                    }

                    if (enemy.health <= 0) {
                        // Award points with combo
                        const points = enemy.points * this.combo;
                        this.score += points;

                        // Increase combo
                        this.combo = Math.min(10, this.combo + 1);
                        this.comboTimer = 180;

                        // Create explosion
                        this.createExplosion(enemy.x, enemy.y, enemy.color);

                        // Handle splitter enemy
                        if (enemy.type === 'splitter' && enemy.size > 4) {
                            this.splitEnemy(enemy);
                        }

                        this.enemies.splice(enemyIndex, 1);
                        this.enemiesRemaining--;

                        // Chance to drop powerup
                        if (Math.random() < 0.1) {
                            setTimeout(() => this.spawnPowerup(), 100);
                        }
                    }
                }
            });

            return proj.life > 0 && proj.x > -50 && proj.x < this.space.width + 50 &&
                proj.y > -50 && proj.y < this.space.height + 50;
        });
    }

    splitEnemy(enemy) {
        for (let i = 0; i < 2; i++) {
            const newEnemy = {
                x: enemy.x + (Math.random() - 0.5) * 20,
                y: enemy.y + (Math.random() - 0.5) * 20,
                type: 'basic',
                size: enemy.size * 0.7,
                speed: enemy.speed * 1.5,
                health: enemy.maxHealth * 0.4,
                maxHealth: enemy.maxHealth * 0.4,
                color: enemy.color,
                points: enemy.points * 0.5,
                angle: 0,
                shootTimer: 0
            };
            this.enemies.push(newEnemy);
            this.enemiesRemaining++;
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            particle.size *= 0.99;
            return particle.life > 0 && particle.size > 0.1;
        });
    }

    updatePowerups() {
        this.powerups = this.powerups.filter(powerup => {
            powerup.pulse += 0.1;
            powerup.lifetime--;

            // Magnetism effect - pull powerups towards player
            if (this.magneticField) {
                const dx = this.player.x - powerup.x;
                const dy = this.player.y - powerup.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 200 && dist > 0) {
                    const pullStrength = 3;
                    powerup.x += (dx / dist) * pullStrength;
                    powerup.y += (dy / dist) * pullStrength;
                }
            }

            // Check collection
            const dx = this.player.x - powerup.x;
            const dy = this.player.y - powerup.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.size + powerup.size) {
                this.collectPowerup(powerup);
                return false;
            }

            return powerup.lifetime > 0;
        });
    }

    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            explosion.size += explosion.growth;
            explosion.life--;
            explosion.alpha *= 0.95;
            return explosion.life > 0;
        });
    }

    collectPowerup(powerup) {
        switch (powerup.type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                break;
            case 'shield':
                this.player.shield = this.player.maxShield;
                break;
            case 'damage':
                this.upgrades.damage += 0.2;
                break;
            case 'speed':
                this.upgrades.speed += 0.1;
                break;
            case 'weapon':
                // Upgrade current weapon
                const weapon = this.weapons[this.currentWeapon];
                if (weapon.ammo !== Infinity) {
                    weapon.ammo = Math.min(weapon.ammo + 20, weapon.name === 'LASER' ? 50 : 30);
                }
                break;
        }

        // Visual effect
        for (let i = 0; i < 10; i++) {
            this.createParticle(powerup.x, powerup.y, powerup.color, 2);
        }
    }

    damagePlayer(amount) {
        // Shield ability makes player invulnerable
        if (this.abilities.shield.duration > 0) {
            // Create deflection particles
            for (let i = 0; i < 10; i++) {
                this.createParticle(this.player.x, this.player.y, '#00ffff', 2);
            }
            return;
        }

        if (this.player.shield > 0) {
            const shieldDamage = Math.min(this.player.shield, amount);
            this.player.shield -= shieldDamage;
            amount -= shieldDamage;
        }

        if (amount > 0) {
            this.player.health -= amount;
        }

        // Screen shake and flash
        this.screenShake = 10;
        document.getElementById('game-container').classList.add('damage-flash');
        setTimeout(() => {
            document.getElementById('game-container').classList.remove('damage-flash');
        }, 200);

        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    // Upgrade menu triggered by score milestones
    checkUpgradeUnlock() {
        if (!this.unlockedUpgrades) this.unlockedUpgrades = [];

        const upgradeThresholds = [500, 1500, 3000, 5000, 8000, 12000, 17000, 25000];
        const currentThreshold = upgradeThresholds.find(threshold =>
            this.score >= threshold && !this.unlockedUpgrades.includes(threshold)
        );

        if (currentThreshold) {
            this.unlockedUpgrades.push(currentThreshold);
            this.showUpgradeMenu();
        }
    }

    showUpgradeMenu() {
        const menu = document.getElementById('upgrade-menu');
        const options = document.getElementById('upgrade-options');
        options.innerHTML = '';

        const availableUpgrades = [
            { name: 'Damage Boost', desc: '+20% weapon damage', effect: () => this.upgrades.damage += 0.2 },
            { name: 'Fire Rate', desc: '+1 fire rate', effect: () => this.upgrades.fireRate += 1 },
            { name: 'Speed Boost', desc: '+10% movement speed', effect: () => this.upgrades.speed += 0.1 },
            { name: 'Max Health', desc: '+25 max health', effect: () => { this.player.maxHealth += 25; this.player.health += 25; } },
            { name: 'Shield Boost', desc: '+15 max shield', effect: () => { this.player.maxShield += 15; this.player.shield += 15; } },
            {
                name: 'Ability Cooldown', desc: '-20% ability cooldowns', effect: () => {
                    Object.keys(this.abilities).forEach(key => {
                        this.abilities[key].maxCooldown = Math.floor(this.abilities[key].maxCooldown * 0.8);
                    });
                }
            },
            { name: 'Extra Nuke', desc: '+1 nuke charge', effect: () => this.abilities.nuke.charges++ },
            {
                name: 'Longer Abilities', desc: '+50% ability duration', effect: () => {
                    Object.keys(this.abilities).forEach(key => {
                        if (this.abilities[key].maxDuration) {
                            this.abilities[key].maxDuration = Math.floor(this.abilities[key].maxDuration * 1.5);
                        }
                    });
                }
            },
            { name: 'Dash Master', desc: 'Dash cooldown -50%', effect: () => this.player.dashCooldown = Math.floor(this.player.dashCooldown * 0.5) }
        ];

        // Show 3 random upgrades
        const shuffled = availableUpgrades.sort(() => 0.5 - Math.random());
        for (let i = 0; i < 3; i++) {
            const upgrade = shuffled[i];
            const option = document.createElement('div');
            option.className = 'upgrade-option';
            option.innerHTML = `
                <div class="upgrade-title">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.desc}</div>
            `;
            option.addEventListener('click', () => {
                upgrade.effect();
                menu.classList.add('hidden');
                setTimeout(() => { }, 1000);
            });
            options.appendChild(option);
        }

        menu.classList.remove('hidden');
    }

    createParticle(x, y, color, size = 1) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 3 * size + 1,
            color: color,
            life: 30 + Math.random() * 20,
            maxLife: 50
        };
        this.particles.push(particle);
    }

    createExplosion(x, y, color) {
        const explosion = {
            x: x,
            y: y,
            size: 5,
            growth: 3,
            color: color,
            alpha: 1,
            life: 20
        };
        this.explosions.push(explosion);

        // Create particles
        for (let i = 0; i < 15; i++) {
            this.createParticle(x, y, color, 2);
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw space background
        this.drawSpaceBackground();

        // Draw space objects
        this.drawSpaceObjects();

        // Draw explosions
        this.explosions.forEach(explosion => {
            this.ctx.globalAlpha = explosion.alpha;
            this.ctx.fillStyle = explosion.color;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });

        // Draw powerups
        this.powerups.forEach(powerup => {
            const pulseSize = powerup.size + Math.sin(powerup.pulse) * 3;
            this.ctx.fillStyle = `${powerup.color}66`;
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = powerup.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Draw enemies
        this.enemies.forEach(enemy => {
            // Health bar
            if (enemy.health < enemy.maxHealth) {
                const barWidth = enemy.size * 2;
                const barHeight = 3;
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth, barHeight);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8,
                    barWidth * (enemy.health / enemy.maxHealth), barHeight);
            }

            // Enemy body
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Enemy glow
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 5;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // Draw projectiles
        this.projectiles.forEach(proj => {
            this.ctx.fillStyle = proj.color;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Trail effect
            this.ctx.strokeStyle = `${proj.color}88`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(proj.x, proj.y);
            this.ctx.lineTo(proj.x - proj.vx * 3, proj.y - proj.vy * 3);
            this.ctx.stroke();
        });

        // Draw particles
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw ability effects
        this.drawAbilityEffects();

        // Draw player
        if (this.player.invulnerable > 0 && Math.floor(this.player.invulnerable / 5) % 2) {
            // Flashing when invulnerable
            this.ctx.globalAlpha = 0.5;
        }

        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Player glow
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;

        // Restore context (end camera transform)
        this.ctx.restore();

        // Draw UI elements (not affected by camera)
        this.drawMinimap();


        // Draw crosshair (screen space)
        this.ctx.strokeStyle = '#ffffff66';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x - 10, this.mouse.y);
        this.ctx.lineTo(this.mouse.x + 10, this.mouse.y);
        this.ctx.moveTo(this.mouse.x, this.mouse.y - 10);
        this.ctx.lineTo(this.mouse.x, this.mouse.y + 10);
        this.ctx.stroke();
    }

    drawSpaceBackground() {
        // Draw stars
        this.stars.forEach(star => {
            star.twinkle += 0.05;
            const brightness = star.brightness + Math.sin(star.twinkle) * 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, brightness)})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawSpaceObjects() {
        // Draw planets
        this.planets.forEach(planet => {
            planet.orbit += planet.orbitSpeed;

            // Planet body
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Planet glow
            this.ctx.shadowColor = planet.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Planet name
            this.ctx.fillStyle = '#ffffff88';
            this.ctx.font = '12px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(planet.name, planet.x, planet.y + planet.size + 15);
        });

        // Draw asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.rotation += asteroid.rotationSpeed;

            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);

            // Draw irregular asteroid shape
            this.ctx.fillStyle = asteroid.color;
            this.ctx.beginPath();
            const sides = 8;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                const radius = asteroid.size * (0.8 + Math.random() * 0.4);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#999999';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawMinimap() {
        const minimapSize = 200;
        const minimapX = this.canvas.width - minimapSize - 20;
        const minimapY = 20;
        const scaleX = minimapSize / this.space.width;
        const scaleY = minimapSize / this.space.height;

        // Minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

        // Draw space objects on minimap
        this.ctx.fillStyle = '#444444';
        this.planets.forEach(planet => {
            this.ctx.beginPath();
            this.ctx.arc(
                minimapX + planet.x * scaleX,
                minimapY + planet.y * scaleY,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
        });

        // Draw player on minimap
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(
            minimapX + this.player.x * scaleX,
            minimapY + this.player.y * scaleY,
            3, 0, Math.PI * 2
        );
        this.ctx.fill();

        // Draw enemies on minimap
        this.ctx.fillStyle = '#ff4444';
        this.enemies.forEach(enemy => {
            this.ctx.beginPath();
            this.ctx.arc(
                minimapX + enemy.x * scaleX,
                minimapY + enemy.y * scaleY,
                1, 0, Math.PI * 2
            );
            this.ctx.fill();
        });

        // Draw powerups on minimap
        this.ctx.fillStyle = '#ffff00';
        this.powerups.forEach(powerup => {
            this.ctx.beginPath();
            this.ctx.arc(
                minimapX + powerup.x * scaleX,
                minimapY + powerup.y * scaleY,
                1, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
    }



    drawAbilityEffects() {
        // Time freeze effect - blue tint
        if (this.abilities.timeFreeze.duration > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw time freeze particles
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.3})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Shield effect - protective barrier
        if (this.abilities.shield.duration > 0) {
            const shieldRadius = this.player.size + 15;
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, shieldRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Rotating shield segments
            for (let i = 0; i < 6; i++) {
                const angle = (Date.now() * 0.01) + (i * Math.PI / 3);
                const x = this.player.x + Math.cos(angle) * shieldRadius;
                const y = this.player.y + Math.sin(angle) * shieldRadius;
                this.ctx.fillStyle = '#00ffff';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }

        // Magnetism effect - yellow field
        if (this.abilities.magnetism.duration > 0) {
            const magnetRadius = 200;
            this.ctx.strokeStyle = '#ffff0066';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, magnetRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Magnetic field lines
            for (let i = 0; i < 8; i++) {
                const angle = (Date.now() * 0.005) + (i * Math.PI / 4);
                const x1 = this.player.x + Math.cos(angle) * (magnetRadius - 20);
                const y1 = this.player.y + Math.sin(angle) * (magnetRadius - 20);
                const x2 = this.player.x + Math.cos(angle) * magnetRadius;
                const y2 = this.player.y + Math.sin(angle) * magnetRadius;

                this.ctx.strokeStyle = '#ffff0088';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }

        // Multishot effect - orange glow
        if (this.abilities.multishot.duration > 0) {
            this.ctx.shadowColor = '#ff6600';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#ff660033';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.size + 10, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    updateUI() {
        document.getElementById('health-fill').style.width = (this.player.health / this.player.maxHealth * 100) + '%';
        document.getElementById('shield-fill').style.width = (this.player.shield / this.player.maxShield * 100) + '%';
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('combo').textContent = 'x' + this.combo;
        document.getElementById('weapon-type').textContent = this.weapons[this.currentWeapon].name;

        const weapon = this.weapons[this.currentWeapon];
        document.getElementById('ammo').textContent = weapon.ammo === Infinity ? '∞' : weapon.ammo;

        // Combo pulse effect
        if (this.comboTimer === 179) {
            document.getElementById('combo').classList.add('combo-pulse');
            setTimeout(() => document.getElementById('combo').classList.remove('combo-pulse'), 300);
        }

        // Update ability status in controls hint
        this.updateAbilityHints();
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-wave').textContent = this.wave;
        document.getElementById('game-over').classList.remove('hidden');
    }

    restart() {
        // Reset everything
        this.player.health = this.player.maxHealth = 100;
        this.player.shield = this.player.maxShield = 50;
        this.player.x = this.space.width / 2;
        this.player.y = this.space.height / 2;
        this.player.dashCooldown = 0;
        this.player.invulnerable = 0;

        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameRunning = true;
        this.currentWeapon = 0;
        this.fireTimer = 0;
        this.unlockedUpgrades = [];

        // Reset camera
        this.camera.x = 0;
        this.camera.y = 0;

        // Reset upgrades
        this.upgrades = { damage: 1, fireRate: 1, speed: 1, health: 1, shield: 1 };

        // Reset weapons
        this.weapons.forEach(weapon => {
            if (weapon.name === 'LASER') weapon.ammo = 50;
            if (weapon.name === 'PLASMA') weapon.ammo = 30;
        });

        // Clear arrays
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.powerups = [];
        this.explosions = [];
        this.asteroids = [];
        this.planets = [];
        this.stars = [];

        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('upgrade-menu').classList.add('hidden');

        this.generateSpaceObjects();
        this.spawnSpaceEnemies();
    }

    updateAbilityHints() {
        const hint = document.querySelector('.controls-hint p');
        let abilityStatus = [];

        // Check each ability status
        if (this.abilities.timeFreeze.cooldown === 0) abilityStatus.push('Q: Time Freeze');
        else abilityStatus.push(`Q: ${Math.ceil(this.abilities.timeFreeze.cooldown / 60)}s`);

        if (this.abilities.shield.cooldown === 0) abilityStatus.push('E: Shield');
        else abilityStatus.push(`E: ${Math.ceil(this.abilities.shield.cooldown / 60)}s`);

        if (this.abilities.nuke.cooldown === 0 && this.abilities.nuke.charges > 0) {
            abilityStatus.push(`F: Nuke (${this.abilities.nuke.charges})`);
        } else if (this.abilities.nuke.charges > 0) {
            abilityStatus.push(`F: ${Math.ceil(this.abilities.nuke.cooldown / 60)}s`);
        } else {
            abilityStatus.push('F: No Nukes');
        }

        if (this.abilities.magnetism.cooldown === 0) abilityStatus.push('C: Magnet');
        else abilityStatus.push(`C: ${Math.ceil(this.abilities.magnetism.cooldown / 60)}s`);

        if (this.abilities.multishot.cooldown === 0) abilityStatus.push('X: Multishot');
        else abilityStatus.push(`X: ${Math.ceil(this.abilities.multishot.cooldown / 60)}s`);

        hint.innerHTML = `WASD: Move | MOUSE: Aim & Shoot | SPACE: Dash | R: Reload | 1-4: Weapons<br>${abilityStatus.join(' | ')}`;
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GalacticDefender();
});