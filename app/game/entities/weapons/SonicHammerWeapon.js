import { BaseWeapon } from '../../weapons/BaseWeapon';

export class SonicHammerWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        // Set weapon stats - high damage but slow firing rate
        this.stats = {
            damage: 50,          // High base damage
            pierce: 4,           // Can hit multiple enemies
            cooldown: 2000,      // 2 seconds between attacks (slow)
            range: 400,          // Decent range
            speed: 150,          // Slow projectile speed
            waveWidth: 60,       // Initial cone width in degrees
            accuracy: 0.7,       // Base accuracy (0-1)
            scale: 1.0,          // Base wave scale
            knockback: 150       // Knockback force
        };

        // Wave effect colors
        this.waveColors = {
            primary: 0x4287f5,    // Blue
            secondary: 0x87cefa,  // Light blue
            energy: 0xffffff      // White
        };

        // Level configurations
        this.currentLevel = 0;
        this.maxLevel = 8;
        this.levelConfigs = {
            1: { damage: 65,  waveWidth: 65,  cooldown: 1900, range: 450,  scale: 1.1,  accuracy: 0.72 },
            2: { damage: 85,  waveWidth: 70,  cooldown: 1800, range: 500,  scale: 1.2,  accuracy: 0.74 },
            3: { damage: 110, waveWidth: 75,  cooldown: 1700, range: 550,  scale: 1.3,  accuracy: 0.76 },
            4: { damage: 140, waveWidth: 80,  cooldown: 1600, range: 600,  scale: 1.4,  accuracy: 0.78 },
            5: { damage: 175, waveWidth: 85,  cooldown: 1500, range: 650,  scale: 1.5,  accuracy: 0.80 },
            6: { damage: 215, waveWidth: 90,  cooldown: 1400, range: 700,  scale: 1.6,  accuracy: 0.82 },
            7: { damage: 260, waveWidth: 95,  cooldown: 1300, range: 750,  scale: 1.7,  accuracy: 0.84 },
            8: { damage: 310, waveWidth: 100, cooldown: 1200, range: 800,  scale: 1.8,  accuracy: 0.86 }
        };

        this.createWaveParticles();
    }

    createWaveParticles() {
        // Create particle manager for wave effects
        this.waveGraphics = this.scene.add.graphics();
    }

    attack(time) {
        if (time - this.lastFiredTime < this.stats.cooldown) return;

        // Calculate base direction
        const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            this.scene.input.mousePointer.worldX,
            this.scene.input.mousePointer.worldY
        );

        // Create multiple waves in a cone pattern
        const numWaves = 3;
        const angleSpread = this.stats.waveWidth * (Math.PI / 180); // Convert to radians
        
        for (let i = 0; i < numWaves; i++) {
            // Add randomness to angle based on accuracy
            const randomSpread = (1 - this.stats.accuracy) * (Math.random() - 0.5) * angleSpread;
            const waveAngle = angle - (angleSpread / 2) + (angleSpread * (i / (numWaves - 1))) + randomSpread;

            this.createSonicWave(waveAngle);
        }
        
        super.attack(time);
    }

    createSonicWave(angle) {
        const wave = {
            x: this.player.x,
            y: this.player.y,
            angle: angle,
            scale: this.stats.scale,
            damage: this.stats.damage,
            pierce: this.stats.pierce,
            distance: 0,
            maxDistance: this.stats.range,
            knockback: this.stats.knockback,
            width: 30, // Base width of the wave arc
            graphics: this.scene.add.graphics()
        };
        
        // Draw initial wave
        this.drawWave(wave);

        // Add to projectiles group
        this.projectiles.add(wave.graphics);
        wave.graphics.wave = wave; // Store wave data reference in graphics object
    }

    drawWave(wave) {
        const graphics = wave.graphics;
        graphics.clear();

        // Calculate wave properties
        const waveWidth = wave.width * (1 + wave.distance / wave.maxDistance);
        const arcRadius = 40 * (1 + wave.distance / wave.maxDistance);
        
        // Draw multiple arcs for wave effect
        const numArcs = 3;
        const arcSpacing = 10;
        
        graphics.lineStyle(2, this.waveColors.primary, 1 - (wave.distance / wave.maxDistance));
        
        for (let i = 0; i < numArcs; i++) {
            const radius = arcRadius + (i * arcSpacing);
            const arcWidth = waveWidth * (1 - i * 0.2);
            
            // Draw arc
            graphics.beginPath();
            graphics.arc(
                wave.x,
                wave.y,
                radius,
                wave.angle - (arcWidth * Math.PI / 180),
                wave.angle + (arcWidth * Math.PI / 180),
                false
            );
            graphics.strokePath();
            
            // Add glow effect
            graphics.lineStyle(1, this.waveColors.secondary, (1 - (wave.distance / wave.maxDistance)) * 0.5);
            graphics.arc(
                wave.x,
                wave.y,
                radius + 2,
                wave.angle - (arcWidth * Math.PI / 180),
                wave.angle + (arcWidth * Math.PI / 180),
                false
            );
            graphics.strokePath();
        }
    }

    updateProjectile(projectile, delta) {
        const wave = projectile.wave;
        const speed = (this.stats.speed * delta) / 1000;
        
        // Update position
        wave.x += Math.cos(wave.angle) * speed;
        wave.y += Math.sin(wave.angle) * speed;
        
        // Update distance traveled
        wave.distance += speed;

        // Redraw wave with new position and size
        this.drawWave(wave);

        // Check if wave has reached its maximum range
        if (wave.distance >= wave.maxDistance) {
            wave.graphics.destroy();
        }
    }

    levelUp() {
        if (this.currentLevel >= this.maxLevel) return;
        
        this.currentLevel++;
        const newStats = this.levelConfigs[this.currentLevel];
        
        // Update stats
        Object.assign(this.stats, newStats);
        
        console.log(`Sonic Hammer leveled up to ${this.currentLevel}!`);
        this.scene.sound.play('level_up', { volume: 0.5 });
    }
}

export default SonicHammerWeapon;
