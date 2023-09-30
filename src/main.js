import Phaser from "phaser";

import InsideScene from "./InsideScene";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 948,
  height: 533,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 200 },
    },
  },
  scene: [InsideScene],
  backgroundColor: "#bef",
};

export default new Phaser.Game(config);
