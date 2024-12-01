import { BaseWeapon } from '../../weapons/BaseWeapon.js';

export class RotatingDogWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Level-up configurations using Fibonacci sequence (1,1,2,3,5,8,13,21)
        this.levelConfigs = {
            1: {
                damage: 15,
                pierce: 2,
                count: 3,
                cooldown: 800,
                range: 200,
                speed: 400,
                detectionRange: 150,
            },
            2: {  // First upgrade
                damage: 20,      // +5
                pierce: 2,
                count: 3,
                cooldown: 750,   // Faster
                range: 220,      // +20
                speed: 420,      // +20
                detectionRange: 160,  // +10
            },
            3: {  // Getting stronger
                damage: 30,      // +10
                pierce: 3,       // +1
                count: 4,        // +1
                cooldown: 700,
                range: 240,
                speed: 440,
                detectionRange: 170,
            },
            4: {  // Significant boost
                damage: 45,      // +15
                pierce: 3,
                count: 4,
                cooldown: 650,
                range: 260,
                speed: 460,
                detectionRange: 180,
            },
            5: {  // Major power spike
                damage: 70,      // +25
                pierce: 4,       // +1
                count: 5,        // +1
                cooldown: 600,
                range: 280,
                speed: 480,
                detectionRange: 190,
            },
            6: {  // Getting powerful
                damage: 105,     // +35
                pierce: 4,
                count: 5,
                cooldown: 550,
                range: 300,
                speed: 500,
                detectionRange: 200,
            },
            7: {  // Near maximum power
                damage: 150,     // +45
                pierce: 5,       // +1
                count: 6,        // +1
                cooldown: 500,
                range: 320,
                speed: 520,
                detectionRange: 220,
            },
            8: {  // Maximum power - Special effects
                damage: 200,     // +50
                pierce: 6,       // +1
                count: 7,        // +1
                cooldown: 450,
                range: 350,
                speed: 550,
                detectionRange: 250,
                isMaxLevel: true  // Special flag for max level
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;

        // Set initial stats from level 1 config
        this.stats = {
            ...this.levelConfigs[1],
            guardDistance: 80,
            attackDuration: 200,
            returnSpeed: 450,
        };
        
        // Effect colors based on level
        this.effectColors = {
            primary: 0x4444ff,
            secondary: 0x0099ff,
            energy: 0xaaddff,
            // Max level colors (golden theme)
            maxLevel: {
                primary: 0xFFD700,    // Gold
                secondary: 0xFFA500,  // Orange
                energy: 0xFFFF00      // Yellow
            }
        };
        
        this.activeProjectiles = [];
        this.spawnDogs();
    }

    spawnDogs() {
        // Clear existing dogs
        this.activeProjectiles.forEach(dog => {
            if (dog.sprite) {
                dog.sprite.destroy();
                if (dog.sprite.particles) {
                    dog.sprite.particles.destroy();
                }
            }
        });
        this.activeProjectiles = [];

        const count = this.stats.count;
        const angleStep = (Math.PI * 2) / count;
        
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            
            // Calculate initial position based on player's position
            const x = this.player.x + Math.cos(angle) * this.stats.guardDistance;
            const y = this.player.y + Math.sin(angle) * this.stats.guardDistance;
            
            const sprite = this.scene.add.sprite(x, y, 'weapon-dog-projectile');
            sprite.setDepth(5); // Set depth to appear above ground but below some entities
            
            // Set the sprite's appearance
            sprite.setScale(0.5);
            
            // Apply special effects for max level
            if (this.currentLevel === this.maxLevel) {
                sprite.setTint(this.effectColors.maxLevel.primary);
                
                // Add glow effect
                const glowFX = sprite.preFX.addGlow();
                glowFX.color = this.effectColors.maxLevel.energy;
                glowFX.outerStrength = 4;
                glowFX.innerStrength = 2;
                
                // Add special particle trail
                const particles = this.scene.add.particles(x, y, 'weapon-dog-projectile', {
                    scale: { start: 0.2, end: 0 },
                    alpha: { start: 0.6, end: 0 },
                    tint: [this.effectColors.maxLevel.primary, this.effectColors.maxLevel.secondary],
                    speed: 20,
                    lifespan: 200,
                    quantity: 1,
                    blendMode: 'ADD'
                });
                
                sprite.particles = particles;
            } else {
                sprite.setTint(this.effectColors.primary);
            }

            const dog = {
                sprite,
                angle,
                distance: this.stats.guardDistance,
                originalScale: 0.5,
                hitTargets: new Set(),
                state: 'guarding',
                targetEnemy: null,
                lastAttackTime: 0,
                returnProgress: 0
            };

            this.activeProjectiles.push(dog);
        }
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    moveTowardsPoint(dog, targetX, targetY, delta) {
        const dx = targetX - dog.sprite.x;
        const dy = targetY - dog.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const speed = this.stats.speed * (delta / 1000);
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            dog.sprite.x += moveX;
            dog.sprite.y += moveY;
            
            // Update particle effect position if it exists
            if (dog.sprite.particles) {
                dog.sprite.particles.setPosition(dog.sprite.x, dog.sprite.y);
            }
        }
    }

    createAttackEffect(targetX, targetY) {
        // Create a small energy burst
        const energyBurst = this.scene.add.sprite(targetX, targetY, 'weapon-dog-projectile');
        energyBurst.setScale(0.1);
        energyBurst.setAlpha(0.4);
        energyBurst.setTint(this.effectColors.energy);
        
        // Burst animation
        this.scene.tweens.add({
            targets: energyBurst,
            scaleX: 0.8,
            scaleY: 0.8,
            alpha: 0,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => energyBurst.destroy()
        });

        // Add a subtle ring effect
        const ring = this.scene.add.sprite(targetX, targetY, 'weapon-dog-projectile');
        ring.setScale(0.2);
        ring.setAlpha(0.3);
        ring.setTint(this.effectColors.secondary);
        
        this.scene.tweens.add({
            targets: ring,
            scale: 1,
            alpha: 0,
            duration: 200,
            ease: 'Sine.easeOut',
            onComplete: () => ring.destroy()
        });

        if (this.currentLevel === this.maxLevel) {
            // Add extra effects for max level
            const maxRing = this.scene.add.sprite(targetX, targetY, 'weapon-dog-projectile');
            maxRing.setScale(0.1);
            maxRing.setAlpha(0.5);
            maxRing.setTint(this.effectColors.maxLevel.energy);
            
            this.scene.tweens.add({
                targets: maxRing,
                scale: 1.2,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => maxRing.destroy()
            });
        }
    }

    handleHit(enemy, dog) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

        console.log('Applying damage to enemy');
        
        // Get the source position for the hit effect
        const sourceX = dog.sprite.x;
        const sourceY = dog.sprite.y;
        
        // Special max level effects on hit
        if (this.currentLevel === this.maxLevel) {
            // Create subtle energy pulse
            const pulse = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-dog-projectile');
            pulse.setScale(0.2);
            pulse.setAlpha(0.3);
            pulse.setTint(this.effectColors.maxLevel.energy);
            
            this.scene.tweens.add({
                targets: pulse,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 200,
                ease: 'Quad.easeOut',
                onComplete: () => pulse.destroy()
            });
            
            // Add a subtle shockwave
            const shockwave = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'weapon-dog-projectile');
            shockwave.setScale(0.1);
            shockwave.setAlpha(0.2);
            shockwave.setTint(this.effectColors.maxLevel.secondary);
            
            this.scene.tweens.add({
                targets: shockwave,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => shockwave.destroy()
            });
            
            // Add extra damage for max level
            const critMultiplier = 1.5;
            const critChance = 0.3; // 30% chance
            if (Math.random() < critChance) {
                const critDamage = Math.floor(this.stats.damage * critMultiplier);
                enemy.takeDamage(critDamage);
                
                // Show crit text
                const critText = this.scene.add.text(enemy.sprite.x, enemy.sprite.y - 20, `CRIT! ${critDamage}`, {
                    fontSize: '20px',
                    fontFamily: 'VT323',
                    fill: '#FFD700',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: critText,
                    y: critText.y - 30,
                    alpha: 0,
                    duration: 800,
                    ease: 'Cubic.Out',
                    onComplete: () => critText.destroy()
                });
                
                return;
            }
        }
        
        // Apply normal damage
        enemy.takeDamage(this.stats.damage);
        
        // Visual feedback on enemy
        enemy.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (enemy.sprite && enemy.sprite.active && !enemy.isDead) {
                enemy.sprite.clearTint();
            }
        });

        // Subtle scale effect on enemy
        this.scene.tweens.add({
            targets: enemy.sprite,
            scaleX: '*=0.9',
            scaleY: '*=0.9',
            duration: 50,
            yoyo: true,
            ease: 'Quad.easeInOut'
        });
    }

    update(time, delta) {
        if (!this.player || !this.scene.enemies) return;

        // Get active enemies
        const enemies = this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead;
        });

        if (enemies.length === 0) return;

        // Update each dog's position and behavior
        this.activeProjectiles.forEach(dog => {
            if (!dog.sprite || !dog.sprite.active) return;

            if (dog.state === 'guarding') {
                // Calculate new position around player
                const newX = this.player.x + Math.cos(dog.angle) * dog.distance;
                const newY = this.player.y + Math.sin(dog.angle) * dog.distance;
                
                // Update sprite position
                dog.sprite.x = newX;
                dog.sprite.y = newY;
                
                // Update particle position if it exists
                if (dog.sprite.particles) {
                    dog.sprite.particles.setPosition(newX, newY);
                }
                
                // Rotate the angle for orbital movement
                dog.angle += 0.02;
            }

            // Check if current target is still valid
            if (dog.targetEnemy) {
                const targetValid = dog.targetEnemy && 
                                  dog.targetEnemy.sprite && 
                                  dog.targetEnemy.sprite.active && 
                                  !dog.targetEnemy.isDead;
                
                if (!targetValid) {
                    dog.targetEnemy = null;
                }
            }

            // Find new target if not attacking or returning
            if (!dog.targetEnemy && dog.state !== 'attacking' && dog.state !== 'returning') {
                let nearestEnemy = null;
                let nearestDistance = Infinity;

                for (const enemy of enemies) {
                    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) continue;
                    
                    const distanceToEnemy = this.getDistance(dog.sprite.x, dog.sprite.y, enemy.sprite.x, enemy.sprite.y);
                    if (distanceToEnemy < this.stats.detectionRange && distanceToEnemy < nearestDistance) {
                        nearestDistance = distanceToEnemy;
                        nearestEnemy = enemy;
                    }
                }

                if (nearestEnemy && time - dog.lastAttackTime >= this.stats.cooldown) {
                    dog.targetEnemy = nearestEnemy;
                    dog.state = 'chasing';
                    console.log(`Dog found target at distance ${nearestDistance}`);
                }
            }

            // Update dog behavior based on state
            switch (dog.state) {
                case 'chasing':
                    if (dog.targetEnemy && dog.targetEnemy.sprite) {
                        const distanceToEnemy = this.getDistance(
                            dog.sprite.x, dog.sprite.y,
                            dog.targetEnemy.sprite.x,
                            dog.targetEnemy.sprite.y
                        );

                        // Move towards enemy
                        this.moveTowardsPoint(dog, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y, delta);

                        // Attack when close enough
                        if (distanceToEnemy < 40 && time - dog.lastAttackTime >= this.stats.cooldown) {
                            console.log('Dog attacking enemy');
                            dog.state = 'attacking';
                            dog.attackStartTime = time;
                            this.handleHit(dog.targetEnemy, dog);
                            dog.lastAttackTime = time;

                            // Create attack effect
                            this.createAttackEffect(dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y);
                        }
                    } else {
                        dog.state = 'returning';
                    }
                    break;

                case 'attacking':
                    const attackDuration = 200; // ms
                    const attackProgress = (time - dog.attackStartTime) / attackDuration;

                    // After attack duration, check if we should continue attacking or return
                    if (attackProgress >= 1) {
                        // If target is still valid and in range, go back to chasing
                        if (dog.targetEnemy && dog.targetEnemy.sprite && !dog.targetEnemy.isDead) {
                            const distanceToEnemy = this.getDistance(
                                dog.sprite.x, dog.sprite.y,
                                dog.targetEnemy.sprite.x,
                                dog.targetEnemy.sprite.y
                            );
                            
                            if (distanceToEnemy < this.stats.detectionRange) {
                                dog.state = 'chasing';
                                console.log('Dog continuing chase');
                            } else {
                                dog.targetEnemy = null;
                                dog.state = 'returning';
                            }
                        } else {
                            dog.targetEnemy = null;
                            dog.state = 'returning';
                        }
                    }
                    break;

                case 'returning':
                    // Calculate guard position
                    const guardDistance = this.stats.guardDistance;
                    const targetX = this.player.x + Math.cos(dog.angle) * guardDistance;
                    const targetY = this.player.y + Math.sin(dog.angle) * guardDistance;
                    
                    this.moveTowardsPoint(dog, targetX, targetY, delta);
                    
                    // If returned to guard position, switch back to guarding
                    if (this.getDistance(dog.sprite.x, dog.sprite.y, targetX, targetY) < 10) {
                        dog.state = 'guarding';
                        dog.targetEnemy = null;
                    }
                    break;
            }

            // Check if too far from player
            const distanceToPlayer = this.getDistance(dog.sprite.x, dog.sprite.y, this.player.x, this.player.y);
            if (distanceToPlayer > this.stats.range) {
                dog.targetEnemy = null;
                dog.state = 'returning';
            }
        });
    }

    levelUp() {
        if (this.currentLevel >= this.maxLevel) {
            console.log('Weapon already at max level!');
            return false;
        }

        this.currentLevel++;
        const newStats = this.levelConfigs[this.currentLevel];
        
        // Store old count to check if we need to spawn more dogs
        const oldCount = this.stats.count;
        
        // Update stats
        this.stats = {
            ...this.stats,
            ...newStats
        };

        console.log(`Weapon leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // If count increased, respawn dogs
        if (newStats.count > oldCount) {
            console.log(`Increasing dog count from ${oldCount} to ${newStats.count}`);
            this.spawnDogs();
        }

        // Create level up effect
        if (this.activeProjectiles.length > 0) {
            this.activeProjectiles.forEach(dog => {
                if (dog.sprite && dog.sprite.active) {
                    // Create a burst effect
                    const burst = this.scene.add.sprite(dog.sprite.x, dog.sprite.y, 'weapon-dog-projectile');
                    burst.setScale(0.2);
                    burst.setAlpha(0.7);
                    burst.setTint(0xffff00); // Yellow color for level up

                    this.scene.tweens.add({
                        targets: burst,
                        scaleX: 2,
                        scaleY: 2,
                        alpha: 0,
                        duration: 500,
                        ease: 'Quad.easeOut',
                        onComplete: () => burst.destroy()
                    });

                    // Scale animation on dog
                    this.scene.tweens.add({
                        targets: dog.sprite,
                        scaleX: dog.originalScale * 1.5,
                        scaleY: dog.originalScale * 1.5,
                        duration: 200,
                        yoyo: true,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            if (dog.sprite && dog.sprite.active) {
                                dog.sprite.setScale(dog.originalScale);
                            }
                        }
                    });
                }
            });
        }

        return true;
    }

    getNextLevelPreview() {
        if (this.currentLevel >= this.maxLevel) {
            return null;
        }
        return this.levelConfigs[this.currentLevel + 1];
    }

    destroy() {
        this.activeProjectiles.forEach(dog => {
            if (dog.sprite) {
                if (dog.sprite.preFX) {
                    dog.sprite.preFX.clear();
                }
                dog.sprite.destroy();
            }
        });
        this.activeProjectiles = [];
    }
}
