const UpgradeMenuScene = Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function UpgradeMenuScene() {
    Phaser.Scene.call(this, { key: "UpgradeMenu" });
  },

  preload: function() {
    // Add loading event handlers first
    this.load.on("loaderror", (file) => {
      console.error("Error loading weapon icon:", file.key, file.src);
    });

    this.load.on("complete", () => {
      console.log("All weapon icons loaded successfully");
    });

    // Preload weapon icons with cache busting and error handling
    const weaponIcons = [
      { key: "weapon-dog-projectile", file: "weapon-dog-projectile.svg" },
      { key: "weapon-wand-icon", file: "weapon-wand-icon.svg" },
      { key: "weapon-hotdog-projectile", file: "weapon-hotdog-projectile.svg" },
      { key: "weapon-axe-projectile", file: "weapon-axe-projectile.svg" },
      { key: "weapon-hammer-projectile", file: "weapon-hammer-projectile.svg" },
      { key: "weapon-magic-milk", file: "weapon-magic-milk.svg" },
      { key: "weapon-shapecraft-key", file: "weapon-shapecraft-key.svg" }
    ];

    weaponIcons.forEach(({ key, file }) => {
      const path = `/assets/game/weapons/${file}?v=${Date.now()}`;
      this.load.svg(key, path, { scale: 0.5 });
      console.log(`Loading weapon icon: ${key} from ${path}`);
    });
  },

  init: function (data) {
    this.parentScene = data.parentScene;
    this.selectedWeapons = data.selectedWeapons;
  },

  create: function () {
    // Verify all required textures are loaded
    const requiredTextures = [
      "weapon-dog-projectile",
      "weapon-wand-icon",
      "weapon-hotdog-projectile",
      "weapon-axe-projectile",
      "weapon-hammer-projectile",
      "weapon-magic-milk",
      "weapon-shapecraft-key"
    ];

    const missingTextures = requiredTextures.filter(key => !this.textures.exists(key));
    if (missingTextures.length > 0) {
      console.error("Missing weapon textures:", missingTextures);
      // Use a default texture for missing ones
      missingTextures.forEach(key => {
        this.textures.on(`addtexture-${key}`, () => {
          console.log(`Texture ${key} loaded successfully`);
        });
      });
    }

    // Create dark overlay
    const overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );
    overlay.setOrigin(0.5);

    // Add "LEVEL UP!" text centered above weapon panels
    const levelUpText = this.add
      .text(
        this.cameras.main.centerX,
        100, // Position above the weapon panels
        "LEVEL UP!",
        {
          fontFamily: "VT323",
          fontSize: "48px",
          color: "#ffff00", // Bright yellow
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Add subtle pulsing animation to the text
    this.tweens.add({
      targets: levelUpText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const cardWidth = 200;
    const cardHeight = 300;
    const cardSpacing = 20;
    const startX =
      -((cardWidth + cardSpacing) * this.selectedWeapons.length) / 2 +
      cardWidth / 2;

    this.selectedWeapons.forEach((weapon, index) => {
      const x =
        this.cameras.main.centerX + startX + (cardWidth + cardSpacing) * index;
      const y = this.cameras.main.centerY;

      // Create card background
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x333333);
      card.setStrokeStyle(2, 0xffffff);
      card.setInteractive({ useHandCursor: true });

      // Add weapon icon
      const iconKey = (() => {
        // Use weapon.name instead of constructor.name since it's more reliable in production
        switch (weapon.name) {
          case "Rotating Dog":
            return "weapon-dog-projectile";
          case "Shamir's Shard":
            return "weapon-wand-icon";
          case "Glizzy Blaster":
            return "weapon-hotdog-projectile";
          case "Flying Axe":
            return "weapon-axe-projectile";
          case "Sonic Hammer":
            return "weapon-hammer-projectile";
          case "Magical Goo":
            return "weapon-magic-milk";
          case "Shapecraft Key":
            return "weapon-shapecraft-key";
          default:
            console.warn(`Unknown weapon type: ${weapon.name}`);
            return "weapon-dog-projectile";
        }
      })();

      // Create and size icon uniformly
      const icon = this.add.image(x, y - 80, iconKey);
      console.log(`Creating weapon icon for ${weapon.name} with key ${iconKey}`);
      const targetSize = 48; // Target size for all icons
      const scale = targetSize / Math.max(icon.width, icon.height);
      icon.setScale(scale);

      // Add weapon name
      this.add
        .text(x, y, weapon.name, {
          fontFamily: "VT323",
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5);

      // Add level text
      const levelText = this.add
        .text(x, y + 40, `Level ${weapon.currentLevel}`, {
          fontFamily: "VT323",
          fontSize: "20px",
          color: "#ffff00",
          align: "center",
        })
        .setOrigin(0.5);

      // Add stats text
      const stats = weapon.stats;
      const statsText = [];
      if (stats.damage) statsText.push(`DMG: ${stats.damage}`);
      if (stats.pierce) statsText.push(`Pierce: ${stats.pierce}`);
      if (stats.cooldown)
        statsText.push(`Speed: ${(1000 / stats.cooldown).toFixed(1)}/s`);

      this.add
        .text(x, y + 80, statsText.join("\n"), {
          fontFamily: "VT323",
          fontSize: "16px",
          color: "#aaaaaa",
          align: "center",
        })
        .setOrigin(0.5);

      // Make card clickable
      card.on("pointerdown", () => {
        weapon.levelUp();
        this.scene.stop();
        this.parentScene.scene.resume();
      });
    });
  },
});

export default UpgradeMenuScene;
