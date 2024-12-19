const UpgradeMenuScene = Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function UpgradeMenuScene() {
    Phaser.Scene.call(this, { key: "UpgradeMenu" });
  },

  preload: function () {
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
      { key: "weapon-shapecraft-key", file: "weapon-shapecraft-key.svg" },
    ];

    weaponIcons.forEach(({ key, file }) => {
      const path = `/assets/game/weapons/${file}?v=${Date.now()}`;
      this.load.svg(key, path, { scale: 0.5 });
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
      "weapon-shapecraft-key",
    ];

    // Create dark overlay with fade in
    const overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0
    );
    overlay.setOrigin(0.5);

    // Fade in overlay
    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 400,
      ease: 'Power2'
    });

    // Add "LEVEL UP!" text centered above weapon panels with fade and scale effect
    const levelUpText = this.add
      .text(
        this.cameras.main.centerX,
        100,
        "LEVEL UP!",
        {
          fontFamily: "VT323",
          fontSize: "48px",
          color: "#ffff00",
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.5);

    // Fade in and scale up the text
    this.tweens.add({
      targets: levelUpText,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.out',
      delay: 200
    });

    // Add subtle pulsing animation to the text after it appears
    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: levelUpText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    const cardWidth = 200;
    const cardHeight = 300;
    const cardSpacing = 20;
    const startX = -((cardWidth + cardSpacing) * this.selectedWeapons.length) / 2 + cardWidth / 2;

    // Track currently selected card index and selection state
    this.selectedCardIndex = 0;
    this.cards = [];
    this.cardIndicators = [];
    this.isSelecting = false;

    // Calculate initial positions (off-screen)
    const offScreenY = this.cameras.main.height + cardHeight;

    this.selectedWeapons.forEach((weapon, index) => {
      const x = this.cameras.main.centerX + startX + (cardWidth + cardSpacing) * index;
      const y = this.cameras.main.centerY;

      // Create card container for grouped animations
      const container = this.add.container(x, offScreenY);

      // Create card background
      const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x333333);
      card.setStrokeStyle(2, 0xffffff);
      card.setInteractive({ useHandCursor: true });

      // Add glow effect (initially invisible for non-selected cards)
      const glow = this.add.rectangle(0, 0, cardWidth + 10, cardHeight + 10, 0x00ff00, 0);
      glow.setVisible(index === 0);

      // Add down carrot indicator
      const carrot = this.add
        .text(0, -cardHeight / 2 - 20, "▼", {
          fontSize: "24px",
          color: "#00ff00",
        })
        .setOrigin(0.5);
      carrot.setVisible(index === 0);

      // Store references
      this.cards.push(card);
      this.cardIndicators.push({ glow, carrot });

      // Add weapon icon (initially invisible)
      const iconKey = (() => {
        switch (weapon.name) {
          case "Taco Doggie": return "weapon-dog-projectile";
          case "Shamir's Shard": return "weapon-wand-icon";
          case "Glizzy Blaster": return "weapon-hotdog-projectile";
          case "Reverb Reaper": return "weapon-axe-projectile";
          case "WattWhacker": return "weapon-hammer-projectile";
          case "GooBoo": return "weapon-magic-milk";
          case "Shapebinder": return "weapon-shapecraft-key";
          case "Awakened": return "weapon-awaken";
          default:
            console.warn(`Unknown weapon type: ${weapon.name}`);
            return "weapon-dog-projectile";
        }
      })();

      const icon = this.add.image(0, -80, iconKey);
      const targetSize = 48;
      const scale = targetSize / Math.max(icon.width, icon.height);
      icon.setScale(scale).setAlpha(0);

      // Add weapon name (initially invisible)
      const nameText = this.add
        .text(0, 0, weapon.name, {
          fontFamily: "VT323",
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5)
        .setAlpha(0);

      // Add all elements to the container
      container.add([glow, card, carrot, icon, nameText]);

      // Add level stars in two rows (initially invisible)
      const maxLevel = 8;
      const starsPerRow = 4;
      const starSpacing = 20;
      const rowSpacing = 20;
      const startStarX = -((starsPerRow - 1) * starSpacing) / 2;
      const startStarY = 30;

      const stars = [];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < starsPerRow; col++) {
          const starIndex = row * starsPerRow + col;
          const starX = startStarX + col * starSpacing;
          const starY = startStarY + row * rowSpacing;

          const starSymbol = starIndex < weapon.currentLevel ? "★" : "☆";
          const starColor = starIndex < weapon.currentLevel ? "#ffff00" : "#666666";

          const star = this.add
            .text(starX, starY, starSymbol, {
              fontFamily: "VT323",
              fontSize: "24px",
              color: starColor,
              align: "center",
            })
            .setOrigin(0.5)
            .setStroke("#000000", 3)
            .setAlpha(0);

          stars.push(star);
          container.add(star);
        }
      }

      // Add level indicator text (initially invisible)
      const levelText = this.add
        .text(
          ((starsPerRow - 1) * starSpacing) / 2 + 30,
          startStarY + rowSpacing / 2,
          `${weapon.currentLevel}/${maxLevel}`,
          {
            fontFamily: "VT323",
            fontSize: "16px",
            color: "#aaaaaa",
            align: "left",
          }
        )
        .setOrigin(0, 0.5)
        .setAlpha(0);

      container.add(levelText);

      // Add stats text (initially invisible)
      const stats = weapon.stats;
      const statsText = [];
      if (stats.damage) statsText.push(`DMG: ${stats.damage}`);
      if (stats.pierce) statsText.push(`Pierce: ${stats.pierce}`);
      if (stats.cooldown) statsText.push(`Speed: ${(1000 / stats.cooldown).toFixed(1)}/s`);

      const statsTextObj = this.add
        .text(0, startStarY + rowSpacing * 2 + 45, statsText.join("\n"), {
          fontFamily: "VT323",
          fontSize: "16px",
          color: "#aaaaaa",
          align: "center",
          lineSpacing: 8,
        })
        .setOrigin(0.5)
        .setAlpha(0);

      container.add(statsTextObj);

      // Make card clickable
      card.on("pointerdown", () => {
        this.selectCard(index);
      });

      // Animate the card and its elements with staggered timing
      this.time.delayedCall(index * 50, () => {
        // Slide in the container from below with a bounce effect
        this.tweens.add({
          targets: container,
          y: { from: offScreenY, to: y },
          scale: { from: 0.9, to: 1 },
          duration: 500,
          ease: 'Back.out(1.7)',
          onComplete: () => {
            // Fade in and scale up the icon
            this.tweens.add({
              targets: icon,
              alpha: { from: 0, to: 1 },
              scale: { from: 0.7, to: scale },
              duration: 300,
              ease: 'Back.out(2)',
            });

            // Fade in and slide up the name
            this.tweens.add({
              targets: nameText,
              alpha: { from: 0, to: 1 },
              y: { from: 10, to: 0 },
              duration: 300,
              delay: 50,
              ease: 'Power3'
            });

            // Fade in stars one by one with scale effect
            stars.forEach((star, starIndex) => {
              this.tweens.add({
                targets: star,
                alpha: { from: 0, to: 1 },
                scale: { from: 0.5, to: 1 },
                duration: 200,
                delay: 100 + starIndex * 25,
                ease: 'Back.out(2)'
              });
            });

            // Fade in level text with slide
            this.tweens.add({
              targets: levelText,
              alpha: { from: 0, to: 1 },
              x: { from: ((starsPerRow - 1) * starSpacing) / 2 + 40, to: ((starsPerRow - 1) * starSpacing) / 2 + 30 },
              duration: 300,
              delay: 300,
              ease: 'Power2'
            });

            // Fade in stats with slight slide up
            this.tweens.add({
              targets: statsTextObj,
              alpha: { from: 0, to: 1 },
              y: { from: startStarY + rowSpacing * 2 + 55, to: startStarY + rowSpacing * 2 + 45 },
              duration: 300,
              delay: 400,
              ease: 'Power2'
            });

            // Add subtle hover effect to the card
            this.tweens.add({
              targets: card,
              scaleX: 1.02,
              scaleY: 1.02,
              duration: 1500,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
        });
      });

      // Add hover effect to the card
      card.on('pointerover', () => {
        if (!this.isSelecting) {
          this.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 200,
            ease: 'Power2'
          });
        }
      });

      card.on('pointerout', () => {
        if (!this.isSelecting) {
          this.tweens.add({
            targets: container,
            scale: 1,
            duration: 200,
            ease: 'Power2'
          });
        }
      });
    });

    // Add keyboard controls
    this.input.keyboard.on("keydown", (event) => {
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          this.moveSelection(-1);
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveSelection(1);
          break;
        case "ArrowUp":
        case "KeyW":
        case "Space":
          this.selectCard(this.selectedCardIndex);
          break;
      }
    });

    // Add methods for selection handling
    this.moveSelection = (direction) => {
      // Don't allow movement during selection animation
      if (this.isSelecting) return;

      // Hide current indicators
      this.cardIndicators[this.selectedCardIndex].glow.setVisible(false);
      this.cardIndicators[this.selectedCardIndex].carrot.setVisible(false);

      // Update selection
      this.selectedCardIndex = (this.selectedCardIndex + direction + this.cards.length) % this.cards.length;

      // Show new indicators
      this.cardIndicators[this.selectedCardIndex].glow.setVisible(true);
      this.cardIndicators[this.selectedCardIndex].carrot.setVisible(true);

      // Add a subtle pulse animation to the selected card
      this.tweens.add({
        targets: this.cards[this.selectedCardIndex],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    };

    this.selectCard = (index) => {
      // Prevent multiple selections at once
      if (this.isSelecting) return;
      this.isSelecting = true;

      const card = this.cards[index];
      const glow = this.cardIndicators[index].glow;
      const weapon = this.selectedWeapons[index];

      // Make glow visible
      glow.setVisible(true);
      glow.setAlpha(0);

      // Create flash animation
      this.tweens.add({
        targets: glow,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          // After flash, scale up the card
          this.tweens.add({
            targets: card,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            ease: "Back.easeOut",
            onComplete: () => {
              // Finally scale down and complete selection
              this.tweens.add({
                targets: card,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: "Back.easeIn",
                onComplete: () => {
                  weapon.levelUp();
                  this.scene.stop();
                  this.parentScene.scene.resume();
                  this.isSelecting = false;
                },
              });
            },
          });
        },
      });
    };
  },
});

export default UpgradeMenuScene;
