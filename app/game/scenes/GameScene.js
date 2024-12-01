import { RotatingDogWeapon } from '../weapons/RotatingDogWeapon';

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
    this.weaponInitialized = false;
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
    
    // Load weapon sprites
    console.log('Loading weapon sprite...');
    this.load.on('filecomplete-image-weapon-dog-projectile', () => {
        console.log('Dog projectile sprite loaded successfully!');
    });
    this.load.on('loaderror', (file) => {
        console.error('Error loading file:', file.src);
    });
    
    // Try loading with the correct path relative to public
    this.load.image('weapon-dog-projectile', '/assets/game/weapons/weapon-dog-projectile.svg');
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
    this.weapons.push(dogWeapon);
    this.weaponInitialized = true;
    console.log('Weapon system initialized');

    // Add debug text
    this.debugText = this.add.text(16, 16, 'Debug Info', {
      color: '#ffffff',
      fontSize: '14px'
    });
    
    // Set up keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Handle ESC key
    this.input.keyboard.on('keydown-ESC', () => {
      this.weapons.forEach(weapon => weapon.destroy());
      this.scene.start('MenuScene');
    });
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

    // Update debug text
    if (this.debugText) {
      this.debugText.setText([
        `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`,
        `Weapon Initialized: ${this.weaponInitialized}`,
        `Active Weapons: ${this.weapons.length}`,
        `Time: ${Math.round(time)}`,
        `Delta: ${Math.round(delta)}`
      ]);
    }

    // Update all weapons with explicit debug
    if (this.weapons && this.weapons.length > 0) {
      console.log('Updating weapons...');
      this.weapons.forEach((weapon, index) => {
        if (weapon && typeof weapon.update === 'function') {
          weapon.update(time, delta);
        } else {
          console.error(`Invalid weapon at index ${index}:`, weapon);
        }
      });
    }
  }
}

export default GameScene;
