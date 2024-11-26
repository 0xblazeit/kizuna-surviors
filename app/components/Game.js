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

    // Create background
    const background = this.add.graphics();
    background.fillGradientStyle(0x000033, 0x000033, 0x000066, 0x000066, 1);
    background.fillRect(0, 0, width, height);

    // Create player
    this.player = this.add.circle(width / 2, height / 2, 20, 0x00ff00);
    
    // Add back to menu text
    this.add.text(16, 16, 'ESC - Back to Menu', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    });

    // Add controls text
    this.add.text(16, 48, 'Controls: Arrow Keys / WASD', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    });

    // Add position debug text
    this.debugText = this.add.text(16, height - 40, '', {
      fontFamily: 'VT323',
      fontSize: '24px',
      color: '#ffffff'
    });

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

    // Keep player in bounds
    const bounds = 20;
    this.player.x = Phaser.Math.Clamp(
      this.player.x, 
      bounds, 
      this.scale.width - bounds
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y, 
      bounds, 
      this.scale.height - bounds
    );

    // Update debug text
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
