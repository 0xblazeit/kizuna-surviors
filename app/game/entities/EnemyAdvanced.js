import EnemyBasic from "./EnemyBasic";
import Coin from "../entities/Coin";

class EnemyAdvanced extends EnemyBasic {
  constructor(scene, x, y, texture, config = {}) {
    // Set advanced enemy specific defaults with higher stats
    const advancedConfig = {
      maxHealth: 200, // Double health
      moveSpeed: Phaser.Math.FloatBetween(2.0, 2.2), // Faster than basic enemies
      defense: 2, // Added defense
      attackSpeed: 1.2, // 20% faster attacks
      attackDamage: 12, // 50% more damage
      scale: 0.42, // Just slightly larger than basic enemies (0.4)
      trailTint: 0xff0000, // Red trail for advanced enemies
      clickDamage: 40, // Higher click damage
      ...config,
    };

    super(scene, x, y, texture, advancedConfig);

    // Advanced enemy specific properties
    this.type = "advanced";
  }

  die() {
    // Initialize coins array if it doesn't exist
    if (!this.scene.coins) {
      this.scene.coins = [];
    }

    // 90% chance to drop a coin for advanced enemies
    if (Math.random() < 0.9) {
      const coin = new Coin(this.scene, this.sprite.x, this.sprite.y);
      this.scene.coins.push(coin);
    }

    super.playDeathAnimation().then(() => {
      // Rest of cleanup handled by parent class
      super.die();
    });
  }
}

export default EnemyAdvanced;
