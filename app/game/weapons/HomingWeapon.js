import BaseWeapon from './BaseWeapon';
import Projectile from './Projectile';

export default class HomingWeapon extends BaseWeapon {
    constructor(scene, owner, initialType) {
        super(scene, owner, initialType);
        this.target = null;
    }

    setTarget(target) {
        this.target = target;
    }

    createProjectile(angle) {
        const projectile = super.createProjectile(angle);
        
        if (this.target) {
            // Add homing behavior to the projectile
            projectile.setTarget(this.target);
            
            // Override the update method to implement homing behavior
            const originalUpdate = projectile.update.bind(projectile);
            projectile.update = (time, delta) => {
                if (this.target && this.target.active) {
                    // Calculate angle to target
                    const targetAngle = Math.atan2(
                        this.target.y - projectile.y,
                        this.target.x - projectile.x
                    );
                    
                    // Gradually rotate towards target
                    let currentAngle = Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x);
                    const turnSpeed = 0.1; // Adjust this value to control how quickly projectiles turn
                    
                    // Calculate the shortest rotation direction
                    let angleDiff = targetAngle - currentAngle;
                    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    
                    // Apply rotation
                    currentAngle += angleDiff * turnSpeed;
                    
                    // Update velocity
                    const speed = this.stats.projectileSpeed;
                    projectile.body.setVelocity(
                        Math.cos(currentAngle) * speed,
                        Math.sin(currentAngle) * speed
                    );
                }
                
                originalUpdate(time, delta);
            };
        }
        
        return projectile;
    }
}
