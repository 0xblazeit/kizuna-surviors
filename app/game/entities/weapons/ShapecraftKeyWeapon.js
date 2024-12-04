import BaseWeapon from './BaseWeapon';

export default class ShapecraftKeyWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player);
        
        this.name = 'Shapecraft Key';
        this.description = 'Conjures geometric shapes with neon trails that seek out enemies';

        // Level-up configurations
        this.levelConfigs = {
            1: {
                damage: 12,
                pierce: 2,
                cooldown: 1200,
                range: 400,
                speed: 280,
                scale: 0.5,
                projectileCount: 2,
                shapeTypes: ['triangle'],
                trailAlpha: 0.6,
                trailScale: 0.95,
                trailSpacing: 0.05,
                trailLength: 6,
                rotationSpeed: 3,
                seekingSpeed: 200,
                glowIntensity: 0.8
            },
            2: {
                damage: 18,
                pierce: 2,
                cooldown: 1100,
                range: 425,
                speed: 290,
                scale: 0.55,
                projectileCount: 2,
                shapeTypes: ['triangle', 'square'],
                trailAlpha: 0.65,
                trailScale: 0.95,
                trailSpacing: 0.05,
                trailLength: 7,
                rotationSpeed: 3.2,
                seekingSpeed: 220,
                glowIntensity: 0.85
            },
            3: {
                damage: 25,
                pierce: 3,
                cooldown: 1000,
                range: 450,
                speed: 300,
                scale: 0.6,
                projectileCount: 3,
                shapeTypes: ['triangle', 'square', 'pentagon'],
                trailAlpha: 0.7,
                trailScale: 0.95,
                trailSpacing: 0.05,
                trailLength: 8,
                rotationSpeed: 3.4,
                seekingSpeed: 240,
                glowIntensity: 0.9
            },
            4: {
                damage: 35,
                pierce: 3,
                cooldown: 900,
                range: 475,
                speed: 310,
                scale: 0.65,
                projectileCount: 3,
                shapeTypes: ['triangle', 'square', 'pentagon', 'hexagon'],
                trailAlpha: 0.75,
                trailScale: 0.95,
                trailSpacing: 0.045,
                trailLength: 9,
                rotationSpeed: 3.6,
                seekingSpeed: 260,
                glowIntensity: 0.95
            },
            5: {
                damage: 48,
                pierce: 4,
                cooldown: 800,
                range: 500,
                speed: 320,
                scale: 0.7,
                projectileCount: 4,
                shapeTypes: ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'],
                trailAlpha: 0.8,
                trailScale: 0.95,
                trailSpacing: 0.04,
                trailLength: 10,
                rotationSpeed: 3.8,
                seekingSpeed: 280,
                glowIntensity: 1.0
            },
            6: {
                damage: 65,
                pierce: 4,
                cooldown: 700,
                range: 525,
                speed: 330,
                scale: 0.75,
                projectileCount: 4,
                shapeTypes: ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'],
                trailAlpha: 0.85,
                trailScale: 0.96,
                trailSpacing: 0.035,
                trailLength: 11,
                rotationSpeed: 4.0,
                seekingSpeed: 300,
                glowIntensity: 1.1
            },
            7: {
                damage: 85,
                pierce: 5,
                cooldown: 600,
                range: 550,
                speed: 340,
                scale: 0.8,
                projectileCount: 5,
                shapeTypes: ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'],
                trailAlpha: 0.9,
                trailScale: 0.96,
                trailSpacing: 0.03,
                trailLength: 12,
                rotationSpeed: 4.2,
                seekingSpeed: 320,
                glowIntensity: 1.2
            },
            8: {
                damage: 110,
                pierce: 5,
                cooldown: 500,
                range: 575,
                speed: 350,
                scale: 0.85,
                projectileCount: 5,
                shapeTypes: ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'],
                trailAlpha: 1.0,
                trailScale: 0.97,
                trailSpacing: 0.025,
                trailLength: 14,
                rotationSpeed: 4.5,
                seekingSpeed: 350,
                glowIntensity: 1.3,
                isMaxLevel: true
            }
        };

        // Initialize at level 1
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.stats = { ...this.levelConfigs[1] };

        // Effect colors for the neon trails
        this.effectColors = {
            primary: 0x00ffff,    // Cyan
            secondary: 0xff00ff,  // Magenta
            energy: 0xf0f0ff,     // Light blue-white
            maxLevel: {
                primary: 0xff1493,   // Deep pink
                secondary: 0x00ffff, // Cyan
                energy: 0xffffff     // Pure white
            }
        };

        this.maxProjectiles = 20;
        this.activeProjectiles = [];
        this.lastFiredTime = 0;

        // Create trail pools for each projectile
        this.trailPools = [];
        this.createProjectiles();
    }

    createProjectiles() {
        // Clear existing projectiles
        this.activeProjectiles.forEach(proj => {
            if (proj.sprite) {
                proj.sprite.destroy();
            }
        });
        this.activeProjectiles = [];

        // Clear existing trail pools
        this.trailPools.forEach(pool => {
            pool.forEach(sprite => {
                if (sprite) sprite.destroy();
            });
        });
        this.trailPools = [];

        // Create new projectiles
        for (let i = 0; i < this.maxProjectiles; i++) {
            const shapeType = this.stats.shapeTypes[i % this.stats.shapeTypes.length];
            const sprite = this.createShapeSprite(shapeType);
            
            this.activeProjectiles.push({
                sprite: sprite,
                active: false,
                pierceCount: this.stats.pierce,
                trailPositions: [],
                lastTrailTime: 0,
                rotation: 0,
                targetEnemy: null,
                state: 'seeking'
            });

            // Create trail pool for this projectile
            const trailPool = [];
            for (let j = 0; j < this.stats.trailLength; j++) {
                const trailSprite = this.createShapeSprite(shapeType);
                trailSprite.setActive(false).setVisible(false);
                trailPool.push(trailSprite);
            }
            this.trailPools.push(trailPool);
        }
    }

    createShapeSprite(shapeType) {
        const graphics = this.scene.add.graphics();
        const size = 30; // Base size for shapes

        // Draw the shape
        graphics.lineStyle(2, this.effectColors.primary);
        graphics.fillStyle(this.effectColors.energy, 0.5);

        switch (shapeType) {
            case 'triangle':
                this.drawTriangle(graphics, size);
                break;
            case 'square':
                this.drawSquare(graphics, size);
                break;
            case 'pentagon':
                this.drawPentagon(graphics, size);
                break;
            case 'hexagon':
                this.drawHexagon(graphics, size);
                break;
            case 'octagon':
                this.drawOctagon(graphics, size);
                break;
        }

        // Convert to sprite
        const texture = graphics.generateTexture(shapeType, size * 2, size * 2);
        graphics.destroy();

        // Create sprite and enable physics
        const sprite = this.scene.add.sprite(0, 0, shapeType);
        this.scene.physics.world.enable(sprite);
        sprite.body.setCollideWorldBounds(true);
        sprite.body.setBounce(1, 1);
        
        return sprite;
    }

    drawPolygon(graphics, size, sides) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
            points.push({
                x: size * Math.cos(angle),
                y: size * Math.sin(angle)
            });
        }
        
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.strokePath();
        graphics.fillPath();
    }

    drawTriangle(graphics, size) {
        this.drawPolygon(graphics, size, 3);
    }

    drawSquare(graphics, size) {
        this.drawPolygon(graphics, size, 4);
    }

    drawPentagon(graphics, size) {
        this.drawPolygon(graphics, size, 5);
    }

    drawHexagon(graphics, size) {
        this.drawPolygon(graphics, size, 6);
    }

    drawOctagon(graphics, size) {
        this.drawPolygon(graphics, size, 8);
    }

    update(time, delta) {
        if (!super.update(time, delta)) {
            return;
        }

        // Auto-fire if cooldown has passed
        if (time - this.lastFiredTime >= this.stats.cooldown) {
            this.attack(time);
        }

        // Update active projectiles
        this.activeProjectiles.forEach((proj, index) => {
            if (!proj.active || !proj.sprite || !proj.sprite.active || !proj.sprite.body) return;

            // Update rotation
            proj.rotation += this.stats.rotationSpeed * (delta / 1000);
            proj.sprite.setRotation(proj.rotation);

            // Update projectile behavior based on state
            switch (proj.state) {
                case 'seeking': {
                    // Find nearest enemy if no target
                    if (!proj.targetEnemy) {
                        proj.targetEnemy = this.findNearestEnemy(proj.sprite.x, proj.sprite.y);
                    }

                    if (proj.targetEnemy && proj.targetEnemy.sprite && proj.targetEnemy.sprite.active && !proj.targetEnemy.isDead) {
                        // Calculate direction to target
                        const dx = proj.targetEnemy.sprite.x - proj.sprite.x;
                        const dy = proj.targetEnemy.sprite.y - proj.sprite.y;
                        const angle = Math.atan2(dy, dx);

                        // Update velocity with seeking behavior
                        const velocity = {
                            x: Math.cos(angle) * this.stats.seekingSpeed,
                            y: Math.sin(angle) * this.stats.seekingSpeed
                        };
                        if (proj.sprite.body) {
                            proj.sprite.body.setVelocity(velocity.x, velocity.y);
                        }
                    } else {
                        // No valid target, continue in current direction
                        const currentAngle = proj.sprite.rotation;
                        if (proj.sprite.body) {
                            proj.sprite.body.setVelocity(
                                Math.cos(currentAngle) * this.stats.speed,
                                Math.sin(currentAngle) * this.stats.speed
                            );
                        }
                        proj.targetEnemy = null;
                    }
                    break;
                }
            }

            // Update trail
            if (time - proj.lastTrailTime >= this.stats.trailSpacing * 1000) {
                proj.trailPositions.unshift({
                    x: proj.sprite.x,
                    y: proj.sprite.y,
                    rotation: proj.rotation,
                    time: time
                });
                proj.lastTrailTime = time;

                // Limit trail length
                if (proj.trailPositions.length > this.stats.trailLength) {
                    proj.trailPositions.pop();
                }
            }

            // Update trail sprites
            const trailSprites = this.trailPools[index];
            trailSprites.forEach((trailSprite, i) => {
                if (i < proj.trailPositions.length) {
                    const pos = proj.trailPositions[i];
                    trailSprite.setActive(true).setVisible(true);
                    trailSprite.setPosition(pos.x, pos.y);
                    trailSprite.setRotation(pos.rotation);

                    // Calculate fade and scale based on position in trail
                    const fadeRatio = 1 - i / this.stats.trailLength;
                    const scaleRatio = Math.pow(this.stats.trailScale, i);
                    trailSprite.setAlpha(this.stats.trailAlpha * fadeRatio);
                    trailSprite.setScale(proj.sprite.scale * scaleRatio);

                    // Set glow effect
                    const glowColor = this.currentLevel === this.maxLevel ? 
                        this.effectColors.maxLevel.primary : 
                        this.effectColors.primary;
                    trailSprite.setTint(glowColor);
                } else {
                    trailSprite.setActive(false).setVisible(false);
                }
            });

            // Check for enemy collisions
            const enemies = this.scene.enemies?.filter(e => e && e.sprite && e.sprite.active && !e.isDead) || [];
            enemies.forEach(enemy => {
                if (proj.active && proj.pierceCount > 0) {
                    const distance = Phaser.Math.Distance.Between(
                        proj.sprite.x,
                        proj.sprite.y,
                        enemy.sprite.x,
                        enemy.sprite.y
                    );

                    if (distance < 30) { // Collision radius
                        this.handleHit(enemy, proj);
                    }
                }
            });

            // Check if projectile is out of range
            const distanceFromStart = Phaser.Math.Distance.Between(
                proj.sprite.x,
                proj.sprite.y,
                this.player.sprite.x,
                this.player.sprite.y
            );

            if (distanceFromStart > this.stats.range) {
                this.deactivateProjectile(proj);
            }
        });
    }

    attack(time) {
        this.lastFiredTime = time;

        // Calculate how many new projectiles we can fire
        const currentActiveCount = this.activeProjectiles.filter(p => p.active).length;
        const maxNewProjectiles = Math.min(
            this.stats.projectileCount,
            this.maxProjectiles - currentActiveCount
        );

        // Fire multiple projectiles in a spread pattern
        for (let i = 0; i < maxNewProjectiles; i++) {
            const angleOffset = ((i * 360) / this.stats.projectileCount) * (Math.PI / 180);
            this.fireProjectile(angleOffset);
        }
    }

    fireProjectile(angleOffset = 0) {
        const proj = this.activeProjectiles.find(p => !p.active);
        if (!proj) return;

        const player = this.player.sprite;

        // Set initial position with offset
        const startAngle = angleOffset;
        const startX = player.x + Math.cos(startAngle) * 50;
        const startY = player.y + Math.sin(startAngle) * 50;

        // Initialize projectile
        proj.active = true;
        proj.sprite.setActive(true).setVisible(true);
        proj.sprite.setPosition(startX, startY);
        proj.sprite.setScale(this.stats.scale);
        
        // Ensure physics body is enabled and exists
        if (!proj.sprite.body) {
            this.scene.physics.world.enable(proj.sprite);
        }
        
        proj.pierceCount = this.stats.pierce;
        proj.rotation = startAngle;
        proj.trailPositions = [];
        proj.lastTrailTime = 0;
        proj.targetEnemy = null;
        proj.state = 'seeking';

        // Set initial velocity
        const velocity = {
            x: Math.cos(startAngle) * this.stats.speed,
            y: Math.sin(startAngle) * this.stats.speed
        };
        if (proj.sprite.body) {
            proj.sprite.body.setVelocity(velocity.x, velocity.y);
        }

        // Add glow effect
        const glowColor = this.currentLevel === this.maxLevel ? 
            this.effectColors.maxLevel.primary : 
            this.effectColors.primary;
        proj.sprite.setTint(glowColor);
    }

    findNearestEnemy(x, y) {
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        const enemies = this.scene.enemies?.filter(e => e && e.sprite && e.sprite.active && !e.isDead) || [];
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });

        return nearestEnemy;
    }

    handleHit(enemy, projectile) {
        // Apply damage
        enemy.takeDamage(this.stats.damage);
        
        // Create hit effect
        this.createHitEffect(enemy.sprite.x, enemy.sprite.y);

        // Reduce pierce count
        projectile.pierceCount--;
        
        // Deactivate projectile if it has no more pierces
        if (projectile.pierceCount <= 0) {
            this.deactivateProjectile(projectile);
        }
    }

    createHitEffect(x, y) {
        const hitEffect = this.scene.add.sprite(x, y, this.currentLevel === this.maxLevel ? 
            this.stats.shapeTypes[0] : 'triangle');
        
        hitEffect.setScale(this.stats.scale * 0.5);
        hitEffect.setAlpha(0.8);
        hitEffect.setTint(this.currentLevel === this.maxLevel ? 
            this.effectColors.maxLevel.energy : 
            this.effectColors.energy);
        hitEffect.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: hitEffect,
            scale: this.stats.scale * 2,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeOut',
            onComplete: () => hitEffect.destroy()
        });
    }

    deactivateProjectile(projectile) {
        projectile.active = false;
        projectile.sprite.setActive(false).setVisible(false);
        if (projectile.sprite.body) {
            projectile.sprite.body.setVelocity(0, 0);
        }
        projectile.targetEnemy = null;
        
        // Hide trail sprites
        const projIndex = this.activeProjectiles.indexOf(projectile);
        if (projIndex >= 0) {
            const trailSprites = this.trailPools[projIndex];
            trailSprites.forEach(sprite => sprite.setActive(false).setVisible(false));
        }
    }

    levelUp() {
        if (this.currentLevel >= this.maxLevel) {
            console.log("Weapon already at max level!");
            return false;
        }

        this.currentLevel++;
        const newStats = this.levelConfigs[this.currentLevel];
        this.stats = { ...this.stats, ...newStats };

        console.log(`Shapecraft Key leveled up to ${this.currentLevel}! New stats:`, this.stats);

        // Recreate projectiles with new stats
        this.createProjectiles();

        // Create level up effect
        const burst = this.scene.add.sprite(
            this.player.sprite.x,
            this.player.sprite.y,
            this.stats.shapeTypes[0]
        );
        burst.setScale(0.2);
        burst.setAlpha(0.7);
        burst.setTint(this.effectColors.energy);

        this.scene.tweens.add({
            targets: burst,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => burst.destroy()
        });

        return true;
    }
}
