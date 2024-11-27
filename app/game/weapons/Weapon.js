import { weapons } from '../config/weapons';
import Projectile from './Projectile';

export default class Weapon {
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
        const spreadAngle = Math.PI / 6; // 30 degrees
        const angles = [];

        if (this.type === 'wand') {
            // Machine gun style - vertical spread with slight randomness
            const verticalSpread = Math.PI / 24; // 7.5 degrees
            if (this.stats.count === 1) {
                angles.push(this.direction);
            } else {
                for (let i = 0; i < this.stats.count; i++) {
                    // Add slight random deviation to make it feel more natural
                    const randomDeviation = (Math.random() - 0.5) * (Math.PI / 32); // ±2.8 degrees
                    angles.push(this.direction + randomDeviation);
                }
            }
        } else {
            // Original spread pattern for hotdog
            if (this.stats.count === 1) {
                angles.push(this.direction);
                return angles;
            }

            const totalSpread = spreadAngle * (this.stats.count - 1);
            const startAngle = this.direction - totalSpread / 2;
            
            for (let i = 0; i < this.stats.count; i++) {
                angles.push(startAngle + spreadAngle * i);
            }
        }

        return angles;
    }

    createProjectile(angle) {
        const projectile = new Projectile(
            this.scene,
            this.owner.x,
            this.owner.y,
            this.type === 'wand' ? 'wand' : 'hotdog',  
            this.stats
        );
        
        this.projectiles.add(projectile);
        projectile.fire(
            this.owner.x,
            this.owner.y,
            angle,
            this.stats.projectileSpeed
        );
    }

    fire() {
        const angles = this.calculateProjectileAngles();
        angles.forEach(angle => this.createProjectile(angle));
    }
}
