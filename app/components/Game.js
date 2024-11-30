'use client';

import { useEffect, useRef } from 'react';
import MainPlayer from '../game/entities/MainPlayer';

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
        gridCells.push(cell);
      }
    }

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

    // Controls text (right side, below stats)
    const controlsText = this.add.text(statsX, uiRowY + 80, 'ESC - Back to Menu', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(1, 0);

    const controlsText2 = this.add.text(statsX, uiRowY + 104, 'Move: Arrow Keys / WASD', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(1, 0);

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

    // Create stats text objects
    this.statsTexts = {
      health: this.add.text(statsX, uiRowY + 170, '', statsStyle).setOrigin(1, 0),
      attack: this.add.text(statsX, uiRowY + 192, '', statsStyle).setOrigin(1, 0),
      defense: this.add.text(statsX, uiRowY + 214, '', statsStyle).setOrigin(1, 0),
      speed: this.add.text(statsX, uiRowY + 236, '', statsStyle).setOrigin(1, 0)
    };

    // Function to update stats display
    this.updateStatsDisplay = () => {
      if (!this.player) return;
      
      const stats = this.player.stats;
      this.statsTexts.health.setText(`HP: ${stats.currentHealth}/${stats.maxHealth}`);
      this.statsTexts.attack.setText(`ATK: ${stats.damage}`);
      this.statsTexts.defense.setText(`DEF: ${stats.defense}`);
      this.statsTexts.speed.setText(`SPD: ${Math.round(stats.moveSpeed)}`);
    };

    // Add all UI elements to the container
    uiContainer.add([
      xpBarBg, this.xpBarFill, this.xpText,
      ...gridCells,
      this.timerText, this.goldText, this.killsText,
      controlsText, controlsText2, statsHeader,
      ...Object.values(this.statsTexts)
    ]);

    // Create trail effect container
    this.trailContainer = this.add.container(0, 0);

    // Create player with physics and pass trail container
    this.player = new MainPlayer(this, width / 2, height / 2, 'player', {
      trailContainer: this.trailContainer,
      scale: 1,
      spriteKey: 'player'
    });

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
    });

    // Add spacebar XP debug handler
    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.gainXP(50);
    }, this);

    // Setup camera to follow player
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);

    // Initialize stats display
    this.updateStatsDisplay();

    // Add position debug text (make it fixed to camera)
    this.debugText = this.add.text(16, height - 40, '', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setScrollFactor(0);

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

  update: function() {
    if (!this.gameState) return;

    // Handle player movement using the new system
    const input = {
      left: this.cursors.left.isDown || this.wasd.left.isDown,
      right: this.cursors.right.isDown || this.wasd.right.isDown,
      up: this.cursors.up.isDown || this.wasd.up.isDown,
      down: this.cursors.down.isDown || this.wasd.down.isDown
    };
    
    this.player.handleMovement(input);

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

    // Update debug text with world position
    this.debugText.setText(
      `Position: x: ${Math.round(this.player.x)}, y: ${Math.round(this.player.y)}`
    );
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
            debug: true
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
