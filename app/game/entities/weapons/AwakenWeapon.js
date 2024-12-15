import { BaseWeapon } from "./BaseWeapon.js";

export class AwakenWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Awakened";
    this.description = "Stun enemies with awakening light";
    this.type = "magic";

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 45,
        cooldown: 5000,
        range: 250,
        targetCount: 1,
        scale: 0.6,
      },
      2: {
        damage: 75,
        cooldown: 4800,
        range: 275,
        targetCount: 1,
        scale: 0.65,
      },
      3: {
        damage: 120,
        cooldown: 4600,
        range: 300,
        targetCount: 2,
        scale: 0.7,
      },
      4: {
        damage: 180,
        cooldown: 4400,
        range: 325,
        targetCount: 2,
        scale: 0.75,
      },
      5: {
        damage: 255,
        cooldown: 4200,
        range: 350,
        targetCount: 3,
        scale: 0.8,
      },
      6: {
        damage: 345,
        cooldown: 4000,
        range: 375,
        targetCount: 3,
        scale: 0.85,
      },
      7: {
        damage: 450,
        cooldown: 3800,
        range: 400,
        targetCount: 4,
        scale: 0.9,
      },
      8: {
        damage: 570,
        cooldown: 3600,
        range: 450,
        targetCount: 5,
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

    // Filter valid targets
    const validTargets = enemies.filter((enemy) => {
      // Skip if enemy is invalid
      if (!enemy || !enemy.sprite || enemy.isDead) {
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

    // Return random targets up to the limit
    return Phaser.Utils.Array.Shuffle(validTargets).slice(0, this.stats.targetCount);
  }

  createAwakenEffect(enemy) {
    // Large eye symbol
    const eye = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-awaken");
    eye.setScale(0);
    eye.setAlpha(1);
    eye.setDepth(100);
    eye.setBlendMode(Phaser.BlendModes.ADD);

    // Main eye animation
    this.scene.tweens.add({
      targets: eye,
      scale: { from: 0, to: this.stats.scale * 4 },
      alpha: { from: 1, to: 0 },
      duration: 3300,
      ease: "Power2",
      onComplete: () => eye.destroy(),
    });

    // Apply damage
    const damage = this.stats.damage;
    enemy.takeDamage(damage);

    // Max level special effects
    if (this.currentLevel === 8) {
      // Create multiple orbiting eyes
      const orbitingEyes = [];
      const numEyes = 6;
      for (let i = 0; i < numEyes; i++) {
        const orbitEye = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-awaken");
        orbitEye.setScale(0.3);
        orbitEye.setAlpha(0.8);
        orbitEye.setBlendMode(Phaser.BlendModes.ADD);
        orbitingEyes.push(orbitEye);

        // Create orbiting animation
        const angle = (i / numEyes) * Math.PI * 2;
        const radius = 100;

        this.scene.tweens.add({
          targets: orbitEye,
          x: enemy.sprite.x + Math.cos(angle) * radius,
          y: enemy.sprite.y + Math.sin(angle) * radius,
          scale: 0,
          alpha: 0,
          duration: 1000,
          ease: "Power2",
          onComplete: () => orbitEye.destroy(),
        });
      }

      // Additional damage wave
      const nearbyEnemies = this.scene.enemies.filter((e) => {
        if (!e || !e.sprite || e.isDead) return false;
        const dist = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, e.sprite.x, e.sprite.y);
        return dist <= 150 && e !== enemy; // 150 pixel radius
      });

      // Apply chain damage to nearby enemies
      nearbyEnemies.forEach((nearbyEnemy) => {
        const chainDamage = Math.floor(damage * 0.5); // 50% of original damage
        nearbyEnemy.takeDamage(chainDamage);

        // Create chain eye effect
        const chainEye = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-awaken");
        chainEye.setScale(0.4);
        chainEye.setAlpha(0.8);
        chainEye.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
          targets: chainEye,
          x: nearbyEnemy.sprite.x,
          y: nearbyEnemy.sprite.y,
          scale: 0.1,
          alpha: 0,
          duration: 400,
          ease: "Power2",
          onComplete: () => chainEye.destroy(),
        });
      });

      // Create expanding eye rings
      for (let i = 0; i < 3; i++) {
        const ringEye = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-awaken");
        ringEye.setScale(0.2);
        ringEye.setAlpha(0.6);
        ringEye.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
          targets: ringEye,
          scale: 1.5 + i * 0.5,
          alpha: 0,
          duration: 800 + i * 200,
          ease: "Power2",
          onComplete: () => ringEye.destroy(),
        });
      }

      // Stronger screen shake for max level
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(150, 0.008);
      }
    }

    // Apply powerful knockback
    if (enemy.sprite && enemy.sprite.body) {
      const angle = Math.atan2(enemy.sprite.y - eye.y, enemy.sprite.x - eye.x);

      const knockbackForce = this.currentLevel === 8 ? 400 : 300; // Enhanced knockback at max level
      enemy.sprite.body.velocity.x += Math.cos(angle) * knockbackForce;
      enemy.sprite.body.velocity.y += Math.sin(angle) * knockbackForce;
    }

    // Create damage text
    const damageText = this.scene.add
      .text(enemy.sprite.x, enemy.sprite.y - 40, damage.toString(), {
        fontSize: this.currentLevel === 8 ? "40px" : "32px",
        fontFamily: "VT323",
        color: this.currentLevel === 8 ? "#FFD700" : "#ffffff", // Gold color for max level
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

    // Add impact effect
    const impact = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, "weapon-awaken");
    impact.setScale(0.3);
    impact.setTint(this.currentLevel === 8 ? 0xffd700 : 0xffffff); // Gold tint for max level
    impact.setAlpha(0.8);

    // Animate impact
    this.scene.tweens.add({
      targets: impact,
      scale: this.currentLevel === 8 ? 2 : 1.5,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => impact.destroy(),
    });
  }

  attack(time) {
    // Set the last fired time
    this.lastFiredTime = time;

    // Find targets
    const targets = this.findTargets();

    // Process each target
    targets.forEach((target, index) => {
      if (target && target.sprite && !target.isDead) {
        this.createAwakenEffect(target);
      }
    });
  }
}

export default AwakenWeapon;
