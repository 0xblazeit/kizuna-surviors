'use client';

import { useEffect, useRef } from 'react';

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
    const startText = this.add.text(width / 2, height * 0.6, 'Click to Start', {
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
  }
};

const GameScene = {
  key: 'GameScene',
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

    // Initialize game state
    this.gameState = {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      kills: 0,
      gameTimer: 0
    };

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
    
    // XP Bar fill
    this.xpBarFill = this.add.rectangle(22, xpBarY + 2, 0, xpBarHeight - 4, 0x4444ff);
    this.xpBarFill.setOrigin(0, 0);

    // XP Text
    this.xpText = this.add.text(width/2, xpBarY + xpBarHeight/2, 'Level 1 - 0/100 XP', {
      fontFamily: 'VT323',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // Create main UI row (below XP bar with more padding)
    const uiRowY = xpBarY + xpBarHeight + 40;  // Increased from 20 to 40

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

    // 2. Timer (Middle) - Adjust Y position to match new grid position
    this.timerText = this.add.text(width/2, uiRowY + gridHeight/2, '0:00', {
      fontFamily: 'VT323',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 3. Stats (Right)
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
      ...gridCells,  // Add all grid cells to the container
      this.timerText, this.goldText, this.killsText
    ]);

    // Start the game timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    // Create player with physics
    this.player = this.add.circle(width / 2, height / 2, 20, 0x00ff00);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    
    // Setup camera to follow player
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);

    // Add position debug text (make it fixed to camera)
    this.debugText = this.add.text(16, height - 40, '', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setScrollFactor(0);

    // Add controls text (fixed to camera)
    this.add.text(16, 16, 'ESC - Back to Menu', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setScrollFactor(0);

    this.add.text(16, 48, 'Controls: Arrow Keys / WASD', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    }).setScrollFactor(0);

    // Add world bounds text (fixed to camera)
    this.add.text(16, 80, `World Size: ${worldWidth}x${worldHeight}`, {
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
    this.player.moveSpeed = 5;

    // Handle ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  },

  updateTimer: function() {
    if (this.gameState.gameTimer < 30) {
      this.gameState.gameTimer++;
      const minutes = Math.floor(this.gameState.gameTimer / 60);
      const seconds = this.gameState.gameTimer % 60;
      this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  },

  gainXP: function(amount) {
    this.gameState.xp += amount;
    if (this.gameState.xp >= this.gameState.xpToNextLevel) {
      this.gameState.level++;
      this.gameState.xp -= this.gameState.xpToNextLevel;
      this.gameState.xpToNextLevel *= 1.5;  // Increase XP needed for next level
    }
    // Update XP bar fill
    const fillWidth = (this.gameState.xp / this.gameState.xpToNextLevel) * (this.scale.width - 44);
    this.xpBarFill.width = fillWidth;
    this.xpText.setText(`Level ${this.gameState.level} - ${Math.floor(this.gameState.xp)}/${Math.floor(this.gameState.xpToNextLevel)} XP`);
  },

  update: function() {
    // Handle player movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.x -= this.player.moveSpeed;
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.x += this.player.moveSpeed;
    }
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.player.y -= this.player.moveSpeed;
    }
    if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.player.y += this.player.moveSpeed;
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
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <div 
        ref={gameRef}
        className="w-[800px] h-[600px] bg-black border-2 border-white"
      />
    </div>
  );
}
