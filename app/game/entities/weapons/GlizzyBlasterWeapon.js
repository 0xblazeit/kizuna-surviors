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
        damage: 5, // Lower base damage
        pierce: 1,
        projectileCount: 1,
        spreadAngle: 0,
        cooldown: 1100, // Faster firing
        range: 800, // Much longer range
        speed: 200, // Faster projectiles
        scale: 0.4,
      },
      2: {
        damage: 6,
        pierce: 1,
        projectileCount: 2,
        spreadAngle: 15,
        cooldown: 1100,
        range: 850,
        speed: 200,
        scale: 0.45,
      },
      3: {
        damage: 7,
        pierce: 2,
        projectileCount: 3,
        spreadAngle: 20,
        cooldown: 1000,
        range: 900,
        speed: 300,
        scale: 0.5,
      },
      4: {
        damage: 8,
        pierce: 2,
        projectileCount: 3,
        spreadAngle: 25,
        cooldown: 1000,
        range: 950,
        speed: 400,
        scale: 0.55,
      },
      5: {
        damage: 9,
        pierce: 2,
        projectileCount: 3,
        spreadAngle: 30,
        cooldown: 1200,
        range: 1000,
        speed: 480,
        scale: 0.6,
      },
      6: {
        damage: 10,
        pierce: 3,
        projectileCount: 4,
        spreadAngle: 35,
        cooldown: 100,
        range: 1050,
        speed: 500,
        scale: 0.65,
      },
      7: {
        damage: 12,
        pierce: 3,
        projectileCount: 4,
        spreadAngle: 40,
        cooldown: 1100,
        range: 1100,
        speed: 520,
        scale: 0.7,
      },
      8: {
        damage: 18,
        pierce: 4,
        projectileCount: 5,
        spreadAngle: 45,
        range: 1200,
        cooldown: 300,
        speed: 550,
        scale: 0.75,
        isMaxLevel: true,
        mustardExplosion: true,
        explosionDamage: 8,
        explosionRadius: 100,
      },
    };

    // Initialize at level 1
    this.currentLevel = 1;
    this.maxLevel = 8;
    // Create a deep copy of the level 1 config to avoid reference issues
    this.stats = JSON.parse(JSON.stringify(this.levelConfigs[1]));

    // Initialize projectile pool
    this.maxProjectiles = 50;
    this.activeProjectiles = [];
    this.lastFiredTime = 0;

    this.createProjectiles();
  }

  update(time, delta) {
    // Call base class update which includes death check
    if (!super.update(time, delta)) {
      return;
    }

    // Update player direction immediately
    this.getPlayerDirection(); // Ensure direction is updated

    // Update active projectiles
    this.activeProjectiles.forEach((proj) => {
      if (proj.active && proj.sprite) {
        // Check if projectile is out of range
        const distance = Phaser.Math.Distance.Between(
          proj.startX,
          proj.startY,
          proj.sprite.x,
          proj.sprite.y
        );

        if (distance > this.stats.range) {
          this.deactivateProjectile(proj);
          return;
        }

        // Check for collisions with enemies
        const enemies = this.scene.enemies
          ? this.scene.enemies.filter((e) => {
              return e && e.sprite && e.sprite.active && !e.isDead;
            })
          : [];

        // Check collision with each enemy
        enemies.forEach((enemy) => {
          if (proj.active && proj.pierceCount > 0) {
            const projX = proj.sprite.x;
            const projY = proj.sprite.y;
            const enemyX = enemy.sprite.x;
            const enemyY = enemy.sprite.y;

            // Calculate distance for collision
            const dx = projX - enemyX;
            const dy = projY - enemyY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Collision thresholds
            const projRadius = 15; // Smaller collision radius for hotdog
            const enemyRadius = 25;
            const collisionThreshold = projRadius + enemyRadius;

            // Check if collision occurred
            if (distance < collisionThreshold) {
              this.handleHit(enemy, proj);
            }
          }
        });
      }
    });

    // Auto-fire the weapon
    if (this.canFire()) {
      this.attack(time);
    }
  }

  attack(time) {
    this.lastFiredTime = time;
    this.fireProjectiles();
  }

  fireProjectiles() {
    const direction = this.getPlayerDirection();
    const startX = this.player.x;
    const startY = this.player.y;

    // Calculate the base angle from the direction
    const baseAngle = Math.atan2(direction.y, direction.x);

    // Calculate spread angles based on projectile count
    const angleStep =
      this.stats.projectileCount > 1
        ? this.stats.spreadAngle / (this.stats.projectileCount - 1)
        : 0;
    const startAngle =
      baseAngle - (this.stats.spreadAngle / 2) * (Math.PI / 180);

    // Fire multiple projectiles in a spread pattern
    for (let i = 0; i < this.stats.projectileCount; i++) {
      const proj = this.getInactiveProjectile();
      if (!proj) continue;

      // Calculate angle for this projectile
      const angle = startAngle + (angleStep * i * Math.PI) / 180;

      // Set projectile properties
      proj.active = true;
      proj.pierceCount = this.stats.pierce;
      proj.startX = startX;
      proj.startY = startY;

      if (proj.sprite) {
        proj.sprite.setPosition(startX, startY);
        proj.sprite.setVisible(true);
        proj.sprite.setActive(true);
        proj.sprite.setRotation(angle);

        // Calculate velocity based on angle
        const velocity = {
          x: Math.cos(angle) * this.stats.speed,
          y: Math.sin(angle) * this.stats.speed,
        };

        // Set the velocity
        proj.sprite.body.setVelocity(velocity.x, velocity.y);
      }
    }
  }

  createProjectiles() {
    // Clear existing projectiles
    this.activeProjectiles.forEach((proj) => {
      if (proj.sprite) {
        proj.sprite.destroy();
      }
    });
    this.activeProjectiles = [];

    // Create new projectiles
    for (let i = 0; i < this.maxProjectiles; i++) {
      const sprite = this.scene.add.sprite(0, 0, "weapon-hotdog-projectile");
      sprite.setScale(this.stats.scale);
      sprite.setActive(false);
      sprite.setVisible(false);

      // Enable physics for the sprite
      this.scene.physics.world.enable(sprite);
      sprite.body.setSize(sprite.width * 0.8, sprite.height * 0.8); // Slightly smaller hitbox
      sprite.body.debugShowBody = false; // Disable debug visualization
      sprite.body.debugShowVelocity = false; // Disable velocity visualization

      this.activeProjectiles.push({
        sprite: sprite,
        active: false,
        pierceCount: this.stats.pierce,
      });
    }
  }

  getInactiveProjectile() {
    return this.activeProjectiles.find((proj) => !proj.active);
  }

  deactivateProjectile(proj) {
    if (!proj) return;

    proj.active = false;
    if (proj.sprite) {
      proj.sprite.setVisible(false);
      proj.sprite.setActive(false);
      proj.sprite.body.setVelocity(0, 0);
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
    if (this.activeProjectiles) {
      this.activeProjectiles.forEach((proj) => {
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
      this.stats = JSON.parse(
        JSON.stringify(this.levelConfigs[this.currentLevel])
      );
      this.createProjectiles(); // Recreate projectiles with new stats
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

    // Create hit effect
    this.createHitEffect(enemy, proj);

    // Create mustard explosion at max level
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
    // Create a small sprite burst effect
    const hitSprite = this.scene.add.sprite(
      proj.sprite.x,
      proj.sprite.y,
      "weapon-hotdog-projectile"
    );
    hitSprite.setScale(0.3);
    hitSprite.setAlpha(0.8);
    hitSprite.setTint(0xffd700); // Golden tint

    // Create a simple burst animation
    this.scene.tweens.add({
      targets: hitSprite,
      scaleX: { from: 0.3, to: 0.6 },
      scaleY: { from: 0.3, to: 0.6 },
      alpha: { from: 0.8, to: 0 },
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        hitSprite.destroy();
      },
    });

    // Add a small rotation effect
    const rotationSprite = this.scene.add.sprite(
      proj.sprite.x,
      proj.sprite.y,
      "weapon-hotdog-projectile"
    );
    rotationSprite.setScale(0.4);
    rotationSprite.setAlpha(0.5);
    rotationSprite.setTint(0xff6b6b); // Reddish tint

    this.scene.tweens.add({
      targets: rotationSprite,
      rotation: Math.PI * 2,
      scaleX: { from: 0.4, to: 0.1 },
      scaleY: { from: 0.4, to: 0.1 },
      alpha: { from: 0.5, to: 0 },
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        rotationSprite.destroy();
      },
    });
  }

  createMustardExplosion(x, y) {
    const particleCount = 16; // Increased particle count
    const explosionRadius = this.stats.explosionRadius;

    // Create shockwave ring
    const shockwave = this.scene.add.sprite(x, y, "weapon-hotdog-projectile");
    shockwave.setScale(0.1);
    shockwave.setAlpha(0.7);
    shockwave.setTint(0xfff000); // Bright yellow

    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 500,
      ease: "Cubic.Out",
      onComplete: () => shockwave.destroy(),
    });

    // Create central explosion burst
    const burstSprite = this.scene.add.sprite(x, y, "weapon-hotdog-projectile");
    burstSprite.setScale(0.5);
    burstSprite.setAlpha(1);
    burstSprite.setTint(0xffdb58); // Mustard yellow

    // Burst animation with bounce effect
    this.scene.tweens.add({
      targets: burstSprite,
      scaleX: { from: 0.5, to: 2.5 },
      scaleY: { from: 0.5, to: 2.5 },
      alpha: { from: 1, to: 0 },
      duration: 400,
      ease: "Back.Out",
      onComplete: () => burstSprite.destroy(),
    });

    // Create inner ring of particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const innerRadius = explosionRadius * 0.5;

      const mustardDrop = this.scene.add.sprite(
        x,
        y,
        "weapon-hotdog-projectile"
      );
      mustardDrop.setScale(0.4);
      mustardDrop.setAlpha(0.9);
      mustardDrop.setTint(0xffdb58);
      mustardDrop.setRotation(angle);

      const endX = x + Math.cos(angle) * innerRadius;
      const endY = y + Math.sin(angle) * innerRadius;

      // Drip effect
      this.scene.tweens.add({
        targets: mustardDrop,
        x: endX,
        y: endY,
        scaleX: { from: 0.4, to: 0.2 },
        scaleY: { from: 0.4, to: 0.2 },
        alpha: { from: 0.9, to: 0 },
        duration: 300,
        ease: "Power2",
        onComplete: () => mustardDrop.destroy(),
      });
    }

    // Create outer ring of particles with trails
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const outerRadius = explosionRadius;

      // Create trail effect
      const trail = this.scene.add.sprite(x, y, "weapon-hotdog-projectile");
      trail.setScale(0.3);
      trail.setAlpha(0.6);
      trail.setTint(0xffa500); // Orange tint for trail

      const mustardParticle = this.scene.add.sprite(
        x,
        y,
        "weapon-hotdog-projectile"
      );
      mustardParticle.setScale(0.3);
      mustardParticle.setAlpha(1);
      mustardParticle.setTint(0xffdb58);
      mustardParticle.setRotation(angle);

      const endX = x + Math.cos(angle) * outerRadius;
      const endY = y + Math.sin(angle) * outerRadius;

      // Trail animation
      this.scene.tweens.add({
        targets: trail,
        x: endX,
        y: endY,
        scaleX: { from: 0.3, to: 0.1 },
        scaleY: { from: 0.3, to: 0.1 },
        alpha: { from: 0.6, to: 0 },
        duration: 500,
        ease: "Power1",
        onComplete: () => trail.destroy(),
      });

      // Particle animation with spin
      this.scene.tweens.add({
        targets: mustardParticle,
        x: endX,
        y: endY,
        scaleX: { from: 0.3, to: 0.15 },
        scaleY: { from: 0.3, to: 0.15 },
        rotation: angle + Math.PI * 4, // Two full rotations
        alpha: { from: 1, to: 0 },
        duration: 400,
        ease: "Power2",
        onComplete: () => mustardParticle.destroy(),
      });

      // Add random small splatter particles
      if (Math.random() < 0.5) {
        const splatter = this.scene.add.sprite(
          x + Math.cos(angle) * (outerRadius * 0.3),
          y + Math.sin(angle) * (outerRadius * 0.3),
          "weapon-hotdog-projectile"
        );
        splatter.setScale(0.15);
        splatter.setAlpha(0.8);
        splatter.setTint(0xffdb58);
        splatter.setRotation(Math.random() * Math.PI * 2);

        this.scene.tweens.add({
          targets: splatter,
          scaleX: { from: 0.15, to: 0.3 },
          scaleY: { from: 0.15, to: 0.3 },
          alpha: { from: 0.8, to: 0 },
          rotation: splatter.rotation + Math.PI,
          duration: 300 + Math.random() * 200,
          ease: "Power2",
          onComplete: () => splatter.destroy(),
        });
      }
    }

    // Create pulsing glow effect
    const glow = this.scene.add.sprite(x, y, "weapon-hotdog-projectile");
    glow.setScale(1);
    glow.setAlpha(0.3);
    glow.setTint(0xffff00);

    this.scene.tweens.add({
      targets: glow,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      ease: "Sine.Out",
      onComplete: () => glow.destroy(),
    });

    // Deal explosion damage to nearby enemies
    const enemies = this.scene.enemies.filter(
      (e) =>
        e &&
        e.sprite &&
        e.sprite.active &&
        !e.isDead &&
        Phaser.Math.Distance.Between(x, y, e.sprite.x, e.sprite.y) <=
          explosionRadius
    );

    enemies.forEach((enemy) => {
      enemy.takeDamage(this.stats.explosionDamage, x, y);
    });
  }
}

export default GlizzyBlasterWeapon;
