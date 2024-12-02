import { RotatingDogWeapon } from '../weapons/RotatingDogWeapon';
import EnemyBasic from '../enemies/EnemyBasic';
import FlyingAxeWeapon from '../entities/weapons/FlyingAxeWeapon';
import LecheWeapon from '../entities/weapons/LecheWeapon';

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

    // Create a particle texture
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 4;
    particleCanvas.height = 4;
    const ctx = particleCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
    const base64Texture = particleCanvas.toDataURL();
    
    // Load the texture into Phaser
    this.load.image('particle', base64Texture);
  }

  create() {
    console.log('GameScene create called');
    const { width, height } = this.scale;

    // Add background for better visibility
    this.add.rectangle(width/2, height/2, width, height, 0x222222);

    // Add a simple blue rectangle as the player
    this.player = this.add.rectangle(width / 2, height / 2, 50, 50, 0x0000ff);
    this.player.setDepth(1);

    // Initialize weapon system
    console.log('Initializing weapon system...');
    this.weapons = [];
    const dogWeapon = new RotatingDogWeapon(this, this.player);
    const axeWeapon = new FlyingAxeWeapon(this, this.player);
    const lecheWeapon = new LecheWeapon(this, this.player);
    this.weapons.push(dogWeapon, axeWeapon, lecheWeapon);
    this.weaponInitialized = true;
    console.log('Weapon system initialized');

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

    // Clean up any existing enemies
    this.enemies.forEach(enemy => {
      if (enemy.sprite) enemy.sprite.destroy();
    });
    this.enemies = [];

    // Spawn initial enemies
    this.spawnEnemies(10); // Spawn 10 enemies to start
  }

  spawnEnemies(count) {
    const { width, height } = this.scale;
    const margin = 100; // Keep enemies away from edges
    
    for (let i = 0; i < count; i++) {
      // Generate position away from player
      let x, y;
      do {
        x = Phaser.Math.Between(margin, width - margin);
        y = Phaser.Math.Between(margin, height - margin);
      } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 200);

      // Create enemy
      const enemy = new EnemyBasic(this, x, y, 'enemy');
      this.enemies.push(enemy);
      console.log(`Spawned enemy at ${x}, ${y}`);
    }
  }

  update(time, delta) {
    const MOVE_SPEED = 4;

    // Update player position based on input
    if (this.cursors.left.isDown) {
      this.player.x -= MOVE_SPEED;
    }
    if (this.cursors.right.isDown) {
      this.player.x += MOVE_SPEED;
    }
    if (this.cursors.up.isDown) {
      this.player.y -= MOVE_SPEED;
    }
    if (this.cursors.down.isDown) {
      this.player.y += MOVE_SPEED;
    }

    // Keep player within bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, this.scale.width - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, this.scale.height - 20);

    // Update all enemies
    if (this.enemies) {
      // Clean up dead enemies and update active ones
      this.enemies = this.enemies.filter(enemy => {
        if (!enemy || enemy.isDead) {
          if (enemy && enemy.sprite) {
            enemy.sprite.destroy();
          }
          return false;
        }
        enemy.update(time, delta);
        return true;
      });

      // Spawn more enemies if needed
      if (this.enemies.length < 5) {  // Maintain minimum of 5 enemies
        this.spawnEnemies(5);
      }
    }
  }
}
