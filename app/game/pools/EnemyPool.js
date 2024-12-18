import EnemyBasic from "../entities/EnemyBasic";
import EnemyAdvanced from "../entities/EnemyAdvanced";
import EnemyEpic from "../entities/EnemyEpic";
import EnemyShooter from "../entities/EnemyShooter";

// Enemy sprite constants
const ENEMY_SPRITES = [
  "enemy-basic-one",
  "enemy-basic-two",
  "enemy-basic-three",
  "enemy-basic-four",
  "enemy-basic-five",
  "enemy-basic-six",
];

const ENEMY_ADVANCED_SPRITES = [
  "enemy-advanced-one",
  "enemy-advanced-two",
  "enemy-advanced-three",
  "enemy-advanced-four",
  "enemy-advanced-five",
  "enemy-advanced-six",
];

const ENEMY_EPIC_SPRITES = [
  "enemy-epic-one",
  "enemy-epic-two",
  "enemy-epic-three",
  "enemy-epic-four",
  "enemy-epic-five",
  "enemy-epic-six",
];

export class EnemyPool {
  constructor(scene) {
    this.scene = scene;
    this.pools = {
      basic: [],
      advanced: [],
      epic: [],
      shooter: [],
    };
    // Track active enemies per type
    this.activeEnemies = {
      basic: new Set(),
      advanced: new Set(),
      epic: new Set(),
      shooter: new Set(),
    };
    this.poolSize = 200; // Initial pool size
    this.maxPoolSize = 300; // Maximum pool size
    this.lastCleanupTime = 0;
    this.cleanupInterval = 5000; // Cleanup every 5 seconds
    this.cleanupThreshold = 1500; // Distance threshold for cleanup
    this.maxCleanupPerInterval = 50; // Max enemies to cleanup per interval
  }

  initialize() {
    console.log("🏊‍♂️ Initializing enemy pools...");

    // Define pool sizes for each type
    const poolSizes = {
      basic: this.poolSize,
      advanced: Math.floor(this.poolSize * 0.5),
      epic: Math.floor(this.poolSize * 0.5),
      shooter: Math.floor(this.poolSize * 0.5),
    };

    // Pre-create enemies for each type
    Object.entries(poolSizes).forEach(([type, size]) => {
      for (let i = 0; i < size; i++) {
        this._createEnemy(type);
      }
      console.log(`✅ Created pool for ${type} enemies: ${size}`);
    });
  }

  _createEnemy(type) {
    let enemy;
    const spawnPos = { x: -1000, y: -1000 }; // Off-screen position

    switch (type) {
      case "basic":
        enemy = new EnemyBasic(
          this.scene,
          spawnPos.x,
          spawnPos.y,
          ENEMY_SPRITES[Math.floor(Math.random() * ENEMY_SPRITES.length)]
        );
        break;
      case "advanced":
        enemy = new EnemyAdvanced(
          this.scene,
          spawnPos.x,
          spawnPos.y,
          ENEMY_ADVANCED_SPRITES[Math.floor(Math.random() * ENEMY_ADVANCED_SPRITES.length)]
        );
        break;
      case "epic":
        enemy = new EnemyEpic(
          this.scene,
          spawnPos.x,
          spawnPos.y,
          ENEMY_EPIC_SPRITES[Math.floor(Math.random() * ENEMY_EPIC_SPRITES.length)]
        );
        break;
      case "shooter":
        enemy = new EnemyShooter(this.scene, spawnPos.x, spawnPos.y, "enemy-shooter");
        break;
    }

    // Set initial state
    enemy.active = false;
    if (enemy.sprite) {
      enemy.sprite.setActive(false);
      enemy.sprite.setVisible(false);
    }

    this.pools[type].push(enemy);
    return enemy;
  }

  spawn(type, x, y, config = {}) {
    // Try to cleanup if needed
    const now = Date.now();
    if (now - this.lastCleanupTime > this.cleanupInterval) {
      this._cleanupInactiveEnemies();
      this.lastCleanupTime = now;
    }

    let enemy;
    const pool = this.pools[type];

    // First try to find an inactive enemy
    enemy = pool.find((e) => !e.active && !e.isDead);

    // If no inactive enemy found, try to force cleanup and search again
    if (!enemy) {
      this._cleanupInactiveEnemies();
      enemy = pool.find((e) => !e.active && !e.isDead);
    }

    // If still no enemy and we haven't hit max size, create new one
    if (!enemy && pool.length < this.maxPoolSize) {
      console.log(`🔄 Creating new ${type} enemy - pool size: ${pool.length}`);
      enemy = this._createEnemy(type);
    }

    // If we still don't have an enemy, try to recycle the oldest one
    if (!enemy) {
      enemy = pool.find(
        (e) => e.sprite && (e.sprite.x < -1000 || e.sprite.x > 4000 || e.sprite.y < -1000 || e.sprite.y > 4000)
      );
      if (enemy) {
        this.despawn(enemy);
      }
    }

    // Configure and activate the enemy if we found one
    if (enemy) {
      this._configureEnemy(enemy, type, x, y, config);
      console.log(`👾 Spawned ${type} enemy from pool (Active: ${this.activeEnemies[type].size}/${pool.length})`);
      return enemy;
    }

    console.log(`⚠️ Could not spawn ${type} enemy - no available slots`);
    return null;
  }

  _configureEnemy(enemy, type, x, y, config) {
    // Reset enemy to default state
    enemy.active = true;
    enemy.isDead = false;
    enemy.isStaggered = false;
    enemy.movementEnabled = true;

    if (enemy.sprite) {
      // Reset position and visibility
      enemy.sprite.setActive(true);
      enemy.sprite.setVisible(true);
      enemy.sprite.setPosition(x, y);

      // Reset visual effects
      enemy.sprite.setAlpha(1);
      enemy.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      enemy.sprite.clearTint();
    }
    enemy.x = x;
    enemy.y = y;

    // Apply type-specific configuration
    const baseConfig = this._getBaseConfig(type);
    const finalConfig = { ...baseConfig, ...config };

    // Reset core properties
    enemy.health = finalConfig.maxHealth;
    enemy.maxHealth = finalConfig.maxHealth;
    enemy.moveSpeed = finalConfig.moveSpeed;
    enemy.attackDamage = finalConfig.attackDamage;

    // Reset combat timers
    enemy.lastAttackTime = 0;
    enemy.lastMoveTime = 0;
    enemy.lastTrailTime = 0;

    if (enemy.sprite) {
      enemy.sprite.setScale(finalConfig.scale);
    }

    if (type === "shooter") {
      enemy.attackRange = finalConfig.attackRange;
      enemy.projectileSpeed = finalConfig.projectileSpeed;
    }

    // Cancel any existing tweens on the sprite
    if (enemy.sprite && this.scene) {
      this.scene.tweens.killTweensOf(enemy.sprite);
    }

    // Track active enemy
    this.activeEnemies[type].add(enemy);
  }

  despawn(enemy) {
    if (!enemy) return;

    // If the enemy was killed but hasn't processed death yet, call die()
    if (enemy.health <= 0 && !enemy.isDead) {
      enemy.die();
      return; // die() will call despawn again after death animation
    }

    // Reset enemy state
    enemy.isDead = false;
    enemy.active = false;
    if (enemy.sprite) {
      enemy.sprite.setActive(false);
      enemy.sprite.setVisible(false);
      enemy.sprite.setPosition(-1000, -1000);
    }

    // Remove from active enemies set
    this.activeEnemies[enemy.type].delete(enemy);
  }

  _getBaseConfig(type) {
    const waveScaling = this.scene.gameState.waveScaling;

    const configs = {
      basic: {
        maxHealth: 100 * waveScaling.healthMultiplier,
        moveSpeed: (0.5 + Math.random() * 0.6) * waveScaling.speedMultiplier,
        attackDamage: 8 * waveScaling.damageMultiplier,
        scale: 0.2 + Math.random() * 0.1,
      },
      advanced: {
        maxHealth: 300 * waveScaling.healthMultiplier,
        moveSpeed: (0.8 + Math.random() * 0.4) * waveScaling.speedMultiplier,
        attackDamage: 12 * waveScaling.damageMultiplier,
        scale: 0.6 + Math.random() * 0.35,
      },
      epic: {
        maxHealth: 600 * waveScaling.healthMultiplier,
        moveSpeed: (0.6 + Math.random() * 0.4) * waveScaling.speedMultiplier,
        attackDamage: 16 * waveScaling.damageMultiplier,
        scale: 0.6 + Math.random() * 0.35,
      },
      shooter: {
        maxHealth: 80 * waveScaling.healthMultipliear,
        moveSpeed: (0.5 + Math.random() * 0.2) * waveScaling.speedMultiplier,
        attackDamage: 10 * waveScaling.damageMultiplier,
        scale: 0.27 + Math.random() * 0.15,
        attackRange: 250 + Math.random() * 200,
        projectileSpeed: 200,
      },
    };

    return configs[type];
  }

  _cleanupInactiveEnemies() {
    if (!this.scene.player) return;

    let totalCleaned = 0;
    const playerPos = {
      x: this.scene.player.x,
      y: this.scene.player.y,
    };

    // Keep track of cleaned enemies to avoid double counting
    const cleanedEnemies = new Set();

    Object.entries(this.pools).forEach(([type, pool]) => {
      if (totalCleaned >= this.maxCleanupPerInterval) return;

      // First, clean up inactive/dead enemies
      pool.forEach((enemy) => {
        if (totalCleaned >= this.maxCleanupPerInterval || cleanedEnemies.has(enemy)) return;

        if (!enemy.active || enemy.isDead || !enemy.sprite || !enemy.sprite.active) {
          this._resetEnemy(enemy);
          cleanedEnemies.add(enemy);
          totalCleaned++;
        }
      });

      // Then clean up distant enemies
      const activeEnemies = pool.filter((enemy) => enemy.active && enemy.sprite && !cleanedEnemies.has(enemy));

      // Sort by distance and clean up furthest enemies
      const enemiesWithDistance = activeEnemies
        .map((enemy) => ({
          enemy,
          distanceSquared: Math.pow(enemy.sprite.x - playerPos.x, 2) + Math.pow(enemy.sprite.y - playerPos.y, 2),
        }))
        .sort((a, b) => b.distanceSquared - a.distanceSquared);

      for (const { enemy, distanceSquared } of enemiesWithDistance) {
        if (totalCleaned >= this.maxCleanupPerInterval || cleanedEnemies.has(enemy)) break;

        if (distanceSquared > this.cleanupThreshold * this.cleanupThreshold) {
          this._resetEnemy(enemy);
          cleanedEnemies.add(enemy);
          totalCleaned++;
        }
      }

      // Log pool status
      const activeCount = pool.filter(
        (enemy) => enemy.active && enemy.sprite && enemy.sprite.active && !cleanedEnemies.has(enemy)
      ).length;

      if (activeCount > 0) {
        console.log(`🧹 Pool ${type}: ${activeCount} active / ${pool.length} total`);
      }
    });

    if (totalCleaned > 0) {
      console.log(`♻️ Recycled ${totalCleaned} enemies`);
    }
  }

  _resetEnemy(enemy) {
    enemy.isDead = false;
    enemy.active = false;
    if (enemy.sprite) {
      enemy.sprite.setActive(false);
      enemy.sprite.setVisible(false);
      enemy.sprite.setPosition(-1000, -1000);
    }
    this.activeEnemies[enemy.type].delete(enemy);
  }

  cleanup() {
    console.log("🧹 Cleaning up enemy pools...");
    for (const type in this.pools) {
      this.pools[type].forEach((enemy) => {
        enemy.destroy();
      });
      this.pools[type] = [];
      this.activeEnemies[type].clear();
    }
  }
}

export default EnemyPool;
