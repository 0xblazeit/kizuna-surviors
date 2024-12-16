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

  update() {
    super.update();

    // Update aura position
    if (this.aura) {
      this.aura.setPosition(this.x, this.y);
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
