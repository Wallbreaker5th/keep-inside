import * as Tone from "tone";

export class BGM {
  // enumerate for different status
  static readonly STOPPED = 0;
  static readonly BEFORE_START = 10;
  static readonly GAME_1 = 20;
  static readonly GAME_2 = 21;
  static readonly GAME_3 = 22;
  static readonly GAME_4 = 23;
  static readonly GAME_5 = 24;
  static readonly GAME_WIN = 30;
  static readonly GAME_LOSE = 31;

  static readonly volume = -10;

  status = BGM.STOPPED;

  readonly sequences = {
    GAME_1: {
      notes: [
        { note: "C4", duration: "8n", offset: "+0" },
        { note: "E4", duration: "8n", offset: "+0:0:0.01" },
        { note: "G4", duration: "16n", offset: "+0:1:0" },
        { note: "E4", duration: "16n", offset: "+0:1:2" },
        { note: "B4", duration: "8n", offset: "+0:2:0" },
      ],
      duration: "+0:3:0",
      bpm: 250,
    },
    GAME_2: {
      notes: [
        { note: "G4", duration: "8n", offset: "+0" },
        { note: "B4", duration: "8n", offset: "+0:0:0.01" },
        { note: "E4", duration: "16n", offset: "+0:1:0" },
        { note: "C5", duration: "16n", offset: "+0:1:2" },
        { note: "F4", duration: "8n", offset: "+0:2:0" },
      ],
      duration: "+0:3:0",
      bpm: 270,
    },
    GAME_3: {
      notes: [
        { note: "F#4", duration: "16n", offset: "+0" },
        { note: "A#4", duration: "16n", offset: "+0:0:0.01" },
        { note: "F#4", duration: "16n", offset: "+0:0:2" },
        { note: "C4", duration: "16n", offset: "+0:1:0" },
        { note: "Eb4", duration: "16n", offset: "+0:1:2" },
        { note: "C4", duration: "16n", offset: "+0:2:0" },
        { note: "Eb4", duration: "16n", offset: "+0:2:2" },
      ],
      duration: "+0:3:0",
      bpm: 300,
    },
    GAME_4: {
      notes: [
        { note: "C4", duration: "16n", offset: "+0" },
        { note: "E4", duration: "16n", offset: "+0:0:0.01" },
        { note: "E4", duration: "16n", offset: "+0:0:2" },
        { note: "F#4", duration: "16n", offset: "+0:1:0" },
      ],
      duration: "+0:1:2",
      bpm: 300,
    },
    GAME_5: {
      notes: [
        { note: "Db4", duration: "16n", offset: "+0" },
        { note: "Fb4", duration: "16n", offset: "+0:0:0.01" },
        { note: "D4", duration: "16n", offset: "+0:0:2" },
        { note: "Eb4", duration: "16n", offset: "+0:1:0" },
      ],
      duration: "+0:1:2",
      bpm: 300,
    },
  };

  readonly synth = new Tone.Synth().toDestination();

  chooseSequence(): {
    notes: { note: string; duration: string; offset: string }[];
    duration: string;
  } {
    if (this.status >= BGM.GAME_1 && this.status <= BGM.GAME_5) {
      return this.sequences[`GAME_${this.status - BGM.GAME_1 + 1}`];
    }
    return { notes: [], duration: "+0:0:1" };
  }

  off() {
    Tone.Destination.volume.value = -Infinity;
  }

  on() {
    Tone.Destination.volume.value = BGM.volume;
  }

  // play a sequence of notes
  playSequence(sequence: {
    notes: { note: string; duration: string; offset: string }[];
    duration: string;
  }) {
    for (let note of sequence.notes) {
      if (Math.random() < 0.2) {
        // choose another note in the sequence
        let index = Math.floor(Math.random() * sequence.notes.length);
        this.synth.triggerAttackRelease(
          sequence.notes[index].note,
          note.duration,
          note.offset
        );
      } else {
        this.synth.triggerAttackRelease(note.note, note.duration, note.offset);
      }
    }
    console.log("t1",sequence.duration);
    Tone.Transport.scheduleOnce(() => {
      this.playSequence(this.chooseSequence());
      console.log("t2");
    }, sequence.duration);
  }

  async start() {
    Tone.Transport.bpm.value = 300;
    Tone.Transport.start();
    this.on();

    this.playSequence(this.chooseSequence());
  }
}
