import BaseWeapon from './BaseWeapon';

class LecheWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Set weapon stats
        this.stats = {
            damage: 30,
            pierce: 2,
            cooldown: 1500,      // 1.5 seconds between shots
            range: 400,          // Medium range
            speed: 300,          // Medium projectile speed
            scale: 0.8,          // Base scale
            criticalChance: 0.15 // 15% crit chance
        };

        // Effect colors
        this.effectColors = {
            primary: 0xffffff,    // White
            secondary: 0xffd700,  // Gold
            energy: 0x87ceeb,     // Sky blue
            maxLevel: 0xff4d4d    // Bright red
        };

        // Initialize projectile pool
        this.maxProjectiles = 5;
        this.activeProjectiles = [];
        
        // Initialize level configuration
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.levelConfigs = {
            1: { damage: 40,  pierce: 2, cooldown: 1400, scale: 0.82 },
            2: { damage: 50,  pierce: 2, cooldown: 1300, scale: 0.84 },
            3: { damage: 65,  pierce: 3, cooldown: 1200, scale: 0.86 },
            4: { damage: 80,  pierce: 3, cooldown: 1100, scale: 0.88 },
            5: { damage: 100, pierce: 3, cooldown: 1000, scale: 0.90 },
            6: { damage: 125, pierce: 4, cooldown: 900,  scale: 0.92 },
            7: { damage: 155, pierce: 4, cooldown: 800,  scale: 0.94 },
            8: { damage: 190, pierce: 5, cooldown: 700,  scale: 1.1 }
        };

        // Set initial stats from level 1 config
        this.stats = {
            ...this.stats,
            ...this.levelConfigs[1]
        };

        console.log('Leche Weapon initialized with stats:', this.stats);
        
        this.createProjectiles();
    }

    createProjectiles() {
        this.projectiles = this.scene.add.group();
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(0, 0, 'weapon-leche-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setActive(false);
            sprite.setVisible(false);
            
            this.projectiles.add(sprite);
            this.activeProjectiles.push({
                sprite,
                active: false,
                pierceCount: this.stats.pierce
            });
        }
    }

    update(time, delta) {
        // Auto-fire if cooldown has passed
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }

        // Update active projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.active) {
                // Move projectile
                proj.sprite.x += Math.cos(proj.angle) * this.stats.speed * (delta / 1000);
                proj.sprite.y += Math.sin(proj.angle) * this.stats.speed * (delta / 1000);

                // Check for enemy collisions
                if (this.scene.enemies) {
                    this.scene.enemies.forEach(enemy => {
                        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

                        const dist = this.getDistance(
                            proj.sprite.x, proj.sprite.y,
                            enemy.sprite.x, enemy.sprite.y
                        );

                        const collisionRadius = 40;
                        if (dist < collisionRadius) {
                            this.handleHit(enemy, proj);
                        }
                    });
                }

                // Check if projectile is out of range
                const distFromStart = this.getDistance(
                    proj.sprite.x, proj.sprite.y,
                    proj.startX, proj.startY
                );

                if (distFromStart > this.stats.range) {
                    this.deactivateProjectile(proj);
                }
            }
        });
    }

    attack(time) {
        const proj = this.getInactiveProjectile();
        if (!proj) return;

        // Get target position
        const target = this.getTargetPosition();
        
        // Calculate angle to target
        const angle = Math.atan2(
            target.y - this.player.y,
            target.x - this.player.x
        );

        // Set up projectile
        proj.active = true;
        proj.pierceCount = this.stats.pierce;
        proj.angle = angle;
        proj.startX = this.player.x;
        proj.startY = this.player.y;

        // Position and activate sprite
        proj.sprite.setPosition(this.player.x, this.player.y);
        proj.sprite.setActive(true);
        proj.sprite.setVisible(true);
        
        this.lastFiredTime = time;
    }

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

        // Check for critical hit
        const isCritical = Math.random() < this.stats.criticalChance;
        const damage = isCritical ? this.stats.damage * 1.5 : this.stats.damage;

        // Apply damage
        enemy.takeDamage(damage);
        
        // Create hit effect
        this.createHitEffect(enemy, proj, isCritical);

        // Reduce pierce count
        proj.pierceCount--;
        if (proj.pierceCount <= 0) {
            this.deactivateProjectile(proj);
        }
    }

    createHitEffect(enemy, proj, isCritical) {
        const isMaxLevel = this.currentLevel === this.maxLevel;
        
        // Create impact effect
        const impact = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-leche-projectile');
        impact.setScale(0.3);
        impact.setTint(isMaxLevel ? this.effectColors.maxLevel : (isCritical ? this.effectColors.secondary : this.effectColors.primary));
        impact.setAlpha(0.8);

        // Animate impact
        this.scene.tweens.add({
            targets: impact,
            scale: isMaxLevel ? (isCritical ? 1.8 : 1.5) : (isCritical ? 1.3 : 1.0),
            alpha: 0,
            duration: isMaxLevel ? 250 : 200,
            ease: 'Power2',
            onComplete: () => impact.destroy()
        });

        // Special max level effects
        if (isMaxLevel) {
            // Add energy ring
            const energyRing = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-leche-projectile');
            energyRing.setScale(0.1);
            energyRing.setTint(this.effectColors.maxLevel);
            energyRing.setAlpha(0.7);

            this.scene.tweens.add({
                targets: energyRing,
                scale: 2.0,
                alpha: 0,
                duration: 300,
                ease: 'Power1',
                onComplete: () => energyRing.destroy()
            });

            // Add particle burst
            if (this.scene.add.particles) {
                const particles = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, 'weapon-leche-projectile', {
                    scale: { start: 0.1, end: 0 },
                    speed: { min: 50, max: 150 },
                    quantity: 8,
                    lifespan: 300,
                    tint: this.effectColors.maxLevel
                });
                
                setTimeout(() => particles.destroy(), 300);
            }
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
            // Pick closest enemy
            const closestEnemy = validEnemies.reduce((closest, current) => {
                const closestDist = this.getDistance(
                    this.player.x, this.player.y,
                    closest.sprite.x, closest.sprite.y
                );
                const currentDist = this.getDistance(
                    this.player.x, this.player.y,
                    current.sprite.x, current.sprite.y
                );
                return currentDist < closestDist ? current : closest;
            });
            
            return {
                x: closestEnemy.sprite.x,
                y: closestEnemy.sprite.y
            };
        }

        // If no enemies, shoot in player's facing direction
        const randomAngle = Math.random() * Math.PI * 2;
        return {
            x: this.player.x + Math.cos(randomAngle) * this.stats.range * 0.6,
            y: this.player.y + Math.sin(randomAngle) * this.stats.range * 0.6
        };
    }

    getInactiveProjectile() {
        return this.activeProjectiles.find(p => !p.active);
    }

    deactivateProjectile(proj) {
        proj.active = false;
        proj.sprite.setActive(false);
        proj.sprite.setVisible(false);
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

        // Update projectile scales
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                proj.sprite.setScale(this.stats.scale);
            }
        });

        return true;
    }
}

export default LecheWeapon;
