"use client";

import { useEffect, useRef } from "react";
import MenuScene from "./MenuScene";
import UpgradeMenuScene from "./UpgradeMenuScene";
import MainPlayer from "../game/entities/MainPlayer";
import { RotatingDogWeapon } from "../game/entities/weapons/RotatingDogWeapon";
import { MagicWandWeapon } from "../game/entities/weapons/MagicWandWeapon";
import { GlizzyBlasterWeapon } from "../game/entities/weapons/GlizzyBlasterWeapon";
import FlyingAxeWeapon from "../game/entities/weapons/FlyingAxeWeapon";
import SonicBoomHammer from "../game/entities/weapons/SonicBoomHammer";
import { MilkWeapon } from "../game/entities/weapons/MilkWeapon";
import { AwakenWeapon } from "../game/entities/weapons/AwakenWeapon";
import ShapecraftKeyWeapon from "../game/entities/weapons/ShapecraftKeyWeapon";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import XPGem from "../game/entities/XPGem";
import Coin from "../game/entities/Coin";
import EnemyPool from "../game/pools/EnemyPool";

async function verifyAccess(walletAddress) {
  if (!walletAddress) return null;
  const response = await fetch(`/api/verify-access?wallet=${walletAddress}`);
  if (!response.ok) {
    throw new Error("Failed to verify access");
  }
  return response.json();
}

const GameScene = Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function GameScene() {
    Phaser.Scene.call(this, { key: "GameScene" });
  },

  init: function () {
    // Initialize game state
    this.gameState = {
      userAddress: this.game.config.userInfo?.userAddress,
      username: this.game.config.userInfo?.username,
      gameStarted: false,
      timerStarted: false,
      gameTimer: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      kills: 0,
      selectedWeaponIndex: 0,
      isGameOver: false,
      coins: 0,
      maxEnemies: 50, // Increased initial max enemies
      spawnRate: 2000, // Slower initial spawn rate
      minSpawnRate: 150, // Even faster minimum spawn rate
      enemyWaveTimer: 0,
      waveNumber: 1,
      difficultyMultiplier: 1,
      enemiesRemainingInWave: 20, // Track enemies remaining in wave
      baseEnemiesPerWave: 20, // Base number of enemies per wave
      waveScaling: {
        healthMultiplier: 1,
        damageMultiplier: 1,
        speedMultiplier: 1,
        spawnRateMultiplier: 1,
      },
      spawnThresholds: {
        advanced: 5,
        epic: 10,
      },
      gameStartTime: null,
      gameEndTime: null,
      finalTimeAlive: 0,
      finalTimeAliveMS: 0,
      gameDuration: 1500000, // 25 minutes in milliseconds
      isLevelCleared: false,
    };

    // Debug log initial state
    console.log("Initial game state:", {
      timerStarted: this.gameState.timerStarted,
      gameTimer: this.gameState.gameTimer,
      spawnThresholds: this.gameState.spawnThresholds,
    });

    // Bind methods to this scene
    this.gainXP = (amount) => {
      if (this.player) {
        this.player.gainXP(amount);
      }
    };

    this.updateXPBar = () => {
      const progress = this.gameState.xp / this.gameState.xpToNextLevel;
      const xpBarWidth = this.scale.width - 40;
      const fillWidth = xpBarWidth - 4;

      this.xpBarFill.clear();
      this.xpBarFill.fillStyle(0x4444ff, 0.8);
      this.xpBarFill.fillRect(22, 22, progress * fillWidth, 16);
      this.xpText.setText(`Level ${this.gameState.level} (${this.gameState.xp}/${this.gameState.xpToNextLevel} XP)`);
    };

    this.weaponInitialized = false;
    this.enemies = [];
    this.projectiles = [];
    this.coins = [];
    this.xpGems = [];
    this.score = 0;
    this.gameOver = false;

    // Initialize enemy pool
    this.enemyPool = new EnemyPool(this);
  },

  preload: function () {
    // Load coin sprite
    this.load.svg("coin", "/assets/game/powerups/coin.svg", {
      scale: 0.5,
    });

    // Load player sprite
    this.load.svg("player", "/assets/game/characters/player.svg", {
      scale: 0.15,
    });

    // Load enemy sprites
    this.load.svg("enemy-basic-one", "/assets/game/characters/enemies-basic/basic-one.svg");
    this.load.svg("enemy-basic-two", "/assets/game/characters/enemies-basic/basic-two.svg");
    this.load.svg("enemy-basic-three", "/assets/game/characters/enemies-basic/basic-three.svg");
    this.load.svg("enemy-basic-four", "/assets/game/characters/enemies-basic/basic-four.svg");
    this.load.svg("enemy-basic-five", "/assets/game/characters/enemies-basic/basic-five.svg");
    this.load.svg("enemy-basic-six", "/assets/game/characters/enemies-basic/basic-six.svg");

    // Load advanced enemy sprites
    this.load.svg("enemy-advanced-one", "/assets/game/characters/enemies-advanced/advanced-one.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-advanced-two", "/assets/game/characters/enemies-advanced/advanced-two.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-advanced-three", "/assets/game/characters/enemies-advanced/advanced-three.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-advanced-four", "/assets/game/characters/enemies-advanced/advanced-four.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-advanced-five", "/assets/game/characters/enemies-advanced/advanced-five.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-advanced-six", "/assets/game/characters/enemies-advanced/advanced-six.svg", {
      scale: 0.5,
    });

    // Load epic enemy sprites
    this.load.svg("enemy-epic-one", "/assets/game/characters/enemies-epic/epic-one.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-epic-two", "/assets/game/characters/enemies-epic/epic-two.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-epic-three", "/assets/game/characters/enemies-epic/epic-three.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-epic-four", "/assets/game/characters/enemies-epic/epic-four.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-epic-five", "/assets/game/characters/enemies-epic/epic-five.svg", {
      scale: 0.5,
    });
    this.load.svg("enemy-epic-six", "/assets/game/characters/enemies-epic/epic-six.svg", {
      scale: 0.5,
    });

    // Load special enemy sprites
    this.load.svg("enemy-shooter", "/assets/game/characters/enemies-special/enemy-shooter.svg", {
      scale: 1.4,
    });

    // Load weapon sprites
    this.load.svg("weapon-dog-projectile", "/assets/game/weapons/weapon-dog-projectile.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-wand-icon", "/assets/game/weapons/weapon-wand-icon.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-awaken", "/assets/game/weapons/weapon-awaken.svg", {
      scale: 0.2,
    });
    this.load.svg("weapon-wand-projectile", "/assets/game/weapons/weapon-wand-projectile.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-hotdog-projectile", "/assets/game/weapons/weapon-hotdog-projectile.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-axe-projectile", "/assets/game/weapons/weapon-axe-projectile.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-hammer-projectile", "/assets/game/weapons/weapon-hammer-projectile.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-magic-milk", "/assets/game/weapons/weapon-magic-milk.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-shapecraft-key", "/assets/game/weapons/weapon-shapecraft-key.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-ss-logo", "/assets/game/weapons/weapon-ss-logo.svg?v=1", {
      scale: 0.5,
    });
    this.load.svg("weapon-skull-projectile", "/assets/game/weapons/weapon-skull-projectile.svg?v=1", {
      scale: 1.2,
    });

    // Load XP gem with correct path
    this.load.image("powerup-xp-gem", "/assets/game/powerups/xp-gem.svg");
  },

  startGame: function () {
    // Initial enemy spawn for first wave
    // const initialEnemies = Math.min(10, this.gameState.baseEnemiesPerWave);
    // for (let i = 0; i < initialEnemies; i++) {
    //   const spawnPos = this.getSpawnPosition();
    //   const randomSprite = ENEMY_SPRITES[Phaser.Math.Between(0, ENEMY_SPRITES.length - 1)];

    //   const enemy = new EnemyBasic(this, spawnPos.x, spawnPos.y, randomSprite, {
    //     type: "basic",
    //     scale: 0.3,
    //     maxHealth: 100 * this.gameState.waveScaling.healthMultiplier,
    //     attackDamage: 8 * this.gameState.waveScaling.damageMultiplier,
    //     moveSpeed: 1.8 * this.gameState.waveScaling.speedMultiplier,
    //   });

    //   enemy.sprite.once("destroy", () => {
    //     const index = this.enemies.indexOf(enemy);
    //     if (index > -1) {
    //       this.enemies.splice(index, 1);
    //       this.gameState.enemiesRemainingInWave--;

    //       // Check if wave is complete AND no enemies are left
    //       if (this.gameState.enemiesRemainingInWave <= 0 && this.enemies.length === 0) {
    //         this.startNextWave();
    //       }
    //     }
    //   });

    //   this.enemies.push(enemy);
    // }

    // Start enemy spawn timer
    this.enemySpawnTimer = this.time.addEvent({
      delay: this.gameState.spawnRate,
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true,
    });

    // Initialize weapons
    this.weapons.forEach((weapon) => {
      if (weapon.initialize) {
        weapon.initialize();
      }
    });
  },

  startNextWave: function () {
    // Increment wave number
    this.gameState.waveNumber++;

    // Scale difficulty based on wave number (logarithmic scaling for better balance)
    const waveScaling = Math.log2(this.gameState.waveNumber + 1);
    this.gameState.waveScaling = {
      healthMultiplier: 1 + waveScaling * 0.5,
      damageMultiplier: 1 + waveScaling * 0.3,
      speedMultiplier: 1 + Math.min(1, waveScaling * 0.1), // Cap speed scaling
      spawnRateMultiplier: 1 + waveScaling * 0.2,
    };

    // Update spawn parameters for endless waves
    this.gameState.maxEnemies = Math.min(200, 20 + Math.floor(this.gameState.waveNumber * 3));
    this.gameState.spawnRate = Math.max(
      this.gameState.minSpawnRate,
      800 - Math.min(600, this.gameState.waveNumber * 20)
    );

    // Force cleanup of inactive enemies
    if (this.enemyPool) {
      this.enemyPool._cleanupInactiveEnemies();
    }

    // Ensure enemy spawn timer is running
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.paused = false;
      const currentWaveSpawnRate = Math.max(
        this.gameState.minSpawnRate,
        this.gameState.spawnRate * this.gameState.waveScaling.spawnRateMultiplier
      );
      this.enemySpawnTimer.reset({
        delay: currentWaveSpawnRate,
        callback: this.spawnEnemies,
        callbackScope: this,
        loop: true,
      });
    }

    // Update wave text
    if (this.waveText) {
      this.waveText.setText(`Wave: ${this.gameState.waveNumber}`);
    }

    // Create wave announcement
    this.createWaveAnnouncement();

    // Debug log
    console.log(`Starting Wave ${this.gameState.waveNumber}:`, {
      maxEnemies: this.gameState.maxEnemies,
      spawnRate: this.gameState.spawnRate,
      scaling: this.gameState.waveScaling,
    });
  },

  getSpawnPosition: function () {
    const minSpawnDistance = 500;
    const maxSpawnDistance = 800;

    // Use a dynamic angle calculation that's not tied directly to wave number
    const angle = Math.random() * Math.PI * 2;

    // Vary distance more to prevent clustering
    const distance = minSpawnDistance + (maxSpawnDistance - minSpawnDistance) * Math.pow(Math.random(), 0.7);

    // Add slight randomization to prevent enemies from spawning in exact same spots
    const randomOffset = {
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
    };

    // Calculate position relative to player with offset
    const spawnX = this.player.x + Math.cos(angle) * distance + randomOffset.x;
    const spawnY = this.player.y + Math.sin(angle) * distance + randomOffset.y;

    // Clamp to world bounds with padding
    const padding = 50;
    return {
      x: Phaser.Math.Clamp(spawnX, padding, this.physics.world.bounds.width - padding),
      y: Phaser.Math.Clamp(spawnY, padding, this.physics.world.bounds.height - padding),
    };
  },

  spawnEnemies: function () {
    // Check if we have room for more enemies
    const currentEnemyCount = this.enemies ? this.enemies.filter((e) => e && !e.isDead).length : 0;

    // Ensure we maintain a minimum number of enemies based on wave number
    const minEnemies = Math.min(20, 5 + Math.floor(this.gameState.waveNumber * 0.5));
    const shouldForceSpawn = currentEnemyCount < minEnemies;

    if (currentEnemyCount >= this.gameState.maxEnemies && !shouldForceSpawn) {
      return;
    }

    // Increase spawn count for later waves
    const maxSpawnPerTick = Math.min(5, Math.ceil(this.gameState.waveNumber * 0.4));
    const spawnCount = Math.min(
      maxSpawnPerTick,
      shouldForceSpawn ? minEnemies - currentEnemyCount : this.gameState.maxEnemies - currentEnemyCount
    );

    // Faster spawn delay in later waves
    const baseDelay = 250;
    const minDelay = 60;
    const delayReduction = Math.min(0.7, (this.gameState.waveNumber - 1) * 0.06);
    const spawnDelay = Math.max(minDelay, baseDelay * (1 - delayReduction));

    for (let i = 0; i < spawnCount; i++) {
      this.time.delayedCall(i * spawnDelay, () => {
        const spawnPos = this.getSpawnPosition();
        let enemy = null;
        const roll = Math.random();
        const wave = this.gameState.waveNumber;

        // Enhanced enemy type distribution for later waves
        if (wave <= 1) {
          enemy = this.enemyPool.spawn("basic", spawnPos.x, spawnPos.y);
        } else if (wave <= 2) {
          if (roll < 0.8) {
            enemy = this.enemyPool.spawn("basic", spawnPos.x, spawnPos.y);
          } else {
            enemy = this.enemyPool.spawn("advanced", spawnPos.x, spawnPos.y);
          }
        } else if (wave <= 6) {
          const shooterChance = Math.min(0.2, (wave - 2) * 0.06);
          if (roll < 0.45) {
            enemy = this.enemyPool.spawn("basic", spawnPos.x, spawnPos.y);
          } else if (roll < 0.8 + shooterChance) {
            enemy = this.enemyPool.spawn("advanced", spawnPos.x, spawnPos.y);
          } else {
            enemy = this.enemyPool.spawn("shooter", spawnPos.x, spawnPos.y);
          }
        } else {
          const epicChance = Math.min(0.3, 0.15 + (wave - 7) * 0.025);
          if (roll < 0.25) {
            enemy = this.enemyPool.spawn("basic", spawnPos.x, spawnPos.y);
          } else if (roll < 0.5) {
            enemy = this.enemyPool.spawn("advanced", spawnPos.x, spawnPos.y);
          } else if (roll < 0.7 + epicChance) {
            enemy = this.enemyPool.spawn("shooter", spawnPos.x, spawnPos.y);
          } else {
            enemy = this.enemyPool.spawn("epic", spawnPos.x, spawnPos.y);
          }
        }

        // Add to physics system and enemies array if spawned successfully
        if (enemy) {
          if (!enemy.body) {
            this.physics.add.existing(enemy);
          }
          this.enemies.push(enemy);
        }
      });
    }

    // Update spawn timer with dynamic rate
    if (!this.enemySpawnTimer.paused) {
      const currentWaveSpawnRate = Math.max(
        this.gameState.minSpawnRate,
        this.gameState.spawnRate * this.gameState.waveScaling.spawnRateMultiplier
      );

      this.enemySpawnTimer.reset({
        delay: currentWaveSpawnRate,
        callback: this.spawnEnemies,
        callbackScope: this,
        loop: true,
      });
    }
  },

  create: function () {
    const { width, height } = this.scale;

    // Initialize coin pool
    Coin.initializePool(this);

    // Set up enemy spawn timer
    this.enemySpawnTimer = this.time.addEvent({
      delay: this.gameState.spawnRate,
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true,
    });

    // Set world bounds (2x2 screens)
    const worldWidth = width * 2;
    const worldHeight = height * 2;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Create darker background first
    const backgroundFill = this.add.graphics();
    backgroundFill.fillStyle(0x001133, 1);
    backgroundFill.fillRect(0, 0, worldWidth, worldHeight);

    // Create grid background with brighter lines
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x4444ff, 0.3); // Brighter blue color with some transparency

    // Draw vertical lines
    const gridSize = 32;
    for (let x = 0; x <= worldWidth; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, worldHeight);
      gridGraphics.strokePath();
    }

    // Draw horizontal lines
    for (let y = 0; y <= worldHeight; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(worldWidth, y);
      gridGraphics.strokePath();
    }

    // Add world bounds visualization with dark gray color
    const bounds = this.add.graphics();
    bounds.lineStyle(6, 0x333333, 1); // Thicker, dark gray lines

    // Draw each boundary line separately to ensure visibility
    // Top
    bounds.beginPath();
    bounds.moveTo(0, 0);
    bounds.lineTo(worldWidth, 0);
    bounds.strokePath();

    // Bottom
    bounds.beginPath();
    bounds.moveTo(0, worldHeight);
    bounds.lineTo(worldWidth, worldHeight);
    bounds.strokePath();

    // Left
    bounds.beginPath();
    bounds.moveTo(0, 0);
    bounds.lineTo(0, worldHeight);
    bounds.strokePath();

    // Right
    bounds.beginPath();
    bounds.moveTo(worldWidth, 0);
    bounds.lineTo(worldWidth, worldHeight);
    bounds.strokePath();

    // Create UI Container that stays fixed to camera
    const uiContainer = this.add.container(0, 0);
    uiContainer.setScrollFactor(0);
    uiContainer.setDepth(1000); // Ensure UI is always on top

    // XP Progress Bar (at top of screen)
    const xpBarWidth = width - 40; // 20px padding on each side
    const xpBarHeight = 20;
    const xpBarY = 20;

    // XP Bar background
    const xpBarBg = this.add.rectangle(20, xpBarY, xpBarWidth, xpBarHeight, 0x000000);
    xpBarBg.setOrigin(0, 0);
    xpBarBg.setStrokeStyle(2, 0x666666);
    uiContainer.add(xpBarBg);

    // XP Bar fill using graphics
    this.xpBarFill = this.add.graphics();
    uiContainer.add(this.xpBarFill);

    // XP Text
    this.xpText = this.add
      .text(width / 2, xpBarY + xpBarHeight / 2, "", {
        fontFamily: "VT323",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);
    uiContainer.add(this.xpText);

    // Initialize XP bar display
    this.updateXPBar();

    // Timer position (moved up, 15px below XP bar)
    const timerY = xpBarY + xpBarHeight + 15;
    this.timerText = this.add
      .text(width / 2, timerY, "00:00", {
        fontFamily: "VT323",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);
    uiContainer.add(this.timerText);

    // Create main UI row (adjusted padding below timer)
    const uiRowY = timerY + 40;

    // 1. Weapon/Upgrade Grid (Left with more padding)
    const gridCellSize = 40;
    const gridRows = 2;
    const gridCols = 6;
    const gridWidth = gridCellSize * gridCols;
    const gridHeight = gridCellSize * gridRows;
    const gridX = 40; // Increased from 20 to 40 for more left padding

    // Create grid container to hold all grid elements
    const gridContainer = this.add.container(0, 0);
    uiContainer.add(gridContainer);

    // Helper function to create and scale weapon icons
    const createWeaponIcon = (x, y, texture, cellIndex, cells) => {
      const padding = 8;
      const maxDimension = gridCellSize - padding;
      const icon = this.add.image(x, y, texture);
      const scale = maxDimension / Math.max(icon.width, icon.height);
      icon.setScale(scale);
      cells[cellIndex].icon = icon;
      gridContainer.add(icon);
      return icon;
    };

    // Create grid cells and store them in an array
    const gridCells = [];
    let weaponIcon = null; // Store icon reference
    let wandIcon = null; // Store wand icon reference
    let glizzyIcon = null; // Store glizzy icon reference
    let axeIcon = null; // Store axe icon reference
    let hammerIcon = null; // Store hammer icon reference
    let milkIcon = null; // Store milk icon reference
    let shapecraftIcon = null; // Store shapecraft icon reference
    let awakeIcon = null; // Store awake icon reference

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellIndex = row * gridCols + col;
        const cell = this.add.rectangle(
          gridX + col * gridCellSize,
          uiRowY + row * gridCellSize,
          gridCellSize - 4,
          gridCellSize - 4,
          0x333333
        );
        cell.setStrokeStyle(2, 0x666666);
        cell.setInteractive({ useHandCursor: true });
        gridContainer.add(cell);
        gridCells.push({ cell, icon: null });

        // Add weapon icons based on index
        switch (cellIndex) {
          case 0:
            weaponIcon = createWeaponIcon(
              gridX + col * gridCellSize,
              uiRowY + row * gridCellSize,
              "weapon-dog-projectile",
              cellIndex,
              gridCells
            );
            break;
          case 1:
            wandIcon = createWeaponIcon(
              gridX + col * gridCellSize,
              uiRowY + row * gridCellSize,
              "weapon-wand-icon",
              cellIndex,
              gridCells
            );
            break;
          case 2:
            glizzyIcon = createWeaponIcon(
              gridX + col * gridCellSize,
              uiRowY + row * gridCellSize,
              "weapon-hotdog-projectile",
              cellIndex,
              gridCells
            );
            break;
          case 3:
            axeIcon = createWeaponIcon(
              gridX + col * gridCellSize,
              uiRowY + row * gridCellSize,
              "weapon-axe-projectile",
              cellIndex,
              gridCells
            );
            break;
          case 4:
            hammerIcon = createWeaponIcon(
              gridX + col * gridCellSize,
              uiRowY + row * gridCellSize,
              "weapon-hammer-projectile",
              cellIndex,
              gridCells
            );
            break;
          case 5:
            milkIcon = createWeaponIcon(
              gridX + col * gridCellSize,
              uiRowY + row * gridCellSize,
              "weapon-magic-milk",
              cellIndex,
              gridCells
            );
            break;
          case 6:
            // Only add Shapecraft weapon if user has access
            if (this.userInfo.isShapeCraftKeyHolder) {
              shapecraftIcon = createWeaponIcon(
                gridX + col * gridCellSize,
                uiRowY + row * gridCellSize,
                "weapon-shapecraft-key",
                cellIndex,
                gridCells
              );
            }
            break;
          case 7:
            // Only add Awaken weapon if user has access
            if (this.userInfo.isAwakenEyeHolder) {
              awakeIcon = createWeaponIcon(
                gridX + col * gridCellSize,
                uiRowY + row * gridCellSize,
                "weapon-awaken",
                cellIndex,
                gridCells
              );
            }
            break;
        }
      }
    }

    // 2. Stats (Right)
    const statsX = width - 20; // 20px from right edge
    this.goldText = this.add
      .text(statsX, uiRowY + 10, "Gold: 0", {
        fontFamily: "VT323",
        fontSize: "24px",
        color: "#ffdd00",
      })
      .setOrigin(1, 0);
    uiContainer.add(this.goldText);

    this.killsText = this.add
      .text(statsX, uiRowY + 40, "Kills: 0", {
        fontFamily: "VT323",
        fontSize: "24px",
        color: "#ff4444",
      })
      .setOrigin(1, 0);
    uiContainer.add(this.killsText);

    // Add wave tracker
    this.waveText = this.add
      .text(statsX, uiRowY + 70, "Wave: 1", {
        fontFamily: "VT323",
        fontSize: "24px",
        color: "#4444ff",
      })
      .setOrigin(1, 0);
    uiContainer.add(this.waveText);

    // Controls text (right side, adjusted spacing)
    const controlsText = this.add
      .text(statsX, uiRowY + 110, "ESC - Back to Menu", {
        fontFamily: "VT323",
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(1, 0);
    uiContainer.add(controlsText);

    const controlsText2 = this.add
      .text(statsX, uiRowY + 134, "Move: Arrow Keys / WASD", {
        fontFamily: "VT323",
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(1, 0);
    uiContainer.add(controlsText2);

    // Stats display (adjusted spacing)
    const statsStyle = {
      fontFamily: "VT323",
      fontSize: "20px",
      color: "#4444ff",
    };

    // Add header for stats
    const statsHeader = this.add
      .text(statsX, uiRowY + 174, "--- Player Stats ---", {
        ...statsStyle,
        color: "#ffffff",
      })
      .setOrigin(1, 0);
    uiContainer.add(statsHeader);

    // Create stats text objects (adjusted spacing)
    this.statsTexts = {
      health: this.add.text(statsX, uiRowY + 200, "", statsStyle).setOrigin(1, 0),
      attack: this.add.text(statsX, uiRowY + 222, "", statsStyle).setOrigin(1, 0),
      defense: this.add.text(statsX, uiRowY + 244, "", statsStyle).setOrigin(1, 0),
      speed: this.add.text(statsX, uiRowY + 266, "", statsStyle).setOrigin(1, 0),
      // Add leaderboard section
      leaderboardHeader: this.add
        .text(statsX, uiRowY + 306, "--- Leaderboard ---", {
          ...statsStyle,
          color: "#ffffff",
        })
        .setOrigin(1, 0),
      leaderboardColumns: this.add
        .text(statsX, uiRowY + 332, "Rank    Gold    Kills", {
          ...statsStyle,
          color: "#ffff00",
        })
        .setOrigin(1, 0),
      leaderboardEntries: Array(5)
        .fill(null)
        .map((_, i) => this.add.text(statsX, uiRowY + 354 + i * 22, "", statsStyle).setOrigin(1, 0)),
    };
    uiContainer.add(Object.values(this.statsTexts).flat());

    // Function to update stats display
    this.updateStatsDisplay = () => {
      if (!this.player) return;

      const stats = this.player.stats;
      const selectedWeapon = this.weapons[this.gameState.selectedWeaponIndex];

      // Base stats
      let displayStats = {
        health: `HP: ${stats.currentHealth}/${stats.maxHealth}`,
        attack: `ATK: ${stats.damage.toFixed(1)}`,
        defense: `DEF: ${stats.defense.toFixed(1)}`,
        speed: `SPD: ${stats.moveSpeed.toFixed(1)}`,
      };

      // Add weapon-specific stats if a weapon is selected
      if (selectedWeapon) {
        if (selectedWeapon.stats) {
          const weaponStats = selectedWeapon.stats;
          const levelConfig = selectedWeapon.levelConfigs
            ? selectedWeapon.levelConfigs[selectedWeapon.currentLevel]
            : null;

          // Use level-specific stats if available, otherwise use base stats
          const currentDamage = levelConfig ? levelConfig.damage : weaponStats.damage;
          const currentPierce = levelConfig ? levelConfig.pierce : weaponStats.pierce;
          const currentCooldown = levelConfig ? levelConfig.cooldown : weaponStats.cooldown;

          displayStats.attack = `ATK: ${(stats.damage + currentDamage).toFixed(1)}`;
          displayStats.attack += ` Pierce: ${currentPierce}`;
          if (currentCooldown) {
            displayStats.attack += ` (${(1000 / currentCooldown).toFixed(1)}/s)`;
          }

          // Add additional weapon stats if available
          if (weaponStats.criticalChance) {
            displayStats.attack += ` Crit: ${(weaponStats.criticalChance * 100).toFixed(0)}%`;
          }
        }
      }

      // Update the display
      this.statsTexts.health.setText(displayStats.health);
      this.statsTexts.attack.setText(displayStats.attack);
      this.statsTexts.defense.setText(displayStats.defense);
      this.statsTexts.speed.setText(displayStats.speed);
    };

    // Fetch and display leaderboard data
    fetch("/api/game-results")
      .then((response) => response.json())
      .then((data) => {
        if (this.statsTexts && this.statsTexts.leaderboardEntries) {
          data.data.forEach((entry, index) => {
            if (index < 5 && this.statsTexts.leaderboardEntries[index]) {
              // Format each entry with proper spacing for columns
              const rank = `#${index + 1}`.padEnd(8);
              const gold = `${entry.gold}`.padEnd(9);
              const kills = `${entry.kills}`;
              this.statsTexts.leaderboardEntries[index].setText(`${rank}${gold}${kills}`);
            }
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching leaderboard:", error);
        // Set default values for leaderboard entries if there's an error
        if (this.statsTexts && this.statsTexts.leaderboardEntries) {
          this.statsTexts.leaderboardEntries.forEach((entry, index) => {
            if (entry) {
              entry.setText(`#${index + 1}`.padEnd(8) + "0".padEnd(9) + "0");
            }
          });
        }
      });

    // Create trail effect container
    this.trailContainer = this.add.container(0, 0);

    // Create player with physics and pass trail container
    this.player = new MainPlayer(this, width / 2, height / 2, "player", {
      trailContainer: this.trailContainer,
      scale: 1,
      spriteKey: "player",
    });

    // Initialize XP gems array
    this.xpGems = [];

    // Spawn initial XP gems randomly across the map
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(50, worldWidth - 50); // 50px padding from edges
      const y = Phaser.Math.Between(50, worldHeight - 50);
      const gem = new XPGem(this, x, y);
      this.xpGems.push(gem);
    }

    // Initialize coin pool before spawning coins
    Coin.pool = []; // Reset the pool before initializing
    Coin.initializePool(this);
    console.log("Coin pool initialized, size:", Coin.pool.length);

    // Then spawn initial coins
    console.log("Starting to spawn initial coins...");
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, worldWidth - 50);
      const y = Phaser.Math.Between(50, worldHeight - 50);

      // Randomly choose coin value from tiers
      const tiers = Object.values(Coin.VALUE_TIERS);
      const randomTier = tiers[Math.floor(Math.random() * tiers.length)];

      // Spawn consolidated coins at random positions
      Coin.spawnConsolidated(this, x, y, randomTier);
    }

    // After spawning coins
    console.log("Active coins in pool:", Coin.pool.filter((coin) => coin.isActive).length);

    // Listen for player death event
    this.events.on("playerDeath", () => {
      this.showWastedScreen();
    });

    // Initialize weapon system - this is needed for selectable weapons grid
    console.log("Initializing weapon system...");
    this.weapons = [
      new RotatingDogWeapon(this, this.player),
      new MagicWandWeapon(this, this.player),
      new GlizzyBlasterWeapon(this, this.player),
      new FlyingAxeWeapon(this, this.player),
      new SonicBoomHammer(this, this.player),
      new MilkWeapon(this, this.player),
    ];

    // Add Awaken weapon only if user has access
    if (this.userInfo.isAwakenEyeHolder) {
      this.weapons.push(new AwakenWeapon(this, this.player));
    }

    // Add Shapecraft weapon only if user has access
    if (this.userInfo.isShapeCraftKeyHolder) {
      this.weapons.push(new ShapecraftKeyWeapon(this, this.player));
    }

    this.weaponInitialized = true;
    console.log(
      "Weapon system initialized with weapons:",
      this.weapons.map((w) => w.constructor.name)
    );

    // Initialize enemy pool after scene is created
    this.enemyPool.initialize();
    console.log("🎯 Enemy pool initialized");

    // Create start game overlay with retro style
    const overlayConfig = {
      fontFamily: "VT323",
      fontSize: "32px",
      color: "#ffffff",
      padding: { x: 20, y: 10 },
      align: "center",
    };

    const objectivesConfig = {
      fontFamily: "VT323",
      fontSize: "24px",
      color: "#00ff00",
      padding: { x: 20, y: 5 },
      align: "left",
    };

    const controlsConfig = {
      fontFamily: "VT323",
      fontSize: "20px",
      color: "#ffff00",
      padding: { x: 20, y: 5 },
      align: "center",
    };

    // Create semi-transparent background
    this.startOverlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      500,
      400,
      0x000000,
      0.85
    );
    this.startOverlay.setScrollFactor(0).setDepth(9999);

    // Add decorative border
    this.overlayBorder = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      508,
      408,
      0x00ff00,
      1
    );
    this.overlayBorder.setScrollFactor(0).setDepth(9998);

    // Create text elements
    const centerX = this.cameras.main.centerX;
    const startY = this.cameras.main.centerY - 150;

    this.startText = this.add
      .text(centerX, startY, "SHAPECRAFT SURVIVORS", overlayConfig)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    // Add welcome message with user info
    const welcomeConfig = {
      ...overlayConfig,
      fontSize: "20px",
      color: "#88ff88",
    };

    const addressText = this.userInfo?.userAddress
      ? `${this.userInfo.userAddress.slice(0, 6)}...${this.userInfo.userAddress.slice(-4)}`
      : "";
    const welcomeText = `Welcome, ${this.userInfo?.username || addressText || "Player"}!`;

    this.welcomeText = this.add
      .text(centerX, startY + 40, welcomeText, welcomeConfig)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    if (addressText) {
      this.addressText = this.add
        .text(centerX, startY + 60, addressText, { ...welcomeConfig, fontSize: "16px", color: "#66ccff" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10000);
    }

    // Add pixel-style bullet points
    const bulletPoints = ["► Survive the Horde", "► Gain XP", "► Collect Gold", "► In Game Boost"];

    this.objectiveTexts = bulletPoints.map((text, index) => {
      const textObj = this.add
        .text(centerX - 150, startY + 80 + index * 40, text, {
          fontFamily: "VT323",
          fontSize: "20px",
          fill: "#33ff33",
        })
        .setScrollFactor(0)
        .setDepth(10000);

      // Add XP gem sprite next to "Gain XP" text
      if (text === "► Gain XP") {
        const textWidth = textObj.width;
        const xpGem = this.add
          .image(centerX - 150 + textWidth + 20, startY + 80 + index * 40 + 10, "powerup-xp-gem")
          .setScale(0.15)
          .setScrollFactor(0)
          .setDepth(10000);

        // Add to cleanup array
        this.overlayElements = this.overlayElements || [];
        this.overlayElements.push(xpGem);
      }

      // Add coin sprite next to "Collect Gold" text
      if (text === "► Collect Gold") {
        const textWidth = textObj.width;
        const coin = this.add
          .image(centerX - 150 + textWidth + 20, startY + 80 + index * 40 + 10, "coin")
          .setScale(0.15)
          .setScrollFactor(0)
          .setDepth(10000);

        // Add to cleanup array
        this.overlayElements = this.overlayElements || [];
        this.overlayElements.push(coin);
      }

      // Add shapecraft key sprite next to "In Game Boost" text
      if (text === "► In Game Boost") {
        const textWidth = textObj.width;

        // Check if any boosts are active
        const hasAnyBoost =
          this.userInfo.isShapeCraftKeyHolder || this.userInfo.isAwakenEyeHolder || this.userInfo.isSSGHolder;

        if (!hasAnyBoost) {
          // Show [NONE] if no boosts are active
          const noneText = this.add
            .text(centerX - 150 + textWidth + 10, startY + 80 + index * 40, "[NONE]", {
              fontFamily: "VT323",
              fontSize: "24px",
              color: "#666666",
            })
            .setScrollFactor(0)
            .setDepth(10000);

          // Add to cleanup array
          this.overlayElements = this.overlayElements || [];
          this.overlayElements.push(noneText);
        } else {
          // Add icons for active boosts
          let iconOffset = 0;

          if (this.userInfo.isShapeCraftKeyHolder) {
            const key = this.add
              .image(
                centerX - 150 + textWidth + 20 + iconOffset,
                startY + 80 + index * 40 + 10,
                "weapon-shapecraft-key"
              )
              .setScale(0.15)
              .setScrollFactor(0)
              .setDepth(10000);
            iconOffset += 30;
            this.overlayElements = this.overlayElements || [];
            this.overlayElements.push(key);
          }

          if (this.userInfo.isAwakenEyeHolder) {
            const awaken = this.add
              .image(centerX - 150 + textWidth + 20 + iconOffset, startY + 80 + index * 40 + 10, "weapon-awaken")
              .setScale(0.15)
              .setScrollFactor(0)
              .setDepth(10000);
            iconOffset += 30;
            this.overlayElements = this.overlayElements || [];
            this.overlayElements.push(awaken);
          }

          if (this.userInfo.isSSGHolder) {
            const ssg = this.add
              .image(centerX - 150 + textWidth + 20 + iconOffset, startY + 80 + index * 40 + 10, "weapon-ss-logo")
              .setScale(0.15)
              .setScrollFactor(0)
              .setDepth(10000);
            this.overlayElements = this.overlayElements || [];
            this.overlayElements.push(ssg);
          }
        }
      }

      // Add to cleanup array
      this.overlayElements = this.overlayElements || [];
      this.overlayElements.push(textObj);

      return textObj;
    });

    // Add separator line
    this.separator = this.add
      .rectangle(centerX, startY + 280, 400, 2, 0x00ff00, 1)
      .setScrollFactor(0)
      .setDepth(10000);

    // Add controls text
    this.controlsText = this.add
      .text(centerX, startY + 260, "CONTROLS\nARROW KEYS / WASD", controlsConfig)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    // Add blinking "Press to Start" text
    this.pressStartText = this.add
      .text(centerX, startY + 340, "- PRESS TO START -", { ...overlayConfig, fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    // Add blinking animation
    this.tweens.add({
      targets: this.pressStartText,
      alpha: 0,
      duration: 1750,
      ease: "Power1",
      yoyo: true,
      repeat: -1,
    });

    // Add all elements to UI container
    uiContainer.add([
      this.overlayBorder,
      this.startOverlay,
      this.startText,
      ...this.objectiveTexts,
      this.separator,
      this.controlsText,
      this.pressStartText,
    ]);

    // Setup input handler for game start
    const startGameHandler = () => {
      if (this.startOverlay) {
        this.tweens.add({
          targets: [
            this.overlayBorder,
            this.startOverlay,
            this.startText,
            ...this.objectiveTexts,
            this.separator,
            this.controlsText,
            this.pressStartText,
            ...(this.overlayElements || []),
          ],
          alpha: 0,
          duration: 500,
          ease: "Power2",
          onComplete: () => {
            // Clean up all overlay elements
            [
              this.overlayBorder,
              this.startOverlay,
              this.startText,
              ...this.objectiveTexts,
              this.separator,
              this.controlsText,
              this.pressStartText,
              ...(this.overlayElements || []),
            ].forEach((element) => element.destroy());
          },
        });
      }
    };

    // Add to cleanup array
    this.overlayElements = this.overlayElements || [];
    this.overlayElements.push(this.welcomeText);
    if (this.addressText) {
      this.overlayElements.push(this.addressText);
    }

    // Listen for any movement key press
    const keys = ["W", "A", "S", "D", "UP", "DOWN", "LEFT", "RIGHT"];
    keys.forEach((key) => {
      this.input.keyboard.once(`keydown-${key}`, startGameHandler);
    });

    // Create array to store enemies
    this.enemies = [];

    // Initialize weapons array but don't start them yet
    this.weapons = [
      new RotatingDogWeapon(this, this.player),
      new MagicWandWeapon(this, this.player),
      new GlizzyBlasterWeapon(this, this.player),
      new FlyingAxeWeapon(this, this.player),
      new SonicBoomHammer(this, this.player),
      new MilkWeapon(this, this.player),
    ];

    // Add Awaken weapon only if user has access
    if (this.userInfo.isAwakenEyeHolder) {
      this.weapons.push(new AwakenWeapon(this, this.player));
    }

    // Add Shapecraft weapon only if user has access
    if (this.userInfo.isShapeCraftKeyHolder) {
      this.weapons.push(new ShapecraftKeyWeapon(this, this.player));
    }

    // Create enemy spawn timer with simpler configuration
    // this.enemySpawnTimer = this.time.addEvent({
    //   delay: this.gameState.spawnRate,
    //   callback: () => {
    //     // Simple spawn check
    //     if (this.enemies.length < this.gameState.maxEnemies) {
    //       const spawnPos = this.getSpawnPosition();

    //       // Always spawn at least one type of enemy
    //       let enemy;
    //       const roll = Math.random();

    //       if (roll < 0.4) {
    //         enemy = this.enemyPool.spawn("basic", spawnPos.x, spawnPos.y);
    //       } else if (roll < 0.7) {
    //         enemy = this.enemyPool.spawn("advanced", spawnPos.x, spawnPos.y);
    //       } else if (roll < 0.9) {
    //         enemy = this.enemyPool.spawn("shooter", spawnPos.x, spawnPos.y);
    //       } else {
    //         enemy = this.enemyPool.spawn("epic", spawnPos.x, spawnPos.y);
    //       }

    //       // Add to physics system and enemies array if spawned successfully
    //       if (enemy) {
    //         if (!enemy.body) {
    //           this.physics.add.existing(enemy);
    //         }
    //         this.enemies.push(enemy);
    //       }
    //     }
    //   },
    //   callbackScope: this,
    //   loop: true,
    // });

    // Modify wave management
    this.time.addEvent({
      delay: 60000, // Check every minute
      callback: () => {
        this.gameState.waveNumber++;

        // Improved wave scaling for better progression
        const waveScaling = Math.log2(this.gameState.waveNumber + 1);
        this.gameState.waveScaling = {
          healthMultiplier: 1 + waveScaling * 0.4,
          damageMultiplier: 1 + waveScaling * 0.25,
          speedMultiplier: 1 + Math.min(0.8, waveScaling * 0.08),
          spawnRateMultiplier: 1 + Math.min(1.5, waveScaling * 0.15),
        };

        // Increase max enemies more aggressively for later waves
        this.gameState.maxEnemies = Math.min(250, 25 + Math.floor(this.gameState.waveNumber * 4));

        // Adjust spawn rate to be faster in later waves
        this.gameState.spawnRate = Math.max(
          this.gameState.minSpawnRate,
          700 - Math.min(500, this.gameState.waveNumber * 25)
        );

        // Force cleanup of inactive enemies
        if (this.enemyPool) {
          this.enemyPool._cleanupInactiveEnemies();
        }

        // Ensure enemy spawn timer is running
        if (this.enemySpawnTimer) {
          this.enemySpawnTimer.paused = false;
          const currentWaveSpawnRate = Math.max(
            this.gameState.minSpawnRate,
            this.gameState.spawnRate * this.gameState.waveScaling.spawnRateMultiplier
          );
          this.enemySpawnTimer.reset({
            delay: currentWaveSpawnRate,
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true,
          });
        }

        // Update wave text
        if (this.waveText) {
          this.waveText.setText(`Wave: ${this.gameState.waveNumber}`);
        }

        // Create wave announcement
        this.createWaveAnnouncement();

        // Debug log
        console.log(`Starting Wave ${this.gameState.waveNumber}:`, {
          maxEnemies: this.gameState.maxEnemies,
          spawnRate: this.gameState.spawnRate,
          scaling: this.gameState.waveScaling,
        });
      },
      callbackScope: this,
      loop: true,
    });

    // Listen for player death event
    this.events.on("playerDeath", () => {
      this.showWastedScreen();
    });

    // Function to show damage numbers
    this.showDamageNumber = (x, y, amount) => {
      const damageText = this.add
        .text(x, y, amount, {
          fontFamily: "VT323",
          fontSize: "24px",
          color: "#ff4444",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5, 0.5);

      // Animate the damage number
      this.tweens.add({
        targets: damageText,
        y: y - 50, // Float upward
        alpha: 0, // Fade out
        duration: 1000,
        ease: "Cubic.out",
        onComplete: () => {
          damageText.destroy();
        },
      });
    };

    // Listen for XP events
    this.events.on("playerXPGained", (data) => {
      this.gameState.xp = data.current;
      this.gameState.level = data.level;
      this.gameState.xpToNextLevel = data.toNext;
      this.updateXPBar();
    });

    // Add spacebar XP debug handler
    // this.input.keyboard.addKey("SPACE").on(
    //   "down",
    //   () => {
    //     this.gainXP(400);
    //   },
    //   this
    // );

    // Setup camera to follow player
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(0.9);

    // Initialize stats display
    this.updateStatsDisplay();

    // Setup keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Handle ESC key
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("MenuScene");
    });

    // Create WASTED overlay container (hidden by default)
    this.wastedOverlay = this.add.container(0, 0);
    this.wastedOverlay.setDepth(1000); // Ensure it's above everything
    this.wastedOverlay.setScrollFactor(0); // Fix entire container to camera

    // Black overlay with fade (make it cover the entire game world)
    const blackOverlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000
    );
    blackOverlay.setAlpha(0);
    this.wastedOverlay.add(blackOverlay);

    // WASTED text (positioned at camera center)
    const wastedText = this.add.text(this.scale.width / 2, this.scale.height / 2, "WASTED", {
      fontFamily: "Arial Black",
      fontSize: "128px",
      color: "#FF0000",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });
    wastedText.setOrigin(0.5);
    wastedText.setAlpha(0);
    this.wastedOverlay.add(wastedText);

    // Hide overlay initially
    this.wastedOverlay.setVisible(false);

    // Create function to show WASTED screen
    this.showWastedScreen = async () => {
      if (this.gameState.isGameOver) {
        console.log("Game already over, preventing duplicate call");
        return;
      }

      this.gameState.isGameOver = true;
      console.log("Setting game over state");

      try {
        const accessToken = await this.userInfo.getAccessToken();
        console.log("Got fresh access token");

        // Prepare stats for display
        const gameStats = {
          gold: this.gameState.gold,
          kills: this.gameState.kills,
          waveNumber: this.gameState.waveNumber,
          timeAlive: this.gameState.finalTimeAlive || (Date.now() - this.gameState.gameStartTime) / 1000,
          timeAliveMS: this.gameState.finalTimeAliveMS,
        };

        const response = await fetch("/api/game-over", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...gameStats,
            timestamp: new Date().toISOString(),
            userAddress: this.userInfo.userAddress,
            username: this.userInfo.username,
            profileImage: this.userInfo.profileImage,
          }),
        });

        const data = await response.json();
        console.log("Game over API call completed successfully:", data);

        if (this.userInfo.invalidateQueries) {
          this.userInfo.invalidateQueries();
        }

        // Show the WASTED overlay
        this.wastedOverlay.setVisible(true);

        // Add visual feedback with animations
        this.tweens.add({
          targets: [this.wastedOverlay.getAt(0)],
          alpha: 0.8,
          duration: 1000,
          ease: "Power2",
        });

        // WASTED text with retro effect
        const wastedText = this.add
          .text(this.scale.width / 2, this.scale.height * 0.3, "WASTED", {
            fontFamily: "VT323",
            fontSize: "128px",
            color: "#ff0000",
            stroke: "#000000",
            strokeThickness: 8,
            shadow: { color: "#000000", fill: true, offsetX: 2, offsetY: 2, blur: 8 },
          })
          .setOrigin(0.5)
          .setAlpha(0);
        this.wastedOverlay.add(wastedText);

        // Stats display with retro style
        const formatTime = (ms) => {
          const seconds = Math.floor(ms / 1000);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
        };

        const statsStyle = {
          fontFamily: "VT323",
          fontSize: "32px",
          color: "#00ff00",
          stroke: "#003300",
          strokeThickness: 2,
          shadow: { color: "#000000", fill: true, offsetX: 1, offsetY: 1, blur: 2 },
        };

        const statsTexts = [
          `GOLD COLLECTED: ${gameStats.gold}`,
          `ENEMIES SLAIN: ${gameStats.kills}`,
          `WAVE REACHED: ${gameStats.waveNumber}`,
          `TIME SURVIVED: ${formatTime(gameStats.timeAliveMS)}`,
        ];

        const statsY = this.scale.height * 0.45;
        const statsSpacing = 40;

        const statElements = statsTexts.map((text, index) => {
          const statText = this.add
            .text(this.scale.width / 2, statsY + index * statsSpacing, text, statsStyle)
            .setOrigin(0.5)
            .setAlpha(0);
          this.wastedOverlay.add(statText);
          return statText;
        });

        // Animate WASTED text
        this.tweens.add({
          targets: wastedText,
          alpha: 1,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 1000,
          ease: "Power2",
        });

        // Animate stats with cascade effect
        statElements.forEach((statText, index) => {
          this.tweens.add({
            targets: statText,
            alpha: 1,
            x: this.scale.width / 2,
            duration: 500,
            delay: 1000 + index * 200,
            ease: "Power2",
          });
        });

        // Add "Press any key to continue" text (initially invisible)
        const continueText = this.add
          .text(this.scale.width / 2, this.scale.height * 0.8, "Press any movement key to continue", {
            fontFamily: "VT323",
            fontSize: "32px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            shadow: { color: "#000000", fill: true, offsetX: 1, offsetY: 1, blur: 2 },
          })
          .setOrigin(0.5)
          .setAlpha(0);
        this.wastedOverlay.add(continueText);

        // Delay before showing continue text and enabling input
        this.time.delayedCall(2000, () => {
          // First fade in the continue text
          this.tweens.add({
            targets: continueText,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            onComplete: () => {
              // Start blinking animation
              this.tweens.add({
                targets: continueText,
                alpha: 0.3,
                duration: 1000,
                ease: "Power2",
                yoyo: true,
                repeat: -1,
              });

              // Add another delay before enabling input
              this.time.delayedCall(2000, () => {
                const handleInput = (event) => {
                  // Check for both WASD and arrow keys
                  const validKeys = [
                    "W",
                    "A",
                    "S",
                    "D", // WASD keys
                    "UP",
                    "DOWN",
                    "LEFT",
                    "RIGHT", // Arrow keys as strings
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight", // Alternative arrow key names
                  ];

                  if (validKeys.includes(event.key.toUpperCase()) || validKeys.includes(event.key)) {
                    this.input.keyboard.off("keydown", handleInput);
                    this.scene.start("GameScene");
                  }
                };

                // Only add the input listener after both delays
                this.input.keyboard.on("keydown", handleInput);
                console.log("Input handler enabled");
              });
            },
          });
        });
      } catch (error) {
        console.error("Error in showWastedScreen:", error);
        this.gameState.isGameOver = true;
      }
    };

    // Listen for player death event
    this.events.on("playerDeath", () => {
      this.showWastedScreen();
    });

    // Add event listener for weapon upgrade menu
    this.events.on("showWeaponUpgradeMenu", () => {
      console.log(this.weapons);

      // Filter out weapons at max level (level 8) and select from remaining weapons
      const availableWeapons = this.weapons.filter((weapon) => weapon.currentLevel < 8);
      const selectedWeapons = [];

      // Select up to 3 weapons from available ones
      for (let i = 0; i < 3 && availableWeapons.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableWeapons.length);
        selectedWeapons.push(availableWeapons.splice(randomIndex, 1)[0]);
      }

      console.log("postfilter: ", selectedWeapons);

      // Launch the upgrade menu scene
      this.scene.pause();
      this.scene.launch("UpgradeMenu", {
        parentScene: this,
        selectedWeapons: selectedWeapons,
      });
    });

    // Create new timer with millisecond precision
    this.timerEvent = this.time.addEvent({
      delay: 16,
      callback: () => {
        if (this.gameState.gameStartTime && !this.gameState.gameEndTime) {
          const currentTime = Date.now();
          const elapsedMS = currentTime - this.gameState.gameStartTime;
          this.gameState.gameTimer = Math.floor(elapsedMS / 1000);
          this.gameState.finalTimeAliveMS = elapsedMS;

          // Check if time limit is reached
          if (elapsedMS >= this.gameState.gameDuration && !this.gameState.isLevelCleared) {
            console.log("Time limit reached! Showing level cleared screen...");
            this.showLevelClearedScreen();
          }

          // Update timer display
          const minutes = Math.floor(this.gameState.gameTimer / 60);
          const seconds = Math.floor(this.gameState.gameTimer % 60);
          const ms = Math.floor((elapsedMS % 1000) / 10);
          this.timerText.setText(
            `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms
              .toString()
              .padStart(2, "0")}`
          );
        }
      },
      callbackScope: this,
      loop: true,
    });

    // Modify player damage handling for precise timing
    if (this.player) {
      const originalTakeDamage = this.player.takeDamage;
      this.player.takeDamage = (amount) => {
        originalTakeDamage.call(this.player, amount);

        if (this.player.stats.currentHealth <= 0 && !this.gameState.gameEndTime) {
          // Set game end time and calculate final stats
          this.gameState.gameEndTime = Date.now();
          const elapsedMS = this.gameState.gameEndTime - this.gameState.gameStartTime;
          this.gameState.finalTimeAliveMS = elapsedMS;
          this.gameState.finalTimeAlive = elapsedMS / 1000;

          // Set game over state immediately to prevent other screens
          this.gameState.isGameOver = true;

          // Stop all game processes
          if (this.enemySpawnTimer) {
            this.enemySpawnTimer.remove();
          }
          if (this.gameTimer) {
            this.gameTimer.remove();
          }

          // Stop all enemy movement
          if (this.enemies) {
            this.enemies.forEach((enemy) => {
              if (enemy && enemy.sprite && enemy.sprite.body) {
                enemy.sprite.body.setVelocity(0, 0);
                enemy.active = false;
              }
            });
          }

          // Stop all weapons
          if (this.weapons) {
            this.weapons.forEach((weapon) => {
              if (weapon && weapon.stop) {
                weapon.stop();
              }
            });
          }

          // Show wasted screen
          this.showWastedScreen();

          console.log("Player died! Precise time:", {
            timeAliveSeconds: this.gameState.finalTimeAlive,
            timeAliveMS: this.gameState.finalTimeAliveMS,
            startTime: this.gameState.gameStartTime,
            endTime: this.gameState.gameEndTime,
          });
        }
      };
    }

    // In the create function, update the showLevelClearedScreen function:
    this.showLevelClearedScreen = async () => {
      if (this.gameState.isLevelCleared || this.gameState.isGameOver) {
        console.log("Level already cleared or game over, preventing duplicate call");
        return;
      }

      this.gameState.isLevelCleared = true;
      this.gameState.isGameOver = true;
      console.log("Setting level cleared state");

      try {
        const accessToken = await this.userInfo.getAccessToken();
        console.log("Got fresh access token for level clear");

        // Prepare stats for display
        const gameStats = {
          gold: this.gameState.gold,
          kills: this.gameState.kills,
          waveNumber: this.gameState.waveNumber,
          timeAlive: this.gameState.finalTimeAlive,
          timeAliveMS: this.gameState.finalTimeAliveMS,
        };

        const response = await fetch("/api/game-over", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...gameStats,
            timestamp: new Date().toISOString(),
            userAddress: this.userInfo.userAddress,
            username: this.userInfo.username,
            profileImage: this.userInfo.profileImage,
          }),
        });

        const data = await response.json();
        console.log("Level cleared API call completed successfully:", data);

        if (this.userInfo.invalidateQueries) {
          this.userInfo.invalidateQueries();
        }

        // Show the level cleared overlay
        this.levelClearedOverlay.setVisible(true);

        // Background fade
        this.tweens.add({
          targets: [this.levelClearedOverlay.getAt(0)],
          alpha: 0.8,
          duration: 1000,
          ease: "Power2",
        });

        // Victory text with retro effect
        const victoryText = this.add
          .text(this.scale.width / 2, this.scale.height * 0.3, "LEVEL CLEARED!", {
            fontFamily: "VT323",
            fontSize: "96px",
            color: "#00ff00",
            stroke: "#003300",
            strokeThickness: 8,
            shadow: { color: "#000000", fill: true, offsetX: 2, offsetY: 2, blur: 8 },
          })
          .setOrigin(0.5)
          .setAlpha(0);
        this.levelClearedOverlay.add(victoryText);

        // Stats display
        const formatTime = (ms) => {
          const seconds = Math.floor(ms / 1000);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
        };

        const statsStyle = {
          fontFamily: "VT323",
          fontSize: "32px",
          color: "#00ffff",
          stroke: "#003333",
          strokeThickness: 2,
          shadow: { color: "#000000", fill: true, offsetX: 1, offsetY: 1, blur: 2 },
        };

        const statsTexts = [
          `GOLD COLLECTED: ${gameStats.gold}`,
          `ENEMIES SLAIN: ${gameStats.kills}`,
          `FINAL WAVE: ${gameStats.waveNumber}`,
          `COMPLETION TIME: ${formatTime(gameStats.timeAliveMS)}`,
        ];

        const statsY = this.scale.height * 0.45;
        const statsSpacing = 40;

        const statElements = statsTexts.map((text, index) => {
          const statText = this.add
            .text(this.scale.width / 2, statsY + index * statsSpacing, text, statsStyle)
            .setOrigin(0.5)
            .setAlpha(0);
          this.levelClearedOverlay.add(statText);
          return statText;
        });

        // Animate victory text
        this.tweens.add({
          targets: victoryText,
          alpha: 1,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 1000,
          ease: "Power2",
        });

        // Animate stats with cascade effect
        statElements.forEach((statText, index) => {
          this.tweens.add({
            targets: statText,
            alpha: 1,
            x: this.scale.width / 2,
            duration: 500,
            delay: 1000 + index * 200,
            ease: "Power2",
          });
        });

        // Continue text with retro styling
        const continueText = this.add
          .text(this.scale.width / 2, this.scale.height * 0.8, "Press any movement key to continue", {
            fontFamily: "VT323",
            fontSize: "32px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            shadow: { color: "#000000", fill: true, offsetX: 1, offsetY: 1, blur: 2 },
          })
          .setOrigin(0.5)
          .setAlpha(0);
        this.levelClearedOverlay.add(continueText);

        // Delay before showing continue text
        this.time.delayedCall(10000, () => {
          // First fade in the continue text
          this.tweens.add({
            targets: continueText,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            onComplete: () => {
              // Start blinking animation
              this.tweens.add({
                targets: continueText,
                alpha: 0.3,
                duration: 1000,
                ease: "Power2",
                yoyo: true,
                repeat: -1,
              });

              // Add another delay before enabling input
              this.time.delayedCall(2000, () => {
                const handleInput = (event) => {
                  // Check for both WASD and arrow keys
                  const validKeys = [
                    "W",
                    "A",
                    "S",
                    "D", // WASD keys
                    "UP",
                    "DOWN",
                    "LEFT",
                    "RIGHT", // Arrow keys as strings
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight", // Alternative arrow key names
                  ];

                  if (validKeys.includes(event.key.toUpperCase()) || validKeys.includes(event.key)) {
                    this.input.keyboard.off("keydown", handleInput);
                    this.scene.start("GameScene");
                  }
                };

                // Only add the input listener after both delays
                this.input.keyboard.on("keydown", handleInput);
                console.log("Input handler enabled");
              });
            },
          });
        });
      } catch (error) {
        console.error("Error in showLevelClearedScreen:", error);
        this.gameState.isLevelCleared = true;
        this.gameState.isGameOver = true;
      }
    };

    // In the create function, add this before setting up the WASTED overlay:

    // Create LEVEL CLEARED overlay container (hidden by default)
    this.levelClearedOverlay = this.add.container(0, 0);
    this.levelClearedOverlay.setDepth(1000); // Ensure it's above everything
    this.levelClearedOverlay.setScrollFactor(0); // Fix entire container to camera

    // Black overlay with fade (make it cover the entire game world)
    const levelClearedBlackOverlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000
    );
    levelClearedBlackOverlay.setAlpha(0);
    this.levelClearedOverlay.add(levelClearedBlackOverlay);

    // LEVEL CLEARED text (positioned at camera center)
    const levelClearedText = this.add.text(this.scale.width / 2, this.scale.height / 2, "LEVEL CLEARED", {
      fontFamily: "Arial Black",
      fontSize: "64px", // Reduced from 128px to 64px
      color: "#00FF00",
      stroke: "#000000",
      strokeThickness: 6, // Reduced stroke thickness to match smaller size
      align: "center",
    });
    levelClearedText.setOrigin(0.5);
    levelClearedText.setAlpha(0);
    this.levelClearedOverlay.add(levelClearedText);

    // Hide overlay initially
    this.levelClearedOverlay.setVisible(false);
  },

  update: function (time, delta) {
    if (!this.gameState.gameStarted) {
      const keys = this.input.keyboard.createCursorKeys();
      const wasd = {
        up: this.input.keyboard.addKey("W"),
        down: this.input.keyboard.addKey("S"),
        left: this.input.keyboard.addKey("A"),
        right: this.input.keyboard.addKey("D"),
      };

      if (
        keys.left.isDown ||
        keys.right.isDown ||
        keys.up.isDown ||
        keys.down.isDown ||
        wasd.left.isDown ||
        wasd.right.isDown ||
        wasd.up.isDown ||
        wasd.down.isDown
      ) {
        this.gameState.gameStarted = true;
        this.gameState.gameStartTime = Date.now();
        console.log("Game started! Start time:", this.gameState.gameStartTime); // Debug log
        this.startGame();
      }
      return;
    }

    // Get camera bounds with margin for smoother transitions
    const camera = this.cameras.main;
    const margin = 100;
    const bounds = {
      left: camera.scrollX - margin,
      right: camera.scrollX + camera.width + margin,
      top: camera.scrollY - margin,
      bottom: camera.scrollY + camera.height + margin,
    };

    // Helper function to check if an object is on screen
    const isOnScreen = (sprite) => {
      if (!sprite || !sprite.active) return false;
      return sprite.x >= bounds.left && sprite.x <= bounds.right && sprite.y >= bounds.top && sprite.y <= bounds.bottom;
    };

    // Handle player movement using the new system
    const input = {
      left: this.cursors.left.isDown || this.wasd.left.isDown,
      right: this.cursors.right.isDown || this.wasd.right.isDown,
      up: this.cursors.up.isDown || this.wasd.up.isDown,
      down: this.cursors.down.isDown || this.wasd.down.isDown,
    };

    if (this.player) {
      this.player.handleMovement(input);
    }

    // Update debug text first
    if (this.debugText && this.player && this.weapons) {
      this.debugText.setVisible(false);
    }
    // if (this.debugText && this.player && this.weapons) {
    //   try {
    //     const weapon = this.weapons[this.gameState.selectedWeaponIndex];
    //     const stats = weapon?.stats || {};

    //     // Create level progress bar
    //     const maxBoxes = 8;
    //     const filledBoxes = weapon?.currentLevel || 1;
    //     const progressBar = Array(maxBoxes).fill("░").fill("█", 0, filledBoxes).join("");

    //     const text = [
    //       `Position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
    //       `Active Weapons: ${this.weapons.length}`,
    //       `Weapon Stats:`,
    //       `  Level: [${progressBar}] ${weapon?.currentLevel || 1}/${weapon?.maxLevel || 8}`,
    //       `  Damage: ${stats.damage || 0}`,
    //       `  Pierce: ${stats.pierce || 0}`,
    //       `  Range: ${stats.range || 0}`,
    //       `  Speed: ${stats.speed || 0}`,
    //       ...(stats.magicPower
    //         ? [
    //             `  Magic Power: ${stats.magicPower}`,
    //             `  Critical Chance: ${Math.round(stats.criticalChance * 100)}%`,
    //             `  Elemental Damage: ${stats.elementalDamage}`,
    //           ]
    //         : []),
    //       `FPS: ${Math.round(1000 / delta)}`,
    //       `Time: ${Math.round(time / 1000)}s`,
    //     ].join("\n");

    //     this.debugText.setText(text);
    //   } catch (error) {
    //     console.error("Error updating debug text:", error);
    //   }
    // }

    // Update coins
    Coin.pool.forEach((coin) => {
      if (coin.isActive) {
        coin.update(this.player);
      }
    });

    // Update XP gems
    if (this.xpGems) {
      this.xpGems.forEach((gem) => gem.update(this.player));
    }

    // Update all enemies with screen check optimization
    if (this.enemies) {
      // Filter out null or dead enemies first
      this.enemies = this.enemies.filter((enemy) => enemy && !enemy.isDead);

      // Update remaining enemies
      this.enemies.forEach((enemy) => {
        try {
          if (enemy.sprite && typeof enemy.update === "function") {
            // Check if enemy is too far from player
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > 1500 * 1500) {
              // If enemy is more than 1500 pixels away
              // Mark for cleanup in next pool cleanup cycle
              enemy.isDead = true;
            } else {
              // Only perform full update if enemy is on screen or close to it
              const onScreen = Math.abs(dx) < 800 && Math.abs(dy) < 800;
              if (onScreen) {
                enemy.update(time, delta);
              } else if (typeof enemy.updateOffScreen === "function") {
                enemy.updateOffScreen(time, delta);
              }
            }
          }
        } catch (error) {
          console.error("Error updating enemy:", error);
          enemy.isDead = true;
        }
      });
    }

    // Update all weapons with screen check optimization
    if (this.weapons && this.weapons.length > 0) {
      this.weapons.forEach((weapon, index) => {
        if (weapon && typeof weapon.update === "function") {
          try {
            // Only check collisions for projectiles that are on screen
            weapon.updateWithScreenCheck(time, delta, isOnScreen);
          } catch (error) {
            console.error(`Error updating weapon ${index}:`, error);
          }
        }
      });
    }

    // Check for timer start
    if (
      (this.cursors.left.isDown ||
        this.cursors.right.isDown ||
        this.cursors.up.isDown ||
        this.cursors.down.isDown ||
        this.wasd.left.isDown ||
        this.wasd.right.isDown ||
        this.wasd.up.isDown ||
        this.wasd.down.isDown) &&
      !this.gameState.timerStarted
    ) {
      this.gameState.timerStarted = true;
    }

    // Update player with movement input
    if (this.player) {
      this.player.update();
    }

    // Check if player is dead
    if (this.player && this.player.isDead) {
      this.showWastedScreen();
    }
  },

  // Add this method to the GameScene class
  cleanup: function () {
    // Clean up XP gems
    if (this.xpGems) {
      this.xpGems.forEach((gem) => {
        if (gem && gem.sprite) {
          gem.sprite.destroy();
        }
      });
      this.xpGems = [];
    }

    // Clean up enemy pool
    if (this.enemyPool) {
      this.enemyPool.cleanup();
    }
  },

  shutdown: function () {
    this.cleanup();
  },

  destroy: function () {
    this.cleanup();
  },

  createWaveAnnouncement: function () {
    // Create wave announcement text
    const waveText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      `Wave ${this.gameState.waveNumber}`,
      {
        fontFamily: "VT323",
        fontSize: "64px",
        color: "#00ff00",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { color: "#000000", fill: true, offsetX: 2, offsetY: 2, blur: 8 },
      }
    );

    // Set text properties
    waveText.setOrigin(0.5);
    waveText.setScrollFactor(0);
    waveText.setDepth(1000);
    waveText.setAlpha(0);

    // Create animation sequence
    this.tweens.add({
      targets: waveText,
      alpha: { from: 0, to: 1 },
      y: { from: this.cameras.main.centerY - 100, to: this.cameras.main.centerY - 50 },
      ease: "Power2",
      duration: 500,
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        waveText.destroy();
      },
    });

    // Optional: Add difficulty indicator for later waves
    if (this.gameState.waveNumber > 5) {
      const difficultyText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 10,
        `Difficulty Multiplier: ${this.gameState.waveScaling.healthMultiplier.toFixed(1)}x`,
        {
          fontFamily: "VT323",
          fontSize: "32px",
          color: "#ff0000",
          stroke: "#000000",
          strokeThickness: 2,
        }
      );

      difficultyText.setOrigin(0.5);
      difficultyText.setScrollFactor(0);
      difficultyText.setDepth(1000);
      difficultyText.setAlpha(0);

      this.tweens.add({
        targets: difficultyText,
        alpha: { from: 0, to: 1 },
        y: { from: this.cameras.main.centerY + 20, to: this.cameras.main.centerY + 10 },
        ease: "Power2",
        duration: 500,
        yoyo: true,
        hold: 1000,
        onComplete: () => {
          difficultyText.destroy();
        },
      });
    }
  },
});

export default function Game() {
  const { ready, user, getAccessToken } = usePrivy();
  const userAddress = user?.wallet?.address;
  const username = user?.twitter?.username;
  const gameRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const initializingRef = useRef(false); // Add ref to track initialization state
  const queryClient = useQueryClient();

  const {
    data: accessData,
    isLoading: isAccessLoading,
    isError: isAccessError,
  } = useQuery({
    queryKey: ["accessVerification", user?.wallet?.address],
    queryFn: () => verifyAccess(user?.wallet?.address),
    enabled: !!user?.wallet?.address,
  });

  const isShapeCraftKeyHolder = accessData?.isShapeCraftKeyHolder;
  const isAwakenEyeHolder = accessData?.isAwakenEyeHolder;
  const isSSGHolder = accessData?.isSSGHolder;

  useEffect(() => {
    // Return early if not ready, game exists, or already initializing
    if (!ready || gameInstanceRef.current || initializingRef.current) {
      return;
    }

    const initializeGame = async () => {
      // Set initializing flag
      initializingRef.current = true;

      try {
        const accessToken = await getAccessToken();

        // Check again if game exists (in case of double mount)
        if (gameInstanceRef.current) {
          return;
        }

        if (typeof window !== "undefined" && window.Phaser) {
          const userInfo = {
            userAddress: userAddress,
            username: username,
            profileImage: user?.twitter?.profilePictureUrl,
            isShapeCraftKeyHolder: isShapeCraftKeyHolder,
            isAwakenEyeHolder: isAwakenEyeHolder,
            isSSGHolder: isSSGHolder,
            getAccessToken: getAccessToken,
            invalidateQueries: () => {
              queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
              queryClient.invalidateQueries({ queryKey: ["memberCount"] });
              queryClient.invalidateQueries({ queryKey: ["gameTotalPlays"] });
              queryClient.invalidateQueries({ queryKey: ["nfts"] });
            },
          };

          class CustomGameScene extends GameScene {
            constructor() {
              super();
              this.userInfo = userInfo;
            }
          }

          const config = {
            type: Phaser.AUTO,
            parent: gameRef.current,
            width: 800,
            height: 600,
            backgroundColor: "#000000",
            pixelArt: true,
            physics: {
              default: "arcade",
              arcade: {
                gravity: { y: 0 },
                debug: false,
              },
            },
            input: {
              activePointers: 1,
              pixelPerfect: false,
            },
            scene: [MenuScene, CustomGameScene, UpgradeMenuScene],
          };

          // Final check before creating game instance
          if (!gameInstanceRef.current) {
            gameInstanceRef.current = new Phaser.Game(config);
          }
        }
      } catch (error) {
        console.error("Error initializing game:", error);
        initializingRef.current = false;
      }
    };

    initializeGame();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
      initializingRef.current = false;
    };
  }, [
    ready,
    user,
    userAddress,
    username,
    getAccessToken,
    queryClient,
    isAccessLoading,
    isShapeCraftKeyHolder,
    isAwakenEyeHolder,
    isSSGHolder,
  ]);

  // Show loading state if not ready or game is initializing
  if (!ready) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-transparent">
        <div className="text-lg font-medium animate-pulse">Loading game...</div>
      </div>
    );
  }

  // Show error state if access verification failed
  if (isAccessError) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-transparent">
        <div className="text-red-500">Failed to verify access. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-transparent rounded-xl w-fit h-fit">
      <div ref={gameRef} className="w-[800px] h-[600px] bg-transparent rounded-xl" />
    </div>
  );
}
