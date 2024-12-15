import BasePlayer from "./BasePlayer";
import Coin from "../entities/Coin";
import XPGem from "../entities/XPGem";

class EnemyBasic extends BasePlayer {
  constructor(scene, x, y, texture, config = {}) {
    // Set enemy specific defaults
    const enemyConfig = {
      maxHealth: 100,
      moveSpeed: Phaser.Math.FloatBetween(1.6, 1.8), // ~55% of player speed (3) with slight variation
      defense: 0,
      attackSpeed: 1,
      attackDamage: 8,
      scale: 0.4, // Fixed scale for basic enemies
      trailTint: 0x3498db, // Light blue trail
      attackRange: 60, // Base attack range for basic enemies
      ...config,
    };

    super(scene, x, y, texture, enemyConfig);

    // Enemy specific properties
    this.type = "basic";
    this.isStaggered = false;
    this.hitFlashDuration = 300; // Increased from 100 to 300ms
    this.staggerDuration = 500; // Added separate stagger duration
    this.knockbackForce = 5; // Reduced from 150 to 30
    this.isDead = false; // Add flag to track death state

    // Movement properties
    this.targetPlayer = null;
    this.moveSpeed = enemyConfig.moveSpeed;
    this.movementEnabled = true;
    this.minDistance = 20; // Minimum distance to keep from player
    this.lastMoveTime = 0; // Add timestamp for movement updates
    this.moveUpdateInterval = 16; // Update movement every 16ms (60fps)
    this.separationRadius = 60; // Increased radius to check for nearby enemies
    this.baseSeparationForce = 0.5; // Base separation force
    this.maxSeparationForce = 2.0; // Maximum separation force when close to player
    this.lastTrailTime = 0; // Timestamp for trail effect

    // Attack properties
    this.attackRange = enemyConfig.attackRange;
    this.lastAttackTime = 0; // Track last attack time
    this.attackCooldown = 1000; // Attack cooldown in milliseconds

    // Create a basic sprite if texture isn't provided
    if (!this.sprite) {
      this.sprite = scene.add.rectangle(x, y, 40, 40, 0xff0000);
    }

    // Set sprite depth
    this.sprite.setDepth(10);

    // Create health bar with proper spacing
    const spriteHeight = this.sprite.height * enemyConfig.scale;
    const healthBarWidth = spriteHeight * 0.8;
    const healthBarHeight = spriteHeight * 0.1;
    const healthBarSpacing = spriteHeight * 0.4;

    // Create a container for the health bar to keep components together
    // this.healthBar = {
    //   width: healthBarWidth,
    //   height: healthBarHeight,
    //   spacing: healthBarSpacing,
    //   container: scene.add.container(x, y + healthBarSpacing),
    //   background: scene.add.rectangle(
    //     0,
    //     0,
    //     healthBarWidth,
    //     healthBarHeight,
    //     0x000000
    //   ),
    //   bar: scene.add.rectangle(0, 0, healthBarWidth, healthBarHeight, 0xff4444),
    // };

    // Add components to container
    // this.healthBar.container.add([
    //   this.healthBar.background,
    //   this.healthBar.bar,
    // ]);
    // this.healthBar.container.setDepth(1);

    // // Add a black border to make the health bar more visible
    // this.healthBar.background.setStrokeStyle(1, 0x000000);

    // Set target player
    this.targetPlayer = scene.player;

    // Initialize enemy
    this.initEnemy();

    // Add to scene's enemy list if it exists
    if (scene.enemies && !scene.enemies.includes(this)) {
      scene.enemies.push(this);
    }
  }

  initEnemy() {
    // Add any enemy specific initialization
    // this.sprite.setTint(0x008080); // Give enemies a slight teal tint

    // Find the player in the scene
    this.targetPlayer = this.scene.player;
  }

  update(time, delta) {
    if (!this.sprite || this.isDead) return;

    super.update(time, delta);

    const currentTime = Date.now();

    // Only update movement at fixed intervals
    if (currentTime - this.lastMoveTime < this.moveUpdateInterval) {
      return;
    }

    this.lastMoveTime = currentTime;

    // Check if enemy is off screen
    const camera = this.scene.cameras.main;
    const margin = 100; // Add a small margin to prevent popping
    const isOffScreen =
      this.sprite.x < camera.scrollX - margin ||
      this.sprite.x > camera.scrollX + camera.width + margin ||
      this.sprite.y < camera.scrollY - margin ||
      this.sprite.y > camera.scrollY + camera.height + margin;

    // Skip collision checks and most updates if off screen
    if (isOffScreen) {
      this.updateOffScreen(time, delta);
      return;
    }

    // Only check isDead for movement, not isDying
    if (this.movementEnabled && !this.isStaggered && this.targetPlayer && this.targetPlayer.sprite && !this.isDead) {
      // Calculate distance to player
      const dx = this.targetPlayer.sprite.x - this.sprite.x;
      const dy = this.targetPlayer.sprite.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate separation force from other enemies
      let separationX = 0;
      let separationY = 0;

      if (Array.isArray(this.scene.enemies)) {
        // Scale separation force based on distance to player
        const distanceScale = Math.max(0, 1 - distance / (this.attackRange * 2));
        const currentSeparationForce =
          this.baseSeparationForce + (this.maxSeparationForce - this.baseSeparationForce) * distanceScale;

        for (const otherEnemy of this.scene.enemies) {
          if (
            otherEnemy &&
            otherEnemy.sprite &&
            otherEnemy !== this &&
            !otherEnemy.isDead &&
            otherEnemy.sprite.active
          ) {
            const enemyDx = this.sprite.x - otherEnemy.sprite.x;
            const enemyDy = this.sprite.y - otherEnemy.sprite.y;
            const enemyDistance = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);

            if (enemyDistance > 0 && enemyDistance < this.separationRadius) {
              // Calculate normalized repulsion vector with inverse square falloff
              const repulsionStrength = Math.pow(1 - enemyDistance / this.separationRadius, 2);
              separationX += (enemyDx / enemyDistance) * repulsionStrength;
              separationY += (enemyDy / enemyDistance) * repulsionStrength;
            }
          }
        }

        // Normalize separation vector if it exists
        const separationLength = Math.sqrt(separationX * separationX + separationY * separationY);
        if (separationLength > 0) {
          separationX = (separationX / separationLength) * currentSeparationForce;
          separationY = (separationY / separationLength) * currentSeparationForce;
        }
      }

      // Always move towards player if not too close
      if (distance > this.minDistance) {
        // Normalize direction
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Apply movement with separation
        this.sprite.x += normalizedDx * this.moveSpeed + separationX;
        this.sprite.y += normalizedDy * this.moveSpeed + separationY;

        // Update sprite direction
        if (dx < 0) {
          this.sprite.setFlipX(true);
        } else {
          this.sprite.setFlipX(false);
        }

        // Add trail effect if moving
        if (currentTime - this.lastTrailTime >= this.trailConfig.spawnInterval) {
          super.createTrailEffect();
          this.lastTrailTime = currentTime;
        }
      } else {
        // Apply only separation force when close to player
        this.sprite.x += separationX;
        this.sprite.y += separationY;
      }

      // Check if within attack range and cooldown is ready
      if (distance <= this.attackRange && currentTime - this.lastAttackTime >= this.attackCooldown) {
        this.attackPlayer();
      }
    }
  }

  updateOffScreen(time, delta) {
    // Only do basic position updates when off screen
    if (this.targetPlayer && this.targetPlayer.sprite && !this.isDead) {
      const dx = this.targetPlayer.sprite.x - this.sprite.x;
      const dy = this.targetPlayer.sprite.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.minDistance) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        this.sprite.x += normalizedDx * this.moveSpeed;
        this.sprite.y += normalizedDy * this.moveSpeed;
      }
    }
  }

  takeDamage(amount, sourceX, sourceY) {
    if (this.isDead) {
      return 0;
    }

    let damageDealt = amount;

    // Apply defense reduction
    if (this.stats.defense > 0) {
      damageDealt = Math.max(1, amount - this.stats.defense);
    }

    this.stats.currentHealth -= damageDealt;

    // Show damage number for every hit
    const damageText = this.scene.add
      .text(this.sprite.x, this.sprite.y - 20, damageDealt.toString(), {
        fontSize: "16px",
        fill: "#ffffff",
      })
      .setDepth(100);

    // Animate the damage text
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        damageText.destroy();
      },
    });

    // Flash white when hit
    if (this.sprite) {
      // Apply a more intense white flash
      this.sprite.setAlpha(1); // Ensure full opacity
      this.sprite.setBlendMode(Phaser.BlendModes.ADD); // Make the white more vibrant
      this.sprite.setTint(0xffffff);

      // Clear the flash effect after duration
      this.scene.time.delayedCall(this.hitFlashDuration, () => {
        if (this.sprite && !this.isDead) {
          this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
          this.sprite.clearTint();
        }
      });
    }

    // Apply knockback if source position is provided
    if (sourceX !== undefined && sourceY !== undefined) {
      this.applyKnockback(sourceX, sourceY);
    }

    // Check for death
    if (this.stats.currentHealth <= 0) {
      this.die();
    }

    return damageDealt;
  }

  applyKnockback(sourceX, sourceY) {
    if (!this.sprite || this.isDead) return;

    // Calculate direction from source to enemy
    const dx = this.sprite.x - sourceX;
    const dy = this.sprite.y - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return; // Avoid division by zero

    // Normalize direction and apply knockback force
    const knockbackX = (dx / distance) * this.knockbackForce;
    const knockbackY = (dy / distance) * this.knockbackForce;

    // Apply the knockback movement
    this.sprite.x += knockbackX;
    this.sprite.y += knockbackY;

    // Temporarily disable movement during knockback
    this.movementEnabled = false;
    this.isStaggered = true;

    // Re-enable movement after stagger duration
    this.scene.time.delayedCall(this.staggerDuration, () => {
      this.movementEnabled = true;
      this.isStaggered = false;
    });
  }

  playHitEffects(sourceX, sourceY) {
    if (!this.sprite || this.isDead) return;

    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(this.hitFlashDuration, () => {
      if (this.sprite) {
        this.sprite.clearTint();
      }
    });
  }

  updateHealthBar() {
    super.updateHealthBar();
  }

  heal(amount) {
    super.heal(amount);
    this.updateHealthBar();
  }

  handleMovement(input) {
    super.handleMovement(input);

    // Update health bar container position to follow enemy
    if (this.healthBar) {
      this.healthBar.container.setPosition(this.sprite.x, this.sprite.y + this.healthBar.spacing);
    }
  }

  playDeathAnimation() {
    return new Promise((resolve) => {
      this.sprite.setTint(0xffffff); // White flash

      // Create a fade out and scale down effect
      this.scene.tweens.add({
        targets: [this.sprite],
        alpha: 0,
        scale: 0.1,
        duration: 300,
        ease: "Power2",
        onComplete: () => {
          try {
            // Create custom particle effects
            const numParticles = 12;
            const colors = [0xffffff, 0xeeeeee, 0xdddddd]; // Different shades of white

            for (let i = 0; i < numParticles; i++) {
              const angle = ((Math.PI * 2) / numParticles) * i;
              const speed = Phaser.Math.Between(100, 200);

              // Create a custom shape for the particle
              const graphics = this.scene.add.graphics();
              const color = Phaser.Utils.Array.GetRandom(colors);

              // Randomly choose between circle and diamond shapes
              if (Math.random() > 0.5) {
                // Draw a small circle
                graphics.lineStyle(2, color, 1);
                graphics.strokeCircle(0, 0, 4);
              } else {
                // Draw a diamond shape
                graphics.lineStyle(2, color, 1);
                graphics.beginPath();
                graphics.moveTo(0, -4);
                graphics.lineTo(4, 0);
                graphics.lineTo(0, 4);
                graphics.lineTo(-4, 0);
                graphics.closePath();
                graphics.strokePath();
              }

              // Position at enemy's location
              graphics.setPosition(this.sprite.x, this.sprite.y);

              // Calculate velocity
              const vx = Math.cos(angle) * speed;
              const vy = Math.sin(angle) * speed;

              // Create particle animation
              this.scene.tweens.add({
                targets: graphics,
                x: graphics.x + vx * 0.5,
                y: graphics.y + vy * 0.5,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                angle: Phaser.Math.Between(-180, 180),
                duration: 500,
                ease: "Power2",
                onComplete: () => {
                  graphics.destroy();
                },
              });
            }

            // Create a burst effect at the center
            const burstGraphics = this.scene.add.graphics();
            burstGraphics.lineStyle(2, 0xffffff, 1);
            burstGraphics.strokeCircle(this.sprite.x, this.sprite.y, 2);

            this.scene.tweens.add({
              targets: burstGraphics,
              alpha: 0,
              scale: { from: 1, to: 3 },
              duration: 200,
              ease: "Power2",
              onComplete: () => {
                burstGraphics.destroy();
              },
            });

            // Resolve after particles are done
            this.scene.time.delayedCall(500, () => {
              resolve();
            });
          } catch (error) {
            console.error("Error in death effect:", error);
            resolve();
          }
        },
      });
    });
  }

  onDeath() {
    // Only check isDead
    if (this.isDead) {
      return;
    }

    // Clean up health bar
    if (this.healthBar) {
      this.healthBar.container.destroy();
    }

    // Increment kill counter only once
    this.scene.gameState.kills++;
    this.scene.killsText.setText(`Kills: ${this.scene.gameState.kills}`);

    // Play death animation
    this.playDeathAnimation().then(() => {
      if (this.sprite) {
        this.sprite.destroy();
      }
      // Emit any necessary events or handle additional cleanup
      this.scene.events.emit("enemyDefeated", this);
    });
  }

  die() {
    // Prevent multiple death calls
    if (this.isDead) return;
    this.isDead = true;

    // Increment kill counter
    this.scene.gameState.kills++;
    this.scene.killsText.setText(`Kills: ${this.scene.gameState.kills}`);

    // Initialize arrays if they don't exist
    if (!this.scene.coins) {
      this.scene.coins = [];
    }
    if (!this.scene.xpGems) {
      this.scene.xpGems = [];
    }

    // Scale coin value with game time and enemy type
    const baseValue = this.type === "epic" ? 50 : this.type === "advanced" ? 25 : 10;
    const waveMultiplier = Math.min(3, Math.floor(this.scene.gameState.wave / 5) + 1); // Cap at 3x after wave 15
    const coinValue = baseValue * waveMultiplier;

    // Improved drop chance calculation for early waves
    // Start with higher base chance and gradually decrease
    const baseDropChance = 0.4; // Increased from 0.25
    const waveScaling = Math.max(0.6, 1 - this.scene.gameState.wave / 25); // Slower decrease, minimum 60% of base chance
    const dropChance = Math.random();
    
    if (dropChance < baseDropChance * waveScaling) {
      // Increased coin drop ratio in early waves
      const coinDropThreshold = Math.min(0.25, 0.15 + (5 - Math.min(5, this.scene.gameState.wave)) * 0.03);
      
      if (dropChance < coinDropThreshold) {
        // Spawn consolidated coins
        Coin.spawnConsolidated(this.scene, this.sprite.x, this.sprite.y, coinValue);
      } else {
        // XP gem with adjusted value for early waves
        const gemValue = Math.max(30, 50 - (5 - Math.min(5, this.scene.gameState.wave)) * 5);
        const gem = new XPGem(this.scene, this.sprite.x, this.sprite.y, gemValue, 0.12);
        if (gem) {
          this.scene.xpGems.push(gem);
        }
      }
    }

    // Play death animation and cleanup
    this.playDeathAnimation().then(() => {
      // Remove from scene's enemy list
      if (this.scene.enemies) {
        const index = this.scene.enemies.indexOf(this);
        if (index > -1) {
          this.scene.enemies.splice(index, 1);
        }
      }

      // Cleanup health bar
      if (this.healthBar) {
        this.healthBar.container.destroy();
      }

      // Destroy sprite
      if (this.sprite) {
        this.sprite.destroy();
      }
    });
  }

  attackPlayer() {
    if (!this.targetPlayer || this.isDead || this.isStaggered) return;

    // Deal damage to the player
    const damageDealt = this.stats.attackDamage;
    this.targetPlayer.takeDamage(damageDealt);
  }
}

export default EnemyBasic;
