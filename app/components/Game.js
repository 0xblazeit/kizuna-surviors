'use client';

import { useEffect, useRef } from 'react';
import MainPlayer from '../game/entities/MainPlayer';
import Enemy from '../game/entities/Enemy';
import { weapons } from '../game/config/weapons';
import Weapon from '../game/weapons/Weapon';

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

  preload: function() {
    // Load player sprite
    this.load.svg('player', '/assets/game/characters/player.svg', {
      scale: 0.1
    });

    // Load enemy sprite
    this.load.svg('enemy', '/assets/game/enemy.svg');

    // Load weapon sprite
    this.load.svg('hotdog', '/assets/game/weapons/weapon-hotdog-projectile.svg', {
      scale: 0.1
    });

    // Load weapon icons
    this.load.svg('hotdog-icon', '/assets/game/weapons/weapon-hotdog-icon.svg', {
      scale: 0.1
    });
  },

  init: function() {
    // Initialize game state
    this.gameState = {
      timerStarted: false,
      gameTimer: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      kills: 0
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
  },

  create: function() {
    const { width, height } = this.scale;

    // Enable physics with proper world bounds
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

    // Add world bounds visualization
    const bounds = this.add.graphics();
    bounds.lineStyle(4, 0x4444ff, 0.5);  // Thicker, semi-transparent blue lines

    // Draw world bounds
    bounds.strokeRect(0, 0, worldWidth, worldHeight);

    // Set up camera
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setZoom(1);
    
    // Create player
    this.player = new MainPlayer(this, width / 2, height / 2);
    
    // Make camera follow player with deadzone
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    // Create weapon for player
    this.player.weapon = new Weapon(this, this.player);

    // Listen for XP events
    this.events.on('playerXPGained', (data) => {
      this.gameState.xp = data.current;
      this.gameState.level = data.level;
      this.gameState.xpToNextLevel = data.toNext;
      this.updateXPBar();
    });

    // Add spacebar XP debug handler
    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.gainXP(50);
    }, this);

    // Create UI Container that stays fixed to camera
    const uiContainer = this.add.container(0, 0);
    uiContainer.setScrollFactor(0);

    // XP Progress Bar (at top of screen)
    const xpBarWidth = width - 40;  // 20px padding on each side
    const xpBarHeight = 20;
    const xpBarY = 20;

    // XP Bar background
    const xpBarBg = this.add.rectangle(20, xpBarY, xpBarWidth, xpBarHeight, 0x000000);
    xpBarBg.setOrigin(0, 0);
    xpBarBg.setStrokeStyle(2, 0x666666);
    
    // XP Bar fill using graphics
    this.xpBarFill = this.add.graphics();

    // XP Text
    this.xpText = this.add.text(width/2, xpBarY + xpBarHeight/2, '', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // Initialize XP bar display
    this.updateXPBar();

    // Timer position (moved up, 15px below XP bar)
    const timerY = xpBarY + xpBarHeight + 15;
    this.timerText = this.add.text(width/2, timerY, '00:00', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    // Create main UI row (adjusted padding below timer)
    const uiRowY = timerY + 40;

    // 1. Weapon/Upgrade Grid (Left with more padding)
    const gridCellSize = 40;
    const gridRows = 2;
    const gridCols = 6;
    const gridWidth = gridCellSize * gridCols;
    const gridHeight = gridCellSize * gridRows;
    const gridX = 40;  // Increased from 20 to 40 for more left padding

    // Create grid cells and store them in an array
    const gridCells = [];
    for(let row = 0; row < gridRows; row++) {
      for(let col = 0; col < gridCols; col++) {
        const cell = this.add.rectangle(
          gridX + col * gridCellSize,
          uiRowY + row * gridCellSize,
          gridCellSize - 4,
          gridCellSize - 4,
          0x000000
        );
        cell.setStrokeStyle(2, 0x666666);
        cell.setScrollFactor(0);  // Fix cell to screen
        gridCells.push(cell);
        
        // Add hotdog icon to first slot
        if (row === 0 && col === 0) {
          const icon = this.add.image(
            gridX + col * gridCellSize,
            uiRowY + row * gridCellSize,
            'hotdog-icon'
          );
          icon.setDisplaySize(gridCellSize - 8, gridCellSize - 8);
          icon.setScrollFactor(0);  // Fix icon to screen
        }
      }
    }

    // Add debug stats menu closer to grid
    const debugMenuY = uiRowY + gridHeight + 5; // Close to grid
    
    // Add semi-transparent background for stats
    const statsBackground = this.add.rectangle(
      gridX + 100, // Center x (adjusted for text width)
      debugMenuY + 110, // Center y (adjusted for text height)
      210, // Width to cover text
      210, // Height to cover text
      0x000000, // Black background
      0.6 // 60% opacity
    ).setScrollFactor(0);
    
    this.statsText = this.add.text(gridX, debugMenuY, '', {
      fontFamily: 'VT323',
      fontSize: '14px',
      color: '#ffffff',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0);

    // Update stats text initially
    if (this.player) {
      const stats = this.player.stats;
      const exp = this.player.experience;
      const currentWeapon = 'Hotdog'; // TODO: Update this when weapon system is implemented

      const statsString = [
        `Weapon: ${currentWeapon}`,
        `Level: ${exp.level} (${exp.current}/${exp.toNext} XP)`,
        `HP: ${stats.health}/${stats.maxHealth}`,
        `Defense: ${stats.defense}`,
        `Speed: ${stats.speed}`
      ].join('\n');

      this.statsText.setText(statsString);
    }

    // Add control instructions with more padding below the stats text
    const controlsY = debugMenuY + 220; // Increased padding to accommodate larger stats menu
    const controlsText = this.add.text(gridX, controlsY, 
      'ESC - Controls\n' +
      'WASD/Arrow Keys - Move', {
      fontFamily: 'VT323',
      fontSize: '16px',
      color: '#888888'
    }).setScrollFactor(0);

    // 2. Stats (Right)
    const statsX = width - 20;  // 20px from right edge
    this.goldText = this.add.text(statsX, uiRowY + 10, 'Gold: 0', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffdd00'
    }).setOrigin(1, 0);

    this.killsText = this.add.text(statsX, uiRowY + 40, 'Kills: 0', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ff4444'
    }).setOrigin(1, 0);

    // Add all UI elements to the container
    uiContainer.add([
      xpBarBg, this.xpBarFill, this.xpText,
      ...gridCells,
      this.timerText, this.goldText, this.killsText,
      statsBackground, // Add background before text so it appears behind
      this.statsText,
      controlsText
    ]);

    // Create trail effect container
    this.trailContainer = this.add.container(0, 0);

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

    // Enable collisions between projectiles and world bounds
    this.physics.world.on('worldbounds', (body) => {
      const gameObject = body.gameObject;
      if (gameObject instanceof Projectile) {
        gameObject.destroy();
      }
    });

    // Create debug text for world position
    this.debugText = this.add.text(16, 600 - 40, '', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setScrollFactor(0);
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
      
      // Update weapon firing
      if (this.player.weapon) {
        this.player.weapon.update(time);
      }
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

    // Update debug stats
    if (this.player && this.statsText) {
      const stats = this.player.stats;
      const exp = this.player.experience;
      const weaponLevel = Math.min(exp.level - 1, 5); // Max level 5
      const weaponStats = weapons.hotdog.levels[weaponLevel];

      const statsString = [
        `Weapon: Hot Dog Launcher (Lvl ${weaponLevel})`,
        `├ Damage: ${weaponStats.damage}`,
        `├ Fire Rate: ${(1000/weaponStats.fireSpeed).toFixed(1)}/s`,
        `├ Projectiles: ${weaponStats.count}`,
        `├ Size: ${weaponStats.projectileSize.toFixed(1)}x`,
        `├ Pierce: ${weaponStats.pierce}`,
        `└ Special: ${weaponStats.special || 'None'}`,
        ``,
        `Level: ${exp.level} (${exp.current}/${exp.toNext} XP)`,
        `HP: ${stats.health}/${stats.maxHealth}`,
        `Defense: ${stats.defense}`,
        `Speed: ${stats.speed}`
      ].join('\n');

      this.statsText.setText(statsString);
    }

    // Update debug text with world position
    if (this.debugText) {
        this.debugText.setText(
            `Position: x: ${Math.round(this.player.x)}, y: ${Math.round(this.player.y)}`
        );
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
        physics: {
          default: 'arcade',
          arcade: {
            debug: false
          }
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
