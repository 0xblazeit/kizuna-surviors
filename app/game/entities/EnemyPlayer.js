import BasePlayer from './BasePlayer';

class EnemyPlayer extends BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        // Set enemy specific defaults
        const enemyConfig = {
            maxHealth: 100,
            moveSpeed: 3,
            defense: 0,
            attackSpeed: 1,
            attackDamage: 8,
            scale: 0.8,
            ...config
        };

        super(scene, x, y, texture, enemyConfig);

        // Enemy specific properties
        this.type = config.type || 'basic';
        this.isStaggered = false;
        this.hitFlashDuration = 100; // Duration of white flash in ms
        
        // Create health bar with proper spacing
        const spriteHeight = this.sprite.height * enemyConfig.scale;
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
            bar: scene.add.rectangle(0, 0, healthBarWidth, healthBarHeight, 0xff4444)
        };

        // Add components to container
        this.healthBar.container.add([this.healthBar.background, this.healthBar.bar]);
        this.healthBar.container.setDepth(1);

        // Add a black border to make the health bar more visible
        this.healthBar.background.setStrokeStyle(1, 0x000000);

        // Initialize enemy
        this.initEnemy();
    }

    initEnemy() {
        // Add any enemy specific initialization
        this.sprite.setTint(0xff9999); // Give enemies a slight red tint
        
        // Make sprite interactive
        this.sprite.setInteractive();
        
        // Add click handler
        this.sprite.on('pointerdown', () => {
            // Take 1 damage when clicked
            this.takeDamage(1);
        });
    }

    takeDamage(amount) {
        // Ensure at least 1 damage gets through
        const minDamage = Math.max(1, amount);
        const damageDealt = super.takeDamage(minDamage);
        
        // Debug log
        console.log(`Enemy took ${damageDealt} damage. Health: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
        
        this.updateHealthBar();
        
        // Only trigger hit effects if not already staggered
        if (!this.isStaggered) {
            this.playHitEffects();
        }
        
        return damageDealt;
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

        // Create stagger animation
        this.scene.tweens.add({
            targets: [this.sprite, this.healthBar.container], // Move both sprite and health bar container
            x: '+='+staggerX,
            y: '+='+staggerY,
            duration: staggerDuration / 2,
            ease: 'Quad.out',
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

    heal(amount) {
        super.heal(amount);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
        const newWidth = this.healthBar.width * healthPercent;
        
        // Update the bar width
        this.healthBar.bar.width = newWidth;
        
        // Center the bar (local position within container)
        const barOffset = (this.healthBar.width - newWidth) / 2;
        this.healthBar.bar.x = barOffset;
    }

    handleMovement(input) {
        super.handleMovement(input);
        
        // Update health bar container position to follow enemy
        if (this.healthBar) {
            this.healthBar.container.setPosition(
                this.sprite.x,
                this.sprite.y + this.healthBar.spacing
            );
        }
    }

    onDeath() {
        // Clean up health bar before death
        if (this.healthBar) {
            this.healthBar.container.destroy();
        }
        super.onDeath();
    }
}

export default EnemyPlayer;
