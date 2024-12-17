class XPGem {
  // Static property to track total gems
  static totalGems = 0;
  static MAX_GEMS = 50; // Lower than coins since these are more valuable

  // Static method to calculate XP value based on game time and enemy tier
  static calculateXPValue(scene, basexp = 50) {
    // Get current wave or time (assuming scene has gameTime in seconds)
    const gameTime = scene.gameTime || 0;
    const timeMultiplier = 1 + gameTime / 600; // Increase by 100% every 10 minutes

    // Cap the multiplier at 3x to prevent excessive scaling
    const cappedMultiplier = Math.min(3, timeMultiplier);

    return Math.floor(basexp * cappedMultiplier);
  }

  constructor(scene, x, y, baseXPValue = 50, scale = 0.3) {
    // Check if we're at the gem limit
    if (XPGem.totalGems >= XPGem.MAX_GEMS) {
      return null;
      as;
    }

    XPGem.totalGems++;
    this.scene = scene;
    this.isCollected = false;

    // Calculate scaled XP value
    this.xpValue = XPGem.calculateXPValue(scene, baseXPValue);

    // Create gem sprite with correct texture key
    this.sprite = scene.add.image(x, y, "powerup-xp-gem");
    this.sprite.setScale(scale);
    this.sprite.setDepth(5); // Set above ground items but below players

    // Add floating animation with larger range and smoother motion
    scene.tweens.add({
      targets: [this.sprite, this.glow], // Apply to both sprite and glow
      y: y - 15, // Increased float height
      duration: 2000, // Slower, smoother motion
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Add glow effect with correct texture key
    this.glow = scene.add.image(x, y, "powerup-xp-gem");
    this.glow.setScale(scale * 1.2); // Slightly larger than the gem
    this.glow.setAlpha(0.3);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setDepth(4); // Below the main gem

    // Animate the glow
    scene.tweens.add({
      targets: this.glow,
      alpha: 0.1,
      scale: scale * 1.4,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Scale color based on XP value
    const valueRatio = this.xpValue / baseXPValue;
    if (valueRatio >= 4) {
      this.sprite.setTint(0xffd700); // Gold for 4x or higher
      this.glow.setTint(0xffd700);
    } else if (valueRatio >= 2.5) {
      this.sprite.setTint(0xff00ff); // Purple for 2.5x-4x
      this.glow.setTint(0xff00ff);
    } else if (valueRatio >= 1.5) {
      this.sprite.setTint(0x00ffff); // Cyan for 1.5x-2.5x
      this.glow.setTint(0x00ffff);
    }
  }

  update(player) {
    if (this.isCollected || !this.sprite || !player) return;

    const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y);

    // Define attraction parameters
    const ACTIVATION_DISTANCE = 150;
    const COLLECTION_DISTANCE = 40;
    const BASE_SPEED = 2;
    const ORBITAL_SPEED = 0.1;

    // Only process gems within activation distance
    if (distance <= ACTIVATION_DISTANCE) {
      // Calculate angle to player
      const angleToPlayer = Math.atan2(player.y - this.sprite.y, player.x - this.sprite.x);

      // Add a time-based orbital offset
      const orbitalOffset = Math.sin(this.scene.time.now * ORBITAL_SPEED) * 0.5;

      // Calculate speed based on distance (faster when closer)
      const speedMultiplier = 1 - distance / ACTIVATION_DISTANCE;
      const currentSpeed = BASE_SPEED + speedMultiplier * 3;

      // Calculate the new position
      const adjustedAngle = angleToPlayer + orbitalOffset;
      const dx = Math.cos(adjustedAngle) * currentSpeed;
      const dy = Math.sin(adjustedAngle) * currentSpeed;

      // Move sprite and glow together as one unit
      const newX = this.sprite.x + dx;
      const newY = this.sprite.y + dy;

      this.sprite.setPosition(newX, newY);
      this.glow.setPosition(newX, newY);
    }

    if (distance <= COLLECTION_DISTANCE) {
      // Mark as collected immediately to prevent double collection
      this.isCollected = true;
      XPGem.totalGems--;

      // Store XP value before destroying the gem
      const xpValue = this.xpValue;
      const gemX = this.sprite.x;
      const gemY = this.sprite.y;

      // Grant XP to player first
      player.gainXP(xpValue);

      // Add collection animation with a spiral effect
      this.scene.tweens.add({
        targets: [this.sprite, this.glow],
        scale: 0,
        alpha: 0,
        angle: 360,
        y: gemY - 20,
        duration: 300,
        ease: "Back.easeIn",
        onComplete: () => {
          if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
          }
          if (this.glow) {
            this.glow.destroy();
            this.glow = null;
          }
        },
      });

      // Add floating text effect with bounce
      const floatingText = this.scene.add
        .text(gemX, gemY, `+${xpValue} XP`, {
          fontFamily: "VT323",
          fontSize: "20px",
          color: "#4CAF50",
        })
        .setOrigin(0.5)
        .setDepth(1000); // Ensure text appears above other elements

      this.scene.tweens.add({
        targets: floatingText,
        y: gemY - 40,
        alpha: 0,
        scale: { from: 1, to: 1.5 },
        duration: 1000,
        ease: "Bounce.easeOut",
        onComplete: () => {
          floatingText.destroy();
        },
      });
    }
  }
}

export default XPGem;
