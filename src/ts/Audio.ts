import { game, ZZFX } from "./Globals";
import { RAD } from "./Geometry";

export class Audio {
  ctx: AudioContext;
  kick: KickInstrument;
  spirit: SpiritInstrument;
  hihat: HiHatInstrument;
  bass: BassSynthInstrument;
  distortion: WaveShaperNode;
  bork: BorkInstrument;

  song: any;
  songFrame: number;

  initialized: boolean;
  muted: boolean;

  private playerAttacked: boolean;
  private playerDodged: boolean;
  private playerHit: boolean;
  private enemyHit: boolean;
  private enemyKilled: boolean;

  constructor() {
    this.initialized = false;
    this.muted = false;
  }

  init() {
    //return;
    if (this.initialized) return;
    this.initialized = true;

    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    this.kick = new KickInstrument(this.ctx, 0.8);
    this.spirit = new SpiritInstrument(this.ctx);
    this.hihat = new HiHatInstrument(this.ctx, 0.7);
    this.bass = new BassSynthInstrument(this.ctx, 0.9);
    this.bork = new BorkInstrument(this.ctx);

    this.song = this.createSong1();
    this.songFrame = -1;

    this.kick.play(1, this.ctx.currentTime);

    /*this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = makeDistortionCurve2(350);
    this.distortion.oversample = '4x';*/
  }

  createSong1() {
    let framesPerBeat = 8;
    let song = [];

    let C = 3 - 24 - 12 - 12 + 0;

    let input = [
      [ [1], [],  [1], [] ],
      [ [],  [],  [2], [] ],
      [ [1], [],  [1], [] ],
      [ [],  [],  [2], [] ],
      [ [],  [1], [1], [] ],
      [ [],  [],  [2], [] ],
      [ [1], [],  [1], [] ],
      [ [],  [],  [2], [] ],
      [ [1], [],  [1], [] ],
      [ [],  [],  [2], [] ],
      [ [],  [],  [1], [] ],
      [ [],  [],  [2], [] ],
      [ [],  [1], [1], [] ],
      [ [],  [],  [2], [] ],
      [ [],  [],  [1], [] ],
      [ [],  [],  [2], [] ]
    ];

    for (let row of input) {
      song.push(row);
      for (let i = 0; i < framesPerBeat - 1; i++) song.push(undefined);
    }

    return song;
  }

  queueSongNotes() {
    if (!this.initialized) return;
    if (this.muted) return;

    this.songFrame = (this.songFrame + 1) % this.song.length;
    let tracks = this.song[this.songFrame];

    if (tracks) {
      if (tracks[0][0] !== undefined) {
        this.kick.play(tracks[0][0], this.ctx.currentTime);
      }
      if (tracks[1][0] !== undefined) {
        this.hihat.play(tracks[1][0], this.ctx.currentTime);
      }
      if (tracks[2][0] !== undefined && game.menuStack.length === 0) {
        let note = 3 - 24 - 12 - 12 + 0; // C

        if (tracks[2][0] === 1) {
          // on-beat
          if (this.playerHit) {
            this.z(2307);
          }
          this.playerHit = false;
          this.playerAttacked = false;
        } else if (tracks[2][0] === 2) {
          // off-beat
          if (this.enemyHit) {
            this.z(25520);
          }
          if (this.playerDodged) {
            this.z(12377);
            note = undefined;
          } else if (this.enemyKilled) {
            note += 6; // F#
          } else if (this.enemyHit) {
            note = undefined;
          } else {
            note = undefined;
          }

          this.enemyHit = false;
          this.enemyKilled = false;
          this.playerDodged = false;
        }

        if (note !== undefined) {
          this.bass.play(note, this.ctx.currentTime);
        }
      }
    }
  }

  triggerPlayerAttacked() {
    this.playerAttacked = true;
  }

  triggerPlayerDodged() {
    this.z(55574,{length:.2});
    //this.playerDodged = true;
  }

  triggerPlayerHit() {
    this.playerHit = true;
  }

  triggerEnemyHit() {
    //this.enemyHit = true;
          //if (this.enemyHit) {
           // ZZFX.z(25520);
            //ZZFX.z(96122,{randomness:.4,frequency:400,noise:.3});
            //ZZFX.z(43545,{frequency:42,length:.3});
            this.z(71914,{volume:.7,length:.1,attack:.79,slide:5.1,noise:1.2,modulation:9});
          //}
  }

  triggerEnemyKilled() {
    this.enemyKilled = true;
  }

  triggerPlayerDeflected() {
    // ?
  }

  z(...args: any[]) {
    if (this.muted) return;
    ZZFX.z(...args);
  }
}

export abstract class Instrument {
  ctx: AudioContext;
  master: GainNode;

  constructor(ctx: AudioContext, initialGain?: number) {
    this.ctx = ctx;
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.master.gain.value = initialGain || 1;
  }

  abstract play(time: number, note?: number, length?: number): void;
}

export class BorkInstrument extends Instrument {
  play(note: number, time: number) {
    let length = 0.34;
    let osc1 = this.ctx.createOscillator();
    let osc2 = this.ctx.createOscillator();
    let gain1 = this.ctx.createGain();

    var bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 440; //440;
    bandpass.detune.value = note;
    bandpass.Q.value = 35;
    bandpass.connect(gain1);

    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(1, time + length * 0.15);
    gain1.gain.setValueAtTime(1, time + length * 0.6);
    gain1.gain.linearRampToValueAtTime(0, time + length * 0.96);
    gain1.connect(this.master);

    osc1.connect(bandpass);
    osc1.type = 'sine';
    osc1.frequency.value = 440 * 0.9;
    osc1.detune.value = note * 100;
    osc1.start(time);
    osc1.stop(time + length);
    osc2.connect(bandpass);
    osc2.type = 'triangle';
    osc2.frequency.value = 440 * 1.1;
    osc2.detune.value = note * 100;
    osc2.start(time);
    osc2.stop(time + length);
  }
}

export class SpiritInstrument extends Instrument {
  play(note: number, time: number) {
    var node = this.ctx.createBufferSource(),
        buffer = this.ctx.createBuffer(1, 4096, this.ctx.sampleRate),
        data = buffer.getChannelData(0);
    let gain1 = this.ctx.createGain();
    let bq1 = this.ctx.createBiquadFilter();
    let bq2 = this.ctx.createBiquadFilter();
    for (var i = 0; i < 4096; i++) {
      data[i] = Math.random();
    }

    node.buffer = buffer;
    node.loop = true;

    node.start(time);
    node.stop(time + 0.5);

    bq1.type = 'peaking';
    bq1.frequency.setValueAtTime(note, time);
    bq1.Q.setValueAtTime(100, time);
    bq1.gain.value = 25;

    bq2.type = 'bandpass';
    bq2.frequency.setValueAtTime(note, time);
    bq2.Q.setValueAtTime(25, time);
    //bq2.gain.value = 25;

    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(1, time + 0.05);
    gain1.gain.setValueAtTime(1, time + 0.45);
    gain1.gain.linearRampToValueAtTime(0, time + 0.5);

    node.connect(bq1);
    bq1.connect(bq2);
    bq2.connect(gain1);
    gain1.connect(this.master);
  }
}

export class HiHatInstrument extends Instrument {
  play(note: number, time: number) {
    var fundamental = 40;
    var ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];

    var bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 10000;
    var highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 7000;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1, time + 0.01);
    gain.gain.linearRampToValueAtTime(0, time + 0.05);

    ratios.forEach(ratio => {
      var osc4 = this.ctx.createOscillator();
      osc4.type = "square";
      osc4.frequency.value = fundamental * ratio;
      osc4.connect(bandpass);

      osc4.start(time);
      osc4.stop(time + 0.05);

      osc4.connect(bandpass);
    });

    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.master);
  }
}

export class KickInstrument extends Instrument {
  play(note: number, time: number) {
    let osc1 = this.ctx.createOscillator();
    let osc2 = this.ctx.createOscillator();
    let gain1 = this.ctx.createGain();
    let gain2 = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(120, time);
    osc1.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(1, time + 0.016);
    //gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    gain1.gain.linearRampToValueAtTime(0, time + 0.5);
    osc1.connect(gain1);
    gain1.connect(this.master);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(50, time);
    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(1, time + 0.016);
    //gain2.gain.setValueAtTime(1, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.master);

    osc1.start(time);
    osc1.stop(time + 0.51);
    osc2.start(time);
    osc2.stop(time + 0.51);
  }
}

export class BassSynthInstrument extends Instrument {
  bq: BiquadFilterNode;
  bqOsc: OscillatorNode;

  play(note: number, time: number) {
    if (!this.bq) this.initBiquadFilter();
    this.bq.frequency.value = Math.sin(game.frame * RAD[360] / 240) * 240 + 420;

    let length = 0.21;
    let osc1 = this.ctx.createOscillator();
    let gain1 = this.ctx.createGain();

    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(1, time + length * 0.05);
    gain1.gain.setValueAtTime(1, time + length * 0.5);
    gain1.gain.linearRampToValueAtTime(0, time + length * 0.90);
    gain1.connect(this.bq);

    osc1.connect(gain1);
    osc1.type = 'triangle';
    osc1.frequency.value = 440;
    osc1.detune.value = note * 100;
    osc1.start(time);
    osc1.stop(time + length);
  }

  initBiquadFilter() {
    this.bq = this.ctx.createBiquadFilter();
    this.bq.type = 'lowpass';
    this.bq.frequency.setValueAtTime(220, 0);
    this.bq.Q.value = 9;
    this.bq.connect(this.master);

    this.bqOsc = this.ctx.createOscillator();
    this.bqOsc.frequency.value = 200;
    this.bqOsc.connect(this.bq.detune);
    this.bqOsc.start();
  }
}
