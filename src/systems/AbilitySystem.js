import { GameConfig } from '../config/GameConfig.js';

export class AbilitySystem {
    constructor() {
        this.abilities = {
            timeFreeze: { cooldown: 0, active: false, duration: 0 },
            shield: { cooldown: 0, active: false, duration: 0 },
            nuke: { cooldown: 0, charges: GameConfig.ABILITIES.nuke.charges },
            magnetism: { cooldown: 0, active: false, duration: 0 },
            multishot: { cooldown: 0, active: false, duration: 0 }
        };
    }

    update() {
        Object.keys(this.abilities).forEach(abilityName => {
            const ability = this.abilities[abilityName];
            
            // Update cooldowns
            if (ability.cooldown > 0) {
                ability.cooldown--;
            }
            
            // Update active durations
            if (ability.active && ability.duration > 0) {
                ability.duration--;
                if (ability.duration <= 0) {
                    ability.active = false;
                }
            }
        });
    }

    activateAbility(abilityName, player, enemies, projectiles, particles) {
        const ability = this.abilities[abilityName];
        const config = GameConfig.ABILITIES[abilityName];
        
        if (ability.cooldown > 0) return false;
        
        switch (abilityName) {
            case 'timeFreeze':
                ability.active = true;
                ability.duration = config.duration;
                ability.cooldown = config.cooldown;
                break;
                
            case 'shield':
                ability.active = true;
                ability.duration = config.duration;
                ability.cooldown = config.cooldown;
                player.invulnerable = config.duration;
                break;
                
            case 'nuke':
                if (ability.charges <= 0) return false;
                ability.charges--;
                ability.cooldown = config.cooldown;
                this.executeNuke(player, enemies, particles);
                break;
                
            case 'magnetism':
                ability.active = true;
                ability.duration = config.duration;
                ability.cooldown = config.cooldown;
                break;
                
            case 'multishot':
                ability.active = true;
                ability.duration = config.duration;
                ability.cooldown = config.cooldown;
                break;
        }
        
        return true;
    }

    executeNuke(player, enemies, particles) {
        const nukeRadius = 300;
        
        // Create nuke explosion particles
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * nukeRadius;
            particles.push({
                x: player.x + Math.cos(angle) * distance,
                y: player.y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 60,
                maxLife: 60,
                color: '#ffff00',
                size: 3
            });
        }
        
        // Damage all enemies in range
        enemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= nukeRadius) {
                enemy.takeDamage(100);
            }
        });
    }

    isAbilityActive(abilityName) {
        return this.abilities[abilityName].active;
    }

    getAbilityCooldown(abilityName) {
        return this.abilities[abilityName].cooldown;
    }

    reset() {
        Object.keys(this.abilities).forEach(abilityName => {
            const ability = this.abilities[abilityName];
            ability.cooldown = 0;
            ability.active = false;
            ability.duration = 0;
            
            if (abilityName === 'nuke') {
                ability.charges = GameConfig.ABILITIES.nuke.charges;
            }
        });
    }
}