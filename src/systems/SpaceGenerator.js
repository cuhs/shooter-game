import { GameConfig } from '../config/GameConfig.js';

export class SpaceGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.spaceObjects = {
            stars: [],
            asteroids: [],
            planets: []
        };
    }

    generateAll() {
        this.generateStars();
        this.generateAsteroids();
        this.generatePlanets();
    }

    generateStars() {
        this.spaceObjects.stars = [];
        for (let i = 0; i < GameConfig.SPACE_GENERATION.STAR_COUNT; i++) {
            this.spaceObjects.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
    }

    generateAsteroids() {
        this.spaceObjects.asteroids = [];
        for (let i = 0; i < GameConfig.SPACE_GENERATION.ASTEROID_COUNT; i++) {
            this.spaceObjects.asteroids.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 15 + 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    generatePlanets() {
        this.spaceObjects.planets = [...GameConfig.SPACE_GENERATION.PLANETS];
    }

    getSpaceObjects() {
        return this.spaceObjects;
    }

    update() {
        // Rotate asteroids
        this.spaceObjects.asteroids.forEach(asteroid => {
            asteroid.rotation += asteroid.rotationSpeed;
        });
    }
}