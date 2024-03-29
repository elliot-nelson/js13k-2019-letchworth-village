// https://jonny.morrill.me/en/blog/gamedev-how-to-implement-a-camera-shake-effect/

/**
 * Shake it baby.
 */
export class ScreenShake {
  hSamples: number[];
  vSamples: number[];
  frame: number;
  x: number;
  y: number;

  constructor(public frames: number, public hAmplitude: number, public vAmplitude: number) {
    var sampleCount = frames / 2;
    this.hSamples = [];
    this.vSamples = [];
    //2
    for (let i = 0; i < sampleCount; i++) {
      this.hSamples.push(Math.random() * 2 - 1);
      this.vSamples.push(Math.random() * 2 - 1);
    }
    this.frame = -1;
  }

  update(): boolean {
    this.frame++;
    if (this.frame >= this.frames) {
      return false;
    }

    //let s = (this.frames / 10) * (this.frame / this.frames);
    let s = this.frame / 2;
    let s0 = Math.floor(s);
    let s1 = s0 + 1;
    let decay = 1 - (this.frame / this.frames);

    this.x = this.hAmplitude * decay * (this.hSamples[s0] + (s - s0) * (this.hSamples[s1] - this.hSamples[s0]));
    this.y = this.vAmplitude * decay * (this.vSamples[s0] + (s - s0) * (this.vSamples[s1] - this.vSamples[s0]));

    return true;
  };
}
