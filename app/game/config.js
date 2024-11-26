import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';

const config = {
  type: 'canvas',
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: [MenuScene, GameScene]
};

export default config;
