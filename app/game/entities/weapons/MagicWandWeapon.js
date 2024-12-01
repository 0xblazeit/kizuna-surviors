import { BaseWeapon } from './BaseWeapon.js';
export class MagicWandWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Set weapon stats
        this.stats = {
            damage: 10,
            pierce: 3,
            cooldown: 900,  // milliseconds between shots
            range: 300,     // pixels
            speed: 300,     // pixels per second
            magicPower: 20, // percentage increase to damage
            criticalChance: 0.1,
            elementalDamage: 5,
            scale: 0.5     // base projectile scale
        };

        // Effect colors for magic wand
        this.effectColors = {
            primary: 0x00ffff,    // Cyan
            secondary: 0xff00ff,  // Magenta
            energy: 0xf0f0ff     // Light blue-white
        };

        // Initialize projectile pool
        this.maxProjectiles = 10;
        this.activeProjectiles = [];
        
        // Initialize level configuration
        this.currentLevel = 0;
        this.maxLevel = 8;
        this.levelConfigs = {
            1: { damage: 15, pierce: 4, cooldown: 950, magicPower: 25, criticalChance: 0.12, range: 450, scale: 0.55 },
            2: { damage: 20, pierce: 4, cooldown: 400, magicPower: 30, criticalChance: 0.15, range: 500, scale: 0.60 },
            3: { damage: 25, pierce: 5, cooldown: 350, magicPower: 35, criticalChance: 0.17, range: 650, scale: 0.65 },
            4: { damage: 30, pierce: 5, cooldown: 300, magicPower: 40, criticalChance: 0.20, range: 700, scale: 0.70 },
            5: { damage: 40, pierce: 6, cooldown: 250, magicPower: 50, criticalChance: 0.25, range: 850, scale: 0.75 },
            6: { damage: 50, pierce: 6, cooldown: 200, magicPower: 60, criticalChance: 0.30, range: 900, scale: 0.80 },
            7: { damage: 65, pierce: 7, cooldown: 150, magicPower: 70, criticalChance: 0.35, range: 950, scale: 0.85 },
            8: { damage: 80, pierce: 8, cooldown: 100, magicPower: 100, criticalChance: 0.40, range: 999, scale: 0.90 }
        };
        
        // Track last movement direction
        this.lastDirection = { x: 1, y: 0 }; // Default right direction

        console.log('Magic Wand initialized with stats:', this.stats);

        this.createMagicProjectiles();
    }

    createMagicProjectiles() {
        // Clear existing projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                if (proj.sprite.glow) {
                    proj.sprite.glow.destroy();
                }
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Create new projectiles
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-wand-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setActive(true);
            sprite.setVisible(false);
            sprite.setTint(this.effectColors.primary);

            // Add a simple glow effect using a second sprite
            const glowSprite = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-wand-projectile');
            glowSprite.setScale(this.stats.scale * 1.4); // Glow is 40% larger than the projectile
            glowSprite.setAlpha(0.3);
            glowSprite.setVisible(false);
            glowSprite.setTint(this.effectColors.secondary);
            glowSprite.setBlendMode(Phaser.BlendModes.ADD);
            
            // Make the glow sprite follow the main sprite
            sprite.glow = glowSprite;

            this.activeProjectiles.push({
                sprite: sprite,
                active: false,
                angle: 0,
                pierceCount: this.stats.pierce
            });
        }
    }

    deactivateProjectile(proj) {
        if (!proj) return;
        
        proj.active = false;
        if (proj.sprite) {
            proj.sprite.setVisible(false);
            if (proj.sprite.glow) {
                proj.sprite.glow.setVisible(false);
            }
        }
    }

    updateProjectile(proj, delta) {
        if (!proj.active || !proj.sprite || !proj.sprite.active) return;

        // Convert delta to seconds for consistent speed
        const deltaSeconds = delta / 1000;
        
        // Calculate movement based on angle and speed
        const speed = this.stats.speed;
        const moveX = Math.cos(proj.angle) * speed * deltaSeconds;
        const moveY = Math.sin(proj.angle) * speed * deltaSeconds;

        // Update position
        proj.sprite.x += moveX;
        proj.sprite.y += moveY;

        // Update glow position
        if (proj.sprite.glow) {
            proj.sprite.glow.x = proj.sprite.x;
            proj.sprite.glow.y = proj.sprite.y;
        }

        // Check if projectile is out of range
        const distanceFromPlayer = Math.sqrt(
            Math.pow(proj.sprite.x - this.player.x, 2) + 
            Math.pow(proj.sprite.y - this.player.y, 2)
        );

        if (distanceFromPlayer > this.stats.range) {
            console.log('Projectile out of range, deactivating');
            this.deactivateProjectile(proj);
            return;
        }

        // Check if projectile is out of bounds
        const margin = 50;
        const bounds = {
            left: -margin,
            right: this.scene.game.config.width + margin,
            top: -margin,
            bottom: this.scene.game.config.height + margin
        };

        if (proj.sprite.x < bounds.left || 
            proj.sprite.x > bounds.right || 
            proj.sprite.y < bounds.top || 
            proj.sprite.y > bounds.bottom) {
            
            console.log('Projectile out of bounds, deactivating');
            this.deactivateProjectile(proj);
        }
    }

    update(time, delta) {
        if (!this.player) return;

        // Update last movement direction if player is moving
        if (this.player.body && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)) {
            const velocity = this.player.body.velocity;
            const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            if (magnitude > 0) {
                this.lastDirection = {
                    x: velocity.x / magnitude,
                    y: velocity.y / magnitude
                };
            }
        }

        // Update each projectile
        this.activeProjectiles.forEach((proj, index) => {
            if (!proj.active) {
                // Check if it's time to fire
                if (time - this.lastFiredTime >= this.stats.cooldown) {
                    this.fireProjectile(proj, time);
                }
            } else {
                this.updateProjectile(proj, delta);
                
                // Get active enemies
                const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
                    return e && e.sprite && e.sprite.active && !e.isDead;
                }) : [];

                // Check for collisions with enemies
                enemies.forEach(enemy => {
                    // Only check collision if projectile is active and has pierce remaining
                    if (proj.active && proj.pierceCount > 0) {
                        // Get the actual positions for collision check
                        const projX = proj.sprite.x;
                        const projY = proj.sprite.y;
                        const enemyX = enemy.sprite.x;
                        const enemyY = enemy.sprite.y;

                        // Calculate distance for collision
                        const dx = projX - enemyX;
                        const dy = projY - enemyY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // Collision thresholds
                        const projRadius = 20;
                        const enemyRadius = 25;
                        const collisionThreshold = projRadius + enemyRadius;

                        // Check if collision occurred
                        if (distance < collisionThreshold) {
                            console.log('Projectile collision:', {
                                projectile: { x: projX, y: projY, active: proj.active, pierce: proj.pierceCount },
                                enemy: { x: enemyX, y: enemyY, health: enemy.stats.currentHealth },
                                distance,
                                threshold: collisionThreshold
                            });

                            // Handle the hit
                            this.handleHit(enemy, proj);
                        }
                    }
                });
            }
        });
    }

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
            console.log('Invalid enemy or already dead, skipping hit');
            return;
        }

        // Calculate damage
        let finalDamage = this.stats.damage;
        let isCritical = false;

        if (Math.random() < this.stats.criticalChance) {
            finalDamage *= 2;
            isCritical = true;
            console.log('Critical hit!', finalDamage);
        }

        // Add elemental damage
        finalDamage += this.stats.elementalDamage;
        
        // Apply magic power bonus
        finalDamage *= (1 + this.stats.magicPower / 100);
        
        const roundedDamage = Math.round(finalDamage);
        console.log('Applying hit:', {
            projectile: { x: proj.sprite.x, y: proj.sprite.y, pierce: proj.pierceCount },
            enemy: { x: enemy.sprite.x, y: enemy.sprite.y, health: enemy.stats.currentHealth },
            damage: roundedDamage,
            isCritical
        });

        // Apply damage with source position for proper hit effects
        enemy.takeDamage(roundedDamage, proj.sprite.x, proj.sprite.y);

        // Create hit effect
        this.createHitEffect(enemy, proj, isCritical);

        // Reduce pierce count and handle projectile state
        proj.pierceCount--;
        console.log('Pierce count after hit:', proj.pierceCount);
        
        if (proj.pierceCount <= 0) {
            this.deactivateProjectile(proj);
        }
    }

    fireProjectile(proj, time) {
        if (!proj.sprite || !proj.sprite.active) return;

        // Reset pierce count and make visible
        proj.pierceCount = this.stats.pierce;
        proj.sprite.setVisible(true);
        if (proj.sprite.glow) {
            proj.sprite.glow.setVisible(true);
        }
        
        // Get target position
        const target = this.getTargetPosition();
        if (!target) return;

        // Calculate angle to target
        const dx = target.x - this.player.x;
        const dy = target.y - this.player.y;
        proj.angle = Math.atan2(dy, dx);

        // Set initial position
        proj.sprite.setPosition(this.player.x, this.player.y);
        proj.sprite.rotation = proj.angle;
        if (proj.sprite.glow) {
            proj.sprite.glow.setPosition(this.player.x, this.player.y);
            proj.sprite.glow.rotation = proj.angle;
        }
        
        proj.active = true;
        this.lastFiredTime = time;

        console.log('Firing projectile:', {
            from: { x: this.player.x, y: this.player.y },
            angle: proj.angle,
            pierce: proj.pierceCount
        });
    }

    getTargetPosition() {
        // Get nearest enemy or use last movement direction
        const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead;
        }) : [];

        if (enemies.length > 0) {
            let closest = null;
            let closestDist = Number.MAX_VALUE;

            enemies.forEach(enemy => {
                const dist = this.getDistance(
                    this.player.x, this.player.y,
                    enemy.sprite.x, enemy.sprite.y
                );
                if (dist < closestDist) {
                    closest = enemy;
                    closestDist = dist;
                }
            });

            if (closest) {
                return {
                    x: closest.sprite.x,
                    y: closest.sprite.y
                };
            }
        }

        // Use last movement direction if no enemies
        const targetDistance = 100; // Distance to project the target point
        return {
            x: this.player.x + this.lastDirection.x * targetDistance,
            y: this.player.y + this.lastDirection.y * targetDistance
        };
    }

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    levelUp() {
        if (this.currentLevel >= this.maxLevel) {
            console.log('Weapon already at max level!');
            return false;
        }

        this.currentLevel++;
        const newStats = this.levelConfigs[this.currentLevel];
        
        // Update stats
        this.stats = {
            ...this.stats,
            ...newStats
        };

        console.log(`Magic Wand leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // Recreate projectiles with new scale
        this.createMagicProjectiles();

        // Create level up effects
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite && proj.sprite.active) {
                // Create a magical burst effect
                const burst = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-wand-icon');
                burst.setScale(0.2);
                burst.setAlpha(0.7);
                burst.setTint(0xffff00);

                // Special max level animation
                if (this.currentLevel === this.maxLevel) {
                    // Create multiple orbiting particles
                    for (let i = 0; i < 8; i++) {
                        const particle = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-wand-projectile');
                        particle.setScale(0.3);
                        particle.setAlpha(0.8);
                        particle.setTint(0xff00ff);

                        // Create an orbit animation
                        this.scene.tweens.add({
                            targets: particle,
                            x: {
                                getStart: () => proj.sprite.x + Math.cos(i * Math.PI / 4) * 30,
                                getEnd: () => proj.sprite.x + Math.cos((i * Math.PI / 4) + Math.PI * 2) * 30
                            },
                            y: {
                                getStart: () => proj.sprite.y + Math.sin(i * Math.PI / 4) * 30,
                                getEnd: () => proj.sprite.y + Math.sin((i * Math.PI / 4) + Math.PI * 2) * 30
                            },
                            scaleX: { from: 0.3, to: 0 },
                            scaleY: { from: 0.3, to: 0 },
                            alpha: { from: 0.8, to: 0 },
                            duration: 1000,
                            ease: 'Quad.easeOut',
                            onComplete: () => particle.destroy()
                        });
                    }

                    // Create a larger burst for max level
                    const maxLevelBurst = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-wand-icon');
                    maxLevelBurst.setScale(0.4);
                    maxLevelBurst.setAlpha(0.9);
                    maxLevelBurst.setTint(0xff00ff);

                    this.scene.tweens.add({
                        targets: maxLevelBurst,
                        scaleX: 3,
                        scaleY: 3,
                        alpha: 0,
                        duration: 800,
                        ease: 'Quad.easeOut',
                        onComplete: () => maxLevelBurst.destroy()
                    });
                }

                this.scene.tweens.add({
                    targets: burst,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 500,
                    ease: 'Quad.easeOut',
                    onComplete: () => burst.destroy()
                });

                // Scale animation on projectile
                this.scene.tweens.add({
                    targets: proj.sprite,
                    scaleX: 0.6,
                    scaleY: 0.6,
                    duration: 200,
                    yoyo: true,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        if (proj.sprite && proj.sprite.active) {
                            proj.sprite.setScale(0.4);
                        }
                    }
                });
            }
        });

        return true;
    }

    createHitEffect(enemy, proj, isCritical) {
        // Create magical hit effect
        const hitEffect = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-wand-icon');
        hitEffect.setScale(0.3);
        hitEffect.setAlpha(0.8);
        hitEffect.setTint(isCritical ? 0xffff00 : this.effectColors.secondary);

        this.scene.tweens.add({
            targets: hitEffect,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeOut',
            onComplete: () => hitEffect.destroy()
        });

        // Add particle burst on critical hits
        if (isCritical) {
            const particles = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, 'weapon-wand-icon', {
                scale: { start: 0.2, end: 0.1 },
                alpha: { start: 0.6, end: 0 },
                speed: 50,
                angle: { min: 0, max: 360 },
                rotate: { min: 0, max: 360 },
                lifespan: 500,
                quantity: 10,
                tint: 0xffff00
            });

            this.scene.time.delayedCall(500, () => particles.destroy());
        }
    }
}

export default MagicWandWeapon;
