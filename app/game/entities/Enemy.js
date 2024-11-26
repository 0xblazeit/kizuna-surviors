import BasePlayer from './BasePlayer';

class Enemy extends BasePlayer {
    constructor(scene, x, y, config = {}) {
        // Set enemy specific defaults
        const enemyConfig = {
            maxHealth: 50,
            moveSpeed: 3,
            defense: 2,
            attackSpeed: 1,
            attackDamage: 10,
            spriteKey: 'enemy',
            scale: 0.45,
            ...config
        };

        super(scene, x, y, enemyConfig);

        // Enemy specific properties
        this.rewards = {
            experience: config.experience || 20,
            gold: config.gold || 10
        };

        this.ai = {
            aggroRange: config.aggroRange || 200,
            target: null,
            state: 'idle' // 'idle', 'chase', 'attack'
        };

        // Initialize enemy specific features
        this.initEnemy();
    }

    initEnemy() {
        // Add any enemy specific initialization
        this.sprite.setTint(0xff4444); // Give enemies a red tint
    }

    update() {
        if (!this.sprite) return;

        switch (this.ai.state) {
            case 'idle':
                this.updateIdle();
                break;
            case 'chase':
                this.updateChase();
                break;
            case 'attack':
                this.updateAttack();
                break;
        }

        super.updateTrailEffects();
    }

    updateIdle() {
        // Check for player in range
        if (this.ai.target) {
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                this.ai.target.x, this.ai.target.y
            );

            if (distance <= this.ai.aggroRange) {
                this.ai.state = 'chase';
            }
        }
    }

    updateChase() {
        if (!this.ai.target) {
            this.ai.state = 'idle';
            return;
        }

        // Simple chase behavior
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            this.ai.target.x, this.ai.target.y
        );

        const velocityX = Math.cos(angle) * this.stats.moveSpeed;
        const velocityY = Math.sin(angle) * this.stats.moveSpeed;

        this.sprite.x += velocityX;
        this.sprite.y += velocityY;

        // Create trail effect when moving
        if (Date.now() - this.lastTrailTime >= this.animConfig.trailSpawnInterval) {
            this.createTrailEffect();
            this.lastTrailTime = Date.now();
        }
    }

    updateAttack() {
        // Implement attack behavior
    }

    setTarget(target) {
        this.ai.target = target;
    }

    // Override the base class death behavior
    onDeath() {
        // Emit death event with rewards before cleanup
        this.scene.events.emit('enemyDeath', {
            position: this.getPosition(),
            rewards: this.rewards
        });

        super.onDeath();
    }
}

export default Enemy;
