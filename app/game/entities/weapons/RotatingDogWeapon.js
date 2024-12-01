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
                cooldown: 600,         // Reduced cooldown
                range: 300,            // Increased range
                speed: 450,            // Increased speed
                detectionRange: 250,   // Increased detection range
                guardDistance: 120,
            },
            2: {  // First upgrade
                damage: 20,      // +5
                pierce: 2,
                count: 3,
                cooldown: 550,   // Faster
                range: 320,      // +20
                speed: 470,      // +20
                detectionRange: 260,  // +10
                guardDistance: 120,
            },
            3: {  // Getting stronger
                damage: 30,      // +10
                pierce: 3,       // +1
                count: 4,        // +1
                cooldown: 500,
                range: 340,
                speed: 490,
                detectionRange: 270,
                guardDistance: 120,
            },
            4: {  // Significant boost
                damage: 45,      // +15
                pierce: 3,
                count: 4,
                cooldown: 450,
                range: 360,
                speed: 510,
                detectionRange: 280,
                guardDistance: 120,
            },
            5: {  // Major power spike
                damage: 70,      // +25
                pierce: 4,       // +1
                count: 5,        // +1
                cooldown: 400,
                range: 380,
                speed: 530,
                detectionRange: 290,
                guardDistance: 120,
            },
            6: {  // Getting powerful
                damage: 105,     // +35
                pierce: 4,
                count: 5,
                cooldown: 350,
                range: 400,
                speed: 550,
                detectionRange: 300,
                guardDistance: 120,
            },
            7: {  // Near maximum power
                damage: 150,     // +45
                pierce: 5,       // +1
                count: 6,        // +1
                cooldown: 300,
                range: 420,
                speed: 570,
                detectionRange: 310,
                guardDistance: 120,
            },
            8: {  // Maximum power - Special effects
                damage: 200,     // +50
                pierce: 6,       // +1
                count: 7,        // +1
                cooldown: 250,
                range: 440,
                speed: 590,
                detectionRange: 320,
                guardDistance: 120,
                isMaxLevel: true  // Special flag for max level
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;

        // Set initial stats from level 1 config
        this.stats = {
            ...this.levelConfigs[1],
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
                if (dog.sprite.particles) {
                    dog.sprite.particles.destroy();
                }
                dog.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Calculate even spacing around the circle
        const count = this.stats.count;
        const angleStep = (Math.PI * 2) / count;
        
        // Calculate sprite size for proper spacing
        const spriteSize = 32; // Assuming the sprite is 32x32 pixels
        const minSpacing = spriteSize * 1.5; // Minimum space between dogs
        const orbitRadius = Math.max(this.stats.guardDistance, (count * minSpacing) / (2 * Math.PI));
        
        // Spawn each dog with proper spacing
        for (let i = 0; i < count; i++) {
            const startAngle = i * angleStep;
            const sprite = this.scene.add.sprite(0, 0, 'weapon-dog-projectile');
            
            // Set the correct scale and anchor point
            sprite.setScale(0.5);
            sprite.setOrigin(0.5, 0.5);
            sprite.setDepth(5 + i); // Ensure consistent layering based on position

            // Set the initial tint based on level
            if (this.currentLevel === this.maxLevel) {
                sprite.setTint(this.effectColors.maxLevel.primary);
            } else {
                sprite.setTint(this.effectColors.primary);
            }

            // Add the dog to active projectiles
            this.activeProjectiles.push({
                sprite,
                angle: startAngle,
                distance: orbitRadius,
                state: 'guarding',
                lastAttackTime: 0,
                targetEnemy: null,
                originalScale: 0.5,
                index: i
            });

            // Initialize position with the calculated orbit radius
            const x = this.player.x + Math.cos(startAngle) * orbitRadius;
            const y = this.player.y + Math.sin(startAngle) * orbitRadius;
            sprite.setPosition(x, y);

            // Add max level effects if applicable
            if (this.currentLevel === this.maxLevel) {
                this.addMaxLevelEffects(sprite);
            }
        }
    }

    update(time, delta) {
        if (!this.player) return;

        // Get active enemies if they exist
        const enemies = this.scene.enemies ? this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead && !e.isDying;
        }) : [];

        // Debug: Log number of active enemies
        if (enemies.length > 0) {
            console.log(`Active enemies: ${enemies.length}`);
        }

        // Sort enemies by distance to player for better targeting
        const sortedEnemies = [...enemies].sort((a, b) => {
            const distA = this.getDistance(this.player.x, this.player.y, a.sprite.x, a.sprite.y);
            const distB = this.getDistance(this.player.x, this.player.y, b.sprite.x, b.sprite.y);
            return distA - distB;
        });

        // Calculate spacing variables (needed for all states)
        const count = this.activeProjectiles.length;
        const angleStep = (Math.PI * 2) / count;

        // First, check if any dogs need new targets
        this.activeProjectiles.forEach(dog => {
            if (dog.targetEnemy) {
                const targetValid = dog.targetEnemy && 
                                  dog.targetEnemy.sprite && 
                                  dog.targetEnemy.sprite.active && 
                                  !dog.targetEnemy.isDead && 
                                  !dog.targetEnemy.isDying;
                
                if (!targetValid) {
                    dog.targetEnemy = null;
                    dog.state = 'seeking';
                }
            }
        });

        // Assign targets to dogs without them
        const availableEnemies = new Set(sortedEnemies);
        
        this.activeProjectiles.forEach(dog => {
            if (!dog.targetEnemy && dog.state !== 'attacking') {
                // Find the closest enemy to this dog
                let bestTarget = null;
                let bestDistance = Infinity;

                for (const enemy of availableEnemies) {
                    const distanceToEnemy = this.getDistance(dog.sprite.x, dog.sprite.y, enemy.sprite.x, enemy.sprite.y);
                    const distanceToPlayer = this.getDistance(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
                    
                    // Consider both distance to dog and to player
                    if (distanceToPlayer < this.stats.range && distanceToEnemy < bestDistance) {
                        bestDistance = distanceToEnemy;
                        bestTarget = enemy;
                    }
                }

                if (bestTarget) {
                    dog.targetEnemy = bestTarget;
                    dog.state = 'chasing';
                    availableEnemies.delete(bestTarget);
                    console.log(`Dog ${dog.index} found new target at distance ${bestDistance}`);
                }
            }
        });

        // Update each dog
        this.activeProjectiles.forEach((dog, index) => {
            if (!dog.sprite || !dog.sprite.active) return;

            // Always check for closer enemies, even if we have a target
            if (dog.state !== 'attacking' && time - dog.lastAttackTime >= this.stats.cooldown) {
                let foundCloserTarget = false;
                
                for (const enemy of sortedEnemies) {
                    if (enemy === dog.targetEnemy) continue;
                    
                    const distanceToEnemy = this.getDistance(dog.sprite.x, dog.sprite.y, enemy.sprite.x, enemy.sprite.y);
                    const distanceToCurrentTarget = dog.targetEnemy ? 
                        this.getDistance(dog.sprite.x, dog.sprite.y, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y) : 
                        Infinity;

                    if (distanceToEnemy < distanceToCurrentTarget && distanceToEnemy < this.stats.detectionRange) {
                        dog.targetEnemy = enemy;
                        dog.state = 'chasing';
                        foundCloserTarget = true;
                        console.log(`Dog ${dog.index} switched to closer target`);
                        break;
                    }
                }
            }

            switch (dog.state) {
                case 'seeking':
                case 'guarding':
                    // Calculate the base angle for even spacing
                    const baseAngle = (index * angleStep) + dog.angle;
                    
                    // Calculate new position around player with proper spacing
                    const newX = this.player.x + Math.cos(baseAngle) * dog.distance;
                    const newY = this.player.y + Math.sin(baseAngle) * dog.distance;
                    
                    // Smoothly interpolate to the new position
                    const lerpFactor = 0.2;
                    dog.sprite.x = this.lerp(dog.sprite.x, newX, lerpFactor);
                    dog.sprite.y = this.lerp(dog.sprite.y, newY, lerpFactor);
                    
                    // Update particle position if it exists
                    if (dog.sprite.particles) {
                        dog.sprite.particles.setPosition(dog.sprite.x, dog.sprite.y);
                    }
                    
                    // Rotate the angle for orbital movement
                    dog.angle += 0.006;
                    
                    // Point the sprite in the direction of movement
                    const angle = Math.atan2(dog.sprite.y - this.player.y, dog.sprite.x - this.player.x);
                    dog.sprite.rotation = angle;

                    // Actively look for targets while in these states
                    if (!dog.targetEnemy && enemies.length > 0) {
                        const nearestEnemy = this.findNearestEnemy(dog, enemies);
                        if (nearestEnemy) {
                            dog.targetEnemy = nearestEnemy;
                            dog.state = 'chasing';
                            console.log(`Dog ${dog.index} found target while ${dog.state}`);
                        }
                    }
                    break;

                case 'chasing':
                    if (dog.targetEnemy && dog.targetEnemy.sprite) {
                        const distanceToEnemy = this.getDistance(
                            dog.sprite.x, dog.sprite.y,
                            dog.targetEnemy.sprite.x,
                            dog.targetEnemy.sprite.y
                        );

                        // Move towards enemy with increased speed when far away
                        const speedMultiplier = distanceToEnemy > 100 ? 2.0 : 1.5;
                        this.moveTowardsPoint(dog, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y, delta, speedMultiplier);

                        // Attack when close enough
                        if (distanceToEnemy < 70 && time - dog.lastAttackTime >= this.stats.cooldown) {
                            dog.state = 'attacking';
                            dog.attackStartTime = time;
                            this.handleHit(dog.targetEnemy, dog);
                            dog.lastAttackTime = time;
                            this.createAttackEffect(dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y);
                            console.log(`Dog ${dog.index} attacking enemy`);
                        }
                    } else {
                        dog.state = 'seeking';
                        dog.targetEnemy = null;
                    }
                    break;

                case 'attacking':
                    const attackDuration = 100;
                    if (time - dog.attackStartTime >= attackDuration) {
                        if (dog.targetEnemy && dog.targetEnemy.sprite && !dog.targetEnemy.isDead && !dog.targetEnemy.isDying) {
                            const distanceToEnemy = this.getDistance(
                                dog.sprite.x, dog.sprite.y,
                                dog.targetEnemy.sprite.x,
                                dog.targetEnemy.sprite.y
                            );
                            
                            if (distanceToEnemy < this.stats.detectionRange) {
                                dog.state = 'chasing';
                            } else {
                                dog.targetEnemy = null;
                                dog.state = 'seeking';
                            }
                        } else {
                            dog.targetEnemy = null;
                            dog.state = 'seeking';
                        }
                    }
                    break;
            }

            // Check if too far from player
            const distanceToPlayer = this.getDistance(dog.sprite.x, dog.sprite.y, this.player.x, this.player.y);
            if (distanceToPlayer > this.stats.range) {
                dog.targetEnemy = null;
                dog.state = 'seeking';
            }
        });
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    moveTowardsPoint(dog, targetX, targetY, delta, speedMultiplier = 1) {
        const dx = targetX - dog.sprite.x;
        const dy = targetY - dog.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const speed = (dog.state === 'returning' ? this.stats.returnSpeed : this.stats.speed) * speedMultiplier;
            const movement = (speed * delta) / 1000;
            const ratio = Math.min(movement / distance, 1);
            
            dog.sprite.x += dx * ratio;
            dog.sprite.y += dy * ratio;
            
            // Update sprite rotation to face movement direction
            dog.sprite.rotation = Math.atan2(dy, dx);
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

    addMaxLevelEffects(sprite) {
        // Add glow effect
        const glowFX = sprite.preFX.addGlow();
        glowFX.color = this.effectColors.maxLevel.energy;
        glowFX.outerStrength = 4;
        glowFX.innerStrength = 2;
        
        // Add special particle trail
        const particles = this.scene.add.particles(sprite.x, sprite.y, 'weapon-dog-projectile', {
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: [this.effectColors.maxLevel.primary, this.effectColors.maxLevel.secondary],
            speed: 20,
            lifespan: 200,
            quantity: 1,
            blendMode: 'ADD'
        });
        
        sprite.particles = particles;
    }

    // Helper function to find the nearest enemy to a dog
    findNearestEnemy(dog, enemies) {
        let nearest = null;
        let nearestDistance = Infinity;

        for (const enemy of enemies) {
            const distanceToEnemy = this.getDistance(dog.sprite.x, dog.sprite.y, enemy.sprite.x, enemy.sprite.y);
            const distanceToPlayer = this.getDistance(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
            
            if (distanceToPlayer < this.stats.range && distanceToEnemy < this.stats.detectionRange && distanceToEnemy < nearestDistance) {
                nearest = enemy;
                nearestDistance = distanceToEnemy;
            }
        }

        return nearest;
    }
}
