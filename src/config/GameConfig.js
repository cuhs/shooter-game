export const GameConfig = {
    // Space dimensions
    SPACE_WIDTH: 4000,
    SPACE_HEIGHT: 3000,
    
    // Player settings
    PLAYER: {
        SIZE: 12,
        SPEED: 8,
        MAX_HEALTH: 100,
        MAX_SHIELD: 50,
        COLOR: '#00ffff',
        DASH_COOLDOWN: 60,
        INVULNERABLE_TIME: 120
    },
    
    // Camera settings
    CAMERA: {
        FOLLOW_SPEED: 0.3
    },
    
    // Weapon configurations
    WEAPONS: [
        { name: 'PHOTON', damage: 15, speed: 12, size: 3, color: '#00ffff', fireRate: 8, ammo: Infinity },
        { name: 'SCATTER', damage: 10, speed: 10, size: 2, color: '#ff6600', fireRate: 12, ammo: Infinity },
        { name: 'BEAM', damage: 25, speed: 18, size: 2, color: '#ff0000', fireRate: 4, ammo: 50 },
        { name: 'PLASMA', damage: 30, speed: 8, size: 5, color: '#ff00ff', fireRate: 6, ammo: 30 }
    ],
    
    // Enemy types and stats
    ENEMY_TYPES: {
        scout: { size: 6, speed: 3, health: 25, color: '#ff6666', points: 10 },
        fighter: { size: 8, speed: 2.5, health: 40, color: '#ff4444', points: 20 },
        bomber: { size: 12, speed: 1.5, health: 60, color: '#ff2222', points: 30 },
        cruiser: { size: 15, speed: 2, health: 80, color: '#ff0000', points: 50 },
        interceptor: { size: 7, speed: 4, health: 30, color: '#ff8888', points: 25 },
        miner: { size: 10, speed: 1, health: 50, color: '#ffaa44', points: 15 },
        drone: { size: 5, speed: 3.5, health: 20, color: '#ff9999', points: 8 }
    },
    
    // Ability configurations
    ABILITIES: {
        timeFreeze: { cooldown: 600, duration: 180 },
        shield: { cooldown: 480, duration: 300 },
        nuke: { cooldown: 900, charges: 3 },
        magnetism: { cooldown: 360, duration: 240 },
        multishot: { cooldown: 420, duration: 360 }
    },
    
    // Space generation settings
    SPACE_GENERATION: {
        STAR_COUNT: 200,
        ASTEROID_COUNT: 80,
        PLANETS: [
            { name: 'Earth', x: 1900, y: 1500, size: 40, color: '#4488ff' },
            { name: 'Mars', x: 1600, y: 400, size: 25, color: '#ff4444' },
            { name: 'Jupiter', x: 2800, y: 600, size: 60, color: '#ffaa44' },
            { name: 'Saturn', x: 3200, y: 1800, size: 50, color: '#ffdd88' },
            { name: 'Alien World', x: 2800, y: 1800, size: 35, color: '#aa44ff' }
        ]
    },
    
    // Spawn rates and timing
    SPAWN_RATES: {
        ENEMY_CHANCE: 0.02,
        POWERUP_CHANCE: 0.001
    }
};