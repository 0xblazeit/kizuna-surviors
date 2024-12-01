import { BaseWeapon } from './BaseWeapon';

export class RotatingDogWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        console.log('RotatingDogWeapon constructor called');
        
        // Override default stats for this specific weapon
        this.stats = {
            damage: 15,
            pierce: 2,
            count: 3,          // Number of projectiles rotating
            cooldown: 2000,    // Attack every 2 seconds
            range: 100,        // Distance from player
            speed: 3,          // Rotation speed (radians per second)
            angle: 0           // Current rotation angle
        };

        // Initialize rotating projectiles
        this.activeProjectiles = [];
        this.createRotatingProjectiles();
        console.log('RotatingDogWeapon initialization complete');
    }

    createRotatingProjectiles() {
        console.log('Creating rotating projectiles...');
        
        // Clear any existing projectiles
        this.activeProjectiles.forEach(p => p.sprite.destroy());
        this.activeProjectiles = [];

        const angleStep = (2 * Math.PI) / this.stats.count;
        
        for (let i = 0; i < this.stats.count; i++) {
            const angle = angleStep * i;
            const x = this.player.x + Math.cos(angle) * this.stats.range;
            const y = this.player.y + Math.sin(angle) * this.stats.range;
            
            // Create a container for our projectile
            const container = this.scene.add.container(x, y);
            container.setDepth(10);
            
            // Add both a sprite and a debug circle
            let sprite;
            if (this.scene.textures.exists('dogProjectile')) {
                console.log('Using dog sprite for projectile');
                sprite = this.scene.add.sprite(0, 0, 'dogProjectile');
                sprite.setScale(0.3);
            } else {
                console.log('Using debug graphics for projectile');
                // Create a more visible debug graphic
                const graphics = this.scene.add.graphics();
                graphics.lineStyle(2, 0xff0000);
                graphics.fillStyle(0xff0000, 0.5);
                graphics.beginPath();
                graphics.arc(0, 0, 15, 0, Math.PI * 2);
                graphics.closePath();
                graphics.strokePath();
                graphics.fillPath();
                
                // Add a direction indicator
                graphics.lineBetween(0, 0, 15, 0);
                
                container.add(graphics);
                sprite = graphics;
            }
            
            container.add(sprite);
            
            this.activeProjectiles.push({
                sprite: container,
                angle: angle
            });
            
            console.log(`Projectile ${i} created at position:`, {x, y});
        }
        
        console.log(`Created ${this.activeProjectiles.length} projectiles`);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) {
            console.log('Player not active, skipping update');
            return;
        }

        // Update rotation angle
        this.stats.angle += (this.stats.speed * delta) / 1000;

        // Update each projectile position
        this.activeProjectiles.forEach((projectile, index) => {
            const currentAngle = this.stats.angle + projectile.angle;
            
            // Calculate new position
            const x = this.player.x + Math.cos(currentAngle) * this.stats.range;
            const y = this.player.y + Math.sin(currentAngle) * this.stats.range;
            
            // Update projectile position and rotation
            projectile.sprite.setPosition(x, y);
            projectile.sprite.setRotation(currentAngle);
        });
    }

    checkCollisions() {
        if (!this.scene.enemies) return;
        
        const enemies = this.scene.enemies.getChildren();
        
        this.activeProjectiles.forEach(projectile => {
            enemies.forEach(enemy => {
                if (enemy.active && projectile.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(
                        projectile.sprite.x,
                        projectile.sprite.y,
                        enemy.x,
                        enemy.y
                    );

                    if (distance < 30) {
                        this.handleHit(enemy, projectile.sprite);
                    }
                }
            });
        });
    }

    handleHit(enemy, projectile) {
        enemy.takeDamage(this.stats.damage);
        projectile.pierceCount--;
        
        if (projectile.pierceCount <= 0) {
            projectile.pierceCount = this.stats.pierce;
        }
    }

    levelUp() {
        this.stats.damage += 5;
        this.stats.pierce += 1;
        
        if (this.stats.count < 8) {
            this.stats.count += 1;
            this.createRotatingProjectiles();
        }
    }

    destroy() {
        console.log('Destroying weapon...');
        this.activeProjectiles.forEach(p => p.sprite.destroy());
        this.activeProjectiles = [];
    }
}
