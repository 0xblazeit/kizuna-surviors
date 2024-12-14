import { BaseWeapon } from "./BaseWeapon.js";

export class AwakenWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Awaken";
    this.description = "Stun enemies with awakening light";
    this.type = "magic";

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 45,
        cooldown: 5000,
        range: 250,
        targetCount: 1,
        stunDuration: 1000,
        scale: 0.6,
      },
      2: {
        damage: 75,
        cooldown: 4800,
        range: 275,
        targetCount: 1,
        stunDuration: 1200,
        scale: 0.65,
      },
      3: {
        damage: 120,
        cooldown: 4600,
        range: 300,
        targetCount: 2,
        stunDuration: 1400,
        scale: 0.7,
      },
      4: {
        damage: 180,
        cooldown: 4400,
        range: 325,
        targetCount: 2,
        stunDuration: 1600,
        scale: 0.75,
      },
      5: {
        damage: 255,
        cooldown: 4200,
        range: 350,
        targetCount: 3,
        stunDuration: 1800,
        scale: 0.8,
      },
      6: {
        damage: 345,
        cooldown: 4000,
        range: 375,
        targetCount: 3,
        stunDuration: 2000,
        scale: 0.85,
      },
      7: {
        damage: 450,
        cooldown: 3800,
        range: 400,
        targetCount: 4,
        stunDuration: 2200,
        scale: 0.9,
      },
      8: {
        damage: 570,
        cooldown: 3600,
        range: 450,
        targetCount: 5,
        stunDuration: 2500,
        scale: 1,
      },
    };

    this.currentLevel = 1;
    this.updateStats(this.currentLevel);
  }

  updateStats(level) {
    const config = this.levelConfigs[level];
    if (config) {
      this.stats = { ...config };
      this.currentLevel = level;
    }
  }

  findTargets() {
    // Get all enemies from the scene
    const enemies = this.scene.enemies || [];

    // Debug: Log the number of enemies found
    console.log(`Total enemies found: ${enemies.length}`);

    // Filter valid targets
    const validTargets = enemies.filter((enemy) => {
      // Skip if enemy is invalid
      if (!enemy || !enemy.sprite || enemy.isDead || enemy.isStunned) {
        return false;
      }

      // Calculate distance
      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        enemy.sprite.x,
        enemy.sprite.y
      );

      // Check if enemy is in range
      return distance <= this.stats.range;
    });

    // Debug: Log the number of valid targets
    console.log(`Valid targets in range: ${validTargets.length}`);

    // Return random targets up to the limit
    return Phaser.Utils.Array.Shuffle(validTargets).slice(0, this.stats.targetCount);
  }

  createAwakenEffect(enemy) {
    console.log("Creating awaken effect for enemy at:", enemy.sprite.x, enemy.sprite.y);

    // Large eye symbol
    const eye = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-eye");
    eye.setScale(0);
    eye.setAlpha(1);
    eye.setDepth(100);
    eye.setBlendMode(Phaser.BlendModes.ADD);

    // Main eye animation
    this.scene.tweens.add({
      targets: eye,
      scale: { from: 0, to: this.stats.scale * 4 }, // Large scale for visibility
      alpha: { from: 1, to: 0 },
      duration: 2300,
      ease: "Power2",
      onComplete: () => eye.destroy(),
    });

    // Stun the enemy
    enemy.isStunned = true;
    if (enemy.sprite) {
      enemy.sprite.setTint(0xffffff);
    }

    // Apply damage
    const damage = this.stats.damage;
    enemy.takeDamage(damage);

    const damageText = this.scene.add
      .text(enemy.sprite.x, enemy.sprite.y - 40, damage.toString(), {
        fontSize: "32px",
        fontFamily: "VT323",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setDepth(101)
      .setOrigin(0.5);

    // Animate damage text
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 60,
      scale: { from: 1.5, to: 1 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: "Power2",
      onComplete: () => damageText.destroy(),
    });

    // Remove stun after duration
    this.scene.time.delayedCall(this.stats.stunDuration, () => {
      if (enemy.sprite && !enemy.isDead) {
        enemy.isStunned = false;
        enemy.sprite.clearTint();
        enemy.sprite.setAlpha(1);
      }
    });
  }

  attack(time) {
    // Set the last fired time
    this.lastFiredTime = time;

    // Find targets
    const targets = this.findTargets();

    // Debug: Log targeting attempt
    console.log(`Attempting to attack ${targets.length} targets`);

    // Process each target
    targets.forEach((target, index) => {
      // Debug: Log each target being processed
      console.log(`Processing target ${index + 1}`);

      if (target && target.sprite && !target.isDead) {
        this.createAwakenEffect(target);
      }
    });
  }
}

export default AwakenWeapon;
