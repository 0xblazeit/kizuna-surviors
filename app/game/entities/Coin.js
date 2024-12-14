class Coin {
  // Static object pool
  static pool = [];
  static totalCoins = 0;
  static MAX_COINS = 75;
  static ACTIVATION_DISTANCE = 300; // Only update coins within this range
  static COLLECTION_DISTANCE = 50;

  constructor(scene, x, y, value = 10) {
    this.scene = scene;
    this.reset(x, y, value);
    
    // Create coin sprite only once
    this.sprite = scene.add.sprite(x, y, "coin");
    this.sprite.setScale(0.15);
    
    // Use a simpler rotation animation with sprite sheet frames instead of tweens
    if (this.sprite.anims) {
      this.sprite.play("coin-spin");
    }
  }

  static initializePool(scene) {
    // Pre-create coins and disable them
    for (let i = 0; i < this.MAX_COINS; i++) {
      const coin = new Coin(scene, 0, 0);
      coin.deactivate();
      this.pool.push(coin);
    }
  }

  static spawn(scene, x, y, value = 10) {
    // Get coin from pool or return if none available
    const coin = this.pool.find(c => !c.isActive);
    if (!coin) return null;
    
    coin.reset(x, y, value);
    return coin;
  }

  reset(x, y, value) {
    this.isCollected = false;
    this.isActive = true;
    this.value = value;
    
    if (this.sprite) {
      this.sprite.setPosition(x, y);
      this.sprite.setVisible(true);
      this.sprite.setAlpha(1);
      
      // Simple fade in without complex tween
      this.sprite.setAlpha(0);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 1,
        duration: 200,
      });
    }
  }

  deactivate() {
    this.isActive = false;
    this.isCollected = true;
    if (this.sprite) {
      this.sprite.setVisible(false);
    }
    Coin.totalCoins--;
  }

  update(player) {
    if (!this.isActive || this.isCollected || !this.sprite || !player) return;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, 
      this.sprite.y, 
      player.x, 
      player.y
    );

    // Only process coins within activation distance
    if (distance > Coin.ACTIVATION_DISTANCE) return;

    if (distance <= Coin.COLLECTION_DISTANCE) {
      this.collect(player);
    }
  }

  collect(player) {
    if (this.isCollected) return;
    
    // Simple collection animation
    this.scene.tweens.add({
      targets: this.sprite,
      x: player.x,
      y: player.y,
      alpha: 0,
      scale: 0.1,
      duration: 200,
      onComplete: () => {
        // Update gold count
        this.scene.gameState.gold += this.value;
        this.scene.goldText.setText(`Gold: ${this.scene.gameState.gold}`);
        
        // Create floating text
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

        this.deactivate();
      }
    });
  }
}

export default Coin;
