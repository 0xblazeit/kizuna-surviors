import Enemy from '../enemies/Enemy';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    console.log('GameScene constructor called');
    
    // Initialize properties that need to persist
    this.enemies = null;
    this.player = null;
    
    // Bind spawnEnemies for timer
    this.spawnEnemies = this.spawnEnemies.bind(this);
  }

  init() {
    console.log('GameScene init called');
  }

  preload() {
    console.log('GameScene preload called');
    // Load enemy sprite
    this.load.svg('enemy-boomer', '/assets/game/characters/enemy-boomer.svg');
  }

  create() {
    console.log('GameScene create called');
    const { width, height } = this.scale;

    // Initialize enemy group with proper sprite configuration
    this.enemies = this.add.group({
      classType: Enemy,
      runChildUpdate: true,
      defaultKey: 'enemy-boomer'  // Set default sprite key for enemies
    });
    
    console.log('Enemy group initialized:', this.enemies);

    // Add a simple blue rectangle as the player
    this.player = this.add.rectangle(width / 2, height / 2, 50, 50, 0x0000ff);
    
    // Add text
    this.add.text(16, 16, 'Game Scene (ESC to return)', {
      color: '#ffffff',
      fontSize: '24px'
    });

    // Spawn initial enemies
    this.spawnEnemies();

    // Set up enemy respawn timer
    this.time.addEvent({
      delay: 2000,  // Spawn every 2 seconds
      callback: this.spawnEnemies,
      loop: true
    });

    // Handle ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      console.log('ESC pressed, returning to menu');
      this.scene.start('MenuScene');
    });
  }

  spawnEnemies() {
    console.log('Spawning enemies');
    const { width, height } = this.scale;
    const numEnemies = 3;  // Spawn 3 enemies at a time

    for (let i = 0; i < numEnemies; i++) {
      // Generate random position
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(50, height - 50);
      
      console.log(`Spawning enemy ${i + 1} at position:`, x, y);
      
      // Create enemy
      const enemy = new Enemy(this, x, y, 'enemy-boomer');
      this.enemies.add(enemy);
    }
  }

  update() {
    // Update enemies
    this.enemies.getChildren().forEach(enemy => enemy.update());
  }
}
