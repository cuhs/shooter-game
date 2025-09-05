# Galactic Defender - Space Shooter Game

A fast-paced, class-based space shooter game built with HTML5 Canvas and JavaScript. Battle through waves of enemies, upgrade your ship, and master unique class abilities in this action-packed arcade experience.

## 🎮 Game Features

### Core Gameplay
- **Wave-based Combat**: Face increasingly challenging waves of enemies with unique AI behaviors
- **Class System**: Choose from 5 distinct classes, each with unique abilities and playstyles
- **Upgrade System**: Level up and select from class-specific upgrades to customize your build
- **Multiple Weapons**: 4 different weapon types with unique characteristics
- **Environmental Hazards**: Dynamic battlefield elements that add strategic depth

### Classes & Abilities

#### **Tank** - The Fortress
*High health and shields, defensive specialist*
- **Base Stats**: +80% health, +60% shields, -30% speed
- **Unique Abilities**:
  - **Reactive Armor**: Reduce incoming damage by 25%
  - **Thorn Plating**: Reflect damage to attackers
  - **Fortress Mode**: Stationary = +50% damage, +50% damage reduction
  - **Energy Overflow**: Shield damage reflects to nearby enemies
  - **Berserker Plating**: Take less damage, deal more when hurt

#### **Hunter** - The Versatile Fighter
*Balanced stats with precision and multi-shot capabilities*
- **Base Stats**: Balanced across all attributes
- **Unique Abilities**:
  - **Target Tracking**: Projectiles home in on enemies
  - **Critical Strikes**: 20% chance for 2.5x damage
  - **Marksman Training**: +50% damage at long range
  - **Chain Lightning**: Shots arc to nearby enemies
  - **Ricochet Rounds**: Shots bounce between enemies
  - **Double Tap**: Each shot fires twice with slight delay

#### **Berserker** - The Damage Dealer
*High damage output with risk/reward mechanics*
- **Base Stats**: +50% damage, +30% fire rate, -20% health
- **Unique Abilities**:
  - **Berserker Rage**: Low health = higher damage and speed
  - **Bloodlust**: Kills increase damage for 5 seconds
  - **Rampage**: Each kill reduces all cooldowns
  - **Life Steal**: Gain health when killing enemies
  - **Battle Frenzy**: Each kill increases all stats for 3 seconds

#### **Assassin** - The Mobile Striker
*High mobility with stealth and dash mechanics*
- **Base Stats**: +50% speed, +100% dash distance, -20% health
- **Unique Abilities**:
  - **Ramming Speed**: Dashing through enemies deals damage
  - **Shadow Strike**: +100% dash distance and damage
  - **Cloaking Device**: Brief invisibility after dash
  - **Ghost Walk**: Phase through enemies and projectiles briefly
  - **Temporal Distortion**: Enemies move 50% slower
  - **Omnislash**: Dash hits all enemies in path
  - **Precognition**: See enemy attack patterns and weak points

#### **Engineer** - The Support Specialist
*Deployable systems and utility abilities*
- **Base Stats**: +20% shields, +20% fire rate
- **Unique Abilities**:
  - **Auto-Turret**: Deploy a stationary turret
  - **Auto-Repair**: Slowly regenerate health over time
  - **Shield Regenerator**: Shields regenerate faster
  - **Magnetic Field**: Attract items from distance
  - **Explosive Rounds**: Shots explode on impact

### Visual Features
- **Smooth Camera System**: Follows player with configurable smoothing
- **Particle Effects**: Visual feedback for hits, explosions, and special abilities
- **Dynamic UI**: Real-time health bars, minimap, and upgrade menus
- **Enemy Health Bars**: Visual feedback for enemy damage with flash effects

## 🚀 Getting Started

### Prerequisites
- Modern web browser with HTML5 Canvas support
- Local web server (for development)

### Installation
1. Clone or download the repository
2. Open `index.html` in a web browser, or
3. Serve the files using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   ```

### Controls
- **Movement**: WASD keys
- **Shooting**: Mouse (aim and click)
- **Dash**: Spacebar (class-dependent cooldown)
- **Weapon Switch**: Number keys 1-4
- **Class Selection**: Click on class cards at game start

## 📁 Project Structure

```
galactic-defender/
├── index.html              # Main HTML file with game UI and canvas
├── styles.css              # Game styling, HUD layout, and UI components
├── game-bundle.js          # Complete game implementation (single file)
└── README.md               # This documentation file
```

**Note**: The game is currently implemented as a single consolidated file (`game-bundle.js`) containing all game logic, systems, and configurations for easy deployment and modification.

## 🏗️ Code Architecture

The game is built with a modular architecture centered around the main `Game` class. The codebase is organized into logical sections for easy maintenance and extension.

### Main Components

#### 1. Game Configuration (`GameConfig`)
Central configuration object containing all game constants:
- Player stats and abilities
- Weapon configurations
- Enemy types and behaviors
- Wave progression settings
- Visual and audio settings

#### 2. Entity Classes
- **Player**: Handles movement, health, shields, and abilities
- **Enemy**: AI behaviors, combat stats, and visual effects
- **Projectile**: Physics, collision, and special effects

#### 3. Game Systems
- **Camera System**: Smooth following and coordinate conversion
- **Weapon System**: Firing mechanics and projectile management
- **Enemy Manager**: Spawning, AI coordination, and wave management
- **Ability System**: Class-specific special abilities and cooldowns
- **Space Generator**: Background elements and environmental objects

#### 4. Core Game Loop
```javascript
gameLoop() {
    this.update();    // Game logic and physics
    this.render();    // Drawing and visual effects
    requestAnimationFrame(() => this.gameLoop());
}
```

### Key Systems

#### Update Cycle
1. **Input Processing**: Handle player controls and UI interactions
2. **Physics Update**: Move entities and update timers
3. **Collision Detection**: Check projectile/enemy and player/enemy collisions
4. **AI Processing**: Update enemy behaviors and pathfinding
5. **Wave Management**: Spawn enemies and progress waves
6. **Effect Updates**: Particles, abilities, and visual effects

#### Rendering Pipeline
1. **Background**: Stars, planets, and space objects
2. **Environmental**: Hazards and battlefield elements
3. **Entities**: Enemies, player, and projectiles
4. **Effects**: Particles, explosions, and visual feedback
5. **UI Elements**: Health bars, minimap, and menus

## 🎯 Game Balance

### Difficulty Scaling
- **Wave Progression**: Enemy count and variety increase each wave
- **Enemy Stats**: Health and damage scale with wave number
- **Special Enemies**: New enemy types unlock in later waves

### Class Balance
Each class has distinct strengths and weaknesses:
- **Tank**: Survivability vs. mobility trade-off
- **Hunter**: Balanced with versatile upgrade paths
- **Berserker**: High risk/high reward gameplay
- **Assassin**: Skill-based with mobility focus
- **Engineer**: Strategic placement and resource management

## 🎯 Complete Abilities Reference

### Universal Upgrades (All Classes)

#### **Damage Upgrades**
- **Weapon Upgrade**: +10% weapon damage (Common)
- **Advanced Targeting**: +18% weapon damage (Uncommon)
- **Military Grade Weapons**: +35% weapon damage (Rare)
- **Experimental Arsenal**: +60% weapon damage (Legendary)

#### **Fire Rate Upgrades**
- **Rapid Fire**: +12% fire rate (Common)
- **Auto-Loader**: +22% fire rate (Uncommon)
- **Overcharged Systems**: +40% fire rate (Rare)
- **Quantum Accelerator**: +70% fire rate (Legendary)

#### **Speed Upgrades**
- **Engine Boost**: +10% movement speed (Common)
- **Afterburners**: +18% movement speed (Uncommon)
- **Warp Drive**: +35% movement speed (Rare)
- **Dimensional Phase**: +60% movement speed (Legendary)

#### **Health Upgrades**
- **Hull Plating**: +20 max health (Common)
- **Reinforced Hull**: +35 max health (Uncommon)
- **Nano-Regeneration**: +60 max health (Rare)
- **Immortal Chassis**: +100 max health (Legendary)

#### **Shield Upgrades**
- **Shield Generator**: +18 max shield (Common)
- **Advanced Shields**: +28 max shield (Uncommon)
- **Energy Barrier**: +50 max shield (Rare)
- **Quantum Shield Matrix**: +85 max shield (Legendary)

### Multi-Shot Abilities
- **Twin Cannons**: Fire 2 projectiles (Uncommon) - Hunter, Engineer, Berserker
- **Triple Threat**: Fire 3 projectiles (Rare) - Hunter, Engineer
- **Quad Cannons**: Fire 4 projectiles (Legendary) - Hunter, Engineer

### Weapon Special Effects
- **Piercing Rounds**: Shots pierce through enemies (Rare) - Hunter, Tank
- **Explosive Rounds**: Shots explode on impact (Rare) - Engineer, Berserker, Tank
- **Ricochet Rounds**: Shots bounce between enemies (Rare) - Hunter, Sniper
- **Chain Lightning**: Shots arc to nearby enemies (Rare) - Engineer, Hunter
- **Double Tap**: Each shot fires twice with slight delay (Rare) - Sniper, Hunter

### Legendary Abilities
- **Phoenix Protocol**: Revive once per wave with full health (All Classes)
- **Temporal Distortion**: Enemies move 50% slower (Assassin, Sniper)
- **Omnislash**: Dash hits all enemies in path (Assassin, Berserker)
- **Orbital Strike**: Call down devastating strikes every 10 seconds (Tank, Engineer)

### Class-Specific Abilities

#### Tank Abilities
- **Shield Regenerator**: Shields regenerate faster (Tank, Engineer)
- **Reactive Armor**: Reduce incoming damage by 25%
- **Thorn Plating**: Reflect damage to attackers
- **Fortress Mode**: Stationary = +50% damage, +50% damage reduction
- **Energy Overflow**: Shield damage reflects to nearby enemies
- **Berserker Plating**: Take less damage, deal more when hurt

#### Hunter Abilities
- **Target Tracking**: Projectiles home in on enemies
- **Critical Strikes**: 20% chance for 2.5x damage (Hunter, Sniper)
- **Marksman Training**: +50% damage at long range (Hunter, Sniper)

#### Berserker Abilities
- **Life Steal**: Gain health when killing enemies (Berserker, Assassin)
- **Berserker Rage**: Low health = higher damage and speed
- **Bloodlust**: Kills increase damage for 5 seconds
- **Rampage**: Each kill reduces all cooldowns
- **Battle Frenzy**: Each kill increases all stats for 3 seconds

#### Assassin Abilities
- **Ramming Speed**: Dashing through enemies deals damage
- **Shadow Strike**: +100% dash distance and damage
- **Cloaking Device**: Brief invisibility after dash
- **Ghost Walk**: Phase through enemies and projectiles briefly
- **Precognition**: See enemy attack patterns and weak points

#### Engineer Abilities
- **Auto-Turret**: Deploy a stationary turret
- **Auto-Repair**: Slowly regenerate health over time
- **Magnetic Field**: Attract items from distance

#### Sniper Abilities
- **Headshot Mastery**: 50% chance for instant kill on low-health enemies
- **Enhanced Scope**: +100% projectile speed and range

## 🔧 Configuration

### Gameplay Tweaking
Modify `GameConfig` object in `game-bundle.js`:
```javascript
const GameConfig = {
    PLAYER: {
        MAX_HEALTH: 100,    // Base player health
        SPEED: 5,           // Movement speed
        DASH_COOLDOWN: 60   // Dash cooldown in frames
    },
    WEAPONS: [
        // Weapon configurations
    ],
    ENEMY_TYPES: {
        // Enemy definitions
    }
};
```

### Visual Customization
- **Colors**: Modify entity colors in GameConfig
- **Effects**: Adjust particle counts and lifetimes
- **UI**: Update styles.css for HUD appearance

## 🐛 Development

### Adding New Features

#### New Enemy Type
1. Add configuration to `GameConfig.ENEMY_TYPES`
2. Implement behavior in `Enemy.update()` method
3. Add visual representation in rendering system

#### New Weapon
1. Add weapon config to `GameConfig.WEAPONS`
2. Implement special effects in projectile system
3. Update UI to display weapon stats

#### New Class Ability
1. Add to class configuration in Game constructor
2. Implement effect in upgrade system
3. Add visual feedback and UI elements

### Performance Considerations
- **Object Pooling**: Reuse projectile and particle objects
- **Culling**: Only render objects within camera view
- **Efficient Collision**: Use spatial partitioning for large enemy counts

## 📊 Technical Specifications

- **Target FPS**: 60 FPS
- **Canvas Resolution**: Dynamic (window size)
- **World Size**: 4000x3000 pixels
- **Max Entities**: ~200 simultaneous objects
- **Browser Support**: Modern browsers with Canvas API

## 🎨 Assets & Credits

### Visual Design
- **Art Style**: Minimalist geometric shapes with neon colors
- **Color Palette**: Space-themed blues, cyans, and contrasting enemy colors
- **Effects**: Procedural particle systems and dynamic lighting