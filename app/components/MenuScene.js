import { useLogin, usePrivy, useLogout } from "@privy-io/react-auth";

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

    const background = this.add.image(width / 2, height / 2, 'menu-background');
    const scale = Math.min(width / background.width, height / background.height) * 1;
    background.setScale(scale);

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
