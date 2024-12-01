import { BaseWeapon } from '../../weapons/BaseWeapon';

export class MagicWandWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Level-up configurations for magic wand
        this.levelConfigs = {
            1: {
                damage: 25,
                pierce: 3,
                count: 1,
                cooldown: 800,         // Faster casting
                range: 350,            // Long range
                speed: 500,            // Fast projectile speed
                magicPower: 20,        // Special magic wand stat
                criticalChance: 0.15,  // 15% crit chance
                elementalDamage: 10    // Bonus elemental damage
            },
            2: {
                damage: 35,
                pierce: 3,
                count: 1,
                cooldown: 750,
                range: 370,
                speed: 520,
                magicPower: 30,
                criticalChance: 0.17,
                elementalDamage: 15
            },
            3: {
                damage: 45,
                pierce: 4,
                count: 2,
                cooldown: 700,
                range: 390,
                speed: 540,
                magicPower: 40,
                criticalChance: 0.19,
                elementalDamage: 20
            },
            4: {
                damage: 60,
                pierce: 4,
                count: 2,
                cooldown: 650,
                range: 410,
                speed: 560,
                magicPower: 55,
                criticalChance: 0.21,
                elementalDamage: 25
            },
            5: {
                damage: 80,
                pierce: 5,
                count: 3,
                cooldown: 600,
                range: 430,
                speed: 580,
                magicPower: 75,
                criticalChance: 0.23,
                elementalDamage: 35
            },
            6: {
                damage: 105,
                pierce: 5,
                count: 3,
                cooldown: 550,
                range: 450,
                speed: 600,
                magicPower: 100,
                criticalChance: 0.25,
                elementalDamage: 45
            },
            7: {
                damage: 135,
                pierce: 6,
                count: 4,
                cooldown: 500,
                range: 470,
                speed: 620,
                magicPower: 130,
                criticalChance: 0.27,
                elementalDamage: 60
            },
            8: {
                damage: 175,
                pierce: 6,
                count: 4,
                cooldown: 450,
                range: 500,
                speed: 650,
                magicPower: 175,
                criticalChance: 0.30,
                elementalDamage: 80,
                isMaxLevel: true
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;

        // Set initial stats from level 1 config
        this.stats = {
            ...this.levelConfigs[1],
            attackDuration: 150,
            projectileSize: 1.0
        };
        
        // Effect colors for magic wand
        this.effectColors = {
            primary: 0x00ffff,    // Cyan
            secondary: 0xff00ff,  // Magenta
            energy: 0xf0f0ff,     // Light blue-white
            maxLevel: {
                primary: 0x00ffaa,    // Magical green
                secondary: 0xff00ff,  // Bright magenta
                energy: 0xffffff      // Pure white
            }
        };
        
        this.activeProjectiles = [];
        this.createMagicProjectiles();
    }

    createMagicProjectiles() {
        // Clear existing projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                if (proj.sprite.particles) {
                    proj.sprite.particles.destroy();
                }
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Create new projectiles
        for (let i = 0; i < this.stats.count; i++) {
            const sprite = this.scene.add.sprite(0, 0, 'weapon-wand-icon');
            sprite.setScale(0.4);
            sprite.setDepth(5);

            // Add glow effect
            if (this.currentLevel === this.maxLevel) {
                sprite.setTint(this.effectColors.maxLevel.primary);
                this.addMaxLevelEffects(sprite);
            } else {
                sprite.setTint(this.effectColors.primary);
            }

            this.activeProjectiles.push({
                sprite,
                active: false,
                pierceCount: this.stats.pierce,
                angle: 0,
                index: i
            });
        }
    }

    addMaxLevelEffects(sprite) {
        // Add particle effects for max level
        const particles = this.scene.add.particles(0, 0, 'weapon-wand-icon', {
            scale: { start: 0.2, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            speed: 20,
            angle: { min: 0, max: 360 },
            rotate: { min: 0, max: 360 },
            lifespan: 1000,
            frequency: 100,
            tint: this.effectColors.maxLevel.energy
        });
        
        sprite.particles = particles;
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
            }
        });
    }

    fireProjectile(proj, time) {
        if (!proj.sprite || !proj.sprite.active) return;

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
        proj.active = true;
        proj.pierceCount = this.stats.pierce;
        this.lastFiredTime = time;

        // Add firing effects
        this.createFiringEffects(proj);
    }

    updateProjectile(proj, delta) {
        if (!proj.active || !proj.sprite || !proj.sprite.active) return;

        // Move projectile
        const speed = (this.stats.speed * delta) / 1000;
        proj.sprite.x += Math.cos(proj.angle) * speed;
        proj.sprite.y += Math.sin(proj.angle) * speed;

        // Update particles if they exist
        if (proj.sprite.particles) {
            proj.sprite.particles.setPosition(proj.sprite.x, proj.sprite.y);
        }

        // Check if projectile is out of range
        const distanceFromPlayer = this.getDistance(
            this.player.x, this.player.y,
            proj.sprite.x, proj.sprite.y
        );

        if (distanceFromPlayer > this.stats.range) {
            proj.active = false;
            proj.sprite.setPosition(this.player.x, this.player.y);
        }
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

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

        // Calculate damage with critical chance
        let finalDamage = this.stats.damage;
        let isCritical = false;

        if (Math.random() < this.stats.criticalChance) {
            finalDamage *= 2;
            isCritical = true;
        }

        // Add elemental damage
        finalDamage += this.stats.elementalDamage;
        
        // Apply magic power bonus
        finalDamage *= (1 + this.stats.magicPower / 100);

        // Apply damage
        enemy.takeDamage(Math.round(finalDamage));

        // Create hit effect
        this.createHitEffect(enemy, proj, isCritical);

        // Reduce pierce count
        proj.pierceCount--;
        if (proj.pierceCount <= 0) {
            proj.active = false;
            proj.sprite.setPosition(this.player.x, this.player.y);
        }
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
