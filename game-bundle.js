// Game Configuration
const GameConfig = {
    // Space dimensions
    SPACE_WIDTH: 4000,
    SPACE_HEIGHT: 3000,

    // Player settings
    PLAYER: {
        SIZE: 12,
        SPEED: 5,
        MAX_HEALTH: 100,
        MAX_SHIELD: 75,
        COLOR: '#00ffff',
        DASH_COOLDOWN: 60,
        INVULNERABLE_TIME: 120
    },

    // Camera settings
    CAMERA: {
        FOLLOW_SPEED: 0.3
    },

    // Weapon configurations - Reduced damage for harder difficulty
    WEAPONS: [
        { name: 'PHOTON', damage: 8, speed: 12, size: 3, color: '#00ffff', fireRate: 30, ammo: Infinity },
        { name: 'SCATTER', damage: 6, speed: 10, size: 2, color: '#ff6600', fireRate: 40, ammo: Infinity },
        { name: 'BEAM', damage: 12, speed: 18, size: 2, color: '#ff0000', fireRate: 20, ammo: 50 },
        { name: 'PLASMA', damage: 15, speed: 8, size: 5, color: '#ff00ff', fireRate: 25, ammo: 30 }
    ],

    // Enemy spaceship types - spawn in different waves
    ENEMY_TYPES: {
        // Wave 1-2: Basic enemies - Increased health for difficulty
        scout: {
            size: 16, speed: 2.2, health: 45, color: '#ff6666', points: 8,
            minWave: 1, maxWave: 999, spawnWeight: 3,
            shape: 'triangle', thrusterColor: '#ff9999',
            behavior: 'swarm', formationSize: 3, aggressionRange: 150
        },
        fighter: {
            size: 20, speed: 1.8, health: 70, color: '#ff4444', points: 15,
            minWave: 1, maxWave: 999, spawnWeight: 2,
            shape: 'diamond', thrusterColor: '#ff7777',
            behavior: 'flanking', formationSize: 2, flankDistance: 200
        },

        // Wave 3-5: Medium enemies - Much tankier
        interceptor: {
            size: 18, speed: 2.8, health: 65, color: '#ff8844', points: 20,
            minWave: 3, maxWave: 999, spawnWeight: 2,
            shape: 'arrow', thrusterColor: '#ffaa77',
            behavior: 'hit_and_run', retreatDistance: 250, attackCooldown: 180
        },
        bomber: {
            size: 28, speed: 1.2, health: 120, color: '#ff2222', points: 30,
            minWave: 3, maxWave: 999, spawnWeight: 1,
            shape: 'hexagon', thrusterColor: '#ff5555',
            behavior: 'artillery', keepDistance: 300, chargeTime: 120, weakPoint: true
        },

        // Wave 6-10: Advanced enemies - Significantly tankier
        cruiser: {
            size: 32, speed: 1.5, health: 160, color: '#cc1111', points: 40,
            minWave: 6, maxWave: 999, spawnWeight: 1,
            shape: 'cruiser', thrusterColor: '#ff4444',
            behavior: 'guardian', shieldRadius: 150, damageReduction: 0.3
        },
        destroyer: {
            size: 36, speed: 1.3, health: 220, color: '#aa0000', points: 60,
            minWave: 8, maxWave: 999, spawnWeight: 1,
            shape: 'destroyer', thrusterColor: '#dd3333',
            behavior: 'berserker', enrageThreshold: 0.5, enrageSpeedBonus: 1.5
        },

        // Wave 11+: Elite enemies - Boss-level health
        battleship: {
            size: 44, speed: 1.0, health: 320, color: '#880000', points: 80,
            minWave: 11, maxWave: 999, spawnWeight: 1,
            shape: 'battleship', thrusterColor: '#bb2222',
            behavior: 'commander', commandRadius: 250, buffStrength: 1.3, weakPoint: true
        },
        dreadnought: {
            size: 52, speed: 0.8, health: 450, color: '#660000', points: 120,
            minWave: 15, maxWave: 999, spawnWeight: 1,
            shape: 'dreadnought', thrusterColor: '#992222',
            behavior: 'fortress', phases: ['charging', 'firing', 'vulnerable'], phaseTime: 240, weakPoint: true
        }
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
    },

    // Wave system configuration - More enemies per wave for longer battles
    WAVE_CONFIG: {
        BASE_ENEMIES_PER_WAVE: 15, // Increased from 10
        ENEMIES_INCREASE_PER_WAVE: 4, // Increased from 3
        WAVE_BREAK_DURATION: 120 // 2 seconds - less rest time
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
        this.homing = false; // Will be set by game if homing shots are enabled
        this.speed = Math.sqrt(vx * vx + vy * vy); // Store original speed for homing
    }

    update(enemies = []) {
        // Homing behavior
        if (this.homing && enemies.length > 0) {
            // Find closest enemy
            let closestEnemy = null;
            let closestDistance = Infinity;

            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance && distance < 200) { // Homing range
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }

            // Adjust velocity towards closest enemy
            if (closestEnemy) {
                const dx = closestEnemy.x - this.x;
                const dy = closestEnemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    // Gradually turn towards target
                    const targetVx = (dx / distance) * this.speed;
                    const targetVy = (dy / distance) * this.speed;

                    const turnRate = 0.1; // How quickly projectile can turn
                    this.vx += (targetVx - this.vx) * turnRate;
                    this.vy += (targetVy - this.vy) * turnRate;

                    // Maintain speed
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (currentSpeed > 0) {
                        this.vx = (this.vx / currentSpeed) * this.speed;
                        this.vy = (this.vy / currentSpeed) * this.speed;
                    }
                }
            }
        }

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

        // Apply movement (will be modified by game's speed multiplier)
        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Keep player within bounds - account for UI bar at top
        const topOffset = 80; // Account for HUD height
        this.x = Math.max(this.size, Math.min(GameConfig.SPACE_WIDTH - this.size, this.x));
        this.y = Math.max(this.size + topOffset, Math.min(GameConfig.SPACE_HEIGHT - this.size, this.y));

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
            const regenRate = this.shieldRegenBonus ? 0.3 : 0.15; // Faster if upgraded
            this.shield = Math.min(this.maxShield, this.shield + regenRate);
        }
    }

    dash(dx, dy) {
        const multiplier = this.dashMultiplier || 1;
        const dashDistance = 100 * multiplier;
        this.x += dx * dashDistance;
        this.y += dy * dashDistance;

        // Keep within bounds after dash - account for UI bar at top
        const topOffset = 80; // Account for HUD height
        this.x = Math.max(this.size, Math.min(GameConfig.SPACE_WIDTH - this.size, this.x));
        this.y = Math.max(this.size + topOffset, Math.min(GameConfig.SPACE_HEIGHT - this.size, this.y));

        this.dashCooldown = GameConfig.PLAYER.DASH_COOLDOWN;
        this.invulnerable = 30;

        // Store dash damage flag for game to check
        this.dashingThisFrame = true;
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return false;

        console.log(`Player taking ${damage} damage. Health: ${this.health}, Shield: ${this.shield}, MaxShield: ${this.maxShield}`);

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
    constructor(x, y, type, wave = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.wave = wave;

        const config = GameConfig.ENEMY_TYPES[type];

        // Use base stats from config (no wave scaling)
        this.size = config.size;
        this.speed = config.speed;
        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.color = config.color;
        this.points = config.points;
        // Set extremely punishing damage based on enemy type
        const damageMap = {
            scout: 40,      // Fast, moderate damage
            fighter: 55,    // Heavy damage
            interceptor: 45, // Fast, heavy damage  
            bomber: 80,     // Devastating damage
            cruiser: 70,    // Very strong damage
            destroyer: 95,  // Crushing damage
            battleship: 120, // Annihilating damage
            dreadnought: 150 // Instant death threat
        };
        this.damage = damageMap[type] || 55;
        this.shape = config.shape;
        this.thrusterColor = config.thrusterColor;

        this.angle = 0;
        this.targetAngle = 0;
        this.behaviorTimer = 0;
        this.thrusterFlicker = 0;
    }

    update(player, allEnemies = []) {
        const config = GameConfig.ENEMY_TYPES[this.type];
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

        this.behaviorTimer++;

        // Check if enemy is out of bounds and needs to return - use same bounds as player
        const margin = this.size; // Use enemy's own size as margin, same as player
        const topOffset = 80; // Account for HUD height
        const outOfBounds = this.x < margin || this.x > GameConfig.SPACE_WIDTH - margin ||
            this.y < margin + topOffset || this.y > GameConfig.SPACE_HEIGHT - margin;

        if (outOfBounds) {
            // Force return to playfield - override all behaviors
            this.returnToPlayfield();
            return;
        }

        // Calculate base movement toward player
        let moveAngle = Math.atan2(dy, dx);
        let moveSpeed = GameConfig.ENEMY_TYPES[this.type].speed;

        // Apply strategic behavior modifications to base movement
        const behaviorResult = this.applyBehaviorModifications(player, allEnemies, config, moveAngle, moveSpeed, distanceToPlayer);
        moveAngle = behaviorResult.angle;
        moveSpeed = behaviorResult.speed;

        // Store previous distance for progress checking
        this.previousDistance = this.previousDistance || distanceToPlayer;

        // Apply movement with boundary checking
        this.applyMovement(moveAngle, moveSpeed);

        // Check if we're making progress toward player (every few frames)
        if (this.behaviorTimer % 60 === 0) {
            const newDistance = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);

            // If we're not getting closer and we're far away, override with direct movement
            if (newDistance >= this.previousDistance && newDistance > 300) {
                const directAngle = Math.atan2(player.y - this.y, player.x - this.x);
                this.angle = directAngle;
            }

            this.previousDistance = newDistance;
        }
    }

    returnToPlayfield() {
        // Force movement back toward the center of the playfield
        const centerX = GameConfig.SPACE_WIDTH / 2;
        const centerY = GameConfig.SPACE_HEIGHT / 2;
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const angle = Math.atan2(dy, dx);

        // Move at double speed to quickly return
        const returnSpeed = GameConfig.ENEMY_TYPES[this.type].speed * 2;
        this.applyMovement(angle, returnSpeed);
    }

    applyBehaviorModifications(player, allEnemies, config, baseAngle, baseSpeed, distanceToPlayer) {
        let modifiedAngle = baseAngle;
        let modifiedSpeed = baseSpeed;

        // Apply behavior-specific modifications
        if (config.behavior) {
            try {
                switch (config.behavior) {
                    case 'swarm':
                        const swarmResult = this.getSwarmModifications(player, allEnemies, config, baseAngle, baseSpeed);
                        modifiedAngle = swarmResult.angle;
                        modifiedSpeed = swarmResult.speed;
                        break;

                    case 'flanking':
                        const flankResult = this.getFlankingModifications(player, config, baseAngle, baseSpeed, distanceToPlayer);
                        modifiedAngle = flankResult.angle;
                        modifiedSpeed = flankResult.speed;
                        break;

                    case 'hit_and_run':
                        const hitRunResult = this.getHitAndRunModifications(player, config, baseAngle, baseSpeed, distanceToPlayer);
                        modifiedAngle = hitRunResult.angle;
                        modifiedSpeed = hitRunResult.speed;
                        break;

                    case 'artillery':
                        const artilleryResult = this.getArtilleryModifications(player, config, baseAngle, baseSpeed, distanceToPlayer);
                        modifiedAngle = artilleryResult.angle;
                        modifiedSpeed = artilleryResult.speed;
                        break;

                    case 'guardian':
                        const guardianResult = this.getGuardianModifications(player, allEnemies, config, baseAngle, baseSpeed);
                        modifiedAngle = guardianResult.angle;
                        modifiedSpeed = guardianResult.speed;
                        break;

                    case 'berserker':
                        const berserkerResult = this.getBerserkerModifications(player, config, baseAngle, baseSpeed);
                        modifiedAngle = berserkerResult.angle;
                        modifiedSpeed = berserkerResult.speed;
                        break;

                    case 'commander':
                        const commanderResult = this.getCommanderModifications(player, config, baseAngle, baseSpeed);
                        modifiedAngle = commanderResult.angle;
                        modifiedSpeed = commanderResult.speed;
                        break;

                    case 'fortress':
                        const fortressResult = this.getFortressModifications(player, config, baseAngle, baseSpeed);
                        modifiedAngle = fortressResult.angle;
                        modifiedSpeed = fortressResult.speed;
                        break;

                    default:
                        // Unknown behavior - use basic movement toward player
                        break;
                }
            } catch (error) {
                // If behavior fails, fall back to basic movement
                console.warn(`Enemy behavior ${config.behavior} failed, using basic movement:`, error);
            }
        }

        return { angle: modifiedAngle, speed: modifiedSpeed };
    }

    getSwarmModifications(player, allEnemies, config, baseAngle, baseSpeed) {
        // Find nearby allies for formation
        const nearbyAllies = allEnemies.filter(enemy =>
            enemy !== this && enemy.type === this.type &&
            Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2) < (config.aggressionRange || 150)
        );

        if (nearbyAllies.length >= (config.formationSize || 2) - 1) {
            // Coordinated attack - move directly toward player with speed boost
            return { angle: baseAngle, speed: baseSpeed * 1.3 };
        } else {
            // Regroup - slight weaving while moving toward player
            const weaveAngle = baseAngle + (Math.sin(this.behaviorTimer * 0.05) * 0.3);
            return { angle: weaveAngle, speed: baseSpeed * 0.9 };
        }
    }

    getFlankingModifications(player, config, baseAngle, baseSpeed, distanceToPlayer) {
        const flankDistance = config.flankDistance || 200;

        if (distanceToPlayer > flankDistance * 1.2) {
            // Too far - move closer first
            return { angle: baseAngle, speed: baseSpeed * 1.1 };
        } else if (distanceToPlayer > flankDistance * 0.8) {
            // Move to flanking position - arc around player
            const flankSide = Math.sin(this.behaviorTimer * 0.02) > 0 ? 1 : -1;
            const flankOffset = flankSide * Math.PI / 2.5;
            return { angle: baseAngle + flankOffset, speed: baseSpeed * 1.0 };
        } else {
            // Close enough - attack directly
            return { angle: baseAngle, speed: baseSpeed * 1.3 };
        }
    }

    getHitAndRunModifications(player, config, baseAngle, baseSpeed, distanceToPlayer) {
        const attackCooldown = config.attackCooldown || 180;
        const attackPhase = (this.behaviorTimer % attackCooldown) < (attackCooldown / 2);

        if (attackPhase) {
            // Attack phase - move toward player aggressively
            return { angle: baseAngle, speed: baseSpeed * 1.5 };
        } else if (distanceToPlayer < 120) {
            // Retreat phase - move away but not too far
            const retreatAngle = baseAngle + Math.PI + (Math.random() - 0.5) * 0.5;
            return { angle: retreatAngle, speed: baseSpeed * 1.2 };
        } else {
            // Repositioning - circle around player
            const circleAngle = baseAngle + Math.PI / 2;
            return { angle: circleAngle, speed: baseSpeed * 0.9 };
        }
    }

    getArtilleryModifications(player, config, baseAngle, baseSpeed, distanceToPlayer) {
        const keepDistance = config.keepDistance || 300;

        this.chargingPhase = this.chargingPhase || false;
        this.chargeTimer = this.chargeTimer || 0;

        if (distanceToPlayer < keepDistance * 0.7) {
            // Too close - retreat while facing player
            this.chargingPhase = false;
            return { angle: baseAngle + Math.PI, speed: baseSpeed * 1.2 };
        } else if (distanceToPlayer > keepDistance * 1.3) {
            // Too far - move closer
            this.chargingPhase = false;
            return { angle: baseAngle, speed: baseSpeed * 0.8 };
        } else {
            // Good distance - charging behavior
            if (!this.chargingPhase && this.behaviorTimer % (config.chargeTime || 120) === 0) {
                this.chargingPhase = true;
                this.chargeTimer = 60;
            }

            if (this.chargingPhase) {
                this.chargeTimer--;
                if (this.chargeTimer <= 0) {
                    this.chargingPhase = false;
                }
                return { angle: baseAngle, speed: 0 }; // Stationary while charging
            } else {
                return { angle: baseAngle, speed: baseSpeed * 0.6 };
            }
        }
    }

    getGuardianModifications(player, allEnemies, config, baseAngle, baseSpeed) {
        const shieldRadius = config.shieldRadius || 150;

        // Find allies to protect
        const nearbyAllies = allEnemies.filter(enemy =>
            enemy !== this &&
            Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2) < shieldRadius
        );

        if (nearbyAllies.length > 0) {
            // Position between player and allies, but still move toward player
            const avgAllyX = nearbyAllies.reduce((sum, ally) => sum + ally.x, 0) / nearbyAllies.length;
            const avgAllyY = nearbyAllies.reduce((sum, ally) => sum + ally.y, 0) / nearbyAllies.length;

            // Blend between protecting allies and attacking player
            const protectWeight = 0.4;
            const attackWeight = 0.6;

            const protectAngle = Math.atan2(avgAllyY - this.y, avgAllyX - this.x);
            const blendedAngle = this.blendAngles(baseAngle, protectAngle, protectWeight);

            return { angle: blendedAngle, speed: baseSpeed * 0.8 };
        } else {
            // No allies to protect - move toward player normally
            return { angle: baseAngle, speed: baseSpeed };
        }
    }

    getBerserkerModifications(player, config, baseAngle, baseSpeed) {
        const healthRatio = this.health / this.maxHealth;
        const enrageThreshold = config.enrageThreshold || 0.5;

        if (healthRatio < enrageThreshold) {
            // Enraged - faster and more direct
            this.color = '#ff0000';
            return { angle: baseAngle, speed: baseSpeed * (config.enrageSpeedBonus || 1.5) };
        } else {
            this.color = GameConfig.ENEMY_TYPES[this.type].color;
            return { angle: baseAngle, speed: baseSpeed };
        }
    }

    getCommanderModifications(player, config, baseAngle, baseSpeed) {
        this.weakPointPhase = this.weakPointPhase || false;

        // Weak point phase every 5 seconds
        if (this.behaviorTimer % 300 < 60) {
            this.weakPointPhase = true;
            this.color = '#ffaa00';
            return { angle: baseAngle, speed: baseSpeed * 0.4 }; // Slow when vulnerable
        } else {
            this.weakPointPhase = false;
            this.color = GameConfig.ENEMY_TYPES[this.type].color;
            return { angle: baseAngle, speed: baseSpeed * 0.8 }; // Slightly slower than normal
        }
    }

    getFortressModifications(player, config, baseAngle, baseSpeed) {
        this.currentPhase = this.currentPhase || 0;
        this.phaseTimer = this.phaseTimer || 0;

        const phases = config.phases || ['charging', 'firing', 'vulnerable'];
        const phaseTime = config.phaseTime || 240;
        const phase = phases[this.currentPhase];

        let speed = 0; // Fortress is mostly stationary
        let color = GameConfig.ENEMY_TYPES[this.type].color;

        switch (phase) {
            case 'charging':
                color = '#ffaa00';
                break;
            case 'firing':
                color = '#ff0000';
                break;
            case 'vulnerable':
                color = '#00ff00';
                speed = baseSpeed * 0.3; // Slight movement when vulnerable
                break;
        }

        this.color = color;
        this.phaseTimer++;
        if (this.phaseTimer >= phaseTime) {
            this.currentPhase = (this.currentPhase + 1) % phases.length;
            this.phaseTimer = 0;
        }

        return { angle: baseAngle, speed: speed };
    }

    blendAngles(angle1, angle2, weight) {
        // Blend two angles smoothly
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return angle1 + diff * weight;
    }

    applyMovement(angle, speed) {
        // Smooth rotation towards target angle
        let angleDiff = angle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * 0.15; // Slightly faster rotation for better responsiveness

        // Calculate movement
        const moveX = Math.cos(this.angle) * speed;
        const moveY = Math.sin(this.angle) * speed;

        // Apply movement with boundary checking
        const newX = this.x + moveX;
        const newY = this.y + moveY;

        // Keep within bounds with margin
        const margin = this.size; // Use enemy's own size as margin, same as player
        const topOffset = 80; // Account for HUD height
        const maxX = GameConfig.SPACE_WIDTH - margin;
        const maxY = GameConfig.SPACE_HEIGHT - margin;

        // Clamp position to boundaries
        this.x = Math.max(margin, Math.min(maxX, newX));
        this.y = Math.max(margin + topOffset, Math.min(maxY, newY));

        // If we hit a boundary, adjust angle to move away from it
        if (this.x <= margin || this.x >= maxX || this.y <= margin + topOffset || this.y >= maxY) {
            // Calculate angle toward center of playfield
            const centerX = GameConfig.SPACE_WIDTH / 2;
            const centerY = GameConfig.SPACE_HEIGHT / 2;
            const toCenterAngle = Math.atan2(centerY - this.y, centerX - this.x);

            // Blend current angle with center angle to avoid getting stuck
            this.angle = this.blendAngles(this.angle, toCenterAngle, 0.3);
        }
    }

    takeDamage(damage) {
        const config = GameConfig.ENEMY_TYPES[this.type];
        let finalDamage = damage;

        // Weak point system - extra damage during vulnerable phases
        if (config.weakPoint) {
            if (this.chargingPhase || this.weakPointPhase ||
                (this.currentPhase !== undefined && config.phases && config.phases[this.currentPhase] === 'vulnerable')) {
                finalDamage *= 2; // Double damage during weak point

                // Visual feedback for weak point hit
                this.weakPointHit = 30; // Flash for 0.5 seconds
            }
        }

        // Guardian damage reduction for protected allies
        if (config.behavior === 'guardian' && this.nearbyAllies > 0) {
            finalDamage *= (1 - config.damageReduction);
        }

        this.health -= finalDamage;
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

        // Wave management
        this.waveInProgress = false;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        this.waveTransitionTimer = 0;
        this.waveStartDelay = 180; // 3 seconds at 60fps
        this.bloodlustTimer = 0; // For berserker bloodlust ability
        this.stealthTimer = 0; // For assassin stealth ability
        this.turrets = []; // For engineer auto-turrets
        this.hazards = []; // Environmental hazards for strategic positioning
        this.gameRunning = false; // Start paused for class selection
        this.gameStarted = false;
        this.selectedClass = null;

        // Level system - Faster progression for easier upgrades
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 150; // Much easier to get first upgrade
        this.showLevelUpMenu = false;
        this.levelUpOptions = [];

        // Player stats (tracked for upgrades)
        this.playerStats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            speedMultiplier: 1,
            maxHealthBonus: 0,
            maxShieldBonus: 0,
            multiShotCount: 0,
            piercingShots: false,
            dashDamage: false,
            explosiveShots: false,
            magneticField: false,
            shieldRegen: false,
            vampiric: false,
            // New class-specific abilities
            dashMultiplier: 1,
            stealthDash: false,
            shadowStrike: false,
            damageReduction: 0,
            thornsDamage: false,
            fortressMode: false,
            homingShots: false,
            criticalChance: 0,
            rangedBonus: false,
            headshotChance: 0,
            projectileSpeedMultiplier: 1,
            rageMode: false,
            rageDamage: false,
            bloodlust: false,
            rampage: false,
            autoTurret: false,
            autoRepair: false
        };

        // All possible upgrades with class restrictions
        this.upgradePool = [
            // Universal stat upgrades (available to all classes)
            { id: 'damage1', name: 'Weapon Upgrade', description: '+10% weapon damage', rarity: 'common', classes: ['all'], effect: () => this.playerStats.damageMultiplier += 0.10 },
            { id: 'damage2', name: 'Advanced Targeting', description: '+18% weapon damage', rarity: 'uncommon', classes: ['all'], effect: () => this.playerStats.damageMultiplier += 0.18 },
            { id: 'firerate1', name: 'Rapid Fire', description: '+12% fire rate', rarity: 'common', classes: ['all'], effect: () => this.playerStats.fireRateMultiplier += 0.12 },
            { id: 'firerate2', name: 'Auto-Loader', description: '+22% fire rate', rarity: 'uncommon', classes: ['all'], effect: () => this.playerStats.fireRateMultiplier += 0.22 },
            { id: 'speed1', name: 'Engine Boost', description: '+10% movement speed', rarity: 'common', classes: ['all'], effect: () => this.playerStats.speedMultiplier += 0.10 },
            { id: 'speed2', name: 'Afterburners', description: '+18% movement speed', rarity: 'uncommon', classes: ['all'], effect: () => this.playerStats.speedMultiplier += 0.18 },
            { id: 'health1', name: 'Hull Plating', description: '+20 max health', rarity: 'common', classes: ['all'], effect: () => { this.playerStats.maxHealthBonus += 20; this.player.maxHealth += 20; this.player.health += 20; } },
            { id: 'health2', name: 'Reinforced Hull', description: '+35 max health', rarity: 'uncommon', classes: ['all'], effect: () => { this.playerStats.maxHealthBonus += 35; this.player.maxHealth += 35; this.player.health += 35; } },
            { id: 'shield1', name: 'Shield Generator', description: '+18 max shield', rarity: 'common', classes: ['all'], effect: () => { this.playerStats.maxShieldBonus += 18; this.player.maxShield += 18; this.player.shield += 18; } },
            { id: 'shield2', name: 'Advanced Shields', description: '+28 max shield', rarity: 'uncommon', classes: ['all'], effect: () => { this.playerStats.maxShieldBonus += 28; this.player.maxShield += 28; this.player.shield += 28; } },

            // Class-specific special abilities
            { id: 'multishot1', name: 'Twin Cannons', description: 'Fire 2 projectiles', rarity: 'uncommon', classes: ['hunter', 'engineer', 'berserker'], effect: () => this.playerStats.multiShotCount = 1 },
            { id: 'multishot2', name: 'Triple Threat', description: 'Fire 3 projectiles', rarity: 'rare', classes: ['hunter', 'engineer'], effect: () => this.playerStats.multiShotCount = Math.max(this.playerStats.multiShotCount, 2) },
            { id: 'piercing', name: 'Piercing Rounds', description: 'Shots pierce through enemies', rarity: 'rare', classes: ['hunter', 'tank'], effect: () => this.playerStats.piercingShots = true },
            { id: 'explosive', name: 'Explosive Rounds', description: 'Shots explode on impact', rarity: 'rare', classes: ['engineer', 'berserker', 'tank'], effect: () => this.playerStats.explosiveShots = true },
            {
                id: 'shieldregen', name: 'Shield Regenerator', description: 'Shields regenerate faster', rarity: 'uncommon', classes: ['tank', 'engineer'], effect: () => {
                    this.playerStats.shieldRegen = true;
                    this.player.shieldRegenBonus = true;
                }
            },
            { id: 'vampiric', name: 'Life Steal', description: 'Gain health when killing enemies', rarity: 'rare', classes: ['berserker', 'assassin'], effect: () => this.playerStats.vampiric = true },

            // Assassin-specific abilities
            { id: 'dashdamage', name: 'Ramming Speed', description: 'Dashing through enemies deals damage', rarity: 'rare', classes: ['assassin'], effect: () => this.playerStats.dashDamage = true },
            { id: 'shadowstrike', name: 'Shadow Strike', description: '+100% dash distance and damage', rarity: 'rare', classes: ['assassin'], effect: () => { this.playerStats.dashMultiplier += 1.0; this.playerStats.shadowStrike = true; } },
            { id: 'stealth', name: 'Cloaking Device', description: 'Brief invisibility after dash', rarity: 'uncommon', classes: ['assassin'], effect: () => this.playerStats.stealthDash = true },

            // Tank-specific abilities
            { id: 'armor', name: 'Reactive Armor', description: 'Reduce incoming damage by 25%', rarity: 'uncommon', classes: ['tank'], effect: () => this.playerStats.damageReduction += 0.25 },
            { id: 'thorns', name: 'Thorn Plating', description: 'Reflect damage to attackers', rarity: 'rare', classes: ['tank'], effect: () => this.playerStats.thornsDamage = true },
            { id: 'fortress', name: 'Fortress Mode', description: 'Stationary = +50% damage, +50% damage reduction', rarity: 'rare', classes: ['tank'], effect: () => this.playerStats.fortressMode = true },

            // Hunter-specific abilities
            { id: 'tracking', name: 'Target Tracking', description: 'Projectiles home in on enemies', rarity: 'rare', classes: ['hunter'], effect: () => this.playerStats.homingShots = true },
            { id: 'criticals', name: 'Critical Strikes', description: '20% chance for 2.5x damage', rarity: 'uncommon', classes: ['hunter', 'sniper'], effect: () => this.playerStats.criticalChance = 0.2 },
            { id: 'marksman', name: 'Marksman Training', description: '+50% damage at long range', rarity: 'uncommon', classes: ['hunter', 'sniper'], effect: () => this.playerStats.rangedBonus = true },

            // Sniper-specific abilities
            { id: 'headshot', name: 'Headshot Mastery', description: '50% chance for instant kill on low-health enemies', rarity: 'rare', classes: ['sniper'], effect: () => this.playerStats.headshotChance = 0.5 },
            { id: 'scope', name: 'Enhanced Scope', description: '+100% projectile speed and range', rarity: 'uncommon', classes: ['sniper'], effect: () => this.playerStats.projectileSpeedMultiplier += 1.0 },

            // Berserker-specific abilities
            { id: 'rage', name: 'Berserker Rage', description: 'Low health = higher damage and speed', rarity: 'uncommon', classes: ['berserker'], effect: () => this.playerStats.rageMode = true },
            { id: 'bloodlust', name: 'Bloodlust', description: 'Kills increase damage for 5 seconds', rarity: 'rare', classes: ['berserker'], effect: () => this.playerStats.bloodlust = true },
            { id: 'rampage', name: 'Rampage', description: 'Each kill reduces all cooldowns', rarity: 'rare', classes: ['berserker'], effect: () => this.playerStats.rampage = true },

            // Engineer-specific abilities
            { id: 'magnetic', name: 'Magnetic Field', description: 'Attract items from distance', rarity: 'uncommon', classes: ['engineer'], effect: () => this.playerStats.magneticField = true },
            {
                id: 'turret', name: 'Auto-Turret', description: 'Deploy a stationary turret', rarity: 'rare', classes: ['engineer'], effect: () => {
                    this.playerStats.autoTurret = true;
                    this.deployTurret();
                }
            },
            { id: 'repair', name: 'Auto-Repair', description: 'Slowly regenerate health over time', rarity: 'uncommon', classes: ['engineer'], effect: () => this.playerStats.autoRepair = true }
        ];

        // Initialize systems
        this.camera = new Camera(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT, this.canvas);
        this.player = new Player(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);

        // Class configurations - Reworked for better shield/health balance
        this.classConfigs = {
            tank: {
                healthMultiplier: 1.8,  // High health tank
                shieldMultiplier: 1.6,  // High shields too - ultimate defense
                speedMultiplier: 0.7,
                damageMultiplier: 1.0,
                fireRateMultiplier: 1.0,
                dashMultiplier: 1.0,
                special: null,
                startingWeapon: 0, // PHOTON
                playerColor: '#4488ff',
                description: 'Heavy armor, high health and shields'
            },
            hunter: {
                healthMultiplier: 0.9,   // Balanced health
                shieldMultiplier: 1.1,   // Slightly above average shields
                speedMultiplier: 1.0,
                damageMultiplier: 1.4,
                fireRateMultiplier: 1.5,
                dashMultiplier: 1.0,
                special: null,
                startingWeapon: 1, // SCATTER
                playerColor: '#ff8800',
                description: 'Balanced survivability, high damage output'
            },
            assassin: {
                healthMultiplier: 0.7,   // Slightly higher health for survivability
                shieldMultiplier: 0.5,   // Slightly higher shields
                speedMultiplier: 1.4,
                damageMultiplier: 1.3,
                fireRateMultiplier: 1.2, // Faster attacks for hit-and-run
                dashMultiplier: 1.8,
                special: null,
                startingWeapon: 3, // PLASMA
                playerColor: '#aa00ff',
                description: 'Fragile but fast, relies on mobility'
            },
            engineer: {
                healthMultiplier: 0.8,   // Lower health
                shieldMultiplier: 1.6,   // High shields but not overpowered
                speedMultiplier: 0.8,
                damageMultiplier: 0.9,   // Slightly lower damage to balance utility
                fireRateMultiplier: 1.0,
                dashMultiplier: 1.0,
                special: 'multishot_and_regen',
                startingWeapon: 0, // PHOTON
                playerColor: '#00ffaa',
                description: 'Shield specialist with support abilities'
            },
            berserker: {
                healthMultiplier: 1.5,   // High health
                shieldMultiplier: 0.6,   // Low shields - health-focused warrior
                speedMultiplier: 1.0,
                damageMultiplier: 1.0,
                fireRateMultiplier: 1.0,
                dashMultiplier: 1.0,
                special: 'rage_damage',
                startingWeapon: 0, // PHOTON
                playerColor: '#ff4444',
                description: 'High health warrior, low shields'
            },
            sniper: {
                healthMultiplier: 0.7,   // Low health
                shieldMultiplier: 1.3,   // Above average shields for protection
                speedMultiplier: 0.9,
                damageMultiplier: 2.0,
                fireRateMultiplier: 0.6, // Slightly faster fire rate
                dashMultiplier: 1.0,
                special: 'piercing_shots',
                startingWeapon: 2, // BEAM
                playerColor: '#00ff88',
                description: 'Long-range specialist with shield protection'
            }
        };

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
                size: Math.random() * 30 + 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    spawnInitialEnemies() {
        // Don't spawn initial enemies - wait for wave system to start
        // This prevents random enemies from appearing before the first wave
    }

    spawnEnemy(x, y, type = null) {
        if (!type) {
            // Select enemy type based on current wave
            const availableTypes = Object.entries(GameConfig.ENEMY_TYPES)
                .filter(([_, config]) => this.wave >= config.minWave && this.wave <= config.maxWave);

            if (availableTypes.length === 0) {
                // Fallback to scout if no types available
                type = 'scout';
            } else {
                // Weighted random selection
                const totalWeight = availableTypes.reduce((sum, [_, config]) => sum + config.spawnWeight, 0);
                let random = Math.random() * totalWeight;

                for (const [typeName, config] of availableTypes) {
                    random -= config.spawnWeight;
                    if (random <= 0) {
                        type = typeName;
                        break;
                    }
                }
            }
        }

        const enemy = new Enemy(x, y, type, this.wave);
        this.enemies.push(enemy);

        // Track enemies in current wave
        if (this.waveInProgress) {
            this.enemiesInWave++;
        }
    }

    spawnHazard() {
        const hazardTypes = ['energy_field', 'asteroid_field', 'gravity_well'];
        const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];

        // Spawn hazard near player but not too close
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;

        const hazard = {
            x: Math.max(100, Math.min(GameConfig.SPACE_WIDTH - 100, x)),
            y: Math.max(100, Math.min(GameConfig.SPACE_HEIGHT - 100, y)),
            type: type,
            size: 80 + Math.random() * 40,
            duration: 600 + Math.random() * 300, // 10-15 seconds
            intensity: 0.5 + Math.random() * 0.5,
            pulseTimer: 0
        };

        this.hazards.push(hazard);
    }



    updateHazards() {
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            hazard.duration--;
            hazard.pulseTimer++;

            if (hazard.duration <= 0) {
                this.hazards.splice(i, 1);
                continue;
            }

            // Apply hazard effects
            const playerDist = Math.sqrt((this.player.x - hazard.x) ** 2 + (this.player.y - hazard.y) ** 2);

            if (playerDist < hazard.size) {
                switch (hazard.type) {
                    case 'energy_field':
                        // Damages player and slows movement
                        if (hazard.pulseTimer % 30 === 0) {
                            this.player.takeDamage(5 * hazard.intensity);
                        }
                        this.player.speed *= 0.7;
                        break;
                    case 'asteroid_field':
                        // Blocks projectiles and slows movement
                        this.player.speed *= 0.5;
                        break;
                    case 'gravity_well':
                        // Pulls player toward center
                        const pullStrength = hazard.intensity * 2;
                        const dx = hazard.x - this.player.x;
                        const dy = hazard.y - this.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            this.player.x += (dx / dist) * pullStrength;
                            this.player.y += (dy / dist) * pullStrength;
                        }
                        break;
                }
            }

            // Affect enemies too
            this.enemies.forEach(enemy => {
                const enemyDist = Math.sqrt((enemy.x - hazard.x) ** 2 + (enemy.y - hazard.y) ** 2);
                if (enemyDist < hazard.size) {
                    switch (hazard.type) {
                        case 'energy_field':
                            enemy.speed *= 0.8;
                            break;
                        case 'asteroid_field':
                            enemy.speed *= 0.6;
                            break;
                        case 'gravity_well':
                            const pullStrength = hazard.intensity * 1.5;
                            const dx = hazard.x - enemy.x;
                            const dy = hazard.y - enemy.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist > 0) {
                                enemy.x += (dx / dist) * pullStrength;
                                enemy.y += (dy / dist) * pullStrength;
                            }
                            break;
                    }
                }
            });
        }
    }

    startWave() {
        this.waveInProgress = true;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;

        // Calculate enemies for this wave
        const enemiesThisWave = GameConfig.WAVE_CONFIG.BASE_ENEMIES_PER_WAVE +
            (this.wave - 1) * GameConfig.WAVE_CONFIG.ENEMIES_INCREASE_PER_WAVE;

        // Spawn enemies spread across the entire map - much more distributed
        const enemySize = 20; // Use average enemy size for spawning bounds
        for (let i = 0; i < enemiesThisWave; i++) {
            let x, y;
            const spawnType = i % 5; // 5 different spawn patterns

            switch (spawnType) {
                case 0: // Far corners of the map
                    const corner = Math.floor(Math.random() * 4);
                    const cornerOffset = 200 + Math.random() * 300;
                    switch (corner) {
                        case 0: x = cornerOffset; y = cornerOffset; break;
                        case 1: x = GameConfig.SPACE_WIDTH - cornerOffset; y = cornerOffset; break;
                        case 2: x = GameConfig.SPACE_WIDTH - cornerOffset; y = GameConfig.SPACE_HEIGHT - cornerOffset; break;
                        case 3: x = cornerOffset; y = GameConfig.SPACE_HEIGHT - cornerOffset; break;
                    }
                    break;

                case 1: // Map edges - very far from center
                    const edge = Math.floor(Math.random() * 4);
                    const edgeOffset = 100 + Math.random() * 200;
                    switch (edge) {
                        case 0: // Top
                            x = edgeOffset + Math.random() * (GameConfig.SPACE_WIDTH - 2 * edgeOffset);
                            y = enemySize + Math.random() * 150;
                            break;
                        case 1: // Right
                            x = GameConfig.SPACE_WIDTH - enemySize - Math.random() * 150;
                            y = edgeOffset + Math.random() * (GameConfig.SPACE_HEIGHT - 2 * edgeOffset);
                            break;
                        case 2: // Bottom
                            x = edgeOffset + Math.random() * (GameConfig.SPACE_WIDTH - 2 * edgeOffset);
                            y = GameConfig.SPACE_HEIGHT - enemySize - Math.random() * 150;
                            break;
                        case 3: // Left
                            x = enemySize + Math.random() * 150;
                            y = edgeOffset + Math.random() * (GameConfig.SPACE_HEIGHT - 2 * edgeOffset);
                            break;
                    }
                    break;

                case 2: // Random across entire map interior
                    x = 300 + Math.random() * (GameConfig.SPACE_WIDTH - 600);
                    y = 300 + Math.random() * (GameConfig.SPACE_HEIGHT - 600);
                    break;

                case 3: // Wide circle around player - much larger radius
                    const wideAngle = Math.random() * Math.PI * 2;
                    const wideDistance = 1200 + Math.random() * 800; // Much further out
                    x = this.player.x + Math.cos(wideAngle) * wideDistance;
                    y = this.player.y + Math.sin(wideAngle) * wideDistance;
                    break;

                case 4: // Opposite quadrants from player
                    const playerQuadX = this.player.x < GameConfig.SPACE_WIDTH / 2 ? 0 : 1;
                    const playerQuadY = this.player.y < GameConfig.SPACE_HEIGHT / 2 ? 0 : 1;
                    const oppositeQuadX = 1 - playerQuadX;
                    const oppositeQuadY = 1 - playerQuadY;

                    x = (oppositeQuadX * GameConfig.SPACE_WIDTH / 2) + Math.random() * (GameConfig.SPACE_WIDTH / 2);
                    y = (oppositeQuadY * GameConfig.SPACE_HEIGHT / 2) + Math.random() * (GameConfig.SPACE_HEIGHT / 2);
                    break;
            }

            // Ensure enemies spawn within world bounds - same as player bounds
            const clampedX = Math.max(enemySize, Math.min(GameConfig.SPACE_WIDTH - enemySize, x));
            const clampedY = Math.max(enemySize, Math.min(GameConfig.SPACE_HEIGHT - enemySize, y));

            // Ensure minimum distance from player to prevent instant contact
            const distanceFromPlayer = Math.sqrt((clampedX - this.player.x) ** 2 + (clampedY - this.player.y) ** 2);
            if (distanceFromPlayer > 500) { // Much larger minimum buffer
                this.spawnEnemy(clampedX, clampedY);
            } else {
                // If too close, push spawn point much further away
                const angle = Math.atan2(clampedY - this.player.y, clampedX - this.player.x);
                const safeX = this.player.x + Math.cos(angle) * 800; // Much further push
                const safeY = this.player.y + Math.sin(angle) * 800;
                const safeClamped = {
                    x: Math.max(enemySize, Math.min(GameConfig.SPACE_WIDTH - enemySize, safeX)),
                    y: Math.max(enemySize, Math.min(GameConfig.SPACE_HEIGHT - enemySize, safeY))
                };
                this.spawnEnemy(safeClamped.x, safeClamped.y);
            }
        }

        // Spawn strategic hazards for higher waves
        if (this.wave >= 5 && Math.random() < 0.4) {
            this.spawnHazard();
        }

        // Log enemy types for this wave
        const enemyTypes = this.enemies.slice(-enemiesThisWave).map(e => e.type);
        const typeCounts = {};
        enemyTypes.forEach(type => typeCounts[type] = (typeCounts[type] || 0) + 1);

        console.log(`Wave ${this.wave} started with ${enemiesThisWave} enemies:`, typeCounts);
    }

    checkWaveCompletion() {
        if (this.waveInProgress && this.enemiesKilledInWave >= this.enemiesInWave) {
            this.completeWave();
        }
    }

    completeWave() {
        this.waveInProgress = false;
        this.wave++;
        this.waveTransitionTimer = GameConfig.WAVE_CONFIG.WAVE_BREAK_DURATION;

        // Bonus score for completing wave
        this.score += this.wave * 100;

        console.log(`Wave ${this.wave - 1} completed! Starting wave ${this.wave} in ${this.waveTransitionTimer / 60} seconds`);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Level up menu controls
            if (this.showLevelUpMenu) {
                const keyNum = parseInt(e.key);

                if (keyNum >= 1 && keyNum <= 3) {
                    this.selectUpgrade(keyNum - 1);
                } else if (e.key === 'Escape') {
                    this.showLevelUpMenu = false;
                    this.gameRunning = true;
                }
                e.preventDefault();
            }
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

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;

            // Check level up menu clicks
            if (this.showLevelUpMenu && this.levelUpOptionBounds) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                for (let i = 0; i < this.levelUpOptionBounds.length; i++) {
                    const bounds = this.levelUpOptionBounds[i];
                    if (clickX >= bounds.x && clickX <= bounds.x + bounds.width &&
                        clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
                        this.selectUpgrade(i);
                        break;
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restart();
        });

        // Start game button
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('class-selection').classList.remove('hidden');
        });

        // Class selection
        document.querySelectorAll('.class-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const classType = e.currentTarget.getAttribute('data-class');
                this.selectClass(classType);
            });
        });
    }

    shoot() {
        if (this.fireTimer > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        this.fireTimer = Math.max(1, Math.floor(weapon.fireRate / this.playerStats.fireRateMultiplier));

        const angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

        // Apply stat modifiers
        let finalDamage = weapon.damage * this.playerStats.damageMultiplier;

        // Berserker rage damage - more damage when health is lower
        if (this.playerStats.rageDamage) {
            const healthPercent = this.player.health / this.player.maxHealth;
            const rageMultiplier = 1 + (1 - healthPercent) * 0.8; // Up to 80% more damage at low health
            finalDamage *= rageMultiplier;
        }

        // Bloodlust - damage increase after recent kills
        if (this.playerStats.bloodlust && this.bloodlustTimer > 0) {
            finalDamage *= 1.5; // 50% more damage during bloodlust
        }

        // Fortress Mode - bonus damage when stationary
        if (this.playerStats.fortressMode) {
            const isStationary = !this.keys['w'] && !this.keys['a'] && !this.keys['s'] && !this.keys['d'];
            if (isStationary) {
                finalDamage *= 1.5; // 50% more damage when not moving
            }
        }

        // Apply projectile speed multiplier
        const finalSpeed = weapon.speed * this.playerStats.projectileSpeedMultiplier;

        const projectile = new Projectile(
            this.player.x,
            this.player.y,
            Math.cos(angle) * finalSpeed,
            Math.sin(angle) * finalSpeed,
            weapon,
            finalDamage
        );

        // Add special properties
        projectile.piercing = this.playerStats.piercingShots;
        projectile.explosive = this.playerStats.explosiveShots;
        projectile.homing = this.playerStats.homingShots;

        this.projectiles.push(projectile);

        // Multi-shot ability
        if (this.playerStats.multiShotCount > 0) {
            for (let i = 1; i <= this.playerStats.multiShotCount; i++) {
                const spreadAngle = angle + (i % 2 === 1 ? 0.3 : -0.3) * Math.ceil(i / 2);
                const extraProjectile = new Projectile(
                    this.player.x,
                    this.player.y,
                    Math.cos(spreadAngle) * weapon.speed,
                    Math.sin(spreadAngle) * weapon.speed,
                    weapon,
                    finalDamage * 0.8 // Slightly less damage for extra shots
                );
                extraProjectile.piercing = this.playerStats.piercingShots;
                extraProjectile.explosive = this.playerStats.explosiveShots;
                extraProjectile.homing = this.playerStats.homingShots;
                this.projectiles.push(extraProjectile);
            }
        }

        this.projectiles.push(projectile);
    }

    update() {
        if (!this.gameRunning) return;

        // Update player
        const originalSpeed = this.player.speed;
        let finalSpeedMultiplier = this.playerStats.speedMultiplier;

        // Berserker rage mode - more speed when health is lower
        if (this.playerStats.rageMode) {
            const healthPercent = this.player.health / this.player.maxHealth;
            const rageSpeedBonus = (1 - healthPercent) * 0.5; // Up to 50% more speed at low health
            finalSpeedMultiplier += rageSpeedBonus;
        }

        this.player.speed = GameConfig.PLAYER.SPEED * finalSpeedMultiplier;
        this.player.dashingThisFrame = false; // Reset dash flag

        // Store dash multiplier for player to use
        this.player.dashMultiplier = this.playerStats.dashMultiplier;

        this.player.update(this.keys, this.canvas);
        this.player.speed = originalSpeed; // Reset for consistency

        // Check stealth activation after dash
        if (this.player.dashingThisFrame && this.playerStats.stealthDash) {
            this.stealthTimer = 120; // 2 seconds of stealth
        }

        // Check dash damage
        if (this.player.dashingThisFrame && this.playerStats.dashDamage) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.size + this.player.size + 40) { // Much more forgiving dash hitbox
                    let dashDamage = 50;

                    // Shadow Strike - enhanced dash damage
                    if (this.playerStats.shadowStrike) {
                        dashDamage = 100; // Double damage

                        // Create shadow particles
                        for (let k = 0; k < 8; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 10,
                                vy: (Math.random() - 0.5) * 10,
                                size: 3,
                                color: '#8800ff',
                                life: 40,
                                decay: 0.94
                            });
                        }
                    }

                    enemy.takeDamage(dashDamage);

                    // Create dash particles
                    for (let j = 0; j < 8; j++) {
                        this.particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 12,
                            vy: (Math.random() - 0.5) * 12,
                            life: 20,
                            color: '#ffaa00',
                            size: 3
                        });
                    }

                    if (enemy.isDead()) {
                        const points = enemy.getPoints() * this.combo;
                        this.score += points;
                        this.experience += points; // Full XP for faster progression

                        if (this.playerStats.vampiric) {
                            this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);
                        }

                        this.enemies.splice(i, 1);

                        // Track wave progress
                        if (this.waveInProgress) {
                            this.enemiesKilledInWave++;
                        }
                    }
                }
            }
        }

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
            enemy.update(this.player, this.enemies);

            // Check collision with projectiles
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const projectile = this.projectiles[j];
                const dx = enemy.x - projectile.x;
                const dy = enemy.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.size + projectile.size) {
                    let finalDamage = projectile.damage;

                    // Critical hit chance
                    if (this.playerStats.criticalChance > 0 && Math.random() < this.playerStats.criticalChance) {
                        finalDamage *= 3; // 3x damage on crit
                        // Create crit particles
                        for (let k = 0; k < 8; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                size: 3,
                                color: '#ffff00',
                                life: 30,
                                decay: 0.95
                            });
                        }
                    }

                    // Ranged damage bonus
                    if (this.playerStats.rangedBonus) {
                        const distanceToPlayer = Math.sqrt((enemy.x - this.player.x) ** 2 + (enemy.y - this.player.y) ** 2);
                        if (distanceToPlayer > 200) { // Long range
                            finalDamage *= 1.5;
                        }
                    }

                    // Headshot chance (instant kill on low health enemies)
                    if (this.playerStats.headshotChance > 0 && Math.random() < this.playerStats.headshotChance) {
                        if (enemy.health <= enemy.maxHealth * 0.3) { // 30% health or less
                            finalDamage = enemy.health; // Instant kill
                            // Create headshot particles
                            for (let k = 0; k < 10; k++) {
                                this.particles.push({
                                    x: enemy.x,
                                    y: enemy.y - enemy.size,
                                    vx: (Math.random() - 0.5) * 6,
                                    vy: -Math.random() * 8,
                                    size: 2,
                                    color: '#ff0000',
                                    life: 50,
                                    decay: 0.96
                                });
                            }
                        }
                    }

                    enemy.takeDamage(finalDamage);

                    // Explosive shots
                    if (projectile.explosive) {
                        // Damage nearby enemies
                        for (let k = 0; k < this.enemies.length; k++) {
                            if (k === i) continue; // Skip the hit enemy
                            const otherEnemy = this.enemies[k];
                            const explosionDist = Math.sqrt((otherEnemy.x - enemy.x) ** 2 + (otherEnemy.y - enemy.y) ** 2);
                            if (explosionDist < 60) { // Explosion radius
                                otherEnemy.takeDamage(finalDamage * 0.5); // Half damage to nearby enemies
                            }
                        }

                        // Create explosion particles
                        for (let k = 0; k < 15; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 12,
                                vy: (Math.random() - 0.5) * 12,
                                size: 4,
                                color: '#ff6600',
                                life: 40,
                                decay: 0.92
                            });
                        }
                    }

                    // Remove projectile unless it's piercing
                    if (!projectile.piercing) {
                        this.projectiles.splice(j, 1);
                    }

                    if (enemy.isDead()) {
                        const points = enemy.getPoints() * this.combo;
                        this.score += points;
                        this.experience += points; // Full XP for faster progression
                        this.combo = Math.min(10, this.combo + 1);
                        this.comboTimer = 180;

                        // Vampiric healing
                        if (this.playerStats.vampiric) {
                            this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);
                        }

                        // Bloodlust - damage increase after kills
                        if (this.playerStats.bloodlust) {
                            this.bloodlustTimer = 300; // 5 seconds at 60fps
                        }

                        // Rampage - reduce all cooldowns on kill
                        if (this.playerStats.rampage) {
                            // Reduce dash cooldown
                            if (this.player.dashCooldown > 0) {
                                this.player.dashCooldown = Math.max(0, this.player.dashCooldown - 30);
                            }
                            // Add other cooldown reductions here if needed
                        }

                        this.checkLevelUp();
                        this.enemies.splice(i, 1);

                        // Track wave progress
                        if (this.waveInProgress) {
                            this.enemiesKilledInWave++;
                        }
                    }
                    break;
                }
            }

            // Check collision with player
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size + this.player.size) {
                // Much more punishing damage scaling
                let finalDamage = enemy.damage;

                // Size scaling - bigger enemies hit much harder (adjusted for new base sizes)
                const sizeMultiplier = 1 + (enemy.size - 12) * 0.08; // 8% per size point above 12 (new base)

                // Speed scaling - faster enemies hit much harder  
                const speedMultiplier = 1 + (enemy.speed - 1) * 0.4; // 40% per speed point above 1

                // Wave scaling - later waves are devastating
                const waveMultiplier = 1 + (this.wave - 1) * 0.1; // 10% per wave

                // Apply all multipliers for devastating damage
                finalDamage = Math.floor(finalDamage * sizeMultiplier * speedMultiplier * waveMultiplier);

                // Apply damage reduction from armor
                if (this.playerStats.damageReduction > 0) {
                    finalDamage *= (1 - this.playerStats.damageReduction);
                }

                // Fortress Mode - additional damage reduction when stationary
                if (this.playerStats.fortressMode) {
                    const isStationary = !this.keys['w'] && !this.keys['a'] && !this.keys['s'] && !this.keys['d'];
                    if (isStationary) {
                        finalDamage *= 0.5; // 50% damage reduction when not moving
                    }
                }

                // Stealth - enemies can't see stealthed player
                if (this.stealthTimer > 0) {
                    continue; // Skip collision when stealthed
                }

                if (this.player.takeDamage(finalDamage)) {
                    // Thorn damage - reflect damage back to attacker
                    if (this.playerStats.thornsDamage) {
                        enemy.takeDamage(finalDamage * 0.5); // Reflect 50% of damage

                        // Create thorn particles
                        for (let k = 0; k < 6; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                size: 2,
                                color: '#ffaa00',
                                life: 35,
                                decay: 0.93
                            });
                        }
                    }

                    // Create much more dramatic hit particles for devastating damage
                    const particleCount = Math.min(25, Math.floor(finalDamage / 4)); // More particles for higher damage
                    for (let k = 0; k < particleCount; k++) {
                        this.particles.push({
                            x: this.player.x,
                            y: this.player.y,
                            vx: (Math.random() - 0.5) * 12,
                            vy: (Math.random() - 0.5) * 12,
                            life: 45,
                            color: k % 2 === 0 ? '#ff0000' : '#ffaa00',
                            size: 3 + Math.random() * 2
                        });
                    }

                    // Much stronger screen shake for devastating hits
                    this.screenShake = Math.min(40, Math.floor(finalDamage / 2));
                }
                // Remove enemy on contact (kamikaze style)
                this.enemies.splice(i, 1);

                // Track wave progress
                if (this.waveInProgress) {
                    this.enemiesKilledInWave++;
                }
                i--; // Adjust index since we removed an element
                continue;
            }

            // Check collision with turrets
            for (let t = 0; t < this.turrets.length; t++) {
                const turret = this.turrets[t];
                const tdx = enemy.x - turret.x;
                const tdy = enemy.y - turret.y;
                const tdistance = Math.sqrt(tdx * tdx + tdy * tdy);

                if (tdistance < enemy.size + 12) { // 12 is turret size
                    turret.health -= enemy.damage;

                    // Create hit particles
                    for (let k = 0; k < 3; k++) {
                        this.particles.push({
                            x: turret.x,
                            y: turret.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 25,
                            color: '#ff6600',
                            size: 2
                        });
                    }

                    // Remove enemy on contact
                    this.enemies.splice(i, 1);

                    // Track wave progress
                    if (this.waveInProgress) {
                        this.enemiesKilledInWave++;
                    }

                    i--; // Adjust index since we removed an element
                    break;
                }
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(this.enemies);

            if (!projectile.isAlive() || !projectile.isInBounds(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT)) {
                this.projectiles.splice(i, 1);
            }
        }

        // Wave management
        if (this.waveTransitionTimer > 0) {
            this.waveTransitionTimer--;
            if (this.waveTransitionTimer === 0) {
                this.startWave();
            }
        } else if (!this.waveInProgress && this.enemies.length === 0) {
            // Start first wave or next wave if no enemies remain
            this.startWave();
        }

        // Check wave completion
        this.checkWaveCompletion();

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

        // Update bloodlust timer
        if (this.bloodlustTimer > 0) {
            this.bloodlustTimer--;
        }

        // Update stealth timer
        if (this.stealthTimer > 0) {
            this.stealthTimer--;
        }

        // Update hazards
        this.updateHazards();

        // Auto-repair - slowly regenerate health
        if (this.playerStats.autoRepair && this.player.health < this.player.maxHealth) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.2); // Slow health regen
        }

        // Update turrets
        this.updateTurrets();

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

            // Stealth effect - make player semi-transparent
            if (this.stealthTimer > 0) {
                this.ctx.globalAlpha = 0.3; // Very transparent when stealthed
            }

            // Calculate angle to mouse for ship rotation
            const angleToMouse = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
            this.ctx.rotate(angleToMouse);

            // Class-specific ship designs
            this.ctx.fillStyle = this.player.color;
            this.ctx.strokeStyle = this.player.color;
            this.ctx.lineWidth = 1.5;

            if (this.selectedClass === 'tank') {
                // Tank: Bulky, armored design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 2, 0);
                this.ctx.lineTo(this.player.size - 2, -5);
                this.ctx.lineTo(-this.player.size + 4, -4);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 4, 4);
                this.ctx.lineTo(this.player.size - 2, 5);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Armor plating
                this.ctx.fillStyle = '#6699ff';
                this.ctx.fillRect(-8, -3, 6, 6);
                this.ctx.fillRect(-2, -4, 4, 8);

            } else if (this.selectedClass === 'hunter') {
                // Hunter: Aggressive, angular design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 3, 0);
                this.ctx.lineTo(this.player.size - 2, -2);
                this.ctx.lineTo(-this.player.size + 2, -3);
                this.ctx.lineTo(-this.player.size - 2, 0);
                this.ctx.lineTo(-this.player.size + 2, 3);
                this.ctx.lineTo(this.player.size - 2, 2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Weapon pods
                this.ctx.fillStyle = '#ffaa44';
                this.ctx.fillRect(2, -5, 8, 2);
                this.ctx.fillRect(2, 3, 8, 2);

            } else if (this.selectedClass === 'assassin') {
                // Assassin: Sleek, blade-like design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 4, 0);
                this.ctx.lineTo(this.player.size - 6, -1);
                this.ctx.lineTo(-this.player.size + 1, -1);
                this.ctx.lineTo(-this.player.size - 1, 0);
                this.ctx.lineTo(-this.player.size + 1, 1);
                this.ctx.lineTo(this.player.size - 6, 1);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Stealth fins
                this.ctx.fillStyle = '#cc66ff';
                this.ctx.beginPath();
                this.ctx.moveTo(-4, -4);
                this.ctx.lineTo(-10, -2);
                this.ctx.lineTo(-8, 0);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(-4, 4);
                this.ctx.lineTo(-10, 2);
                this.ctx.lineTo(-8, 0);
                this.ctx.closePath();
                this.ctx.fill();

            } else if (this.selectedClass === 'engineer') {
                // Engineer: Utility-focused with tech details
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 1, 0);
                this.ctx.lineTo(this.player.size - 3, -4);
                this.ctx.lineTo(-this.player.size + 3, -3);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 3, 3);
                this.ctx.lineTo(this.player.size - 3, 4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Tech modules
                this.ctx.fillStyle = '#44ffcc';
                this.ctx.fillRect(-6, -2, 3, 4);
                this.ctx.fillRect(-2, -3, 2, 6);
                this.ctx.fillRect(2, -2, 2, 4);

            } else if (this.selectedClass === 'berserker') {
                // Berserker: Brutal, spiked design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 2, 0);
                this.ctx.lineTo(this.player.size - 1, -4);
                this.ctx.lineTo(-this.player.size + 2, -4);
                this.ctx.lineTo(-this.player.size, 0);
                this.ctx.lineTo(-this.player.size + 2, 4);
                this.ctx.lineTo(this.player.size - 1, 4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Battle spikes
                this.ctx.fillStyle = '#ff6666';
                this.ctx.beginPath();
                this.ctx.moveTo(-2, -6);
                this.ctx.lineTo(-6, -5);
                this.ctx.lineTo(-4, -3);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(-2, 6);
                this.ctx.lineTo(-6, 5);
                this.ctx.lineTo(-4, 3);
                this.ctx.closePath();
                this.ctx.fill();

            } else if (this.selectedClass === 'sniper') {
                // Sniper: Long, rifle-like design
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.size + 5, 0);
                this.ctx.lineTo(this.player.size - 8, -1);
                this.ctx.lineTo(-this.player.size + 1, -2);
                this.ctx.lineTo(-this.player.size - 2, 0);
                this.ctx.lineTo(-this.player.size + 1, 2);
                this.ctx.lineTo(this.player.size - 8, 1);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Scope/barrel
                this.ctx.fillStyle = '#66ff99';
                this.ctx.fillRect(6, -1, 8, 2);
                this.ctx.fillRect(-8, -1, 4, 2);

            } else {
                // Default design
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
            }

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
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            this.ctx.rotate(enemy.angle);

            // Draw spaceship based on type
            this.drawEnemySpaceship(enemy);

            this.ctx.restore();

            // Enemy health bar
            if (enemy.health < enemy.maxHealth) {
                const barWidth = enemy.size * 2;
                const barHeight = 3;
                const x = enemy.x - barWidth / 2;
                const y = enemy.y - enemy.size - 12;

                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(x, y, barWidth, barHeight);

                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
            }
        });

        // Render hazards
        this.renderHazards();

        // Render turrets
        this.turrets.forEach(turret => {
            // Turret base
            this.ctx.fillStyle = '#666666';
            this.ctx.beginPath();
            this.ctx.arc(turret.x, turret.y, 12, 0, Math.PI * 2);
            this.ctx.fill();

            // Turret cannon
            this.ctx.fillStyle = '#888888';
            this.ctx.beginPath();
            this.ctx.arc(turret.x, turret.y, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Turret health bar
            if (turret.health < turret.maxHealth) {
                const barWidth = 24;
                const barHeight = 3;
                const x = turret.x - barWidth / 2;
                const y = turret.y - 20;

                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(x, y, barWidth, barHeight);

                const healthPercent = turret.health / turret.maxHealth;
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
            }

            // Render turret projectiles
            turret.projectiles.forEach(projectile => {
                this.ctx.fillStyle = projectile.color;
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
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
        const xpFill = document.getElementById('xp-fill');
        const levelElement = document.getElementById('level');
        const xpText = document.getElementById('xp-text');
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

        if (xpFill) {
            const xpPercent = (this.experience / this.experienceToNext) * 100;
            xpFill.style.width = `${xpPercent}%`;
        }

        if (levelElement) levelElement.textContent = this.level;
        if (xpText) xpText.textContent = `${this.experience}/${this.experienceToNext}`;
        if (scoreElement) scoreElement.textContent = this.score;
        if (waveElement) {
            if (this.waveTransitionTimer > 0) {
                const seconds = Math.ceil(this.waveTransitionTimer / 60);
                waveElement.textContent = `${this.wave} (Starting in ${seconds}s)`;
            } else if (this.waveInProgress) {
                const remaining = this.enemiesInWave - this.enemiesKilledInWave;
                waveElement.textContent = `${this.wave} (${remaining} enemies left)`;
            } else {
                waveElement.textContent = this.wave;
            }
        }
        if (comboElement) comboElement.textContent = `x${this.combo}`;

        // Render minimap
        this.renderMinimap();

        // Render level up menu
        if (this.showLevelUpMenu) {
            this.renderLevelUpMenu();
        }
    }

    drawEnemySpaceship(enemy) {
        const size = enemy.size;
        const config = GameConfig.ENEMY_TYPES[enemy.type];

        // Strategic behavior visual indicators
        this.drawBehaviorIndicators(enemy, config);

        // Update thruster flicker
        enemy.thrusterFlicker = (enemy.thrusterFlicker + 1) % 20;

        switch (enemy.shape) {
            case 'triangle': // Scout - Sleek reconnaissance drone
                this.drawScout(size, enemy);
                break;

            case 'diamond': // Fighter - Aggressive interceptor
                this.drawFighter(size, enemy);
                break;

            case 'arrow': // Interceptor - Lightning-fast striker
                this.drawInterceptor(size, enemy);
                break;

            case 'hexagon': // Bomber - Heavy assault craft
                this.drawBomber(size, enemy);
                break;

            case 'cruiser': // Cruiser - Military warship
                this.drawCruiser(size, enemy);
                break;

            case 'destroyer': // Destroyer - Alien war machine
                this.drawDestroyer(size, enemy);
                break;

            case 'battleship': // Battleship - Massive fortress
                this.drawBattleship(size, enemy);
                break;

            case 'dreadnought': // Dreadnought - Ultimate alien mothership
                this.drawDreadnought(size, enemy);
                break;
        }
    }

    drawBehaviorIndicators(enemy, config) {
        // Weak point indicators
        if (config.weakPoint && (enemy.chargingPhase || enemy.weakPointPhase ||
            (enemy.currentPhase !== undefined && config.phases && config.phases[enemy.currentPhase] === 'vulnerable'))) {
            // Pulsing red outline for weak point
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.size + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        // Guardian shield indicator
        if (config.behavior === 'guardian' && config.shieldRadius) {
            this.ctx.strokeStyle = '#00aaff';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, config.shieldRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        // Commander buff indicator
        if (config.behavior === 'commander' && config.commandRadius) {
            this.ctx.strokeStyle = '#ffaa00';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, config.commandRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        // Formation indicators for swarm behavior
        if (config.behavior === 'swarm' && enemy.speed > GameConfig.ENEMY_TYPES[enemy.type].speed) {
            // Small triangular indicators around swarming enemies
            this.ctx.fillStyle = '#ffff00';
            this.ctx.globalAlpha = 0.6;
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2 / 3) + (Date.now() * 0.005);
                const x = Math.cos(angle) * (enemy.size + 12);
                const y = Math.sin(angle) * (enemy.size + 12);
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }

        // Weak point hit flash
        if (enemy.weakPointHit > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = enemy.weakPointHit / 30;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.size + 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            enemy.weakPointHit--;
        }
    }

    drawScout(size, enemy) {
        // Sleek triangular reconnaissance drone with sensor array

        // Engine trail
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.8, -size * 0.2);
            this.ctx.lineTo(-size * 1.1, 0);
            this.ctx.lineTo(-size * 0.8, size * 0.2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // Main hull - sleek triangle
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.9, 0);
        this.ctx.lineTo(-size * 0.6, -size * 0.4);
        this.ctx.lineTo(-size * 0.8, 0);
        this.ctx.lineTo(-size * 0.6, size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Sensor array (glowing blue)
        this.ctx.fillStyle = '#00aaff';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, 0, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing stabilizers
        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.05);
        this.ctx.fillRect(-size * 0.2, size * 0.05, size * 0.4, size * 0.05);
    }

    drawFighter(size, enemy) {
        // Aggressive diamond-shaped interceptor with weapon pods

        // Twin engine trails
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.7, -size * 0.3);
            this.ctx.lineTo(-size * 1.0, -size * 0.15);
            this.ctx.lineTo(-size * 0.7, -size * 0.1);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.7, size * 0.3);
            this.ctx.lineTo(-size * 1.0, size * 0.15);
            this.ctx.lineTo(-size * 0.7, size * 0.1);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // Main hull - angular diamond
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.8, 0);
        this.ctx.lineTo(size * 0.2, -size * 0.6);
        this.ctx.lineTo(-size * 0.5, -size * 0.3);
        this.ctx.lineTo(-size * 0.7, 0);
        this.ctx.lineTo(-size * 0.5, size * 0.3);
        this.ctx.lineTo(size * 0.2, size * 0.6);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Weapon pods (orange glow)
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.3, -size * 0.4, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.3, size * 0.4, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();

        // Cockpit
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(size * 0.1, -size * 0.15, size * 0.3, size * 0.3);
    }

    drawInterceptor(size, enemy) {
        // Lightning-fast arrow-shaped striker with swept wings

        // Single powerful engine
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.9;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.6, -size * 0.2);
            this.ctx.lineTo(-size * 1.2, 0);
            this.ctx.lineTo(-size * 0.6, size * 0.2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // Main hull - swept arrow design
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.9, 0);
        this.ctx.lineTo(size * 0.4, -size * 0.3);
        this.ctx.lineTo(size * 0.1, -size * 0.7);
        this.ctx.lineTo(-size * 0.3, -size * 0.4);
        this.ctx.lineTo(-size * 0.6, -size * 0.1);
        this.ctx.lineTo(-size * 0.6, size * 0.1);
        this.ctx.lineTo(-size * 0.3, size * 0.4);
        this.ctx.lineTo(size * 0.1, size * 0.7);
        this.ctx.lineTo(size * 0.4, size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Swept wing details
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.2, -size * 0.5);
        this.ctx.lineTo(-size * 0.1, -size * 0.3);
        this.ctx.lineTo(size * 0.0, -size * 0.2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.2, size * 0.5);
        this.ctx.lineTo(-size * 0.1, size * 0.3);
        this.ctx.lineTo(size * 0.0, size * 0.2);
        this.ctx.fill();

        // Speed stripes
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.3, -size * 0.1);
        this.ctx.lineTo(-size * 0.2, -size * 0.05);
        this.ctx.moveTo(size * 0.3, size * 0.1);
        this.ctx.lineTo(-size * 0.2, size * 0.05);
        this.ctx.stroke();
    }

    drawBomber(size, enemy) {
        // Heavy hexagonal assault craft with missile pods

        // Dual heavy engines
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.8, -size * 0.4);
            this.ctx.lineTo(-size * 1.1, -size * 0.2);
            this.ctx.lineTo(-size * 0.8, -size * 0.1);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.8, size * 0.4);
            this.ctx.lineTo(-size * 1.1, size * 0.2);
            this.ctx.lineTo(-size * 0.8, size * 0.1);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // Main hull - reinforced hexagon
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.7, 0);
        this.ctx.lineTo(size * 0.35, -size * 0.6);
        this.ctx.lineTo(-size * 0.35, -size * 0.6);
        this.ctx.lineTo(-size * 0.7, 0);
        this.ctx.lineTo(-size * 0.35, size * 0.6);
        this.ctx.lineTo(size * 0.35, size * 0.6);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Missile pods (red warning lights)
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.2, -size * 0.5, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.2, size * 0.5, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.2, -size * 0.5, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.2, size * 0.5, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        // Heavy armor plating
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(-size * 0.1, -size * 0.3, size * 0.5, size * 0.6);

        // Command center
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(size * 0.1, -size * 0.1, size * 0.2, size * 0.2);
    }

    drawCruiser(size, enemy) {
        // Military warship with advanced weapon systems

        // Triple engine array
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.8;
            for (let i = -1; i <= 1; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-size * 0.8, i * size * 0.25);
                this.ctx.lineTo(-size * 1.1, i * size * 0.15);
                this.ctx.lineTo(-size * 0.8, i * size * 0.1);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }

        // Main hull - elongated warship
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.8, 0);
        this.ctx.lineTo(size * 0.5, -size * 0.3);
        this.ctx.lineTo(size * 0.2, -size * 0.5);
        this.ctx.lineTo(-size * 0.2, -size * 0.4);
        this.ctx.lineTo(-size * 0.6, -size * 0.3);
        this.ctx.lineTo(-size * 0.8, -size * 0.1);
        this.ctx.lineTo(-size * 0.8, size * 0.1);
        this.ctx.lineTo(-size * 0.6, size * 0.3);
        this.ctx.lineTo(-size * 0.2, size * 0.4);
        this.ctx.lineTo(size * 0.2, size * 0.5);
        this.ctx.lineTo(size * 0.5, size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Weapon turrets
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.4, -size * 0.2, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.4, size * 0.2, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.1, -size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.1, size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();

        // Bridge tower
        this.ctx.fillStyle = '#00aaff';
        this.ctx.fillRect(size * 0.1, -size * 0.15, size * 0.3, size * 0.3);

        // Hull details
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.6, -size * 0.1);
        this.ctx.lineTo(-size * 0.4, -size * 0.1);
        this.ctx.moveTo(size * 0.6, size * 0.1);
        this.ctx.lineTo(-size * 0.4, size * 0.1);
        this.ctx.stroke();
    }

    drawDestroyer(size, enemy) {
        // Alien war machine with organic curves and energy weapons

        // Quad engine pods
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.9;
            const positions = [-0.4, -0.15, 0.15, 0.4];
            positions.forEach(pos => {
                this.ctx.beginPath();
                this.ctx.moveTo(-size * 0.9, pos * size);
                this.ctx.lineTo(-size * 1.2, pos * size * 0.7);
                this.ctx.lineTo(-size * 0.9, pos * size * 0.5);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
        }

        // Main hull - organic alien design
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.8, 0);
        // Curved organic shape
        this.ctx.quadraticCurveTo(size * 0.6, -size * 0.6, size * 0.2, -size * 0.7);
        this.ctx.quadraticCurveTo(-size * 0.2, -size * 0.8, -size * 0.6, -size * 0.5);
        this.ctx.quadraticCurveTo(-size * 0.9, -size * 0.2, -size * 0.9, 0);
        this.ctx.quadraticCurveTo(-size * 0.9, size * 0.2, -size * 0.6, size * 0.5);
        this.ctx.quadraticCurveTo(-size * 0.2, size * 0.8, size * 0.2, size * 0.7);
        this.ctx.quadraticCurveTo(size * 0.6, size * 0.6, size * 0.8, 0);
        this.ctx.fill();
        this.ctx.stroke();

        // Energy weapon arrays (pulsing purple)
        const pulseAlpha = 0.5 + 0.5 * Math.sin(enemy.thrusterFlicker * 0.3);
        this.ctx.fillStyle = `rgba(255, 0, 255, ${pulseAlpha})`;
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, -size * 0.3, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, size * 0.3, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.1, -size * 0.5, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.1, size * 0.5, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();

        // Alien bio-tech details
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.2, 0, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Organic ridges
        this.ctx.strokeStyle = '#88ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.4, -size * 0.2);
        this.ctx.quadraticCurveTo(0, -size * 0.1, -size * 0.3, -size * 0.3);
        this.ctx.moveTo(size * 0.4, size * 0.2);
        this.ctx.quadraticCurveTo(0, size * 0.1, -size * 0.3, size * 0.3);
        this.ctx.stroke();
    }

    drawBattleship(size, enemy) {
        // Massive fortress with multiple weapon decks and shield generators

        // Massive engine array
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 0.9;
            for (let i = -2; i <= 2; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-size * 0.9, i * size * 0.2);
                this.ctx.lineTo(-size * 1.3, i * size * 0.15);
                this.ctx.lineTo(-size * 0.9, i * size * 0.1);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }

        // Main hull - fortress-like structure
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.8, 0);
        this.ctx.lineTo(size * 0.6, -size * 0.4);
        this.ctx.lineTo(size * 0.4, -size * 0.7);
        this.ctx.lineTo(size * 0.1, -size * 0.8);
        this.ctx.lineTo(-size * 0.3, -size * 0.7);
        this.ctx.lineTo(-size * 0.6, -size * 0.5);
        this.ctx.lineTo(-size * 0.9, -size * 0.2);
        this.ctx.lineTo(-size * 0.9, size * 0.2);
        this.ctx.lineTo(-size * 0.6, size * 0.5);
        this.ctx.lineTo(-size * 0.3, size * 0.7);
        this.ctx.lineTo(size * 0.1, size * 0.8);
        this.ctx.lineTo(size * 0.4, size * 0.7);
        this.ctx.lineTo(size * 0.6, size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Multiple weapon decks
        this.ctx.fillStyle = '#ff3300';
        // Upper deck
        this.ctx.fillRect(size * 0.2, -size * 0.6, size * 0.4, size * 0.2);
        // Lower deck
        this.ctx.fillRect(size * 0.2, size * 0.4, size * 0.4, size * 0.2);
        // Side batteries
        this.ctx.fillRect(-size * 0.2, -size * 0.5, size * 0.3, size * 0.15);
        this.ctx.fillRect(-size * 0.2, size * 0.35, size * 0.3, size * 0.15);

        // Shield generators (glowing blue)
        this.ctx.fillStyle = '#00aaff';
        this.ctx.shadowColor = '#00aaff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(size * 0.1, -size * 0.4, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.1, size * 0.4, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.4, 0, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Command tower
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(size * 0.3, -size * 0.2, size * 0.3, size * 0.4);

        // Heavy armor plating
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(-size * 0.1, -size * 0.3, size * 0.4, size * 0.6);

        // Warning lights
        this.ctx.fillStyle = enemy.thrusterFlicker < 10 ? '#ff0000' : '#660000';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, -size * 0.3, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, size * 0.3, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawDreadnought(size, enemy) {
        // Ultimate alien mothership with bio-mechanical fusion

        // Massive bio-mechanical engines
        if (enemy.thrusterFlicker < 15) {
            this.ctx.fillStyle = enemy.thrusterColor;
            this.ctx.globalAlpha = 1.0;
            // Central massive thruster
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.9, -size * 0.3);
            this.ctx.lineTo(-size * 1.4, 0);
            this.ctx.lineTo(-size * 0.9, size * 0.3);
            this.ctx.fill();
            // Side thrusters
            for (let i = -1; i <= 1; i += 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(-size * 0.8, i * size * 0.6);
                this.ctx.lineTo(-size * 1.2, i * size * 0.4);
                this.ctx.lineTo(-size * 0.8, i * size * 0.3);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }

        // Main hull - organic mothership design
        this.ctx.fillStyle = enemy.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.9, 0);
        // Organic flowing curves
        this.ctx.quadraticCurveTo(size * 0.7, -size * 0.8, size * 0.3, -size * 0.9);
        this.ctx.quadraticCurveTo(-size * 0.1, -size * 1.0, -size * 0.5, -size * 0.7);
        this.ctx.quadraticCurveTo(-size * 0.8, -size * 0.4, -size * 0.9, -size * 0.1);
        this.ctx.quadraticCurveTo(-size * 0.95, 0, -size * 0.9, size * 0.1);
        this.ctx.quadraticCurveTo(-size * 0.8, size * 0.4, -size * 0.5, size * 0.7);
        this.ctx.quadraticCurveTo(-size * 0.1, size * 1.0, size * 0.3, size * 0.9);
        this.ctx.quadraticCurveTo(size * 0.7, size * 0.8, size * 0.9, 0);
        this.ctx.fill();
        this.ctx.stroke();

        // Central core (pulsing energy)
        const coreAlpha = 0.7 + 0.3 * Math.sin(enemy.thrusterFlicker * 0.2);
        this.ctx.fillStyle = `rgba(255, 255, 0, ${coreAlpha})`;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(size * 0.1, 0, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Bio-mechanical weapon pods
        const weaponAlpha = 0.6 + 0.4 * Math.sin(enemy.thrusterFlicker * 0.4);
        this.ctx.fillStyle = `rgba(255, 0, 128, ${weaponAlpha})`;
        this.ctx.shadowColor = '#ff0080';
        this.ctx.shadowBlur = 8;
        // Upper weapon cluster
        this.ctx.beginPath();
        this.ctx.arc(size * 0.4, -size * 0.5, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.6, -size * 0.3, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        // Lower weapon cluster
        this.ctx.beginPath();
        this.ctx.arc(size * 0.4, size * 0.5, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(size * 0.6, size * 0.3, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        // Side weapons
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.2, -size * 0.6, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.2, size * 0.6, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Organic neural networks
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        // Neural pathways
        this.ctx.moveTo(size * 0.1, 0);
        this.ctx.quadraticCurveTo(size * 0.3, -size * 0.3, size * 0.4, -size * 0.5);
        this.ctx.moveTo(size * 0.1, 0);
        this.ctx.quadraticCurveTo(size * 0.3, size * 0.3, size * 0.4, size * 0.5);
        this.ctx.moveTo(size * 0.1, 0);
        this.ctx.quadraticCurveTo(-size * 0.1, -size * 0.4, -size * 0.2, -size * 0.6);
        this.ctx.moveTo(size * 0.1, 0);
        this.ctx.quadraticCurveTo(-size * 0.1, size * 0.4, -size * 0.2, size * 0.6);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Command nexus
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(size * 0.5, -size * 0.15, size * 0.3, size * 0.3);
        this.ctx.shadowBlur = 0;

        // Alien hieroglyphs
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = `${size * 0.1}px monospace`;
        this.ctx.fillText('◊', -size * 0.3, -size * 0.2);
        this.ctx.fillText('◈', -size * 0.3, size * 0.3);
        this.ctx.fillText('◇', -size * 0.6, 0);
    }

    checkLevelUp() {
        if (this.experience >= this.experienceToNext) {
            this.level++;
            this.experience -= this.experienceToNext;
            this.experienceToNext = Math.floor(this.experienceToNext * 1.5); // Gentler XP curve for easier upgrades
            this.generateLevelUpOptions();
            this.showLevelUpMenu = true;
            this.gameRunning = false; // Pause game for level up
        }
    }

    generateLevelUpOptions() {
        this.levelUpOptions = [];
        const availableUpgrades = this.upgradePool.filter(upgrade => {
            // Filter by class compatibility
            if (!upgrade.classes.includes('all') && !upgrade.classes.includes(this.selectedClass)) {
                return false;
            }

            // Filter out upgrades that are already maxed or incompatible
            switch (upgrade.id) {
                // Multi-level upgrades
                case 'multishot1': return this.playerStats.multiShotCount < 1; // Twin Cannons - can only get if don't have it
                case 'multishot2': return this.playerStats.multiShotCount < 2;
                case 'armor': return this.playerStats.damageReduction < 0.5; // Max 50% reduction
                case 'scope': return this.playerStats.projectileSpeedMultiplier < 2.0;

                // One-time abilities - can only be obtained once
                case 'piercing': return !this.playerStats.piercingShots && this.selectedClass !== 'sniper'; // Sniper already has piercing
                case 'dashdamage': return !this.playerStats.dashDamage;
                case 'explosive': return !this.playerStats.explosiveShots;
                case 'magnetic': return !this.playerStats.magneticField;
                case 'shieldregen': return !this.playerStats.shieldRegen;
                case 'vampiric': return !this.playerStats.vampiric;
                case 'shadowstrike': return !this.playerStats.shadowStrike;
                case 'thorns': return !this.playerStats.thornsDamage;
                case 'fortress': return !this.playerStats.fortressMode;
                case 'tracking': return !this.playerStats.homingShots;
                case 'criticals': return !this.playerStats.criticalChance;
                case 'marksman': return !this.playerStats.rangedBonus;
                case 'headshot': return !this.playerStats.headshotChance;
                case 'rage': return !this.playerStats.rageMode;
                case 'bloodlust': return !this.playerStats.bloodlust;
                case 'rampage': return !this.playerStats.rampage;
                case 'turret': return !this.playerStats.autoTurret;
                case 'repair': return !this.playerStats.autoRepair;
                case 'stealth': return !this.playerStats.stealthDash;

                // Prerequisites for advanced abilities
                case 'shadowstrike': return this.playerStats.dashDamage && !this.playerStats.shadowStrike; // Requires ramming speed first

                default: return true;
            }
        });

        // Generate 3 random options with rarity weighting
        for (let i = 0; i < 3 && availableUpgrades.length > 0; i++) {
            const rarityWeights = { common: 60, uncommon: 30, rare: 10 };
            const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
            const random = Math.random() * totalWeight;

            let targetRarity = 'common';
            let weightSum = 0;
            for (const [rarity, weight] of Object.entries(rarityWeights)) {
                weightSum += weight;
                if (random <= weightSum) {
                    targetRarity = rarity;
                    break;
                }
            }

            const rarityUpgrades = availableUpgrades.filter(u => u.rarity === targetRarity);
            const fallbackUpgrades = availableUpgrades.length > 0 ? availableUpgrades : this.upgradePool;
            const pool = rarityUpgrades.length > 0 ? rarityUpgrades : fallbackUpgrades;

            if (pool.length > 0) {
                const selectedIndex = Math.floor(Math.random() * pool.length);
                const selected = pool[selectedIndex];
                this.levelUpOptions.push(selected);

                // Remove from available to avoid duplicates
                const originalIndex = availableUpgrades.indexOf(selected);
                if (originalIndex > -1) {
                    availableUpgrades.splice(originalIndex, 1);
                }
            }
        }
    }

    selectUpgrade(index) {
        if (index >= 0 && index < this.levelUpOptions.length) {
            const upgrade = this.levelUpOptions[index];
            upgrade.effect();
            this.showLevelUpMenu = false;
            this.gameRunning = true;
        }
    }

    renderHazards() {
        this.hazards.forEach(hazard => {
            this.ctx.save();
            this.ctx.translate(hazard.x, hazard.y);

            const pulse = 0.8 + 0.2 * Math.sin(hazard.pulseTimer * 0.1);
            const alpha = Math.min(1, hazard.duration / 60);

            switch (hazard.type) {
                case 'energy_field':
                    // Crackling energy field
                    this.ctx.strokeStyle = `rgba(255, 100, 255, ${alpha * 0.6})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.globalAlpha = alpha * pulse;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + hazard.pulseTimer * 0.02;
                        const innerRadius = hazard.size * 0.3;
                        const outerRadius = hazard.size * pulse;
                        this.ctx.beginPath();
                        this.ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
                        this.ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                        this.ctx.stroke();
                    }
                    break;

                case 'asteroid_field':
                    // Rotating asteroid debris
                    this.ctx.fillStyle = `rgba(150, 100, 50, ${alpha * 0.8})`;
                    this.ctx.globalAlpha = alpha;
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2 + hazard.pulseTimer * 0.01;
                        const radius = hazard.size * (0.3 + 0.4 * Math.random());
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        const size = 3 + Math.random() * 4;
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, size, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    break;

                case 'gravity_well':
                    // Swirling gravity distortion
                    this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha * 0.4})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = alpha * pulse;
                    for (let ring = 1; ring <= 4; ring++) {
                        const radius = (hazard.size / 4) * ring * pulse;
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                    break;
            }

            this.ctx.restore();
        });
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

    // XP bar now rendered in HTML HUD instead of canvas

    renderLevelUpMenu() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL UP!', this.canvas.width / 2, 80);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Level ${this.level} - Choose an Upgrade`, this.canvas.width / 2, 110);

        // Upgrade options
        const optionWidth = 300;
        const optionHeight = 120;
        const spacing = 50;
        const totalWidth = (optionWidth * 3) + (spacing * 2);
        const startX = (this.canvas.width - totalWidth) / 2;
        const optionY = 180;

        // Store option bounds for click detection
        this.levelUpOptionBounds = [];

        for (let i = 0; i < this.levelUpOptions.length; i++) {
            const option = this.levelUpOptions[i];
            const optionX = startX + (i * (optionWidth + spacing));

            // Store bounds for click detection
            this.levelUpOptionBounds[i] = {
                x: optionX,
                y: optionY,
                width: optionWidth,
                height: optionHeight
            };

            // Rarity colors
            const rarityColors = {
                common: '#888888',
                uncommon: '#00aa00',
                rare: '#aa00aa'
            };

            // Option background
            this.ctx.fillStyle = 'rgba(20, 30, 50, 0.9)';
            this.ctx.fillRect(optionX, optionY, optionWidth, optionHeight);

            // Rarity border
            this.ctx.strokeStyle = rarityColors[option.rarity] || '#888888';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(optionX, optionY, optionWidth, optionHeight);

            // Hover effect (simple glow)
            this.ctx.shadowColor = rarityColors[option.rarity] || '#888888';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeRect(optionX, optionY, optionWidth, optionHeight);
            this.ctx.shadowBlur = 0;

            // Option content
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(option.name, optionX + optionWidth / 2, optionY + 30);

            // Description (word wrap)
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#cccccc';
            const words = option.description.split(' ');
            let line = '';
            let lineY = optionY + 55;

            for (let j = 0; j < words.length; j++) {
                const testLine = line + words[j] + ' ';
                const metrics = this.ctx.measureText(testLine);

                if (metrics.width > optionWidth - 20 && j > 0) {
                    this.ctx.fillText(line, optionX + optionWidth / 2, lineY);
                    line = words[j] + ' ';
                    lineY += 18;
                } else {
                    line = testLine;
                }
            }
            this.ctx.fillText(line, optionX + optionWidth / 2, lineY);

            // Rarity label
            this.ctx.fillStyle = rarityColors[option.rarity] || '#888888';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(option.rarity.toUpperCase(), optionX + optionWidth / 2, optionY + optionHeight - 10);

            // Key number
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`${i + 1}`, optionX + 20, optionY + 25);
        }

        // Instructions
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press 1-3 to select, or click on an option', this.canvas.width / 2, this.canvas.height - 50);

        this.ctx.textAlign = 'left';
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    selectClass(classType) {
        this.selectedClass = classType;
        const config = this.classConfigs[classType];

        if (!config) {
            console.error(`No configuration found for class: ${classType}`);
            return;
        }

        // Apply class bonuses to player
        this.player.maxHealth = Math.floor(GameConfig.PLAYER.MAX_HEALTH * config.healthMultiplier);
        this.player.health = this.player.maxHealth;
        this.player.maxShield = Math.floor(GameConfig.PLAYER.MAX_SHIELD * config.shieldMultiplier);
        this.player.shield = this.player.maxShield;



        // Apply class bonuses to player stats
        this.playerStats.speedMultiplier = config.speedMultiplier;
        this.playerStats.damageMultiplier = config.damageMultiplier;
        this.playerStats.fireRateMultiplier = config.fireRateMultiplier;
        this.playerStats.dashMultiplier = config.dashMultiplier;

        // Apply starting weapon
        this.currentWeapon = config.startingWeapon;

        // Apply visual changes
        this.player.color = config.playerColor;

        // Apply special class abilities
        if (config.special === 'multishot_and_regen') {
            // Engineer: Start with multi-shot and fast shield regen
            this.playerStats.multiShotCount = 1;
            this.playerStats.shieldRegen = true;
            this.player.shieldRegenBonus = true;
        } else if (config.special === 'rage_damage') {
            // Berserker: Damage increases as health decreases
            this.playerStats.rageDamage = true;
        } else if (config.special === 'piercing_shots') {
            // Sniper: Start with piercing shots
            this.playerStats.piercingShots = true;
        }

        // Update health bar styling
        const healthBar = document.querySelector('.health-bar');
        const shieldBar = document.querySelector('.shield-bar');
        if (healthBar) {
            healthBar.className = `health-bar ${classType}`;
        }
        if (shieldBar) {
            shieldBar.className = `shield-bar ${classType}`;
        }

        // Hide class selection and start game
        document.getElementById('class-selection').classList.add('hidden');
        this.gameRunning = true;
        this.gameStarted = true;

        // Start the first wave after a short delay
        this.waveTransitionTimer = 120; // 2 seconds
    }

    restart() {
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;

        // Reset wave management
        this.waveInProgress = false;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        this.waveTransitionTimer = this.waveStartDelay;
        this.bloodlustTimer = 0;
        this.hazards = []; // Reset environmental hazards
        this.gameRunning = false;
        this.gameStarted = false;
        this.selectedClass = null;

        // Reset level system
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 150; // Much easier to get first upgrade
        this.showLevelUpMenu = false;
        this.levelUpOptions = [];

        // Reset player stats to base values
        this.playerStats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            speedMultiplier: 1,
            maxHealthBonus: 0,
            maxShieldBonus: 0,
            multiShotCount: 0,
            piercingShots: false,
            dashDamage: false,
            explosiveShots: false,
            magneticField: false,
            shieldRegen: false,
            vampiric: false,
            // New class-specific abilities
            dashMultiplier: 1,
            stealthDash: false,
            shadowStrike: false,
            damageReduction: 0,
            thornsDamage: false,
            fortressMode: false,
            homingShots: false,
            criticalChance: 0,
            rangedBonus: false,
            headshotChance: 0,
            projectileSpeedMultiplier: 1,
            rageMode: false,
            rageDamage: false,
            bloodlust: false,
            rampage: false,
            autoTurret: false,
            autoRepair: false
        };

        // Reset player to base stats
        this.player.reset(GameConfig.SPACE_WIDTH / 2, GameConfig.SPACE_HEIGHT / 2);
        this.player.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        this.player.health = this.player.maxHealth;
        this.player.maxShield = GameConfig.PLAYER.MAX_SHIELD;
        this.player.shield = this.player.maxShield;
        this.player.color = GameConfig.PLAYER.COLOR; // Reset to default color

        // Reset weapon
        this.currentWeapon = 0;

        this.camera.centerOnPlayer(this.player);

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.explosions = [];

        this.spawnInitialEnemies();

        // Hide game over screen and show start screen
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('class-selection').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');

        // Reset health bar styling
        const healthBar = document.querySelector('.health-bar');
        const shieldBar = document.querySelector('.shield-bar');
        if (healthBar) {
            healthBar.className = 'health-bar';
        }
        if (shieldBar) {
            shieldBar.className = 'shield-bar';
        }
    }

    deployTurret() {
        // Deploy a turret at player's current position
        const turret = {
            x: this.player.x,
            y: this.player.y,
            health: 100,
            maxHealth: 100,
            fireRate: 30,
            fireTimer: 0,
            range: 200,
            damage: 15,
            projectiles: []
        };
        this.turrets.push(turret);
    }

    updateTurrets() {
        for (let i = this.turrets.length - 1; i >= 0; i--) {
            const turret = this.turrets[i];

            // Update turret projectiles
            for (let j = turret.projectiles.length - 1; j >= 0; j--) {
                const projectile = turret.projectiles[j];
                projectile.update();

                if (!projectile.isAlive() || !projectile.isInBounds(GameConfig.SPACE_WIDTH, GameConfig.SPACE_HEIGHT)) {
                    turret.projectiles.splice(j, 1);
                    continue;
                }

                // Check collision with enemies
                for (let k = this.enemies.length - 1; k >= 0; k--) {
                    const enemy = this.enemies[k];
                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.size + projectile.size) {
                        // Hit enemy
                        if (enemy.takeDamage(turret.damage)) {
                            this.enemies.splice(k, 1);
                            this.score += enemy.getPoints();
                        }
                        turret.projectiles.splice(j, 1);
                        break;
                    }
                }
            }

            // Turret AI - find closest enemy and shoot
            if (turret.fireTimer <= 0) {
                let closestEnemy = null;
                let closestDistance = turret.range;

                for (const enemy of this.enemies) {
                    const dx = enemy.x - turret.x;
                    const dy = enemy.y - turret.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }

                if (closestEnemy) {
                    // Shoot at closest enemy
                    const dx = closestEnemy.x - turret.x;
                    const dy = closestEnemy.y - turret.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const vx = (dx / distance) * 12;
                    const vy = (dy / distance) * 12;

                    turret.projectiles.push(new Projectile(turret.x, turret.y, vx, vy, 3, '#00ffff', 60));
                    turret.fireTimer = turret.fireRate;
                }
            } else {
                turret.fireTimer--;
            }

            // Check if turret is destroyed
            if (turret.health <= 0) {
                this.turrets.splice(i, 1);
            }
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game...');
    new Game();
});