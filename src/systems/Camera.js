import { GameConfig } from '../config/GameConfig.js';

export class Camera {
    constructor(spaceWidth, spaceHeight, canvas) {
        this.x = 0;
        this.y = 0;
        this.followSpeed = GameConfig.CAMERA.FOLLOW_SPEED;
        this.spaceWidth = spaceWidth;
        this.spaceHeight = spaceHeight;
        this.canvas = canvas;
    }

    update(player) {
        // Smooth camera following
        const targetX = player.x - this.canvas.width / 2;
        const targetY = player.y - this.canvas.height / 2;

        this.x += (targetX - this.x) * this.followSpeed;
        this.y += (targetY - this.y) * this.followSpeed;

        // Keep camera within world bounds
        this.x = Math.max(0, Math.min(this.spaceWidth - this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.spaceHeight - this.canvas.height, this.y));
    }

    centerOnPlayer(player) {
        // Immediately center camera on player (for initialization)
        this.x = player.x - this.canvas.width / 2;
        this.y = player.y - this.canvas.height / 2;

        // Keep camera within world bounds
        this.x = Math.max(0, Math.min(this.spaceWidth - this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.spaceHeight - this.canvas.height, this.y));
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}