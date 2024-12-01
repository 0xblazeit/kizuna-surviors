import { BaseWeapon } from './BaseWeapon.js';

export class SonicBoomHammer extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Set weapon stats - slow but powerful
        this.stats = {
            damage: 50,          // High base damage
            pierce: 2,           // Can hit multiple enemies
            cooldown: 2000,      // 2 seconds between shots (slow)
            range: 500,          // Long range
            speed: 250,          // Moderate projectile speed
            knockback: 150,      // Strong knockback
            accuracy: 0.3,       // Low accuracy (0-1, lower means more spread)
            scale: 1.2,          // Large projectile
            criticalChance: 0.15 // 15% crit chance
        };

        // Effect colors for sonic boom
        this.effectColors = {
            primary: 0xff6b00,    // Orange
            secondary: 0xffd700,  // Gold
            energy: 0xffe4b5     // Moccasin
        };

        // Initialize projectile pool
        this.maxProjectiles = 5;  // Don't need many due to slow fire rate
        this.activeProjectiles = [];
        
        // Initialize level configuration
        this.currentLevel = 0;
        this.maxLevel = 8;
        this.levelConfigs = {
            1: { damage: 65,  pierce: 2, cooldown: 1900, knockback: 160, accuracy: 0.32, scale: 1.25 },
            2: { damage: 80,  pierce: 2, cooldown: 1800, knockback: 170, accuracy: 0.34, scale: 1.3 },
            3: { damage: 95,  pierce: 3, cooldown: 1700, knockback: 180, accuracy: 0.36, scale: 1.35 },
            4: { damage: 110, pierce: 3, cooldown: 1600, knockback: 190, accuracy: 0.38, scale: 1.4 },
            5: { damage: 130, pierce: 3, cooldown: 1500, knockback: 200, accuracy: 0.40, scale: 1.45 },
            6: { damage: 150, pierce: 4, cooldown: 1400, knockback: 220, accuracy: 0.42, scale: 1.5 },
            7: { damage: 175, pierce: 4, cooldown: 1300, knockback: 240, accuracy: 0.44, scale: 1.55 },
            8: { damage: 200, pierce: 5, cooldown: 1200, knockback: 260, accuracy: 0.46, scale: 1.6 }
        };

        console.log('Sonic Boom Hammer initialized with stats:', this.stats);
        
        this.createProjectiles();
    }

    createProjectiles() {
        // Clear existing projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                if (proj.sprite.shockwave) {
                    proj.sprite.shockwave.destroy();
                }
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Create new projectiles
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(0, 0, 'weapon-hammer-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setActive(true);
            sprite.setVisible(false);
            sprite.setTint(this.effectColors.primary);

            // Add shockwave effect
            const shockwave = this.scene.add.sprite(0, 0, 'weapon-hammer-projectile');
            shockwave.setScale(this.stats.scale * 1.5);
            shockwave.setAlpha(0.3);
            shockwave.setVisible(false);
            shockwave.setTint(this.effectColors.secondary);
            shockwave.setBlendMode(Phaser.BlendModes.ADD);
            
            sprite.shockwave = shockwave;

            this.activeProjectiles.push({
                sprite: sprite,
                active: false,
                angle: 0,
                pierceCount: this.stats.pierce
            });
        }
    }

    getTargetPosition() {
        // Get a list of valid enemies
        const validEnemies = this.scene.enemies ? this.scene.enemies.filter(e => {
            if (!e || !e.sprite || !e.sprite.active || e.isDead) return false;
            
            const dist = this.getDistance(
                this.player.x, this.player.y,
                e.sprite.x, e.sprite.y
            );
            return dist <= this.stats.range;
        }) : [];

        if (validEnemies.length > 0) {
            // Pick a random enemy from those in range
            const targetEnemy = validEnemies[Math.floor(Math.random() * validEnemies.length)];
            
            // Add random spread based on accuracy
            const spread = (1 - this.stats.accuracy) * Math.PI; // Lower accuracy = more spread
            const baseAngle = Math.atan2(
                targetEnemy.sprite.y - this.player.y,
                targetEnemy.sprite.x - this.player.x
            );
            
            // Random angle within spread range
            const randomSpread = (Math.random() - 0.5) * spread;
            const finalAngle = baseAngle + randomSpread;
            
            // Calculate target position using the spread angle
            const targetDistance = this.stats.range * 0.8; // Use 80% of max range
            return {
                x: this.player.x + Math.cos(finalAngle) * targetDistance,
                y: this.player.y + Math.sin(finalAngle) * targetDistance
            };
        }

        // If no enemies, shoot in a random direction
        const randomAngle = Math.random() * Math.PI * 2;
        return {
            x: this.player.x + Math.cos(randomAngle) * this.stats.range * 0.6,
            y: this.player.y + Math.sin(randomAngle) * this.stats.range * 0.6
        };
    }

    fireProjectile(proj, time) {
        if (!proj.sprite || !proj.sprite.active) return;

        // Reset pierce count
        proj.pierceCount = this.stats.pierce;
        
        // Make visible
        proj.sprite.setVisible(true);
        if (proj.sprite.shockwave) {
            proj.sprite.shockwave.setVisible(true);
        }
        
        // Get target with spread
        const target = this.getTargetPosition();
        
        // Calculate angle to target
        const dx = target.x - this.player.x;
        const dy = target.y - this.player.y;
        proj.angle = Math.atan2(dy, dx);

        // Set initial position slightly behind the player for wind-up
        const windupDistance = 40;
        proj.sprite.setPosition(
            this.player.x - Math.cos(proj.angle) * windupDistance,
            this.player.y - Math.sin(proj.angle) * windupDistance
        );
        
        // Set initial rotation for wind-up
        proj.sprite.rotation = proj.angle - Math.PI / 2;
        
        // Create the swing animation timeline
        const swingDuration = 400; // Duration of the swing in ms
        
        // Wind-up tween (pull back and rotate)
        this.scene.tweens.add({
            targets: proj.sprite,
            rotation: proj.angle - Math.PI, // Wind up rotation
            duration: swingDuration * 0.3,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // Forward swing with acceleration
                this.scene.tweens.add({
                    targets: proj.sprite,
                    rotation: proj.angle + Math.PI / 4, // Swing past the target slightly
                    duration: swingDuration * 0.7,
                    ease: 'Cubic.easeOut'
                });
            }
        });

        // Movement tween (follows the swing)
        this.scene.tweens.add({
            targets: proj.sprite,
            x: target.x,
            y: target.y,
            duration: swingDuration,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // Create shockwave effect at the end of swing
                const shockwave = this.scene.add.sprite(target.x, target.y, 'weapon-hammer-projectile');
                shockwave.setScale(0.5);
                shockwave.setAlpha(0.6);
                shockwave.setTint(this.effectColors.energy);
                
                // Expand and fade shockwave
                this.scene.tweens.add({
                    targets: shockwave,
                    scale: 2,
                    alpha: 0,
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        shockwave.destroy();
                    }
                });
            }
        });

        // Add trailing effect
        if (proj.sprite.shockwave) {
            proj.sprite.shockwave.setPosition(proj.sprite.x, proj.sprite.y);
            proj.sprite.shockwave.setScale(0.8);
            proj.sprite.shockwave.setAlpha(0.4);
            
            // Make shockwave follow the hammer with slight delay
            this.scene.tweens.add({
                targets: proj.sprite.shockwave,
                x: target.x,
                y: target.y,
                scale: 1.5,
                alpha: 0,
                duration: swingDuration * 1.2,
                ease: 'Cubic.easeOut'
            });
        }
        
        proj.active = true;
        this.lastFiredTime = time;

        // Add screen shake effect
        if (this.scene.cameras && this.scene.cameras.main) {
            // Stronger screen shake for hammer
            this.scene.cameras.main.shake(150, 0.008);
        }
    }

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

        // Calculate damage with critical hit chance
        let finalDamage = this.stats.damage;
        let isCritical = Math.random() < this.stats.criticalChance;

        if (isCritical) {
            finalDamage *= 2;
            console.log('Critical hit! Damage:', finalDamage);
        }

        // Apply damage and show damage number
        enemy.takeDamage(Math.round(finalDamage), proj.sprite.x, proj.sprite.y);

        // Apply knockback
        const angle = Math.atan2(
            enemy.sprite.y - proj.sprite.y,
            enemy.sprite.x - proj.sprite.x
        );
        
        if (enemy.sprite.body) {
            const knockbackForce = isCritical ? this.stats.knockback * 1.5 : this.stats.knockback;
            enemy.sprite.body.velocity.x += Math.cos(angle) * knockbackForce;
            enemy.sprite.body.velocity.y += Math.sin(angle) * knockbackForce;
        }

        // Create hit effect
        this.createHitEffect(enemy, proj, isCritical);

        // Reduce pierce count
        proj.pierceCount--;
        if (proj.pierceCount <= 0) {
            this.deactivateProjectile(proj);
        }

        // Debug log for hit confirmation
        console.log(`Hammer hit enemy! Damage: ${finalDamage}, Critical: ${isCritical}`);
    }

    createHitEffect(enemy, proj, isCritical) {
        // Create impact effect
        const impact = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-hammer-projectile');
        impact.setScale(0.5);
        impact.setTint(isCritical ? this.effectColors.secondary : this.effectColors.primary);
        impact.setAlpha(0.8);

        // Create ground crack effect
        const crack = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-hammer-projectile');
        crack.setScale(0.3);
        crack.setTint(this.effectColors.energy);
        crack.setAlpha(0.5);
        crack.setAngle(Math.random() * 360); // Random rotation for variety

        // Animate impact
        this.scene.tweens.add({
            targets: impact,
            scale: isCritical ? 2.5 : 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => impact.destroy()
        });

        // Animate ground crack
        this.scene.tweens.add({
            targets: crack,
            scale: isCritical ? 1.5 : 1,
            alpha: 0,
            duration: 400,
            ease: 'Power1',
            onComplete: () => crack.destroy()
        });

        // Add screen shake on critical hits
        if (isCritical && this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, 0.012);
        }
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

        console.log(`Sonic Boom Hammer leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // Recreate projectiles with new scale
        this.createProjectiles();

        return true;
    }

    update(time, delta) {
        // Check cooldown and attack if ready
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }

        // Update active projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.active) {
                // Move projectile
                proj.sprite.x += Math.cos(proj.angle) * this.stats.speed * (delta / 1000);
                proj.sprite.y += Math.sin(proj.angle) * this.stats.speed * (delta / 1000);
                
                // Update shockwave position
                if (proj.sprite.shockwave) {
                    proj.sprite.shockwave.setPosition(proj.sprite.x, proj.sprite.y);
                }

                // Check for enemy collisions
                if (this.scene.enemies) {
                    this.scene.enemies.forEach(enemy => {
                        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

                        const dist = this.getDistance(
                            proj.sprite.x, proj.sprite.y,
                            enemy.sprite.x, enemy.sprite.y
                        );

                        // Increased collision radius for better hit detection
                        const collisionRadius = 40; // Increased from 30
                        if (dist < collisionRadius) {
                            this.handleHit(enemy, proj);
                        }
                    });
                }

                // Check if projectile is out of range
                const distFromStart = this.getDistance(
                    proj.sprite.x, proj.sprite.y,
                    this.player.x, this.player.y
                );

                if (distFromStart > this.stats.range) {
                    this.deactivateProjectile(proj);
                }
            }
        });
    }

    attack(time) {
        // Find an inactive projectile
        const proj = this.activeProjectiles.find(p => !p.active);
        if (proj) {
            this.fireProjectile(proj, time);
        }
    }

    deactivateProjectile(proj) {
        proj.active = false;
        proj.sprite.setVisible(false);
        if (proj.sprite.shockwave) {
            proj.sprite.shockwave.setVisible(false);
        }
    }

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export default SonicBoomHammer;
