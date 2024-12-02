export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    console.log('GameScene constructor called');
  }

  init() {
    console.log('GameScene init called');
    this.weaponInitialized = false;
    this.gameState = {
      kills: 0,
      enemies: []
    };
  }

  preload() {
    console.log('GameScene preload called');
    
    // Debug loading process
    this.load.on('start', () => {
      console.log('Loading started');
    });

    this.load.on('complete', () => {
      console.log('All assets loaded');
    });

    this.load.on('loaderror', (file) => {
      console.error('Error loading file:', file.key, file.src);
    });
  }

  create() {
    console.log('GameScene create called');
    const { width, height } = this.scale;

    // Add background for better visibility
    this.add.rectangle(width/2, height/2, width, height, 0x222222);

    // Add a simple blue rectangle as the player
    this.player = this.add.rectangle(width / 2, height / 2, 50, 50, 0x0000ff);
    this.player.setDepth(1);

    // Initialize enemy list
    this.enemies = [];

    // Add kills text
    this.killsText = this.add.text(16, height - 40, 'Kills: 0', {
      color: '#ffffff',
      fontSize: '20px'
    });
    
    // Set up keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Handle ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      this.weapons.forEach(weapon => weapon.destroy());
      this.scene.start('MenuScene');
    });
  }
}
