class GameScene {
  constructor() {
    console.log('GameScene constructor called');
    if (typeof window !== 'undefined' && window.Phaser) {
      const scene = new window.Phaser.Scene({ key: 'GameScene' });
      Object.assign(this, scene);
      console.log('GameScene initialized');
      return this;
    }
  }

  init() {
    console.log('GameScene init called');
  }

  preload() {
    console.log('GameScene preload called');
    
    // Create a canvas for the particle texture
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const ctx = particleCanvas.getContext('2d');

    // Draw a white circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Create a base64 texture from the canvas
    const base64Texture = particleCanvas.toDataURL();
    
    // Load the texture into Phaser
    this.load.image('particle', base64Texture);
    console.log('Particle texture created and loaded');
  }

  create() {
    console.log('GameScene create called');
    const { width, height } = this.scale;

    // Add a simple blue rectangle as the player
    this.player = this.add.rectangle(width / 2, height / 2, 50, 50, 0x0000ff);
    
    // Add text
    this.add.text(16, 16, 'Game Scene (ESC to return)', {
      color: '#ffffff',
      fontSize: '24px'
    });

    // Handle ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      console.log('ESC pressed, returning to menu');
      this.scene.start('MenuScene');
    });
  }

  update() {
    // Handle player movement
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        this.player.x -= this.player.speed;
      }
      if (this.cursors.right.isDown) {
        this.player.x += this.player.speed;
      }
      if (this.cursors.up.isDown) {
        this.player.y -= this.player.speed;
      }
      if (this.cursors.down.isDown) {
        this.player.y += this.player.speed;
      }

      // Keep player within bounds
      this.player.x = Phaser.Math.Clamp(this.player.x, 20, this.scale.width - 20);
      this.player.y = Phaser.Math.Clamp(this.player.y, 20, this.scale.height - 20);
    }
  }
}

export default GameScene;
