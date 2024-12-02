class Coin {
  constructor(scene, x, y) {
    this.scene = scene;
    this.isCollected = false;

    // Create coin sprite
    this.sprite = scene.add.image(x, y, "coin");
    this.sprite.setScale(0.15);
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

      // Update gold count
      this.scene.gameState.gold += 1;
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
        .text(this.sprite.x, this.sprite.y, "+1", {
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
