import { BaseWeapon } from './BaseWeapon.js';
export class GlizzyBlasterWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Level-up configurations
        this.levelConfigs = {
            1: {
                damage: 5,          // Lower base damage
                pierce: 1,
                projectileCount: 1,
                spreadAngle: 0,
                cooldown: 200,      // Faster firing
                range: 800,         // Much longer range
                speed: 200,         // Faster projectiles
                scale: 0.4
            },
            2: {
                damage: 6,
                pierce: 1,
                projectileCount: 2,
                spreadAngle: 15,
                cooldown: 180,
                range: 850,
                speed: 620,
                scale: 0.45
            },
            3: {
                damage: 7,
                pierce: 2,
                projectileCount: 3,
                spreadAngle: 20,
                cooldown: 160,
                range: 900,
                speed: 640,
                scale: 0.5
            },
            4: {
                damage: 8,
                pierce: 2,
                projectileCount: 3,
                spreadAngle: 25,
                cooldown: 140,
                range: 950,
                speed: 660,
                scale: 0.55
            },
            5: {
                damage: 9,
                pierce: 2,
                projectileCount: 4,
                spreadAngle: 30,
                cooldown: 120,
                range: 1000,
                speed: 680,
                scale: 0.6
            },
            6: {
                damage: 10,
                pierce: 3,
                projectileCount: 5,
                spreadAngle: 35,
                cooldown: 100,
                range: 1050,
                speed: 700,
                scale: 0.65
            },
            7: {
                damage: 12,
                pierce: 3,
                projectileCount: 6,
                spreadAngle: 40,
                cooldown: 80,
                range: 1100,
                speed: 720,
                scale: 0.7
            },
            8: {
                damage: 15,
                pierce: 4,
                projectileCount: 7,
                spreadAngle: 45,
                range: 1200,
                cooldown: 60,
                speed: 750,
                scale: 0.75,
                isMaxLevel: true
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.stats = { ...this.levelConfigs[1] };
        
        // Initialize projectile pool
        this.maxProjectiles = 50;
        this.activeProjectiles = [];
        this.lastFiredTime = 0;
        
        this.createProjectiles();
    }

    update(time, delta) {
        super.update(time, delta);
        
        // Update active projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.active && proj.sprite) {
                // Check if projectile is out of range
                const distance = Phaser.Math.Distance.Between(
                    proj.startX,
                    proj.startY,
                    proj.sprite.x,
                    proj.sprite.y
                );

                if (distance > this.stats.range) {
                    this.deactivateProjectile(proj);
                    return;
                }

                // Check for collisions with enemies
                const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
                    return e && e.sprite && e.sprite.active && !e.isDead;
                }) : [];

                // Check collision with each enemy
                enemies.forEach(enemy => {
                    if (proj.active && proj.pierceCount > 0) {
                        const projX = proj.sprite.x;
                        const projY = proj.sprite.y;
                        const enemyX = enemy.sprite.x;
                        const enemyY = enemy.sprite.y;

                        // Calculate distance for collision
                        const dx = projX - enemyX;
                        const dy = projY - enemyY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // Collision thresholds
                        const projRadius = 15; // Smaller collision radius for hotdog
                        const enemyRadius = 25;
                        const collisionThreshold = projRadius + enemyRadius;

                        // Check if collision occurred
                        if (distance < collisionThreshold) {
                            this.handleHit(enemy, proj);
                        }
                    }
                });
            }
        });
        
        // Auto-fire the weapon
        if (this.canFire()) {
            this.attack(time);
        }
    }

    attack(time) {
        this.lastFiredTime = time;
        this.fireProjectiles();
    }

    fireProjectiles() {
        const direction = this.getPlayerDirection();
        const startX = this.player.x;
        const startY = this.player.y;

        // Calculate the base angle from the direction
        const baseAngle = Math.atan2(direction.y, direction.x);
        
        // Calculate spread angles based on projectile count
        const angleStep = this.stats.projectileCount > 1 ? 
            (this.stats.spreadAngle / (this.stats.projectileCount - 1)) : 0;
        const startAngle = baseAngle - (this.stats.spreadAngle / 2) * (Math.PI / 180);

        // Fire multiple projectiles in a spread pattern
        for (let i = 0; i < this.stats.projectileCount; i++) {
            const proj = this.getInactiveProjectile();
            if (!proj) continue;

            // Calculate angle for this projectile
            const angle = startAngle + (angleStep * i * Math.PI / 180);
            
            // Set projectile properties
            proj.active = true;
            proj.pierceCount = this.stats.pierce;
            proj.startX = startX;
            proj.startY = startY;
            
            if (proj.sprite) {
                proj.sprite.setPosition(startX, startY);
                proj.sprite.setVisible(true);
                proj.sprite.setActive(true);
                proj.sprite.setRotation(angle);
                
                // Calculate velocity based on angle
                const velocity = {
                    x: Math.cos(angle) * this.stats.speed,
                    y: Math.sin(angle) * this.stats.speed
                };
                
                // Set the velocity
                proj.sprite.body.setVelocity(velocity.x, velocity.y);
            }
        }
    }

    createProjectiles() {
        // Clear existing projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Create new projectiles
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(0, 0, 'weapon-hotdog-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setActive(false);
            sprite.setVisible(false);

            // Enable physics for the sprite
            this.scene.physics.world.enable(sprite);
            sprite.body.setSize(sprite.width * 0.8, sprite.height * 0.8); // Slightly smaller hitbox
            sprite.body.debugShowBody = false; // Disable debug visualization
            sprite.body.debugShowVelocity = false; // Disable velocity visualization

            this.activeProjectiles.push({
                sprite: sprite,
                active: false,
                pierceCount: this.stats.pierce
            });
        }
    }

    getInactiveProjectile() {
        return this.activeProjectiles.find(proj => !proj.active);
    }

    deactivateProjectile(proj) {
        if (!proj) return;
        
        proj.active = false;
        if (proj.sprite) {
            proj.sprite.setVisible(false);
            proj.sprite.setActive(false);
            proj.sprite.body.setVelocity(0, 0);
        }
    }

    getPlayerDirection() {
        // Get both cursor keys and WASD
        const cursors = this.scene.cursors;
        const wasd = this.scene.wasd;
        let dirX = 0;
        let dirY = 0;

        // Check both arrow keys and WASD
        if (cursors.left.isDown || wasd.left.isDown) {
            dirX = -1;
        } else if (cursors.right.isDown || wasd.right.isDown) {
            dirX = 1;
        }

        if (cursors.up.isDown || wasd.up.isDown) {
            dirY = -1;
        } else if (cursors.down.isDown || wasd.down.isDown) {
            dirY = 1;
        }

        // If no direction is pressed, use the last known direction
        if (dirX === 0 && dirY === 0) {
            if (!this.lastDirection) {
                this.lastDirection = { x: 1, y: 0 }; // Default right direction
            }
            return this.lastDirection;
        }

        // Normalize the direction vector
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        if (length > 0) {
            dirX /= length;
            dirY /= length;
        }

        // Store the current direction as the last direction
        this.lastDirection = { x: dirX, y: dirY };

        // Set the rotation of the projectile sprite to match the direction
        const angle = Math.atan2(dirY, dirX);
        if (this.activeProjectiles) {
            this.activeProjectiles.forEach(proj => {
                if (proj.sprite) {
                    proj.sprite.setRotation(angle);
                }
            });
        }

        return this.lastDirection;
    }

    levelUp() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.stats = { ...this.levelConfigs[this.currentLevel] };
            this.createProjectiles(); // Recreate projectiles with new stats
            return true;
        }
        return false;
    }

    canFire() {
        return this.scene.time.now - this.lastFiredTime >= this.stats.cooldown;
    }

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
            return;
        }

        // Apply damage
        const damage = Math.round(this.stats.damage);
        enemy.takeDamage(damage, proj.sprite.x, proj.sprite.y);

        // Create a simple hit effect
        this.createHitEffect(enemy, proj);

        // Reduce pierce count
        proj.pierceCount--;
        
        // Deactivate projectile if it has no more pierce
        if (proj.pierceCount <= 0) {
            this.deactivateProjectile(proj);
        }
    }

    createHitEffect(enemy, proj) {
        // Create a small sprite burst effect
        const hitSprite = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-hotdog-projectile');
        hitSprite.setScale(0.3);
        hitSprite.setAlpha(0.8);
        hitSprite.setTint(0xFFD700); // Golden tint

        // Create a simple burst animation
        this.scene.tweens.add({
            targets: hitSprite,
            scaleX: { from: 0.3, to: 0.6 },
            scaleY: { from: 0.3, to: 0.6 },
            alpha: { from: 0.8, to: 0 },
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                hitSprite.destroy();
            }
        });

        // Add a small rotation effect
        const rotationSprite = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-hotdog-projectile');
        rotationSprite.setScale(0.4);
        rotationSprite.setAlpha(0.5);
        rotationSprite.setTint(0xFF6B6B); // Reddish tint

        this.scene.tweens.add({
            targets: rotationSprite,
            rotation: Math.PI * 2,
            scaleX: { from: 0.4, to: 0.1 },
            scaleY: { from: 0.4, to: 0.1 },
            alpha: { from: 0.5, to: 0 },
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                rotationSprite.destroy();
            }
        });

        // Create mustard explosion at max level
        if (this.currentLevel === this.maxLevel) {
            // Create multiple mustard particles in a circular pattern
            const particleCount = 8;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const mustardSprite = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-hotdog-projectile');
                mustardSprite.setScale(0.2);
                mustardSprite.setAlpha(0.9);
                mustardSprite.setTint(0xFFDB58); // Mustard yellow color

                // Calculate end position in a circular pattern
                const radius = 50;
                const endX = proj.sprite.x + Math.cos(angle) * radius;
                const endY = proj.sprite.y + Math.sin(angle) * radius;

                // Create spreading animation
                this.scene.tweens.add({
                    targets: mustardSprite,
                    x: endX,
                    y: endY,
                    scaleX: { from: 0.2, to: 0.4 },
                    scaleY: { from: 0.2, to: 0.4 },
                    alpha: { from: 0.9, to: 0 },
                    duration: 400,
                    ease: 'Cubic.Out',
                    onComplete: () => {
                        mustardSprite.destroy();
                    }
                });
            }

            // Add a central mustard burst
            const centralBurst = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-hotdog-projectile');
            centralBurst.setScale(0.3);
            centralBurst.setAlpha(0.8);
            centralBurst.setTint(0xFFDB58);

            this.scene.tweens.add({
                targets: centralBurst,
                scaleX: { from: 0.3, to: 1.0 },
                scaleY: { from: 0.3, to: 1.0 },
                alpha: { from: 0.8, to: 0 },
                duration: 300,
                ease: 'Quad.Out',
                onComplete: () => {
                    centralBurst.destroy();
                }
            });

            // Create a shockwave ring
            const shockwave = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-hotdog-projectile');
            shockwave.setScale(0.2);
            shockwave.setAlpha(0.5);
            shockwave.setTint(0xFFA500); // Orange tint

            this.scene.tweens.add({
                targets: shockwave,
                scaleX: { from: 0.2, to: 1.5 },
                scaleY: { from: 0.2, to: 1.5 },
                alpha: { from: 0.5, to: 0 },
                duration: 500,
                ease: 'Sine.Out',
                onComplete: () => {
                    shockwave.destroy();
                }
            });
        }
    }
}

export default GlizzyBlasterWeapon;
