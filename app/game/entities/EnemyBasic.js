import BasePlayer from './BasePlayer';

class EnemyBasic extends BasePlayer {
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
        this.type = 'basic';
        this.isStaggered = false;
        this.hitFlashDuration = 300;  // Increased from 100 to 300ms
        this.staggerDuration = 500;   // Added separate stagger duration
        this.knockbackForce = 30;     // Reduced from 150 to 30
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

        // Make the enemy interactive
        this.sprite.setInteractive();

        // Handle click/tap events
        this.sprite.on('pointerdown', (pointer) => {
            // Only process click if the enemy is alive
            if (this.stats.currentHealth > 0) {
                // Get the player instance
                const player = this.scene.player;
                if (player) {
                    // Calculate damage from player's click
                    const damage = player.clickDamage;
                    this.takeDamage(damage, pointer.x, pointer.y);

                    // Create click effect
                    this.createClickEffect(pointer.x, pointer.y);
                }
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

    takeDamage(amount, sourceX, sourceY) {
        // Ensure amount is a valid number
        const damage = Number(amount) || 0;
        console.log(`Enemy taking ${damage} damage`);

        // Apply base damage calculation
        const damageDealt = super.takeDamage(damage);
        
        // Update health bar
        this.updateHealthBar();

        // Create hit marker text
        const hitMarker = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 20,
            `-${damageDealt}`,
            {
                fontSize: '16px',
                fill: '#ff0000',
                fontStyle: 'bold'
            }
        );
        hitMarker.setDepth(100);

        // Animate the hit marker
        this.scene.tweens.add({
            targets: hitMarker,
            y: hitMarker.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                hitMarker.destroy();
            }
        });

        // Play hit effects if not already staggered
        if (!this.isStaggered) {
            this.playHitEffects(sourceX, sourceY);
        }
        
        console.log(`Enemy health after damage: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
        return damageDealt;
    }

    playHitEffects(sourceX, sourceY) {
        if (this.isStaggered) return;  // Prevent stagger interruption
        
        this.isStaggered = true;
        this.movementEnabled = false; // Stop movement during stagger

        // Flash effect
        const originalTint = this.sprite.tintTopLeft;
        this.sprite.setTint(0xffffff);

        // Create a slight knockback/stagger effect
        const staggerDistance = 10;
        const staggerDuration = 100;
        
        // Calculate stagger direction
        let angle;
        if (sourceX !== undefined && sourceY !== undefined) {
            // If we have a source position, stagger away from it
            const dx = this.sprite.x - sourceX;
            const dy = this.sprite.y - sourceY;
            angle = Math.atan2(dy, dx);
        } else {
            // Otherwise use random direction like the player
            angle = Math.random() * Math.PI * 2;
        }
        
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

        // Visual feedback during stagger
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.6,
            yoyo: true,
            repeat: 2,
            duration: 100,
            ease: 'Linear'
        });

        // Reset after stagger duration
        this.scene.time.delayedCall(this.hitFlashDuration, () => {
            this.sprite.setTint(originalTint);
        });

        this.scene.time.delayedCall(this.staggerDuration, () => {
            this.isStaggered = false;
            this.movementEnabled = true;
            this.sprite.alpha = 1;
        });
    }

    createClickEffect(x, y) {
        // Create a circle at the click position
        const clickEffect = this.scene.add.circle(x, y, 5, 0xffffff);
        
        // Add a white glow effect
        clickEffect.setStrokeStyle(2, 0xffffff);
        clickEffect.setAlpha(0.8);

        // Animate the click effect
        this.scene.tweens.add({
            targets: clickEffect,
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                clickEffect.destroy();
            }
        });
    }

    updateHealthBar() {
        super.updateHealthBar();
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
            console.log('Setting up death animation');
            // Create a flash effect
            this.sprite.setTint(0xff0000);  // Red flash
            
            // Create a fade out and scale down effect
            this.scene.tweens.add({
                targets: [this.sprite],
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    console.log('Tween complete, creating particles');
                    try {
                        // Create particles at the enemy's position
                        for (let i = 0; i < 20; i++) {
                            const angle = (Math.PI * 2 / 20) * i;
                            const speed = Phaser.Math.Between(100, 200);
                            const particle = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'particle');
                            particle.setScale(0.8);
                            
                            // Set velocity based on angle
                            const vx = Math.cos(angle) * speed;
                            const vy = Math.sin(angle) * speed;
                            
                            // Animate each particle
                            this.scene.tweens.add({
                                targets: particle,
                                x: particle.x + (vx * 0.5), // Move in direction for 0.5 seconds
                                y: particle.y + (vy * 0.5),
                                alpha: 0,
                                scale: 0,
                                duration: 500,
                                ease: 'Power2',
                                onComplete: () => {
                                    particle.destroy();
                                }
                            });
                        }
                        
                        // Resolve after particles are done
                        this.scene.time.delayedCall(500, () => {
                            console.log('Animation complete');
                            resolve();
                        });
                    } catch (error) {
                        console.error('Error in particle effect:', error);
                        resolve();
                    }
                }
            });
        });
    }

    onDeath() {
        console.log('Enemy death triggered');
        // Clean up health bar
        if (this.healthBar) {
            console.log('Cleaning up health bar');
            this.healthBar.container.destroy();
        }

        // Play death animation
        console.log('Starting death animation');
        this.playDeathAnimation().then(() => {
            console.log('Death animation completed');
            if (this.sprite) {
                console.log('Destroying sprite');
                this.sprite.destroy();
            }
            // Emit any necessary events or handle additional cleanup
            this.scene.events.emit('enemyDefeated', this);
        });
    }
}

export default EnemyBasic;
