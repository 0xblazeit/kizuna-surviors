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
      attackRange: 180, // 50% more range than basic enemies
      ...config,
    };

    super(scene, x, y, texture, advancedConfig);

    // Advanced enemy specific properties
    this.type = "advanced";
  }

  die() {
    // Initialize arrays if they don't exist
    if (!this.scene.coins) {
      this.scene.coins = [];
    }
    if (!this.scene.xpGems) {
      this.scene.xpGems = [];
    }

    // Determine drop type - 50% chance for any drop
    const dropChance = Math.random();
    if (dropChance < 0.50) {  // 50% chance for a drop
      // 40% chance for coin (20% total), 60% chance for XP gem (30% total)
      if (dropChance < 0.20) {
        const coin = new Coin(this.scene, this.sprite.x, this.sprite.y);
        if (coin) {
          this.scene.coins.push(coin);
        }
      } else {
        const gem = new XPGem(this.scene, this.sprite.x, this.sprite.y, 100, 0.15);
        if (gem) {
          this.scene.xpGems.push(gem);
        }
      }
    }

    super.die();
  }
}

export default EnemyAdvanced;
