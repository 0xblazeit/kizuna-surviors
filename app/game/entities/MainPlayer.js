import BasePlayer from "./BasePlayer";

class MainPlayer extends BasePlayer {
  constructor(scene, x, y, texture, config = {}) {
    // Set main player specific defaults
    const mainPlayerConfig = {
      maxHealth: 100,
      moveSpeed: 3,
      defense: 0,
      attackSpeed: 1,
      attackDamage: 10,
      scale: 1,
      trailTint: 0xff8c42,
      clickDamage: 25,
      ...config,
    };

    super(scene, x, y, texture, mainPlayerConfig);

    // Set sprite depth
    this.sprite.setDepth(10);

    // Player specific properties
    this.isStaggered = false;
    this.hitFlashDuration = 100;
    this.isDead = false;

    // Create health bar with proper spacing
    const spriteHeight = this.sprite.height * mainPlayerConfig.scale;
    const healthBarWidth = spriteHeight * 0.8;
    const healthBarHeight = spriteHeight * 0.1;
    const healthBarSpacing = spriteHeight * 0.4;

    // Create a container for the health bar to keep components together
    this.healthBar = {
      width: healthBarWidth,
      height: healthBarHeight,
      spacing: healthBarSpacing,
      container: scene.add.container(x, y + healthBarSpacing),
      background: scene.add.rectangle(0, 0, healthBarWidth, healthBarHeight, 0x000000),
      bar: scene.add.rectangle(0, 0, healthBarWidth, healthBarHeight, 0x00ff00),
    };

    // Add components to container
    this.healthBar.container.add([this.healthBar.background, this.healthBar.bar]);
    this.healthBar.container.setDepth(1);

    // Add a black border to make the health bar more visible
    this.healthBar.background.setStrokeStyle(1, 0x000000);

    // Main player specific properties
    this.experience = {
      current: 0,
      toNextLevel: 100,
      level: 1,
    };

    this.inventory = {
      gold: 0,
      items: [],
    };

    this.clickDamage = mainPlayerConfig.clickDamage;

    // Initialize movement variables
    this.movementEnabled = true;
    this.isMoving = false;
    this.lastX = x;
    this.lastY = y;

    // Initialize player
    this.initPlayer();
  }

  initPlayer() {
    // Make sprite interactive
    this.sprite.setInteractive();

    // Add click handler
    this.sprite.on("pointerdown", () => {
      // Take configured click damage when clicked
      const damageDealt = this.takeDamage(this.clickDamage);

      // Play hit effects
      if (!this.isStaggered) {
        this.playHitEffects();
      }
    });
  }

  playHitEffects() {
    this.isStaggered = true;

    // Store original tint
    const originalTint = this.sprite.tintTopLeft;

    // Flash white
    this.sprite.setTint(0xffffff);

    // Create a slight knockback/stagger effect
    const staggerDistance = 10;
    const staggerDuration = 100;

    // Random direction for stagger
    const angle = Math.random() * Math.PI * 2;
    const staggerX = Math.cos(angle) * staggerDistance;
    const staggerY = Math.sin(angle) * staggerDistance;

    // Create stagger animation that includes both sprite and health bar
    this.scene.tweens.add({
      targets: [this.sprite, this.healthBar.container],
      x: "+=" + staggerX,
      y: "+=" + staggerY,
      duration: staggerDuration / 2,
      ease: "Quad.Out",
      yoyo: true,
      onComplete: () => {
        // Reset position exactly to avoid drift
        this.sprite.x -= staggerX;
        this.sprite.y -= staggerY;
        this.healthBar.container.setPosition(this.sprite.x, this.sprite.y + this.healthBar.spacing);
      },
    });

    // Reset tint after flash duration
    this.scene.time.delayedCall(this.hitFlashDuration, () => {
      this.sprite.setTint(originalTint);
      this.isStaggered = false;
    });
  }

  updateHealthBar() {
    super.updateHealthBar();
  }

  handleMovement(input) {
    super.handleMovement(input);

    // Update health bar container position to follow player
    if (this.healthBar) {
      this.healthBar.container.setPosition(this.sprite.x, this.sprite.y + this.healthBar.spacing);
    }
  }

  update() {
    super.update();

    // Check if player has moved
    const hasMoved = this.lastX !== this.sprite.x || this.lastY !== this.sprite.y;

    if (hasMoved) {
      console.log(`Player moved from (${this.lastX}, ${this.lastY}) to (${this.sprite.x}, ${this.sprite.y})`);

      // Add trail effect if moving
      const currentTime = Date.now();
      if (currentTime - this.lastTrailTime >= this.trailConfig.spawnInterval) {
        super.createTrailEffect();
        this.lastTrailTime = currentTime;
      }
    }

    // Update last position
    this.lastX = this.sprite.x;
    this.lastY = this.sprite.y;

    // Update health bar position
    if (this.healthBar) {
      this.healthBar.container.setPosition(this.sprite.x, this.sprite.y + this.healthBar.spacing);
    }
  }

  takeDamage(amount) {
    // Don't process damage if already dead
    if (this.isDead) return 0;

    // Get the raw damage before defense
    const rawDamage = Math.max(1, Number(amount) || 0);

    // Call parent class takeDamage which applies defense and returns actual damage dealt
    const damageAfterDefense = super.takeDamage(amount);

    // Calculate how much damage was blocked by defense
    const blockedDamage = rawDamage - damageAfterDefense;

    // Show both the damage taken and blocked amount
    if (damageAfterDefense > 0) {
      const damageText = this.scene.add
        .text(this.sprite.x, this.sprite.y - 20, `-${damageAfterDefense}`, {
          fontSize: "20px",
          fill: "#ff0000",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      // If any damage was blocked, show it
      if (blockedDamage > 0) {
        const blockedText = this.scene.add
          .text(this.sprite.x + 20, this.sprite.y - 20, `(${blockedDamage} blocked)`, {
            fontSize: "16px",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 4,
          })
          .setOrigin(0, 0.5);

        // Animate the blocked text
        this.scene.tweens.add({
          targets: blockedText,
          y: blockedText.y - 30,
          alpha: 0,
          duration: 1000,
          ease: "Cubic.Out",
          onComplete: () => {
            blockedText.destroy();
          },
        });
      }

      // Animate the damage text
      this.scene.tweens.add({
        targets: damageText,
        y: damageText.y - 30,
        alpha: 0,
        duration: 1000,
        ease: "Cubic.Out",
        onComplete: () => {
          damageText.destroy();
        },
      });
    }

    // Check for death
    if (this.stats.currentHealth <= 0 && !this.isDead) {
      this.isDead = true;
      this.sprite.setTint(0x666666); // Darken the player sprite
      this.movementEnabled = false; // Disable movement

      // Add a slight random rotation and drift
      const randomAngle = Phaser.Math.FloatBetween(-0.5, 0.5);
      const randomVelocityX = Phaser.Math.FloatBetween(-20, 20);
      const randomVelocityY = Phaser.Math.FloatBetween(-20, 20);

      if (this.sprite.body) {
        this.sprite.body.setAngularVelocity(randomAngle);
        this.sprite.body.setVelocity(randomVelocityX, randomVelocityY);
        this.sprite.body.setDrag(0.1);
      }

      // Call onDeath to handle cleanup and event emission
      this.onDeath();
    }

    this.updateHealthBar();
    return damageAfterDefense;
  }

  heal(amount) {
    // Don't allow healing if dead
    if (this.isDead) return;

    super.heal(amount);
    this.updateHealthBar();
  }

  onDeath() {
    // Clean up all weapons and projectiles
    if (this.scene.weapons) {
      this.scene.weapons.forEach((weapon) => {
        if (weapon && typeof weapon.destroy === "function") {
          weapon.destroy();
        }
      });
    }

    // Clean up health bar
    if (this.healthBar) {
      this.healthBar.container.destroy();
    }

    // Emit death event
    this.scene.events.emit("playerDeath", {
      level: this.experience.level,
      gold: this.inventory.gold,
    });

    super.onDeath();
  }

  gainXP(amount) {
    this.experience.current += amount;

    while (this.experience.current >= this.experience.toNextLevel) {
      this.levelUp();
    }

    // Emit XP gained event
    this.scene.events.emit("playerXPGained", {
      current: this.experience.current,
      toNext: this.experience.toNextLevel,
      level: this.experience.level,
    });
  }

  levelUp() {
    this.experience.level++;
    this.experience.current -= this.experience.toNextLevel;

    // New XP curve: Base*(1.2^level) instead of linear 1.5x
    // This makes early levels easier but maintains challenge
    const baseXP = 100;
    this.experience.toNextLevel = Math.floor(baseXP * Math.pow(1.2, this.experience.level));

    // Increase stats on level up with logarithmic scaling for better balance
    const baseHealth = 10;
    const baseDamage = 2;
    const healthIncrease = Math.floor(baseHealth + Math.log(this.experience.level) * 3); // Logarithmic health scaling
    const damageIncrease = Math.floor(baseDamage + Math.log(this.experience.level) * 0.8); // Logarithmic damage scaling
    const defenseIncrease = Math.min(1, 0.2 + Math.floor(Math.log(this.experience.level) * 0.15)); // Logarithmic defense scaling
    const speedIncrease = Math.min(0.1, 0.05 + Math.log(this.experience.level) * 0.01); // Subtle speed increase

    this.stats.maxHealth += healthIncrease;
    this.stats.currentHealth = this.stats.maxHealth; // Full heal on level up
    this.stats.attackDamage += damageIncrease;
    this.stats.defense += defenseIncrease;
    this.stats.moveSpeed += speedIncrease; // More controlled speed increment

    // Emit level up event for the upgrade menu and stats update
    this.scene.events.emit("showWeaponUpgradeMenu");
    this.scene.updateStatsDisplay(); // Update stats display

    // Show level up effect
    this.showLevelUpEffect();
  }

  showLevelUpEffect() {
    // Create a flashy level up text
    const levelText = this.scene.add
      .text(this.sprite.x, this.sprite.y - 40, `LEVEL UP! ${this.experience.level}`, {
        fontSize: "32px",
        fontFamily: "VT323",
        fill: "#ffd700",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Add some particle effects
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, "powerup-xp-gem", {
      scale: { start: 0.2, end: 0 },
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 1000,
      quantity: 20,
      tint: 0xffd700,
    });

    // Animate the level up text
    this.scene.tweens.add({
      targets: levelText,
      y: levelText.y - 30,
      alpha: 0,
      duration: 2000,
      ease: "Cubic.Out",
      onComplete: () => {
        levelText.destroy();
        particles.destroy();
      },
    });
  }

  collectGold(amount) {
    this.inventory.gold += amount;
    this.scene.events.emit("goldCollected", this.inventory.gold);
  }

  getStats() {
    return {
      ...this.stats,
      experience: this.experience,
      gold: this.inventory.gold,
    };
  }
}

export default MainPlayer;
