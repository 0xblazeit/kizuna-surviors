import Phaser from 'phaser';

export default class MainPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.initializeProperties();
        this.setupControls();
    }

    initializeProperties() {
        this.moveSpeed = 200;
        this.lastNonZeroDirection = Math.PI * -0.5;

        this.stats = {
            maxHealth: 100,
            health: 100,
            defense: 10,
            speed: this.moveSpeed
        };

        this.experience = {
            level: 1,
            current: 0,
            toNext: 100
        };

        this.inventory = {
            gold: 0,
            items: []
        };
    }

    setupControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update(time) {
        this.handleMovement();
        if (this.weapon) {
            this.weapon.update(time);
        }
    }

    handleMovement() {
        const { dx, dy } = this.getMovementInput();
        this.updateDirection(dx, dy);
        this.updateVelocity(dx, dy);
        this.updateWeaponDirection();
    }

    getMovementInput() {
        let dx = 0;
        let dy = 0;

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

        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        return { dx, dy };
    }

    updateDirection(dx, dy) {
        if (dx !== 0 || dy !== 0) {
            this.lastNonZeroDirection = Math.atan2(dy, dx);
        }
    }

    updateVelocity(dx, dy) {
        this.setVelocity(dx * this.moveSpeed, dy * this.moveSpeed);
    }

    updateWeaponDirection() {
        if (this.weapon && this.lastNonZeroDirection !== undefined) {
            this.weapon.updateDirection(this.lastNonZeroDirection);
        }
    }

    levelUp() {
        this.updateExperience();
        this.increaseStats();
        this.updateWeaponLevel();
    }

    updateExperience() {
        this.experience.current -= this.experience.toNext;
        this.experience.level += 1;
        this.experience.toNext = Math.floor(this.experience.toNext * 1.2);
    }

    increaseStats() {
        this.stats.maxHealth += 10;
        this.stats.health = this.stats.maxHealth;
        this.stats.defense += 2;
    }

    updateWeaponLevel() {
        if (this.weapon) {
            const weaponLevel = Math.min(this.experience.level - 1, 8);
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

    getStats() {
        return {
            ...this.stats,
            experience: this.experience,
            gold: this.inventory.gold
        };
    }

    onDeath() {
        // Emit death event before cleanup
        this.scene.events.emit('playerDeath', {
            level: this.experience.level,
            gold: this.inventory.gold
        });

        super.onDeath();
    }
}
