class Coin {
  constructor(scene, x, y) {
    this.scene = scene;

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
    if (!this.sprite) return;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      player.sprite.x,
      player.sprite.y
    );

    if (distance <= 50) {
      if (this.scene.gameState) {
        this.scene.gameState.coins++;
        if (this.scene.coinText) {
          this.scene.coinText.setText(`Coins: ${this.scene.gameState.coins}`);
        }
      }
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

export default Coin;
