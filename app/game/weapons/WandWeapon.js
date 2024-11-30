import BaseWeapon from './BaseWeapon';
import Projectile from './Projectile';

export default class WandWeapon extends BaseWeapon {
    setWeapon(type, level) {
        super.setWeapon(type, level);
        this.projectileTexture = 'wand';
    }

    calculateProjectileAngles() {
        const count = this.stats.count || 1;
        const angles = [];
        
        // For wand, create a spread pattern
        const spreadAngle = Math.PI / 6; // 30 degrees total spread
        const startAngle = this.direction - (spreadAngle / 2);
        const angleStep = spreadAngle / (count > 1 ? count - 1 : 1);
        
        for (let i = 0; i < count; i++) {
            angles.push(startAngle + (angleStep * i));
        }
        
        return angles;
    }

    createProjectile(angle, index) {
        const count = this.stats.count || 1;
        let offsetX = 0;
        let offsetY = 0;
        
        if (count > 1) {
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
        
        this.scene.projectiles.add(projectile);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.onWorldBounds = true;
        
        projectile.fire(
            this.owner.x + offsetX,
            this.owner.y + offsetY,
            angle,
            this.stats.projectileSpeed
        );
    }
}
