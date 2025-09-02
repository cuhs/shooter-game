import { Player } from '../entities/Player.js';
import { Camera } from '../systems/Camera.js';
import { InputManager } from '../systems/InputManager.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { SpaceGenerator } from '../systems/SpaceGenerator.js';
import { Renderer } from '../systems/Renderer.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { GameConfig } from '../config/GameConfig.js';

export class Game {
    constructor() {
        console.log('Game constructor starting...');
        
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        console.log('Canvas found:', this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 80;
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        
        // Test canvas rendering
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(100, 100, 200, 200);
        console.log('Test rectangle drawn');

        // Initialize game state
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameRunning = true;
        this.waveInProgress = false;
        this.enemiesRemaining = 0;

        // Initialize systems
        this.camera = new Camera(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT, this.canvas);
        this.inputManager = new InputManager(this.canvas);
        this.player = new Player(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);
        this.weaponSystem = new WeaponSystem();
        this.enemyManager = new EnemyManager();
        this.spaceGenerator = new SpaceGenerator(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT);
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.abilitySystem = new AbilitySystem();

        // Game object arrays
        this.projectiles = [];
        this.particles = [];
        this.powerups = [];
        this.explosions = [];

        // Initialize game
        this.init();
    }

    init() {
        console.log('Initializing game...');
        
        try {
            console.log('Generating space objects...');
            this.spaceGenerator.generateAll();
            
            console.log('Spawning initial enemies...');
            this.enemyManager.spawnInitialEnemies(this.spaceGenerator.getSpaceObjects());
            
            console.log('Centering camera...');
            this.camera.centerOnPlayer(this.player);
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Starting game loop...');
            this.gameLoop();
            
            console.log('Game initialization complete!');
        } catch (error) {
            console.error('Error during game initialization:', error);
        }
    }

    setupEventListeners() {
        this.inputManager.onRestart(() => this.restart());
    }

    update() {
        if (!this.gameRunning) return;

        // Update player
        this.player.update(this.inputManager.keys, this.canvas);
        
        // Update camera
        this.camera.update(this.player);
        
        // Update mouse world coordinates
        this.inputManager.updateWorldCoordinates(this.camera);

        // Handle shooting
        if (this.inputManager.mouse.down) {
            this.weaponSystem.shoot(this.player, this.inputManager.mouse, this.projectiles);
        }

        // Update systems
        this.weaponSystem.update();
        const killData = this.enemyManager.update(this.player, this.projectiles, this.particles, this.explosions);
        this.abilitySystem.update();
        this.spaceGenerator.update();
        
        // Process kills for score
        killData.forEach(kill => {
            this.score += kill.score * this.combo;
            this.combo = Math.min(10, this.combo + 1);
            this.comboTimer = 180; // 3 seconds to maintain combo
        });
        
        // Update projectiles
        this.updateProjectiles();
        
        // Update particles and effects
        this.updateParticles();
        this.updateExplosions();
        this.updatePowerups();

        // Spawn enemies
        this.enemyManager.spawnRandomEnemy(this.player);

        // Update game state
        this.updateGameState();
    }

    render() {
        this.renderer.render({
            camera: this.camera,
            player: this.player,
            enemies: this.enemyManager.enemies,
            projectiles: this.projectiles,
            particles: this.particles,
            explosions: this.explosions,
            powerups: this.powerups,
            spaceObjects: this.spaceGenerator.getSpaceObjects(),
            gameState: {
                score: this.score,
                wave: this.wave,
                combo: this.combo
            },
            abilities: this.abilitySystem.abilities,
            weapon: this.weaponSystem.getCurrentWeapon()
        });
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            
            // Remove projectiles that are dead or out of bounds
            if (!projectile.isAlive() || !projectile.isInBounds(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT)) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateParticles() {
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
    }

    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.life--;
            
            if (explosion.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }

    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.rotation += 0.1;
            
            // Check collision with player
            const dx = powerup.x - this.player.x;
            const dy = powerup.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < powerup.size + this.player.size) {
                this.applyPowerup(powerup);
                this.powerups.splice(i, 1);
            }
        }
    }

    updateGameState() {
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

    applyPowerup(powerup) {
        switch (powerup.type) {
            case 'health':
                this.player.heal(25);
                break;
            case 'shield':
                this.player.restoreShield(25);
                break;
            case 'weapon':
                this.weaponSystem.reload();
                break;
            case 'damage':
                this.weaponSystem.upgradeDamage(0.2);
                break;
            case 'speed':
                this.weaponSystem.upgradeFireRate(1);
                break;
        }
    }

    restart() {
        // Reset game state and reinitialize
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.gameRunning = true;
        
        this.player.reset(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);
        this.camera.reset();
        this.weaponSystem.reset();
        this.enemyManager.reset();
        this.abilitySystem.reset();
        
        // Clear arrays
        this.projectiles = [];
        this.particles = [];
        this.powerups = [];
        this.explosions = [];
        
        this.spaceGenerator.generateAll();
        this.enemyManager.spawnInitialEnemies(this.spaceGenerator.getSpaceObjects());
        
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('upgrade-menu').classList.add('hidden');
    }
}