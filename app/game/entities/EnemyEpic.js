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
      clickDamage: 60, // Higher click damage
      attackRange: 230, // Double the basic enemy range
      ...config,
    };

    super(scene, x, y, texture, epicConfig);

    // Epic enemy specific properties
    this.type = "epic";

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
    // Clean up aura first
    if (this.aura) {
      this.aura.destroy();
      this.aura = null;
    }
    // Set higher coin value for epic enemies
    const coinValue = 50;
    // Initialize arrays if they don't exist
    if (!this.scene.coins) {
      this.scene.coins = [];
    }
    if (!this.scene.xpGems) {
      this.scene.xpGems = [];
    }

    // Determine drop type - 100% chance for any drop
    const dropChance = Math.random();
    // 40% chance for coin, 60% chance for XP gem
    if (dropChance < 0.4) {
      const coin = new Coin(this.scene, this.sprite.x, this.sprite.y);
      if (coin) {
        this.scene.coins.push(coin);
      }
    } else {
      const gem = new XPGem(
        this.scene,
        this.sprite.x,
        this.sprite.y,
        200,
        0.18
      );
      if (gem) {
        this.scene.xpGems.push(gem);
      }
    }

    super.playDeathAnimation().then(() => {
      // Then call parent die method
      super.die();
    });
  }
}

export default EnemyEpic;
