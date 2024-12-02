import EnemyBasic from './EnemyBasic';
import Coin from '../entities/Coin';

class EnemyAdvanced extends EnemyBasic {
    constructor(scene, x, y, texture, config = {}) {
        // Set advanced enemy specific defaults with higher stats
        const advancedConfig = {
            maxHealth: 200,  // Double health
            moveSpeed: Phaser.Math.FloatBetween(2.0, 2.2),  // Faster than basic enemies
            defense: 2,  // Added defense
            attackSpeed: 1.2,  // 20% faster attacks
            attackDamage: 12,  // 50% more damage
            scale: 0.42,  // Just slightly larger than basic enemies (0.4)
            trailTint: 0xff0000,  // Red trail for advanced enemies
            clickDamage: 40,  // Higher click damage
            ...config
        };

        super(scene, x, y, texture, advancedConfig);

        // Advanced enemy specific properties
        this.type = 'advanced';
    }

    die() {
        // Chance to drop a coin (90% for advanced enemies during testing)
        if (Math.random() < 0.90) {
            const coin = new Coin(this.scene, this.sprite.x, this.sprite.y, 3);
            if (!this.scene.coins) {
                console.error('Coins array not initialized!');
                this.scene.coins = [];
            }
            this.scene.coins.push(coin);
        }
        
        super.die();
    }
}

export default EnemyAdvanced;
