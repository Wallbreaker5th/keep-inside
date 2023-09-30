import Phaser from "phaser";
import { intersect } from "./Geometry";
import { colors } from "./Colors";

let level_data = {
  polygon: [
    [100, 100],
    [100, 300],
    [300, 300],
    [300, 100],
  ],
  path: [
    [200, 200],
    [400, 200],
    [500, 300],
  ],
  time: 2,
  raius: 20,
};

export default class InsideScene extends Phaser.Scene {
  objects: any;

  area: number = 0;
  running: boolean = false;
  begun: boolean = false;
  time_passed: number = 0;
  time_points: number[] = [];
  circle_stage: number = 0;
  circle_speed: number = 0;
  circle_velocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super("KeepInside");
  }

  updateCircleVelocity() {
    this.circle_velocity = new Phaser.Math.Vector2(
      level_data.path[this.circle_stage + 1][0] -
        level_data.path[this.circle_stage][0],
      level_data.path[this.circle_stage + 1][1] -
        level_data.path[this.circle_stage][1]
    )
      .normalize()
      .scale(this.circle_speed);
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.begun) {
      return;
    }
    this.begun = true;
    this.running = true;
  }

  preload() {
    this.area = new Phaser.Geom.Polygon(
      level_data.polygon.map((p) => new Phaser.Geom.Point(p[0], p[1]))
    ).calculateArea();

    let total_length = 0;
    this.time_points.push(0);
    for (let i = 1; i < level_data.path.length; i++) {
      total_length += Phaser.Math.Distance.Between(
        level_data.path[i][0],
        level_data.path[i][1],
        level_data.path[i - 1][0],
        level_data.path[i - 1][1]
      );
      this.time_points.push(total_length);
    }
    this.circle_speed = total_length / level_data.time;
    for (let i = 0; i < this.time_points.length; i++) {
      this.time_points[i] /= this.circle_speed;
    }

    this.updateCircleVelocity();
  }

  create() {
    this.objects = {};

    this.objects.path = this.add.polygon(0, 0, level_data.path, 0x000000, 0);
    this.objects.path.setOrigin(0, 0);
    this.objects.path.setStrokeStyle(2, colors.path_stroke, 1);
    this.objects.path.setClosePath(false);

    this.objects.circle = this.add.circle(
      level_data.path[0][0],
      level_data.path[0][1],
      level_data.raius,
      colors.circle_fill,
      1
    );
    this.objects.circle.setStrokeStyle(2, colors.circle_stroke, 1);

    this.objects.polygon = this.add.polygon(
      0,
      0,
      level_data.polygon,
      colors.polygon_fill,
      0.2
    );
    this.objects.polygon.setOrigin(0, 0);
    this.objects.polygon.setStrokeStyle(2, colors.polygon_stroke, 1);

    this.objects.dots = [];
    for (let i = 0; i < level_data.polygon.length; i++) {
      let dot = this.add.circle(
        level_data.polygon[i][0],
        level_data.polygon[i][1],
        4,
        colors.polygon_dot,
        1
      );
      this.objects.dots.push(dot);
    }

    this.input.on("pointerdown", this.onPointerDown, this);
  }

  update(time: number, delta: number): void {
    if (!this.running) {
      return;
    }

    delta /= 1000;
    while (delta > 0) {
      let passed = delta;
      if (this.time_passed + passed > this.time_points[this.circle_stage + 1]) {
        passed = this.time_points[this.circle_stage + 1] - this.time_passed;
        this.circle_stage++;
      }
      delta -= passed;
      this.time_passed += passed;
      this.objects.circle.x += this.circle_velocity.x * passed;
      this.objects.circle.y += this.circle_velocity.y * passed;
      if (this.circle_stage >= level_data.path.length - 1) {
        this.running = false;
        break;
      } else {
        this.updateCircleVelocity();
      }
      console.log(this.circle_stage, this.circle_velocity, this.time_passed);
    }
  }
}
