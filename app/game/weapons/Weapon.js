import { weapons } from '../config/weapons';
import Projectile from './Projectile';

export default class Weapon {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner;
        this.projectiles = scene.add.group();
        this.direction = Math.PI * -0.5; // Default upward direction
        this.lastFired = 0;
        
        // Set initial weapon
        this.setWeapon('hotdog', 0);
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
        // Auto-fire based on fire speed
        if (time > this.lastFired + this.stats.fireSpeed) {
            this.fire();
            this.lastFired = time;
        }

        // Clean up inactive projectiles
        this.projectiles.children.each(projectile => {
            if (!projectile.active) {
                this.projectiles.remove(projectile, true, true);
            }
        });
    }

    fire() {
        const spreadAngle = Math.PI / 6; // 30 degrees spread
        
        // Calculate angles for multiple projectiles
        const angles = [];
        if (this.stats.count === 1) {
            angles.push(this.direction);
        } else {
            const totalSpread = spreadAngle * (this.stats.count - 1);
            const startAngle = this.direction - totalSpread / 2;
            for (let i = 0; i < this.stats.count; i++) {
                angles.push(startAngle + spreadAngle * i);
            }
        }

        // Create projectiles
        angles.forEach(projAngle => {
            const projectile = new Projectile(
                this.scene,
                this.owner.x,
                this.owner.y,
                'hotdog',
                this.stats
            );
            
            this.projectiles.add(projectile);
            projectile.fire(
                this.owner.x,
                this.owner.y,
                projAngle,
                this.stats.projectileSpeed
            );
        });
    }
}
