export const weapons = {
  hotdog: {
    name: 'Hot Dog Launcher',
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
        fireSpeed: 1400,
        projectileSpeed: 220,
        projectileSize: 1.1,
        area: 1.1,
        range: 320,
        count: 1,
        pierce: 0,
        special: null
      },
      2: {
        damage: 15,
        duration: 2000,
        fireSpeed: 1300,
        projectileSpeed: 240,
        projectileSize: 1.2,
        area: 1.2,
        range: 340,
        count: 2,
        pierce: 1,
        special: null
      },
      3: {
        damage: 18,
        duration: 2000,
        fireSpeed: 1200,
        projectileSpeed: 260,
        projectileSize: 1.3,
        area: 1.3,
        range: 360,
        count: 2,
        pierce: 1,
        special: 'explosive'
      },
      4: {
        damage: 22,
        duration: 2000,
        fireSpeed: 1100,
        projectileSpeed: 280,
        projectileSize: 1.4,
        area: 1.4,
        range: 380,
        count: 3,
        pierce: 2,
        special: 'explosive'
      },
      5: {
        damage: 27,
        duration: 2000,
        fireSpeed: 1000,
        projectileSpeed: 300,
        projectileSize: 1.5,
        area: 1.5,
        range: 400,
        count: 3,
        pierce: 2,
        special: 'explosive_large'
      }
    }
  }
  // Add more weapons here as needed
};
