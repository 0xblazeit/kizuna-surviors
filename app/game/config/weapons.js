export const weapons = {
  hotdog: {
    name: 'Hot Dog Launcher',
    description: 'Launches explosive hot dogs at enemies',
    icon: '/assets/game/weapons/weapon-hotdog-projectile.svg',
    projectileSprite: '/assets/game/weapons/weapon-hotdog-projectile.svg',
    levels: {
      0: {
        damage: 10,
        duration: 2000, // milliseconds the projectile lives
        fireSpeed: 1500, // milliseconds between shots
        projectileSpeed: 200,
        area: 1,
        range: 300,
        count: 6,
        special: null
      }
      // Add more levels here as needed
    }
  }
  // Add more weapons here as needed
};
