class BasePlayer {
    constructor(scene, x, y, texture, config = {}) {
        this.scene = scene;
        
        // Create the sprite
        this.sprite = scene.add.sprite(x, y, texture);
        this.sprite.setScale(config.scale || 1);

        // Setup physics body
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        // Initialize movement state
        this.movementState = {
            direction: 'right',
            isMoving: false
        };

        // Initialize animation config
        this.animConfig = {
            scale: config.scale || 1,
            trailSpawnInterval: 100,
            trailFadeSpeed: 0.05,
            maxTrailEffects: 5
        };

        // Initialize trail effects
        this.trailContainer = config.trailContainer || scene.add.container(0, 0);
        this.trailEffects = [];
        this.lastTrailTime = 0;
        this.texture = texture;

        // Initialize base stats
        this.stats = {
            moveSpeed: config.moveSpeed || 3,
            maxHealth: config.maxHealth || 100,
            currentHealth: config.maxHealth || 100,
            damage: config.attackDamage || 10,
            defense: config.defense || 0
        };
    }

    // Add getter for physics body
    get body() {
        return this.sprite.body;
    }

    // Add getters for position
    get x() {
        return this.sprite.x;
    }

    get y() {
        return this.sprite.y;
    }

    // Add setters for position
    set x(value) {
        this.sprite.x = value;
    }

    set y(value) {
        this.sprite.y = value;
    }

    handleMovement(input) {
        if (!this.sprite) return;

        // Reset movement state
        let isMoving = false;
        const currentTime = Date.now();

        // Handle movement
        if (input.left) {
            this.sprite.x -= this.stats.moveSpeed;
            this.sprite.setFlipX(true);
            this.movementState.direction = 'left';
            isMoving = true;
        }
        if (input.right) {
            this.sprite.x += this.stats.moveSpeed;
            this.sprite.setFlipX(false);
            this.movementState.direction = 'right';
            isMoving = true;
        }
        if (input.up) {
            this.sprite.y -= this.stats.moveSpeed;
            isMoving = true;
        }
        if (input.down) {
            this.sprite.y += this.stats.moveSpeed;
            isMoving = true;
        }

        // Update movement state
        this.movementState.isMoving = isMoving;

        // Handle trail effect
        if (isMoving && currentTime - this.lastTrailTime >= this.animConfig.trailSpawnInterval) {
            this.createTrailEffect();
            this.lastTrailTime = currentTime;
        }

        // Update existing trail effects
        this.updateTrailEffects();
    }

    createTrailEffect() {
        // Remove oldest trail if we're at max
        if (this.trailEffects.length >= this.animConfig.maxTrailEffects) {
            const oldestTrail = this.trailEffects.shift();
            if (oldestTrail && oldestTrail.destroy) {
                this.trailContainer.remove(oldestTrail);
                oldestTrail.destroy();
            }
        }

        // Create new trail effect
        const trail = this.scene.add.sprite(
            this.sprite.x, 
            this.sprite.y, 
            this.texture
        );
        
        trail.setScale(this.animConfig.scale);
        trail.setAlpha(0.5);
        trail.setTint(0x4444ff);
        trail.setFlipX(this.sprite.flipX);
        
        this.trailEffects.push(trail);
        this.trailContainer.add(trail);
    }

    updateTrailEffects() {
        for (let i = this.trailEffects.length - 1; i >= 0; i--) {
            const trail = this.trailEffects[i];
            if (trail && trail.alpha !== undefined) {
                trail.alpha -= this.animConfig.trailFadeSpeed;

                if (trail.alpha <= 0) {
                    this.trailContainer.remove(trail);
                    trail.destroy();
                    this.trailEffects.splice(i, 1);
                }
            }
        }
    }

    takeDamage(amount) {
        // Apply defense reduction
        const damageAfterDefense = Math.max(0, amount - this.stats.defense);
        this.stats.currentHealth = Math.max(0, this.stats.currentHealth - damageAfterDefense);
        
        // Handle death
        if (this.stats.currentHealth <= 0) {
            this.onDeath();
        }

        return damageAfterDefense;
    }

    heal(amount) {
        this.stats.currentHealth = Math.min(
            this.stats.maxHealth, 
            this.stats.currentHealth + amount
        );
    }

    onDeath() {
        // Base death behavior - to be overridden by subclasses
        this.sprite.destroy();
        this.trailContainer.destroy();
    }
}

export default BasePlayer;
