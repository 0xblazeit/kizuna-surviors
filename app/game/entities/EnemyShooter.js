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
      scale: 0.4,
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
      projectile.setScale(0.4);
      projectile.setDepth(5);
      
      // Add to physics
      this.scene.physics.add.existing(projectile);
      projectile.body.setCircle(10); // Adjust hitbox size as needed
      
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

  update() {
    super.update();

    const currentTime = Date.now();

    // Only attack if cooldown is ready and within range
    if (this.targetPlayer && !this.isDead && !this.isStaggered) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.targetPlayer.sprite.x,
        this.targetPlayer.sprite.y
      );

      // If within attack range but not too close
      if (distance <= this.attackRange && 
          distance >= this.minAttackDistance && 
          currentTime - this.lastAttackTime >= this.attackCooldown) {
        this.shootProjectile();
        this.lastAttackTime = currentTime;
      }
    }

    // Update projectile rotations to face their movement direction
    this.projectiles.forEach(projectile => {
      if (projectile.body.velocity.length() > 0) {
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
