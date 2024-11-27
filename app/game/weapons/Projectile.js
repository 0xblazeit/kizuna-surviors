export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, weaponStats) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.stats = weaponStats;
        this.pierceCount = 0;

        // Trail effect properties
        this.trailPoints = [];
        this.maxTrailPoints = 15;
        this.trailSpacing = 2;
        this.lastTrailPoint = { x, y };

        // Create trail graphics
        this.trail = this.scene.add.graphics();

        // Apply visual effects
        this.applyVisualEffects();
        this.setupPhysics();

        if (this.stats.special) {
            this.createMustardTrail();
            this.createMustardEmitter();
        }
    }

    createMustardTrail() {
        this.mustardDrops = [];
        this.lastDropTime = 0;
        this.dropInterval = 50; // ms between drops
    }

    createMustardEmitter() {
        // Create mustard particle graphics
        const particles = this.scene.add.graphics();
        particles.lineStyle(2, 0xFFD700);
        particles.fillStyle(0xFFD700, 0.6);
        particles.beginPath();
        particles.arc(0, 0, 4, 0, Math.PI * 2);
        particles.closePath();
        particles.fill();
        particles.generateTexture('mustardParticle', 8, 8);
        particles.destroy();

        // Create particle emitter
        this.emitter = this.scene.add.particles(0, 0, 'mustardParticle', {
            speed: { min: 30, max: 80 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0.5 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 400,
            quantity: 1,
            blendMode: 'ADD',
            follow: this
        });
    }

    createMustardExplosion(x, y) {
        // Store scene reference
        const scene = this.scene;
        
        // Create multiple bursts for a more dramatic effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                // Create explosion graphics
                const explosion = scene.add.graphics();
                
                // Mustard yellow colors
                const colors = [0xFFD700, 0xFFA500, 0xFFFF00];
                const size = 20 + (i * 15);
                
                // Initial state
                explosion.setPosition(x, y);
                explosion.setAlpha(0.8);
                explosion.lineStyle(3, colors[i]);
                explosion.fillStyle(colors[i], 0.4);

                // Draw burst
                explosion.beginPath();
                for (let j = 0; j < 8; j++) {
                    const angle = (j / 8) * Math.PI * 2;
                    const length = size + Math.random() * 10;
                    if (j === 0) {
                        explosion.moveTo(
                            Math.cos(angle) * length,
                            Math.sin(angle) * length
                        );
                    } else {
                        explosion.lineTo(
                            Math.cos(angle) * length,
                            Math.sin(angle) * length
                        );
                    }
                }
                explosion.closePath();
                explosion.stroke();
                explosion.fill();

                // Animate and destroy
                scene.tweens.add({
                    targets: explosion,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => explosion.destroy()
                });

                // Add splatter particles
                const splatterEmitter = scene.add.particles(x, y, 'mustardParticle', {
                    speed: { min: 100, max: 200 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 1.5, end: 0.5 },
                    alpha: { start: 0.6, end: 0 },
                    lifespan: 600,
                    quantity: 20,
                    blendMode: 'ADD'
                });

                // Stop emitting after burst
                setTimeout(() => {
                    splatterEmitter.destroy();
                }, 100);

            }, i * 100);
        }
    }

    update() {
        super.update();

        if (this.stats.special) {
            // Update mustard trail
            const now = Date.now();
            if (now - this.lastDropTime > this.dropInterval) {
                this.lastDropTime = now;
                
                // Create mustard drop
                const drop = this.scene.add.graphics();
                drop.fillStyle(0xFFD700, 0.4);
                drop.fillCircle(this.x, this.y, 5);
                
                this.mustardDrops.push({
                    graphic: drop,
                    created: now
                });

                // Fade out and remove old drops
                this.mustardDrops = this.mustardDrops.filter(drop => {
                    const age = now - drop.created;
                    if (age > 500) {
                        drop.graphic.destroy();
                        return false;
                    }
                    drop.graphic.setAlpha(1 - (age / 500));
                    return true;
                });
            }
        }
    }

    destroy(fromScene) {
        if (this.stats.special) {
            this.createMustardExplosion(this.x, this.y);
            if (this.emitter) this.emitter.destroy();
            this.mustardDrops.forEach(drop => drop.graphic.destroy());
        }
        if (this.trail) {
            this.trail.destroy();
        }
        super.destroy(fromScene);
    }

    applyVisualEffects() {
        this.setScale(this.stats.projectileSize);
        
        if (this.stats.special) {
            this.setTint(0xffff00);
            // Add pulsing scale effect for special projectiles
            this.scene.tweens.add({
                targets: this,
                scaleX: this.stats.projectileSize * 1.2,
                scaleY: this.stats.projectileSize * 1.2,
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (this.stats.pierce > 0) {
            this.setTint(0xff6b6b);
        }
    }

    setupPhysics() {
        this.body.setSize(32, 32);
        this.body.setOffset(16, 16);
    }

    fire(x, y, angle, speed) {
        this.setActive(true).setVisible(true);
        this.setPosition(x, y);
        this.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        this.setRotation(angle);

        // Reset trail points
        if (this.stats.special) {
            this.trailPoints = [{ x, y }];
            this.lastTrailPoint = { x, y };
        }
    }

    handleHit() {
        if (this.stats.pierce > 0 && this.pierceCount < this.stats.pierce) {
            this.pierceCount++;
            return false;
        }
        this.destroy();
        return true;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Update trail effect
        if (this.stats.special) {
            this.updateTrail();
        }

        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            this.x,
            this.y
        );

        if (distance > this.stats.range) {
            this.destroy();
        }
    }

    updateTrail() {
        if (!this.stats.special || !this.trail) return;

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.lastTrailPoint.x, this.lastTrailPoint.y
        );

        if (distance >= this.trailSpacing) {
            this.trailPoints.push({ 
                x: this.x, 
                y: this.y,
                hue: this.hueRotation  // Store hue for rainbow effect
            });
            this.lastTrailPoint = { x: this.x, y: this.y };
            this.hueRotation = (this.hueRotation + 5) % 360;  // Rotate hue

            if (this.trailPoints.length > this.maxTrailPoints) {
                this.trailPoints.shift();
            }
        }

        // Update distortion position
        if (this.distortion) {
            this.distortion.setPosition(this.x, this.y);
        }

        // Draw enhanced trail
        this.trail.clear();
        if (this.trailPoints.length >= 2) {
            // Draw multiple layers with different colors and effects
            for (let layer = 0; layer < 3; layer++) {
                const width = 10 - (layer * 3);
                const alpha = (0.4 - (layer * 0.1)) * this.glowIntensity;
                
                this.trail.lineStyle(width, 0xffffff, alpha);
                this.drawRainbowTrail(layer);
            }
        }
    }

    drawRainbowTrail(layer) {
        this.trail.beginPath();
        
        for (let i = 0; i < this.trailPoints.length - 1; i++) {
            const point = this.trailPoints[i];
            const nextPoint = this.trailPoints[i + 1];
            
            // Convert HSV to RGB for rainbow effect
            const hue = (point.hue + (layer * 30)) % 360;
            const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1);
            
            this.trail.lineStyle(
                10 - (layer * 3),
                Phaser.Display.Color.GetColor(color.r, color.g, color.b),
                (0.4 - (layer * 0.1)) * this.glowIntensity
            );
            
            if (i === 0) {
                this.trail.moveTo(point.x, point.y);
            }
            this.trail.lineTo(nextPoint.x, nextPoint.y);
        }
        
        this.trail.strokePath();
    }
}
