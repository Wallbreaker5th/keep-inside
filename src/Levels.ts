import { settings } from "./Settings";

let centered_levels = [
  {
    polygon: [
      [-200, -100],
      [-200, 100],
      [0, 100],
      [50, 0],
      [0, -100],
    ],
    path: [
      [-100, 0],
      [50, 0],
    ],
    time: 2,
    radius: 20,
    guide: true,
  },
  {
    polygon: [
      [-100, -30],
      [-150, 0],
      [-100, 30],
      [100, 22],
      [100, -22],
    ],
    path: [
      [-100, 0],
      [100, 0],
    ],
    time: 2,
    radius: 20,
  },
  {
    polygon: [
      [-200, -100],
      [-200, 100],
      [0, 100],
      [0, -100],
    ],
    path: [
      [-100, 0],
      [100, 0],
      [200, 100],
    ],
    time: 5,
    radius: 20,
  },
  {
    polygon: (() => {
      let result = [];
      for (let i = 0; i < 10; i++) {
        let angle = (Math.PI * 2 * i) / 10;
        result.push([Math.cos(angle) * 100 - 300, Math.sin(angle) * 100]);
      }
      return result;
    })(),
    path: [
      [-300, 0],
      [300, 0],
    ],
    time: 15,
    radius: 20,
  },
  {
    polygon: [
      [-300, -40],
      [300, -40],
      [300, 40],
      [-300, 40],
    ],
    path: [
      [-250, 0],
      [-150, -30],
      [-50, 40],
      [50, -50],
      [150, 60],
      [250, -70],
    ],
    time: 12,
    radius: 20,
  },
  {
    polygon: [
      [-400, -30],
      [200, -30],
      [400, -30],
      [400, 30],
      [-200, 30],
      [-400, 30],
    ],
    path: [
      [-350, 0],
      [-250, 0],
      [-200, 50],
      [-150, 0],
      [150, 0],
      [200, -50],
      [250, 0],
      [350, 0],
    ],
    time: 12,
    radius: 20,
  },
  {
    polygon: [
      [-250, -250],
      [250, -250],
      [250, 250],
    ],
    path: (() => {
      let result = [];
      let cur = [0, 0];
      let step = 50;
      let coefs = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ];
      for (let i = 0; i < 16; i++) {
        let coef = coefs[i % 4];
        step += 20;
        cur[0] += coef[0] * step;
        cur[1] += coef[1] * step;
        result.push(cur.slice());
      }
      return result;
    })(),
    time: 35,
    radius: 20,
  },
];

export let levels = centered_levels.map((level) => {
  return {
    polygon: level.polygon.map((p) => {
      return [p[0] + settings.width / 2, p[1] + settings.height / 2];
    }),
    path: level.path.map((p) => {
      return [p[0] + settings.width / 2, p[1] + settings.height / 2];
    }),
    time: level.time,
    radius: level.radius,
    guide: level.guide,
  };
});
