import { BaseWeapon } from "./BaseWeapon.js";

export class PudgyPenguinWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);

    this.name = "Pudgy Penguin";

    // Enhanced weapon stats
    this.stats = {
      damage: 25,
      pierce: 3,
      cooldown: 1800,
      range: 500,
      speed: 300,
      knockback: 50,
      accuracy: 0.85,
      scale: 0.6,
      criticalChance: 0.15,
      freezeRange: 150, // Increased from 120
      freezeDamage: 15, // Increased from 10
      slowDuration: 3000, // Increased from 2000
      slowAmount: 0.7, // Increased from 0.5 (70% speed reduction)
      stunChance: 0.4, // Increased from 0.3 (40% chance to stun)
      stunDuration: 2000, // Increased from 1000 (2 seconds stun)
      iceExplosionRange: 100, // Range of ice explosion on hit
    };

    // Enhanced effect colors
    this.effectColors = {
      primary: 0xadd8e6, // Light blue
      secondary: 0x87ceeb, // Sky blue
      ice: 0xe0ffff, // Ice blue
      frozen: 0x00ffff, // Cyan
      critical: 0xf0f8ff, // Alice blue
      explosion: 0xf0ffff, // White-blue
      crystal: 0xb0e2ff, // Light steel blue
    };

    // Initialize projectile pool
    this.maxProjectiles = 8;
    this.activeProjectiles = [];

    // Initialize level configuration
    this.currentLevel = 1;
    this.maxLevel = 8;
    this.levelConfigs = {
      1: { damage: 25, pierce: 3, freezeDamage: 10, freezeRange: 120 },
      2: { damage: 35, pierce: 3, freezeDamage: 15, freezeRange: 130 },
      3: { damage: 45, pierce: 4, freezeDamage: 20, freezeRange: 140 },
      4: { damage: 55, pierce: 4, freezeDamage: 25, freezeRange: 150 },
      5: { damage: 65, pierce: 5, freezeDamage: 30, freezeRange: 160 },
      6: { damage: 75, pierce: 5, freezeDamage: 35, freezeRange: 170 },
      7: { damage: 85, pierce: 6, freezeDamage: 40, freezeRange: 180 },
      8: { damage: 100, pierce: 6, freezeDamage: 50, freezeRange: 200 },
    };

    this.createProjectiles();
  }

  createProjectiles() {
    // Clear existing projectiles
    this.activeProjectiles.forEach((proj) => {
      if (proj.sprite) {
        if (proj.sprite.iceTrail) {
          proj.sprite.iceTrail.destroy();
        }
        if (proj.sprite.frostEffect) {
          proj.sprite.frostEffect.destroy();
        }
        proj.sprite.destroy();
      }
    });
    this.activeProjectiles = [];

    // Create new projectiles
    for (let i = 0; i < this.maxProjectiles; i++) {
      const sprite = this.scene.add.sprite(0, 0, "weapon-pudgy-penguin");
      sprite.setScale(this.stats.scale);
      sprite.setActive(true);
      sprite.setVisible(false);
      sprite.setTint(this.effectColors.primary);

      // Enhanced ice trail effect
      const iceTrail = this.scene.add.particles(0, 0, "weapon-pudgy-penguin", {
        speed: { min: 50, max: 100 },
        scale: { start: 0.4, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 800,
        quantity: 3,
        frequency: 40,
        tint: [this.effectColors.ice, this.effectColors.crystal],
        blendMode: Phaser.BlendModes.ADD,
        on: false,
      });

      // Add snowflake particles
      const snowflakes = this.scene.add.particles(0, 0, "weapon-pudgy-penguin", {
        speed: { min: 20, max: 60 },
        scale: { start: 0.2, end: 0.1 },
        alpha: { start: 0.6, end: 0 },
        rotate: { start: 0, end: 360 },
        lifespan: 1000,
        quantity: 2,
        frequency: 100,
        tint: this.effectColors.crystal,
        blendMode: Phaser.BlendModes.ADD,
        on: false,
      });

      sprite.iceTrail = iceTrail;
      sprite.snowflakes = snowflakes;
      iceTrail.setVisible(false);
      snowflakes.setVisible(false);

      this.activeProjectiles.push({
        sprite: sprite,
        active: false,
        angle: 0,
        pierceCount: this.stats.pierce,
      });
    }
  }

  createIceExplosion(x, y) {
    // Create more subtle ice explosion effect
    const explosion = this.scene.add.particles(x, y, "weapon-pudgy-penguin", {
      speed: { min: 20, max: 80 }, // Further reduced speed
      scale: { start: 0.2, end: 0.05 }, // Smaller particles
      alpha: { start: 0.4, end: 0 }, // Much lower opacity
      rotate: { start: 0, end: 360 },
      lifespan: 500, // Shorter duration
      quantity: 6, // Fewer particles
      tint: [this.effectColors.ice, this.effectColors.crystal], // Removed bright explosion color
      blendMode: Phaser.BlendModes.SCREEN, // Changed from ADD to SCREEN for less intense glow
    });

    // More subtle ice crystals
    const crystals = this.scene.add.particles(x, y, "weapon-pudgy-penguin", {
      speed: { min: 15, max: 40 }, // Slower movement
      scale: { start: 0.15, end: 0.05 }, // Smaller crystals
      alpha: { start: 0.5, end: 0 }, // Lower opacity
      rotate: { start: 0, end: 180 },
      lifespan: 600, // Shorter duration
      quantity: 4, // Fewer particles
      tint: this.effectColors.crystal,
      blendMode: Phaser.BlendModes.SCREEN, // Changed from ADD to SCREEN
    });

    // Cleanup after animation
    this.scene.time.delayedCall(800, () => {
      // Reduced cleanup delay
      explosion.destroy();
      crystals.destroy();
    });
  }

  handleHit(enemy, proj) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

    // Calculate damage with critical hit chance
    let finalDamage = this.stats.damage;
    let isCritical = Math.random() < this.stats.criticalChance;

    if (isCritical) {
      finalDamage *= 2;
    }

    // Apply damage and freeze effect
    enemy.takeDamage(Math.round(finalDamage));

    // Create ice explosion at hit location
    this.createIceExplosion(enemy.sprite.x, enemy.sprite.y);

    // Apply enhanced slow/stun effect
    if (!enemy.isSlowed) {
      enemy.isSlowed = true;
      const originalSpeed = enemy.speed;
      enemy.speed *= this.stats.slowAmount;
      enemy.sprite.setTint(this.effectColors.frozen);

      // Create enhanced frost effect
      const frostEffect = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, "weapon-pudgy-penguin", {
        speed: { min: 20, max: 50 },
        scale: { start: 0.4, end: 0.1 },
        alpha: { start: 0.6, end: 0 },
        rotate: { start: 0, end: 180 },
        lifespan: 600,
        quantity: 3,
        frequency: 80,
        tint: [this.effectColors.ice, this.effectColors.crystal],
        blendMode: Phaser.BlendModes.ADD,
      });

      // Check for stun
      if (Math.random() < this.stats.stunChance) {
        enemy.isStunned = true;

        // Add stun visual effect
        const stunEffect = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, "weapon-pudgy-penguin", {
          speed: { min: 30, max: 80 },
          scale: { start: 0.3, end: 0.1 },
          alpha: { start: 1, end: 0 },
          rotate: { start: 0, end: 360 },
          lifespan: 500,
          quantity: 4,
          frequency: 50,
          tint: [this.effectColors.explosion, this.effectColors.crystal],
          blendMode: Phaser.BlendModes.ADD,
        });

        // Remove stun after duration
        this.scene.time.delayedCall(this.stats.stunDuration, () => {
          enemy.isStunned = false;
          stunEffect.destroy();
        });
      }

      // Remove slow effect after duration
      this.scene.time.delayedCall(this.stats.slowDuration, () => {
        enemy.isSlowed = false;
        enemy.speed = originalSpeed;
        enemy.sprite.clearTint();
        frostEffect.destroy();
      });
    }

    // Reduce pierce count
    proj.pierceCount--;
    if (proj.pierceCount <= 0) {
      this.deactivateProjectile(proj);
    }
  }

  getTargetPosition() {
    // Get valid enemies within range
    const validEnemies = this.scene.enemies
      ? this.scene.enemies.filter((e) => {
          if (!e || !e.sprite || !e.sprite.active || e.isDead) return false;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.sprite.x, e.sprite.y);
          return dist <= this.stats.range;
        })
      : [];

    if (validEnemies.length > 0) {
      const targetEnemy = validEnemies[Math.floor(Math.random() * validEnemies.length)];
      const spread = (1 - this.stats.accuracy) * Math.PI;
      const baseAngle = Math.atan2(targetEnemy.sprite.y - this.player.y, targetEnemy.sprite.x - this.player.x);
      const randomSpread = (Math.random() - 0.5) * spread;
      const finalAngle = baseAngle + randomSpread;

      return {
        x: this.player.x + Math.cos(finalAngle) * this.stats.range,
        y: this.player.y + Math.sin(finalAngle) * this.stats.range,
      };
    }

    // If no enemies, shoot in random direction
    const randomAngle = Math.random() * Math.PI * 2;
    return {
      x: this.player.x + Math.cos(randomAngle) * this.stats.range,
      y: this.player.y + Math.sin(randomAngle) * this.stats.range,
    };
  }

  fireProjectile(proj, time) {
    if (!proj.sprite || !proj.sprite.active) return;

    // Reset pierce count
    proj.pierceCount = this.stats.pierce;

    // Get target position
    const target = this.getTargetPosition();

    // Calculate angle
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    proj.angle = Math.atan2(dy, dx);

    // Set initial position
    proj.sprite.setPosition(this.player.x, this.player.y);
    proj.sprite.setVisible(true);
    proj.sprite.rotation = proj.angle + Math.PI / 2;

    // Activate ice trail
    if (proj.sprite.iceTrail) {
      proj.sprite.iceTrail.setPosition(proj.sprite.x, proj.sprite.y);
      proj.sprite.iceTrail.setVisible(true);
      proj.sprite.iceTrail.start();
    }

    proj.active = true;
    this.lastFiredTime = time;

    // Add subtle screen shake
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(50, 0.001);
    }
  }

  attack(time) {
    // Find an inactive projectile
    const proj = this.activeProjectiles.find((p) => !p.active);
    if (proj) {
      this.fireProjectile(proj, time);
    }
  }

  update(time, delta) {
    // Call base class update
    if (!super.update(time, delta)) {
      return;
    }

    // Check cooldown and attack if ready
    if (time - this.lastFiredTime >= this.stats.cooldown) {
      this.attack(time);
    }

    // Update active projectiles
    this.activeProjectiles.forEach((proj) => {
      if (proj.active) {
        // Move projectile
        proj.sprite.x += Math.cos(proj.angle) * this.stats.speed * (delta / 1000);
        proj.sprite.y += Math.sin(proj.angle) * this.stats.speed * (delta / 1000);

        // Update ice trail position
        if (proj.sprite.iceTrail) {
          proj.sprite.iceTrail.setPosition(proj.sprite.x, proj.sprite.y);
        }

        // Check for enemy collisions
        if (this.scene.enemies) {
          this.scene.enemies.forEach((enemy) => {
            if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

            const dist = Phaser.Math.Distance.Between(proj.sprite.x, proj.sprite.y, enemy.sprite.x, enemy.sprite.y);

            if (dist <= 35) {
              this.handleHit(enemy, proj);
            }
          });
        }

        // Check if projectile is out of range
        const distFromStart = Phaser.Math.Distance.Between(proj.sprite.x, proj.sprite.y, this.player.x, this.player.y);

        if (distFromStart > this.stats.range) {
          this.deactivateProjectile(proj);
        }
      }
    });
  }

  deactivateProjectile(proj) {
    if (!proj.sprite) return;

    proj.active = false;
    proj.sprite.setVisible(false);

    if (proj.sprite.iceTrail) {
      proj.sprite.iceTrail.setVisible(false);
      proj.sprite.iceTrail.stop();
    }
  }

  // ... rest of the weapon implementation would be similar to SonicBoomHammer
  // including update(), attack(), fireProjectile(), etc.
}

export default PudgyPenguinWeapon;
