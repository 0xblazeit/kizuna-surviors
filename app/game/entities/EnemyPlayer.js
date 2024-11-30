import BasePlayer from './BasePlayer';

class EnemyPlayer extends BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        // Set enemy specific defaults
        const enemyConfig = {
            maxHealth: 50,
            moveSpeed: 3,
            defense: 2,
            attackSpeed: 1,
            attackDamage: 8,
            scale: 0.8,
            ...config
        };

        super(scene, x, y, texture, enemyConfig);

        // Enemy specific properties
        this.type = config.type || 'basic';
        
        // Create health bar with proper spacing
        const spriteHeight = this.sprite.height * enemyConfig.scale;
        const healthBarWidth = spriteHeight * 0.8;
        const healthBarHeight = spriteHeight * 0.1;
        const healthBarSpacing = spriteHeight * 0.4;

        this.healthBar = {
            width: healthBarWidth,
            height: healthBarHeight,
            spacing: healthBarSpacing,
            background: scene.add.rectangle(x, y + healthBarSpacing, healthBarWidth, healthBarHeight, 0x000000),
            bar: scene.add.rectangle(x, y + healthBarSpacing, healthBarWidth, healthBarHeight, 0xff4444)
        };

        // Add a black border to make the health bar more visible
        this.healthBar.background.setStrokeStyle(1, 0x000000);
        this.healthBar.background.setDepth(1);
        this.healthBar.bar.setDepth(1);

        // Initialize enemy
        this.initEnemy();
    }

    initEnemy() {
        // Add any enemy specific initialization
        this.sprite.setTint(0xff9999); // Give enemies a slight red tint
    }

    takeDamage(amount) {
        const damageDealt = super.takeDamage(amount);
        this.updateHealthBar();
        return damageDealt;
    }

    heal(amount) {
        super.heal(amount);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
        this.healthBar.bar.width = this.healthBar.width * healthPercent;
    }

    handleMovement(input) {
        super.handleMovement(input);
        
        // Update health bar position to follow enemy
        if (this.healthBar) {
            const yOffset = this.healthBar.spacing;
            this.healthBar.background.setPosition(this.sprite.x, this.sprite.y + yOffset);
            this.healthBar.bar.setPosition(
                this.sprite.x - (this.healthBar.width * (1 - this.stats.currentHealth / this.stats.maxHealth)) / 2,
                this.sprite.y + yOffset
            );
        }
    }

    onDeath() {
        // Clean up health bar before death
        if (this.healthBar) {
            this.healthBar.background.destroy();
            this.healthBar.bar.destroy();
        }
        super.onDeath();
    }
}

export default EnemyPlayer;
