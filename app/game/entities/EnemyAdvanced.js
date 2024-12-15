import EnemyBasic from "./EnemyBasic";
import Coin from "../entities/Coin";
import XPGem from "../entities/XPGem";

class EnemyAdvanced extends EnemyBasic {
  constructor(scene, x, y, texture, config = {}) {
    // Set advanced enemy specific defaults with higher stats
    const advancedConfig = {
      maxHealth: 200, // Double health
      moveSpeed: Phaser.Math.FloatBetween(2.0, 2.2), // Faster than basic enemies
      defense: 2, // Added defense
      attackSpeed: 1.2, // 20% faster attacks
      attackDamage: 12, // 50% more damage
      scale: 0.18, // Just slightly larger than basic enemies (0.4)
      trailTint: 0xffff00, // Gold trail for advanced enemies
      attackRange: 145, // 50% more range than basic enemies
      ...config,
    };

    super(scene, x, y, texture, advancedConfig);

    // Advanced enemy specific properties
    this.type = "advanced";
    
    // Custom separation parameters for advanced enemies
    this.separationRadius = 80; // Larger separation radius due to bigger size
    this.baseSeparationForce = 0.6; // Stronger base separation
    this.maxSeparationForce = 2.4; // Stronger max separation
  }

  die() {
    // Prevent multiple death calls
    if (this.isDead) return;
    this.isDead = true;

    // Initialize arrays if they don't exist
    if (!this.scene.coins) {
      this.scene.coins = [];
    }
    if (!this.scene.xpGems) {
      this.scene.xpGems = [];
    }

    // Determine drop type - 60% chance for drops
    const dropChance = Math.random();
    if (dropChance < 0.60) {  
      // 30% chance for coins (18% total), 70% chance for XP gems (42% total)
      if (dropChance < 0.18) {
        // Advanced enemies drop higher value coins
        Coin.spawnConsolidated(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          50 // Higher value for advanced enemies
        );
      } else {
        // Advanced enemies drop higher value XP gems
        const gem = new XPGem(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          100, // Higher base value
          0.13
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

export default EnemyAdvanced;
