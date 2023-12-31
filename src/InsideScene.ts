import Phaser from "phaser";
import { intersect, distance } from "./Geometry";
import { colors } from "./Colors";
import { settings } from "./Settings";
import { BGM } from "./BGM";

export default class InsideScene extends Phaser.Scene {
  objects: any;

  level_data: any;
  area: number = 0;

  is_running: boolean = false;
  has_begun: boolean = false;
  has_ended: boolean = false;
  is_win: boolean = false;
  is_lose: boolean = false;
  end_info: string = "";
  min_distance: number = Math.min();

  time_passed: number = 0;
  time_points: number[] = [];
  circle_stage: number = 0;
  circle_speed: number = 0;
  circle_velocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  pointer_is_active: boolean = false;
  pointer_linking: number = -1;
  pointer_is_dragging: boolean = false;
  pointer_position: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  bgm: BGM = new BGM();

  constructor() {
    super("KeepInside");
  }

  styledPolygon(points: any): Phaser.GameObjects.Polygon {
    let polygon = this.add.polygon(0, 0, points, colors.polygon_fill, 0.3);
    polygon.setOrigin(0, 0);
    polygon.setStrokeStyle(2, colors.polygon_stroke, 1);
    return polygon;
  }

  updateCircleVelocity() {
    this.circle_velocity = new Phaser.Math.Vector2(
      this.level_data.path[this.circle_stage + 1][0] -
        this.level_data.path[this.circle_stage][0],
      this.level_data.path[this.circle_stage + 1][1] -
        this.level_data.path[this.circle_stage][1]
    )
      .normalize()
      .scale(this.circle_speed);
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.level_data) {
      return;
    }
    if (!this.has_begun) {
      this.has_begun = true;
      this.is_running = true;
    }
    if (!this.has_ended) {
      if (this.pointer_is_active) {
        this.pointer_is_dragging = true;
        this.updatePointerLinks(pointer);
      }
    } else {
      this.init_with_level_data(null);
    }
  }

  onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.level_data) {
      return;
    }
    if (!this.has_ended) {
      this.pointer_is_dragging = false;
      this.updatePointerLinks(pointer);
    }
  }

  updatePointerLinks(pointer: Phaser.Input.Pointer) {
    if (!this.level_data) {
      return;
    }
    if (this.has_ended) {
      return;
    }
    this.pointer_position.setTo(pointer.x, pointer.y);
    if (!this.pointer_is_dragging) {
      let new_linking = -1,
        cur_dist = settings.pointer_active_radius;
      for (let i = 0; i < this.level_data.polygon.length; i++) {
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
      let dot = this.objects.dots[this.pointer_linking];
      let dist = Phaser.Math.Distance.Between(
        dot.x,
        dot.y,
        pointer.x,
        pointer.y
      );
      if (dist < settings.max_speed / settings.speed_factor) {
        this.objects.link.setTo(dot.x, dot.y, pointer.x, pointer.y);
      } else {
        let drag_vector = new Phaser.Math.Vector2(
          pointer.x - dot.x,
          pointer.y - dot.y
        )
          .normalize()
          .scale(settings.max_speed / settings.speed_factor);
        this.objects.link.setTo(
          dot.x,
          dot.y,
          dot.x + drag_vector.x,
          dot.y + drag_vector.y
        );
      }
      this.objects.link.setLineWidth(2);
    }
  }

  drag(delta: number = 0) {
    if (this.has_ended || !this.pointer_is_dragging) {
      return;
    }
    let old_polygon = [];
    for (let i = 0; i < this.objects.dots.length; i++) {
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
    for (let i = 0; i < old_polygon.length; i++) {
      new_polygon.push(
        new Phaser.Math.Vector2(old_polygon[i][0], old_polygon[i][1])
      );
    }
    new_polygon[this.pointer_linking].add(drag_vector);
    let new_area = new Phaser.Geom.Polygon(
      new_polygon.map((p) => new Phaser.Geom.Point(p.x, p.y))
    ).calculateArea();
    let scale = Math.sqrt(this.area / new_area);
    for (let i = 0; i < new_polygon.length; i++) {
      new_polygon[i].subtract(dragged).scale(scale).add(dragged);
    }

    for (let i = 0; i < new_polygon.length; i++) {
      this.objects.dots[i].x = new_polygon[i].x;
      this.objects.dots[i].y = new_polygon[i].y;
    }
    this.objects.polygon.destroy();
    this.objects.polygon = this.styledPolygon(new_polygon);
  }

  preload() {
    this.load.image("guide", "guide.png");
    this.load.image("background", "background.png");
    this.load.image("ball/smile", "ball/smile.png");
    this.load.image("ball/worry", "ball/worry.png");
    this.load.image("ball/panic", "ball/panic.png");
  }

  init_with_level_data(data: any) {
    // remove old objects
    if (this.objects != null) {
      for (let key in this.objects) {
        if (this.objects[key] instanceof Array) {
          for (let i = 0; i < this.objects[key].length; i++) {
            this.objects[key][i].destroy();
          }
        } else {
          this.objects[key].destroy();
        }
      }
    }

    if (this.level_data == null) {
      this.bgm.start();
    }
    if (data != null) {
      this.level_data = data;
    }
    this.area = new Phaser.Geom.Polygon(
      this.level_data.polygon.map(
        (p: number[]) => new Phaser.Geom.Point(p[0], p[1])
      )
    ).calculateArea();
    this.is_running = false;
    this.has_begun = false;
    this.has_ended = false;
    this.is_win = false;
    this.is_lose = false;
    this.end_info = "";
    this.min_distance = Math.min();
    this.time_passed = 0;
    this.time_points = [];
    this.circle_stage = 0;
    this.circle_speed = 0;
    this.circle_velocity = new Phaser.Math.Vector2(0, 0);
    this.pointer_is_active = false;
    this.pointer_linking = -1;
    this.pointer_is_dragging = false;
    this.pointer_position = new Phaser.Math.Vector2(0, 0);
    this.bgm.status = "BEFORE_START";

    let total_length = 0;
    this.time_points.push(0);
    for (let i = 1; i < this.level_data.path.length; i++) {
      total_length += Phaser.Math.Distance.Between(
        this.level_data.path[i][0],
        this.level_data.path[i][1],
        this.level_data.path[i - 1][0],
        this.level_data.path[i - 1][1]
      );
      this.time_points.push(total_length);
    }
    this.circle_speed = total_length / this.level_data.time;
    for (let i = 0; i < this.time_points.length; i++) {
      this.time_points[i] /= this.circle_speed;
    }
    this.updateCircleVelocity();

    this.objects = {};

    this.objects.background = this.add.image(0, 0, "background");
    this.objects.background.setOrigin(0, 0);
    this.objects.background.setScale(
      this.cameras.main.width / this.objects.background.width,
      this.cameras.main.height / this.objects.background.height
    );

    if (this.level_data.guide) {
      this.objects.guide = this.add.image(850, 400, "guide");
      this.objects.guide.setOrigin(0.5, 0.5);
      this.objects.guide.setScale(0.4);
    }

    this.objects.path = this.add.polygon(
      0,
      0,
      this.level_data.path,
      0x000000,
      0
    );
    this.objects.path.setOrigin(0, 0);
    this.objects.path.setStrokeStyle(2, colors.path_stroke, 1);
    this.objects.path.setClosePath(false);

    this.objects.path_dots = [];
    for (let i = 0; i < this.level_data.path.length; i++) {
      let dot = this.add.circle(
        this.level_data.path[i][0],
        this.level_data.path[i][1],
        4,
        colors.path_stroke,
        1
      );
      this.objects.path_dots.push(dot);
    }

    this.objects.circle = this.add.image(
      this.level_data.path[0][0],
      this.level_data.path[0][1],
      "ball/smile"
    );
    this.objects.circle.setOrigin(0.5, 0.5);
    let circle_scale = this.level_data.radius / (this.objects.circle.width / 2);
    this.objects.circle.setScale(circle_scale);

    this.objects.polygon = this.styledPolygon(this.level_data.polygon);

    this.objects.dots = [];
    for (let i = 0; i < this.level_data.polygon.length; i++) {
      let dot = this.add.circle(
        this.level_data.polygon[i][0],
        this.level_data.polygon[i][1],
        4,
        colors.polygon_dot,
        1
      );
      this.objects.dots.push(dot);
    }

    this.objects.link = this.add.line(0, 0, 0, 0, 0, 0, colors.link_stroke, 1);
    this.objects.link.setOrigin(0, 0);
    this.objects.link.setVisible(false);
  }

  create() {
    this.objects = {};

    this.objects.background = this.add.image(0, 0, "background");
    this.objects.background.setOrigin(0, 0);
    this.objects.background.setScale(
      this.cameras.main.width / this.objects.background.width,
      this.cameras.main.height / this.objects.background.height
    );

    this.objects.please_select = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "Please select a level",
      {
        fontSize: "32pt",
        color: "black",
      }
    );
    this.objects.please_select.setOrigin(0.5, 0.5);

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointerup", this.onPointerUp, this);
    this.input.on("pointermove", this.updatePointerLinks, this);
  }

  endGame(win: boolean, reason: string = "") {
    this.is_running = false;
    this.has_ended = true;
    this.is_win = win;
    this.is_lose = !win;
    this.end_info = reason;
    this.pointer_is_dragging = false;
    this.pointer_is_active = false;
    this.pointer_linking = -1;

    this.objects.overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.5
    );
    this.objects.overlay.setOrigin(0, 0);

    this.objects.text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 32,
      this.is_win ? "You win!" : "You lose!",
      {
        fontSize: "64pt",
        color: "#ffffff",
        fontStyle: "bold",
        fontFamily: "Novem",
      }
    );
    this.objects.text.setOrigin(0.5, 0.5);

    this.objects.text_end_info = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 72,
      this.end_info + "\nClick to restart",
      {
        fontSize: "32pt",
        color: "#ffffff",
        align: "center",
      }
    );
    this.objects.text_end_info.setOrigin(0.5, 0.5);

    this.bgm.status = this.is_win ? "END_WIN" : "END_LOSE";
  }

  updateCirclePosition(delta: number) {
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
      if (this.circle_stage >= this.level_data.path.length - 1) {
        this.endGame(
          true,
          "score: " +
            Math.pow(this.min_distance - this.level_data.radius, 2).toFixed(2)
        );
        break;
      } else {
        this.updateCircleVelocity();
        this.updatePointerLinks(this.input.activePointer);
      }
    }
  }

  updateMood(distance: number) {
    let ratio = (distance - this.level_data.radius) / this.level_data.radius;
    if (ratio < 0.5) {
      this.objects.circle.setTexture("ball/panic");
      this.bgm.status = "GAME_PANIC";
    } else if (ratio < 1.0) {
      this.objects.circle.setTexture("ball/worry");
      this.bgm.status = "GAME_WORRY";
    } else {
      this.objects.circle.setTexture("ball/smile");
      this.bgm.status = "GAME_SMILE";
    }
  }

  checkLose() {
    for (let i = 0; i < this.objects.dots.length; i++) {
      for (let j = i + 2; j < this.objects.dots.length; j++) {
        if (
          intersect(
            this.objects.dots[i].getCenter(),
            this.objects.dots[(i + 1) % this.objects.dots.length].getCenter(),
            this.objects.dots[j].getCenter(),
            this.objects.dots[(j + 1) % this.objects.dots.length].getCenter()
          )
        ) {
          this.endGame(false, "Your polygon has self-intersection.");
          return;
        }
      }
    }

    let dis = Math.min();
    for (let i = 0; i < this.objects.dots.length; i++) {
      let d = distance(
        this.objects.dots[i].getCenter(),
        this.objects.dots[(i + 1) % this.objects.dots.length].getCenter(),
        this.objects.circle.getCenter()
      );
      dis = Math.min(dis, d);
      this.min_distance = Math.min(this.min_distance, d);
      if (d < this.level_data.radius) {
        this.endGame(false, "The circle touches the polygon.");
        return;
      }
    }
    this.updateMood(dis);
  }

  update(time: number, delta: number): void {
    if (!this.is_running) {
      return;
    }

    delta /= 1000;
    this.updateCirclePosition(delta);
    if (this.has_ended) {
      return;
    }
    this.drag(delta);
    this.checkLose();
  }
}
