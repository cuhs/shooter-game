import { GameConfig } from '../config/GameConfig.js';

export class Player {
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
        this.thrust = 0;
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

        // Shield regeneration
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + 0.2);
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
        this.invulnerable = 30; // Brief invulnerability after dash
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return false;

        if (this.shield > 0) {
            this.shield = Math.max(0, this.shield - damage);
            if (this.shield === 0) {
                // Shield broken, take remaining damage to health
                const remainingDamage = damage - this.shield;
                this.health = Math.max(0, this.health - remainingDamage);
            }
        } else {
            this.health = Math.max(0, this.health - damage);
        }

        this.invulnerable = GameConfig.PLAYER.INVULNERABLE_TIME;
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    restoreShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.dashCooldown = 0;
        this.invulnerable = 0;
        this.angle = 0;
        this.thrust = 0;
    }

    isDead() {
        return this.health <= 0;
    }
}