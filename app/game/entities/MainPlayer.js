import Phaser from 'phaser';

export default class MainPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics body
        this.body.setCollideWorldBounds(true);
        this.moveSpeed = 200;
        
        this.lastMoveDirection = 0; // angle in radians
        this.lastNonZeroDirection = 0; // Keep track of last non-zero direction
        
        // Initialize stats
        this.experience = {
            current: 0,
            level: 1,
            toNext: 100
        };

        this.stats = {
            health: 100,
            maxHealth: 100,
            defense: 10,
            speed: this.moveSpeed
        };

        this.inventory = {
            gold: 0,
            items: []
        };
    }

    handleMovement(input) {
        const speed = this.moveSpeed;
        let dx = 0;
        let dy = 0;

        if (input.left) dx -= speed;
        if (input.right) dx += speed;
        if (input.up) dy -= speed;
        if (input.down) dy += speed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }

        // Update velocity
        this.setVelocity(dx, dy);

        // Update direction only if moving
        if (dx !== 0 || dy !== 0) {
            const currentDirection = Math.atan2(dy, dx);
            this.lastMoveDirection = currentDirection;
            this.lastNonZeroDirection = currentDirection; // Save non-zero direction
        }

        // Use last non-zero direction for weapon firing
        if (this.weapon) {
            this.weapon.updateDirection(this.lastNonZeroDirection);
        }
    }

    // XP related methods
    gainXP(amount) {
        this.experience.current += amount;
        while (this.experience.current >= this.experience.toNext) {
            this.levelUp();
        }
        
        // Emit XP gain event
        this.scene.events.emit('playerXPGained', {
            current: this.experience.current,
            level: this.experience.level,
            toNext: this.experience.toNext
        });
    }

    levelUp() {
        this.experience.current -= this.experience.toNext;
        this.experience.level += 1;
        this.experience.toNext = Math.floor(this.experience.toNext * 1.2);
        
        // Increase stats on level up
        this.stats.maxHealth += 10;
        this.stats.health = this.stats.maxHealth;
        this.stats.defense += 2;
    }

    collectGold(amount) {
        this.inventory.gold += amount;
        this.scene.events.emit('goldCollected', this.inventory.gold);
    }

    onDeath() {
        // Emit death event before cleanup
        this.scene.events.emit('playerDeath', {
            level: this.experience.level,
            gold: this.inventory.gold
        });

        super.onDeath();
    }

    getStats() {
        return {
            ...this.stats,
            experience: this.experience,
            gold: this.inventory.gold
        };
    }
}
