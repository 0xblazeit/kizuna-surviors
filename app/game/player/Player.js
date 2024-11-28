import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add to scene
        scene.add.existing(this);
        
        // Create the player sprite
        this.sprite = scene.add.sprite(0, 0, 'player');
        this.add(this.sprite);
        
        // Initialize player stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        
        // Create health bar
        this.healthBar = this.createHealthBar();
        this.add(this.healthBar);
        
        // Enable physics
        scene.physics.add.existing(this);
        
        // Set up movement properties
        this.moveSpeed = 200;
        this.body.setCollideWorldBounds(true);
        
        // Initialize state
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000; // 1 second
    }
    
    createHealthBar() {
        const width = 50;
        const height = 8;
        const padding = 2;
        const y = 30; // Position below the player sprite
        
        // Create container for health bar
        const healthBarContainer = new Phaser.GameObjects.Container(this.scene, 0, y);
        
        // Background (black)
        const background = new Phaser.GameObjects.Rectangle(
            this.scene,
            0,
            0,
            width + padding * 2,
            height + padding * 2,
            0x000000
        );
        
        // Health bar (green)
        this.healthBarFill = new Phaser.GameObjects.Rectangle(
            this.scene,
            -width/2 + padding,
            0,
            width,
            height,
            0x00ff00
        );
        this.healthBarFill.setOrigin(0, 0.5);
        
        // Add to container
        healthBarContainer.add(background);
        healthBarContainer.add(this.healthBarFill);
        
        return healthBarContainer;
    }
    
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBarFill.setScale(healthPercent, 1);
    }
    
    takeDamage(amount) {
        if (this.isInvulnerable) return;
        
        // Apply damage
        this.health = Math.max(0, this.health - amount);
        
        // Update health bar
        this.updateHealthBar();
        
        // Visual feedback
        this.flash();
        
        // Make invulnerable briefly
        this.setInvulnerable();
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        }
    }
    
    setInvulnerable() {
        this.isInvulnerable = true;
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.isInvulnerable = false;
        });
    }
    
    flash() {
        this.sprite.setTintFill(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });
    }
    
    die() {
        // Implement death behavior
        console.log('Player died');
    }
    
    update() {
        // Get cursor keys
        const cursors = this.scene.input.keyboard.createCursorKeys();
        
        // Reset velocity
        this.body.setVelocity(0);
        
        // Horizontal movement
        if (cursors.left.isDown) {
            this.body.setVelocityX(-this.moveSpeed);
        } else if (cursors.right.isDown) {
            this.body.setVelocityX(this.moveSpeed);
        }
        
        // Vertical movement
        if (cursors.up.isDown) {
            this.body.setVelocityY(-this.moveSpeed);
        } else if (cursors.down.isDown) {
            this.body.setVelocityY(this.moveSpeed);
        }
        
        // Normalize velocity for diagonal movement
        this.body.velocity.normalize().scale(this.moveSpeed);
    }
}
