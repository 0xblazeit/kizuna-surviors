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

    // Override the base class death behavior
    onDeath() {
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
