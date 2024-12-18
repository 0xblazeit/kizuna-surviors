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
    this.poolSize = 30; // Initial pool size per enemy type
  }

  initialize() {
    console.log("🏊‍♂️ Initializing enemy pools...");
    // Pre-create enemies for each type
    for (let i = 0; i < this.poolSize; i++) {
      this._createEnemy("basic");
      this._createEnemy("advanced");
      this._createEnemy("epic");
      this._createEnemy("shooter");
    }
    console.log(`✅ Pools initialized with ${this.poolSize} enemies per type`);
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
    let enemy;

    // Try to get an inactive enemy from the pool
    if (this.pools[type].length > 0) {
      enemy = this.pools[type].find((e) => !e.active);
    }

    // If no inactive enemy found, create a new one
    if (!enemy) {
      console.log(`🔄 Creating new ${type} enemy - pool exhausted`);
      enemy = this._createEnemy(type);
    }

    // Configure and activate the enemy
    this._configureEnemy(enemy, type, x, y, config);

    console.log(`👾 Spawned ${type} enemy from pool (Active: ${this.activeEnemies.size})`);
    return enemy;
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
    enemy.active = false;
    if (enemy.sprite) {
      enemy.sprite.setActive(false);
      enemy.sprite.setVisible(false);
      enemy.sprite.setPosition(-1000, -1000);
    }
    enemy.x = -1000;
    enemy.y = -1000;
    this.activeEnemies.delete(enemy);
    console.log(`♻️ Enemy despawned (Active: ${this.activeEnemies.size})`);
  }

  _getBaseConfig(type) {
    const waveScaling = this.scene.gameState.waveScaling;

    const configs = {
      basic: {
        maxHealth: 100 * waveScaling.healthMultiplier,
        moveSpeed: 1.8 * waveScaling.speedMultiplier,
        attackDamage: 8 * waveScaling.damageMultiplier,
        scale: 0.4,
      },
      advanced: {
        maxHealth: 300 * waveScaling.healthMultiplier,
        moveSpeed: 2.0 * waveScaling.speedMultiplier,
        attackDamage: 12 * waveScaling.damageMultiplier,
        scale: 0.5,
      },
      epic: {
        maxHealth: 600 * waveScaling.healthMultiplier,
        moveSpeed: 2.2 * waveScaling.speedMultiplier,
        attackDamage: 16 * waveScaling.damageMultiplier,
        scale: 0.6,
      },
      shooter: {
        maxHealth: 80 * waveScaling.healthMultiplier,
        moveSpeed: 1.4 * waveScaling.speedMultiplier,
        attackDamage: 10 * waveScaling.damageMultiplier,
        scale: 0.3,
        attackRange: 250,
        projectileSpeed: 200,
      },
    };

    return configs[type];
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
