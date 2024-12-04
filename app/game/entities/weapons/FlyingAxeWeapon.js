import { BaseWeapon } from './BaseWeapon.js';

class FlyingAxeWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);

        this.name = "Flying Axe";
        
        // Initialize trail container for level 8
        this.trailPool = [];
        this.trailMaxSize = 8;  // Number of trail images per axe
        
        // Level-up configurations
        this.levelConfigs = {
            1: {
                damage: 8,
                pierce: 1,
                cooldown: 2500,
                range: 350,
                speed: 200,
                rotationSpeed: 4,
                scale: 0.5,
                orbitRadius: 80,
                orbitSpeed: 2.5,
                projectileCount: 1
            },
            2: {
                damage: 13,
                pierce: 1,
                cooldown: 2200,
                range: 380,
                speed: 220,
                rotationSpeed: 4.5,
                scale: 0.53,
                orbitRadius: 90,
                orbitSpeed: 2.7,
                projectileCount: 1
            },
            3: {
                damage: 21,
                pierce: 2,
                cooldown: 1900,
                range: 410,
                speed: 240,
                rotationSpeed: 5,
                scale: 0.56,
                orbitRadius: 100,
                orbitSpeed: 2.9,
                projectileCount: 2
            },
            4: {
                damage: 34,
                pierce: 2,
                cooldown: 1600,
                range: 440,
                speed: 260,
                rotationSpeed: 5.5,
                scale: 0.59,
                orbitRadius: 110,
                orbitSpeed: 3.1,
                projectileCount: 2
            },
            5: {
                damage: 55,
                pierce: 3,
                cooldown: 1300,
                range: 470,
                speed: 280,
                rotationSpeed: 6,
                scale: 0.62,
                orbitRadius: 120,
                orbitSpeed: 3.3,
                projectileCount: 3
            },
            6: {
                damage: 89,
                pierce: 3,
                cooldown: 1000,
                range: 500,
                speed: 300,
                rotationSpeed: 6.5,
                scale: 0.65,
                orbitRadius: 130,
                orbitSpeed: 3.5,
                projectileCount: 3
            },
            7: {
                damage: 144,
                pierce: 4,
                cooldown: 800,
                range: 530,
                speed: 320,
                rotationSpeed: 7,
                scale: 0.68,
                orbitRadius: 140,
                orbitSpeed: 3.7,
                projectileCount: 4
            },
            8: {
                damage: 233,
                pierce: 4,
                cooldown: 600,
                range: 560,
                speed: 340,
                rotationSpeed: 7.5,
                scale: 0.71,
                orbitRadius: 150,
                orbitSpeed: 3.9,
                projectileCount: 5,
                orbitCount: 3,
                orbitSpread: 120,
                maxOrbitTime: 2.0,
                trailAlpha: 0.6,
                trailScale: 0.95,
                trailSpacing: 0.05,
                glowTint: 0xffff99,
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
            const sprite = this.scene.physics.add.sprite(0, 0, 'weapon-axe-projectile');
            sprite.setScale(this.stats.scale);
            sprite.setDepth(5);
            sprite.setVisible(false);
            sprite.setActive(false);

            // Enable physics for the projectile
            sprite.body.setSize(sprite.width * 0.6, sprite.height * 0.6);
            
            // Create trail sprites for level 8
            const trailSprites = [];
            for (let j = 0; j < this.trailMaxSize; j++) {
                const trailSprite = this.scene.add.sprite(0, 0, 'weapon-axe-projectile');
                trailSprite.setDepth(4);  // Set below main sprite
                trailSprite.setScale(this.stats.scale);
                trailSprite.setActive(false).setVisible(false);
                trailSprites.push(trailSprite);
            }
            this.trailPool.push(trailSprites);

            this.activeProjectiles.push({
                sprite,
                active: false,
                pierceCount: this.stats.pierce,
                phase: 'orbit',
                startX: 0,
                startY: 0,
                orbitAngle: 0,
                rotation: 0,
                orbitTime: 0,
                trailPositions: [],
                lastTrailTime: 0
            });
        }
    }

    getInactiveProjectile() {
        return this.activeProjectiles.find(p => !p.active);
    }

    fireProjectile(angleOffset = 0) {
        const proj = this.getInactiveProjectile();
        if (!proj) return;

        const player = this.player.sprite;
        
        // Set initial position with offset based on angle
        const radius = this.stats.orbitRadius;
        const startAngle = angleOffset;
        const startX = player.x + Math.cos(startAngle) * radius;
        const startY = player.y + Math.sin(startAngle) * radius;

        proj.active = true;
        proj.sprite.setActive(true).setVisible(true);
        proj.sprite.setPosition(startX, startY);
        proj.sprite.setScale(this.stats.scale);
        
        proj.pierceCount = this.stats.pierce;
        proj.phase = 'orbit';
        proj.startX = player.x;
        proj.startY = player.y;
        proj.orbitAngle = startAngle;
        proj.orbitTime = 0;
        proj.rotation = 0;
        proj.trailPositions = [];
        proj.lastTrailTime = 0;
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
        this.activeProjectiles.forEach((proj, index) => {
            if (!proj.active || !proj.sprite || !proj.sprite.active) return;

            // Update rotation
            proj.rotation += this.stats.rotationSpeed * (delta / 1000);
            proj.sprite.setRotation(proj.rotation);

            // Update projectile position based on phase
            switch (proj.phase) {
                case 'orbit':
                    // Update orbit time
                    proj.orbitTime += delta / 1000;
                    
                    // Update player reference position
                    proj.startX = this.player.sprite.x;
                    proj.startY = this.player.sprite.y;
                    
                    // Calculate orbit position
                    proj.orbitAngle += this.stats.orbitSpeed * (delta / 1000);
                    const orbitX = proj.startX + Math.cos(proj.orbitAngle) * this.stats.orbitRadius;
                    const orbitY = proj.startY + Math.sin(proj.orbitAngle) * this.stats.orbitRadius;
                    proj.sprite.setPosition(orbitX, orbitY);
                    
                    // Transition to seeking phase after orbit time
                    if (proj.orbitTime >= this.stats.maxOrbitTime) {
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

            // Level 8 trail and glow effect
            if (this.currentLevel === 8) {
                // Update main sprite glow effect
                proj.sprite.setTint(this.stats.glowTint);
                
                // Update trail positions
                const trailSprites = this.trailPool[index];
                
                // Store current position and rotation
                if (time - (proj.lastTrailTime || 0) >= this.stats.trailSpacing * 1000) {
                    proj.trailPositions.unshift({
                        x: proj.sprite.x,
                        y: proj.sprite.y,
                        rotation: proj.rotation,
                        time: time
                    });
                    proj.lastTrailTime = time;
                    
                    // Limit trail length
                    if (proj.trailPositions.length > this.trailMaxSize) {
                        proj.trailPositions.pop();
                    }
                }
                
                // Update trail sprites
                trailSprites.forEach((trailSprite, i) => {
                    if (i < proj.trailPositions.length) {
                        const pos = proj.trailPositions[i];
                        trailSprite.setActive(true).setVisible(true);
                        trailSprite.setPosition(pos.x, pos.y);
                        trailSprite.setRotation(pos.rotation);
                        
                        // Calculate fade and scale based on position in trail
                        const fadeRatio = 1 - (i / this.trailMaxSize);
                        const scaleRatio = Math.pow(this.stats.trailScale, i);
                        trailSprite.setAlpha(this.stats.trailAlpha * fadeRatio);
                        trailSprite.setScale(proj.sprite.scale * scaleRatio);
                        trailSprite.setTint(this.stats.glowTint);
                    } else {
                        trailSprite.setActive(false).setVisible(false);
                    }
                });
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
        
        // Hide trail sprites when deactivating projectile
        if (this.currentLevel === 8) {
            const index = this.activeProjectiles.indexOf(proj);
            if (index !== -1) {
                const trailSprites = this.trailPool[index];
                trailSprites.forEach(sprite => {
                    sprite.setActive(false).setVisible(false);
                });
            }
        }
        
        proj.active = false;
        proj.sprite.setActive(false).setVisible(false);
        proj.sprite.body.setVelocity(0, 0);
        proj.trailPositions = [];  // Clear trail positions
    }

    attack(time) {
        this.lastFiredTime = time;
        
        // Fire multiple projectiles based on level
        for (let i = 0; i < this.stats.projectileCount; i++) {
            const angleOffset = (i * 360 / this.stats.projectileCount) * (Math.PI / 180);
            this.fireProjectile(angleOffset);
        }
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

        console.log(`Flying Axe leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // Recreate projectiles with new stats
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];
        this.createProjectiles();

        // Create level up effect around the player
        const burst = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-axe-projectile');
        burst.setScale(0.2);
        burst.setAlpha(0.7);
        burst.setTint(0xff6b00); // Orange color for level up

        this.scene.tweens.add({
            targets: burst,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => burst.destroy()
        });

        return true;
    }
}

export default FlyingAxeWeapon;
