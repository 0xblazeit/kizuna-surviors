import { BaseWeapon } from "./BaseWeapon.js";

class ShurikenStormWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);

    this.name = "Shapecraft Survivors Genesis";
    this.description = "Unleash a barrage of homing shurikens that slice through enemies";

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 30,
        pierce: 2,
        cooldown: 600,
        range: 300,
        speed: 400,
        scale: 0.4,
        knockbackForce: 200,
        rotationSpeed: 10,
        projectileCount: 1,
        spreadAngle: 0,
        homingSpeed: 0.1,
        orbitTime: 0.5,
      },
      2: {
        damage: 40,
        pierce: 2,
        cooldown: 550,
        range: 320,
        speed: 420,
        scale: 0.45,
        knockbackForce: 220,
        rotationSpeed: 12,
        projectileCount: 1,
        spreadAngle: 0,
        homingSpeed: 0.15,
        orbitTime: 0.5,
      },
      3: {
        damage: 55,
        pierce: 3,
        cooldown: 500,
        range: 340,
        speed: 440,
        scale: 0.5,
        knockbackForce: 240,
        rotationSpeed: 14,
        projectileCount: 2,
        spreadAngle: 15,
        homingSpeed: 0.2,
        orbitTime: 0.5,
      },
      4: {
        damage: 75,
        pierce: 3,
        cooldown: 450,
        range: 360,
        speed: 460,
        scale: 0.55,
        knockbackForce: 260,
        rotationSpeed: 16,
        projectileCount: 2,
        spreadAngle: 20,
        homingSpeed: 0.25,
        orbitTime: 0.5,
      },
      5: {
        damage: 100,
        pierce: 4,
        cooldown: 400,
        range: 380,
        speed: 480,
        scale: 0.6,
        knockbackForce: 280,
        rotationSpeed: 18,
        projectileCount: 3,
        spreadAngle: 25,
        homingSpeed: 0.3,
        orbitTime: 0.5,
      },
      6: {
        damage: 130,
        pierce: 4,
        cooldown: 350,
        range: 400,
        speed: 500,
        scale: 0.65,
        knockbackForce: 300,
        rotationSpeed: 20,
        projectileCount: 3,
        spreadAngle: 30,
        homingSpeed: 0.35,
        orbitTime: 0.5,
      },
      7: {
        damage: 165,
        pierce: 5,
        cooldown: 300,
        range: 420,
        speed: 520,
        scale: 0.7,
        knockbackForce: 320,
        rotationSpeed: 22,
        projectileCount: 4,
        spreadAngle: 35,
        homingSpeed: 0.4,
        orbitTime: 0.5,
      },
      8: {
        damage: 205,
        pierce: 5,
        cooldown: 250,
        range: 450,
        speed: 550,
        scale: 0.75,
        knockbackForce: 350,
        rotationSpeed: 25,
        projectileCount: 4,
        spreadAngle: 40,
        homingSpeed: 0.45,
        orbitTime: 0.5,
        isMaxLevel: true,
        shadowClone: true,
        cloneDamage: 100,
        cloneRadius: 150,
      },
    };

    // Initialize at level 1
    this.currentLevel = 1;
    this.maxLevel = 8;
    this.stats = { ...this.levelConfigs[this.currentLevel] };

    // Calculate max projectiles needed from level configs
    const maxProjectilesPerLevel = Object.values(this.levelConfigs).map((config) => config.projectileCount);
    const maxProjectilesNeeded = Math.max(...maxProjectilesPerLevel);

    // Initialize object pool
    this.projectilePool = {
      objects: [],
      maxSize: maxProjectilesNeeded * 2, // Double to handle pierce and cooldown overlap

      // Get an available object from the pool
      get() {
        return this.objects.find((obj) => !obj.active);
      },

      // Return an object to the pool
      return(obj) {
        obj.active = false;
        obj.sprite.setActive(false).setVisible(false);
        obj.sprite.body.setVelocity(0, 0);

        // Clean up trail effects
        if (obj.trailEffects) {
          obj.trailEffects.forEach((effect) => {
            if (effect.sprite) {
              effect.sprite.destroy();
            }
          });
          obj.trailEffects = [];
        }
      },
    };

    // Create initial pool of projectiles
    this.createProjectilePool();
  }

  createProjectilePool() {
    for (let i = 0; i < this.projectilePool.maxSize; i++) {
      const sprite = this.scene.physics.add.sprite(0, 0, "weapon-ss-projectile");
      sprite.setScale(this.stats.scale);
      sprite.setDepth(5);
      sprite.setVisible(false);
      sprite.setActive(false);

      const projectile = {
        sprite,
        active: false,
        trailEffects: [],
        pierceCount: this.stats.pierce,
        rotationAngle: 0,
        phase: "orbit",
        orbitAngle: 0,
        orbitTime: 0,
        targetEnemy: null,
        startX: 0,
        startY: 0,
      };

      this.projectilePool.objects.push(projectile);
    }
  }

  getInactiveProjectile() {
    return this.projectilePool.get();
  }

  deactivateProjectile(proj) {
    this.projectilePool.return(proj);
  }

  fireProjectile(angleOffset) {
    const proj = this.getInactiveProjectile();
    if (!proj) {
      console.warn("No projectiles available in pool");
      return;
    }

    const startX = this.player.sprite.x;
    const startY = this.player.sprite.y;

    proj.active = true;
    proj.sprite.setActive(true).setVisible(true);
    proj.sprite.setPosition(startX, startY);
    proj.sprite.setScale(this.stats.scale);

    // Initialize projectile state
    proj.phase = "orbit";
    proj.startX = startX;
    proj.startY = startY;
    proj.orbitAngle = angleOffset;
    proj.orbitTime = 0;
    proj.rotationAngle = 0;
    proj.pierceCount = this.stats.pierce;
    proj.trailEffects = [];

    // Set initial velocity
    const velocity = {
      x: Math.cos(angleOffset) * this.stats.speed,
      y: Math.sin(angleOffset) * this.stats.speed,
    };
    proj.sprite.body.setVelocity(velocity.x, velocity.y);
  }

  update(time, delta) {
    if (!super.update(time, delta)) return;

    // Auto-fire if cooldown has passed
    if (time - this.lastFiredTime >= this.stats.cooldown) {
      this.attack(time);
    }

    // Update active projectiles from pool
    this.projectilePool.objects.forEach((proj) => {
      if (!proj.active || !proj.sprite || !proj.sprite.active) return;

      // Update shuriken rotation
      proj.rotationAngle += this.stats.rotationSpeed * (delta / 1000);
      proj.sprite.setRotation(proj.rotationAngle);

      // Update projectile position based on phase
      switch (proj.phase) {
        case "orbit":
          // Update orbit time
          proj.orbitTime += delta / 1000;

          // Update player reference position
          proj.startX = this.player.sprite.x;
          proj.startY = this.player.sprite.y;

          // Calculate orbit position
          const orbitRadius = 50;
          proj.orbitAngle += this.stats.rotationSpeed * (delta / 1000);
          const orbitX = proj.startX + Math.cos(proj.orbitAngle) * orbitRadius;
          const orbitY = proj.startY + Math.sin(proj.orbitAngle) * orbitRadius;
          proj.sprite.setPosition(orbitX, orbitY);

          // Transition to seeking phase after orbit time
          if (proj.orbitTime >= this.stats.orbitTime) {
            const closestEnemy = this.findClosestEnemy(proj.sprite.x, proj.sprite.y);
            if (closestEnemy) {
              proj.phase = "seeking";
              proj.targetEnemy = closestEnemy;
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
            proj.targetEnemy = this.findClosestEnemy(proj.sprite.x, proj.sprite.y);
            if (!proj.targetEnemy) break;
          }

          // Calculate direction to target
          const dx = proj.targetEnemy.sprite.x - proj.sprite.x;
          const dy = proj.targetEnemy.sprite.y - proj.sprite.y;
          const angle = Math.atan2(dy, dx);

          // Update velocity with homing effect
          const currentVelX = proj.sprite.body.velocity.x;
          const currentVelY = proj.sprite.body.velocity.y;
          const targetVelX = Math.cos(angle) * this.stats.speed;
          const targetVelY = Math.sin(angle) * this.stats.speed;

          // Interpolate between current and target velocity
          proj.sprite.body.setVelocity(
            currentVelX + (targetVelX - currentVelX) * this.stats.homingSpeed,
            currentVelY + (targetVelY - currentVelY) * this.stats.homingSpeed
          );

          // Check for enemy collisions
          const enemies = this.scene.enemies?.filter((e) => e && e.sprite && e.sprite.active && !e.isDead) || [];

          enemies.forEach((enemy) => {
            if (proj.active && proj.pierceCount > 0) {
              const distance = Phaser.Math.Distance.Between(
                proj.sprite.x,
                proj.sprite.y,
                enemy.sprite.x,
                enemy.sprite.y
              );

              // Collision thresholds
              const projRadius = 25;
              const enemyRadius = 25;
              const collisionThreshold = projRadius + enemyRadius;

              if (distance < collisionThreshold) {
                this.handleHit(enemy, proj);
              }
            }
          });

          // Check if projectile is out of range
          const distanceFromStart = Phaser.Math.Distance.Between(
            proj.sprite.x,
            proj.sprite.y,
            proj.startX,
            proj.startY
          );
          if (distanceFromStart > this.stats.range) {
            this.deactivateProjectile(proj);
          }
          break;
      }
    });
  }

  findClosestEnemy(x, y) {
    const enemies = this.scene.enemies
      ? this.scene.enemies.filter((e) => e && e.sprite && e.sprite.active && !e.isDead)
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

  handleHit(enemy, proj) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
      return;
    }

    // Apply damage and screen shake
    enemy.takeDamage(this.stats.damage);
    this.scene.cameras.main.shake(50, 0.002);

    // Create hit effect
    this.createHitEffect(enemy, proj);

    // Apply knockback
    const hitAngle = Math.atan2(enemy.sprite.y - proj.sprite.y, enemy.sprite.x - proj.sprite.x);
    enemy.sprite.body.velocity.x += Math.cos(hitAngle) * this.stats.knockbackForce;
    enemy.sprite.body.velocity.y += Math.sin(hitAngle) * this.stats.knockbackForce;

    // Handle max level shadow clone effect
    if (this.currentLevel === 8 && this.stats.shadowClone) {
      this.createShadowClone(enemy);
    }

    // Reduce pierce count
    proj.pierceCount--;
    if (proj.pierceCount <= 0) {
      this.deactivateProjectile(proj);
    }

    // Find new target if current one is dead
    if (enemy === proj.targetEnemy) {
      proj.targetEnemy = this.findClosestEnemy(proj.sprite.x, proj.sprite.y);
    }
  }

  createHitEffect(enemy, projectile) {
    const numParticles = 6;
    const colors = [0x6a0dad, 0x4b0082, 0x800080]; // Purple shades for ninja-like effects

    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const speed = Math.random() * 100 + 50;

      const particle = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-ss-projectile");

      particle.setScale(0.3);
      particle.setTint(colors[Math.floor(Math.random() * colors.length)]);
      particle.setAlpha(0.8);

      const effectData = {
        sprite: particle,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        rotationSpeed: (Math.random() - 0.5) * 8,
        active: true,
      };

      if (!projectile.trailEffects) {
        projectile.trailEffects = [];
      }
      projectile.trailEffects.push(effectData);

      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0.1,
        duration: 500,
        ease: "Power2",
        onComplete: () => {
          effectData.active = false;
          particle.destroy();
        },
      });
    }
  }

  createShadowClone(enemy) {
    const enemies = this.scene.enemies.filter(
      (e) =>
        e &&
        e.sprite &&
        e.sprite.active &&
        !e.isDead &&
        e !== enemy &&
        Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, e.sprite.x, e.sprite.y) <= this.stats.cloneRadius
    );

    enemies.forEach((targetEnemy) => {
      targetEnemy.takeDamage(this.stats.cloneDamage);

      // Create shadow clone effect
      const shadow = this.scene.add.sprite(targetEnemy.sprite.x, targetEnemy.sprite.y, "weapon-ss-projectile");
      shadow.setScale(this.stats.scale);
      shadow.setAlpha(0.5);
      shadow.setTint(0x4b0082);

      this.scene.tweens.add({
        targets: shadow,
        alpha: 0,
        scale: this.stats.scale * 2,
        duration: 300,
        ease: "Power2",
        onComplete: () => {
          shadow.destroy();
        },
      });
    });
  }

  attack(time) {
    this.lastFiredTime = time;

    // Fire multiple projectiles based on projectileCount
    for (let i = 0; i < this.stats.projectileCount; i++) {
      const angleOffset = (i - (this.stats.projectileCount - 1) / 2) * ((this.stats.spreadAngle * Math.PI) / 180);
      this.fireProjectile(angleOffset);
    }
  }

  levelUp() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
      this.stats = { ...this.levelConfigs[this.currentLevel] };

      // Update existing projectiles with new stats
      this.projectilePool.objects.forEach((proj) => {
        if (proj.sprite) {
          proj.sprite.setScale(this.stats.scale);
        }
      });
    }
  }
}

export default ShurikenStormWeapon;
