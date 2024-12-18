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
    this.active = true; // Add active state tracking

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
    if (this.isDead || !this.sprite || !this.movementEnabled) return;

    // Update position to match sprite
    this.x = this.sprite.x;
    this.y = this.sprite.y;

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

    // Find target if none exists
    if (!this.targetPlayer) {
      this.targetPlayer = this.scene.player;
    }

    if (this.targetPlayer && !this.isStaggered) {
      // Calculate direction to player
      const dx = this.targetPlayer.x - this.x;
      const dy = this.targetPlayer.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if we should attack
      if (distance <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
        this.attack();
        this.lastAttackTime = time;
      }

      // Move towards player if not too close
      if (distance > this.minDistance) {
        // Apply separation from other enemies
        const separation = this.calculateSeparation();
        
        // Normalize direction
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Apply movement with separation
        this.sprite.x += (normalizedDx * this.moveSpeed + separation.x) * (delta / 16);
        this.sprite.y += (normalizedDy * this.moveSpeed + separation.y) * (delta / 16);

        // Update sprite facing direction
        if (dx < 0) {
          this.sprite.setFlipX(true);
        } else {
          this.sprite.setFlipX(false);
        }
      }

      // Create trail effect
      if (time > this.lastTrailTime + 100) { // Adjust timing for trail frequency
        this.createTrailEffect();
        this.lastTrailTime = time;
      }
    }
  }

  updateOffScreen(time, delta) {
    // Only do basic position updates when off screen
    if (this.targetPlayer && !this.isDead) {
      const dx = this.targetPlayer.x - this.x;
      const dy = this.targetPlayer.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.minDistance) {
        // Normalize direction
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Simple movement without collision or separation
        this.sprite.x += normalizedDx * this.moveSpeed * (delta / 16);
        this.sprite.y += normalizedDy * this.moveSpeed * (delta / 16);

        // Update position to match sprite
        this.x = this.sprite.x;
        this.y = this.sprite.y;

        // Update sprite direction
        if (dx < 0) {
          this.sprite.setFlipX(true);
        } else {
          this.sprite.setFlipX(false);
        }
      }
    }
  }

  calculateSeparation() {
    const separation = { x: 0, y: 0 };
    let neighborCount = 0;

    // Check distance to other enemies
    if (this.scene.enemies) {
      this.scene.enemies.forEach(other => {
        // Skip null, dead, or self enemies
        if (!other || other === this || other.isDead || !other.sprite || !other.sprite.active) {
          return;
        }

        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.separationRadius && distance > 0) {
          // Weight separation force by distance (closer = stronger)
          const force = (this.separationRadius - distance) / this.separationRadius;
          separation.x += (dx / distance) * force;
          separation.y += (dy / distance) * force;
          neighborCount++;
        }
      });

      // Average and scale the separation force
      if (neighborCount > 0) {
        separation.x = separation.x / neighborCount * this.baseSeparationForce;
        separation.y = separation.y / neighborCount * this.baseSeparationForce;

        // Scale up separation when close to player
        if (this.targetPlayer) {
          const playerDist = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.targetPlayer.x, this.targetPlayer.y
          );
          const playerProximityScale = Math.max(
            1,
            (this.attackRange * 2 - playerDist) / (this.attackRange * 2) * this.maxSeparationForce
          );
          separation.x *= playerProximityScale;
          separation.y *= playerProximityScale;
        }
      }
    }

    return separation;
  }

  createTrailEffect() {
    if (!this.sprite || this.isDead) return;

    const trail = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.sprite.texture.key);
    trail.setAlpha(0.3);
    trail.setScale(this.sprite.scaleX, this.sprite.scaleY);
    trail.setTint(this.trailTint);
    trail.setDepth(this.sprite.depth - 1);
    trail.setFlipX(this.sprite.flipX);

    // Fade out and destroy
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        trail.destroy();
      }
    });
  }

  attack() {
    if (this.isDead || !this.targetPlayer) return;

    // Calculate direction to player
    const dx = this.targetPlayer.x - this.x;
    const dy = this.targetPlayer.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.attackRange) {
      // Deal damage to player
      this.targetPlayer.takeDamage(this.stats.attackDamage);

      // Visual feedback for attack
      if (this.sprite) {
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: this.sprite.scaleX * 1.2,
          scaleY: this.sprite.scaleY * 1.2,
          duration: 100,
          yoyo: true,
          ease: 'Quad.easeInOut'
        });
      }
    }
  }

  die() {
    if (this.isDead) return;
    
    this.isDead = true;
    this.movementEnabled = false;

    // Increment kill counter
    if (this.scene) {
      // Increment kills in gameState
      if (this.scene.gameState) {
        this.scene.gameState.kills++;
      }

      // Update kills text
      if (this.scene.killsText) {
        this.scene.killsText.setText(`Kills: ${this.scene.gameState?.kills || 0}`);
      }

      // Update enemies remaining and check for wave completion
      if (this.scene.gameState.enemiesRemainingInWave > 0) {
        this.scene.gameState.enemiesRemainingInWave--;
        console.log(`Enemy killed, ${this.scene.gameState.enemiesRemainingInWave} remaining in wave`);

        // Start next wave if all enemies are cleared and no more are spawning
        if (this.scene.gameState.enemiesRemainingInWave <= 0 && this.scene.enemies.length <= 1) {
          console.log('Wave cleared, starting next wave');
          this.scene.startNextWave();
        }
      }
    }
    
    if (this.sprite) {
      // Death animation
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scale: this.sprite.scale * 1.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          // Instead of destroying, we'll despawn the enemy
          if (this.scene && this.scene.enemyPool) {
            this.scene.enemyPool.despawn(this);
          }
        }
      });
    }

    // Spawn rewards
    this.spawnRewards();
  }

  takeDamage(amount, sourceX, sourceY) {
    if (this.isDead) return;

    // Calculate actual damage taken
    const actualDamage = Math.max(1, amount - this.stats.defense);
    this.health -= actualDamage;

    // Show damage number
    this.showDamageNumber(actualDamage);

    // Handle death
    if (this.health <= 0 && !this.isDead) {
      this.isDead = true;
      
      // Remove from scene's enemy array
      const index = this.scene.enemies.indexOf(this);
      if (index > -1) {
        this.scene.enemies.splice(index, 1);
      }

      // Spawn rewards
      this.spawnRewards();

      // Instead of destroying, we'll despawn the enemy
      if (this.scene && this.scene.enemyPool) {
        this.scene.enemyPool.despawn(this);
      }

      return;
    }

    // Flash effect on hit
    if (this.sprite) {
      this.sprite.setAlpha(1);
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.sprite.setTint(0xffffff);

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
      if (!this.isDead) {  // Only re-enable if not dead
        this.movementEnabled = true;
        this.isStaggered = false;
      }
    });
  }

  showDamageNumber(damage) {
    if (!this.sprite) return;

    const damageText = this.scene.add
      .text(this.sprite.x, this.sprite.y - 20, damage.toString(), {
        fontSize: "16px",
        fill: "#ffffff",
      })
      .setDepth(100);

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

  destroy() {
    // Override destroy to prevent actual destruction when using pool
    if (this.scene && this.scene.enemyPool) {
      this.scene.enemyPool.despawn(this);
    } else {
      super.destroy();
    }
  }

  spawnRewards() {
    if (!this.sprite) return;

    // Determine coin value based on enemy type
    let coinValue = 10; // Base value for basic enemies
    if (this.type === "advanced") {
      coinValue = 25;
    } else if (this.type === "epic") {
      coinValue = 50;
    }

    // Spawn coins (30% chance)
    if (Math.random() < 0.3) {
      const coins = Coin.spawnConsolidated(
        this.scene,
        this.sprite.x,
        this.sprite.y,
        coinValue
      );

      // Add spawned coins to scene's coin array
      if (coins && this.scene.coins) {
        this.scene.coins.push(...coins);
      }
    }

    // Spawn XP gems
    const xpAmount = Math.floor(Math.random() * 3) + 1; // 1-3 XP gems
    for (let i = 0; i < xpAmount; i++) {
      const offset = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
      };
      const xpGem = new XPGem(
        this.scene,
        this.sprite.x + offset.x,
        this.sprite.y + offset.y
      );
      if (this.scene.xpGems) {
        this.scene.xpGems.push(xpGem);
      }
    }

    // Update wave state
    if (this.scene.gameState.enemiesRemainingInWave > 0) {
      this.scene.gameState.enemiesRemainingInWave--;

      // Check if wave is complete AND no enemies are left
      if (this.scene.gameState.enemiesRemainingInWave <= 0 && this.scene.enemies.length <= 1) {
        this.scene.startNextWave();
      }
    }
  }
}

export default EnemyBasic;
