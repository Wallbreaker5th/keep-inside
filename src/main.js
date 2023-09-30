import Phaser from "phaser";

import InsideScene from "./InsideScene";

import { settings } from "./Settings";
import { levels } from "./Levels";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: settings.width,
	height: settings.height,
  scene: [InsideScene],
  backgroundColor: "#bef",
};

let game = new Phaser.Game(config);
export default game;

export function start_level(level) {
  game.scene.scenes[0].init_with_level_data(levels[level]);
}

let music = true;
export function music_on_off() {
  music = !music;
  if (music) {
    game.scene.scenes[0].bgm.on();
  } else {
    game.scene.scenes[0].bgm.off();
  }
  console.log("music", music);
}

for (let i = 0; i < levels.length; i++) {
  let button = document.createElement("button");
  button.id = `level${i}`;
  button.className = "levels-button";
  button.onclick = () => start_level(i);
  button.innerHTML = (i+1).toString();
	document.getElementById("levels").appendChild(button);
}

let button_music = document.getElementById("music");
button_music.onclick = () => music_on_off();
