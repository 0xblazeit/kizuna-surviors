import { BaseWeapon } from "./BaseWeapon.js";

class FlyingAxeWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);

    this.name = "Reverb Reaper";

    // Initialize trail container for level 8
    this.trailPool = [];
    this.trailMaxSize = 8;

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 8,
        pierce: 1,
        cooldown: 2500,
        range: 400, // Updated range
        speed: 200,
        rotationSpeed: 4,
        scale: 0.5,
        orbitRadius: 120, // Increased orbit radius by 50
        orbitSpeed: 2.5,
        projectileCount: 1,
      },
      2: {
        damage: 13,
        pierce: 1,
        cooldown: 2200,
        range: 420, // Updated range
        speed: 220,
        rotationSpeed: 4.5,
        scale: 0.53,
        orbitRadius: 135, // Increased orbit radius by 50
        orbitSpeed: 2.7,
        projectileCount: 1,
      },
      3: {
        damage: 21,
        pierce: 2,
        cooldown: 1900,
        range: 450, // Updated range
        speed: 240,
        rotationSpeed: 5,
        scale: 0.56,
        orbitRadius: 145, // Increased orbit radius by 50
        orbitSpeed: 2.9,
        projectileCount: 2,
      },
      4: {
        damage: 34,
        pierce: 2,
        cooldown: 1600,
        range: 480, // Updated range
        speed: 260,
        rotationSpeed: 5.5,
        scale: 0.59,
        orbitRadius: 155, // Increased orbit radius by 50
        orbitSpeed: 3.1,
        projectileCount: 2,
      },
      5: {
        damage: 55,
        pierce: 3,
        cooldown: 1300,
        range: 510, // Updated range
        speed: 280,
        rotationSpeed: 6,
        scale: 0.62,
        orbitRadius: 165, // Increased orbit radius by 50
        orbitSpeed: 3.3,
        projectileCount: 3,
      },
      6: {
        damage: 89,
        pierce: 3,
        cooldown: 1000,
        range: 540, // Updated range
        speed: 300,
        rotationSpeed: 6.5,
        scale: 0.65,
        orbitRadius: 175, // Increased orbit radius by 50
        orbitSpeed: 3.5,
        projectileCount: 3,
      },
      7: {
        damage: 144,
        pierce: 4,
        cooldown: 800,
        range: 570, // Updated range
        speed: 320,
        rotationSpeed: 7,
        scale: 0.68,
        orbitRadius: 185, // Increased orbit radius by 50
        orbitSpeed: 3.7,
        projectileCount: 4,
      },
      8: {
        damage: 233,
        pierce: 4,
        cooldown: 600,
        range: 600, // Updated range
        speed: 340,
        rotationSpeed: 7.5,
        scale: 0.71,
        orbitRadius: 195, // Increased orbit radius by 50
        orbitSpeed: 3.9,
        projectileCount: 5,
        orbitCount: 3,
        orbitSpread: 120,
        maxOrbitTime: 2.0,
        trailAlpha: 0.6,
        trailScale: 0.95,
        trailSpacing: 0.05,
        glowTint: 0xffff99,
        isMaxLevel: true,
      },
    };

    // Calculate pool size based on maximum possible projectiles and safety margin
    const maxProjectiles = Math.max(...Object.values(this.levelConfigs).map((config) => config.projectileCount));
    this.projectilePool = {
      objects: [],
      maxSize: maxProjectiles * 2, // Safety margin of 2x

      get() {
        return this.objects.find((obj) => !obj.active);
      },

      return(proj) {
        if (!proj) return;
        proj.active = false;
        if (proj.sprite) {
          proj.sprite.setActive(false).setVisible(false);
          // Hide trail sprites for level 8
          if (proj.trailSprites) {
            proj.trailSprites.forEach((sprite) => {
              sprite.setActive(false).setVisible(false);
            });
          }
        }
      },
    };

    // Initialize at level 1
    this.currentLevel = 1;
    this.maxLevel = 8;
    this.stats = { ...this.levelConfigs[1] };
    this.lastFiredTime = 0;

    this.createProjectilePool();
  }

  createProjectilePool() {
    // Clear existing pool
    this.projectilePool.objects.forEach((proj) => {
      if (proj.sprite) {
        if (proj.trailSprites) {
          proj.trailSprites.forEach((sprite) => sprite.destroy());
        }
        proj.sprite.destroy();
      }
    });
    this.projectilePool.objects = [];

    // Create new projectiles
    for (let i = 0; i < this.projectilePool.maxSize; i++) {
      const sprite = this.scene.physics.add.sprite(0, 0, "weapon-axe-projectile");
      sprite.setScale(this.stats.scale);
      sprite.setDepth(5);
      sprite.setVisible(false);
      sprite.setActive(false);
      sprite.body.setSize(sprite.width * 0.6, sprite.height * 0.6);

      let trailSprites = null;

      // Create trail sprites for level 8
      if (this.currentLevel === 8) {
        trailSprites = [];
        for (let j = 0; j < this.trailMaxSize; j++) {
          const trailSprite = this.scene.add.sprite(0, 0, "weapon-axe-projectile");
          trailSprite.setDepth(4);
          trailSprite.setScale(this.stats.scale);
          trailSprite.setActive(false).setVisible(false);
          trailSprites.push(trailSprite);
        }
      }

      this.projectilePool.objects.push({
        sprite,
        trailSprites,
        active: false,
        phase: "orbit",
        pierceCount: this.stats.pierce,
        startX: 0,
        startY: 0,
        orbitAngle: 0,
        rotation: 0,
        orbitTime: 0,
        trailPositions: [],
        lastTrailTime: 0,
        hitEnemies: new Set(),
      });
    }
  }

  fireProjectile(angleOffset = 0) {
    // First check if we're already at max projectiles
    const currentActiveCount = this.projectilePool.objects.filter((p) => p.active).length;
    if (currentActiveCount >= this.stats.projectileCount) {
      return;
    }

    const proj = this.projectilePool.get();
    if (!proj) return;

    const player = this.player.sprite;

    // Reset all properties to ensure clean state
    proj.active = true;
    proj.sprite.setActive(true).setVisible(true);
    proj.sprite.body.enable = true; // Enable physics body
    proj.pierceCount = this.stats.pierce;
    proj.phase = "orbit";
    proj.startX = player.x;
    proj.startY = player.y;
    proj.orbitAngle = angleOffset;
    proj.orbitTime = 0;
    proj.rotation = 0;
    proj.trailPositions = [];
    proj.lastTrailTime = 0;
    proj.hitEnemies.clear();

    // Set initial position
    const radius = this.stats.orbitRadius;
    const startX = player.x + Math.cos(angleOffset) * radius;
    const startY = player.y + Math.sin(angleOffset) * radius;
    proj.sprite.setPosition(startX, startY);
    proj.sprite.setScale(this.stats.scale);
    proj.sprite.body.setVelocity(0, 0);
  }

  findClosestEnemy(x, y) {
    const enemies = this.scene.enemies
      ? this.scene.enemies.filter((e) => {
          return e && e.sprite && e.sprite.active && !e.isDead;
        })
      : [];

    let closest = null;
    let closestDist = Infinity;

    enemies.forEach((enemy) => {
      const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
      if (dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    });

    return closest;
  }

  update(time, delta) {
    if (!super.update(time, delta)) {
      return;
    }

    if (time - this.lastFiredTime >= this.stats.cooldown) {
      this.attack(time);
    }

    this.projectilePool.objects.forEach((proj) => {
      if (!proj.active || !proj.sprite || !proj.sprite.active) return;

      // Update rotation
      proj.rotation += this.stats.rotationSpeed * (delta / 1000);
      proj.sprite.setRotation(proj.rotation);

      // Update projectile position based on phase
      switch (proj.phase) {
        case "orbit":
          // Update orbit time
          proj.orbitTime += delta / 1000;

          // Update player reference position
          proj.startX = this.player.sprite.x;
          proj.startY = this.player.sprite.y;

          // Calculate orbit position
          proj.orbitAngle += this.stats.orbitSpeed * (delta / 1000);
          const orbitX = proj.startX + Math.cos(proj.orbitAngle) * this.stats.orbitRadius;
          const orbitY = proj.startY + Math.sin(proj.orbitAngle) * this.stats.orbitRadius;
          proj.sprite.setPosition(orbitX, orbitY);

          // Check if orbit time exceeded and handle transition
          if (proj.orbitTime >= (this.stats.maxOrbitTime || 2.0)) {
            const closestEnemy = this.findClosestEnemy(proj.sprite.x, proj.sprite.y);
            if (closestEnemy) {
              proj.phase = "seeking";
              proj.targetEnemy = closestEnemy;
            } else {
              this.deactivateProjectile(proj);
            }
          }
          break;

        case "seeking":
          if (
            !proj.targetEnemy ||
            !proj.targetEnemy.sprite ||
            !proj.targetEnemy.sprite.active ||
            proj.targetEnemy.isDead
          ) {
            proj.phase = "return";
            break;
          }

          // Calculate direction to target
          const dx = proj.targetEnemy.sprite.x - proj.sprite.x;
          const dy = proj.targetEnemy.sprite.y - proj.sprite.y;
          const angle = Math.atan2(dy, dx);

          // Update velocity
          const velocity = {
            x: Math.cos(angle) * this.stats.speed,
            y: Math.sin(angle) * this.stats.speed,
          };
          proj.sprite.body.setVelocity(velocity.x, velocity.y);
          break;

        case "return":
          // Calculate direction to player
          const toPlayerX = this.player.x - proj.sprite.x;
          const toPlayerY = this.player.y - proj.sprite.y;
          const toPlayerAngle = Math.atan2(toPlayerY, toPlayerX);

          // Update velocity
          const returnVelocity = {
            x: Math.cos(toPlayerAngle) * this.stats.speed,
            y: Math.sin(toPlayerAngle) * this.stats.speed,
          };
          proj.sprite.body.setVelocity(returnVelocity.x, returnVelocity.y);

          // Check if returned to player
          const distanceToPlayer = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            proj.sprite.x,
            proj.sprite.y
          );

          if (distanceToPlayer < 20) {
            this.deactivateProjectile(proj);
          }
          break;
      }

      // Level 8 trail and glow effect
      if (this.currentLevel === 8) {
        // Update main sprite glow effect
        proj.sprite.setTint(this.stats.glowTint);

        // Update trail positions
        const trailSprites = proj.trailSprites;

        // Store current position and rotation
        if (time - (proj.lastTrailTime || 0) >= this.stats.trailSpacing * 1000) {
          proj.trailPositions.unshift({
            x: proj.sprite.x,
            y: proj.sprite.y,
            rotation: proj.rotation,
            time: time,
          });
          proj.lastTrailTime = time;

          // Limit trail length
          if (proj.trailPositions.length > this.trailMaxSize) {
            proj.trailPositions.pop();
          }
        }

        // Update trail sprites
        trailSprites.forEach((trailSprite, i) => {
          if (i < proj.trailPositions.length) {
            const pos = proj.trailPositions[i];
            trailSprite.setActive(true).setVisible(true);
            trailSprite.setPosition(pos.x, pos.y);
            trailSprite.setRotation(pos.rotation);

            // Calculate fade and scale based on position in trail
            const fadeRatio = 1 - i / this.trailMaxSize;
            const scaleRatio = Math.pow(this.stats.trailScale, i);
            trailSprite.setAlpha(this.stats.trailAlpha * fadeRatio);
            trailSprite.setScale(proj.sprite.scale * scaleRatio);
            trailSprite.setTint(this.stats.glowTint);
          } else {
            trailSprite.setActive(false).setVisible(false);
          }
        });
      }

      // Check for enemy collisions
      const enemies = this.scene.enemies
        ? this.scene.enemies.filter((e) => {
            return e && e.sprite && e.sprite.active && !e.isDead;
          })
        : [];

      enemies.forEach((enemy) => {
        if (proj.active && proj.pierceCount > 0) {
          const distance = Phaser.Math.Distance.Between(proj.sprite.x, proj.sprite.y, enemy.sprite.x, enemy.sprite.y);

          // Collision thresholds
          const projRadius = 25;
          const enemyRadius = 25;
          const collisionThreshold = projRadius + enemyRadius;

          if (distance < collisionThreshold) {
            this.handleHit(enemy, proj);
          }
        }
      });
    });
  }

  handleHit(enemy, proj) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
      return;
    }

    // Apply damage
    enemy.takeDamage(this.stats.damage, proj.sprite.x, proj.sprite.y);

    // Create hit effect
    this.createHitEffect(enemy, proj);

    // Reduce pierce count
    proj.pierceCount--;

    // If no more pierce, start return phase
    if (proj.pierceCount <= 0) {
      proj.phase = "return";
      const angle = Math.atan2(this.player.y - proj.sprite.y, this.player.x - proj.sprite.x);
      const velocity = {
        x: Math.cos(angle) * this.stats.speed,
        y: Math.sin(angle) * this.stats.speed,
      };
      proj.sprite.body.setVelocity(velocity.x, velocity.y);
    }
  }

  createHitEffect(enemy, proj) {
    // Create a hit flash
    const flash = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, "weapon-axe-projectile");
    flash.setScale(this.stats.scale * 1.5);
    flash.setAlpha(0.6);
    flash.setTint(0xffffff);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: this.stats.scale * 2,
      duration: 200,
      ease: "Power2",
      onComplete: () => flash.destroy(),
    });

    // Add sparks effect at max level
    if (this.currentLevel === this.maxLevel) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spark = this.scene.add.sprite(proj.sprite.x, proj.sprite.y, "weapon-axe-projectile");
        spark.setScale(this.stats.scale * 0.3);
        spark.setAlpha(0.8);
        spark.setTint(0xffa500);

        const distance = 50;
        const endX = proj.sprite.x + Math.cos(angle) * distance;
        const endY = proj.sprite.y + Math.sin(angle) * distance;

        this.scene.tweens.add({
          targets: spark,
          x: endX,
          y: endY,
          alpha: 0,
          scale: 0,
          duration: 300,
          ease: "Power2",
          onComplete: () => spark.destroy(),
        });
      }
    }
  }

  deactivateProjectile(proj) {
    if (!proj) return;

    // Ensure the sprite is properly cleaned up
    if (proj.sprite) {
      proj.sprite.body.enable = false; // Disable physics body
      proj.sprite.setActive(false).setVisible(false);
      proj.sprite.body.setVelocity(0, 0);
    }

    // Clean up trail sprites for level 8
    if (this.currentLevel === 8 && proj.trailSprites) {
      proj.trailSprites.forEach((sprite) => {
        sprite.setActive(false).setVisible(false);
      });
    }

    // Reset all properties
    proj.active = false;
    proj.phase = "orbit";
    proj.orbitTime = 0;
    proj.hitEnemies.clear();
    proj.trailPositions = [];

    this.projectilePool.return(proj);
  }

  attack(time) {
    this.lastFiredTime = time;

    // First, clean up any stuck projectiles
    this.projectilePool.objects.forEach((proj) => {
      if (proj.active && proj.phase === "orbit" && proj.orbitTime >= (this.stats.maxOrbitTime || 2.0)) {
        this.deactivateProjectile(proj);
      }
    });

    // Count current active projectiles
    const currentActiveCount = this.projectilePool.objects.filter((p) => p.active).length;

    // Only fire new projectiles if we're under the projectile count limit
    const availableSlots = this.stats.projectileCount - currentActiveCount;
    if (availableSlots <= 0) return;

    // Fire new projectiles
    for (let i = 0; i < availableSlots; i++) {
      const angleOffset = ((i * 360) / this.stats.projectileCount) * (Math.PI / 180);
      this.fireProjectile(angleOffset);
    }
  }

  canFire() {
    return this.scene.time.now - this.lastFiredTime >= this.stats.cooldown;
  }

  levelUp() {
    if (this.currentLevel >= this.maxLevel) {
      console.log("Weapon already at max level!");
      return false;
    }

    this.currentLevel++;
    const newStats = this.levelConfigs[this.currentLevel];

    this.stats = {
      ...this.stats,
      ...newStats,
    };

    console.log(`Flying Axe leveled up to ${this.currentLevel}! New stats:`, this.stats);

    // Recreate projectiles with new stats
    this.createProjectilePool();

    // Create level up effect around the player
    const burst = this.scene.add.sprite(this.player.x, this.player.y, "weapon-axe-projectile");
    burst.setScale(0.2);
    burst.setAlpha(0.7);
    burst.setTint(0xff6b00); // Orange color for level up

    this.scene.tweens.add({
      targets: burst,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      ease: "Quad.easeOut",
      onComplete: () => burst.destroy(),
    });

    return true;
  }
}

export default FlyingAxeWeapon;
