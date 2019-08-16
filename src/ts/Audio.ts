export class Audio {
  ctx: AudioContext;
  kick: KickInstrument;
  ghost: GhostInstrument;
  spirit: SpiritInstrument;
  hihat: HiHatInstrument;

  async init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    this.kick = new KickInstrument(this.ctx);
    this.ghost = new GhostInstrument(this.ctx);
    this.spirit = new SpiritInstrument(this.ctx);
    this.hihat = new HiHatInstrument(this.ctx);
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

export class GhostInstrument extends Instrument {
  play(time: number, note: number, length: number) {
    let osc1 = this.ctx.createOscillator();
    let osc2 = this.ctx.createOscillator();
    let osc3 = this.ctx.createOscillator();
    let osc4 = this.ctx.createOscillator();
    let gain1 = this.ctx.createGain();
    let gainx = this.ctx.createGain();
    var bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 440;
    bandpass.detune.value = note;
    bandpass.Q.value = 25;

    var saw = this.ctx.createOscillator(),
    sine = this.ctx.createOscillator(),
    sineGain = this.ctx.createGain();

    saw.type = 'sawtooth';
    sine.type = 'sine';

    sineGain.gain.value = 10;
    sine.connect(sineGain);
    saw.frequency.value = 440;
    sineGain.connect(saw.detune);
    saw.connect(gain1);

    osc1.type = 'square';
    osc1.frequency.value = 440;
    osc1.detune.value = note;
    osc2.type = 'sine';
    osc2.frequency.value = 440;
    osc2.detune.value = note - 1200;

    //osc2.type = 'square';
    //osc2.frequency.value = 440 * 0.99;
    //osc2.detune.value = note;
    //osc3.type = 'square';
    //osc3.frequency.value = 440 * 1.01;
    //osc3.detune.value = note;
    //osc4.type = 'square';
    //osc4.frequency.value = 440 * 1.02 + 22000;
    //osc4.detune.value = note;
    //osc4.frequency.value = 472;

    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(1, time + length * 0.3);
    gain1.gain.setValueAtTime(1, time + length * 0.8);
    gain1.gain.linearRampToValueAtTime(0, time + length * 0.999);

    //osc1.connect(bandpass);
    //osc2.connect(bandpass);
    //osc2.connect(gainx.gain);
    //osc3.connect(bandpass);
    //osc4.connect(gain1.gain);
    bandpass.connect(gainx);
    gainx.connect(gain1);
    gain1.connect(this.master);
    osc1.start(time);
    osc1.stop(time + length);
    osc2.start(time);
    osc2.stop(time + length);
    osc3.start(time);
    osc3.stop(time + length);
    osc4.start(time);
    osc4.stop(time + length);
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
    osc1.stop(time + 0.5);
    osc2.start(time);
    osc2.stop(time + 0.5);
  }
}
