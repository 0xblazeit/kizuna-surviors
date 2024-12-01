export class BaseWeapon {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.stats = {
            damage: 10,
            pierce: 1,
            count: 1,
            cooldown: 1000, // milliseconds
            range: 200,    // pixels
            speed: 200     // pixels per second
        };
        this.lastFiredTime = 0;
        this.projectiles = this.scene.add.group();
    }

    update(time, delta) {
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }
        
        // Update existing projectiles
        this.projectiles.getChildren().forEach(projectile => {
            this.updateProjectile(projectile, delta);
        });
    }

    attack(time) {
        // To be implemented by specific weapons
        this.lastFiredTime = time;
    }

    updateProjectile(projectile, delta) {
        // To be implemented by specific weapons
    }

    destroy() {
        this.projectiles.clear(true, true);
    }

    levelUp() {
        // To be implemented by specific weapons
    }
}

export default BaseWeapon;
