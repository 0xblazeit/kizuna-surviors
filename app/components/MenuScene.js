const MenuScene = {
  key: "MenuScene",
  create: function () {
    const { width, height } = this.scale;

    // Create a simple background
    const background = this.add.graphics();
    background.fillGradientStyle(0x000033, 0x000033, 0x000066, 0x000066, 1);
    background.fillRect(0, 0, width, height);

    // Add title text
    this.add
      .text(width / 2, height / 3, "KIZUNA\nSURVIVORS", {
        fontFamily: "VT323",
        fontSize: "64px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Add subtitle text
    this.add
      .text(width / 2, height / 3 + 80, "collect gold, survive, become strong", {
        fontFamily: "VT323",
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Add controls text
    this.add
      .text(width / 2, height / 3 + 140, "Controls: Arrow Keys or WASD", {
        fontFamily: "VT323",
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

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
};

export default MenuScene;
