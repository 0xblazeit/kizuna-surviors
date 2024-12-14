import { BaseWeapon } from "./BaseWeapon.js";

export class AwakenWeapon extends BaseWeapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Awaken";
    this.description = "Awaken and see";
    this.type = "magic";

    // Level-up configurations
    this.levelConfigs = {
      1: {
        damage: 45,
        pierce: 999,
        cooldown: 5000,
        range: 250,
        speed: 0,
        scale: 0.6,
        pullForce: 300,
        duration: 3000,
        voidCount: 1,
      },
      2: {
        damage: 75,
        pierce: 999,
        cooldown: 4800,
        range: 275,
        speed: 0,
        scale: 0.65,
        pullForce: 350,
        duration: 3200,
        voidCount: 1,
      },
      3: {
        damage: 120,
        pierce: 999,
        cooldown: 4600,
        range: 300,
        speed: 0,
        scale: 0.7,
        pullForce: 400,
        duration: 3400,
        voidCount: 1,
      },
      4: {
        damage: 180,
        pierce: 999,
        cooldown: 4400,
        range: 325,
        speed: 0,
        scale: 0.75,
        pullForce: 450,
        duration: 3600,
        voidCount: 1,
      },
      5: {
        damage: 255,
        pierce: 999,
        cooldown: 4200,
        range: 350,
        speed: 0,
        scale: 0.8,
        pullForce: 500,
        duration: 3800,
        voidCount: 1,
      },
      6: {
        damage: 345,
        pierce: 999,
        cooldown: 4000,
        range: 375,
        speed: 0,
        scale: 0.85,
        pullForce: 550,
        duration: 4000,
        voidCount: 1,
      },
      7: {
        damage: 450,
        pierce: 999,
        cooldown: 3800,
        range: 400,
        speed: 0,
        scale: 0.9,
        pullForce: 600,
        duration: 4200,
        voidCount: 1,
      },
      8: {
        damage: 570,
        pierce: 999,
        cooldown: 3600,
        range: 450,
        speed: 0,
        scale: 1,
        pullForce: 700,
        duration: 4500,
        voidCount: 1,
        dimensionalRift: true,
      },
    };

    this.currentLevel = 1;
    this.updateStats(this.currentLevel);
    this.voidPortals = this.scene.add.group();
  }

  updateStats(level) {
    const config = this.levelConfigs[level];
    if (config) {
      this.stats = { ...config };
      this.currentLevel = level;
    }
  }

  getRandomPosition() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.stats.range;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;
    return { x, y };
  }

  createVoidPortal(x, y) {
    // Create the main portal sprite
    const portal = this.scene.add.sprite(x, y, "weapon-awaken-icon");
    portal.setScale(this.stats.scale);
    portal.setAlpha(0);

    // Create an outer ring graphic
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, 0x00ff00, 1);
    ring.strokeCircle(0, 0, 30);
    ring.setAlpha(0);

    // Create an inner void graphic
    const void1 = this.scene.add.graphics();
    void1.fillStyle(0x000000, 0.7);
    void1.fillCircle(0, 0, 25);
    void1.setAlpha(0);

    // Create a container to hold all elements
    const container = this.scene.add.container(x, y, [void1, ring, portal]);

    // Fade in animation with scale effect
    this.scene.tweens.add({
      targets: [portal, ring, void1],
      alpha: { from: 0, to: 1 },
      scale: { from: 0.1, to: this.stats.scale },
      duration: 500,
      ease: "Power2",
    });

    // Add rotation animation
    this.scene.tweens.add({
      targets: ring,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
    });

    // Dimensional rift effect at level 8
    if (this.stats.dimensionalRift) {
      const riftLines = this.scene.add.graphics();
      container.add(riftLines);

      // Create pulsing rift lines
      const updateRiftLines = () => {
        riftLines.clear();
        riftLines.lineStyle(2, 0x00ff00, 0.8);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 35 + Math.sin(this.scene.time.now / 500) * 10;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          riftLines.beginPath();
          riftLines.moveTo(0, 0);
          riftLines.lineTo(x, y);
          riftLines.strokePath();
        }
      };

      this.scene.events.on("update", updateRiftLines);
    }

    // Add game object properties
    container.pullForce = this.stats.pullForce;
    container.damage = this.stats.damage;
    container.range = this.stats.range;
    container.createdAt = this.scene.time.now;
    container.duration = this.stats.duration;

    this.voidPortals.add(container);
    return container;
  }

  attack(time) {
    this.lastFiredTime = time;

    // Create multiple void portals based on level
    for (let i = 0; i < this.stats.voidCount; i++) {
      const pos = this.getRandomPosition();
      this.createVoidPortal(pos.x, pos.y);
    }
  }

  updateProjectile(portal) {
    if (!portal.active) return;

    // Check if portal duration has expired
    if (this.scene.time.now - portal.createdAt >= portal.duration) {
      // Fade out animation before destroying
      this.scene.tweens.add({
        targets: portal,
        alpha: 0,
        scale: 0.1,
        duration: 500,
        ease: "Power2",
        onComplete: () => {
          portal.destroy();
        },
      });
      return;
    }

    // Pull in nearby enemies
    const enemies = this.scene.enemies.getChildren();
    enemies.forEach((enemy) => {
      if (!enemy.active) return;

      const distance = Phaser.Math.Distance.Between(portal.x, portal.y, enemy.x, enemy.y);

      if (distance <= portal.range) {
        // Calculate pull direction
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, portal.x, portal.y);

        // Pull force decreases with distance
        const pullStrength = (1 - distance / portal.range) * portal.pullForce;

        // Apply pull force
        enemy.x += Math.cos(angle) * pullStrength * (1 / 60);
        enemy.y += Math.sin(angle) * pullStrength * (1 / 60);

        // Apply damage
        enemy.takeDamage(portal.damage * (1 / 60));
      }
    });
  }

  destroy() {
    this.voidPortals.clear(true, true);
    this.isDestroyed = true;
  }
}

export default AwakenWeapon;
