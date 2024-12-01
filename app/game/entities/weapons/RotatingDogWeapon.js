import { BaseWeapon } from '../../weapons/BaseWeapon.js';

export class RotatingDogWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        this.stats = {
            damage: 15,
            pierce: 2,
            count: 3,
            cooldown: 2000,
            range: 150,
            speed: 200,
            detectionRange: 200,
            guardDistance: 80,
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

        for (let i = 0; i < this.stats.count; i++) {
            console.log(`Creating dog ${i + 1}/${this.stats.count}`);
            
            const sprite = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-dog-projectile');
            
            // Debug sprite information
            console.log('Sprite created:', {
                texture: sprite.texture.key,
                frame: sprite.frame.name,
                width: sprite.width,
                height: sprite.height
            });

            sprite.setScale(0.4);
            sprite.setOrigin(0.5, 0.5);
            
            // Add a subtle glow effect if FX is available
            if (sprite.preFX) {
                sprite.preFX.addGlow(0x4444ff, 0.5, 0, false, 0.1, 16);
            }
            
            const dog = {
                sprite,
                state: 'guarding',
                targetEnemy: null,
                lastAttackTime: 0,
                guardAngle: (i * (2 * Math.PI)) / this.stats.count,
                lerpFactor: 0.1,
                currentSpeed: 0,
                maxSpeed: this.stats.speed,
                acceleration: 1000,
                deceleration: 1500
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

    update(time, delta) {
        if (!this.player) return;

        const enemies = Array.isArray(this.scene.enemies) ? this.scene.enemies : [];

        this.activeProjectiles.forEach((dog, index) => {
            // Update guard formation angle based on time for subtle movement
            dog.guardAngle += 0.0005 * delta;

            const dogX = dog.sprite.x;
            const dogY = dog.sprite.y;

            // Check if current target is still valid
            if (dog.targetEnemy && (!dog.targetEnemy.active || 
                this.getDistance(dogX, dogY, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y) > this.stats.detectionRange)) {
                dog.targetEnemy = null;
                dog.state = 'returning';
            }

            // Find new target if needed
            if (!dog.targetEnemy && dog.state !== 'returning') {
                let nearestEnemy = null;
                let nearestDistance = Infinity;

                enemies.forEach(enemy => {
                    if (enemy?.active && enemy.sprite) {
                        const distance = this.getDistance(dogX, dogY, enemy.sprite.x, enemy.sprite.y);
                        if (distance < this.stats.detectionRange && distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestEnemy = enemy;
                        }
                    }
                });

                if (nearestEnemy) {
                    dog.targetEnemy = nearestEnemy;
                    dog.state = 'chasing';
                }
            }

            // Update dog behavior based on state
            switch (dog.state) {
                case 'chasing':
                    if (dog.targetEnemy?.sprite) {
                        this.moveTowardsPoint(dog, dog.targetEnemy.sprite.x, dog.targetEnemy.sprite.y, delta);
                        
                        // Attack if close enough
                        const distanceToEnemy = this.getDistance(
                            dogX, dogY, 
                            dog.targetEnemy.sprite.x, 
                            dog.targetEnemy.sprite.y
                        );
                        
                        if (distanceToEnemy < 30 && time - dog.lastAttackTime >= this.stats.cooldown) {
                            this.handleHit(dog.targetEnemy, dog);
                            dog.lastAttackTime = time;
                            
                            // Add attack animation
                            dog.sprite.setTint(0xff0000);
                            this.scene.time.delayedCall(100, () => {
                                if (dog.sprite) dog.sprite.clearTint();
                            });
                        }
                    }
                    break;

                case 'returning':
                case 'guarding':
                    // Calculate guard position with some variation
                    const guardDistance = this.stats.guardDistance + Math.sin(time * 0.002) * 10;
                    const targetX = this.player.x + Math.cos(dog.guardAngle) * guardDistance;
                    const targetY = this.player.y + Math.sin(dog.guardAngle) * guardDistance;
                    
                    this.moveTowardsPoint(dog, targetX, targetY, delta);
                    
                    // If returned to guard position, switch back to guarding
                    if (dog.state === 'returning' && 
                        this.getDistance(dogX, dogY, targetX, targetY) < 10) {
                        dog.state = 'guarding';
                    }
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
        if (enemy && enemy.damage) {
            enemy.damage(this.stats.damage);
            
            // Create hit effect if the sprite exists
            if (this.scene.textures.exists('hit_effect')) {
                const hitEffect = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'hit_effect');
                hitEffect.setScale(0.5);
                hitEffect.play('hit_animation');
                hitEffect.once('animationcomplete', () => {
                    hitEffect.destroy();
                });
            }
        }
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
