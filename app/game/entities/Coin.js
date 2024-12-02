class Coin {
    constructor(scene, x, y, value = 1) {
        this.scene = scene;
        this.value = value;  // How many coins this pickup is worth
        
        console.log('Creating coin at:', x, y, 'with value:', value);
        
        // Create the sprite
        try {
            this.sprite = scene.add.sprite(x, y, 'coin');
            this.sprite.setScale(0.15);  // Adjusted for SVG
            this.sprite.setDepth(5);  // Above ground, below enemies
            console.log('Coin sprite created successfully');
        } catch (error) {
            console.error('Failed to create coin sprite:', error);
            return;
        }
        
        // Scale based on value
        if (value > 1) {
            this.sprite.setScale(0.15 + (value * 0.02));  // Slightly larger for valuable coins
            this.sprite.setTint(value >= 5 ? 0xffdd00 : 0xfff5cc);  // Golden for epic, light gold for advanced
        }
        
        // Add physics
        try {
            scene.physics.add.existing(this.sprite);
            console.log('Physics added to coin');
        } catch (error) {
            console.error('Failed to add physics to coin:', error);
        }
        
        // Add floating animation
        this.addFloatingAnimation();
        
        // Add collection radius
        this.collectionRadius = 50;  // Pixels
        
        // Flag for collection
        this.isCollected = false;
    }
    
    addFloatingAnimation() {
        try {
            // Add a gentle floating animation
            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 5,  // Float up and down by 5 pixels
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Add slow rotation
            this.scene.tweens.add({
                targets: this.sprite,
                angle: 360,
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
            });
            console.log('Animations added to coin');
        } catch (error) {
            console.error('Failed to add animations to coin:', error);
        }
    }
    
    update(player) {
        if (!this.sprite || this.isCollected) return;
        
        // Check distance to player
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );
        
        if (distance <= this.collectionRadius) {
            console.log('Player in range, collecting coin!');
            this.collect();
        }
    }
    
    collect() {
        if (this.isCollected || !this.sprite) return;
        
        this.isCollected = true;
        console.log('Collecting coin with value:', this.value);
        
        // Add collection animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 20,
            alpha: 0,
            scale: 0.2,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
                // Emit coin collected event with value
                console.log('Coin collection animation complete, emitting event');
                this.scene.events.emit('coinCollected', { value: this.value });
                this.destroy();
            }
        });
    }
    
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            console.log('Coin sprite destroyed');
        }
    }
}

export default Coin;
