import { BaseWeapon } from './BaseWeapon.js';

export class MilkWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        this.name = 'Milk Rain';
        this.description = 'Creates pools of damaging milk that fall from the sky';
        this.type = 'magic';
        
        // Level-up configurations
        this.levelConfigs = {
            1: {
                damage: 10,
                pierce: 1,
                cooldown: 2000,
                range: 300,
                speed: 0,
                scale: 0.5,
                criticalChance: 0.05,
                splashRadius: 40,
                puddleCount: 2,
                puddleDuration: 2500
            },
            2: {
                damage: 30,
                pierce: 2,
                cooldown: 1400,
                range: 375,
                speed: 0,
                scale: 0.55,
                criticalChance: 0.12,
                splashRadius: 60,
                puddleCount: 4,
                puddleDuration: 3500
            },
            3: {
                damage: 45,
                pierce: 3,
                cooldown: 1300,
                range: 400,
                speed: 0,
                scale: 0.6,
                criticalChance: 0.14,
                splashRadius: 70,
                puddleCount: 5,
                puddleDuration: 4000
            },
            4: {
                damage: 65,
                pierce: 3,
                cooldown: 1200,
                range: 425,
                speed: 0,
                scale: 0.65,
                criticalChance: 0.16,
                splashRadius: 80,
                puddleCount: 6,
                puddleDuration: 4500
            },
            5: {
                damage: 90,
                pierce: 4,
                cooldown: 1100,
                range: 450,
                speed: 0,
                scale: 0.7,
                criticalChance: 0.18,
                splashRadius: 90,
                puddleCount: 7,
                puddleDuration: 5000
            },
            6: {
                damage: 120,
                pierce: 4,
                cooldown: 1000,
                range: 475,
                speed: 0,
                scale: 0.75,
                criticalChance: 0.20,
                splashRadius: 100,
                puddleCount: 8,
                puddleDuration: 5500
            },
            7: {
                damage: 160,
                pierce: 5,
                cooldown: 900,
                range: 500,
                speed: 0,
                scale: 0.8,
                criticalChance: 0.22,
                splashRadius: 110,
                puddleCount: 9,
                puddleDuration: 6000
            },
            8: {
                damage: 200,
                pierce: 6,
                cooldown: 800,
                range: 525,
                speed: 0,
                scale: 0.85,
                criticalChance: 0.25,
                splashRadius: 120,
                puddleCount: 10,
                puddleDuration: 6500,
                isMaxLevel: true
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.stats = { ...this.levelConfigs[1] };
        
        this.activePuddles = [];
        this.lastAttackTime = 0;
        
        this.effectColors = {
            primary: 0xff69b4,    // Hot pink
            glow: 0xff1493,       // Deep pink
            maxLevel: {
                energy: 0xff00ff  // Magenta for crits
            }
        };
    }

    canAttack() {
        return this.scene.time.now - this.lastAttackTime >= this.stats.cooldown;
    }

    attack() {
        if (!this.canAttack()) return;
        
        this.lastAttackTime = this.scene.time.now;
        
        // Create multiple puddles
        for (let i = 0; i < this.stats.puddleCount; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                this.createMilkPuddle();
            });
        }
    }

    createMilkPuddle() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.stats.range;
        const x = this.player.sprite.x + Math.cos(angle) * distance;
        const y = this.player.sprite.y + Math.sin(angle) * distance;

        // Create main puddle
        const puddle = this.scene.add.sprite(x, y, 'weapon-magic-milk');
        puddle.setScale(0);
        puddle.setAlpha(0.8);
        // puddle.setTint(this.effectColors.primary);
        puddle.setBlendMode(Phaser.BlendModes.ADD);

        // Create glow effect
        const glow = this.scene.add.sprite(x, y, 'weapon-magic-milk');
        glow.setScale(0);
        glow.setAlpha(0.4);
        // glow.setTint(this.effectColors.glow);
        glow.setBlendMode(Phaser.BlendModes.ADD);

        // Animate puddles appearing
        this.scene.tweens.add({
            targets: [puddle, glow],
            scaleX: this.stats.splashRadius / 200,
            scaleY: this.stats.splashRadius / 200,
            duration: 200,
            ease: 'Back.easeOut'
        });

        // Enhanced effects for max level
        if (this.currentLevel === 8) {
            // Intense pulsating effect
            this.scene.tweens.add({
                targets: puddle,
                scaleX: this.stats.splashRadius / 180,
                scaleY: this.stats.splashRadius / 180,
                alpha: 1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Rotating glow effect
            this.scene.tweens.add({
                targets: glow,
                angle: 360,
                duration: 3000,
                repeat: -1
            });

            // Enhanced glow pulsing
            this.scene.tweens.add({
                targets: glow,
                alpha: 0.6,
                scaleX: this.stats.splashRadius / 150,
                scaleY: this.stats.splashRadius / 150,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Normal pulsing for non-max levels
            this.scene.tweens.add({
                targets: glow,
                alpha: 0.2,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        const puddleData = {
            sprite: puddle,
            glowSprite: glow,
            x: x,
            y: y,
            createdAt: this.scene.time.now,
            lastDamageTime: {},
            lastExplosionTime: 0  // Track last explosion time
        };
        
        this.activePuddles.push(puddleData);

        // Cleanup after duration
        this.scene.time.delayedCall(this.stats.puddleDuration, () => {
            if (this.currentLevel === 8) {
                // Create final explosion effect
                this.createExplosion(x, y);
            }
            
            this.scene.tweens.add({
                targets: [puddle, glow],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    puddle.destroy();
                    glow.destroy();
                    this.activePuddles = this.activePuddles.filter(p => p !== puddleData);
                }
            });
        });
    }

    createExplosion(x, y) {
        // Create explosion sprite
        const explosion = this.scene.add.sprite(x, y, 'weapon-magic-milk');
        explosion.setScale(0.1);
        explosion.setAlpha(0.8);
        explosion.setTint(0xff00ff);  // Bright magenta
        explosion.setBlendMode(Phaser.BlendModes.ADD);

        // Explosion animation
        this.scene.tweens.add({
            targets: explosion,
            scaleX: this.stats.splashRadius / 50,  // Larger scale for explosion
            scaleY: this.stats.splashRadius / 50,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.Out',
            onComplete: () => {
                explosion.destroy();
            }
        });

        // Deal explosion damage to nearby enemies
        this.scene.enemies.forEach(enemy => {
            if (!enemy.active) return;

            const distance = Phaser.Math.Distance.Between(
                x, y,
                enemy.sprite.x, enemy.sprite.y
            );

            if (distance <= this.stats.splashRadius) {
                const explosionDamage = this.stats.damage * 2;  // Double damage for explosion
                const isCritical = Math.random() < this.stats.criticalChance;
                const finalDamage = isCritical ? explosionDamage * 1.5 : explosionDamage;
                
                enemy.takeDamage(finalDamage);
                
                if (isCritical) {
                    this.showDamageText(enemy.sprite.x, enemy.sprite.y, finalDamage, true);
                }

                // Knockback effect
                const angle = Math.atan2(enemy.sprite.y - y, enemy.sprite.x - x);
                const knockbackDistance = 100;
                const targetX = enemy.sprite.x + Math.cos(angle) * knockbackDistance;
                const targetY = enemy.sprite.y + Math.sin(angle) * knockbackDistance;

                this.scene.tweens.add({
                    targets: enemy.sprite,
                    x: targetX,
                    y: targetY,
                    duration: 200,
                    ease: 'Cubic.Out'
                });
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
        
        // Update stats
        this.stats = {
            ...this.stats,
            ...newStats
        };

        console.log(`Milk Weapon leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // Create level up effect around the player
        const burst = this.scene.add.sprite(this.player.x, this.player.y, 'weapon-magic-milk');
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

        return true;
    }

    update(time, delta) {
        // Call base class update which includes death check
        if (!super.update(time, delta)) {
            return;
        }

        // Check each puddle for enemies
        this.activePuddles.forEach(puddle => {
            const damageInterval = 500; // Damage every 0.5 seconds

            this.scene.enemies.forEach(enemy => {
                if (!enemy.active) return;

                const distance = Phaser.Math.Distance.Between(
                    puddle.x, puddle.y,
                    enemy.sprite.x, enemy.sprite.y
                );

                if (distance <= this.stats.splashRadius / 2) {
                    if (!puddle.lastDamageTime[enemy.id] || 
                        time - puddle.lastDamageTime[enemy.id] >= damageInterval) {
                        
                        const isCritical = Math.random() < this.stats.criticalChance;
                        const damage = isCritical ? this.stats.damage * 1.5 : this.stats.damage;
                        
                        enemy.takeDamage(damage);
                        puddle.lastDamageTime[enemy.id] = time;

                        if (isCritical) {
                            this.showDamageText(enemy.sprite.x, enemy.sprite.y, damage, true);
                        }
                    }
                }
            });
        });
    }

    showDamageText(x, y, damage, isCritical) {
        const text = this.scene.add.text(
            x, y - 20,
            isCritical ? `CRIT! ${Math.floor(damage)}` : Math.floor(damage).toString(),
            {
                fontSize: isCritical ? '20px' : '16px',
                fontFamily: 'VT323',
                fill: isCritical ? '#ff0000' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
    }
}

export default MilkWeapon;
