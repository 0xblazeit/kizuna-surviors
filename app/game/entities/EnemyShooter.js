import EnemyBasic from "./EnemyBasic";

class EnemyShooter extends EnemyBasic {
  constructor(scene, x, y, texture, config = {}) {
    // Set shooter specific defaults
    const shooterConfig = {
      maxHealth: 80, // Less health than basic enemy
      moveSpeed: Phaser.Math.FloatBetween(1.2, 1.4), // Slower than basic enemy
      defense: 0,
      attackSpeed: 1,
      attackDamage: 15, 
      scale: 0.6, // Increased scale for better visibility
      trailTint: 0xff4d4d, 
      attackRange: 800, 
      ...config,
    };

    super(scene, x, y, texture, shooterConfig);

    // Shooter specific properties
    this.type = "shooter";
    
    // Custom separation parameters for shooter enemies
    this.separationRadius = 120; // Largest separation radius since they attack from range
    this.baseSeparationForce = 0.7; // Strong base separation to maintain distance
    this.maxSeparationForce = 2.5; // Strong max separation
    
    // Projectile properties
    this.projectiles = new Set();
    this.projectileSpeed = 300; 
    this.projectileLifetime = 4000; 
    this.attackCooldown = 2000; 
    this.minAttackDistance = 100; 

    // Make sure sprite is visible and configured properly
    if (!this.sprite) {
      console.log("⚠️ Creating new sprite for shooter enemy");
      this.sprite = scene.add.sprite(x, y, texture);
    }

    // Always ensure physics is set up
    if (!this.sprite.body) {
      scene.physics.add.existing(this.sprite);
    }

    // Configure sprite properties
    this.sprite.setScale(shooterConfig.scale);
    this.sprite.setDepth(5);
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
    
    // Configure physics body
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setCircle(20); // Adjust hitbox size
    this.sprite.body.setOffset(12, 12); // Center the hitbox
    this.sprite.body.setBounce(0.1);
    this.sprite.body.setDrag(100);

    // Set target player
    this.targetPlayer = scene.player;
    
    // Make sure movement is enabled
    this.movementEnabled = true;
    this.moveSpeed = shooterConfig.moveSpeed;

    // Initialize movement state
    this.movementState = {
      direction: "right",
      isMoving: false,
    };

    console.log("🎯 Shooter enemy created:", {
      texture: this.sprite?.texture.key,
      scale: this.sprite?.scale,
      visible: this.sprite?.visible,
      x: this.sprite?.x,
      y: this.sprite?.y,
      hasPhysics: this.sprite?.body ? "yes" : "no",
      targetPlayer: this.targetPlayer ? "set" : "missing",
      moveSpeed: this.moveSpeed,
      movementEnabled: this.movementEnabled
    });
    
    // Initialize projectile pool
    this.initProjectilePool();
  }

  initProjectilePool() {
    // Create a pool of reusable projectiles
    this.projectilePool = [];
    const poolSize = 5;

    for (let i = 0; i < poolSize; i++) {
      const projectile = this.scene.add.sprite(0, 0, 'weapon-skull-projectile');
      projectile.setActive(false);
      projectile.setVisible(false);
      projectile.setScale(0.6); // Increased scale for better visibility
      projectile.setDepth(5);
      
      // Add to physics
      this.scene.physics.add.existing(projectile);
      projectile.body.setCircle(8); // Smaller hitbox for projectile
      projectile.body.setOffset(8, 8); // Center the hitbox
      
      this.projectilePool.push(projectile);
    }
  }

  getProjectile() {
    // Get an inactive projectile from the pool
    return this.projectilePool.find(p => !p.active) || null;
  }

  shootProjectile() {
    const projectile = this.getProjectile();
    if (!projectile) return;

    // Calculate direction to player
    const dx = this.targetPlayer.sprite.x - this.sprite.x;
    const dy = this.targetPlayer.sprite.y - this.sprite.y;
    const angle = Math.atan2(dy, dx);

    // Set projectile position and activate it
    projectile.setPosition(this.sprite.x, this.sprite.y);
    projectile.setActive(true);
    projectile.setVisible(true);
    projectile.rotation = angle;

    // Set velocity towards player
    const vx = Math.cos(angle) * this.projectileSpeed;
    const vy = Math.sin(angle) * this.projectileSpeed;
    projectile.body.setVelocity(vx, vy);

    // Add to active projectiles set
    this.projectiles.add(projectile);

    // Set up projectile collision with player
    this.scene.physics.add.overlap(
      projectile,
      this.targetPlayer.sprite,
      this.onProjectileHitPlayer.bind(this),
      null,
      this
    );

    // Deactivate projectile after lifetime
    this.scene.time.delayedCall(this.projectileLifetime, () => {
      this.deactivateProjectile(projectile);
    });

    // Play shoot effect
    this.playShootEffect();
  }

  playShootEffect() {
    // Add visual feedback for shooting
    const flash = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'weapon-skull-projectile');
    flash.setScale(0.3);
    flash.setAlpha(0.7);
    flash.setTint(0xff0000);

    this.scene.tweens.add({
      targets: flash,
      scale: 0.1,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  deactivateProjectile(projectile) {
    projectile.setActive(false);
    projectile.setVisible(false);
    projectile.body.setVelocity(0, 0);
    this.projectiles.delete(projectile);
  }

  onProjectileHitPlayer(projectile, playerSprite) {
    // Deal damage to player
    if (this.targetPlayer && !this.targetPlayer.isDead) {
      this.targetPlayer.takeDamage(this.stats.attackDamage);
    }
    
    // Deactivate the projectile
    this.deactivateProjectile(projectile);
  }

  update(time, delta) {
    if (!this.active || this.isDead || !this.targetPlayer || !this.sprite || !this.sprite.body) {
      return;
    }

    // Update position based on physics body
    this.x = this.sprite.x;
    this.y = this.sprite.y;

    // Calculate distance to player
    const dx = this.targetPlayer.sprite.x - this.sprite.x;
    const dy = this.targetPlayer.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Log position and movement state (every 60 frames)
    if (time % 60 === 0) {
      console.log("🎯 Shooter enemy state:", {
        x: this.sprite.x,
        y: this.sprite.y,
        distance,
        movementEnabled: this.movementEnabled,
        active: this.active,
        isDead: this.isDead,
        velocity: { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y }
      });
    }

    // Handle movement
    if (this.movementEnabled && !this.isStaggered) {
      // Calculate separation from other enemies
      const separation = this.calculateSeparation();

      // If too close to player, move away
      if (distance < this.minAttackDistance) {
        const awayX = -dx / distance;
        const awayY = -dy / distance;
        this.sprite.body.setVelocity(
          (awayX * this.moveSpeed + separation.x) * 60,
          (awayY * this.moveSpeed + separation.y) * 60
        );
      }
      // If too far from player, move closer
      else if (distance > this.attackRange) {
        const towardX = dx / distance;
        const towardY = dy / distance;
        this.sprite.body.setVelocity(
          (towardX * this.moveSpeed + separation.x) * 60,
          (towardY * this.moveSpeed + separation.y) * 60
        );
      }
      // If at good distance, just apply separation
      else {
        this.sprite.body.setVelocity(
          separation.x * 60,
          separation.y * 60
        );
      }

      // Update sprite facing direction
      if (dx < 0) {
        this.sprite.setFlipX(true);
      } else {
        this.sprite.setFlipX(false);
      }

      // Create trail effect
      if (time > this.lastTrailTime + 100) {
        this.createTrailEffect();
        this.lastTrailTime = time;
      }
    }

    // Handle shooting
    if (!this.isStaggered && distance <= this.attackRange && 
        distance >= this.minAttackDistance && 
        Date.now() - this.lastAttackTime >= this.attackCooldown) {
      this.shootProjectile();
      this.lastAttackTime = Date.now();
    }

    // Update projectiles
    this.projectiles.forEach(projectile => {
      if (projectile.active && projectile.body.velocity.length() > 0) {
        projectile.rotation = Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x);
      }
    });
  }

  destroy() {
    // Clean up projectiles
    this.projectiles.forEach(projectile => {
      projectile.destroy();
    });
    this.projectiles.clear();
    this.projectilePool.forEach(projectile => {
      projectile.destroy();
    });
    this.projectilePool = [];
    
    super.destroy();
  }
}

export default EnemyShooter;
