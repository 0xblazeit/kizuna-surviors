export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, weaponStats) {
    super(scene, x, y, texture);
    
    // Add sprite to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store stats
    this.scene = scene;
    this.stats = weaponStats;
    this.damage = weaponStats.damage;
    this.pierceCount = 0;
    this.maxPierce = weaponStats.pierce;

    // Apply visual effects based on weapon stats
    this.setScale(weaponStats.projectileSize);
    
    // Add special effects for higher levels
    if (weaponStats.special) {
      this.setTint(0xffff00); // Yellow tint for special abilities
    } else if (weaponStats.pierce > 0) {
      this.setTint(0xff6b6b); // Red tint for piercing projectiles
    }

    // Set up physics body properties
    this.body.setSize(32, 32);
    this.body.setOffset(16, 16);
  }

  fire(x, y, angle, speed) {
    this.setActive(true);
    this.setVisible(true);
    
    this.setPosition(x, y);
    
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    
    this.setVelocity(velocityX, velocityY);
    this.setRotation(angle);
  }

  handleHit() {
    if (this.maxPierce > 0 && this.pierceCount < this.maxPierce) {
      this.pierceCount++;
      return false; // Don't destroy projectile yet
    }
    this.destroy();
    return true;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Destroy if out of range
    const distance = Phaser.Math.Distance.Between(
      this.scene.player.x,
      this.scene.player.y,
      this.x,
      this.y
    );

    if (distance > this.stats.range) {
      this.destroy();
    }
  }
}
