class BasePlayer {
  constructor(scene, x, y, texture, config = {}) {
    this.scene = scene;

    // Create the sprite
    this.sprite = scene.add.sprite(x, y, texture);
    this.sprite.setScale(config.scale || 1);
    this.sprite.setDepth(10);

    // Setup physics body
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // Initialize movement state
    this.movementState = {
      direction: "right",
      isMoving: false,
    };

    // Initialize base stats
    this.stats = {
      moveSpeed: config.moveSpeed || 3,
      maxHealth: config.maxHealth || 100,
      currentHealth: config.maxHealth || 100,
      damage: config.attackDamage || 10,
      defense: config.defense || 0,
    };

    // Add stun state
    this.isStunned = false;

    // Trail effect properties
    this.lastTrailTime = 0;
    this.lastX = x;
    this.lastY = y;
    this.trailConfig = {
      spawnInterval: config.trailSpawnInterval || 100, // Spawn every 100ms
      fadeSpeed: config.trailFadeSpeed || 400, // Fade out in 400ms
      startAlpha: config.trailStartAlpha || 0.7, // Start at 70% opacity
      tint: config.trailTint || 0xffffff, // Default white tint
    };
  }

  // Add getter for physics body
  get body() {
    return this.sprite.body;
  }

  // Add getters for position
  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  // Add setters for position
  set x(value) {
    this.sprite.x = value;
  }

  set y(value) {
    this.sprite.y = value;
  }

  handleMovement(input) {
    // If stunned, don't allow movement
    if (this.isStunned) return;

    if (!input) return;

    // Calculate movement based on input
    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    // Apply movement speed
    this.sprite.x += dx * this.stats.moveSpeed;
    this.sprite.y += dy * this.stats.moveSpeed;

    // Update sprite flip based on movement direction
    if (dx < 0) {
      this.sprite.setFlipX(true);
    } else if (dx > 0) {
      this.sprite.setFlipX(false);
    }
  }

  update() {
    // Check if entity has moved
    const hasMoved = this.lastX !== this.sprite.x || this.lastY !== this.sprite.y;

    if (hasMoved) {
      // Add trail effect if moving
      const currentTime = Date.now();
      if (currentTime - this.lastTrailTime >= this.trailConfig.spawnInterval) {
        this.createTrailEffect();
        this.lastTrailTime = currentTime;
      }
    }

    // Update last position
    this.lastX = this.sprite.x;
    this.lastY = this.sprite.y;

    // Update health bar position if it exists
    if (this.healthBar) {
      this.healthBar.container.setPosition(this.sprite.x, this.sprite.y + this.healthBar.spacing);
    }
  }

  updateHealthBar() {
    if (!this.healthBar) return;

    const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
    const width = this.healthBar.width * healthPercent;

    // Update the health bar width
    this.healthBar.bar.width = width;

    // Update color based on health percentage
    let color;
    if (healthPercent > 0.6) {
      color = 0x00ff00; // Green
    } else if (healthPercent > 0.3) {
      color = 0xffff00; // Yellow
    } else {
      color = 0xff4444; // Red
    }
    this.healthBar.bar.setFillStyle(color);
  }

  createTrailEffect() {
    // Create a copy of the sprite as a trail
    const trail = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.sprite.texture.key, this.sprite.frame.name);

    // Match the sprite's current state
    trail.setScale(this.sprite.scaleX);
    trail.setFlipX(this.sprite.flipX);
    trail.setOrigin(this.sprite.originX, this.sprite.originY);
    trail.setDepth(this.sprite.depth - 1); // Just behind the sprite
    trail.setAlpha(this.trailConfig.startAlpha);
    trail.setTint(this.trailConfig.tint);

    // Add a glow effect
    const glow = this.scene.add.sprite(trail.x, trail.y, trail.texture.key, trail.frame.name);
    glow.setScale(trail.scaleX * 1.2); // Slightly larger for glow effect
    glow.setAlpha(this.trailConfig.startAlpha * 0.5); // Half as visible as the trail
    glow.setDepth(trail.depth - 1); // Behind the trail
    glow.setTint(this.trailConfig.tint);
    glow.setBlendMode(Phaser.BlendModes.ADD); // Additive blending for glow effect

    // Fade out effect for both trail and glow
    this.scene.tweens.add({
      targets: [trail, glow],
      alpha: 0,
      duration: this.trailConfig.fadeSpeed,
      ease: "Linear",
      onComplete: () => {
        trail.destroy();
        glow.destroy();
      },
    });
  }

  takeDamage(amount) {
    // Ensure amount is a valid number and at least 1
    const damage = Math.max(1, Number(amount) || 0);

    // Apply defense reduction
    const damageAfterDefense = Math.max(1, damage - (this.stats.defense || 0));

    // Update current health
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - damageAfterDefense);

    // Handle death
    if (this.stats.currentHealth <= 0) {
      this.onDeath();
    }

    return damageAfterDefense;
  }

  heal(amount) {
    this.stats.currentHealth = Math.min(this.stats.maxHealth, this.stats.currentHealth + amount);
  }

  onDeath() {
    // Base death behavior - to be overridden by subclasses
    this.sprite.destroy();
  }
}

export default BasePlayer;
