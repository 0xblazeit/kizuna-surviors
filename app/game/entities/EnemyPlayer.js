import BasePlayer from './BasePlayer';

class EnemyPlayer extends BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        // Set enemy specific defaults
        const enemyConfig = {
            maxHealth: 100,
            moveSpeed: Phaser.Math.FloatBetween(0.5, 2.5),
            defense: 0,
            attackSpeed: 1,
            attackDamage: 8,
            scale: 0.8,
            trailTint: 0x3498db,  // Light blue trail
            clickDamage: 25,      // Add default click damage
            ...config
        };

        super(scene, x, y, texture, enemyConfig);

        // Enemy specific properties
        this.type = config.type || 'basic';
        this.isStaggered = false;
        this.hitFlashDuration = 100;
        this.clickDamage = enemyConfig.clickDamage;
        
        // Movement properties
        this.targetPlayer = null;
        this.moveSpeed = enemyConfig.moveSpeed;
        this.movementEnabled = true;
        this.movementRange = Phaser.Math.Between(100, 300);

        // Set sprite depth
        this.sprite.setDepth(10);

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
        });

        // Find the player in the scene
        this.targetPlayer = this.scene.player;
    }

    update() {
        super.update();
        
        if (this.movementEnabled && !this.isStaggered && this.targetPlayer) {
            // Calculate distance to player
            const dx = this.targetPlayer.sprite.x - this.sprite.x;
            const dy = this.targetPlayer.sprite.y - this.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only move if within movement range
            if (distance <= this.movementRange && distance > 50) {
                // Store previous position
                const prevX = this.sprite.x;
                const prevY = this.sprite.y;
                
                // Normalize direction
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                
                // Move towards player
                this.sprite.x += normalizedDx * this.moveSpeed;
                this.sprite.y += normalizedDy * this.moveSpeed;

                // Debug: Log actual movement
                const actualDx = this.sprite.x - prevX;
                const actualDy = this.sprite.y - prevY;
                if (Math.abs(actualDx) > 0.01 || Math.abs(actualDy) > 0.01) {
                    console.log(`Enemy actually moved: dx=${actualDx}, dy=${actualDy}`);
                }
                
                // Update health bar position
                if (this.healthBar) {
                    this.healthBar.container.setPosition(
                        this.sprite.x,
                        this.sprite.y + this.healthBar.spacing
                    );
                }

                // Flip sprite based on movement direction
                if (dx < 0) {
                    this.sprite.setFlipX(true);
                } else {
                    this.sprite.setFlipX(false);
                }

                // Add trail effect if moving
                const currentTime = Date.now();
                if (currentTime - this.lastTrailTime >= this.trailConfig.spawnInterval) {
                    super.createTrailEffect();
                    this.lastTrailTime = currentTime;
                }
            }
        }
    }

    takeDamage(amount) {
        // Ensure amount is a valid number
        const damage = Number(amount) || 0;
        console.log(`Enemy taking ${damage} damage`);

        // Apply base damage calculation
        const damageDealt = super.takeDamage(damage);
        
        // Update health bar
        this.updateHealthBar();

        // Play hit effects if not already staggered
        if (!this.isStaggered) {
            this.playHitEffects();
        }
        
        console.log(`Enemy health after damage: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
        return damageDealt;
    }

    playHitEffects() {
        this.isStaggered = true;
        this.movementEnabled = false; // Stop movement during stagger

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
                this.movementEnabled = true; // Re-enable movement after stagger
            }
        });

        // Reset tint after flash duration
        this.scene.time.delayedCall(this.hitFlashDuration, () => {
            this.sprite.setTint(originalTint);
            this.isStaggered = false;
        });
    }

    updateHealthBar() {
        if (!this.healthBar) return;

        // Calculate health percentage
        const healthPercent = Math.max(0, this.stats.currentHealth) / this.stats.maxHealth;
        
        // Update health bar width
        this.healthBar.bar.width = this.healthBar.width * healthPercent;
        
        // Update color based on health percentage
        let color;
        if (healthPercent > 0.6) {
            color = 0x44ff44; // Green
        } else if (healthPercent > 0.3) {
            color = 0xffff44; // Yellow
        } else {
            color = 0xff4444; // Red
        }
        this.healthBar.bar.setFillStyle(color);
    }

    heal(amount) {
        super.heal(amount);
        this.updateHealthBar();
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

    playDeathAnimation() {
        return new Promise((resolve) => {
            const duration = 800; // Duration in ms
            
            // First tween: Scale up slightly and start fading
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: this.sprite.scaleX * 1.2,
                scaleY: this.sprite.scaleY * 1.2,
                alpha: 0.8,
                duration: duration * 0.3,
                ease: 'Quad.Out',
                onComplete: () => {
                    // Second tween: Break apart and fade away
                    this.scene.tweens.add({
                        targets: this.sprite,
                        scaleX: this.sprite.scaleX * 0.1,
                        scaleY: this.sprite.scaleY * 0.1,
                        alpha: 0,
                        angle: Math.random() < 0.5 ? 45 : -45,
                        duration: duration * 0.7,
                        ease: 'Quad.In',
                        onComplete: resolve
                    });
                }
            });
        });
    }

    onDeath() {
        // Clean up health bar
        if (this.healthBar) {
            this.healthBar.container.destroy();
        }

        // Play death animation before destroying
        this.playDeathAnimation().then(() => {
            super.onDeath();
        });
    }
}

export default EnemyPlayer;
