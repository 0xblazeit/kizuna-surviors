import BasePlayer from './BasePlayer';

class MainPlayer extends BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        // Set main player specific defaults
        const mainPlayerConfig = {
            maxHealth: 100,
            moveSpeed: 3,
            defense: 0,
            attackSpeed: 1,
            attackDamage: 10,
            scale: 1,
            trailTint: 0xFF8C42,  
            clickDamage: 25,
            ...config
        };

        super(scene, x, y, texture, mainPlayerConfig);

        // Set sprite depth
        this.sprite.setDepth(10);

        // Player specific properties
        this.isStaggered = false;
        this.hitFlashDuration = 100;
        this.isDead = false;  

        // Create health bar with proper spacing
        const spriteHeight = this.sprite.height * mainPlayerConfig.scale;
        const healthBarWidth = spriteHeight * 0.8;
        const healthBarHeight = spriteHeight * 0.1;
        const healthBarSpacing = spriteHeight * 0.4;

        // Create a container for the health bar to keep components together
        this.healthBar = {
            width: healthBarWidth,
            height: healthBarHeight,
            spacing: healthBarSpacing,
            container: scene.add.container(x, y + healthBarSpacing),
            background: scene.add.rectangle(0, 0, healthBarWidth, healthBarHeight, 0x000000),
            bar: scene.add.rectangle(0, 0, healthBarWidth, healthBarHeight, 0x00ff00)
        };

        // Add components to container
        this.healthBar.container.add([this.healthBar.background, this.healthBar.bar]);
        this.healthBar.container.setDepth(1);

        // Add a black border to make the health bar more visible
        this.healthBar.background.setStrokeStyle(1, 0x000000);

        // Main player specific properties
        this.experience = {
            current: 0,
            toNextLevel: 100,
            level: 1
        };

        this.inventory = {
            gold: 0,
            items: []
        };

        this.clickDamage = mainPlayerConfig.clickDamage;

        // Initialize movement variables
        this.movementEnabled = true;
        this.isMoving = false;
        this.lastX = x;
        this.lastY = y;

        // Initialize player
        this.initPlayer();
    }

    initPlayer() {
        // Make sprite interactive
        this.sprite.setInteractive();
        
        // Add click handler
        this.sprite.on('pointerdown', () => {
            // Take configured click damage when clicked
            const damageDealt = this.takeDamage(this.clickDamage);
            
            // Show the actual damage number
            if (damageDealt > 0) {
                const damageText = this.scene.add.text(
                    this.sprite.x,
                    this.sprite.y - 20,
                    damageDealt.toString(),
                    {
                        fontSize: '20px',
                        fill: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                );
                
                // Animate the damage number floating up and fading away
                this.scene.tweens.add({
                    targets: damageText,
                    y: damageText.y - 50,
                    alpha: 0,
                    duration: 1000,
                    ease: 'Cubic.Out',
                    onComplete: () => {
                        damageText.destroy();
                    }
                });
            }
            
            // Play hit effects
            if (!this.isStaggered) {
                this.playHitEffects();
            }
        });
    }

    playHitEffects() {
        this.isStaggered = true;

        // Store original tint
        const originalTint = this.sprite.tintTopLeft;

        // Flash white
        this.sprite.setTint(0xffffff);

        // Create a slight knockback/stagger effect
        const staggerDistance = 10;
        const staggerDuration = 100;
        
        // Random direction for stagger
        const angle = Math.random() * Math.PI * 2;
        const staggerX = Math.cos(angle) * staggerDistance;
        const staggerY = Math.sin(angle) * staggerDistance;

        // Create stagger animation that includes both sprite and health bar
        this.scene.tweens.add({
            targets: [this.sprite, this.healthBar.container],
            x: '+='+staggerX,
            y: '+='+staggerY,
            duration: staggerDuration / 2,
            ease: 'Quad.Out',
            yoyo: true,
            onComplete: () => {
                // Reset position exactly to avoid drift
                this.sprite.x -= staggerX;
                this.sprite.y -= staggerY;
                this.healthBar.container.setPosition(
                    this.sprite.x,
                    this.sprite.y + this.healthBar.spacing
                );
            }
        });

        // Reset tint after flash duration
        this.scene.time.delayedCall(this.hitFlashDuration, () => {
            this.sprite.setTint(originalTint);
            this.isStaggered = false;
        });
    }

    updateHealthBar() {
        super.updateHealthBar();
    }

    handleMovement(input) {
        super.handleMovement(input);
        
        // Update health bar container position to follow player
        if (this.healthBar) {
            this.healthBar.container.setPosition(
                this.sprite.x,
                this.sprite.y + this.healthBar.spacing
            );
        }
    }

    update() {
        super.update();

        // Check if player has moved
        const hasMoved = this.lastX !== this.sprite.x || this.lastY !== this.sprite.y;
        
        if (hasMoved) {
            console.log(`Player moved from (${this.lastX}, ${this.lastY}) to (${this.sprite.x}, ${this.sprite.y})`);
            
            // Add trail effect if moving
            const currentTime = Date.now();
            if (currentTime - this.lastTrailTime >= this.trailConfig.spawnInterval) {
                super.createTrailEffect();
                this.lastTrailTime = currentTime;
            }
        }

        // Update last position
        this.lastX = this.sprite.x;
        this.lastY = this.sprite.y;

        // Update health bar position
        if (this.healthBar) {
            this.healthBar.container.setPosition(
                this.sprite.x,
                this.sprite.y + this.healthBar.spacing
            );
        }
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        
        // Check for death
        if (this.stats.health <= 0 && !this.isDead) {
            this.isDead = true;
            this.sprite.setTint(0x666666);  // Darken the player sprite
            this.movementEnabled = false;  // Disable movement
            
            // Add physics to make player "float" when dead
            this.sprite.body.setAllowGravity(false);
            
            // Add a slight random rotation and drift
            const randomAngle = Phaser.Math.FloatBetween(-0.5, 0.5);
            const randomVelocityX = Phaser.Math.FloatBetween(-20, 20);
            const randomVelocityY = Phaser.Math.FloatBetween(-20, 20);
            
            this.sprite.body.setAngularVelocity(randomAngle);
            this.sprite.body.setVelocity(randomVelocityX, randomVelocityY);
            this.sprite.body.setDrag(0.1);

            // Emit death event
            this.scene.events.emit('playerDeath', {
                level: this.experience.level,
                gold: this.inventory.gold
            });
        }
        
        this.updateHealthBar();
    }

    heal(amount) {
        super.heal(amount);
        this.updateHealthBar();
    }

    onDeath() {
        // Clean up health bar before death
        if (this.healthBar) {
            this.healthBar.container.destroy();
        }
        
        // Emit death event before cleanup
        this.scene.events.emit('playerDeath', {
            level: this.experience.level,
            gold: this.inventory.gold
        });

        super.onDeath();
    }

    // XP related getters
    get xp() {
        return this.experience.current;
    }

    get level() {
        return this.experience.level;
    }

    get xpToNextLevel() {
        return this.experience.toNextLevel;
    }

    gainXP(amount) {
        this.experience.current += amount;
        
        while (this.experience.current >= this.experience.toNextLevel) {
            this.levelUp();
        }

        // Emit XP gained event
        this.scene.events.emit('playerXPGained', {
            current: this.experience.current,
            toNext: this.experience.toNextLevel,
            level: this.experience.level
        });
    }

    levelUp() {
        this.experience.level++;
        this.experience.current -= this.experience.toNextLevel;
        this.experience.toNextLevel = Math.floor(this.experience.toNextLevel * 1.5);

        // Increase stats on level up
        this.stats.maxHealth += 10;
        this.stats.currentHealth = this.stats.maxHealth; // Full heal on level up
        this.stats.attackDamage += 2;
        this.stats.defense += 1;
        this.stats.moveSpeed += 0.2; // Small increment to movement speed

        // Emit level up event that the scene can listen to
        this.scene.events.emit('playerLevelUp', this.experience.level);
    }

    collectGold(amount) {
        this.inventory.gold += amount;
        this.scene.events.emit('goldCollected', this.inventory.gold);
    }

    getStats() {
        return {
            ...this.stats,
            experience: this.experience,
            gold: this.inventory.gold
        };
    }
}

export default MainPlayer;
