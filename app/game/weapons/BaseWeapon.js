import { weapons } from '../config/weapons';
import Projectile from './Projectile';

export default class BaseWeapon {
    constructor(scene, owner, initialType = 'hotdog') {
        this.scene = scene;
        this.owner = owner;
        this.projectiles = scene.add.group();
        this.direction = Math.PI * -0.5;
        this.lastFired = 0;
        
        this.setWeapon(initialType, 0);
    }

    setWeapon(type, level) {
        this.type = type;
        this.level = level;
        this.stats = weapons[type].levels[level];
        this.projectileTexture = 'hotdog';
    }

    updateDirection(direction) {
        this.direction = direction;
    }

    update(time) {
        this.tryAutoFire(time);
        this.cleanupProjectiles();
    }

    tryAutoFire(time) {
        if (time > this.lastFired + this.stats.fireSpeed) {
            this.fire();
            this.lastFired = time;
        }
    }

    cleanupProjectiles() {
        this.projectiles.children.each(projectile => {
            if (!projectile.active) {
                this.projectiles.remove(projectile, true, true);
            }
        });
    }

    calculateProjectileAngles() {
        const count = this.stats.count || 1;
        const angles = [];
        const spreadAngle = Math.PI / 6; // 30 degrees
        
        if (count === 1) {
            angles.push(this.direction);
            return angles;
        }

        const totalSpread = spreadAngle * (count - 1);
        const startAngle = this.direction - totalSpread / 2;
        
        for (let i = 0; i < count; i++) {
            angles.push(startAngle + spreadAngle * i);
        }
        
        return angles;
    }

    createProjectile(angle) {
        const projectile = new Projectile(
            this.scene,
            this.owner.x,
            this.owner.y,
            this.projectileTexture,
            this.stats
        );
        
        this.scene.projectiles.add(projectile);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.onWorldBounds = true;
        
        projectile.fire(
            this.owner.x,
            this.owner.y,
            angle,
            this.stats.projectileSpeed
        );
    }

    fire() {
        const now = Date.now();
        if (now - this.lastFired < this.stats.fireRate) return;
        this.lastFired = now;

        const angles = this.calculateProjectileAngles();
        angles.forEach((angle, index) => this.createProjectile(angle, index));
    }
}
