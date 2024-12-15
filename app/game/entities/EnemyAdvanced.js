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

    // Calculate base coin value and scale with wave
    const baseValue = 50; // Increased from 25
    const waveMultiplier = Math.min(3, 1 + (this.scene.gameState.wave * 0.1)); // Scales up to 3x by wave 20
    const totalCoinValue = Math.floor(baseValue * waveMultiplier);

    // Determine drop type - 70% chance for any drop (increased from 60%)
    const dropChance = Math.random();
    if (dropChance < 0.70) {  
      // 40% chance for coins (28% total), 60% chance for XP gem (42% total)
      if (dropChance < 0.28) {
        // Use the coin consolidation system for better performance
        Coin.spawnConsolidated(this.scene, this.sprite.x, this.sprite.y, totalCoinValue);
      } else {
        // Advanced enemies drop higher value XP gems
        const gem = new XPGem(
          this.scene,
          this.sprite.x,
          this.sprite.y,
          150, // Keep the same XP value
          0.15
        );
        if (gem) {
          this.scene.xpGems.push(gem);
        }
      }
    }

    super.die();
  }
}

export default EnemyAdvanced;
