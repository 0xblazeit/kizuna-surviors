import { BaseWeapon } from './BaseWeapon.js';

class FlyingAxeWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Level-up configurations
        this.levelConfigs = {
            1: {
                damage: 15,
                pierce: 1,
                cooldown: 2500,
                range: 350,
                speed: 200,
                rotationSpeed: 4,
                scale: 0.5,
                orbitRadius: 80,
                orbitSpeed: 2.5
            },
            2: {
                damage: 35,
                pierce: 2,
                cooldown: 1100,
                range: 450,
                speed: 270,
                rotationSpeed: 5.5,
                scale: 0.55,
                orbitRadius: 110,
                orbitSpeed: 3.2
            },
            3: {
                damage: 45,
                pierce: 2,
                cooldown: 1000,
                range: 500,
                speed: 290,
                rotationSpeed: 6,
                scale: 0.6,
                orbitRadius: 120,
                orbitSpeed: 3.4
            },
            4: {
                damage: 60,
                pierce: 3,
                cooldown: 900,
                range: 550,
                speed: 310,
                rotationSpeed: 6.5,
                scale: 0.65,
                orbitRadius: 130,
                orbitSpeed: 3.6
            },
            5: {
                damage: 80,
                pierce: 3,
                cooldown: 800,
                range: 600,
                speed: 330,
                rotationSpeed: 7,
                scale: 0.7,
                orbitRadius: 140,
                orbitSpeed: 3.8
            },
            6: {
                damage: 105,
                pierce: 4,
                cooldown: 700,
                range: 650,
                speed: 350,
                rotationSpeed: 7.5,
                scale: 0.75,
                orbitRadius: 150,
                orbitSpeed: 4
            },
            7: {
                damage: 135,
                pierce: 4,
                cooldown: 600,
                range: 700,
                speed: 370,
                rotationSpeed: 8,
                scale: 0.8,
                orbitRadius: 160,
                orbitSpeed: 4.2
            },
            8: {
                damage: 175,
                pierce: 5,
                cooldown: 500,
                range: 600,
                speed: 400,
                rotationSpeed: 8.5,
                scale: 0.85,
                orbitRadius: 170,
                orbitSpeed: 4.4,
                orbitCount: 3,
                orbitSpread: 120,
                maxOrbitTime: 2.0,
                isMaxLevel: true
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.stats = { ...this.levelConfigs[1] };
        
        // Initialize projectile pool
        this.maxProjectiles = 10;
        this.activeProjectiles = [];
        this.lastFiredTime = 0;
        
        this.createProjectiles();
    }

    createProjectiles() {
        for (let i = 0; i < this.maxProjectiles; i++) {
            const sprite = this.scene.add.sprite(0, 0, 'weapon-axe-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setDepth(5);
            sprite.setVisible(false);
            sprite.setActive(false);

            // Enable physics for the projectile
            this.scene.physics.world.enable(sprite);
            sprite.body.setSize(sprite.width * 0.6, sprite.height * 0.6);

            this.activeProjectiles.push({
                sprite,
                active: false,
                pierceCount: this.stats.pierce,
                phase: 'outward', // 'outward' or 'return'
                startX: 0,
                startY: 0,
                targetX: 0,
                targetY: 0,
                rotation: 0
            });
        }
    }

    getInactiveProjectile() {
        return this.activeProjectiles.find(p => !p.active);
    }

    fireProjectile() {
        if (this.currentLevel === 8) {
            // Special level 8 firing pattern
            for (let i = 0; i < this.stats.orbitCount; i++) {
                const proj = this.getInactiveProjectile();
                if (!proj) continue;

                const startX = this.player.x;
                const startY = this.player.y;

                proj.active = true;
                proj.pierceCount = this.stats.pierce;
                proj.phase = 'orbit';
                proj.startX = startX;
                proj.startY = startY;
                // Spread axes evenly in a circle
                proj.orbitAngle = (i * this.stats.orbitSpread * Math.PI / 180);
                proj.rotation = 0;
                proj.orbitTime = 0;
                proj.orbitIndex = i; // Track which axe this is in the formation

                if (proj.sprite) {
                    proj.sprite.setPosition(startX, startY);
                    proj.sprite.setVisible(true);
                    proj.sprite.setActive(true);
                }
            }
        } else {
            // Original firing logic for levels 1-7
            const proj = this.getInactiveProjectile();
            if (!proj) return;

            const startX = this.player.x;
            const startY = this.player.y;

            proj.active = true;
            proj.pierceCount = this.stats.pierce;
            proj.phase = 'orbit';
            proj.startX = startX;
            proj.startY = startY;
            proj.orbitAngle = Math.random() * Math.PI * 2;
            proj.rotation = 0;
            proj.orbitTime = 0;

            if (proj.sprite) {
                proj.sprite.setPosition(startX, startY);
                proj.sprite.setVisible(true);
                proj.sprite.setActive(true);
            }
        }
    }

    findClosestEnemy(x, y) {
        const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead;
        }) : [];

        let closest = null;
        let closestDist = Infinity;

        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
            if (dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        });

        return closest;
    }

    update(time, delta) {
        // Call base class update which includes death check
        if (!super.update(time, delta)) {
            return;
        }

        // Auto-fire if cooldown has passed
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }

        // Update active projectiles
        this.activeProjectiles.forEach(proj => {
            if (!proj.active || !proj.sprite || !proj.sprite.active) return;

            // Update rotation
            proj.rotation += this.stats.rotationSpeed * (delta / 1000);
            proj.sprite.setRotation(proj.rotation);

            switch (proj.phase) {
                case 'orbit':
                    // Update orbit time
                    proj.orbitTime += delta / 1000;
                    
                    let currentRadius = this.stats.orbitRadius;
                    if (this.currentLevel === 8) {
                        // Level 8: Pulsating orbit radius
                        const pulseFactor = Math.sin(proj.orbitTime * 4) * 30;
                        currentRadius = this.stats.orbitRadius + pulseFactor;
                    } else {
                        // Normal expanding radius for other levels
                        currentRadius *= (1 + proj.orbitTime);
                    }
                    
                    // Update orbit angle with potential phase offset for level 8
                    if (this.currentLevel === 8) {
                        proj.orbitAngle += this.stats.orbitSpeed * (delta / 1000);
                        // Add phase offset based on axe index
                        const phaseOffset = (proj.orbitIndex * this.stats.orbitSpread * Math.PI / 180);
                        const orbitX = proj.startX + Math.cos(proj.orbitAngle + phaseOffset) * currentRadius;
                        const orbitY = proj.startY + Math.sin(proj.orbitAngle + phaseOffset) * currentRadius;
                        proj.sprite.setPosition(orbitX, orbitY);
                    } else {
                        proj.orbitAngle += this.stats.orbitSpeed * (delta / 1000);
                        const orbitX = proj.startX + Math.cos(proj.orbitAngle) * currentRadius;
                        const orbitY = proj.startY + Math.sin(proj.orbitAngle) * currentRadius;
                        proj.sprite.setPosition(orbitX, orbitY);
                    }
                    
                    // Transition to seeking phase
                    const maxOrbitTime = this.currentLevel === 8 ? this.stats.maxOrbitTime : 1.0;
                    if (proj.orbitTime >= maxOrbitTime) {
                        const closestEnemy = this.findClosestEnemy(proj.sprite.x, proj.sprite.y);
                        if (closestEnemy) {
                            proj.phase = 'seeking';
                            proj.targetEnemy = closestEnemy;
                        } else {
                            proj.phase = 'return';
                        }
                    }
                    break;

                case 'seeking':
                    if (!proj.targetEnemy || !proj.targetEnemy.sprite || !proj.targetEnemy.sprite.active || proj.targetEnemy.isDead) {
                        proj.phase = 'return';
                        break;
                    }

                    // Calculate direction to target
                    const dx = proj.targetEnemy.sprite.x - proj.sprite.x;
                    const dy = proj.targetEnemy.sprite.y - proj.sprite.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Update velocity
                    const velocity = {
                        x: Math.cos(angle) * this.stats.speed,
                        y: Math.sin(angle) * this.stats.speed
                    };
                    proj.sprite.body.setVelocity(velocity.x, velocity.y);
                    break;

                case 'return':
                    // Calculate direction to player
                    const toPlayerX = this.player.x - proj.sprite.x;
                    const toPlayerY = this.player.y - proj.sprite.y;
                    const toPlayerAngle = Math.atan2(toPlayerY, toPlayerX);
                    
                    // Update velocity
                    const returnVelocity = {
                        x: Math.cos(toPlayerAngle) * this.stats.speed,
                        y: Math.sin(toPlayerAngle) * this.stats.speed
                    };
                    proj.sprite.body.setVelocity(returnVelocity.x, returnVelocity.y);

                    // Check if returned to player
                    const distanceToPlayer = Phaser.Math.Distance.Between(
                        this.player.x,
                        this.player.y,
                        proj.sprite.x,
                        proj.sprite.y
                    );

                    if (distanceToPlayer < 20) {
                        this.deactivateProjectile(proj);
                    }
                    break;
            }

            // Check for enemy collisions
            const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
                return e && e.sprite && e.sprite.active && !e.isDead;
            }) : [];

            enemies.forEach(enemy => {
                if (proj.active && proj.pierceCount > 0) {
                    const distance = Phaser.Math.Distance.Between(
                        proj.sprite.x,
                        proj.sprite.y,
                        enemy.sprite.x,
                        enemy.sprite.y
                    );

                    // Collision thresholds
                    const projRadius = 25;
                    const enemyRadius = 25;
                    const collisionThreshold = projRadius + enemyRadius;

                    if (distance < collisionThreshold) {
                        this.handleHit(enemy, proj);
                    }
                }
            });
        });
    }

    handleHit(enemy, proj) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
            return;
        }

        // Apply damage
        enemy.takeDamage(this.stats.damage, proj.sprite.x, proj.sprite.y);

        // Create hit effect
        this.createHitEffect(enemy, proj);

        // Reduce pierce count
        proj.pierceCount--;
        
        // If no more pierce, start return phase
        if (proj.pierceCount <= 0) {
            proj.phase = 'return';
            const angle = Math.atan2(
                this.player.y - proj.sprite.y,
                this.player.x - proj.sprite.x
            );
            const velocity = {
                x: Math.cos(angle) * this.stats.speed,
                y: Math.sin(angle) * this.stats.speed
            };
            proj.sprite.body.setVelocity(velocity.x, velocity.y);
        }
    }

    createHitEffect(enemy, proj) {
        // Create a hit flash
        const flash = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-axe-projectile');
        flash.setScale(this.stats.scale * 1.5);
        flash.setAlpha(0.6);
        flash.setTint(0xFFFFFF);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: this.stats.scale * 2,
            duration: 200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Add sparks effect at max level
        if (this.currentLevel === this.maxLevel) {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const spark = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, 'weapon-axe-projectile');
                spark.setScale(this.stats.scale * 0.3);
                spark.setAlpha(0.8);
                spark.setTint(0xFFA500);

                const distance = 50;
                const endX = proj.sprite.x + Math.cos(angle) * distance;
                const endY = proj.sprite.y + Math.sin(angle) * distance;

                this.scene.tweens.add({
                    targets: spark,
                    x: endX,
                    y: endY,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => spark.destroy()
                });
            }
        }
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

    attack(time) {
        this.lastFiredTime = time;
        this.fireProjectile();
    }

    canFire() {
        return this.scene.time.now - this.lastFiredTime >= this.stats.cooldown;
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

export default FlyingAxeWeapon;
