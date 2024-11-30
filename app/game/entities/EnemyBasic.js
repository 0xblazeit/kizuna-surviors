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
                    this.takeDamage(damage);

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

    takeDamage(amount) {
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
            this.playHitEffects();
        }
        
        console.log(`Enemy health after damage: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
        return damageDealt;
    }

    playHitEffects() {
        this.isStaggered = true;
        this.movementEnabled = false; // Stop movement during stagger

        // Flash effect
        const originalTint = this.sprite.tintTopLeft;
        this.sprite.setTint(0xffffff);

        // Reset after flash duration
        this.scene.time.delayedCall(this.hitFlashDuration, () => {
            this.sprite.setTint(originalTint);
            this.isStaggered = false;
            this.movementEnabled = true;
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
            // Create a flash effect
            this.sprite.setTint(0xffffff);
            
            // Create a fade out and scale down effect
            this.scene.tweens.add({
                targets: [this.sprite],
                alpha: 0,
                scale: 0.1,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    // Create particle explosion effect
                    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
                        speed: { min: 50, max: 100 },
                        scale: { start: 0.5, end: 0 },
                        alpha: { start: 1, end: 0 },
                        lifespan: 300,
                        quantity: 20,
                        emitting: false
                    });
                    
                    // Emit particles once
                    particles.explode(20, this.sprite.x, this.sprite.y);
                    
                    // Clean up particles after animation
                    this.scene.time.delayedCall(300, () => {
                        particles.destroy();
                        resolve();
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

export default EnemyBasic;
