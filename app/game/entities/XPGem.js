class XPGem {
  // Static property to track total gems
  static totalGems = 0;
  static MAX_GEMS = 50;  // Lower than coins since these are more valuable

  constructor(scene, x, y, xpValue = 50, scale = 0.3) {
    // Check if we're at the gem limit
    if (XPGem.totalGems >= XPGem.MAX_GEMS) {
      return null;
    }
    
    XPGem.totalGems++;
    this.scene = scene;
    this.isCollected = false;
    this.xpValue = xpValue;

    // Create gem sprite with correct texture key
    this.sprite = scene.add.image(x, y, "powerup-xp-gem");
    this.sprite.setScale(scale);
    this.sprite.setDepth(5); // Set above ground items but below players

    // Add floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Add rotation animation
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: "Linear",
    });

    // Add glow effect with correct texture key
    this.glow = scene.add.image(x, y, "powerup-xp-gem");
    this.glow.setScale(scale * 1.2);  // Slightly larger than the gem
    this.glow.setAlpha(0.3);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setDepth(4);  // Below the main gem

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
  }

  update(player) {
    if (this.isCollected || !this.sprite || !player) return;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      player.x,
      player.y
    );

    if (distance <= 50) {
      // Mark as collected
      this.isCollected = true;
      XPGem.totalGems--; // Decrease total gems when collected

      // Grant XP to player
      player.gainXP(this.xpValue);

      // Add collection animation
      this.scene.tweens.add({
        targets: [this.sprite, this.glow],
        scale: 0,
        alpha: 0,
        y: this.sprite.y - 20,
        duration: 200,
        ease: "Power2",
        onComplete: () => {
          this.sprite.destroy();
          this.glow.destroy();
          this.sprite = null;
          this.glow = null;
        },
      });

      // Add floating text effect
      const floatingText = this.scene.add
        .text(this.sprite.x, this.sprite.y, `+${this.xpValue} XP`, {
          fontFamily: "VT323",
          fontSize: "20px",
          color: "#4CAF50",  // Green color for XP
        })
        .setOrigin(0.5);

      this.scene.tweens.add({
        targets: floatingText,
        y: floatingText.y - 40,
        alpha: 0,
        duration: 1000,
        ease: "Power2",
        onComplete: () => floatingText.destroy(),
      });
    }
  }
}

export default XPGem;
