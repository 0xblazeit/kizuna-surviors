class Coin {
    constructor(scene, x, y, value = 1) {
        // Store references
        this.scene = scene;
        this.value = value;
        this.isCollected = false;
        
        // Create the sprite directly without physics
        this.sprite = scene.add.sprite(x, y, 'coin');
        this.sprite.setScale(0.15);
        this.sprite.setDepth(5);
        
        // Scale and tint based on value
        if (value > 1) {
            this.sprite.setScale(0.15 + (value * 0.02));
            this.sprite.setTint(value >= 5 ? 0xffdd00 : 0xfff5cc);
        }
        
        // Add floating animation
        scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add rotation
        scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Collection properties
        this.collectionRadius = 50;
    }
    
    update(player) {
        if (this.isCollected || !this.sprite) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );
        
        if (distance <= this.collectionRadius) {
            this.collect();
        }
    }
    
    collect() {
        if (this.isCollected || !this.sprite) return;
        this.isCollected = true;
        
        // Collection animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 20,
            alpha: 0,
            scale: 0.2,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
                // Update game state
                if (this.scene.gameState) {
                    this.scene.gameState.coins += this.value;
                    if (this.scene.coinText) {
                        this.scene.coinText.setText(`Coins: ${this.scene.gameState.coins}`);
                    }
                }
                this.destroy();
            }
        });
    }
    
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

export default Coin;
