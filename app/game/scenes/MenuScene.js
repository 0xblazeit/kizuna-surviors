const MenuScene = {
  key: 'MenuScene',

  create: function() {
    const { width, height } = this.scale;

    // Add title text
    const titleText = this.add.text(width / 2, height / 3, 'Kizuna Survivors', {
      fontFamily: 'var(--font-vt323)',
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add start text
    const startText = this.add.text(width / 2, height / 2, 'Click or Press Movement Keys to Start', {
      fontFamily: 'var(--font-vt323)',
      fontSize: '32px',
      color: '#ffdd00'
    }).setOrigin(0.5);

    // Setup click handler
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Setup keyboard input
    this.input.keyboard.on('keydown-W', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-A', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-S', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-D', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-UP', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-LEFT', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-DOWN', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-RIGHT', () => this.scene.start('GameScene'));
  }
};

export default MenuScene;
