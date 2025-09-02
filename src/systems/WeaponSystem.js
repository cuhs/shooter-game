import { GameConfig } from '../config/GameConfig.js';
import { Projectile } from '../entities/Projectile.js';

export class WeaponSystem {
    constructor() {
        this.weapons = [...GameConfig.WEAPONS];
        this.currentWeapon = 0;
        this.fireTimer = 0;
        this.upgrades = {
            damage: 1,
            fireRate: 1
        };
    }

    update() {
        if (this.fireTimer > 0) this.fireTimer--;
    }

    shoot(player, mouse, projectiles) {
        if (this.fireTimer > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo <= 0) return;

        this.fireTimer = Math.max(1, weapon.fireRate - this.upgrades.fireRate);

        if (weapon.ammo !== Infinity) {
            weapon.ammo--;
        }

        // Calculate angle to mouse
        const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);

        if (weapon.name === 'SCATTER') {
            // Fire 3 projectiles in a scatter pattern
            for (let i = -1; i <= 1; i++) {
                const spreadAngle = angle + (i * 0.3);
                this.createProjectile(player, spreadAngle, weapon, projectiles);
            }
        } else {
            this.createProjectile(player, angle, weapon, projectiles);
        }
    }

    createProjectile(player, angle, weapon, projectiles) {
        const projectile = new Projectile(
            player.x,
            player.y,
            Math.cos(angle) * weapon.speed,
            Math.sin(angle) * weapon.speed,
            weapon,
            weapon.damage * this.upgrades.damage
        );
        
        projectiles.push(projectile);
    }

    switchWeapon(weaponIndex) {
        if (weaponIndex >= 0 && weaponIndex < this.weapons.length) {
            this.currentWeapon = weaponIndex;
        }
    }

    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }

    reload() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.name === 'BEAM') weapon.ammo = 50;
        if (weapon.name === 'PLASMA') weapon.ammo = 30;
    }

    upgradeFireRate(amount) {
        this.upgrades.fireRate += amount;
    }

    upgradeDamage(amount) {
        this.upgrades.damage += amount;
    }

    reset() {
        this.currentWeapon = 0;
        this.fireTimer = 0;
        this.upgrades = { damage: 1, fireRate: 1 };
        
        // Reset weapon ammo
        this.weapons.forEach(weapon => {
            if (weapon.name === 'BEAM') weapon.ammo = 50;
            if (weapon.name === 'PLASMA') weapon.ammo = 30;
        });
    }
}