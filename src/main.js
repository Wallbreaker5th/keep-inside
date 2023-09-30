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

for (let i = 0; i < levels.length; i++) {
	// add into <div id="levels"></div>
  let button = document.createElement("button");
	// div.innerHTML = `<button id="level${i}" class="levels-button" onclick="start_level(${i});">${i+1}</button>`;
  button.id = `level${i}`;
  button.className = "levels-button";
  button.onclick = () => start_level(i);
  button.innerHTML = (i+1).toString();
	document.getElementById("levels").appendChild(button);
}
