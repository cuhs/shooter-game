import { GameConfig } from '../config/GameConfig.js';
import { Enemy } from '../entities/Enemy.js';

export class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.maxEnemies = 15;
    }

    update(player, projectiles, particles, explosions) {
        const killData = [];
        
        // Update all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(player);

            // Check collision with projectiles
            for (let j = projectiles.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];
                if (this.checkCollision(enemy, projectile)) {
                    enemy.takeDamage(projectile.damage);
                    projectiles.splice(j, 1);
                    
                    // Create hit particles
                    this.createHitParticles(enemy.x, enemy.y, particles);
                    
                    if (enemy.isDead()) {
                        this.createExplosion(enemy.x, enemy.y, explosions);
                        killData.push({ score: enemy.getPoints(), type: enemy.type });
                        this.enemies.splice(i, 1);
                    }
                    break;
                }
            }

            // Check collision with player
            if (this.checkCollision(enemy, player)) {
                if (player.takeDamage(enemy.damage)) {
                    this.createHitParticles(player.x, player.y, particles);
                }
            }
        }
        
        return killData;
    }

    spawnInitialEnemies(spaceObjects) {
        // Spawn some initial enemies around planets
        spaceObjects.planets.forEach(planet => {
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = planet.size + 100 + Math.random() * 200;
                const x = planet.x + Math.cos(angle) * distance;
                const y = planet.y + Math.sin(angle) * distance;
                
                this.spawnEnemy(x, y);
            }
        });
    }

    spawnRandomEnemy(player) {
        if (this.enemies.length >= this.maxEnemies) return;
        if (Math.random() > GameConfig.SPAWN_RATES.ENEMY_CHANCE) return;

        // Spawn enemy off-screen
        const angle = Math.random() * Math.PI * 2;
        const distance = 800;
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        this.spawnEnemy(x, y);
    }

    spawnEnemy(x, y, type = null) {
        if (!type) {
            const types = Object.keys(GameConfig.ENEMY_TYPES);
            type = types[Math.floor(Math.random() * types.length)];
        }

        const enemy = new Enemy(x, y, type);
        this.enemies.push(enemy);
    }

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.size + obj2.size);
    }

    createHitParticles(x, y, particles) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                color: '#ffaa00',
                size: 2
            });
        }
    }

    createExplosion(x, y, explosions) {
        explosions.push({
            x: x,
            y: y,
            size: 0,
            maxSize: 40,
            life: 20,
            maxLife: 20,
            color: '#ff4400'
        });
    }

    reset() {
        this.enemies = [];
        this.spawnTimer = 0;
    }
}