import Phaser from "phaser";
import { intersect } from "./Geometry";
import { colors } from "./Colors";
import { settings } from "./Settings";

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
  time: 200,
  raius: 20,
};

export default class InsideScene extends Phaser.Scene {
  objects: any;

  area: number = 0;
  is_running: boolean = false;
  has_begun: boolean = false;
  has_ended: boolean = false;
  time_passed: number = 0;
  time_points: number[] = [];
  circle_stage: number = 0;
  circle_speed: number = 0;
  circle_velocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  pointer_is_active: boolean = false;
  pointer_linking: number = -1;
  pointer_is_dragging: boolean = false;
  pointer_position: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super("KeepInside");
  }

  styledPolygon(points: any): Phaser.GameObjects.Polygon {
    let polygon = this.add.polygon(0, 0, points, 0x000000, 0);
    polygon.setOrigin(0, 0);
    polygon.setStrokeStyle(2, colors.polygon_stroke, 1);
    return polygon;
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
    if (!this.has_begun) {
      this.has_begun = true;
      this.is_running = true;
    }
    if (!this.has_ended) {
      if (this.pointer_is_active) {
        this.pointer_is_dragging = true;
        this.updatePointerLinks(pointer);
      }
    }
  }

  onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.has_ended) {
      this.pointer_is_dragging = false;
      this.updatePointerLinks(pointer);
    }
  }

  updatePointerLinks(pointer: Phaser.Input.Pointer) {
    if (this.has_ended) {
      return;
    }
    this.pointer_position.setTo(pointer.x, pointer.y);
    if (!this.pointer_is_dragging) {
      let new_linking = -1,
        cur_dist = settings.pointer_active_radius;
      for (let i = 0; i < level_data.polygon.length; i++) {
        let dist = Phaser.Math.Distance.Between(
          this.objects.dots[i].x,
          this.objects.dots[i].y,
          pointer.x,
          pointer.y
        );
        if (dist < cur_dist) {
          cur_dist = dist;
          new_linking = i;
        }
      }
      if (new_linking == -1) {
        this.pointer_is_active = false;
        this.pointer_linking = -1;
        this.objects.link.setVisible(false);
      } else {
        this.pointer_is_active = true;
        this.pointer_linking = new_linking;
        this.objects.link.setTo(
          this.objects.dots[this.pointer_linking].x,
          this.objects.dots[this.pointer_linking].y,
          pointer.x,
          pointer.y
        );
        this.objects.link.setVisible(true);
        this.objects.link.setLineWidth(1);
      }
    } else {
      this.objects.link.setTo(
        this.objects.dots[this.pointer_linking].x,
        this.objects.dots[this.pointer_linking].y,
        pointer.x,
        pointer.y
      );
      this.objects.link.setLineWidth(2);
    }
  }

  drag(delta: number = 0) {
    if (this.has_ended || !this.pointer_is_dragging) {
      return;
    }
    let old_polygon = [];
    for(let i = 0; i < this.objects.dots.length; i++) {
      old_polygon.push([this.objects.dots[i].x, this.objects.dots[i].y]);
    }
    let dragged: Phaser.Math.Vector2 = new Phaser.Math.Vector2(
      old_polygon[this.pointer_linking][0],
      old_polygon[this.pointer_linking][1]
    );
    let speed = Math.min(
      delta * settings.max_speed,
      delta *
        Phaser.Math.Distance.Between(
          dragged.x,
          dragged.y,
          this.pointer_position.x,
          this.pointer_position.y
        ) *
        settings.speed_factor
    );
    let drag_vector = new Phaser.Math.Vector2(
      this.pointer_position.x - dragged.x,
      this.pointer_position.y - dragged.y
    )
      .normalize()
      .scale(speed);

    let new_polygon = [];
    for(let i = 0; i < old_polygon.length; i++) {
      new_polygon.push(new Phaser.Math.Vector2(old_polygon[i][0], old_polygon[i][1]));
    }
    new_polygon[this.pointer_linking].add(drag_vector);
    let new_area = new Phaser.Geom.Polygon(
      new_polygon.map((p) => new Phaser.Geom.Point(p.x, p.y))
    ).calculateArea();
    let scale = Math.sqrt(this.area / new_area);
    for(let i = 0; i < new_polygon.length; i++) {
      new_polygon[i].subtract(dragged).scale(scale).add(dragged);
    }

    for(let i = 0; i < new_polygon.length; i++) {
      this.objects.dots[i].x = new_polygon[i].x;
      this.objects.dots[i].y = new_polygon[i].y;
    }
    this.objects.polygon.destroy();
    this.objects.polygon = this.styledPolygon(new_polygon);
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

    this.objects.polygon = this.styledPolygon(level_data.polygon);

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

    this.objects.link = this.add.line(0, 0, 0, 0, 0, 0, colors.link_stroke, 1);
    this.objects.link.setOrigin(0, 0);
    this.objects.link.setVisible(false);

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointerup", this.onPointerUp, this);
    this.input.on("pointermove", this.updatePointerLinks, this);
    this.input.on("pointerout", this.onPointerUp, this)
  }

  update(time: number, delta: number): void {
    if (!this.is_running) {
      return;
    }

    delta /= 1000;
    let delta2 = delta;
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
        this.is_running = false;
        this.has_ended = true;
        break;
      } else {
        this.updateCircleVelocity();
        this.updatePointerLinks(this.input.activePointer);
      }
    }

    this.drag(delta2);
  }
}
