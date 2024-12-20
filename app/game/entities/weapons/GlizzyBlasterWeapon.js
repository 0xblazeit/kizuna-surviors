import { BaseWeapon } from "./BaseWeapon.js";
export class GlizzyBlasterWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);

    this.name = "Glizzy Blaster";

    // Add key tracking for direction changes
    this.justPressedKeys = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 8, // Higher base damage for better early game
        pierce: 1,
        projectileCount: 1,
        spreadAngle: 0,
        cooldown: 1000, // Slightly faster base firing
        range: 800,
        speed: 250, // Better base projectile speed
        scale: 0.4,
      },
      2: {
        damage: 10,
        pierce: 1,
        projectileCount: 2,
        spreadAngle: 15,
        cooldown: 950, // Gradually improving cooldown
        range: 850,
        speed: 275,
        scale: 0.45,
      },
      3: {
        damage: 12,
        pierce: 2,
        projectileCount: 2,
        spreadAngle: 20,
        cooldown: 900,
        range: 900,
        speed: 300,
        scale: 0.5,
      },
      4: {
        damage: 14,
        pierce: 2,
        projectileCount: 3,
        spreadAngle: 25,
        cooldown: 850,
        range: 950,
        speed: 350,
        scale: 0.5,
      },
      5: {
        damage: 16,
        pierce: 2,
        projectileCount: 3,
        spreadAngle: 30,
        cooldown: 800, // Significant cooldown improvement
        range: 1000,
        speed: 400,
        scale: 0.5,
      },
      6: {
        damage: 18,
        pierce: 3,
        projectileCount: 4,
        spreadAngle: 35,
        cooldown: 700,
        range: 1050,
        speed: 450,
        scale: 0.55,
      },
      7: {
        damage: 20,
        pierce: 3,
        projectileCount: 4,
        spreadAngle: 40,
        cooldown: 600,
        range: 1100,
        speed: 500,
        scale: 0.57,
      },
      8: {
        damage: 25, // Significant damage boost
        pierce: 4,
        projectileCount: 4,
        spreadAngle: 45,
        range: 1200,
        cooldown: 750, // Much faster firing at max level
        speed: 400,
        scale: 0.59,
        isMaxLevel: true,
        mustardExplosion: true,
        explosionDamage: 15, // Increased explosion damage
        explosionRadius: 120, // Larger explosion radius
      },
    };

    // Initialize at level 1
    this.currentLevel = 1;
    this.maxLevel = 8;
    this.stats = JSON.parse(JSON.stringify(this.levelConfigs[this.currentLevel]));

    // Calculate max pool sizes based on level configs
    const maxProjectilesPerLevel = Object.values(this.levelConfigs).map(
      (config) => config.projectileCount * 2 // Double for safety
    );
    const maxProjectilesNeeded = Math.max(...maxProjectilesPerLevel);

    // Initialize object pools
    this.projectilePool = {
      objects: [],
      maxSize: maxProjectilesNeeded * 3, // Triple for overlapping cooldowns and pierce

      get() {
        return this.objects.find((obj) => !obj.active);
      },

      return(obj) {
        if (!obj) return;
        obj.active = false;
        if (obj.sprite) {
          obj.sprite.setActive(false).setVisible(false);
          obj.sprite.body.setVelocity(0, 0);
        }
      },
    };

    // Effect pools for max level
    this.effectPools = {
      particles: {
        objects: [],
        maxSize: 100, // For explosion particles
        get() {
          return this.objects.find((obj) => !obj.active);
        },
        return(obj) {
          if (!obj) return;
          obj.active = false;
          if (obj.sprite) {
            obj.sprite.setActive(false).setVisible(false);
            obj.sprite.setAlpha(0);
          }
        },
      },
      trails: {
        objects: [],
        maxSize: 50,
        get() {
          return this.objects.find((obj) => !obj.active);
        },
        return(obj) {
          if (!obj) return;
          obj.active = false;
          if (obj.sprite) {
            obj.sprite.setActive(false).setVisible(false);
            obj.sprite.setAlpha(0);
          }
        },
      },
    };

    this.lastFiredTime = 0;
    this.createPools();
  }

  createPools() {
    // Create projectile pool
    for (let i = 0; i < this.projectilePool.maxSize; i++) {
      const sprite = this.scene.add.sprite(0, 0, "weapon-hotdog-projectile");
      sprite.setScale(this.stats.scale);
      sprite.setActive(false).setVisible(false);

      // Enable physics
      this.scene.physics.world.enable(sprite);
      sprite.body.setSize(sprite.width * 0.8, sprite.height * 0.8);

      this.projectilePool.objects.push({
        sprite,
        active: false,
        pierceCount: this.stats.pierce,
      });
    }

    // Create effect pools for max level effects
    for (let i = 0; i < this.effectPools.particles.maxSize; i++) {
      const sprite = this.scene.add.sprite(0, 0, "weapon-hotdog-projectile");
      sprite.setActive(false).setVisible(false);

      this.effectPools.particles.objects.push({
        sprite,
        active: false,
      });
    }

    for (let i = 0; i < this.effectPools.trails.maxSize; i++) {
      const sprite = this.scene.add.sprite(0, 0, "weapon-hotdog-projectile");
      sprite.setActive(false).setVisible(false);

      this.effectPools.trails.objects.push({
        sprite,
        active: false,
      });
    }
  }

  getInactiveProjectile() {
    return this.projectilePool.get();
  }

  getInactiveParticle() {
    return this.effectPools.particles.get();
  }

  getInactiveTrail() {
    return this.effectPools.trails.get();
  }

  deactivateProjectile(proj) {
    this.projectilePool.return(proj);
  }

  deactivateParticle(particle) {
    this.effectPools.particles.return(particle);
  }

  deactivateTrail(trail) {
    this.effectPools.trails.return(trail);
  }

  update(time, delta) {
    if (this.canFire()) {
      this.attack(time);
    }

    this.getPlayerDirection(); // Ensure direction is updated

    // Update active projectiles
    this.projectilePool.objects.forEach((proj) => {
      if (proj.active && proj.sprite) {
        // Check if projectile is out of range
        const distance = Phaser.Math.Distance.Between(proj.startX, proj.startY, proj.sprite.x, proj.sprite.y);

        if (distance > this.stats.range) {
          this.deactivateProjectile(proj);
          return;
        }

        // Check for collisions with enemies
        this.scene.enemies.forEach((enemy) => {
          if (
            enemy &&
            enemy.sprite &&
            enemy.sprite.active &&
            !enemy.isDead &&
            Phaser.Geom.Intersects.RectangleToRectangle(proj.sprite.getBounds(), enemy.sprite.getBounds())
          ) {
            this.handleHit(enemy, proj);
          }
        });
      }
    });
  }

  attack(time) {
    this.lastFiredTime = time;
    this.fireProjectiles();
  }

  fireProjectiles() {
    // Get player position directly from sprite
    const startX = this.player.sprite.x;
    const startY = this.player.sprite.y;
    const direction = this.getPlayerDirection();

    // Calculate base angle from direction
    const baseAngle = Math.atan2(direction.y, direction.x);

    // Calculate spread angles for multiple projectiles
    const totalSpread = this.stats.spreadAngle;
    const angleStep = totalSpread / Math.max(1, this.stats.projectileCount - 1);
    const startAngle = baseAngle - (totalSpread / 2) * (Math.PI / 180);

    for (let i = 0; i < this.stats.projectileCount; i++) {
      const proj = this.getInactiveProjectile();
      if (!proj) continue;

      // Calculate angle for this projectile
      const projectileAngle = startAngle + (angleStep * i * Math.PI) / 180;

      // Set projectile properties
      proj.active = true;
      proj.pierceCount = this.stats.pierce;
      proj.startX = startX;
      proj.startY = startY;

      if (proj.sprite) {
        // Position and activate sprite
        proj.sprite.setPosition(startX, startY);
        proj.sprite.setVisible(true);
        proj.sprite.setActive(true);
        proj.sprite.setRotation(projectileAngle);

        // Calculate velocity components
        const velocity = {
          x: Math.cos(projectileAngle) * this.stats.speed,
          y: Math.sin(projectileAngle) * this.stats.speed,
        };

        // Set the velocity
        proj.sprite.body.setVelocity(velocity.x, velocity.y);
      }
    }
  }

  getPlayerDirection() {
    // Get both cursor keys and WASD
    const cursors = this.scene.cursors;
    const wasd = this.scene.wasd;
    let dirX = 0;
    let dirY = 0;

    // Check both arrow keys and WASD
    if (cursors.left.isDown || wasd.left.isDown) {
      dirX = -1;
    } else if (cursors.right.isDown || wasd.right.isDown) {
      dirX = 1;
    }

    if (cursors.up.isDown || wasd.up.isDown) {
      dirY = -1;
    } else if (cursors.down.isDown || wasd.down.isDown) {
      dirY = 1;
    }

    // If no direction is pressed, use the last known direction
    if (dirX === 0 && dirY === 0) {
      if (!this.lastDirection) {
        this.lastDirection = { x: 1, y: 0 }; // Default right direction
      }
      return this.lastDirection;
    }

    // Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX /= length;
      dirY /= length;
    }

    // Store the current direction as the last direction
    this.lastDirection = { x: dirX, y: dirY };

    // Set the rotation of the projectile sprite to match the direction
    const angle = Math.atan2(dirY, dirX);
    if (this.projectilePool.objects) {
      this.projectilePool.objects.forEach((proj) => {
        if (proj.sprite) {
          proj.sprite.setRotation(angle);
        }
      });
    }

    return this.lastDirection;
  }

  levelUp() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
      // Create a deep copy of the new level config
      this.stats = JSON.parse(JSON.stringify(this.levelConfigs[this.currentLevel]));
      return true;
    }
    return false;
  }

  canFire() {
    return this.scene.time.now - this.lastFiredTime >= this.stats.cooldown;
  }

  handleHit(enemy, proj) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
      return;
    }

    // Apply damage
    const damage = Math.round(this.stats.damage);
    enemy.takeDamage(damage, proj.sprite.x, proj.sprite.y);

    // Create hit effect at the projectile's current position
    this.createHitEffect(enemy, proj);

    // Create mustard explosion at max level at the projectile's position
    if (this.currentLevel === this.maxLevel && this.stats.mustardExplosion) {
      this.createMustardExplosion(proj.sprite.x, proj.sprite.y);
    }

    // Reduce pierce count
    proj.pierceCount--;

    // Deactivate projectile if it has no more pierce
    if (proj.pierceCount <= 0) {
      this.deactivateProjectile(proj);
    }
  }

  createHitEffect(enemy, proj) {
    // Create a small sprite burst effect at the collision point
    const hitSprite = this.getInactiveParticle();
    if (hitSprite) {
      hitSprite.active = true;
      hitSprite.sprite.setPosition(proj.sprite.x, proj.sprite.y);
      hitSprite.sprite.setScale(0.3);
      hitSprite.sprite.setAlpha(0.8);
      hitSprite.sprite.setTint(0xffd700); // Golden tint
      hitSprite.sprite.setActive(true).setVisible(true);

      // Create a simple burst animation
      this.scene.tweens.add({
        targets: hitSprite.sprite,
        scaleX: { from: 0.3, to: 0.6 },
        scaleY: { from: 0.3, to: 0.6 },
        alpha: { from: 0.8, to: 0 },
        duration: 200,
        ease: "Power2",
        onComplete: () => this.deactivateParticle(hitSprite),
      });
    }

    // Add a small rotation effect
    const rotationSprite = this.getInactiveParticle();
    if (rotationSprite) {
      rotationSprite.active = true;
      rotationSprite.sprite.setPosition(proj.sprite.x, proj.sprite.y);
      rotationSprite.sprite.setScale(0.4);
      rotationSprite.sprite.setAlpha(0.5);
      rotationSprite.sprite.setTint(0xff6b6b); // Reddish tint
      rotationSprite.sprite.setRotation(Math.random() * Math.PI * 2);
      rotationSprite.sprite.setActive(true).setVisible(true);

      this.scene.tweens.add({
        targets: rotationSprite.sprite,
        rotation: Math.PI * 2,
        scaleX: { from: 0.4, to: 0.1 },
        scaleY: { from: 0.4, to: 0.1 },
        alpha: { from: 0.5, to: 0 },
        duration: 300,
        ease: "Power2",
        onComplete: () => this.deactivateParticle(rotationSprite),
      });
    }
  }

  createMustardExplosion(centerX, centerY) {
    const particleCount = 16;
    const explosionRadius = this.stats.explosionRadius;

    // Create shockwave ring
    const shockwave = this.getInactiveParticle();
    if (shockwave) {
      shockwave.active = true;
      shockwave.sprite.setPosition(centerX, centerY);
      shockwave.sprite.setScale(0.1);
      shockwave.sprite.setAlpha(0.7);
      shockwave.sprite.setTint(0xfff000);
      shockwave.sprite.setActive(true).setVisible(true);

      this.scene.tweens.add({
        targets: shockwave.sprite,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 500,
        ease: "Cubic.Out",
        onComplete: () => this.deactivateParticle(shockwave),
      });
    }

    // Create central explosion burst
    const burst = this.getInactiveParticle();
    if (burst) {
      burst.active = true;
      burst.sprite.setPosition(centerX, centerY);
      burst.sprite.setScale(0.5);
      burst.sprite.setAlpha(1);
      burst.sprite.setTint(0xffdb58);
      burst.sprite.setActive(true).setVisible(true);

      this.scene.tweens.add({
        targets: burst.sprite,
        scaleX: { from: 0.5, to: 2.5 },
        scaleY: { from: 0.5, to: 2.5 },
        alpha: { from: 1, to: 0 },
        duration: 400,
        ease: "Back.Out",
        onComplete: () => this.deactivateParticle(burst),
      });
    }

    // Create inner ring particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const innerRadius = explosionRadius * 0.5;
      const dropEndX = centerX + Math.cos(angle) * innerRadius;
      const dropEndY = centerY + Math.sin(angle) * innerRadius;

      const drop = this.getInactiveParticle();
      if (drop) {
        drop.active = true;
        drop.sprite.setPosition(centerX, centerY);
        drop.sprite.setScale(0.4);
        drop.sprite.setAlpha(0.9);
        drop.sprite.setTint(0xffdb58);
        drop.sprite.setRotation(angle);
        drop.sprite.setActive(true).setVisible(true);

        this.scene.tweens.add({
          targets: drop.sprite,
          x: dropEndX,
          y: dropEndY,
          scaleX: { from: 0.4, to: 0.2 },
          scaleY: { from: 0.4, to: 0.2 },
          alpha: { from: 0.9, to: 0 },
          duration: 300,
          ease: "Power2",
          onComplete: () => this.deactivateParticle(drop),
        });
      }
    }

    // Create outer ring particles with trails
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const outerRadius = explosionRadius;
      const particleEndX = centerX + Math.cos(angle) * outerRadius;
      const particleEndY = centerY + Math.sin(angle) * outerRadius;

      // Create trail
      const trail = this.getInactiveTrail();
      if (trail) {
        trail.active = true;
        trail.sprite.setPosition(centerX, centerY);
        trail.sprite.setScale(0.3);
        trail.sprite.setAlpha(0.6);
        trail.sprite.setTint(0xffa500);
        trail.sprite.setActive(true).setVisible(true);

        this.scene.tweens.add({
          targets: trail.sprite,
          x: particleEndX,
          y: particleEndY,
          scaleX: { from: 0.3, to: 0.1 },
          scaleY: { from: 0.3, to: 0.1 },
          alpha: { from: 0.6, to: 0 },
          duration: 500,
          ease: "Power1",
          onComplete: () => this.deactivateTrail(trail),
        });
      }

      // Create particle
      const particle = this.getInactiveParticle();
      if (particle) {
        particle.active = true;
        particle.sprite.setPosition(centerX, centerY);
        particle.sprite.setScale(0.3);
        particle.sprite.setAlpha(1);
        particle.sprite.setTint(0xffdb58);
        particle.sprite.setRotation(angle);
        particle.sprite.setActive(true).setVisible(true);

        this.scene.tweens.add({
          targets: particle.sprite,
          x: particleEndX,
          y: particleEndY,
          scaleX: { from: 0.3, to: 0.15 },
          scaleY: { from: 0.3, to: 0.15 },
          rotation: angle + Math.PI * 4,
          alpha: { from: 1, to: 0 },
          duration: 400,
          ease: "Power2",
          onComplete: () => this.deactivateParticle(particle),
        });
      }

      // Create random splatter particles
      if (Math.random() < 0.5) {
        const splatter = this.getInactiveParticle();
        if (splatter) {
          const splatterX = centerX + Math.cos(angle) * (outerRadius * 0.3);
          const splatterY = centerY + Math.sin(angle) * (outerRadius * 0.3);

          splatter.active = true;
          splatter.sprite.setPosition(splatterX, splatterY);
          splatter.sprite.setScale(0.15);
          splatter.sprite.setAlpha(0.8);
          splatter.sprite.setTint(0xffdb58);
          splatter.sprite.setRotation(Math.random() * Math.PI * 2);
          splatter.sprite.setActive(true).setVisible(true);

          this.scene.tweens.add({
            targets: splatter.sprite,
            scaleX: { from: 0.15, to: 0.3 },
            scaleY: { from: 0.15, to: 0.3 },
            alpha: { from: 0.8, to: 0 },
            rotation: splatter.sprite.rotation + Math.PI,
            duration: 300 + Math.random() * 200,
            ease: "Power2",
            onComplete: () => this.deactivateParticle(splatter),
          });
        }
      }
    }

    // Create pulsing glow
    const glow = this.getInactiveParticle();
    if (glow) {
      glow.active = true;
      glow.sprite.setPosition(centerX, centerY);
      glow.sprite.setScale(1);
      glow.sprite.setAlpha(0.3);
      glow.sprite.setTint(0xffff00);
      glow.sprite.setActive(true).setVisible(true);

      this.scene.tweens.add({
        targets: glow.sprite,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 600,
        ease: "Sine.Out",
        onComplete: () => this.deactivateParticle(glow),
      });
    }

    // Deal explosion damage
    const enemies = this.scene.enemies.filter(
      (e) =>
        e &&
        e.sprite &&
        e.sprite.active &&
        !e.isDead &&
        Phaser.Math.Distance.Between(centerX, centerY, e.sprite.x, e.sprite.y) <= explosionRadius
    );

    enemies.forEach((enemy) => {
      enemy.takeDamage(this.stats.explosionDamage, centerX, centerY);
    });
  }
}

export default GlizzyBlasterWeapon;
