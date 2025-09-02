export class Projectile {
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

    checkCollision(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + target.size;
    }
}