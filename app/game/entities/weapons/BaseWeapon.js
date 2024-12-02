export class BaseWeapon {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.stats = {
            damage: 10,
            pierce: 1,
            count: 1,
            cooldown: 1000, // milliseconds
            range: 200,    // pixels
            speed: 200     // pixels per second
        };
        this.lastFiredTime = 0;
        this.projectiles = this.scene.add.group();
        this.isDestroyed = false;
    }

    update(time, delta) {
        // Check if weapon is already destroyed
        if (this.isDestroyed) {
            return false;
        }

        // If player is dead, destroy weapon and return
        if (this.player.isDead) {
            this.destroy();
            return false;
        }
        
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }
        
        // Update existing projectiles
        this.projectiles.getChildren().forEach(projectile => {
            this.updateProjectile(projectile, delta);
        });

        return true;
    }

    attack(time) {
        // To be implemented by specific weapons
        this.lastFiredTime = time;
    }

    updateProjectile(projectile, delta) {
        // To be implemented by specific weapons
    }

    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // Clear all projectiles
        this.projectiles.clear(true, true);
        
        // Clear any active projectiles array if it exists
        if (this.activeProjectiles) {
            this.activeProjectiles.forEach(proj => {
                if (proj.sprite) {
                    proj.sprite.destroy();
                }
                if (proj.particles) {
                    proj.particles.destroy();
                }
            });
            this.activeProjectiles = [];
        }
        
        // Clear any active puddles array if it exists (for MilkWeapon)
        if (this.activePuddles) {
            this.activePuddles.forEach(puddle => {
                if (puddle.sprite) {
                    puddle.sprite.destroy();
                }
            });
            this.activePuddles = [];
        }
    }

    levelUp() {
        // To be implemented by specific weapons
    }
}

export default BaseWeapon;
