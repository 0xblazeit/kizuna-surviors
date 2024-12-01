import { BaseWeapon } from '../../weapons/BaseWeapon';

export class MagicWandWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Set weapon stats
        this.stats = {
            damage: 10,
            pierce: 3,
            cooldown: 500,  // milliseconds between shots
            range: 400,     // pixels
            speed: 300,     // pixels per second
            magicPower: 20, // percentage increase to damage
            criticalChance: 0.1,
            elementalDamage: 5
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
        this.maxLevel = 5;
        this.levelConfigs = {
            1: { damage: 15, pierce: 4, cooldown: 450, magicPower: 25, criticalChance: 0.12 },
            2: { damage: 20, pierce: 4, cooldown: 400, magicPower: 30, criticalChance: 0.15 },
            3: { damage: 25, pierce: 5, cooldown: 350, magicPower: 35, criticalChance: 0.17 },
            4: { damage: 30, pierce: 5, cooldown: 300, magicPower: 40, criticalChance: 0.20 },
            5: { damage: 40, pierce: 6, cooldown: 250, magicPower: 50, criticalChance: 0.25 }
        };
        
        console.log('Magic Wand initialized with stats:', this.stats);

        this.createMagicProjectiles();
    }

    createMagicProjectiles() {
        // Clear existing projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Create new projectiles
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-wand-projectile');
            sprite.setScale(0.5);
            sprite.setActive(true);
            sprite.setVisible(false);
            sprite.setTint(this.effectColors.primary);

            // Add a simple glow effect using a second sprite
            const glowSprite = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-wand-projectile');
            glowSprite.setScale(0.7);
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
        proj.active = false;
        proj.sprite.setVisible(false);
        if (proj.sprite.glow) {
            proj.sprite.glow.setVisible(false);
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
        
        // Get mouse position or nearest enemy position
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

    createFiringEffects(proj) {
        // Create magical firing effect
        const burst = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-wand-icon');
        burst.setScale(0.2);
        burst.setAlpha(0.7);
        burst.setTint(this.effectColors.secondary);

        this.scene.tweens.add({
            targets: burst,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => burst.destroy()
        });
    }

    getTargetPosition() {
        // Get nearest enemy or mouse position
        const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead;
        }) : [];

        if (enemies.length > 0) {
            // Find closest enemy
            let closest = enemies[0];
            let closestDist = this.getDistance(
                this.player.x, this.player.y,
                closest.sprite.x, closest.sprite.y
            );

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

            return {
                x: closest.sprite.x,
                y: closest.sprite.y
            };
        }

        // If no enemies, return a point in the direction of mouse
        const pointer = this.scene.input.activePointer;
        return {
            x: pointer.x,
            y: pointer.y
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
        
        // Store old count to check if we need to spawn more projectiles
        const oldCount = this.stats.count;
        
        // Update stats
        this.stats = {
            ...this.stats,
            ...newStats
        };

        console.log(`Magic Wand leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // If count increased, respawn projectiles
        if (newStats.count > oldCount) {
            console.log(`Increasing projectile count from ${oldCount} to ${newStats.count}`);
            this.createMagicProjectiles();
        }

        // Create level up effects
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite && proj.sprite.active) {
                // Create a magical burst effect
                const burst = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-wand-icon');
                burst.setScale(0.2);
                burst.setAlpha(0.7);
                burst.setTint(0xffff00);

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
