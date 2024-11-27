import Phaser from 'phaser';

export default class MainPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up movement properties
        this.moveSpeed = 200;
        this.lastNonZeroDirection = Math.PI * -0.5; // Default upward

        // Set up player stats
        this.stats = {
            maxHealth: 100,
            health: 100,
            defense: 10,
            speed: this.moveSpeed
        };

        // Set up experience system
        this.experience = {
            level: 1,
            current: 0,
            toNext: 100
        };

        this.inventory = {
            gold: 0,
            items: []
        };

        // Create cursor keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update(time) {
        // Update movement
        this.handleMovement();
        
        // Update weapon if it exists
        if (this.weapon) {
            this.weapon.update(time);
        }
    }

    handleMovement() {
        const speed = this.moveSpeed;
        let dx = 0;
        let dy = 0;

        // Check arrow keys
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            dx = -1;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            dx = 1;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            dy = -1;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            dy = 1;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        // Store last non-zero direction for weapon firing
        if (dx !== 0 || dy !== 0) {
            this.lastNonZeroDirection = Math.atan2(dy, dx);
        }

        // Move player
        this.setVelocity(dx * speed, dy * speed);

        // Update weapon direction
        if (this.weapon && this.lastNonZeroDirection !== undefined) {
            this.weapon.updateDirection(this.lastNonZeroDirection);
        }
    }

    levelUp() {
        this.experience.current -= this.experience.toNext;
        this.experience.level += 1;
        this.experience.toNext = Math.floor(this.experience.toNext * 1.2);
        
        // Increase stats on level up
        this.stats.maxHealth += 10;
        this.stats.health = this.stats.maxHealth;
        this.stats.defense += 2;

        // Update weapon level
        if (this.weapon) {
            const weaponLevel = Math.min(this.experience.level - 1, 8); // Max level 8
            this.weapon.setWeapon('hotdog', weaponLevel);
        }
    }

    collectGold(amount) {
        this.inventory.gold += amount;
        this.scene.events.emit('goldCollected', this.inventory.gold);
    }

    gainExperience(amount) {
        this.experience.current += amount;
        
        while (this.experience.current >= this.experience.toNext) {
            this.levelUp();
        }
        
        this.scene.events.emit('playerXPGained', this.experience);
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
