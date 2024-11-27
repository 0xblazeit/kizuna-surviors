export const weapons = {
  hotdog: {
    name: 'Glizzly Blaster 4200',
    description: 'Launches explosive hot dogs at enemies',
    icon: '/assets/game/weapons/weapon-hotdog-projectile.svg',
    projectileSprite: '/assets/game/weapons/weapon-hotdog-projectile.svg',
    levels: {
      0: {
        damage: 10,
        duration: 2000,
        fireSpeed: 1500,
        projectileSpeed: 200,
        projectileSize: 1.0,
        area: 1,
        range: 300,
        count: 1,
        pierce: 0,
        special: null
      },
      1: {
        damage: 12,
        duration: 2000,
        fireSpeed: 1450,
        projectileSpeed: 210,
        projectileSize: 1.0,
        area: 1,
        range: 310,
        count: 2,
        pierce: 0,
        special: null
      },
      2: {
        damage: 14,
        duration: 2000,
        fireSpeed: 1400,
        projectileSpeed: 220,
        projectileSize: 1.1,
        area: 1.1,
        range: 320,
        count: 2,
        pierce: 0,
        special: null
      },
      3: {
        damage: 16,
        duration: 2000,
        fireSpeed: 1350,
        projectileSpeed: 230,
        projectileSize: 1.1,
        area: 1.1,
        range: 330,
        count: 2,
        pierce: 0,
        special: null
      },
      4: {
        damage: 18,
        duration: 2000,
        fireSpeed: 1300,
        projectileSpeed: 240,
        projectileSize: 1.4,
        area: 1.2,
        range: 340,
        count: 3,
        pierce: 1,
        special: null
      },
      5: {
        damage: 20,
        duration: 2000,
        fireSpeed: 1250,
        projectileSpeed: 250,
        projectileSize: 1.4,
        area: 1.2,
        range: 350,
        count: 3,
        pierce: 1,
        special: null
      },
      6: {
        damage: 22,
        duration: 2000,
        fireSpeed: 1200,
        projectileSpeed: 260,
        projectileSize: 1.5,
        area: 1.3,
        range: 360,
        count: 3,
        pierce: 1,
        special: null
      },
      7: {
        damage: 24,
        duration: 2000,
        fireSpeed: 1150,
        projectileSpeed: 270,
        projectileSize: 1.5,
        area: 1.3,
        range: 370,
        count: 4,
        pierce: 2,
        special: null
      },
      8: {
        damage: 30,
        duration: 2000,
        fireSpeed: 1000,
        projectileSpeed: 300,
        projectileSize: 1.8,
        area: 1.5,
        range: 400,
        count: 5,
        pierce: 2,
        special: 'EXTRA MUSTARDDDDD'
      }
    }
  },
  wand: {
    name: 'Crystal Wand',
    description: 'Launches homing crystal projectiles',
    icon: '/assets/game/weapons/weapon-wand-icon.svg',
    projectileSprite: '/assets/game/weapons/weapon-wand-projectile.svg',
    levels: {
      0: {
        damage: 12,
        duration: 2000,
        fireSpeed: 800,
        projectileSpeed: 300,
        projectileSize: 0.8,
        area: 1,
        range: 400,
        count: 1,
        pierce: 0,
        special: 'HOMING'
      },
      1: {
        damage: 14,
        duration: 2000,
        fireSpeed: 750,
        projectileSpeed: 320,
        projectileSize: 0.85,
        area: 1,
        range: 420,
        count: 1,
        pierce: 0,
        special: 'HOMING'
      },
      2: {
        damage: 16,
        duration: 2000,
        fireSpeed: 700,
        projectileSpeed: 340,
        projectileSize: 0.9,
        area: 1.1,
        range: 440,
        count: 2,
        pierce: 0,
        special: 'HOMING'
      },
      3: {
        damage: 18,
        duration: 2000,
        fireSpeed: 650,
        projectileSpeed: 360,
        projectileSize: 0.95,
        area: 1.1,
        range: 460,
        count: 2,
        pierce: 1,
        special: 'HOMING'
      },
      4: {
        damage: 20,
        duration: 2000,
        fireSpeed: 600,
        projectileSpeed: 380,
        projectileSize: 1.0,
        area: 1.2,
        range: 480,
        count: 2,
        pierce: 1,
        special: 'HOMING_GLOW'
      },
      5: {
        damage: 22,
        duration: 2000,
        fireSpeed: 550,
        projectileSpeed: 400,
        projectileSize: 1.05,
        area: 1.2,
        range: 500,
        count: 3,
        pierce: 1,
        special: 'HOMING_GLOW'
      },
      6: {
        damage: 24,
        duration: 2000,
        fireSpeed: 500,
        projectileSpeed: 420,
        projectileSize: 1.1,
        area: 1.3,
        range: 520,
        count: 3,
        pierce: 2,
        special: 'HOMING_GLOW'
      },
      7: {
        damage: 26,
        duration: 2000,
        fireSpeed: 450,
        projectileSpeed: 440,
        projectileSize: 1.15,
        area: 1.3,
        range: 540,
        count: 3,
        pierce: 2,
        special: 'HOMING_GLOW'
      },
      8: {
        damage: 28,
        duration: 2000,
        fireSpeed: 400,
        projectileSpeed: 460,
        projectileSize: 1.2,
        area: 1.5,
        range: 600,
        count: 4,
        pierce: 3,
        special: 'HOMING_GLOW'
      }
    }
  }
  // Add more weapons here as needed
};
