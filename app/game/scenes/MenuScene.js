class MenuScene {
  constructor() {
    console.log('MenuScene constructor called');
    if (typeof window !== 'undefined' && window.Phaser) {
      const scene = new window.Phaser.Scene({ key: 'MenuScene' });
      Object.assign(this, scene);
      console.log('MenuScene initialized');
      return this;
    }
  }

  init() {
    console.log('MenuScene init called');
  }

  preload() {
    console.log('MenuScene preload called');
  }

  create() {
    console.log('MenuScene create called');
    const { width, height } = this.scale;

    // Add a simple red rectangle to test rendering
    const rect = this.add.rectangle(width / 2, height / 2, 100, 100, 0xff0000);
    
    // Add simple text
    const text = this.add.text(width / 2, height / 2, 'Click to Start', {
      color: '#ffffff',
      fontSize: '32px'
    }).setOrigin(0.5);

    // Handle click
    this.input.on('pointerdown', () => {
      console.log('Click detected, starting game');
      this.scene.start('GameScene');
    });
  }
}

export default MenuScene;
