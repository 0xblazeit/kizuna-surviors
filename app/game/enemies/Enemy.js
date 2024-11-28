import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture || 'enemy-boomer');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up sprite properties
        this.setScale(0.5);  // Adjust scale as needed
        this.setOrigin(0.5);
        
        // Initialize state
        this.isDying = false;
        this.isFlashing = false;
        
        console.log('Enemy created with texture:', texture);
        
        // Unique ID for hit tracking
        this.id = Math.random().toString(36).substr(2, 9);
        
        // Enemy stats
        this.maxHealth = 999999;
        this.health = this.maxHealth;
        this.moveSpeed = 20;
        this.attackRange = 50;
        this.damage = 10;
        
        // Hit effect properties
        this.flashDuration = 100;
        this.isStaggered = false;

        // Initialize pixelation values
        this.pixelSize = 1;
        
        // Enable physics
        this.body.setCollideWorldBounds(true);
        this.body.setImmovable(true);
    }

    takeDamage(amount) {
        // For testing, we'll still show damage numbers but won't reduce health
        this.showDamageNumber(amount);
        
        // Visual feedback
        if (!this.isFlashing) {
            this.flash();
            this.knockback();
        }

        // Emit event for tracking
        this.emit('damaged', amount);

        // Random chance to trigger death animation
        if (Math.random() < 0.1 && !this.isDying) {  // 10% chance to "die"
            console.log('Enemy triggering death animation');
            this.playDeathAnimation();
        }
    }

    playDeathAnimation() {
        if (this.isDying) return;
        this.isDying = true;
        
        // Disable physics and input
        this.body.enable = false;
        this.setActive(false);

        // Initial shrink and fade
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.7,
            scaleY: 0.7,
            alpha: 0.8,
            duration: 200,
            ease: 'Quad.easeIn',
            onComplete: () => {
                // Start distortion effect after initial shrink
                this.startDistortionEffect();
            }
        });
    }

    startDistortionEffect() {
        let frame = 0;
        const maxFrames = 30;
        const originalX = this.x;
        const originalY = this.y;
        
        const distortInterval = setInterval(() => {
            if (frame >= maxFrames || !this.scene) {
                clearInterval(distortInterval);
                this.finalFadeOut();
                return;
            }
            
            // Create glitch effect by randomly offsetting sprite segments
            const glitchX = (Math.random() - 0.5) * 10;
            const glitchY = (Math.random() - 0.5) * 10;
            this.setX(originalX + glitchX);
            this.setY(originalY + glitchY);
            
            // Randomly change alpha for flicker effect
            this.setAlpha(0.3 + Math.random() * 0.7);
            
            frame++;
        }, 50);
    }

    finalFadeOut() {
        console.log('Enemy finalFadeOut called');
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.2,
            scaleY: 0.2,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Handle respawn
                if (this.scene && this.scene.enemies) {
                    const { width, height } = this.scene.scale;
                    
                    // Calculate spawn position
                    let newX, newY;
                    
                    // 50% chance to spawn at edge
                    if (Math.random() < 0.5) {
                        if (Math.random() < 0.5) {
                            // Spawn on left or right edge
                            newX = Math.random() < 0.5 ? 50 : width - 50;
                            newY = Phaser.Math.Between(50, height - 50);
                        } else {
                            // Spawn on top or bottom edge
                            newX = Phaser.Math.Between(50, width - 50);
                            newY = Math.random() < 0.5 ? 50 : height - 50;
                        }
                    } else {
                        // Spawn at random position
                        newX = Phaser.Math.Between(50, width - 50);
                        newY = Phaser.Math.Between(50, height - 50);
                    }
                    
                    console.log('Respawning enemy at:', newX, newY);
                    const newEnemy = new Enemy(this.scene, newX, newY, 'enemy-boomer');
                    this.scene.enemies.add(newEnemy);
                }
                
                this.destroy();
            }
        });
    }
    
    flash() {
        this.isFlashing = true;
        this.setTint(0xff0000);
        
        this.scene.time.delayedCall(this.flashDuration, () => {
            this.clearTint();
            this.isFlashing = false;
        });
    }
    
    knockback() {
        if (this.isStaggered) return;
        
        // Very minimal stagger
        this.isStaggered = true;
        const offsetX = (Math.random() - 0.5) * 0.5;
        const offsetY = (Math.random() - 0.5) * 0.5;
        
        this.scene.tweens.add({
            targets: this,
            x: this.x + offsetX,
            y: this.y + offsetY,
            duration: 20,
            ease: 'Sine.easeOut',
            yoyo: true,
            onComplete: () => {
                this.isStaggered = false;
            }
        });
    }
    
    moveTowardsPlayer() {
        const player = this.scene.player;
        if (!player || !player.active) return;
        
        // Calculate direction to player
        const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            player.x, player.y
        );
        
        // Move towards player
        const speed = this.isStaggered ? this.moveSpeed * 0.5 : this.moveSpeed;
        this.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Rotate to face player
        this.rotation = angle;
    }
    
    update() {
        this.moveTowardsPlayer();
        
        // Attack player if in range
        const player = this.scene.player;
        if (player && player.active) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                player.x, player.y
            );
            
            if (distance < this.attackRange) {
                this.attackPlayer();
            }
        }
    }
    
    attackPlayer() {
        // For now, just implement basic collision damage
        // You can add more complex attack patterns later
        const player = this.scene.player;
        if (player && player.active && !player.isInvulnerable) {
            player.takeDamage(this.damage);
        }
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
}
