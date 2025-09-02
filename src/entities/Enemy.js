import { GameConfig } from '../config/GameConfig.js';

export class Enemy {
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
        this.shootTimer = 0;
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
        
        // Move towards player based on enemy type behavior
        this.updateBehavior(player);
        
        // Update timers
        this.shootTimer = Math.max(0, this.shootTimer - 1);
        this.behaviorTimer++;
    }

    updateBehavior(player) {
        const distance = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
        
        switch (this.type) {
            case 'scout':
                // Fast, direct approach
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                break;
                
            case 'fighter':
                // Moderate speed, tries to maintain distance
                if (distance > 150) {
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                } else {
                    // Circle around player
                    const circleAngle = this.angle + Math.PI / 2;
                    this.x += Math.cos(circleAngle) * this.speed * 0.5;
                    this.y += Math.sin(circleAngle) * this.speed * 0.5;
                }
                break;
                
            case 'bomber':
                // Slow but steady approach
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                break;
                
            case 'cruiser':
                // Large, slow, tries to ram player
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                break;
                
            case 'interceptor':
                // Fast, erratic movement
                const wobble = Math.sin(this.behaviorTimer * 0.2) * 0.5;
                this.x += Math.cos(this.angle + wobble) * this.speed;
                this.y += Math.sin(this.angle + wobble) * this.speed;
                break;
                
            case 'miner':
                // Slow, tries to avoid player while mining
                if (distance < 200) {
                    this.x -= Math.cos(this.angle) * this.speed * 0.5;
                    this.y -= Math.sin(this.angle) * this.speed * 0.5;
                } else {
                    // Random movement when far from player
                    const randomAngle = this.behaviorTimer * 0.05;
                    this.x += Math.cos(randomAngle) * this.speed;
                    this.y += Math.sin(randomAngle) * this.speed;
                }
                break;
                
            case 'drone':
                // Small, fast, swarm behavior
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                break;
        }
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