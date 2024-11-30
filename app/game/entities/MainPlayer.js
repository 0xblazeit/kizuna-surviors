import Phaser from 'phaser';

export default class MainPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.initializeProperties();
        this.setupControls();
    }

    initializeProperties() {
        this.moveSpeed = 200;
        this.lastNonZeroDirection = Math.PI * -0.5;

        this.stats = {
            maxHealth: 100,
            health: 100,
            defense: 10,
            speed: this.moveSpeed
        };

        this.experience = {
            level: 1,
            current: 0,
            toNext: 100
        };

        this.inventory = {
            gold: 0,
            items: [],
            weapons: ['hotdog', 'wand']  // Initial weapons
        };

        // Damage handling properties
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000; // 1 second of invulnerability after hit
        this.flashDuration = 100;

        // Health bar properties
        this.healthBarWidth = 50;
        this.healthBarHeight = 6;
        this.healthBarOffsetY = 30;
        
        // Create health bar graphics
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
    }

    setupControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update(time) {
        super.update(time);
        
        if (!this.active) return;
        
        this.handleMovement();
        this.updateWeaponDirection();
        
        // Update homing weapon target
        if (this.weapon2 && this.weapon2.type === 'homing') {
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            this.scene.enemies.children.each(enemy => {
                if (enemy.active) {
                    const distance = Phaser.Math.Distance.Between(
                        this.x, this.y,
                        enemy.x, enemy.y
                    );
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            });
            
            if (closestEnemy) {
                this.weapon2.setTarget(closestEnemy);
            }
        }
        
        // Update weapons
        if (this.weapon) this.weapon.update(time);
        if (this.weapon2) this.weapon2.update(time);
        
        // Update health bar position
        this.updateHealthBar();
    }

    handleMovement() {
        const { dx, dy } = this.getMovementInput();
        this.updateDirection(dx, dy);
        this.updateVelocity(dx, dy);
    }

    getMovementInput() {
        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            dx = -1;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            dx = 1;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            dy = -1;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            dy = 1;
        }

        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        return { dx, dy };
    }

    updateDirection(dx, dy) {
        if (dx !== 0 || dy !== 0) {
            this.lastNonZeroDirection = Math.atan2(dy, dx);
        }
    }

    updateVelocity(dx, dy) {
        this.setVelocity(dx * this.moveSpeed, dy * this.moveSpeed);
    }

    updateWeaponDirection() {
        if (this.lastNonZeroDirection !== undefined) {
            if (this.weapon) {
                this.weapon.updateDirection(this.lastNonZeroDirection);
            }
            if (this.weapon2) {
                this.weapon2.updateDirection(this.lastNonZeroDirection);
            }
        }
    }

    levelUp() {
        this.updateExperience();
        this.increaseStats();
        this.updateWeaponLevel();
    }

    updateExperience() {
        this.experience.current -= this.experience.toNext;
        this.experience.level += 1;
        this.experience.toNext = Math.floor(this.experience.toNext * 1.2);
    }

    increaseStats() {
        this.stats.maxHealth += 10;
        this.stats.health = this.stats.maxHealth;
        this.stats.defense += 2;
    }

    updateWeaponLevel() {
        const weaponLevel = Math.min(this.experience.level - 1, 8);
        
        if (this.weapon) {
            this.weapon.setWeapon('hotdog', weaponLevel);
        }
        if (this.weapon2) {
            this.weapon2.setWeapon('homing', weaponLevel);
        }
    }

    collectGold(amount) {
        this.inventory.gold += amount;
        this.scene.events.emit('goldCollected', this.inventory.gold);
    }

    gainExperience(amount) {
        this.experience.current += amount;
        
        while (this.experience.current >= this.experience.toNext) {
            this.levelUp();
        }
        
        this.scene.events.emit('playerXPGained', this.experience);
    }

    getStats() {
        return {
            ...this.stats,
            experience: this.experience,
            gold: this.inventory.gold
        };
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return;

        // Apply defense reduction
        const damage = Math.max(1, amount - this.stats.defense);
        this.stats.health = Math.max(0, this.stats.health - damage);

        // Update health bar
        this.updateHealthBar();

        // Visual feedback
        this.flash();
        
        // Show damage number
        this.showDamageNumber(damage);

        // Make player invulnerable briefly
        this.setInvulnerable();

        // Check for death
        if (this.stats.health <= 0) {
            this.die();
        }
    }

    updateHealthBar() {
        this.healthBar.clear();
        
        // Draw background (black)
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(
            this.x - this.healthBarWidth / 2,
            this.y + this.healthBarOffsetY,
            this.healthBarWidth,
            this.healthBarHeight
        );

        // Draw health (green)
        const healthPercentage = this.stats.health / this.stats.maxHealth;
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(
            this.x - this.healthBarWidth / 2,
            this.y + this.healthBarOffsetY,
            this.healthBarWidth * healthPercentage,
            this.healthBarHeight
        );
    }

    flash() {
        this.setTint(0xff0000);
        this.scene.time.delayedCall(this.flashDuration, () => {
            this.clearTint();
        });
    }

    setInvulnerable() {
        this.isInvulnerable = true;
        
        // Flash effect during invulnerability
        const flashInterval = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.alpha = this.alpha === 1 ? 0.5 : 1;
            },
            repeat: this.invulnerabilityDuration / 100 - 1
        });

        // Remove invulnerability after duration
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.isInvulnerable = false;
            this.alpha = 1;
            flashInterval.remove();
        });
    }

    showDamageNumber(amount) {
        const text = this.scene.add.text(this.x, this.y - 20, `-${amount}`, {
            fontSize: '16px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => text.destroy()
        });
    }

    die() {
        // Handle player death
        console.log('Player died!');
        // You can add game over logic here
    }

    onDeath() {
        // Emit death event before cleanup
        this.scene.events.emit('playerDeath', {
            level: this.experience.level,
            gold: this.inventory.gold
        });

        super.onDeath();
    }
}
