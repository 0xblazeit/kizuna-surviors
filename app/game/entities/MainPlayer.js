import BasePlayer from './BasePlayer';

class MainPlayer extends BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        // Set main player specific defaults
        const mainPlayerConfig = {
            maxHealth: 150,
            moveSpeed: 5,
            defense: 5,
            attackSpeed: 1.2,
            attackDamage: 15,
            scale: 1,
            ...config
        };

        super(scene, x, y, texture, mainPlayerConfig);

        // Get sprite dimensions for proper health bar scaling
        const spriteHeight = this.sprite.height * mainPlayerConfig.scale;
        
        // Create health bar with proper spacing
        const healthBarWidth = spriteHeight * 0.8; // Health bar width relative to sprite height
        const healthBarHeight = spriteHeight * 0.1; // Health bar height relative to sprite height
        const healthBarSpacing = spriteHeight * 0.4; // Increased spacing between sprite and health bar

        this.healthBar = {
            width: healthBarWidth,
            height: healthBarHeight,
            spacing: healthBarSpacing,
            background: scene.add.rectangle(x, y + healthBarSpacing, healthBarWidth, healthBarHeight, 0x000000),
            bar: scene.add.rectangle(x, y + healthBarSpacing, healthBarWidth, healthBarHeight, 0x00ff00)
        };

        // Add a black border to make the health bar more visible
        this.healthBar.background.setStrokeStyle(1, 0x000000);
        this.healthBar.background.setDepth(1);
        this.healthBar.bar.setDepth(1);

        // Main player specific properties
        this.experience = {
            current: 0,
            toNextLevel: 100,
            level: 1
        };

        this.inventory = {
            gold: 0,
            items: []
        };
    }

    // XP related getters
    get xp() {
        return this.experience.current;
    }

    get level() {
        return this.experience.level;
    }

    get xpToNextLevel() {
        return this.experience.toNextLevel;
    }

    gainXP(amount) {
        this.experience.current += amount;
        
        while (this.experience.current >= this.experience.toNextLevel) {
            this.levelUp();
        }

        // Emit XP gained event
        this.scene.events.emit('playerXPGained', {
            current: this.experience.current,
            toNext: this.experience.toNextLevel,
            level: this.experience.level
        });
    }

    levelUp() {
        this.experience.level++;
        this.experience.current -= this.experience.toNextLevel;
        this.experience.toNextLevel = Math.floor(this.experience.toNextLevel * 1.5);

        // Increase stats on level up
        this.stats.maxHealth += 10;
        this.stats.currentHealth = this.stats.maxHealth; // Full heal on level up
        this.stats.attackDamage += 2;
        this.stats.defense += 1;

        // Emit level up event that the scene can listen to
        this.scene.events.emit('playerLevelUp', this.experience.level);
    }

    collectGold(amount) {
        this.inventory.gold += amount;
        this.scene.events.emit('goldCollected', this.inventory.gold);
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
        
        // Update color based on health percentage
        if (healthPercent > 0.6) {
            this.healthBar.bar.setFillStyle(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            this.healthBar.bar.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBar.bar.setFillStyle(0xff0000); // Red
        }
    }

    handleMovement(input) {
        super.handleMovement(input);
        
        // Update health bar position to follow player
        if (this.healthBar) {
            const yOffset = this.healthBar.spacing;
            this.healthBar.background.setPosition(this.sprite.x, this.sprite.y + yOffset);
            this.healthBar.bar.setPosition(
                this.sprite.x - (this.healthBar.width * (1 - this.stats.currentHealth / this.stats.maxHealth)) / 2,
                this.sprite.y + yOffset
            );
        }
    }

    // Override the base class death behavior
    onDeath() {
        // Clean up health bar before death
        if (this.healthBar) {
            this.healthBar.background.destroy();
            this.healthBar.bar.destroy();
        }
        // Emit death event before cleanup
        this.scene.events.emit('playerDeath', {
            level: this.experience.level,
            gold: this.inventory.gold
        });

        super.onDeath();
    }

    getStats() {
        return {
            ...this.stats,
            experience: this.experience,
            gold: this.inventory.gold
        };
    }
}

export default MainPlayer;
