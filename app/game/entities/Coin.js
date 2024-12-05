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
    this.value = value;

    // Initial spawn animation
    this.sprite.setAlpha(0);
    this.sprite.setScale(0.13);
    scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scale: 0.15,
      duration: 200,
      ease: "Back.easeOut",
    });

    // Replace floating with rotation animation
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 1500,
      repeat: -1,
      ease: "Linear",
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
      Coin.totalCoins--;

      // Update gold count
      this.scene.gameState.gold += this.value;
      this.scene.goldText.setText(`Gold: ${this.scene.gameState.gold}`);

      // Simplified collection animation
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 0,
        alpha: 0,
        duration: 200,
        ease: "Power2",
        onComplete: () => {
          if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
          }
        },
      });

      // Simple floating text that cleans itself up
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
        duration: 500,
        ease: "Power2",
        onComplete: () => {
          floatingText.destroy();
        },
      });
    }
  }
}

export default Coin;
