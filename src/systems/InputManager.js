export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
        this.restartCallback = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
        });

        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            if (this.restartCallback) {
                this.restartCallback();
            }
        });
    }

    updateWorldCoordinates(camera) {
        this.mouse.worldX = this.mouse.x + camera.x;
        this.mouse.worldY = this.mouse.y + camera.y;
    }

    onRestart(callback) {
        this.restartCallback = callback;
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    isMouseDown() {
        return this.mouse.down;
    }

    getMouseWorldPosition() {
        return { x: this.mouse.worldX, y: this.mouse.worldY };
    }
}