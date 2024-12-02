class Coin {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Just create a basic image with the coin SVG
        this.image = scene.add.image(x, y, 'coin');
        this.image.setScale(0.15);
        
        // Float up and down
        scene.tweens.add({
            targets: this.image,
            y: y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Rotate
        scene.tweens.add({
            targets: this.image,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    update(player) {
        if (!this.image) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.image.x,
            this.image.y,
            player.x,
            player.y
        );
        
        if (distance <= 50) {
            if (this.scene.gameState) {
                this.scene.gameState.coins++;
                if (this.scene.coinText) {
                    this.scene.coinText.setText(`Coins: ${this.scene.gameState.coins}`);
                }
            }
            this.image.destroy();
        }
    }
}

export default Coin;
