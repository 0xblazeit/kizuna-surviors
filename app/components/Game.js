"use client";

import { useEffect, useRef } from "react";
import MenuScene from "./MenuScene";
import UpgradeMenuScene from "./UpgradeMenuScene";
import MainPlayer from "../game/entities/MainPlayer";
import EnemyBasic from "../game/entities/EnemyBasic";
import EnemyAdvanced from "../game/entities/EnemyAdvanced";
import EnemyEpic from "../game/entities/EnemyEpic";
import EnemyShooter from "../game/entities/EnemyShooter";
import { RotatingDogWeapon } from "../game/entities/weapons/RotatingDogWeapon";
import { MagicWandWeapon } from "../game/entities/weapons/MagicWandWeapon";
import { GlizzyBlasterWeapon } from "../game/entities/weapons/GlizzyBlasterWeapon";
import FlyingAxeWeapon from "../game/entities/weapons/FlyingAxeWeapon";
import SonicBoomHammer from "../game/entities/weapons/SonicBoomHammer";
import { MilkWeapon } from "../game/entities/weapons/MilkWeapon";
import ShapecraftKeyWeapon from "../game/entities/weapons/ShapecraftKeyWeapon";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";

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
      maxEnemies: 15,
      spawnRate: 1000,
      minSpawnRate: 300,
      enemyWaveTimer: 0,
      waveNumber: 1,
      difficultyMultiplier: 1,
      spawnThresholds: {
        advanced: 5,
        epic: 10,
      },
      gameStartTime: null,
      gameEndTime: null,
      finalTimeAlive: 0,
      finalTimeAliveMS: 0,
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
    this.load.svg("weapon-skull-projectile", "/assets/game/weapons/weapon-skull-projectile.svg?v=1", {
      scale: 1.2,
    });

    // Load XP gem with correct path
    this.load.image("powerup-xp-gem", "/assets/game/powerups/xp-gem.svg");
  },

  spawnEnemies: function () {
    if (!this.gameState.gameStarted || this.enemies.length >= this.gameState.maxEnemies) return;

    // Calculate game progress (0 to 1) based on 30-minute max time
    const maxGameTime = 1800; // 30 minutes in seconds
    const gameProgress = Math.min(this.gameState.gameTimer / maxGameTime, 1);

    // Update wave timer and check for new wave
    this.gameState.enemyWaveTimer += this.gameState.spawnRate / 1000;
    if (this.gameState.enemyWaveTimer >= 60) {
      // New wave every minute
      this.gameState.enemyWaveTimer = 0;
      this.gameState.waveNumber++;
      this.gameState.difficultyMultiplier += 0.1;

      // Update wave text
      if (this.waveText) {
        this.waveText.setText(`Wave: ${this.gameState.waveNumber}`);
      }
    }

    // Get spawn position
    const randomX = Phaser.Math.Between(100, this.scale.width * 2 - 100);
    const randomY = Phaser.Math.Between(100, this.scale.height * 2 - 100);

    let enemy;
    const roll = Math.random();

    if (this.gameState.gameTimer < 45) {
      // First 45 seconds - only basic enemies
      const randomSprite = ENEMY_SPRITES[Phaser.Math.Between(0, ENEMY_SPRITES.length - 1)];
      enemy = new EnemyBasic(this, randomX, randomY, randomSprite, {
        type: "basic",
        scale: 0.3,
      });
    } else if (this.gameState.gameTimer < 120) {
      // 45-120 seconds - 50% basic, 40% shooter, 10% advanced
      if (roll < 0.4) {
        enemy = new EnemyShooter(this, randomX, randomY, "enemy-shooter", {
          type: "shooter",
          scale: 0.3,
          maxHealth: 80 + Math.floor(this.gameState.waveNumber * 5),
          moveSpeed: 1.4,
          attackRange: 250 + Math.min(200, this.gameState.waveNumber * 10),
          projectileSpeed: 200 + Math.min(100, this.gameState.waveNumber * 5),
        });
      } else if (roll < 0.5) {
        const randomAdvancedSprite = ENEMY_ADVANCED_SPRITES[Math.floor(Math.random() * ENEMY_ADVANCED_SPRITES.length)];
        enemy = new EnemyAdvanced(this, randomX, randomY, randomAdvancedSprite, {
          maxHealth: 300,
          moveSpeed: 2.0,
          defense: 2,
          attackDamage: 12,
          scale: 0.5,
        });
      } else {
        const randomSprite = ENEMY_SPRITES[Phaser.Math.Between(0, ENEMY_SPRITES.length - 1)];
        enemy = new EnemyBasic(this, randomX, randomY, randomSprite, {
          type: "basic",
          scale: 0.3,
        });
      }
    } else if (this.gameState.gameTimer < 240) {
      // 120-240 seconds - 25% basic, 35% shooter, 25% advanced, 15% epic
      if (roll < 0.35) {
        enemy = new EnemyShooter(this, randomX, randomY, "enemy-shooter", {
          type: "shooter",
          scale: 0.3,
          maxHealth: 80 + Math.floor(this.gameState.waveNumber * 5),
          moveSpeed: 1.4,
          attackRange: 250 + Math.min(200, this.gameState.waveNumber * 10),
          projectileSpeed: 200 + Math.min(100, this.gameState.waveNumber * 5),
        });
      } else if (roll < 0.6) {
        const randomAdvancedSprite = ENEMY_ADVANCED_SPRITES[Math.floor(Math.random() * ENEMY_ADVANCED_SPRITES.length)];
        enemy = new EnemyAdvanced(this, randomX, randomY, randomAdvancedSprite, {
          maxHealth: 300,
          moveSpeed: 2.0,
          defense: 2,
          attackDamage: 12,
          scale: 0.5,
        });
      } else if (roll < 0.75) {
        const randomEpicSprite = ENEMY_EPIC_SPRITES[Math.floor(Math.random() * ENEMY_EPIC_SPRITES.length)];
        enemy = new EnemyEpic(this, randomX, randomY, randomEpicSprite, {
          maxHealth: 600,
          moveSpeed: 2.2,
          defense: 4,
          attackDamage: 16,
          scale: 0.6,
        });
      } else {
        const randomSprite = ENEMY_SPRITES[Phaser.Math.Between(0, ENEMY_SPRITES.length - 1)];
        enemy = new EnemyBasic(this, randomX, randomY, randomSprite, {
          type: "basic",
          scale: 0.3,
        });
      }
    } else {
      // After 240 seconds - 15% basic, 35% shooter, 25% advanced, 25% epic
      if (roll < 0.35) {
        enemy = new EnemyShooter(this, randomX, randomY, "enemy-shooter", {
          type: "shooter",
          scale: 0.3,
          maxHealth: 80 + Math.floor(this.gameState.waveNumber * 5),
          moveSpeed: 1.4,
          attackRange: 250 + Math.min(200, this.gameState.waveNumber * 10),
          projectileSpeed: 200 + Math.min(100, this.gameState.waveNumber * 5),
        });
      } else if (roll < 0.6) {
        const randomAdvancedSprite = ENEMY_ADVANCED_SPRITES[Math.floor(Math.random() * ENEMY_ADVANCED_SPRITES.length)];
        enemy = new EnemyAdvanced(this, randomX, randomY, randomAdvancedSprite, {
          maxHealth: 300,
          moveSpeed: 2.0,
          defense: 2,
          attackDamage: 12,
          scale: 0.5,
        });
      } else if (roll < 0.85) {
        const randomEpicSprite = ENEMY_EPIC_SPRITES[Math.floor(Math.random() * ENEMY_EPIC_SPRITES.length)];
        enemy = new EnemyEpic(this, randomX, randomY, randomEpicSprite, {
          maxHealth: 600,
          moveSpeed: 2.2,
          defense: 4,
          attackDamage: 16,
          scale: 0.6,
        });
      } else {
        const randomSprite = ENEMY_SPRITES[Phaser.Math.Between(0, ENEMY_SPRITES.length - 1)];
        enemy = new EnemyBasic(this, randomX, randomY, randomSprite, {
          type: "basic",
          scale: 0.3,
        });
      }
    }

    enemy.sprite.once("destroy", () => {
      const index = this.enemies.indexOf(enemy);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
    });

    this.enemies.push(enemy);
  },

  startGame: function () {
    // Initial enemy spawn
    for (let i = 0; i < 15; i++) {
      const randomX = Phaser.Math.Between(100, this.scale.width * 2 - 100);
      const randomY = Phaser.Math.Between(100, this.scale.height * 2 - 100);
      const randomSprite = ENEMY_SPRITES[Phaser.Math.Between(0, ENEMY_SPRITES.length - 1)];

      const enemy = new EnemyBasic(this, randomX, randomY, randomSprite, {
        type: "basic",
        scale: 0.3,
      });

      enemy.sprite.once("destroy", () => {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
          this.enemies.splice(index, 1);
        }
      });

      this.enemies.push(enemy);
    }

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

  create: function () {
    const { width, height } = this.scale;

    // Initialize enemy sprite arrays
    this.enemySprites = ENEMY_SPRITES;
    this.enemyAdvancedSprites = ENEMY_ADVANCED_SPRITES;
    this.enemyEpicSprites = ENEMY_EPIC_SPRITES;

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
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellIndex = row * gridCols + col;
        const cell = this.add.rectangle(
          gridX + col * gridCellSize,
          uiRowY + row * gridCellSize,
          gridCellSize - 4,
          gridCellSize - 4,
          0x000000
        );

        // Set initial stroke style with white highlight instead of green
        const strokeColor = cellIndex === this.gameState.selectedWeaponIndex ? 0xffffff : 0x666666;
        cell.setStrokeStyle(2, strokeColor);

        // Make cell interactive and ensure it stays interactive
        cell
          .setInteractive({ useHandCursor: true })
          .setDepth(1001) // Higher than UI container to ensure clickability
          .setScrollFactor(0); // Ensure it doesn't move with camera

        // Make cell interactive
        cell.on("pointerdown", () => {
          // Only process clicks for cells with weapons
          if (
            cellIndex === 0 ||
            cellIndex === 1 ||
            cellIndex === 2 ||
            cellIndex === 3 ||
            cellIndex === 4 ||
            cellIndex === 5 ||
            cellIndex === 6
          ) {
            // Update selected weapon index
            this.gameState.selectedWeaponIndex = cellIndex;

            // Update all cell borders with white highlight
            gridCells.forEach((c, i) => {
              c.setStrokeStyle(2, i === cellIndex ? 0xffffff : 0x666666);
            });

            // Update stats display for selected weapon
            this.updateStatsDisplay();
          }
        });

        gridCells.push(cell);
        gridContainer.add(cell);

        // Add dog weapon icon to first cell
        if (row === 0 && col === 0) {
          weaponIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-dog-projectile",
            0,
            gridCells
          );
        }

        // Add wand weapon icon to second cell
        if (row === 0 && col === 1) {
          wandIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-wand-icon",
            1,
            gridCells
          );
        }

        // Add Glizzy Blaster icon to third cell
        if (row === 0 && col === 2) {
          glizzyIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-hotdog-projectile",
            2,
            gridCells
          );
        }

        // Add axe icon to fourth cell
        if (row === 0 && col === 3) {
          axeIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-axe-projectile",
            3,
            gridCells
          );
        }

        // Add hammer icon to fifth cell
        if (row === 0 && col === 4) {
          hammerIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-hammer-projectile",
            4,
            gridCells
          );
        }

        // Add milk icon to sixth cell
        if (row === 0 && col === 5) {
          milkIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-magic-milk",
            5,
            gridCells
          );
          // Initialize milk weapon when icon is clicked
          milkIcon.setInteractive();
          milkIcon.on("pointerdown", () => {
            // Just select the milk weapon (index 5)
            this.gameState.selectedWeaponIndex = 5;

            // Update all cell borders
            gridCells.forEach((c, i) => {
              c.setStrokeStyle(2, i === 5 ? 0xffffff : 0x666666);
            });

            this.updateStatsDisplay();
          });
        }

        // Add shapecraft key weapon icon to seventh cell
        if (row === 1 && col === 0) {
          shapecraftIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            "weapon-shapecraft-key",
            6,
            gridCells
          );
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
        data.data.forEach((entry, index) => {
          if (index < 5) {
            // Format each entry with proper spacing for columns
            const rank = `#${index + 1}`.padEnd(8);
            const gold = `${entry.gold}`.padEnd(9);
            const kills = `${entry.kills}`;
            this.statsTexts.leaderboardEntries[index].setText(`${rank}${gold}${kills}`);
          }
        });
      })
      .catch((error) => console.error("Error fetching leaderboard:", error));

    // Create trail effect container
    this.trailContainer = this.add.container(0, 0);

    // Create player with physics and pass trail container
    this.player = new MainPlayer(this, width / 2, height / 2, "player", {
      trailContainer: this.trailContainer,
      scale: 1,
      spriteKey: "player",
    });

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
      new ShapecraftKeyWeapon(this, this.player),
    ];

    this.weaponInitialized = true;
    console.log(
      "Weapon system initialized with weapons:",
      this.weapons.map((w) => w.constructor.name)
    );

    // Create new debug text with smaller font and transparent background
    const debugConfig = {
      fontFamily: "VT323",
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#00000088",
      padding: { x: 5, y: 3 },
      lineSpacing: 3,
    };

    // Position below the existing inventory grid
    const gridBottom = uiRowY + gridRows * gridCellSize;
    this.debugText = this.add
      .text(
        gridX, // Same X as inventory grid
        gridBottom + 10, // 10px spacing below grid
        "Press Arrow Keys / WASD to start",
        debugConfig
      )
      .setScrollFactor(0)
      .setDepth(9999)
      .setOrigin(0, 0)
      .setAlpha(0.8);
    uiContainer.add(this.debugText);

    // Create array to store enemies
    this.enemies = [];

    // Enemy sprite keys
    this.enemySprites = ENEMY_SPRITES;
    this.enemyAdvancedSprites = ENEMY_ADVANCED_SPRITES;
    this.enemyEpicSprites = ENEMY_EPIC_SPRITES;

    // Initialize weapons array but don't start them yet
    this.weapons = [
      new RotatingDogWeapon(this, this.player),
      new MagicWandWeapon(this, this.player),
      new GlizzyBlasterWeapon(this, this.player),
      new FlyingAxeWeapon(this, this.player),
      new SonicBoomHammer(this, this.player),
      new MilkWeapon(this, this.player),
      new ShapecraftKeyWeapon(this, this.player),
    ];

    // Create enemy spawn timer
    this.enemySpawnTimer = this.time.addEvent({
      delay: this.gameState.spawnRate,
      callback: () => {
        if (this.enemies.length >= this.gameState.maxEnemies) return;

        // Calculate game progress (0 to 1) based on 30-minute max time
        const maxGameTime = 1800; // 30 minutes in seconds
        const gameProgress = Math.min(this.gameState.gameTimer / maxGameTime, 1);

        // Update wave timer and check for new wave
        this.gameState.enemyWaveTimer += this.gameState.spawnRate / 1000;
        if (this.gameState.enemyWaveTimer >= 60) {
          // New wave every minute
          this.gameState.enemyWaveTimer = 0;
          this.gameState.waveNumber++;
          this.gameState.difficultyMultiplier += 0.1;

          // Update the static wave tracker
          if (this.waveText) {
            this.waveText.setText(`Wave: ${this.gameState.waveNumber}`);
          }

          // Announce new wave
          const waveText = this.add
            .text(this.cameras.main.centerX, 100, `Wave ${this.gameState.waveNumber}`, {
              fontFamily: "VT323",
              fontSize: "48px",
              color: "#ff0000",
              stroke: "#000000",
              strokeThickness: 4,
            })
            .setOrigin(0.5);
          waveText.setScrollFactor(0);

          // Fade out and destroy
          this.tweens.add({
            targets: waveText,
            alpha: 0,
            y: 50,
            duration: 2000,
            ease: "Power2",
            onComplete: () => waveText.destroy(),
          });
        }

        // Get spawn position
        const getSpawnPosition = () => {
          const minSpawnDistance = 300; // Minimum distance from player
          const maxSpawnDistance = 500; // Maximum distance from player
          const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians

          // Use wave number to rotate spawn points for variety
          const baseAngle = this.gameState.waveNumber * goldenAngle;

          // Get random distance between min and max
          const distance = Phaser.Math.Between(minSpawnDistance, maxSpawnDistance);

          // Calculate angle using golden ratio for better distribution
          const angle = baseAngle + Math.random() * Math.PI * 2;

          // Calculate position relative to player
          const spawnX = this.player.x + Math.cos(angle) * distance;
          const spawnY = this.player.y + Math.sin(angle) * distance;

          // Clamp to world bounds with padding
          const padding = 50;
          return {
            x: Phaser.Math.Clamp(spawnX, padding, this.physics.world.bounds.width - padding),
            y: Phaser.Math.Clamp(spawnY, padding, this.physics.world.bounds.height - padding),
          };
        };

        // Get spawn position
        const spawnPos = getSpawnPosition();
        const x = spawnPos.x;
        const y = spawnPos.y;

        const enemyAdvancedSprites = ENEMY_ADVANCED_SPRITES;
        const enemyEpicSprites = ENEMY_EPIC_SPRITES;
        const enemySprites = ENEMY_SPRITES;

        // Simplified enemy spawn system
        let enemy;
        const roll = Math.random();

        if (this.gameState.gameTimer < 45) {
          // Before 45 seconds - 100% basic
          enemy = new EnemyBasic(this, x, y, enemySprites[Math.floor(Math.random() * enemySprites.length)], {
            maxHealth: 100,
            moveSpeed: 1.8,
            defense: 0,
            attackDamage: 8,
            scale: 0.4,
          });
        } else if (this.gameState.gameTimer < 200) {
          // 45-200 seconds - 70% advanced, 30% basic
          if (roll < 0.7) {
            enemy = new EnemyAdvanced(
              this,
              x,
              y,
              enemyAdvancedSprites[Math.floor(Math.random() * enemyAdvancedSprites.length)],
              {
                maxHealth: 300,
                moveSpeed: 2.0,
                defense: 2,
                attackDamage: 12,
                scale: 0.5,
              }
            );
          } else {
            enemy = new EnemyBasic(this, x, y, enemySprites[Math.floor(Math.random() * enemySprites.length)], {
              maxHealth: 100,
              moveSpeed: 1.8,
              defense: 0,
              attackDamage: 8,
              scale: 0.4,
            });
          }
        } else {
          // After 20 seconds - 50% epic, 30% advanced, 20% basic
          if (roll < 0.5) {
            enemy = new EnemyEpic(this, x, y, enemyEpicSprites[Math.floor(Math.random() * enemyEpicSprites.length)], {
              maxHealth: 600,
              moveSpeed: 2.2,
              defense: 4,
              attackDamage: 16,
              scale: 0.6,
            });
          } else if (roll < 0.8) {
            enemy = new EnemyAdvanced(
              this,
              x,
              y,
              enemyAdvancedSprites[Math.floor(Math.random() * enemyAdvancedSprites.length)],
              {
                maxHealth: 300,
                moveSpeed: 2.0,
                defense: 2,
                attackDamage: 12,
                scale: 0.5,
              }
            );
          } else {
            enemy = new EnemyBasic(this, x, y, enemySprites[Math.floor(Math.random() * enemySprites.length)], {
              maxHealth: 100,
              moveSpeed: 1.8,
              defense: 0,
              attackDamage: 8,
              scale: 0.4,
            });
          }
        }

        // Add to physics system
        this.physics.add.existing(enemy);

        // Simply push to array instead of using .add()
        this.enemies.push(enemy);

        // Debug: Log spawn location
        console.log("Enemy spawned at:", { x, y }, "Player at:", {
          px: this.player.x,
          py: this.player.y,
        });

        // Increase max enemies and decrease spawn rate based on wave number
        this.gameState.maxEnemies = Math.min(60, 15 + Math.floor(this.gameState.waveNumber * 0.75));
        this.gameState.spawnRate = Math.max(this.gameState.minSpawnRate, 1000 - this.gameState.waveNumber * 50);
        this.enemySpawnTimer.delay = this.gameState.spawnRate;

        // Enhanced enemy movement behavior
        enemy.updateMovement = function (time, delta) {
          if (!this.scene.player || !this.sprite) return;

          // Calculate direction to player
          const dx = this.scene.player.x - this.sprite.x;
          const dy = this.scene.player.y - this.sprite.y;
          const angle = Math.atan2(dy, dx);

          // Add slight randomization to movement for more organic feel
          const randomAngle = angle + (Math.random() - 0.5) * 0.2;

          // Calculate velocity components
          const speed = this.stats.moveSpeed;
          this.sprite.body.velocity.x = Math.cos(randomAngle) * speed;
          this.sprite.body.velocity.y = Math.sin(randomAngle) * speed;

          // Rotate sprite to face movement direction
          this.sprite.rotation = angle + Math.PI / 2;

          // Epic enemies get special movement patterns
          if (this instanceof EnemyEpic) {
            // Periodic speed bursts
            const burstInterval = 3000; // 3 seconds
            if (time % burstInterval < 500) {
              // 0.5 second burst
              this.sprite.body.velocity.x *= 1.5;
              this.sprite.body.velocity.y *= 1.5;
            }

            // Periodic sidestep movement
            const sideStepInterval = 2000; // 2 seconds
            if (time % sideStepInterval < 1000) {
              // 1 second sidestep
              const perpAngle = angle + Math.PI / 2;
              const sideStepSpeed = speed * 0.5;
              this.sprite.body.velocity.x += Math.cos(perpAngle) * sideStepSpeed;
              this.sprite.body.velocity.y += Math.sin(perpAngle) * sideStepSpeed;
            }
          }

          // Advanced enemies get simpler but effective patterns
          if (this instanceof EnemyAdvanced) {
            // Periodic speed adjustments
            const speedInterval = 2000; // 2 seconds
            if (time % speedInterval < 1000) {
              // 1 second faster
              this.sprite.body.velocity.x *= 1.3;
              this.sprite.body.velocity.y *= 1.3;
            }
          }
        };

        // Set up movement update
        enemy.sprite.update = function (time, delta) {
          enemy.updateMovement(time, delta);
        };

        this.enemies.push(enemy);
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
    this.showWastedScreen = () => {
      if (this.gameState.isGameOver) return;

      console.log("Posting game stats with precise time:", {
        timeAlive: this.gameState.finalTimeAlive,
        timeAliveMS: this.gameState.finalTimeAliveMS,
      });

      fetch("/api/game-over", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gold: this.gameState.gold,
          kills: this.gameState.kills,
          waveNumber: this.gameState.waveNumber,
          timeAlive: this.gameState.finalTimeAlive || (Date.now() - this.gameState.gameStartTime) / 1000,
          timeAliveMS: this.gameState.finalTimeAliveMS,
          timestamp: new Date().toISOString(),
          userAddress: this.userInfo.userAddress,
          username: this.userInfo.username,
          profileImage: this.userInfo.profileImage,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Game over response:", data);
          // Invalidate the query after successful POST
          if (this.userInfo.invalidateQueries) {
            this.userInfo.invalidateQueries();
          }
        })
        .catch((error) => console.error("Error posting game stats:", error));

      this.gameState.isGameOver = true;
      this.wastedOverlay.setVisible(true);

      // Slow down time
      this.time.timeScale = 0.5;

      // Fade in black overlay
      this.tweens.add({
        targets: this.wastedOverlay.getAt(0),
        alpha: 0.5,
        duration: 1000,
        ease: "Power2",
      });

      // Fade in and scale up WASTED text
      const wastedText = this.wastedOverlay.getAt(1);
      wastedText.setScale(0.5);
      this.tweens.add({
        targets: wastedText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 1000,
        ease: "Power2",
      });

      // Add "Click anywhere or press WASD/Arrow keys to restart" text
      const restartText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 100,
        "Click anywhere or press WASD/Arrow keys to restart",
        {
          fontFamily: "VT323",
          fontSize: "24px",
          color: "#FFFFFF",
          stroke: "#000000",
          strokeThickness: 2,
          align: "center",
        }
      );
      restartText.setOrigin(0.5);
      restartText.setAlpha(0);
      restartText.setScrollFactor(0);
      this.wastedOverlay.add(restartText);

      // Make text pulse slightly
      this.tweens.add({
        targets: restartText,
        alpha: { from: 0, to: 1 },
        duration: 1000,
        delay: 500,
        ease: "Power2",
        onComplete: () => {
          this.tweens.add({
            targets: restartText,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
          });
        },
      });

      // Function to restart the game
      const restartGame = () => {
        // Remove all event listeners
        this.input.keyboard.off("keydown", keyHandler);
        this.input.off("pointerdown", restartGame);

        // Reset time scale
        this.time.timeScale = 1;

        // Stop all tweens
        this.tweens.killAll();

        // Restart the scene
        this.scene.restart();
      };

      // Keyboard handler for WASD and Arrow keys
      const keyHandler = (event) => {
        const key = event.key.toUpperCase();
        // Check for WASD or Arrow keys
        if (["W", "A", "S", "D", "ARROWUP", "ARROWLEFT", "ARROWDOWN", "ARROWRIGHT"].includes(key)) {
          restartGame();
        }
      };

      // Add input listeners after a short delay to prevent accidental restarts
      this.time.delayedCall(500, () => {
        // Add keyboard listener
        this.input.keyboard.on("keydown", keyHandler);

        // Add mouse click listener for the entire game window
        this.input.on("pointerdown", restartGame);
      });
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
      delay: 16, // Update roughly every frame (60fps)
      callback: () => {
        if (this.gameState.gameStartTime && !this.gameState.gameEndTime) {
          const currentTime = Date.now();
          const elapsedMS = currentTime - this.gameState.gameStartTime;
          this.gameState.gameTimer = Math.floor(elapsedMS / 1000);
          this.gameState.finalTimeAliveMS = elapsedMS;

          // Update timer display with milliseconds
          const minutes = Math.floor(this.gameState.gameTimer / 60);
          const seconds = Math.floor(this.gameState.gameTimer % 60);
          const ms = Math.floor((elapsedMS % 1000) / 10); // Get centiseconds (2 decimal places)
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
          this.gameState.gameEndTime = Date.now();
          const elapsedMS = this.gameState.gameEndTime - this.gameState.gameStartTime;
          this.gameState.finalTimeAliveMS = elapsedMS;
          this.gameState.finalTimeAlive = elapsedMS / 1000; // Store as seconds with decimal

          console.log("Player died! Precise time:", {
            timeAliveSeconds: this.gameState.finalTimeAlive,
            timeAliveMS: this.gameState.finalTimeAliveMS,
            startTime: this.gameState.gameStartTime,
            endTime: this.gameState.gameEndTime,
          });
        }
      };
    }
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
    if (this.coins) {
      this.coins.forEach((coin) => coin.update(this.player));
    }

    // Update XP gems
    if (this.xpGems) {
      this.xpGems.forEach((gem) => gem.update(this.player));
    }

    // Update all enemies with screen check optimization
    if (this.enemies) {
      this.enemies.forEach((enemy, index) => {
        if (enemy && enemy.sprite && !enemy.isDead && typeof enemy.update === "function") {
          try {
            // Only perform full update if enemy is on screen
            const onScreen = isOnScreen(enemy.sprite);
            if (onScreen) {
              enemy.update(time, delta);
            } else {
              // Minimal update for off-screen enemies
              enemy.updateOffScreen(time, delta);
            }
          } catch (error) {
            console.error("Error updating enemy:", error);
            enemy.isDead = true;
          }
        }

        // Remove dead enemies or enemies without sprites
        if (enemy && (enemy.isDead || !enemy.sprite)) {
          if (enemy.sprite) {
            enemy.sprite.destroy();
          }
          this.enemies[index] = null;
        }
      });

      // Clean up null entries
      this.enemies = this.enemies.filter((enemy) => enemy !== null && enemy.sprite);
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
});

export default function Game() {
  const { ready, user } = usePrivy();
  const userAddress = user?.wallet?.address;
  const username = user?.twitter?.username;
  const gameRef = useRef(null);
  const queryClient = useQueryClient(); // Get the query client

  useEffect(() => {
    if (!ready || !userAddress || !username) return;

    if (typeof window !== "undefined" && window.Phaser) {
      const userInfo = {
        userAddress: user.wallet.address,
        username: user.twitter.username,
        profileImage: user.twitter.profilePictureUrl,
        // Add the invalidate function to userInfo
        invalidateQueries: () => {
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["memberCount"] });
          queryClient.invalidateQueries({ queryKey: ["gameTotalPlays"] });
          queryClient.invalidateQueries({ queryKey: ["nfts"] });
        },
      };

      // Create a custom scene class that includes the user info
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

      const game = new Phaser.Game(config);

      return () => {
        game.destroy(true);
      };
    }
  }, [ready, user, userAddress, username]);

  if (!ready || !userAddress || !username) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-transparent">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-transparent rounded-xl w-fit h-fit">
      <div ref={gameRef} className="w-[800px] h-[600px] bg-transparent rounded-xl" />
    </div>
  );
}
