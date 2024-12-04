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
      scale: 0.4, // Reduced from 0.8
      trailTint: 0x3498db, // Light blue trail
      clickDamage: 25, // Add default click damage
      ...config,
    };

    super(scene, x, y, texture, enemyConfig);

    // Enemy specific properties
    this.type = "basic";
    this.isStaggered = false;
    this.hitFlashDuration = 300; // Increased from 100 to 300ms
    this.staggerDuration = 500; // Added separate stagger duration
    this.knockbackForce = 30; // Reduced from 150 to 30
    this.clickDamage = enemyConfig.clickDamage;
    this.isDead = false; // Add flag to track death state

    // Movement properties
    this.targetPlayer = null;
    this.moveSpeed = enemyConfig.moveSpeed;
    this.movementEnabled = true;
    this.movementRange = 500; // Fixed larger movement range
    this.minDistance = 20; // Reduced minimum distance
    this.lastMoveTime = 0; // Add timestamp for movement updates
    this.moveUpdateInterval = 16; // Update movement every 16ms (60fps)

    // Attack properties
    this.attackRange = 50; // Range at which enemy can attack player
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

    // Make the enemy interactive
    this.sprite.setInteractive();

    // Handle click/tap events
    this.sprite.on("pointerdown", (pointer) => {
      // Only process click if the enemy is alive
      if (this.stats.currentHealth > 0) {
        // Get the player instance
        const player = this.scene.player;
        if (player) {
          // Calculate damage from player's click
          const damage = player.clickDamage;
          this.takeDamage(damage, pointer.x, pointer.y);

          // Create click effect
          this.createClickEffect(pointer.x, pointer.y);
        }
      }
    });

    // Find the player in the scene
    this.targetPlayer = this.scene.player;
  }

  update() {
    super.update();

    const currentTime = Date.now();

    // Only update movement at fixed intervals
    if (currentTime - this.lastMoveTime < this.moveUpdateInterval) {
      return;
    }

    this.lastMoveTime = currentTime;

    // Only check isDead for movement, not isDying
    if (
      this.movementEnabled &&
      !this.isStaggered &&
      this.targetPlayer &&
      !this.isDead
    ) {
      // Calculate distance to player
      const dx = this.targetPlayer.sprite.x - this.sprite.x;
      const dy = this.targetPlayer.sprite.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if within attack range and cooldown is ready
      if (
        distance <= this.attackRange &&
        currentTime - this.lastAttackTime >= this.attackCooldown
      ) {
        this.attackPlayer();
        this.lastAttackTime = currentTime;
      }

      // Move if within range and not too close
      if (distance <= this.movementRange && distance > this.minDistance) {
        // Normalize direction
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Calculate movement step
        const step = this.moveSpeed; // Remove the time scaling since we're already using fixed intervals

        // Move towards player
        this.sprite.x += normalizedDx * step;
        this.sprite.y += normalizedDy * step;

        // Update health bar position
        if (this.healthBar) {
          this.healthBar.container.setPosition(
            this.sprite.x,
            this.sprite.y + this.healthBar.spacing
          );
        }

        // Flip sprite based on movement direction
        if (dx < 0) {
          this.sprite.setFlipX(true);
        } else {
          this.sprite.setFlipX(false);
        }

        // Add trail effect if moving
        if (
          currentTime - this.lastTrailTime >=
          this.trailConfig.spawnInterval
        ) {
          super.createTrailEffect();
          this.lastTrailTime = currentTime;
        }
      }
    }
  }

  takeDamage(amount, sourceX, sourceY) {
    // console.log("Enemy taking damage:", amount);
    if (this.isDead) {
      // console.log("Enemy already dead, ignoring damage");
      return 0;
    }

    let damageDealt = amount;

    // Apply defense reduction
    if (this.stats.defense > 0) {
      damageDealt = Math.max(1, amount - this.stats.defense);
    }

    this.stats.currentHealth -= damageDealt;
    // console.log("Enemy health after damage:", this.stats.currentHealth);

    // Show damage number for every hit
    const damageText = this.scene.add
      .text(
        this.sprite.x,
        this.sprite.y - 20,
        Math.floor(damageDealt).toString(),
        {
          fontSize: "16px",
          fontFamily: "VT323",
          fill: "#ffffff", // White color for normal hits
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5);

    // Animate the damage text
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Cubic.Out",
      onComplete: () => damageText.destroy(),
    });

    // Play hit effects with source position
    this.playHitEffects(sourceX, sourceY);

    // Check for death
    if (this.stats.currentHealth <= 0) {
      // console.log("Enemy health depleted, calling die()");
      this.die();
    }

    return damageDealt;
  }

  playHitEffects(sourceX, sourceY) {
    if (this.isStaggered) return; // Prevent stagger interruption

    this.isStaggered = true;
    this.movementEnabled = false; // Stop movement during stagger

    // Flash effect - already flashing white
    const originalTint = this.sprite.tintTopLeft;
    this.sprite.setTint(0xffffff);

    // Create a slight knockback/stagger effect
    const staggerDistance = 10;
    const staggerDuration = 100;

    // Calculate stagger direction
    let angle;
    if (sourceX !== undefined && sourceY !== undefined) {
      // If we have a source position, stagger away from it
      const dx = this.sprite.x - sourceX;
      const dy = this.sprite.y - sourceY;
      angle = Math.atan2(dy, dx);
    } else {
      // Otherwise use random direction like the player
      angle = Math.random() * Math.PI * 2;
    }

    const staggerX = Math.cos(angle) * staggerDistance;
    const staggerY = Math.sin(angle) * staggerDistance;

    // Create stagger animation for the sprite
    const targets = [this.sprite];
    // Only include healthBar if it exists
    if (this.healthBar && this.healthBar.container) {
      targets.push(this.healthBar.container);
    }

    // Create stagger animation
    this.scene.tweens.add({
      targets: targets,
      x: "+=" + staggerX,
      y: "+=" + staggerY,
      duration: staggerDuration / 2,
      ease: "Quad.Out",
      yoyo: true,
      onComplete: () => {
        // Reset position exactly to avoid drift
        this.sprite.x -= staggerX;
        this.sprite.y -= staggerY;
        if (this.healthBar && this.healthBar.container) {
          this.healthBar.container.setPosition(
            this.sprite.x,
            this.sprite.y + this.healthBar.spacing
          );
        }
      },
    });

    // Visual feedback during stagger
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.6,
      yoyo: true,
      repeat: 2,
      duration: 100,
      ease: "Linear",
    });

    // Reset after stagger duration
    this.scene.time.delayedCall(this.hitFlashDuration, () => {
      this.sprite.setTint(originalTint);
    });

    this.scene.time.delayedCall(this.staggerDuration, () => {
      this.isStaggered = false;
      this.movementEnabled = true;
      this.sprite.alpha = 1;
    });
  }

  createClickEffect(x, y) {
    // Create a circle at the click position
    const clickEffect = this.scene.add.circle(x, y, 5, 0xffffff);

    // Add a white glow effect
    clickEffect.setStrokeStyle(2, 0xffffff);
    clickEffect.setAlpha(0.8);

    // Animate the click effect
    this.scene.tweens.add({
      targets: clickEffect,
      scale: 2,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        clickEffect.destroy();
      },
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
      this.healthBar.container.setPosition(
        this.sprite.x,
        this.sprite.y + this.healthBar.spacing
      );
    }
  }

  playDeathAnimation() {
    return new Promise((resolve) => {
      // console.log('Setting up death animation');
      // Create a flash effect
      this.sprite.setTint(0xffffff); // White flash

      // Create a fade out and scale down effect
      this.scene.tweens.add({
        targets: [this.sprite],
        alpha: 0,
        scale: 0.1,
        duration: 300,
        ease: "Power2",
        onComplete: () => {
          //console.log('Tween complete, creating particles');
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
              console.log("Animation complete");
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
      console.log("Death already being processed, skipping");
      return;
    }

    console.log("Enemy death triggered");
    // Clean up health bar
    if (this.healthBar) {
      console.log("Cleaning up health bar");
      this.healthBar.container.destroy();
    }

    // Increment kill counter only once
    this.scene.gameState.kills++;
    this.scene.killsText.setText(`Kills: ${this.scene.gameState.kills}`);

    // Play death animation
    console.log("Starting death animation");
    this.playDeathAnimation().then(() => {
      console.log("Death animation completed");
      if (this.sprite) {
        console.log("Destroying sprite");
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

    // Determine coin value based on enemy type
    let coinValue = 10; // Base value for basic enemies
    if (this.type === "advanced") {
      coinValue = 25; // Advanced enemies drop more
    } else if (this.type === "epic") {
      coinValue = 50; // Epic enemies drop even more
    }

    // Determine drop type - 25% chance for any drop
    const dropChance = Math.random();
    if (dropChance < 0.25) {
      // 40% chance for coin (10% total), 60% chance for XP gem (15% total)
      if (dropChance < 0.1) {
        const coin = new Coin(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          coinValue
        );
        if (coin) {
          this.scene.coins.push(coin);
        }
      } else {
        const gem = new XPGem(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          50,
          0.12
        );
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
