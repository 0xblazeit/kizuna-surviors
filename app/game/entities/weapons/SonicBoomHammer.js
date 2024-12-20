import { BaseWeapon } from "./BaseWeapon.js";

export class SonicBoomHammer extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);

    // Set weapon name
    this.name = "WattWhacker";

    // Set weapon stats
    this.stats = {
      damage: 30,
      pierce: 1,
      cooldown: 2500,
      range: 400,
      speed: 200,
      knockback: 100,
      accuracy: 0.25,
      scale: 0.7,
      criticalChance: 0.1,
      shockRange: 150,
      shockDamage: 15,
      stunDuration: 1000,
    };

    // Effect colors
    this.effectColors = {
      primary: 0xd4d4d4, // Bright silver
      secondary: 0xffd700, // Gold
      energy: 0x87ceeb, // Sky blue
      trail: 0x4169e1, // Royal blue
    };

    // Initialize level configuration
    this.currentLevel = 8;
    this.maxLevel = 8;
    this.levelConfigs = {
      1: {
        damage: 65,
        pierce: 2,
        cooldown: 1900,
        knockback: 160,
        accuracy: 0.32,
        scale: 0.82,
        criticalChance: 0.12,
        shockRange: 160,
        shockDamage: 20,
      },
      2: {
        damage: 80,
        pierce: 2,
        cooldown: 1800,
        knockback: 170,
        accuracy: 0.34,
        scale: 0.84,
        criticalChance: 0.14,
        shockRange: 170,
        shockDamage: 25,
      },
      3: {
        damage: 95,
        pierce: 3,
        cooldown: 1700,
        knockback: 180,
        accuracy: 0.36,
        scale: 0.86,
        criticalChance: 0.16,
        shockRange: 180,
        shockDamage: 30,
      },
      4: {
        damage: 110,
        pierce: 3,
        cooldown: 1600,
        knockback: 190,
        accuracy: 0.38,
        scale: 0.88,
        criticalChance: 0.18,
        shockRange: 190,
        shockDamage: 35,
      },
      5: {
        damage: 130,
        pierce: 3,
        cooldown: 1500,
        knockback: 200,
        accuracy: 0.4,
        scale: 0.9,
        criticalChance: 0.2,
        shockRange: 200,
        shockDamage: 40,
      },
      6: {
        damage: 150,
        pierce: 4,
        cooldown: 1400,
        knockback: 220,
        accuracy: 0.42,
        scale: 0.92,
        criticalChance: 0.22,
        shockRange: 220,
        shockDamage: 45,
      },
      7: {
        damage: 175,
        pierce: 4,
        cooldown: 1300,
        knockback: 240,
        accuracy: 0.44,
        scale: 0.94,
        criticalChance: 0.24,
        shockRange: 240,
        shockDamage: 50,
      },
      8: {
        damage: 200,
        pierce: 5,
        cooldown: 1200,
        knockback: 260,
        accuracy: 0.46,
        scale: 1.1,
        criticalChance: 0.3,
        shockRange: 260,
        shockDamage: 60,
        // Max level bonuses
        speed: 250, // Faster projectiles
        stunDuration: 1500, // Longer stun
        range: 500, // Extended range
      },
    };

    // Calculate pool size based on pierce and safety margin
    const maxPierce = Math.max(...Object.values(this.levelConfigs).map((config) => config.pierce));
    this.projectilePool = {
      objects: [],
      maxSize: maxPierce * 3,

      get() {
        return this.objects.find((obj) => !obj.active);
      },

      return(proj) {
        if (!proj) return;

        proj.active = false;
        if (proj.sprite) {
          proj.sprite.setActive(false).setVisible(false);
          if (proj.shockwave) {
            proj.shockwave.setActive(false).setVisible(false);
          }
          if (proj.trail) {
            proj.trail.stop();
          }
          if (proj.shockwaveTrail) {
            proj.shockwaveTrail.stop();
          }
          if (proj.sprite.electricField) {
            proj.sprite.electricField.stop();
          }
          if (proj.sprite.lightningBolts) {
            proj.sprite.lightningBolts.stop();
          }
          if (proj.sprite.electricArcs) {
            proj.sprite.electricArcs.stop();
          }
        }
      },
    };

    this.createProjectilePool();
  }

  createProjectilePool() {
    // Clear existing pool
    this.projectilePool.objects.forEach((proj) => {
      if (proj.sprite) {
        if (proj.shockwave) proj.shockwave.destroy();
        if (proj.trail) proj.trail.destroy();
        if (proj.shockwaveTrail) proj.shockwaveTrail.destroy();
        proj.sprite.destroy();
      }
    });
    this.projectilePool.objects = [];

    // Create new projectiles
    for (let i = 0; i < this.projectilePool.maxSize; i++) {
      // Create main projectile sprite
      const sprite = this.scene.add.sprite(0, 0, "weapon-hammer-projectile");
      sprite.setScale(this.stats.scale);
      sprite.setActive(false).setVisible(false);
      sprite.setTint(this.effectColors.primary);

      // Create shockwave effect
      const shockwave = this.scene.add.sprite(0, 0, "weapon-hammer-projectile");
      shockwave.setScale(this.stats.scale * 1.5);
      shockwave.setAlpha(0.4);
      shockwave.setVisible(false);
      shockwave.setTint(this.effectColors.secondary);
      shockwave.setBlendMode(Phaser.BlendModes.ADD);

      // Create main trail effect
      const trail = this.scene.add.particles(0, 0, "weapon-hammer-projectile", {
        follow: sprite,
        followOffset: { x: 0, y: 0 },
        lifespan: 300,
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: this.effectColors.trail,
        blendMode: Phaser.BlendModes.ADD,
        frequency: 50,
        quantity: 1,
      });
      trail.stop();

      // Create shockwave trail effect
      const shockwaveTrail = this.scene.add.particles(0, 0, "weapon-hammer-projectile", {
        follow: sprite,
        followOffset: { x: 0, y: 0 },
        lifespan: 400,
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 0.4, end: 0 },
        tint: this.effectColors.energy,
        blendMode: Phaser.BlendModes.ADD,
        frequency: 100,
        quantity: 2,
        angle: { min: 0, max: 360 },
        rotate: { min: -180, max: 180 },
        speed: { min: 20, max: 40 },
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Circle(0, 0, 10),
        },
      });
      shockwaveTrail.stop();

      // Add electric effects for max level
      if (this.currentLevel === 8) {
        // Main electric field
        const electricField = this.scene.add.particles(0, 0, "weapon-hammer-projectile", {
          follow: sprite,
          followOffset: { x: 0, y: 0 },
          lifespan: 300,
          scale: { start: 0.3, end: 0.1 },
          alpha: { start: 0.6, end: 0 },
          tint: 0x00ffff, // Cyan color for electricity
          blendMode: Phaser.BlendModes.ADD,
          frequency: 30,
          quantity: 2,
          speed: { min: 100, max: 200 },
          angle: { min: 0, max: 360 },
          emitZone: {
            type: "random",
            source: new Phaser.Geom.Circle(0, 0, 20),
          },
        });
        electricField.stop();
        sprite.electricField = electricField;

        // Lightning bolts
        const lightningBolts = this.scene.add.particles(0, 0, "weapon-hammer-projectile", {
          follow: sprite,
          followOffset: { x: 0, y: 0 },
          lifespan: 200,
          scale: { start: 0.5, end: 0.1 },
          alpha: { start: 0.8, end: 0 },
          tint: 0x4169e1, // Royal blue for lightning
          blendMode: Phaser.BlendModes.ADD,
          frequency: 50,
          quantity: 1,
          moveToX: {
            onEmit: (particle) => {
              return particle.x + (Math.random() - 0.5) * 100;
            },
          },
          moveToY: {
            onEmit: (particle) => {
              return particle.y + (Math.random() - 0.5) * 100;
            },
          },
          emitZone: {
            type: "random",
            source: new Phaser.Geom.Circle(0, 0, 10),
          },
        });
        lightningBolts.stop();
        sprite.lightningBolts = lightningBolts;

        // Electric arcs
        const electricArcs = this.scene.add.particles(0, 0, "weapon-hammer-projectile", {
          follow: sprite,
          followOffset: { x: 0, y: 0 },
          lifespan: 150,
          scale: { start: 0.4, end: 0.1 },
          alpha: { start: 1, end: 0 },
          tint: 0x87ceeb, // Sky blue for arcs
          blendMode: Phaser.BlendModes.ADD,
          frequency: 20,
          quantity: 3,
          speed: { min: 150, max: 250 },
          angle: { min: 0, max: 360 },
          zigzag: true,
          zigzagTime: 100,
          zigzagDistance: 10,
        });
        electricArcs.stop();
        sprite.electricArcs = electricArcs;
      }

      // Add to pool with new electric effects
      this.projectilePool.objects.push({
        sprite,
        shockwave,
        trail,
        shockwaveTrail,
        active: false,
        angle: 0,
        pierceCount: this.stats.pierce,
        hitEnemies: new Set(),
        lastArcTime: 0,
      });
    }
  }

  fireProjectile(proj, time) {
    if (!proj.sprite) return;

    // Reset state
    proj.pierceCount = this.stats.pierce;
    proj.hitEnemies.clear();

    // Get target position
    const target = this.getTargetPosition();

    // Calculate angle
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    proj.angle = Math.atan2(dy, dx);

    // Position at player
    proj.sprite.setPosition(this.player.x, this.player.y);
    proj.sprite.setRotation(0); // Start at 0 rotation for spin effect
    proj.sprite.setActive(true).setVisible(true);

    // Setup shockwave
    proj.shockwave.setPosition(this.player.x, this.player.y);
    proj.shockwave.setRotation(proj.angle);
    proj.shockwave.setActive(true).setVisible(true);

    // Animate shockwave
    this.scene.tweens.add({
      targets: proj.shockwave,
      scale: this.stats.scale * 2.5,
      alpha: 0,
      duration: 400,
      ease: "Power2",
    });

    // Start trails
    proj.trail.start();
    proj.shockwaveTrail.start();

    // Start electric effects for level 8
    if (this.currentLevel === 8) {
      if (proj.sprite.electricField) {
        proj.sprite.electricField.start();
      }
      if (proj.sprite.lightningBolts) {
        proj.sprite.lightningBolts.start();
      }
      if (proj.sprite.electricArcs) {
        proj.sprite.electricArcs.start();
      }
    }

    // Activate projectile
    proj.active = true;
    this.lastFiredTime = time;

    // Add spinning animation
    this.scene.tweens.add({
      targets: proj.sprite,
      rotation: proj.angle + Math.PI * 4,
      duration: 400,
      ease: "Cubic.out",
    });

    // Add scale pulse animation
    this.scene.tweens.add({
      targets: proj.sprite,
      scaleX: this.stats.scale * 1.2,
      scaleY: this.stats.scale * 1.2,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    // Screen shake
    if (this.scene.cameras?.main) {
      this.scene.cameras.main.shake(100, 0.002);
    }
  }

  getTargetPosition() {
    // Get a list of valid enemies
    const validEnemies = this.scene.enemies
      ? this.scene.enemies.filter((e) => {
          if (!e || !e.sprite || !e.sprite.active || e.isDead) return false;

          const dist = this.getDistance(this.player.x, this.player.y, e.sprite.x, e.sprite.y);
          return dist <= this.stats.range;
        })
      : [];

    if (validEnemies.length > 0) {
      // Pick a random enemy from those in range
      const targetEnemy = validEnemies[Math.floor(Math.random() * validEnemies.length)];

      // Add random spread based on accuracy
      const spread = (1 - this.stats.accuracy) * Math.PI; // Lower accuracy = more spread
      const baseAngle = Math.atan2(targetEnemy.sprite.y - this.player.y, targetEnemy.sprite.x - this.player.x);

      // Random angle within spread range
      const randomSpread = (Math.random() - 0.5) * spread;
      const finalAngle = baseAngle + randomSpread;

      // Calculate target position using the spread angle
      const targetDistance = this.stats.range * 0.8; // Use 80% of max range
      return {
        x: this.player.x + Math.cos(finalAngle) * targetDistance,
        y: this.player.y + Math.sin(finalAngle) * targetDistance,
      };
    }

    // If no enemies, shoot in a random direction
    const randomAngle = Math.random() * Math.PI * 2;
    return {
      x: this.player.x + Math.cos(randomAngle) * this.stats.range * 0.6,
      y: this.player.y + Math.sin(randomAngle) * this.stats.range * 0.6,
    };
  }

  handleHit(enemy, proj) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

    // Calculate damage with critical hit chance
    let finalDamage = this.stats.damage;
    let isCritical = Math.random() < this.stats.criticalChance;

    if (isCritical) {
      finalDamage *= 2;
    }

    // Apply damage and show damage number
    enemy.takeDamage(Math.round(finalDamage), proj.sprite.x, proj.sprite.y);

    // Apply MASSIVE knockback
    const angle = Math.atan2(enemy.sprite.y - proj.sprite.y, enemy.sprite.x - proj.sprite.x);

    if (enemy.sprite.body) {
      // Dramatically increased knockback force
      const baseKnockback = this.stats.knockback * 5; // 5x base knockback
      const knockbackForce = isCritical ? baseKnockback * 1.5 : baseKnockback;
      const upwardBoost = -300; // Stronger upward force

      // Apply the massive knockback
      enemy.sprite.body.velocity.x += Math.cos(angle) * knockbackForce;
      enemy.sprite.body.velocity.y += Math.sin(angle) * knockbackForce + upwardBoost;

      // Longer stun duration to match the dramatic knockback
      enemy.stunned = true;
      this.scene.time.delayedCall(500, () => {
        enemy.stunned = false;
      });

      // Add a slight rotation to the enemy for more dramatic effect
      const rotationForce = (Math.random() - 0.5) * 0.5;
      enemy.sprite.rotation += rotationForce;
    }

    // Create intense hit effect
    this.createHitEffect(enemy, proj, isCritical);

    // Reduce pierce count
    proj.pierceCount--;
    if (proj.pierceCount <= 0) {
      this.deactivateProjectile(proj);
    }

    // Add electric effect on hit for level 8
    if (this.currentLevel === 8) {
      const electricBurst = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, "weapon-hammer-projectile", {
        lifespan: 300,
        scale: { start: 0.5, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        tint: 0x4169e1,
        blendMode: Phaser.BlendModes.ADD,
        quantity: 8,
        speed: { min: 100, max: 200 },
        angle: { min: 0, max: 360 },
      });

      // Clean up after burst
      this.scene.time.delayedCall(300, () => {
        electricBurst.destroy();
      });
    }
  }

  createHitEffect(enemy, proj, isCritical) {
    // Create impact effect
    const impact = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-hammer-projectile");
    impact.setScale(0.3);
    impact.setTint(isCritical ? this.effectColors.secondary : this.effectColors.primary);
    impact.setAlpha(0.8);

    // Create ground crack effect
    const crack = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-hammer-projectile");
    crack.setScale(0.2);
    crack.setTint(this.effectColors.energy);
    crack.setAlpha(0.5);
    crack.setAngle(Math.random() * 360);

    // Animate impact
    this.scene.tweens.add({
      targets: impact,
      scale: isCritical ? 1.3 : 1.0,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => impact.destroy(),
    });

    // Animate ground crack
    this.scene.tweens.add({
      targets: crack,
      scale: isCritical ? 0.8 : 0.6,
      alpha: 0,
      duration: 400,
      ease: "Power1",
      onComplete: () => crack.destroy(),
    });

    // Add screen shake on hit
    if (this.scene.cameras?.main) {
      const shakeIntensity = isCritical ? 0.004 : 0.002;
      const shakeDuration = isCritical ? 150 : 100;
      this.scene.cameras.main.shake(shakeDuration, shakeIntensity);
    }

    // Add particle burst on impact
    const particles = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, "weapon-hammer-projectile", {
      speed: { min: 50, max: 200 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      quantity: isCritical ? 8 : 5,
      tint: isCritical ? this.effectColors.secondary : this.effectColors.primary,
      blendMode: Phaser.BlendModes.ADD,
    });

    // Clean up particles after animation
    this.scene.time.delayedCall(300, () => {
      particles.destroy();
    });

    // Add shockwave ring on critical hits
    if (isCritical) {
      // Create shockwave ring effect
      const shockwaveRing = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-hammer-projectile");
      shockwaveRing.setScale(0.1);
      shockwaveRing.setTint(this.effectColors.secondary);
      shockwaveRing.setAlpha(0.7);

      this.scene.tweens.add({
        targets: shockwaveRing,
        scale: 2.0,
        alpha: 0,
        duration: 300,
        ease: "Power1",
        onComplete: () => shockwaveRing.destroy(),
      });

      // Add particle burst for shockwave ring
      if (this.scene.add.particles) {
        const particles = this.scene.add.particles(enemy.sprite.x, enemy.sprite.y, "weapon-hammer-projectile", {
          scale: { start: 0.1, end: 0 },
          speed: { min: 50, max: 150 },
          quantity: 8,
          lifespan: 300,
          tint: this.effectColors.secondary,
        });

        setTimeout(() => particles.destroy(), 300);
      }
    }
  }

  levelUp() {
    if (this.currentLevel >= this.maxLevel) {
      console.log("Weapon already at max level!");
      return false;
    }

    this.currentLevel++;
    const newStats = this.levelConfigs[this.currentLevel];

    // Update stats
    this.stats = {
      ...this.stats,
      ...newStats,
    };

    console.log(`Sonic Boom Hammer leveled up to ${this.currentLevel}! New stats:`, this.stats);

    // Recreate projectiles with new scale
    this.createProjectilePool();

    return true;
  }

  update(time, delta) {
    // Call base class update which includes death check
    if (!super.update(time, delta)) {
      return;
    }

    // Check cooldown and attack if ready
    if (time - this.lastFiredTime >= this.stats.cooldown) {
      this.attack(time);
    }

    // Update active projectiles
    this.projectilePool.objects.forEach((proj) => {
      if (proj.active) {
        if (proj.sprite) {
          // Move projectile
          proj.sprite.x += Math.cos(proj.angle) * this.stats.speed * (delta / 1000);
          proj.sprite.y += Math.sin(proj.angle) * this.stats.speed * (delta / 1000);

          // Update effects positions
          if (proj.shockwave) {
            proj.shockwave.setPosition(proj.sprite.x, proj.sprite.y);
          }

          // Check for enemy collisions
          if (this.scene.enemies) {
            this.scene.enemies.forEach((enemy) => {
              if (enemy && enemy.sprite && !enemy.isDead && !proj.hitEnemies.has(enemy)) {
                const dist = this.getDistance(proj.sprite.x, proj.sprite.y, enemy.sprite.x, enemy.sprite.y);
                const collisionRadius = 40;

                if (dist < collisionRadius) {
                  this.handleHit(enemy, proj);
                  proj.hitEnemies.add(enemy);
                }
              }
            });
          }

          // Check if out of range
          const distFromStart = this.getDistance(proj.sprite.x, proj.sprite.y, this.player.x, this.player.y);
          if (distFromStart > this.stats.range) {
            this.deactivateProjectile(proj);
          }
        }
      }
    });
  }

  attack(time) {
    // Find an inactive projectile
    const proj = this.projectilePool.get();
    if (proj) {
      // Reset the projectile state
      proj.pierceCount = this.stats.pierce;
      proj.hitEnemies.clear();
      this.fireProjectile(proj, time);
    }
  }

  deactivateProjectile(proj) {
    if (!proj) return;
    proj.hitEnemies.clear();

    // Stop all effects
    if (proj.sprite) {
      if (proj.trail) {
        proj.trail.stop();
      }
      if (proj.shockwaveTrail) {
        proj.shockwaveTrail.stop();
      }
      if (this.currentLevel === 8) {
        if (proj.sprite.electricField) proj.sprite.electricField.stop();
        if (proj.sprite.lightningBolts) proj.sprite.lightningBolts.stop();
        if (proj.sprite.electricArcs) proj.sprite.electricArcs.stop();
      }
    }

    this.projectilePool.return(proj);
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export default SonicBoomHammer;
