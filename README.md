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
- **Tank**: High health and shields, damage reduction abilities, fortress mode
- **Hunter**: Balanced stats with piercing shots and multi-shot capabilities
- **Berserker**: High damage output, life steal, and rage-based abilities
- **Assassin**: High mobility with dash attacks, stealth, and critical strikes
- **Engineer**: Deployable turrets, shield regeneration, and explosive rounds

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
├── index.html              # Main HTML file with game UI
├── styles.css              # Game styling and HUD layout
├── game-bundle.js          # Main game logic (consolidated)
├── game.js                 # Alternative entry point
└── src/                    # Modular source files
    ├── config/             # Game configuration
    ├── core/               # Core game systems
    ├── entities/           # Game entities (Player, Enemy, etc.)
    └── systems/            # Game systems (Camera, Weapons, etc.)
```

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