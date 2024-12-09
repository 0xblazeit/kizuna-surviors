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

    updateWithScreenCheck(time, delta, isOnScreen) {
        if (!this.player || !this.scene) return false;

        // Update base stats and cooldowns
        this.update(time, delta);

        // Update projectiles with screen check optimization
        if (this.activeProjectiles) {
          this.activeProjectiles.forEach(proj => {
            if (proj.active && proj.sprite) {
              // Check if projectile is on screen
              if (isOnScreen(proj.sprite)) {
                // Only check collisions for on-screen projectiles
                this.updateProjectileCollisions(proj, time, delta);
              } else {
                // Basic movement update for off-screen projectiles
                this.updateProjectileMovement(proj, time, delta);
              }

              // Check if projectile is out of range
              const distance = Phaser.Math.Distance.Between(
                proj.startX || this.player.x,
                proj.startY || this.player.y,
                proj.sprite.x,
                proj.sprite.y
              );

              if (distance > this.stats.range) {
                this.deactivateProjectile(proj);
              }
            }
          });
        }
    }

    updateProjectileCollisions(proj, time, delta) {
        // Check for collisions with enemies
        const enemies = this.scene.enemies
          ? this.scene.enemies.filter(e => e && e.sprite && e.sprite.active && !e.isDead)
          : [];

        enemies.forEach(enemy => {
          if (proj.active && (!proj.pierceCount || proj.pierceCount > 0)) {
            const distance = Phaser.Math.Distance.Between(
              proj.sprite.x,
              proj.sprite.y,
              enemy.sprite.x,
              enemy.sprite.y
            );

            // Use appropriate collision radius based on weapon type
            const collisionRadius = this.getCollisionRadius();
            if (distance < collisionRadius) {
              this.handleHit(enemy, proj);
            }
          }
        });

        // Update movement after collision checks
        this.updateProjectileMovement(proj, time, delta);
    }

    updateProjectileMovement(proj, time, delta) {
        // Basic movement update - override in specific weapon classes
        if (proj.velocity) {
          proj.sprite.x += proj.velocity.x * delta;
          proj.sprite.y += proj.velocity.y * delta;
        }
    }

    getCollisionRadius() {
        // Default collision radius - override in specific weapon classes
        return 30;
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
