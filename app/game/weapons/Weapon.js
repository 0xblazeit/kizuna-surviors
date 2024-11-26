import { weapons } from '../config/weapons';
import Projectile from './Projectile';

export default class Weapon {
  constructor(scene, owner) {
    this.scene = scene;
    this.owner = owner;
    this.lastDirection = 0; // angle in radians
    this.lastFired = 0;
    
    // Create projectile group
    this.projectiles = this.scene.add.group({
      classType: Projectile,
      maxSize: 30,
      runChildUpdate: true
    });
    
    // Set default weapon
    this.setWeapon('hotdog', 0);
  }

  setWeapon(weaponKey, level) {
    this.config = weapons[weaponKey];
    this.stats = this.config.levels[level];
    this.projectileKey = weaponKey;
  }

  updateDirection(direction) {
    this.lastDirection = direction;
  }

  update(time) {
    // Auto-fire weapon based on fire speed
    if (time > this.lastFired + this.stats.fireSpeed) {
      this.fire();
      this.lastFired = time;
    }
  }

  fire() {
    const projectile = this.projectiles.get(
      this.owner.x, 
      this.owner.y, 
      this.projectileKey
    );
    
    if (projectile) {
      projectile.fire(
        this.owner.x,
        this.owner.y,
        this.lastDirection,
        this.stats
      );
    }
  }
}
