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
        this.projectileTexture = type === 'wand' ? 'wand' : 'hotdog';
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
        
        if (this.type === 'wand') {
            // For wand, create a spread pattern
            const spreadAngle = Math.PI / 6; // 30 degrees total spread
            const startAngle = this.direction - (spreadAngle / 2);
            const angleStep = spreadAngle / (count > 1 ? count - 1 : 1);
            
            for (let i = 0; i < count; i++) {
                angles.push(startAngle + (angleStep * i));
            }
        } else {
            // Original spread pattern for hotdog
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
        }
        
        return angles;
    }

    createProjectile(angle, index = 0) {
        const count = this.stats.count || 1;
        let offsetX = 0;
        let offsetY = 0;
        
        if (this.type === 'wand' && count > 1) {
            // Create an arc formation for multiple wand projectiles
            const radius = 20; // Distance from the player
            const spreadAngle = Math.PI / 3; // 60 degrees arc
            const startAngle = this.direction - (spreadAngle / 2);
            const angleStep = spreadAngle / (count - 1);
            const positionAngle = startAngle + (angleStep * index);
            
            offsetX = Math.cos(positionAngle) * radius;
            offsetY = Math.sin(positionAngle) * radius;
        }
        
        const projectile = new Projectile(
            this.scene,
            this.owner.x + offsetX,
            this.owner.y + offsetY,
            this.projectileTexture,
            this.stats
        );
        
        // Add to scene's projectile group
        this.scene.projectiles.add(projectile);
        
        // Enable physics body
        projectile.body.setCollideWorldBounds(true);
        projectile.body.onWorldBounds = true;
        
        // Fire the projectile
        projectile.fire(
            this.owner.x + offsetX,
            this.owner.y + offsetY,
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
