import EnemyAdvanced from "./EnemyAdvanced";
import Coin from "../entities/Coin";
import XPGem from "../entities/XPGem";

class EnemyEpic extends EnemyAdvanced {
  constructor(scene, x, y, texture, config = {}) {
    // Set epic enemy specific defaults with even higher stats
    const epicConfig = {
      maxHealth: 400, // Double the advanced enemy health
      moveSpeed: Phaser.Math.FloatBetween(2.4, 2.6), // Even faster than advanced
      defense: 4, // Double defense
      attackSpeed: 1.4, // 40% faster attacks
      attackDamage: 18, // 50% more damage than advanced
      scale: 0.15, // Slightly larger than advanced (0.42)
      trailTint: 0xffa500, // Orange trail
      attackRange: 120,
      ...config,
    };

    super(scene, x, y, texture, epicConfig);

    // Epic enemy specific properties
    this.type = "epic";

    // Custom separation parameters for epic enemies
    this.separationRadius = 100; // Even larger separation radius for epic enemies
    this.baseSeparationForce = 0.8; // Strongest base separation
    this.maxSeparationForce = 3.0; // Strongest max separation

    // Make sure sprite is visible and configured properly
    if (!this.sprite) {
      console.log("⚠️ Creating new sprite for epic enemy");
      this.sprite = scene.add.sprite(x, y, texture);
    }

    // Always ensure physics is set up
    if (!this.sprite.body) {
      scene.physics.add.existing(this.sprite);
    }

    // Configure sprite properties
    this.sprite.setScale(epicConfig.scale);
    this.sprite.setDepth(5);
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
    
    // Configure physics body
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setCircle(20); // Adjust hitbox size
    this.sprite.body.setOffset(12, 12); // Center the hitbox
    this.sprite.body.setBounce(0.1);
    this.sprite.body.setDrag(100);

    // Set target player
    this.targetPlayer = scene.player;
    
    // Make sure movement is enabled
    this.movementEnabled = true;
    this.moveSpeed = epicConfig.moveSpeed;

    // Initialize movement state
    this.movementState = {
      direction: "right",
      isMoving: false,
    };

    console.log("🏆 Epic enemy created:", {
      texture: this.sprite?.texture.key,
      scale: this.sprite?.scale,
      visible: this.sprite?.visible,
      x: this.sprite?.x,
      y: this.sprite?.y,
      hasPhysics: this.sprite?.body ? "yes" : "no",
      targetPlayer: this.targetPlayer ? "set" : "missing",
      moveSpeed: this.moveSpeed,
      movementEnabled: this.movementEnabled
    });

    // Create dark red aura
    this.createAura();
  }

  createAura() {
    // Create a circle for the aura
    this.aura = this.scene.add.circle(this.x, this.y, 20, 0xc0c0c0, 0.3);
    this.aura.setDepth(this.sprite.depth - 1); // Place behind the enemy

    // Add pulsing animation
    this.scene.tweens.add({
      targets: this.aura,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.3, to: 0.1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update(time, delta) {
    if (!this.active || this.isDead || !this.targetPlayer || !this.sprite || !this.sprite.body) {
      return;
    }

    // Update position based on physics body
    this.x = this.sprite.x;
    this.y = this.sprite.y;

    // Update aura position
    if (this.aura) {
      this.aura.setPosition(this.x, this.y);
    }

    // Calculate distance to player
    const dx = this.targetPlayer.sprite.x - this.sprite.x;
    const dy = this.targetPlayer.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Log position and movement state (every 60 frames)
    if (time % 60 === 0) {
      console.log("🏆 Epic enemy state:", {
        x: this.sprite.x,
        y: this.sprite.y,
        distance,
        movementEnabled: this.movementEnabled,
        active: this.active,
        isDead: this.isDead,
        velocity: { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y }
      });
    }

    // Handle movement
    if (this.movementEnabled && !this.isStaggered) {
      // Calculate separation from other enemies
      const separation = this.calculateSeparation();

      // If too close to player, move away
      if (distance < this.minAttackDistance) {
        const awayX = -dx / distance;
        const awayY = -dy / distance;
        this.sprite.body.setVelocity(
          (awayX * this.moveSpeed + separation.x) * 60,
          (awayY * this.moveSpeed + separation.y) * 60
        );
      }
      // If too far from player, move closer
      else if (distance > this.attackRange) {
        const towardX = dx / distance;
        const towardY = dy / distance;
        this.sprite.body.setVelocity(
          (towardX * this.moveSpeed + separation.x) * 60,
          (towardY * this.moveSpeed + separation.y) * 60
        );
      }
      // If at good distance, just apply separation
      else {
        this.sprite.body.setVelocity(
          separation.x * 60,
          separation.y * 60
        );
      }

      // Update sprite facing direction
      if (dx < 0) {
        this.sprite.setFlipX(true);
      } else {
        this.sprite.setFlipX(false);
      }

      // Create trail effect
      if (time > this.lastTrailTime + 100) {
        this.createTrailEffect();
        this.lastTrailTime = time;
      }
    }

    // Handle attack cooldown and damage
    if (!this.isStaggered && distance <= this.attackRange && 
        Date.now() - this.lastAttackTime >= this.attackCooldown) {
      this.attack();
      this.lastAttackTime = Date.now();
    }
  }

  destroy() {
    // Clean up aura
    if (this.aura) {
      this.aura.destroy();
    }
    super.destroy();
  }

  die() {
    // Prevent multiple death calls
    if (this.isDead) return;
    this.isDead = true;

    // Clean up aura first
    if (this.aura) {
      this.aura.destroy();
      this.aura = null;
    }

    // Initialize arrays if they don't exist
    if (!this.scene.coins) {
      this.scene.coins = [];
    }
    if (!this.scene.xpGems) {
      this.scene.xpGems = [];
    }

    // Determine drop type - 40% chance for drops
    const dropChance = Math.random();
    if (dropChance < 0.4) {
      // 40% chance for coins (16% total), 60% chance for XP gems (24% total)
      if (dropChance < 0.16) {
        // Epic enemies drop more valuable consolidated coins
        Coin.spawnConsolidated(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          120 // High value for epic enemies
        );
      } else {
        // Epic enemies drop higher value XP gems
        const gem = new XPGem(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          150, // Higher base value
          0.15
        );
        if (gem) {
          this.scene.xpGems.push(gem);
        }
      }
    }

    // Increment kill counter
    this.scene.gameState.kills++;
    this.scene.killsText.setText(`Kills: ${this.scene.gameState.kills}`);

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
}

export default EnemyEpic;
