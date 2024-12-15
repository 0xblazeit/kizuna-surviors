class Coin {
  // Static object pool
  static pool = [];
  static totalCoins = 0;
  static MAX_COINS = 75;
  static ACTIVATION_DISTANCE = 400; // Increased activation distance
  static COLLECTION_DISTANCE = 75;  // Increased collection distance for better feel
  static MAGNETIC_DISTANCE = 150;   // New shorter magnetic range
  static MAGNETIC_SPEED_MIN = 0.5;  // Slower initial magnetic speed
  static MAGNETIC_SPEED_MAX = 4;    // Faster speed when very close

  // Coin value tiers for consolidation
  static VALUE_TIERS = {
    BRONZE: 10,
    SILVER: 50,
    GOLD: 100,
    PLATINUM: 250,
  };

  constructor(scene, x, y, value = 10) {
    this.scene = scene;
    this.reset(x, y, value);

    // Create coin sprite only once
    this.sprite = scene.add.sprite(x, y, "coin");
    this.sprite.setScale(0.15);
  }

  static initializePool(scene) {
    // Pre-create coins and disable them
    for (let i = 0; i < this.MAX_COINS; i++) {
      const coin = new Coin(scene, 0, 0);
      coin.deactivate();
      this.pool.push(coin);
    }
  }

  // New method to consolidate coins based on total value
  static spawnConsolidated(scene, x, y, totalValue) {
    const coins = [];
    let remainingValue = totalValue;

    // Distribute value across coin tiers
    const tiers = Object.values(this.VALUE_TIERS).sort((a, b) => b - a);

    // Limit max coins per drop
    const MAX_COINS_PER_DROP = 5;
    let coinsSpawned = 0;

    while (remainingValue > 0 && coinsSpawned < MAX_COINS_PER_DROP) {
      const tier = tiers.find((t) => t <= remainingValue) || tiers[tiers.length - 1];

      // Random position within a small radius
      const radius = 20;
      const angle = Math.random() * Math.PI * 2;
      const spawnX = x + Math.cos(angle) * radius * Math.random();
      const spawnY = y + Math.sin(angle) * radius * Math.random();

      const coin = this.spawn(scene, spawnX, spawnY, tier);
      if (coin) {
        coins.push(coin);
        remainingValue -= tier;
        coinsSpawned++;
      } else {
        break; // No more coins available in pool
      }
    }

    // If there's remaining value and we hit the coin limit,
    // add it to the last coin
    if (remainingValue > 0 && coins.length > 0) {
      coins[coins.length - 1].value += remainingValue;
    }

    return coins;
  }

  static spawn(scene, x, y, value = 10) {
    // Get coin from pool or return if none available
    const coin = this.pool.find((c) => !c.isActive);
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
    if (!this.isActive || this.isCollected || !this.sprite || !player || !player.sprite) return;

    // Use player sprite position instead of raw player position
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, 
      this.sprite.y, 
      player.sprite.x, 
      player.sprite.y
    );

    // Only process coins within activation distance
    if (distance > Coin.ACTIVATION_DISTANCE) return;

    // Add a magnetic effect when coins are close, with increasing strength as you get closer
    if (distance <= Coin.MAGNETIC_DISTANCE) {
      const angle = Math.atan2(player.sprite.y - this.sprite.y, player.sprite.x - this.sprite.x);
      
      // Calculate magnetic speed based on distance
      // Closer distance = faster movement
      const distanceRatio = 1 - (distance / Coin.MAGNETIC_DISTANCE);
      const speed = Coin.MAGNETIC_SPEED_MIN + (Coin.MAGNETIC_SPEED_MAX - Coin.MAGNETIC_SPEED_MIN) * distanceRatio;
      
      this.sprite.x += Math.cos(angle) * speed;
      this.sprite.y += Math.sin(angle) * speed;
    }

    if (distance <= Coin.COLLECTION_DISTANCE) {
      this.collect(player);
    }
  }

  collect(player) {
    if (this.isCollected) return;

    // Simple collection animation
    this.scene.tweens.add({
      targets: this.sprite,
      x: player.sprite.x,
      y: player.sprite.y,
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
      },
    });
  }
}

export default Coin;
