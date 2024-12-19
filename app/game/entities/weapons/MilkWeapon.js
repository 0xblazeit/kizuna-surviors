import { BaseWeapon } from "./BaseWeapon.js";

export class MilkWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "GooBoo";
    this.description = "Creates pools of damaging GooBoo wreckage on the ground.";
    this.type = "magic";

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 10,
        pierce: 1,
        cooldown: 2000,
        range: 300,
        speed: 0,
        scale: 0.5,
        criticalChance: 0.05,
        splashRadius: 40,
        puddleCount: 2,
        puddleDuration: 6000,
        slowAmount: 0.7, // Slow to 70% of original speed
      },
      2: {
        damage: 30,
        pierce: 2,
        cooldown: 1400,
        range: 375,
        speed: 0,
        scale: 0.55,
        criticalChance: 0.12,
        splashRadius: 60,
        puddleCount: 4,
        puddleDuration: 7000,
        slowAmount: 0.65,
      },
      3: {
        damage: 45,
        pierce: 3,
        cooldown: 1300,
        range: 400,
        speed: 0,
        scale: 0.6,
        criticalChance: 0.14,
        splashRadius: 70,
        puddleCount: 5,
        puddleDuration: 8000,
        slowAmount: 0.6,
      },
      4: {
        damage: 65,
        pierce: 3,
        cooldown: 1200,
        range: 425,
        speed: 0,
        scale: 0.65,
        criticalChance: 0.16,
        splashRadius: 80,
        puddleCount: 6,
        puddleDuration: 9000,
        slowAmount: 0.55,
      },
      5: {
        damage: 90,
        pierce: 4,
        cooldown: 1100,
        range: 450,
        speed: 0,
        scale: 0.7,
        criticalChance: 0.18,
        splashRadius: 90,
        puddleCount: 7,
        puddleDuration: 10000,
        slowAmount: 0.5,
      },
      6: {
        damage: 120,
        pierce: 4,
        cooldown: 1000,
        range: 475,
        speed: 0,
        scale: 0.75,
        criticalChance: 0.2,
        splashRadius: 100,
        puddleCount: 8,
        puddleDuration: 11000,
        slowAmount: 0.45,
      },
      7: {
        damage: 160,
        pierce: 5,
        cooldown: 900,
        range: 500,
        speed: 0,
        scale: 0.8,
        criticalChance: 0.22,
        splashRadius: 110,
        puddleCount: 9,
        puddleDuration: 12000,
        slowAmount: 0.4,
      },
      8: {
        damage: 200,
        pierce: 6,
        cooldown: 800,
        range: 525,
        speed: 0,
        scale: 0.85,
        criticalChance: 0.25,
        splashRadius: 120,
        puddleCount: 10,
        puddleDuration: 13000,
        slowAmount: 0.35,
        isMaxLevel: true,
      },
    };

    // Initialize at level 1
    this.currentLevel = 1;
    this.maxLevel = 8;
    this.stats = { ...this.levelConfigs[this.currentLevel] };

    this.activePuddles = [];
    this.lastAttackTime = 0;
  }

  canAttack() {
    return (
      this.scene.time.now - this.lastAttackTime >= this.stats.cooldown &&
      this.activePuddles.length < this.stats.puddleCount
    );
  }

  attack() {
    if (!this.canAttack()) return;

    this.lastAttackTime = this.scene.time.now;
    this.createMilkPuddle();
  }

  createMilkPuddle() {
    while (this.activePuddles.length >= this.stats.puddleCount) {
      const oldestPuddle = this.activePuddles[0];
      this.removePuddle(oldestPuddle);
    }

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.stats.range;
    const x = this.player.sprite.x + Math.cos(angle) * distance;
    const y = this.player.sprite.y + Math.sin(angle) * distance;

    const puddle = this.scene.add.sprite(x, y, "weapon-magic-milk");
    this.scene.physics.add.existing(puddle, true);
    puddle.body.setCircle(this.stats.splashRadius);
    puddle.body.setOffset(puddle.width / 2 - this.stats.splashRadius, puddle.height / 2 - this.stats.splashRadius);
    puddle.setScale(0);
    puddle.setAlpha(1);

    if (this.currentLevel === this.maxLevel) {
      // Create spinning aura layers
      const auraLayers = [];
      for (let i = 0; i < 3; i++) {
        const aura = this.scene.add.sprite(x, y, "weapon-magic-milk");
        aura.setScale(0);
        aura.setAlpha(0.2 - i * 0.05);
        aura.setTint(0xffffff);
        auraLayers.push(aura);

        // Continuous rotation and scale animation
        this.scene.tweens.add({
          targets: aura,
          angle: i % 2 === 0 ? 360 : -360,
          scaleX: this.stats.scale * (1.5 + i * 0.2),
          scaleY: this.stats.scale * (1.5 + i * 0.2),
          duration: 2000 - i * 300,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }

      // Store aura references for cleanup
      puddle.auraLayers = auraLayers;
    }

    const puddleData = {
      sprite: puddle,
      x: x,
      y: y,
      createdAt: this.scene.time.now,
      lastDamageTime: {},
      affectedEnemies: new Set(),
    };

    this.activePuddles.push(puddleData);

    this.scene.tweens.add({
      targets: puddle,
      scaleX: this.stats.scale,
      scaleY: this.stats.scale,
      duration: 200,
      ease: "Back.easeOut",
    });

    this.scene.physics.add.overlap(
      puddle,
      this.scene.enemies.map((e) => e.sprite),
      (puddleSprite, enemySprite) => {
        const enemy = this.scene.enemies.find((e) => e.sprite === enemySprite);
        if (enemy && !enemy.isDead) {
          this.handleEnemyOverlap(enemy, puddleData);
        }
      }
    );

    this.scene.time.delayedCall(this.stats.puddleDuration, () => {
      if (puddle.auraLayers) {
        puddle.auraLayers.forEach((aura) => {
          this.scene.tweens.add({
            targets: aura,
            alpha: 0,
            duration: 200,
            onComplete: () => aura.destroy(),
          });
        });
      }
      this.removePuddle(puddleData);
    });
  }

  removePuddle(puddleData) {
    const index = this.activePuddles.indexOf(puddleData);
    if (index !== -1) {
      if (puddleData.sprite.auraLayers) {
        puddleData.sprite.auraLayers.forEach((aura) => aura.destroy());
      }
      puddleData.sprite.destroy();
      this.activePuddles.splice(index, 1);
    }
  }

  handleEnemyOverlap(enemy, puddle) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || enemy.isDead) {
      this.removeSlowEffect(enemy);
      puddle.affectedEnemies.delete(enemy.id);
      return;
    }

    // Apply slow effect if not already affected
    if (!puddle.affectedEnemies.has(enemy.id)) {
      this.applySlowEffect(enemy);
      puddle.affectedEnemies.add(enemy.id);
    }

    // Initial damage on overlap
    const currentTime = this.scene.time.now;
    if (!puddle.lastDamageTime[enemy.id] || currentTime - puddle.lastDamageTime[enemy.id] >= 500) {
      const isCritical = Math.random() < this.stats.criticalChance;
      const damage = isCritical ? this.stats.damage * 1.5 : this.stats.damage;

      enemy.takeDamage(damage);
      puddle.lastDamageTime[enemy.id] = currentTime;
      this.showDamageText(enemy.sprite.x, enemy.sprite.y, damage, isCritical);
    }
  }

  removeSlowEffect(enemy) {
    if (!enemy) return;

    if (enemy.originalMoveSpeed) {
      enemy.moveSpeed = enemy.originalMoveSpeed;
      delete enemy.originalMoveSpeed;
    }
  }

  applySlowEffect(enemy) {
    if (!enemy.originalMoveSpeed) {
      enemy.originalMoveSpeed = enemy.moveSpeed;
    }
    enemy.moveSpeed = enemy.originalMoveSpeed * this.stats.slowAmount;
  }

  showDamageText(x, y, damage, isCritical) {
    const text = this.scene.add
      .text(x, y - 20, isCritical ? `CRIT! ${Math.floor(damage)}` : Math.floor(damage).toString(), {
        fontSize: isCritical ? "20px" : "16px",
        fontFamily: "VT323",
        fill: isCritical ? "#ffffff" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Cubic.Out",
      onComplete: () => text.destroy(),
    });
  }

  update(time, delta) {
    super.update(time, delta);

    // Check all active puddles and their affected enemies
    this.activePuddles.forEach((puddle) => {
      puddle.affectedEnemies.forEach((enemyId) => {
        const enemy = this.scene.enemies.find((e) => e.id === enemyId);

        // Remove dead enemies from tracking
        if (!enemy || enemy.isDead) {
          puddle.affectedEnemies.delete(enemyId);
          return;
        }

        // Check if enemy is still in range
        const distance = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, puddle.sprite.x, puddle.sprite.y);

        if (distance > this.stats.splashRadius) {
          this.removeSlowEffect(enemy);
          puddle.affectedEnemies.delete(enemyId);
        } else {
          // Update slow effect position
          // Apply continuous damage
          const currentTime = time;
          if (!puddle.lastDamageTime[enemyId] || currentTime - puddle.lastDamageTime[enemyId] >= 500) {
            const isCritical = Math.random() < this.stats.criticalChance;
            const damage = isCritical ? this.stats.damage * 1.5 : this.stats.damage;

            enemy.takeDamage(damage);
            puddle.lastDamageTime[enemyId] = currentTime;
            this.showDamageText(enemy.sprite.x, enemy.sprite.y, damage, isCritical);
          }
        }
      });
    });
  }

  levelUp() {
    if (this.currentLevel >= this.maxLevel) {
      console.log("GooBoo already at max level!");
      return false;
    }

    this.currentLevel++;
    const newStats = this.levelConfigs[this.currentLevel];

    // Update stats
    this.stats = {
      ...this.stats,
      ...newStats,
    };

    console.log(`GooBoo leveled up to ${this.currentLevel}! New stats:`, this.stats);

    // Create level up effect around existing puddles
    this.activePuddles.forEach((puddleData) => {
      const burst = this.scene.add.sprite(puddleData.sprite.x, puddleData.sprite.y, "weapon-magic-milk");
      burst.setScale(0.2);
      burst.setAlpha(0.7);
      burst.setTint(0x00ffff);

      this.scene.tweens.add({
        targets: burst,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        ease: "Quad.easeOut",
        onComplete: () => burst.destroy(),
      });

      // Scale animation on puddle
      this.scene.tweens.add({
        targets: puddleData.sprite,
        scaleX: this.stats.scale * 1.5,
        scaleY: this.stats.scale * 1.5,
        duration: 200,
        yoyo: true,
        ease: "Quad.easeOut",
        onComplete: () => {
          if (puddleData.sprite && puddleData.sprite.active) {
            puddleData.sprite.setScale(this.stats.scale);
          }
        },
      });
    });

    return true;
  }
}

export default MilkWeapon;
