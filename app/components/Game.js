'use client';

import { useEffect, useRef } from 'react';
import MainPlayer from '../game/entities/MainPlayer';
import EnemyBasic from '../game/entities/EnemyBasic';
import { RotatingDogWeapon } from '../game/entities/weapons/RotatingDogWeapon';
import { MagicWandWeapon } from '../game/entities/weapons/MagicWandWeapon';
import { GlizzyBlasterWeapon } from '../game/entities/weapons/GlizzyBlasterWeapon';
import FlyingAxeWeapon from '../game/entities/weapons/FlyingAxeWeapon';
import SonicBoomHammer from '../game/entities/weapons/SonicBoomHammer';
import { MilkWeapon } from '../game/entities/weapons/MilkWeapon';

const MenuScene = {
  key: 'MenuScene',
  create: function() {
    const { width, height } = this.scale;

    // Create a simple background
    const background = this.add.graphics();
    background.fillGradientStyle(0x000033, 0x000033, 0x000066, 0x000066, 1);
    background.fillRect(0, 0, width, height);

    // Add title text
    this.add.text(width / 2, height / 3, 'KIZUNA\nSURVIVORS', {
      fontFamily: 'VT323',
      fontSize: '64px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Add start text
    const startText = this.add.text(width / 2, height * 0.6, 'Click or Press Movement Keys to Start', {
      fontFamily: 'VT323',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add blinking effect
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      hold: 400
    });

    // Handle click
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Handle keyboard input
    const startGame = () => this.scene.start('GameScene');
    
    // Add key listeners
    this.input.keyboard.addKey('W').on('down', startGame);
    this.input.keyboard.addKey('A').on('down', startGame);
    this.input.keyboard.addKey('S').on('down', startGame);
    this.input.keyboard.addKey('D').on('down', startGame);
    this.input.keyboard.addKey('UP').on('down', startGame);
    this.input.keyboard.addKey('LEFT').on('down', startGame);
    this.input.keyboard.addKey('DOWN').on('down', startGame);
    this.input.keyboard.addKey('RIGHT').on('down', startGame);
  }
};

const GameScene = {
  key: 'GameScene',

  init: function() {
    // Initialize game state
    this.gameState = {
      timerStarted: false,
      gameTimer: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      kills: 0,
      selectedWeaponIndex: 0
    };

    // Bind methods to this scene
    this.gainXP = (amount) => {
      if (this.player) {
        this.player.gainXP(amount);
      }
    };

    this.updateXPBar = () => {
      const progress = this.gameState.xp / this.gameState.xpToNextLevel;
      const xpBarWidth = this.scale.width - 40;
      const fillWidth = (xpBarWidth - 4);
      
      this.xpBarFill.clear();
      this.xpBarFill.fillStyle(0x4444ff, 0.8);
      this.xpBarFill.fillRect(22, 22, progress * fillWidth, 16);
      this.xpText.setText(`Level ${this.gameState.level} (${this.gameState.xp}/${this.gameState.xpToNextLevel} XP)`);
    };

    this.weaponInitialized = false;
    this.enemies = this.add.group();
    this.projectiles = this.add.group();
    this.score = 0;
    this.gameOver = false;
  },

  preload: function() {
    // Load player sprite
    this.load.svg('player', '/assets/game/characters/player.svg', {
      scale: 0.1
    });

    // Load enemy sprites
    this.load.svg('enemy-basic-one', '/assets/game/characters/enemies-basic/basic-one.svg');
    this.load.svg('enemy-basic-two', '/assets/game/characters/enemies-basic/basic-two.svg');
    this.load.svg('enemy-basic-three', '/assets/game/characters/enemies-basic/basic-three.svg');
    this.load.svg('enemy-basic-four', '/assets/game/characters/enemies-basic/basic-four.svg');
    this.load.svg('enemy-basic-five', '/assets/game/characters/enemies-basic/basic-five.svg');
    this.load.svg('enemy-basic-six', '/assets/game/characters/enemies-basic/basic-six.svg');

    // Load weapon sprites
    this.load.svg('weapon-dog-projectile', '/assets/game/weapons/weapon-dog-projectile.svg', {
      scale: 0.5
    });
    this.load.svg('weapon-wand-icon', '/assets/game/weapons/weapon-wand-icon.svg', {
      scale: 0.5
    });
    this.load.svg('weapon-wand-projectile', '/assets/game/weapons/weapon-wand-projectile.svg', {
      scale: 0.5
    });
    this.load.svg('weapon-hotdog-projectile', '/assets/game/weapons/weapon-hotdog-projectile.svg', {
      scale: 0.5
    });
    this.load.svg('weapon-axe-projectile', '/assets/game/weapons/weapon-axe-projectile.svg', {
      scale: 0.5
    });
    this.load.svg('weapon-hammer-projectile', '/assets/game/weapons/weapon-hammer-projectile.svg', {
      scale: 0.5
    });
    this.load.svg('weapon-magic-milk', '/assets/game/weapons/weapon-magic-milk.svg', {
      scale: 0.5
    });
  },

  create: function() {
    const { width, height } = this.scale;

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
    bounds.lineStyle(6, 0x333333, 1);  // Thicker, dark gray lines
    
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
    const xpBarWidth = width - 40;  // 20px padding on each side
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
    this.xpText = this.add.text(width/2, xpBarY + xpBarHeight/2, '', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    uiContainer.add(this.xpText);

    // Initialize XP bar display
    this.updateXPBar();

    // Timer position (moved up, 15px below XP bar)
    const timerY = xpBarY + xpBarHeight + 15;
    this.timerText = this.add.text(width/2, timerY, '00:00', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5, 0);
    uiContainer.add(this.timerText);

    // Create main UI row (adjusted padding below timer)
    const uiRowY = timerY + 40;

    // 1. Weapon/Upgrade Grid (Left with more padding)
    const gridCellSize = 40;
    const gridRows = 2;
    const gridCols = 6;
    const gridWidth = gridCellSize * gridCols;
    const gridHeight = gridCellSize * gridRows;
    const gridX = 40;  // Increased from 20 to 40 for more left padding

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
    let weaponIcon = null;  // Store icon reference
    let wandIcon = null;    // Store wand icon reference
    let glizzyIcon = null;  // Store glizzy icon reference
    let axeIcon = null;     // Store axe icon reference
    let hammerIcon = null;  // Store hammer icon reference
    let milkIcon = null;   // Store milk icon reference
    for(let row = 0; row < gridRows; row++) {
      for(let col = 0; col < gridCols; col++) {
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
        cell.setInteractive({ useHandCursor: true })
            .setDepth(1001) // Higher than UI container to ensure clickability
            .setScrollFactor(0); // Ensure it doesn't move with camera
        
        // Make cell interactive
        cell.on('pointerdown', () => {
          // Only process clicks for cells with weapons
          if (cellIndex === 0 || cellIndex === 1 || cellIndex === 2 || cellIndex === 3 || cellIndex === 4 || cellIndex === 5) {
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
            'weapon-dog-projectile',
            0,
            gridCells
          );
        }
        
        // Add wand weapon icon to second cell
        if (row === 0 && col === 1) {
          wandIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            'weapon-wand-icon',
            1,
            gridCells
          );
        }

        // Add Glizzy Blaster icon to third cell
        if (row === 0 && col === 2) {
          glizzyIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            'weapon-hotdog-projectile',
            2,
            gridCells
          );
        }

        // Add axe icon to fourth cell
        if (row === 0 && col === 3) {
          axeIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            'weapon-axe-projectile',
            3,
            gridCells
          );
        }

        // Add hammer icon to fifth cell
        if (row === 0 && col === 4) {
          hammerIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            'weapon-hammer-projectile',
            4,
            gridCells
          );
        }

        // Add milk icon to sixth cell
        if (row === 0 && col === 5) {
          milkIcon = createWeaponIcon(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            'weapon-magic-milk',
            5,
            gridCells
          );
          // Initialize milk weapon when icon is clicked
          milkIcon.setInteractive();
          milkIcon.on('pointerdown', () => {
            // Just select the milk weapon (index 5)
            this.gameState.selectedWeaponIndex = 5;
            
            // Update all cell borders
            gridCells.forEach((c, i) => {
              c.setStrokeStyle(2, i === 5 ? 0xffffff : 0x666666);
            });
            
            this.updateStatsDisplay();
          });
        }
      }
    }

    // 2. Stats (Right)
    const statsX = width - 20;  // 20px from right edge
    this.goldText = this.add.text(statsX, uiRowY + 10, 'Gold: 0', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffdd00'
    }).setOrigin(1, 0);
    uiContainer.add(this.goldText);

    this.killsText = this.add.text(statsX, uiRowY + 40, 'Kills: 0', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ff4444'
    }).setOrigin(1, 0);
    uiContainer.add(this.killsText);

    // Controls text (right side, below stats)
    const controlsText = this.add.text(statsX, uiRowY + 80, 'ESC - Back to Menu', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(1, 0);
    uiContainer.add(controlsText);

    const controlsText2 = this.add.text(statsX, uiRowY + 104, 'Move: Arrow Keys / WASD', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(1, 0);
    uiContainer.add(controlsText2);

    // Stats display (below controls)
    const statsStyle = {
      fontFamily: 'VT323',
      fontSize: '20px',
      color: '#4444ff'
    };

    // Add header for stats
    const statsHeader = this.add.text(statsX, uiRowY + 144, '--- Player Stats ---', {
      ...statsStyle,
      color: '#ffffff'
    }).setOrigin(1, 0);
    uiContainer.add(statsHeader);

    // Create stats text objects
    this.statsTexts = {
      health: this.add.text(statsX, uiRowY + 170, '', statsStyle).setOrigin(1, 0),
      attack: this.add.text(statsX, uiRowY + 192, '', statsStyle).setOrigin(1, 0),
      defense: this.add.text(statsX, uiRowY + 214, '', statsStyle).setOrigin(1, 0),
      speed: this.add.text(statsX, uiRowY + 236, '', statsStyle).setOrigin(1, 0)
    };

    // Add stats text to UI container
    uiContainer.add(Object.values(this.statsTexts));

    // Function to update stats display
    this.updateStatsDisplay = () => {
      if (!this.player) return;
      
      const stats = this.player.stats;
      console.log('Current selectedWeaponIndex:', this.gameState.selectedWeaponIndex);
      console.log('Available weapons:', this.weapons.length);
      console.log('Weapons array:', this.weapons.map(w => w.constructor.name));
      
      const selectedWeapon = this.weapons[this.gameState.selectedWeaponIndex];
      console.log('Selected weapon:', selectedWeapon);
      
      // Base stats
      let displayStats = {
        health: `HP: ${stats.currentHealth}/${stats.maxHealth}`,
        attack: `ATK: ${stats.damage.toFixed(1)}`,
        defense: `DEF: ${stats.defense.toFixed(1)}`,
        speed: `SPD: ${stats.moveSpeed.toFixed(1)}`
      };
      
      // Add weapon-specific stats if a weapon is selected
      if (selectedWeapon) {
        if (selectedWeapon.stats) {
          const weaponStats = selectedWeapon.stats;
          const levelConfig = selectedWeapon.levelConfigs ? 
            selectedWeapon.levelConfigs[selectedWeapon.currentLevel] : null;
          
          // Use level-specific stats if available, otherwise use base stats
          const currentDamage = levelConfig ? levelConfig.damage : weaponStats.damage;
          const currentPierce = levelConfig ? levelConfig.pierce : weaponStats.pierce;
          const currentCooldown = levelConfig ? levelConfig.cooldown : weaponStats.cooldown;
          
          displayStats.attack = `ATK: ${(stats.damage + currentDamage).toFixed(1)}`;
          displayStats.attack += ` Pierce: ${currentPierce}`;
          if (currentCooldown) {
            displayStats.attack += ` (${(1000/currentCooldown).toFixed(1)}/s)`;
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



    // Create trail effect container
    this.trailContainer = this.add.container(0, 0);

    // Create player with physics and pass trail container
    this.player = new MainPlayer(this, width / 2, height / 2, 'player', {
      trailContainer: this.trailContainer,
      scale: 1,
      spriteKey: 'player'
    });

    // Initialize weapon system - this is needed for selectable weapons grid
    console.log('Initializing weapon system...');
    this.weapons = [
      new RotatingDogWeapon(this, this.player),
      new MagicWandWeapon(this, this.player),
      new GlizzyBlasterWeapon(this, this.player),
      new FlyingAxeWeapon(this, this.player),
      new SonicBoomHammer(this, this.player),
      new MilkWeapon(this, this.player)
    ];
    
    this.weaponInitialized = true;
    console.log('Weapon system initialized with weapons:', this.weapons.map(w => w.constructor.name));

    // Create new debug text with smaller font and transparent background
    const debugConfig = {
      fontFamily: 'VT323',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 5, y: 3 },
      lineSpacing: 3
    };

    // Position below the existing inventory grid
    const gridBottom = uiRowY + (gridRows * gridCellSize);
    this.debugText = this.add.text(
      gridX,  // Same X as inventory grid
      gridBottom + 10, // 10px spacing below grid
      'Initializing debug...',
      debugConfig
    )
    .setScrollFactor(0)
    .setDepth(9999)
    .setOrigin(0, 0)
    .setAlpha(0.8);
    uiContainer.add(this.debugText);

    // Create array to store enemies
    this.enemies = [];
    
    // Function to show damage numbers
    this.showDamageNumber = (x, y, amount) => {
      const damageText = this.add.text(x, y, amount, {
        fontFamily: 'VT323',
        fontSize: '24px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5, 0.5);

      // Animate the damage number
      this.tweens.add({
        targets: damageText,
        y: y - 50, // Float upward
        alpha: 0,  // Fade out
        duration: 1000,
        ease: 'Cubic.out',
        onComplete: () => {
          damageText.destroy();
        }
      });
    };

    // Enemy sprite keys
    const enemySprites = [
      'enemy-basic-one',
      'enemy-basic-two',
      'enemy-basic-three',
      'enemy-basic-four',
      'enemy-basic-five',
      'enemy-basic-six'
    ];

    // Spawn 20 random enemies at random positions
    for (let i = 0; i < 50; i++) {
      // Get random position within world bounds
      const randomX = Phaser.Math.Between(100, worldWidth - 100);
      const randomY = Phaser.Math.Between(100, worldHeight - 100);
      
      // Get random enemy sprite
      const randomSprite = enemySprites[Phaser.Math.Between(0, enemySprites.length - 1)];
      
      // Create enemy
      const enemy = new EnemyBasic(this, randomX, randomY, randomSprite, {
        type: 'basic',
        scale: 0.3
      });

      // Listen for enemy death
      enemy.sprite.once('destroy', () => {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
          this.enemies.splice(index, 1);
        }
      });
      
      this.enemies.push(enemy);
    }

    // Listen for XP events
    this.events.on('playerXPGained', (data) => {
      this.gameState.xp = data.current;
      this.gameState.level = data.level;
      this.gameState.xpToNextLevel = data.toNext;
      this.updateXPBar();
    });

    // Listen for level up events to update stats
    this.events.on('playerLevelUp', (level) => {
      this.updateStatsDisplay();
      
      // Level up weapons when player levels up
      if (this.weapons && this.weapons.length > 0) {
        this.weapons.forEach(weapon => {
          if (weapon.levelUp) {
            weapon.levelUp();
          }
        });
      }
    });

    // Add spacebar XP debug handler
    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.gainXP(50);
    }, this);

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
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Handle ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  },

  update: function(time, delta) {
    if (!this.gameState) return;

    // Handle player movement using the new system
    const input = {
      left: this.cursors.left.isDown || this.wasd.left.isDown,
      right: this.cursors.right.isDown || this.wasd.right.isDown,
      up: this.cursors.up.isDown || this.wasd.up.isDown,
      down: this.cursors.down.isDown || this.wasd.down.isDown
    };

    if (this.player) {
      this.player.handleMovement(input);
    }

    // Update debug text first
    if (this.debugText && this.player && this.weapons) {
      try {
        const weapon = this.weapons[this.gameState.selectedWeaponIndex];
        const stats = weapon?.stats || {};
        const text = [
          `Position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
          `Active Weapons: ${this.weapons.length}`,
          `Weapon Stats:`,
          `  Level: ${weapon?.currentLevel || 1}/${weapon?.maxLevel || 8}`,
          `  Damage: ${stats.damage || 0}`,
          `  Pierce: ${stats.pierce || 0}`,
          `  Range: ${stats.range || 0}`,
          `  Speed: ${stats.speed || 0}`,
          ...(stats.magicPower ? [
            `  Magic Power: ${stats.magicPower}`,
            `  Critical Chance: ${Math.round(stats.criticalChance * 100)}%`,
            `  Elemental Damage: ${stats.elementalDamage}`
          ] : []),
          `FPS: ${Math.round(1000 / delta)}`,
          `Time: ${Math.round(time / 1000)}s`
        ].join('\n');

        this.debugText.setText(text);
      } catch (error) {
        console.error('Error updating debug text:', error);
      }
    }

    // Update all enemies
    if (this.enemies) {
      this.enemies.forEach((enemy, index) => {
        if (enemy && enemy.update) {
          try {
            enemy.update(time, delta);
            
            // Remove dead enemies
            if (enemy.isDead) {
              enemy.sprite.destroy();
              this.enemies[index] = null;
            }
          } catch (error) {
            console.error('Error updating enemy:', error);
          }
        }
      });
      
      // Clean up null entries
      this.enemies = this.enemies.filter(enemy => enemy !== null);
    }

    // Update all weapons with explicit debug
    if (this.weapons && this.weapons.length > 0) {
      this.weapons.forEach((weapon, index) => {
        if (weapon && typeof weapon.update === 'function') {
          try {
            weapon.update(time, delta);
          } catch (error) {
            console.error(`Error updating weapon ${index}:`, error);
          }
        }
      });
    }

    // Check for timer start
    if ((this.cursors.left.isDown || this.cursors.right.isDown || 
         this.cursors.up.isDown || this.cursors.down.isDown || 
         this.wasd.left.isDown || this.wasd.right.isDown || 
         this.wasd.up.isDown || this.wasd.down.isDown) && 
        !this.gameState.timerStarted) {
      console.log('Starting timer...'); // Debug log
      this.gameState.timerStarted = true;
      
      // Clear any existing timer
      if (this.timerEvent) {
        this.timerEvent.remove();
      }
      
      // Create new timer
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (!this.gameState.timerStarted || this.gameState.gameTimer >= 1800) return;  // 30 minutes = 1800 seconds
  
          this.gameState.gameTimer++;
          const minutes = Math.floor(this.gameState.gameTimer / 60);
          const seconds = this.gameState.gameTimer % 60;
          this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          
          console.log('Timer updated:', this.gameState.gameTimer); // Debug log
        },
        callbackScope: this,
        loop: true
      });
    }

    // Update player with movement input
    if (this.player) {
      this.player.update();
    }
  }
};

export default function Game() {
  const gameRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Phaser) {
      const config = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: 800,
        height: 600,
        backgroundColor: '#000000',
        pixelArt: true,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        input: {
          activePointers: 1,
          pixelPerfect: true
        },
        scene: [MenuScene, GameScene]
      };

      const game = new Phaser.Game(config);

      return () => {
        game.destroy(true);
      };
    }
  }, []);

  return (
    <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
      <div 
        ref={gameRef}
        className="w-[800px] h-[600px] bg-black border-2 border-white"
      />
    </div>
  );
}
