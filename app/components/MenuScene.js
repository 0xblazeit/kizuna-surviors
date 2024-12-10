const MenuScene = Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function MenuScene() {
    Phaser.Scene.call(this, { key: "MenuScene" });
  },

  preload: function() {
    this.load.image('menu-background', '/assets/game/menu/menu-background.png');
  },

  create: function () {
    const { width, height } = this.scale;

    // Add background skull
    const background = this.add.image(width / 2, height / 2, 'menu-background');
    const scale = Math.min(width / background.width, height / background.height) * 1;
    background.setScale(scale);
    // background.setAlpha(0.2); // Make it semi-transparent
    // background.setTint(0x000066); // Give it a blue tint

    // Add dark overlay for better text readability
    // const overlay = this.add.graphics();
    // overlay.fillStyle(0x000033, 0.7);
    // overlay.fillRect(0, 0, width, height);

    // Add title text
    // this.add
    //   .text(width / 2, height / 3, "KIZUNA\nSURVIVORS", {
    //     fontFamily: "VT323",
    //     fontSize: "64px",
    //     color: "#ffffff",
    //     align: "center",
    //     stroke: "#000000",
    //     strokeThickness: 4,
    //   })
    //   .setOrigin(0.5);

    // Add subtitle text
    // this.add
    //   .text(width / 2, height / 3 + 80, "collect gold, survive, become strong", {
    //     fontFamily: "VT323",
    //     fontSize: "24px",
    //     color: "#ffffff",
    //     align: "center",
    //     stroke: "#000000",
    //     strokeThickness: 2,
    //   })
    //   .setOrigin(0.5);

    // Add controls text
    // this.add
    //   .text(width / 2, height / 3 + 140, "Controls: Arrow Keys or WASD", {
    //     fontFamily: "VT323",
    //     fontSize: "24px",
    //     color: "#ffffff",
    //     align: "center",
    //     stroke: "#000000",
    //     strokeThickness: 2,
    //   })
    //   .setOrigin(0.5);

    // Add start text
    const startText = this.add
      .text(width / 2, height * 0.75, "Click or Press Movement Keys to Start", {
        fontFamily: "VT323",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Add blinking effect
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      hold: 400,
    });

    // Handle click
    this.input.on("pointerdown", () => {
      this.scene.start("GameScene");
    });

    // Handle keyboard input
    const startGame = () => this.scene.start("GameScene");

    // Add key listeners
    this.input.keyboard.addKey("W").on("down", startGame);
    this.input.keyboard.addKey("A").on("down", startGame);
    this.input.keyboard.addKey("S").on("down", startGame);
    this.input.keyboard.addKey("D").on("down", startGame);
    this.input.keyboard.addKey("UP").on("down", startGame);
    this.input.keyboard.addKey("LEFT").on("down", startGame);
    this.input.keyboard.addKey("DOWN").on("down", startGame);
    this.input.keyboard.addKey("RIGHT").on("down", startGame);
  },
});

export default MenuScene;
