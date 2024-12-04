class Coin {
  // Static property to track total coins
  static totalCoins = 0;
  static MAX_COINS = 75;

  constructor(scene, x, y, value = 10) {
    // Check if we're at the coin limit
    if (Coin.totalCoins >= Coin.MAX_COINS) {
      return null;
    }

    Coin.totalCoins++;
    this.scene = scene;
    this.isCollected = false;

    // Create coin sprite
    this.sprite = scene.add.sprite(x, y, "coin");
    this.sprite.setScale(0.15);
    this.value = value; // Store the coin's value

    // Add a glow effect
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.sprite.setTint(0xffd700); // Golden tint

    // Initial spawn animation
    this.sprite.setAlpha(0);
    this.sprite.setScale(0.13);
    scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scale: 0.5,
      duration: 200,
      ease: "Back.easeOut",
    });

    // Add floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 10,
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
      Coin.totalCoins--; // Decrease total coins when collected

      // Update gold count
      this.scene.gameState.gold += this.value;
      this.scene.goldText.setText(`Gold: ${this.scene.gameState.gold}`);

      // Add collection animation
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 0,
        alpha: 0,
        y: this.sprite.y - 20,
        duration: 200,
        ease: "Power2",
        onComplete: () => {
          this.sprite.destroy();
          this.sprite = null;
        },
      });

      // Add floating text effect
      const floatingText = this.scene.add
        .text(this.sprite.x, this.sprite.y, `+${this.value}`, {
          fontFamily: "VT323",
          fontSize: "20px",
          color: "#FFD700",
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

export default Coin;
