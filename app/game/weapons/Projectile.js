export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, weaponStats) {
        super(scene, x, y, texture);
        
        // Add sprite to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Store stats
        this.scene = scene;
        this.stats = weaponStats;
        this.pierceCount = 0;

        // Trail effect properties
        this.trailPoints = [];
        this.maxTrailPoints = 15;
        this.trailSpacing = 2;
        this.lastTrailPoint = { x, y };
        this.hueRotation = 0;

        // Apply visual effects
        this.applyVisualEffects();

        // Set up physics body
        this.setupPhysics();

        // Create special effects if special weapon
        if (this.stats.special) {
            this.createTrailEffect();
            this.createParticleEmitter();
            this.createSpaceDistortion();
        }
    }

    createParticleEmitter() {
        // Create spark particles using the hotdog special sprite
        this.particles = this.scene.add.particles(0, 0, 'weapon-hotdog-special', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            gravityY: 0,
            quantity: 2,
            follow: this
        });

        // Create energy particles
        this.energyParticles = this.scene.add.particles(0, 0, 'weapon-hotdog-special', {
            speed: { min: 20, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            quantity: 1,
            follow: this
        });
    }

    createSpaceDistortion() {
        // Create distortion using the hotdog special sprite
        this.distortion = this.scene.add.sprite(this.x, this.y, 'weapon-hotdog-special');
        this.distortion.setBlendMode('SCREEN');
        this.distortion.setAlpha(0.2);
        this.distortion.setScale(1);

        // Add pulsing effect
        this.scene.tweens.add({
            targets: this.distortion,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createShockwave(x, y) {
        const shockwave = this.scene.add.sprite(x, y, 'weapon-hotdog-special');
        shockwave.setBlendMode('ADD');
        shockwave.setAlpha(0.5);
        shockwave.setScale(0.2);

        this.scene.tweens.add({
            targets: shockwave,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => shockwave.destroy()
        });
    }

    createTrailEffect() {
        this.trail = this.scene.add.graphics();
        this.glowIntensity = 1;
        
        // Add periodic glow effect
        this.scene.tweens.add({
            targets: this,
            glowIntensity: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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

    destroy(fromScene) {
        // Create final shockwave effect
        if (this.stats.special) {
            this.createShockwave(this.x, this.y);
            if (this.particles) this.particles.destroy();
            if (this.energyParticles) this.energyParticles.destroy();
            if (this.distortion) this.distortion.destroy();
        }
        if (this.trail) {
            this.trail.destroy();
        }
        super.destroy(fromScene);
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
}
