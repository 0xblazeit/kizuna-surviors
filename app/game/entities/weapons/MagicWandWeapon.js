import { BaseWeapon } from './BaseWeapon.js';
export class MagicWandWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        this.name = 'Shamir\'s Shard';

        // Set weapon stats
        this.stats = {
            damage: 6,
            pierce: 2,
            cooldown: 1000,
            range: 250,
            speed: 250,
            magicPower: 15,
            criticalChance: 0.05,
            elementalDamage: 3,
            scale: 0.4
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
        this.currentLevel = 1;
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
        
        // Initialize lastFiredTime
        this.lastFiredTime = 0;

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
            const sprite = this.scene.physics.add.sprite(this.player.x, this.player.y, 'weapon-wand-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setActive(true);
            sprite.setVisible(false);
            sprite.setTint(this.effectColors.primary);
            
            // Set up physics body for better collision detection
            sprite.body.setSize(30, 30);    // Slightly larger hitbox
            sprite.body.setCircle(15);      // Circular collision area
            sprite.body.setCollideWorldBounds(false);  // Allow projectiles to go off-screen
            sprite.body.setAllowGravity(false);        // Projectiles don't use gravity
            sprite.body.setImmovable(true);            // Projectiles don't get pushed by collisions

            // Add a simple glow effect using a second sprite
            const glowSprite = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-wand-projectile');
            glowSprite.setScale(this.stats.scale * 1.4);
            glowSprite.setAlpha(0.3);
            glowSprite.setVisible(false);
            glowSprite.setTint(this.effectColors.secondary);
            glowSprite.setBlendMode(Phaser.BlendModes.ADD);
            
            sprite.glow = glowSprite;

            this.activeProjectiles.push({
                sprite: sprite,
                active: false,
                angle: 0,
                pierceCount: this.stats.pierce,
                hitEnemies: new Set() // Track which enemies this projectile has hit
            });
        }
    }

    deactivateProjectile(proj) {
        if (!proj) return;
        
        proj.active = false;
        proj.pierceCount = 0;
        
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
        
        // Calculate velocity based on angle and speed
        const speed = this.stats.speed;
        const velocityX = Math.cos(proj.angle) * speed;
        const velocityY = Math.sin(proj.angle) * speed;

        // Set velocity directly on physics body
        proj.sprite.setVelocity(velocityX, velocityY);

        // Update glow position
        if (proj.sprite.glow) {
            proj.sprite.glow.x = proj.sprite.x;
            proj.sprite.glow.y = proj.sprite.y;
        }

        // Check if projectile is out of range from player
        const distanceFromPlayer = Math.sqrt(
            Math.pow(proj.sprite.x - this.player.x, 2) + 
            Math.pow(proj.sprite.y - this.player.y, 2)
        );

        if (distanceFromPlayer > this.stats.range) {
            this.deactivateProjectile(proj);
            return;
        }

        // Get the camera viewport bounds
        const camera = this.scene.cameras.main;
        const margin = 100;
        
        const bounds = {
            left: camera.scrollX - margin,
            right: camera.scrollX + camera.width + margin,
            top: camera.scrollY - margin,
            bottom: camera.scrollY + camera.height + margin
        };

        // Check if projectile is outside camera view
        if (proj.sprite.x < bounds.left || 
            proj.sprite.x > bounds.right || 
            proj.sprite.y < bounds.top || 
            proj.sprite.y > bounds.bottom) {
            this.deactivateProjectile(proj);
        }
    }

    update(time, delta) {
        // Call base class update which includes death check
        if (!super.update(time, delta)) {
            return;
        }

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

        // Check if it's time to fire
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            // Find an inactive projectile or one that's ready to be recycled
            const availableProj = this.activeProjectiles.find(proj => 
                !proj.active || 
                !proj.sprite.visible || 
                proj.pierceCount <= 0
            );
            
            if (availableProj) {
                // Reset the projectile state before firing
                availableProj.active = false;
                availableProj.pierceCount = this.stats.pierce;
                this.fireProjectile(availableProj, time);
            }
        }

        // Update active projectiles and check collisions
        this.activeProjectiles.forEach(proj => {
            if (proj.active) {
                this.updateProjectile(proj, delta);
                
                // Check for collisions with enemies
                if (this.scene.enemies && proj.pierceCount > 0) {
                    this.scene.enemies.forEach(enemy => {
                        if (enemy && enemy.sprite && enemy.sprite.active && !enemy.isDead && !proj.hitEnemies.has(enemy)) {
                            const bounds1 = proj.sprite.getBounds();
                            const bounds2 = enemy.sprite.getBounds();
                            
                            if (Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2)) {
                                this.handleHit(enemy, proj);
                                proj.hitEnemies.add(enemy);
                            }
                        }
                    });
                }
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

        // Reset pierce count and hit enemies set
        proj.pierceCount = this.stats.pierce;
        proj.hitEnemies.clear();
        
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

        // Set initial position and rotation
        proj.sprite.setPosition(this.player.x, this.player.y);
        proj.sprite.rotation = proj.angle;
        if (proj.sprite.glow) {
            proj.sprite.glow.setPosition(this.player.x, this.player.y);
            proj.sprite.glow.rotation = proj.angle;
        }
        
        proj.active = true;
        this.lastFiredTime = time;
    }

    getTargetPosition() {
        // Ensure we have valid enemies array
        if (!Array.isArray(this.scene.enemies)) {
            console.log('No valid enemies array found');
            return this.getDefaultTarget();
        }

        // Filter valid and reachable enemies
        const validEnemies = this.scene.enemies.filter(enemy => {
            if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
                return false;
            }

            // Check if enemy is within range
            const dist = this.getDistance(
                this.player.x, this.player.y,
                enemy.sprite.x, enemy.sprite.y
            );
            
            // Add a small buffer to range for better targeting
            return dist <= (this.stats.range * 1.2);
        });

        if (validEnemies.length > 0) {
            // Find the best target based on distance and angle
            let bestTarget = null;
            let bestScore = Number.MAX_VALUE;

            validEnemies.forEach(enemy => {
                const dist = this.getDistance(
                    this.player.x, this.player.y,
                    enemy.sprite.x, enemy.sprite.y
                );
                
                // Calculate angle difference from current direction
                const angle = Math.atan2(
                    enemy.sprite.y - this.player.y,
                    enemy.sprite.x - this.player.x
                );
                const currentAngle = Math.atan2(this.lastDirection.y, this.lastDirection.x);
                let angleDiff = Math.abs(angle - currentAngle);
                if (angleDiff > Math.PI) {
                    angleDiff = 2 * Math.PI - angleDiff;
                }

                // Score based on distance and angle (lower is better)
                // Prioritize enemies in front of the player
                const score = dist + (angleDiff * 100);

                if (score < bestScore) {
                    bestTarget = enemy;
                    bestScore = score;
                }
            });

            if (bestTarget) {
                return {
                    x: bestTarget.sprite.x,
                    y: bestTarget.sprite.y
                };
            }
        }

        return this.getDefaultTarget();
    }

    getDefaultTarget() {
        // Use last movement direction if no valid enemies
        const targetDistance = Math.min(100, this.stats.range * 0.5); // Don't shoot too far when no enemies
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

        // Create level up effect around the player
        const burst = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-magic-wand');
        burst.setScale(0.2);
        burst.setAlpha(0.7);
        burst.setTint(0x00ffff);

        this.scene.tweens.add({
            targets: burst,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => burst.destroy()
        });

        // Recreate projectiles with new stats
        if (this.activeProjectiles) {
            this.activeProjectiles.forEach(proj => {
                if (proj.sprite) {
                    if (proj.sprite.glow) {
                        proj.sprite.glow.destroy();
                    }
                    proj.sprite.destroy();
                }
            });
            this.activeProjectiles = [];
            this.createMagicProjectiles();
        }

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

    attack(time) {
        // Find an inactive projectile or one that's ready to be recycled
        const availableProj = this.activeProjectiles.find(proj => 
            !proj.active || 
            !proj.sprite.visible || 
            proj.pierceCount <= 0
        );
        
        if (availableProj) {
            // Reset the projectile state before firing
            availableProj.active = false;
            availableProj.pierceCount = this.stats.pierce;
            this.fireProjectile(availableProj, time);
        }

        // Call super to update lastFiredTime
        super.attack(time);
    }
}

export default MagicWandWeapon;
