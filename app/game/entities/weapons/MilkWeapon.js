import { BaseWeapon } from './BaseWeapon.js';

export class MilkWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Level-up configurations
        this.levelConfigs = {
            1: {
                damage: 20,
                pierce: 2,
                cooldown: 1500,    // Time between shots
                range: 350,        // Attack range
                speed: 300,        // Projectile speed
                scale: 0.5,
                criticalChance: 0.1,  // 10% crit chance
                splashRadius: 50    // Area of effect radius
            },
            2: {
                damage: 30,
                pierce: 2,
                cooldown: 1400,
                range: 375,
                speed: 320,
                scale: 0.55,
                criticalChance: 0.12,
                splashRadius: 60
            },
            3: {
                damage: 45,
                pierce: 3,
                cooldown: 1300,
                range: 400,
                speed: 340,
                scale: 0.6,
                criticalChance: 0.14,
                splashRadius: 70
            },
            4: {
                damage: 65,
                pierce: 3,
                cooldown: 1200,
                range: 425,
                speed: 360,
                scale: 0.65,
                criticalChance: 0.16,
                splashRadius: 80
            },
            5: {
                damage: 90,
                pierce: 4,
                cooldown: 1100,
                range: 450,
                speed: 380,
                scale: 0.7,
                criticalChance: 0.18,
                splashRadius: 90
            },
            6: {
                damage: 120,
                pierce: 4,
                cooldown: 1000,
                range: 475,
                speed: 400,
                scale: 0.75,
                criticalChance: 0.20,
                splashRadius: 100
            },
            7: {
                damage: 160,
                pierce: 5,
                cooldown: 900,
                range: 500,
                speed: 420,
                scale: 0.8,
                criticalChance: 0.22,
                splashRadius: 110
            },
            8: {
                damage: 200,
                pierce: 6,
                cooldown: 800,
                range: 525,
                speed: 440,
                scale: 0.85,
                criticalChance: 0.25,
                splashRadius: 120,
                isMaxLevel: true
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.stats = { ...this.levelConfigs[1] };
        
        // Effect colors for milk weapon
        this.effectColors = {
            primary: 0xffffff,    // White
            secondary: 0xe0e0e0,  // Light gray
            energy: 0xf0f0f0,     // Very light gray
            maxLevel: {
                primary: 0xffffff,    // Pure white
                secondary: 0xf8f8f8,  // Nearly white
                energy: 0xe6e6fa      // Light purple
            }
        };
        
        // Initialize projectile pool
        this.maxProjectiles = 20;
        this.activeProjectiles = [];
        this.lastFiredTime = 0;
        
        this.createProjectiles();
    }

    createProjectiles() {
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(0, 0, 'weapon-magic-milk');
            sprite.setScale(this.stats.scale);
            sprite.setVisible(false);
            
            // Enable physics for the projectile
            this.scene.physics.world.enable(sprite);
            sprite.body.setCircle(sprite.width / 4);
            
            // Add to active projectiles array
            this.activeProjectiles.push({
                sprite,
                active: false,
                pierceCount: this.stats.pierce
            });
        }
    }

    attack(time) {
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.fireProjectile();
            this.lastFiredTime = time;
        }
    }

    fireProjectile() {
        const proj = this.getInactiveProjectile();
        if (!proj) return;

        // Reset projectile state
        proj.active = true;
        proj.pierceCount = this.stats.pierce;

        // Set initial position at player
        const startX = this.player.x;
        const startY = this.player.y;

        // Find closest enemy for targeting
        const target = this.findClosestEnemy(startX, startY);
        
        if (target) {
            // Calculate angle to target
            const angle = Math.atan2(
                target.sprite.y - startY,
                target.sprite.x - startX
            );

            // Set velocity towards target
            const velocity = {
                x: Math.cos(angle) * this.stats.speed,
                y: Math.sin(angle) * this.stats.speed
            };

            // Position and activate projectile
            proj.sprite.setPosition(startX, startY);
            proj.sprite.setVisible(true);
            proj.sprite.setActive(true);
            proj.sprite.body.setVelocity(velocity.x, velocity.y);
            
            // Add white glow effect
            proj.sprite.setTint(this.effectColors.primary);
        }
    }

    update(time, delta) {
        // Update active projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.active && proj.sprite) {
                // Check if projectile is out of range
                const distance = Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    proj.sprite.x,
                    proj.sprite.y
                );

                if (distance > this.stats.range) {
                    this.deactivateProjectile(proj);
                    return;
                }

                // Check for enemy collisions
                const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
                    return e && e.sprite && e.sprite.active && !e.isDead;
                }) : [];

                enemies.forEach(enemy => {
                    if (proj.active && proj.pierceCount > 0) {
                        const dist = Phaser.Math.Distance.Between(
                            proj.sprite.x,
                            proj.sprite.y,
                            enemy.sprite.x,
                            enemy.sprite.y
                        );

                        if (dist < this.stats.splashRadius) {
                            this.handleHit(enemy, proj);
                        }
                    }
                });
            }
        });

        // Auto-fire if cooldown has passed
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }
    }

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
            return;
        }

        // Calculate damage with critical chance
        let damage = this.stats.damage;
        const isCritical = Math.random() < this.stats.criticalChance;
        if (isCritical) {
            damage *= 1.5; // 50% more damage on critical hits
        }

        // Apply damage
        enemy.takeDamage(damage, proj.sprite.x, proj.sprite.y);

        // Create hit effect
        this.createHitEffect(enemy, proj, isCritical);

        // Reduce pierce count
        proj.pierceCount--;
        
        // Deactivate if no more pierce
        if (proj.pierceCount <= 0) {
            this.deactivateProjectile(proj);
        }
    }

    createHitEffect(enemy, proj, isCritical) {
        // Create splash effect
        const splash = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-magic-milk');
        splash.setScale(0.1);
        splash.setAlpha(0.7);
        splash.setTint(isCritical ? this.effectColors.maxLevel.energy : this.effectColors.primary);

        // Animate splash effect
        this.scene.tweens.add({
            targets: splash,
            scaleX: this.stats.splashRadius / 50,
            scaleY: this.stats.splashRadius / 50,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => splash.destroy()
        });

        // Add damage text
        if (isCritical) {
            const critText = this.scene.add.text(
                enemy.sprite.x,
                enemy.sprite.y - 20,
                `CRIT! ${Math.floor(this.stats.damage * 1.5)}`,
                {
                    fontSize: '20px',
                    fontFamily: 'VT323',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);

            this.scene.tweens.add({
                targets: critText,
                y: critText.y - 30,
                alpha: 0,
                duration: 800,
                ease: 'Cubic.Out',
                onComplete: () => critText.destroy()
            });
        }
    }

    deactivateProjectile(proj) {
        proj.active = false;
        proj.sprite.setVisible(false);
        proj.sprite.setActive(false);
        proj.sprite.body.setVelocity(0, 0);
    }

    getInactiveProjectile() {
        return this.activeProjectiles.find(p => !p.active);
    }

    findClosestEnemy(x, y) {
        const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead;
        }) : [];

        let closestEnemy = null;
        let closestDistance = Infinity;

        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                x, y,
                enemy.sprite.x, enemy.sprite.y
            );

            if (distance < closestDistance && distance <= this.stats.range) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        return closestEnemy;
    }
}

export default MilkWeapon;
