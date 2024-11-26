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
