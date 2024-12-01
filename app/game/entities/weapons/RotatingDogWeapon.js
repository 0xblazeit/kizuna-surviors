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
            8: {  // Maximum power
                damage: 200,     // +50
                pierce: 6,       // +1
                count: 7,        // +1
                cooldown: 450,
                range: 350,
                speed: 550,
                detectionRange: 250,
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
        
        // Attack effect colors
        this.effectColors = {
            primary: 0x4444ff,
            secondary: 0x0099ff,
            energy: 0xaaddff
        };
        
        this.activeProjectiles = [];
        this.spawnDogs();
    }

    spawnDogs() {
        console.log('Spawning dogs...');
        
        // Check if texture exists
        if (!this.scene.textures.exists('weapon-dog-projectile')) {
            console.error('Dog sprite texture not found! Creating fallback sprite...');
            // Create a fallback sprite using graphics
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(2, 0xff0000);
            graphics.fillStyle(0xff0000, 0.5);
            graphics.beginPath();
            graphics.arc(0, 0, 15, 0, Math.PI * 2);
            graphics.closePath();
            graphics.strokePath();
            graphics.fillPath();
            
            // Convert graphics to texture
            graphics.generateTexture('weapon-dog-projectile', 32, 32);
            graphics.destroy();
        }

        // Clear existing projectiles
        this.activeProjectiles.forEach(dog => {
            if (dog.sprite) {
                dog.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Calculate initial angles for each dog
        for (let i = 0; i < this.stats.count; i++) {
            console.log(`Creating dog ${i + 1}/${this.stats.count}`);
            const angle = (i * (2 * Math.PI)) / this.stats.count;
            
            // Create sprite at guard position
            const guardDistance = this.stats.guardDistance;
            const x = this.player.x + Math.cos(angle) * guardDistance;
            const y = this.player.y + Math.sin(angle) * guardDistance;
            
            const sprite = this.scene.add.sprite(x, y, 'weapon-dog-projectile');
            sprite.setScale(0.4);
            sprite.setOrigin(0.5, 0.5);
            sprite.setDepth(5); // Set depth to appear above ground but below some entities
            
            // Debug sprite information
            console.log('Sprite created:', {
                texture: sprite.texture.key,
                frame: sprite.frame.name,
                width: sprite.width,
                height: sprite.height,
                x: x,
                y: y
            });
            
            const dog = {
                sprite,
                state: 'guarding',
                targetEnemy: null,
                lastAttackTime: 0,
                guardAngle: angle,
                lerpFactor: 0.1,
                currentSpeed: 0,
                maxSpeed: this.stats.speed,
                acceleration: 1500,
                deceleration: 2000,
                attackStartTime: 0,
                originalScale: 0.4,
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
        
        // Adjust speed based on distance
        const targetSpeed = distance > 50 ? dog.maxSpeed : dog.maxSpeed * (distance / 50);
        
        // Accelerate or decelerate
        if (targetSpeed > dog.currentSpeed) {
            dog.currentSpeed = Math.min(dog.currentSpeed + dog.acceleration * (delta / 1000), targetSpeed);
        } else {
            dog.currentSpeed = Math.max(dog.currentSpeed - dog.deceleration * (delta / 1000), targetSpeed);
        }

        if (distance > 1) {
            const angle = Math.atan2(dy, dx);
            const speed = dog.currentSpeed * (delta / 1000);
            const moveX = Math.cos(angle) * speed;
            const moveY = Math.sin(angle) * speed;
            
            dog.sprite.x += moveX;
            dog.sprite.y += moveY;
            
            // Smooth rotation
            const targetAngle = angle;
            const currentAngle = dog.sprite.rotation;
            dog.sprite.rotation = this.lerp(currentAngle, targetAngle, 0.15);
        }
    }

    createAttackEffect(dog, targetX, targetY) {
        const sprite = dog.sprite;
        if (!sprite || !sprite.active) return;

        // Create energy burst effect
        const burst = this.scene.add.sprite(sprite.x, sprite.y, 'weapon-dog-projectile');
        burst.setScale(0.2);
        burst.setAlpha(0.7);
        burst.setTint(this.effectColors.energy);
        
        // Burst animation
        this.scene.tweens.add({
            targets: burst,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeOut',
            onComplete: () => burst.destroy()
        });

        // Dog attack animation
        this.scene.tweens.add({
            targets: sprite,
            scaleX: dog.originalScale * 1.3,
            scaleY: dog.originalScale * 1.3,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (sprite.active) {
                    sprite.setScale(dog.originalScale);
                }
            }
        });

        // Add a subtle glow pulse
        const glowSprite = this.scene.add.sprite(sprite.x, sprite.y, 'weapon-dog-projectile');
        glowSprite.setScale(dog.originalScale * 1.5);
        glowSprite.setAlpha(0.3);
        glowSprite.setTint(this.effectColors.energy);
        
        this.scene.tweens.add({
            targets: glowSprite,
            alpha: 0,
            scale: dog.originalScale * 2.5,
            duration: 200,
            ease: 'Quad.easeOut',
            onComplete: () => glowSprite.destroy()
        });
    }

    update(time, delta) {
        if (!this.player || !this.scene.enemies) return;

        // Get active enemies
        const enemies = this.scene.enemies.filter(e => {
            return e && e.sprite && e.sprite.active && !e.isDead;
        });

        if (enemies.length === 0) return;

        this.activeProjectiles.forEach((dog, index) => {
            if (!dog.sprite || !dog.sprite.active) return;

            const dogX = dog.sprite.x;
            const dogY = dog.sprite.y;

            // Check if current target is still valid
            if (dog.targetEnemy) {
                const targetValid = dog.targetEnemy && 
                                  dog.targetEnemy.sprite && 
                                  dog.targetEnemy.sprite.active && 
                                  !dog.targetEnemy.isDead;
                
                if (!targetValid) {
                    dog.targetEnemy = null;
                    dog.state = 'returning';
                }
            }

            // Find new target if not attacking or returning
            if (!dog.targetEnemy && dog.state !== 'attacking' && dog.state !== 'returning') {
                let nearestEnemy = null;
                let nearestDistance = Infinity;

                for (const enemy of enemies) {
                    const distanceToEnemy = this.getDistance(dogX, dogY, enemy.sprite.x, enemy.sprite.y);
                    if (distanceToEnemy < this.stats.detectionRange && distanceToEnemy < nearestDistance) {
                        nearestDistance = distanceToEnemy;
                        nearestEnemy = enemy;
                    }
                }

                if (nearestEnemy && time - dog.lastAttackTime >= this.stats.cooldown) {
                    dog.targetEnemy = nearestEnemy;
                    dog.state = 'chasing';
                    console.log(`Dog ${index} found target at distance ${nearestDistance}`);
                }
            }

            // Update dog behavior based on state
            switch (dog.state) {
                case 'chasing':
                    if (dog.targetEnemy && dog.targetEnemy.sprite) {
                        const distanceToEnemy = this.getDistance(
                            dogX, dogY, 
                            dog.targetEnemy.sprite.x, 
                            dog.targetEnemy.sprite.y
                        );

                        // Move towards enemy
                        this.moveTowardsPoint(dog, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y, delta);

                        // Attack when close enough
                        if (distanceToEnemy < 40 && time - dog.lastAttackTime >= this.stats.cooldown) {
                            console.log(`Dog ${index} attacking enemy`);
                            dog.state = 'attacking';
                            dog.attackStartTime = time;
                            this.handleHit(dog.targetEnemy, dog);
                            dog.lastAttackTime = time;

                            // Create attack effect
                            this.createAttackEffect(dog, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y);
                        }
                    } else {
                        dog.state = 'returning';
                    }
                    break;

                case 'attacking':
                    const attackProgress = (time - dog.attackStartTime) / this.stats.attackDuration;
                    
                    // After attack duration, check if we should continue attacking or return
                    if (attackProgress >= 1) {
                        // If target is still valid and in range, go back to chasing
                        if (dog.targetEnemy && dog.targetEnemy.sprite && !dog.targetEnemy.isDead) {
                            const distanceToEnemy = this.getDistance(
                                dogX, dogY,
                                dog.targetEnemy.sprite.x,
                                dog.targetEnemy.sprite.y
                            );
                            
                            if (distanceToEnemy < this.stats.detectionRange) {
                                dog.state = 'chasing';  // Continue chasing the same target
                                console.log(`Dog ${index} continuing chase`);
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
                    const guardDistance = this.stats.guardDistance + Math.sin(time * 0.002) * 10;
                    const targetX = this.player.x + Math.cos(dog.guardAngle) * guardDistance;
                    const targetY = this.player.y + Math.sin(dog.guardAngle) * guardDistance;
                    
                    this.moveTowardsPoint(dog, targetX, targetY, delta);
                    
                    // If returned to guard position, switch back to guarding
                    if (this.getDistance(dogX, dogY, targetX, targetY) < 10) {
                        dog.state = 'guarding';
                        // Clear target so it can find new ones
                        dog.targetEnemy = null;
                    }
                    break;

                case 'guarding':
                    // Update guard position
                    const guardDist = this.stats.guardDistance + Math.sin(time * 0.002) * 10;
                    const guardX = this.player.x + Math.cos(dog.guardAngle) * guardDist;
                    const guardY = this.player.y + Math.sin(dog.guardAngle) * guardDist;
                    
                    this.moveTowardsPoint(dog, guardX, guardY, delta);
                    break;
            }

            // Check if too far from player
            const distanceToPlayer = this.getDistance(dogX, dogY, this.player.x, this.player.y);
            if (distanceToPlayer > this.stats.range) {
                dog.targetEnemy = null;
                dog.state = 'returning';
            }
        });
    }

    handleHit(enemy, dog) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

        console.log('Applying damage to enemy');
        
        // Get the source position for the hit effect
        const sourceX = dog.sprite.x;
        const sourceY = dog.sprite.y;
        
        // Apply damage using the enemy's takeDamage method
        if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(this.stats.damage, sourceX, sourceY);
            
            // Visual feedback on enemy
            enemy.sprite.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => {
                if (enemy.sprite && enemy.sprite.active && !enemy.isDead) {
                    enemy.sprite.clearTint();
                }
            });

            // Scale effect
            this.scene.tweens.add({
                targets: enemy.sprite,
                scaleX: '*=0.8',
                scaleY: '*=0.8',
                duration: 50,
                yoyo: true,
                ease: 'Quad.easeInOut'
            });
            
            // Create hit effect
            if (this.scene.textures.exists('hit_effect')) {
                const hitEffect = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'hit_effect');
                hitEffect.setScale(0.5);
                hitEffect.play('hit_animation');
                hitEffect.once('animationcomplete', () => {
                    hitEffect.destroy();
                });
            }
            
            // Emit damage numbers if available
            if (this.scene.emitDamageNumber) {
                this.scene.emitDamageNumber(this.stats.damage, enemy.sprite.x, enemy.sprite.y);
            }
        } else {
            console.error('Enemy does not have takeDamage method:', enemy);
        }
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
