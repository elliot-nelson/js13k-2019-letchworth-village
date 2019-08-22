
// http://blog.moagrius.com/actionscript/jsas-understanding-easing/

export type EasingFn = (t: number, d: number) => number;
export type TweenFn = (t: number, v1: number, v2: number, d: number) => number;

export class Easing {
  static linear(t: number, d: number): number {
    return t / d;
  }

  static easeIn2(t: number, d: number): number {
    return Math.pow(t / d, 2);
  }

  static easeIn3(t: number, d: number): number {
    return Math.pow(t / d, 3);
  }

  static easeOut2(t: number, d: number): number {
    return 1 - Math.pow(1 - (t / d), 2);
  }

  static easeOut3(t: number, d: number): number {
    return 1 - Math.pow(1 - (t / d), 3);
  }

  static easeOut4(t: number, d: number): number {
    return 1 - Math.pow(1 - (t / d), 4);
  }
}

export class Tween {
  static tweenFn(easing: EasingFn): TweenFn {
    return (t: number, v1: number, v2: number, d: number) => {
      return v1 + (v2 - v1) * easing(t, d);
    };
  }

  static linear: TweenFn = Tween.tweenFn(Easing.linear);
  static easeIn2: TweenFn = Tween.tweenFn(Easing.easeIn2);
  static easeOut2: TweenFn = Tween.tweenFn(Easing.easeOut2);
  static easeIn3: TweenFn = Tween.tweenFn(Easing.easeIn3);
  static easeOut3: TweenFn = Tween.tweenFn(Easing.easeOut3);
  static easeOut4: TweenFn = Tween.tweenFn(Easing.easeOut4);
}
