export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    
    // Add sprite to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.damage = 0;
    this.duration = 0;
    this.startTime = 0;

    // Set up physics body properties
    this.body.setSize(32, 32); // Adjust hitbox size
    this.body.setOffset(16, 16); // Center the hitbox
  }

  fire(x, y, direction, config) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    
    this.damage = config.damage;
    this.duration = config.duration;
    this.startTime = this.scene.time.now;

    // Set rotation to match direction
    this.setRotation(direction);

    // Set velocity based on direction and speed
    const velocity = new Phaser.Math.Vector2();
    velocity.setToPolar(direction, config.projectileSpeed);
    this.setVelocity(velocity.x, velocity.y);
  }

  update(time, delta) {
    if (time > this.startTime + this.duration) {
      this.setActive(false);
      this.setVisible(false);
      this.destroy();
    }
  }
}
