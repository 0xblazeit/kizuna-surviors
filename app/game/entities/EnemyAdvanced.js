import EnemyBasic from './EnemyBasic';

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
}

export default EnemyAdvanced;
