import { BaseWeapon } from "./BaseWeapon.js";
export class RotatingDogWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Taco Guard Doggie";
    // Level-up configurations using Fibonacci sequence (1,1,2,3,5,8,13,21)
    this.levelConfigs = {
      1: {
        damage: 4,
        pierce: 1,
        count: 1,
        cooldown: 900,
        range: 90,
        speed: 300,
        detectionRange: 120,
        guardDistance: 120,
        scale: 0.4, // Tiny to start
      },
      2: {
        // First upgrade
        damage: 6,
        pierce: 1,
        count: 1,
        cooldown: 1100,
        range: 70,
        speed: 320,
        detectionRange: 90,
        guardDistance: 85,
        scale: 0.45,
      },
      3: {
        // Getting stronger
        damage: 9,
        pierce: 2,
        count: 2,
        cooldown: 1000,
        range: 80,
        speed: 340,
        detectionRange: 100,
        guardDistance: 90,
        scale: 0.5,
      },
      4: {
        // Significant boost
        damage: 12,
        pierce: 2,
        count: 2,
        cooldown: 900,
        range: 90,
        speed: 360,
        detectionRange: 110,
        guardDistance: 95,
        scale: 0.55,
      },
      5: {
        // Major power spike
        damage: 18,
        pierce: 3,
        count: 3,
        cooldown: 800,
        range: 100,
        speed: 380,
        detectionRange: 120,
        guardDistance: 100,
        scale: 0.58,
      },
      6: {
        // Getting powerful
        damage: 27,
        pierce: 3,
        count: 3,
        cooldown: 700,
        range: 110,
        speed: 400,
        detectionRange: 130,
        guardDistance: 105,
        scale: 0.6,
      },
      7: {
        // Near maximum power
        damage: 36,
        pierce: 4,
        count: 5,
        cooldown: 600,
        range: 120,
        speed: 420,
        detectionRange: 140,
        guardDistance: 110,
        scale: 0.69,
      },
      8: {
        // Maximum power - Special effects
        damage: 45,
        pierce: 5,
        count: 7,
        cooldown: 500,
        range: 130,
        speed: 440,
        detectionRange: 150,
        guardDistance: 115,
        scale: 0.75, // Largest at max level
        isMaxLevel: true, // Special flag for max level
      },
    };

    // Initialize at level 1
    this.currentLevel = 1;
    this.maxLevel = 8;

    // Set initial stats from level 1 config
    this.stats = {
      ...this.levelConfigs[1],
      attackDuration: 200,
      returnSpeed: 450,
    };

    // Effect colors based on level
    this.effectColors = {
      primary: 0xffffff,
      secondary: 0x0099ff,
      energy: 0xaaddff,
      // Max level colors (golden theme)
      maxLevel: {
        primary: 0xffd700, // Gold
        secondary: 0xffa500, // Orange
        energy: 0xffff00, // Yellow
      },
    };

    this.activeProjectiles = [];
  }

  initialize() {
    this.spawnDogs();
  }

  spawnDogs() {
    // Clear existing dogs
    this.activeProjectiles.forEach((dog) => {
      if (dog.sprite) {
        if (dog.sprite.particles) {
          dog.sprite.particles.destroy();
        }
        dog.sprite.destroy();
      }
    });
    this.activeProjectiles = [];

    const count = this.stats.count;
    const guardDistance = this.stats.guardDistance;

    // Spawn each dog with a random starting position
    for (let i = 0; i < count; i++) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = guardDistance * (0.8 + Math.random() * 0.4);

      const sprite = this.scene.add.sprite(0, 0, "weapon-dog-projectile");
      sprite.setScale(this.stats.scale); // Apply the scale from current level
      sprite.setOrigin(0.5, 0.5);
      sprite.setDepth(5);

      if (this.currentLevel === this.maxLevel) {
        sprite.setTint(this.effectColors.maxLevel.primary);
      }

      // Calculate initial position
      const x = this.player.x + Math.cos(randomAngle) * randomDistance;
      const y = this.player.y + Math.sin(randomAngle) * randomDistance;
      sprite.setPosition(x, y);

      // Add the dog with patrol behavior parameters
      this.activeProjectiles.push({
        sprite,
        currentAngle: randomAngle,
        targetAngle: randomAngle,
        distance: randomDistance,
        targetDistance: randomDistance,
        state: "guarding",
        lastAttackTime: 0,
        targetEnemy: null,
        originalScale: this.stats.scale,
        index: i,
        nextPatrolTime: 0,
        nextRotationTime: 0,
        patrolSpeed: 0.5 + Math.random() * 0.5,
        avoidanceRadius: 40,
        facingAngle: Math.random() * Math.PI * 2, // Random initial facing direction
        targetFacingAngle: Math.random() * Math.PI * 2, // Random target facing direction
      });

      if (this.currentLevel === this.maxLevel) {
        this.addMaxLevelEffects(sprite);
      }
    }
  }

  update(time, delta) {
    if (!super.update(time, delta)) return;
    if (!this.player) return;

    const enemies = this.scene.enemies
      ? this.scene.enemies.filter(
          (e) => e && e.sprite && e.sprite.active && !e.isDead
        )
      : [];

    // First, check if any dogs need to release their current target
    this.activeProjectiles.forEach((dog) => {
      if (dog.targetEnemy) {
        const targetValid =
          dog.targetEnemy &&
          dog.targetEnemy.sprite &&
          dog.targetEnemy.sprite.active &&
          !dog.targetEnemy.isDead;

        if (!targetValid) {
          dog.targetEnemy = null;
          dog.state = "seeking";
        }
      }

      // Add a timeout check to prevent getting stuck in attack state
      if (dog.state === "attacking" && time - dog.attackStartTime > 1000) {
        dog.state = "seeking";
        dog.targetEnemy = null;
      }

      // Add a distance check to prevent dogs from getting too far from player
      const distanceToPlayer = this.getDistance(
        dog.sprite.x,
        dog.sprite.y,
        this.player.x,
        this.player.y
      );
      if (distanceToPlayer > this.stats.guardDistance * 2) {
        dog.state = "seeking";
        dog.targetEnemy = null;
      }
    });

    // Update each dog
    this.activeProjectiles.forEach((dog, index) => {
      if (!dog.sprite || !dog.sprite.active) return;

      // Always check for nearby enemies regardless of current state
      if (
        dog.state !== "attacking" &&
        time - dog.lastAttackTime >= this.stats.cooldown
      ) {
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        enemies.forEach((enemy) => {
          const dist = this.getDistance(
            dog.sprite.x,
            dog.sprite.y,
            enemy.sprite.x,
            enemy.sprite.y
          );
          if (dist < this.stats.detectionRange && dist < nearestDistance) {
            nearestDistance = dist;
            nearestEnemy = enemy;
          }
        });

        if (nearestEnemy) {
          dog.targetEnemy = nearestEnemy;
          dog.state = "chasing";
        }
      }

      switch (dog.state) {
        case "seeking":
        case "guarding": {
          // Check if it's time to change patrol position
          if (time > dog.nextPatrolTime) {
            const angleChange = ((Math.random() - 0.5) * Math.PI) / 2;
            dog.targetAngle = dog.currentAngle + angleChange;
            dog.targetDistance =
              this.stats.guardDistance * (0.8 + Math.random() * 0.4);
            dog.nextPatrolTime = time + 2000 + Math.random() * 2000;
          }

          // Check if it's time to change facing direction
          if (time > dog.nextRotationTime) {
            const rotationChange = (Math.random() - 0.5) * Math.PI;
            dog.targetFacingAngle = dog.facingAngle + rotationChange;
            dog.nextRotationTime = time + 1000 + Math.random() * 1500;
          }

          // Smoothly move towards target position
          dog.currentAngle = this.lerpAngle(
            dog.currentAngle,
            dog.targetAngle,
            0.02
          );
          dog.distance = this.lerp(dog.distance, dog.targetDistance, 0.02);
          dog.facingAngle = this.lerpAngle(
            dog.facingAngle,
            dog.targetFacingAngle,
            0.05
          );

          let targetX =
            this.player.x + Math.cos(dog.currentAngle) * dog.distance;
          let targetY =
            this.player.y + Math.sin(dog.currentAngle) * dog.distance;

          // Apply avoidance from other dogs
          let avoidX = 0;
          let avoidY = 0;
          this.activeProjectiles.forEach((otherDog) => {
            if (otherDog !== dog && otherDog.sprite) {
              const dx = dog.sprite.x - otherDog.sprite.x;
              const dy = dog.sprite.y - otherDog.sprite.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < dog.avoidanceRadius) {
                const force =
                  (dog.avoidanceRadius - dist) / dog.avoidanceRadius;
                avoidX += (dx / dist) * force * 30;
                avoidY += (dy / dist) * force * 30;
              }
            }
          });

          targetX += avoidX;
          targetY += avoidY;

          const moveSpeed = 0.1 * dog.patrolSpeed;
          dog.sprite.x = this.lerp(dog.sprite.x, targetX, moveSpeed);
          dog.sprite.y = this.lerp(dog.sprite.y, targetY, moveSpeed);

          if (dog.sprite.particles) {
            dog.sprite.particles.setPosition(dog.sprite.x, dog.sprite.y);
          }

          dog.sprite.rotation = dog.facingAngle;
          break;
        }

        case "chasing": {
          if (dog.targetEnemy && dog.targetEnemy.sprite) {
            const distanceToEnemy = this.getDistance(
              dog.sprite.x,
              dog.sprite.y,
              dog.targetEnemy.sprite.x,
              dog.targetEnemy.sprite.y
            );

            // Return to guarding if enemy is too far
            if (distanceToEnemy > this.stats.detectionRange * 1.5) {
              dog.state = "seeking";
              dog.targetEnemy = null;
              break;
            }

            // Move towards enemy with increased speed when far away
            const speedMultiplier = distanceToEnemy > 100 ? 2.0 : 1.5;
            this.moveTowardsPoint(
              dog,
              dog.targetEnemy.sprite.x,
              dog.targetEnemy.sprite.y,
              delta,
              speedMultiplier
            );

            // Attack when close enough
            if (
              distanceToEnemy < 70 &&
              time - dog.lastAttackTime >= this.stats.cooldown
            ) {
              dog.state = "attacking";
              dog.attackStartTime = time;
              this.handleHit(dog.targetEnemy, dog);
              dog.lastAttackTime = time;
              this.createAttackEffect(
                dog.targetEnemy.sprite.x,
                dog.targetEnemy.sprite.y
              );
            }

            // Point towards enemy
            const angle = Math.atan2(
              dog.targetEnemy.sprite.y - dog.sprite.y,
              dog.targetEnemy.sprite.x - dog.sprite.x
            );
            dog.sprite.rotation = angle;
          } else {
            dog.state = "seeking";
            dog.targetEnemy = null;
          }
          break;
        }

        case "attacking": {
          const attackDuration = 200;
          if (time - dog.attackStartTime >= attackDuration) {
            dog.state = "seeking";
            dog.targetEnemy = null;
          }
          break;
        }
      }
    });
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  lerpAngle(start, end, t) {
    let diff = end - start;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return start + diff * t;
  }

  moveTowardsPoint(dog, targetX, targetY, delta, speedMultiplier = 1) {
    const dx = targetX - dog.sprite.x;
    const dy = targetY - dog.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const speed =
        (dog.state === "returning"
          ? this.stats.returnSpeed
          : this.stats.speed) * speedMultiplier;
      const movement = (speed * delta) / 1000;
      const ratio = Math.min(movement / distance, 1);

      dog.sprite.x += dx * ratio;
      dog.sprite.y += dy * ratio;

      // Update sprite rotation to face movement direction
      dog.sprite.rotation = Math.atan2(dy, dx);
    }
  }

  createAttackEffect(targetX, targetY) {
    // Create a small energy burst
    const energyBurst = this.scene.add.sprite(
      targetX,
      targetY,
      "weapon-dog-projectile"
    );
    energyBurst.setScale(0.1);
    energyBurst.setAlpha(0.4);
    energyBurst.setTint(this.effectColors.energy);

    // Burst animation
    this.scene.tweens.add({
      targets: energyBurst,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => energyBurst.destroy(),
    });

    // Add a subtle ring effect
    const ring = this.scene.add.sprite(
      targetX,
      targetY,
      "weapon-dog-projectile"
    );
    ring.setScale(0.2);
    ring.setAlpha(0.3);
    ring.setTint(this.effectColors.secondary);

    this.scene.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 200,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy(),
    });

    if (this.currentLevel === this.maxLevel) {
      // Add extra effects for max level
      const maxRing = this.scene.add.sprite(
        targetX,
        targetY,
        "weapon-dog-projectile"
      );
      maxRing.setScale(0.1);
      maxRing.setAlpha(0.5);
      maxRing.setTint(this.effectColors.maxLevel.energy);

      this.scene.tweens.add({
        targets: maxRing,
        scale: 1.2,
        alpha: 0,
        duration: 300,
        ease: "Sine.easeOut",
        onComplete: () => maxRing.destroy(),
      });
    }
  }

  handleHit(enemy, dog) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) return;

    // console.log("Applying damage to enemy");

    // Get the source position for the hit effect
    const sourceX = dog.sprite.x;
    const sourceY = dog.sprite.y;

    // Special max level effects on hit
    if (this.currentLevel === this.maxLevel) {
      // Create subtle energy pulse
      const pulse = this.scene.add.sprite(
        enemy.sprite.x,
        enemy.sprite.y,
        "weapon-dog-projectile"
      );
      pulse.setScale(0.2);
      pulse.setAlpha(0.3);
      pulse.setTint(this.effectColors.maxLevel.energy);

      this.scene.tweens.add({
        targets: pulse,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        ease: "Quad.easeOut",
        onComplete: () => pulse.destroy(),
      });

      // Add a subtle shockwave
      const shockwave = this.scene.add.sprite(
        enemy.sprite.x,
        enemy.sprite.y,
        "weapon-dog-projectile"
      );
      shockwave.setScale(0.1);
      shockwave.setAlpha(0.2);
      shockwave.setTint(this.effectColors.maxLevel.secondary);

      this.scene.tweens.add({
        targets: shockwave,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        ease: "Sine.easeOut",
        onComplete: () => shockwave.destroy(),
      });

      // Add extra damage for max level
      const critMultiplier = 1.5;
      const critChance = 0.3; // 30% chance
      if (Math.random() < critChance) {
        const critDamage = Math.floor(this.stats.damage * critMultiplier);
        enemy.takeDamage(critDamage);

        // Show crit text
        const critText = this.scene.add
          .text(enemy.sprite.x, enemy.sprite.y - 20, `CRIT! ${critDamage}`, {
            fontSize: "20px",
            fontFamily: "VT323",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3,
          })
          .setOrigin(0.5);

        this.scene.tweens.add({
          targets: critText,
          y: critText.y - 30,
          alpha: 0,
          duration: 800,
          ease: "Cubic.Out",
          onComplete: () => critText.destroy(),
        });

        return;
      }
    }

    // Apply normal damage with source position for hit effect
    enemy.takeDamage(this.stats.damage, sourceX, sourceY);

    // Visual feedback on enemy (white flash)
    enemy.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (enemy.sprite && enemy.sprite.active && !enemy.isDead) {
        enemy.sprite.clearTint();
      }
    });

    // Subtle scale effect on enemy
    this.scene.tweens.add({
      targets: enemy.sprite,
      scaleX: "*=0.9",
      scaleY: "*=0.9",
      duration: 50,
      yoyo: true,
      ease: "Quad.easeInOut",
    });
  }

  levelUp() {
    if (this.currentLevel >= this.maxLevel) {
      console.log("Weapon already at max level!");
      return false;
    }

    this.currentLevel++;
    const newStats = this.levelConfigs[this.currentLevel];

    // Store old count to check if we need to spawn more dogs
    const oldCount = this.stats.count;

    // Update stats
    this.stats = {
      ...this.stats,
      ...newStats,
    };

    console.log(
      `Weapon leveled up to ${this.currentLevel}! New stats:`,
      this.stats
    );

    // If count increased, respawn dogs
    if (newStats.count > oldCount) {
      this.spawnDogs();
    }

    // Update scale of existing dogs
    this.activeProjectiles.forEach((dog) => {
      if (dog.sprite) {
        dog.sprite.setScale(this.stats.scale);
      }
    });

    // Create level up effect
    if (this.activeProjectiles.length > 0) {
      this.activeProjectiles.forEach((dog) => {
        if (dog.sprite && dog.sprite.active) {
          // Create a burst effect
          const burst = this.scene.add.sprite(
            dog.sprite.x,
            dog.sprite.y,
            "weapon-dog-projectile"
          );
          burst.setScale(0.2);
          burst.setAlpha(0.7);
          burst.setTint(0xffff00); // Yellow color for level up

          this.scene.tweens.add({
            targets: burst,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            ease: "Quad.easeOut",
            onComplete: () => burst.destroy(),
          });

          // Scale animation on dog
          this.scene.tweens.add({
            targets: dog.sprite,
            scaleX: dog.originalScale * 1.5,
            scaleY: dog.originalScale * 1.5,
            duration: 200,
            yoyo: true,
            ease: "Quad.easeOut",
            onComplete: () => {
              if (dog.sprite && dog.sprite.active) {
                dog.sprite.setScale(dog.originalScale);
              }
            },
          });
        }
      });
    }

    return true;
  }

  getNextLevelPreview() {
    if (this.currentLevel >= this.maxLevel) {
      return null;
    }
    return this.levelConfigs[this.currentLevel + 1];
  }

  destroy() {
    this.activeProjectiles.forEach((dog) => {
      if (dog.sprite) {
        if (dog.sprite.preFX) {
          dog.sprite.preFX.clear();
        }
        dog.sprite.destroy();
      }
    });
    this.activeProjectiles = [];
  }

  addMaxLevelEffects(sprite) {
    // Add glow effect
    const glowFX = sprite.preFX.addGlow();
    glowFX.color = this.effectColors.maxLevel.energy;
    glowFX.outerStrength = 4;
    glowFX.innerStrength = 2;

    // Add special particle trail
    const particles = this.scene.add.particles(
      sprite.x,
      sprite.y,
      "weapon-dog-projectile",
      {
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [
          this.effectColors.maxLevel.primary,
          this.effectColors.maxLevel.secondary,
        ],
        speed: 20,
        lifespan: 200,
        quantity: 1,
        blendMode: "ADD",
      }
    );

    sprite.particles = particles;
  }

  findNearestEnemy(dog, enemies) {
    let nearest = null;
    let nearestDist = this.stats.detectionRange;

    enemies.forEach((enemy) => {
      const dist = this.getDistance(
        dog.sprite.x,
        dog.sprite.y,
        enemy.sprite.x,
        enemy.sprite.y
      );
      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    });

    return nearest;
  }
}
