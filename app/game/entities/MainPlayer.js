import BasePlayer from './BasePlayer';

class MainPlayer extends BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        // Set main player specific defaults
        const mainPlayerConfig = {
            maxHealth: 100,
            moveSpeed: 5,
            defense: 5,
            attackSpeed: 1.2,
            attackDamage: 15,
            scale: 1,
            clickDamage: 25,
            ...config
        };

        super(scene, x, y, texture, mainPlayerConfig);

        // Player specific properties
        this.isStaggered = false;
        this.hitFlashDuration = 100;

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
        const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
        const newWidth = this.healthBar.width * healthPercent;
        
        // Update the bar width
        this.healthBar.bar.width = newWidth;
        
        // Center the bar (local position within container)
        const barOffset = (this.healthBar.width - newWidth) / 2;
        this.healthBar.bar.x = barOffset;
        
        // Update color based on health percentage
        if (healthPercent > 0.6) {
            this.healthBar.bar.setFillStyle(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            this.healthBar.bar.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBar.bar.setFillStyle(0xff0000); // Red
        }
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
        
        // Handle any continuous updates for the player
        // Currently just ensures health bar stays aligned
        if (this.healthBar) {
            this.healthBar.container.setPosition(
                this.sprite.x,
                this.sprite.y + this.healthBar.spacing
            );
        }
    }

    takeDamage(amount) {
        const damageDealt = super.takeDamage(amount);
        this.updateHealthBar();
        return damageDealt;
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
