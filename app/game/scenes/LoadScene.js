export default class LoadScene extends Phaser.Scene {
    constructor() {
        super('LoadScene');
    }

    preload() {
        // Load all game assets
        this.load.image('spark', 'assets/effects/spark.png');
        this.load.image('energy', 'assets/effects/energy.png');
        this.load.image('distortion', 'assets/effects/distortion.png');
        this.load.image('shockwave', 'assets/effects/shockwave.png');
        
        // Load other game assets...
    }

    create() {
        this.scene.start('GameScene');
    }
}
