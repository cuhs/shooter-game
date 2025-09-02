export class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
    }

    render(gameData) {
        const { camera, player, enemies, projectiles, particles, explosions, powerups, spaceObjects, gameState, abilities, weapon } = gameData;
        
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);

        // Render space objects
        this.renderStars(spaceObjects.stars);
        this.renderPlanets(spaceObjects.planets);
        this.renderAsteroids(spaceObjects.asteroids);

        // Render game entities
        this.renderPlayer(player);
        this.renderEnemies(enemies);
        this.renderProjectiles(projectiles);
        this.renderParticles(particles);
        this.renderExplosions(explosions);
        this.renderPowerups(powerups);

        // Restore context
        this.ctx.restore();

        // Render UI (not affected by camera)
        this.renderUI(gameState, abilities, weapon, player);
        this.renderMinimap(camera, player, enemies, spaceObjects);
    }

    renderStars(stars) {
        this.ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1;
    }

    renderPlanets(planets) {
        planets.forEach(planet => {
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Planet glow
            this.ctx.shadowColor = planet.color;
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    renderAsteroids(asteroids) {
        this.ctx.fillStyle = '#666666';
        asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            // Draw irregular asteroid shape
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
    }

    renderPlayer(player) {
        if (player.invulnerable > 0 && Math.floor(player.invulnerable / 5) % 2) {
            return; // Flashing effect when invulnerable
        }

        this.ctx.fillStyle = player.color;
        this.ctx.strokeStyle = player.color;
        this.ctx.lineWidth = 2;

        // Draw player ship
        this.ctx.save();
        this.ctx.translate(player.x, player.y);
        
        this.ctx.beginPath();
        this.ctx.moveTo(player.size, 0);
        this.ctx.lineTo(-player.size, -player.size / 2);
        this.ctx.lineTo(-player.size / 2, 0);
        this.ctx.lineTo(-player.size, player.size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();

        // Health bar
        this.renderHealthBar(player);
    }

    renderHealthBar(player) {
        const barWidth = 40;
        const barHeight = 4;
        const x = player.x - barWidth / 2;
        const y = player.y - player.size - 15;

        // Health bar background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Health bar
        const healthPercent = player.health / player.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Shield bar
        if (player.shield > 0) {
            const shieldPercent = player.shield / player.maxShield;
            this.ctx.fillStyle = '#00aaff';
            this.ctx.fillRect(x, y - 6, barWidth * shieldPercent, 2);
        }
    }

    renderEnemies(enemies) {
        enemies.forEach(enemy => {
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
    }

    renderProjectiles(projectiles) {
        projectiles.forEach(projectile => {
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderParticles(particles) {
        particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    renderExplosions(explosions) {
        explosions.forEach(explosion => {
            const progress = 1 - (explosion.life / explosion.maxLife);
            const size = explosion.maxSize * progress;
            const alpha = explosion.life / explosion.maxLife;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = explosion.color;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    renderPowerups(powerups) {
        powerups.forEach(powerup => {
            this.ctx.fillStyle = powerup.color;
            this.ctx.strokeStyle = powerup.color;
            this.ctx.lineWidth = 2;
            
            this.ctx.save();
            this.ctx.translate(powerup.x, powerup.y);
            this.ctx.rotate(powerup.rotation);
            
            this.ctx.strokeRect(-powerup.size, -powerup.size, powerup.size * 2, powerup.size * 2);
            this.ctx.fillRect(-powerup.size / 2, -powerup.size / 2, powerup.size, powerup.size);
            
            this.ctx.restore();
        });
    }

    renderUI(gameState, abilities, weapon, player) {
        // Score and wave
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${gameState.score}`, 20, 30);
        this.ctx.fillText(`Wave: ${gameState.wave}`, 20, 55);
        this.ctx.fillText(`Combo: x${gameState.combo}`, 20, 80);

        // Weapon info
        this.ctx.fillText(`Weapon: ${weapon.name}`, this.canvas.width - 200, 30);
        if (weapon.ammo !== Infinity) {
            this.ctx.fillText(`Ammo: ${weapon.ammo}`, this.canvas.width - 200, 55);
        }

        // Player stats
        this.ctx.fillText(`Health: ${Math.ceil(player.health)}/${player.maxHealth}`, this.canvas.width - 200, 80);
        this.ctx.fillText(`Shield: ${Math.ceil(player.shield)}/${player.maxShield}`, this.canvas.width - 200, 105);
    }

    renderMinimap(camera, player, enemies, spaceObjects) {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 20;
        const minimapY = this.canvas.height - minimapSize - 20;
        
        // Minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

        const scaleX = minimapSize / 4000; // GameConfig.SPACE_WIDTH
        const scaleY = minimapSize / 3000; // GameConfig.SPACE_HEIGHT

        // Draw planets
        spaceObjects.planets.forEach(planet => {
            const x = minimapX + planet.x * scaleX;
            const y = minimapY + planet.y * scaleY;
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw player
        const playerX = minimapX + player.x * scaleX;
        const playerY = minimapY + player.y * scaleY;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw enemies
        this.ctx.fillStyle = '#ff0000';
        enemies.forEach(enemy => {
            const x = minimapX + enemy.x * scaleX;
            const y = minimapY + enemy.y * scaleY;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}