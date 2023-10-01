import * as Tone from "tone";

export class BGM {
  // enumerate for different status
  // STOPPED, BEFORE_START, GAME_SMILE, GAME_WORRY, GAME_PANIC, END_WIN, END_LOSE

  static readonly volume = -10;

  private _status = "STOPPED";

  readonly short_files = {
    GAME_SMILE: new Tone.Player("/bgm/smile.wav").toDestination(),
    GAME_WORRY: new Tone.Player("/bgm/worry.wav").toDestination(),
    GAME_PANIC: new Tone.Player("/bgm/panic.wav").toDestination(),
  };
  readonly win_and_lose_files = {
    END_WIN: new Tone.Player("/bgm/win.wav").toDestination(),
    END_LOSE: new Tone.Player("/bgm/lose.wav").toDestination(),
  };

  get status() {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  choose() {
    if (this.status in this.short_files) {
      return this.short_files[this.status];
    } else if(this.status in this.win_and_lose_files) {
      return this.win_and_lose_files[this.status];
    } else {
      return null;
    }
  }

  off() {
    Tone.Destination.volume.value = -Infinity;
  }

  on() {
    Tone.Destination.volume.value = BGM.volume;
  }

  play(player: Tone.Player | null) {
    if (player === null) {
      setTimeout(() => {
        this.play(this.choose());
      }, 200);
    } else {
      let now = Tone.now();
      let current_status = this.status;
      player.start();
      setTimeout(() => {
        if(this.status in this.win_and_lose_files && this.status == current_status) {
          this.status = "STOPPED";
        }
        this.play(this.choose());
      }, player.buffer.duration * 1000);
    }
  }

  async start() {
    Tone.Transport.bpm.value = 300;
    Tone.Transport.start();
    this.on();

    Tone.loaded().then(() => {
      this.play(this.choose());
    });
  }
}
