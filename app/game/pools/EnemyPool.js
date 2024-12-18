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
    this.activeEnemies = new Set();
    this.poolSize = 200; // Increased initial pool size
    this.maxPoolSize = 300; // Increased maximum pool size
    this.lastCleanupTime = 0;
    this.cleanupInterval = 2000; // Cleanup more frequently (every 2 seconds)
  }

  initialize() {
    console.log("🏊‍♂️ Initializing enemy pools...");
    // Pre-create enemies for each type
    for (let i = 0; i < this.poolSize; i++) {
      this._createEnemy("basic");
      if (i < this.poolSize * 0.5) { // Create fewer of the advanced types
        this._createEnemy("advanced");
        this._createEnemy("epic");
        this._createEnemy("shooter");
      }
    }
    console.log(`✅ Pools initialized with ${this.poolSize} basic enemies and ${Math.floor(this.poolSize * 0.5)} of each advanced type`);
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
    enemy = pool.find(e => !e.active && !e.isDead);

    // If no inactive enemy found, try to force cleanup and search again
    if (!enemy) {
      this._cleanupInactiveEnemies();
      enemy = pool.find(e => !e.active && !e.isDead);
    }

    // If still no enemy and we haven't hit max size, create new one
    if (!enemy && pool.length < this.maxPoolSize) {
      console.log(`🔄 Creating new ${type} enemy - pool size: ${pool.length}`);
      enemy = this._createEnemy(type);
    }

    // If we still don't have an enemy, try to recycle the oldest one
    if (!enemy) {
      enemy = pool.find(e => 
        e.sprite && 
        (e.sprite.x < -1000 || e.sprite.x > 4000 || e.sprite.y < -1000 || e.sprite.y > 4000)
      );
      if (enemy) {
        this.despawn(enemy);
      }
    }

    // Configure and activate the enemy if we found one
    if (enemy) {
      this._configureEnemy(enemy, type, x, y, config);
      console.log(`👾 Spawned ${type} enemy from pool (Active: ${this.activeEnemies.size}/${pool.length})`);
      return enemy;
    }

    console.log(`⚠️ Could not spawn ${type} enemy - no available slots`);
    return null;
  }

  _configureEnemy(enemy, type, x, y, config) {
    // Reset enemy to default state
    enemy.active = true;
    if (enemy.sprite) {
      enemy.sprite.setActive(true);
      enemy.sprite.setVisible(true);
      enemy.sprite.setPosition(x, y);
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
    if (enemy.sprite) {
      enemy.sprite.setScale(finalConfig.scale);
    }

    if (type === "shooter") {
      enemy.attackRange = finalConfig.attackRange;
      enemy.projectileSpeed = finalConfig.projectileSpeed;
    }

    // Track active enemy
    this.activeEnemies.add(enemy);
  }

  despawn(enemy) {
    if (!enemy) return;

    // Reset enemy state
    enemy.isDead = false;
    enemy.active = false;
    if (enemy.sprite) {
      enemy.sprite.setActive(false);
      enemy.sprite.setVisible(false);
      enemy.sprite.setPosition(-1000, -1000);
    }

    // Remove from active enemies set
    this.activeEnemies.delete(enemy);
  }

  _getBaseConfig(type) {
    const waveScaling = this.scene.gameState.waveScaling;

    const configs = {
      basic: {
        maxHealth: 100 * waveScaling.healthMultiplier,
        moveSpeed: 0.4 * waveScaling.speedMultiplier,
        attackDamage: 8 * waveScaling.damageMultiplier,
        scale: 0.4,
      },
      advanced: {
        maxHealth: 300 * waveScaling.healthMultiplier,
        moveSpeed: 1.0 * waveScaling.speedMultiplier,
        attackDamage: 12 * waveScaling.damageMultiplier,
        scale: 0.5,
      },
      epic: {
        maxHealth: 600 * waveScaling.healthMultiplier,
        moveSpeed: 1.0 * waveScaling.speedMultiplier,
        attackDamage: 16 * waveScaling.damageMultiplier,
        scale: 0.6,
      },
      shooter: {
        maxHealth: 80 * waveScaling.healthMultiplier,
        moveSpeed: 1.0 * waveScaling.speedMultiplier,
        attackDamage: 10 * waveScaling.damageMultiplier,
        scale: 0.3,
        attackRange: 250,
        projectileSpeed: 200,
      },
    };

    return configs[type];
  }

  _cleanupInactiveEnemies() {
    let totalCleaned = 0;
    Object.entries(this.pools).forEach(([type, pool]) => {
      // Find enemies that can be recycled
      pool.forEach(enemy => {
        if (!enemy.active || enemy.isDead || !enemy.sprite || !enemy.sprite.active || 
            (enemy.sprite.x < -1000 || enemy.sprite.x > 4000 || enemy.sprite.y < -1000 || enemy.sprite.y > 4000)) {
          // Reset enemy state
          enemy.isDead = false;
          enemy.active = false;
          if (enemy.sprite) {
            enemy.sprite.setActive(false);
            enemy.sprite.setVisible(false);
            enemy.sprite.setPosition(-1000, -1000);
          }
          totalCleaned++;
          this.activeEnemies.delete(enemy);
        }
      });

      // Log pool status
      const activeCount = pool.filter(enemy => enemy.active && enemy.sprite && enemy.sprite.active).length;
      console.log(`🧹 Pool ${type}: ${activeCount} active / ${pool.length} total`);
    });

    if (totalCleaned > 0) {
      console.log(`♻️ Cleaned up ${totalCleaned} inactive enemies`);
    }
  }

  cleanup() {
    console.log("🧹 Cleaning up enemy pools...");
    for (const type in this.pools) {
      this.pools[type].forEach((enemy) => {
        enemy.destroy();
      });
      this.pools[type] = [];
    }
    this.activeEnemies.clear();
  }
}

export default EnemyPool;
