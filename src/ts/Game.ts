import { Input } from './input';
import { Player } from './player';
import { createSplashPattern } from './Pattern';
import { Text } from './Text';
import { ScreenShake } from './ScreenShake';
import { Hud } from './Hud';
import { PauseMenu } from './PauseMenu';
import { Menu } from './Menu';
import { Audio } from './Audio';
import { Assets } from './Assets';
import { Demon1 } from './Demon1';
import { game } from './ambient';
import { distance, Point } from './Util';

class Particle {
    x: number;
    y: number;
    radius: number;
    rgba: [number, number, number, number];
    speed: number;
    ttl: number;

    constructor(x:number,y:number) {
        let r = Math.floor(Math.random() * 128) + 128;
        let b = r * 0.9;
        this.spawn(x + Math.random() * 10, y, Math.random() * 15, [r,0,b,0.4], Math.random() * 2, 20);
    }

    spawn(x: number, y: number, radius: number, rgba: [number, number, number, number], speed: number, ttl: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rgba = rgba;
        this.speed = speed;
        this.ttl = ttl;
    }

    update() {
        if (this.ttl > 0) {
            this.y--;
            this.ttl--;
            return true;
        } else {
            return false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.ttl > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(${this.rgba.join(',')})`;
            ctx.fill();
            ctx.closePath();
        }
    }
}

/**
 * Game state.
 */
export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    input: Input;
    player: Player;
    pattern: CanvasPattern;
    hud: Hud;
    frame: number;

    menuStack: Menu[];
    particles: Particle[];
    screenshakes: ScreenShake[];
    audio: Audio;

    monsters: Demon1[];

    async init() {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d');

        await Assets.init();

        this.input = new Input();
        await this.input.init();

        this.pattern = this.ctx.createPattern(createSplashPattern(300, 100), 'repeat');

        this.player = new Player();

        this.hud = new Hud();

        this.particles = [];
        this.screenshakes = [];
        this.menuStack = [];

        this.monsters = [];

        this.audio = new Audio();
        await this.audio.init();
    }

    start() {
        this.frame = 0;
        //this.framems = performance.now();
        window.requestAnimationFrame(() => this.onFrame(3));
        //this.frame = 0;
        /// #if DEBUG
        //console.log('Starting game.');
        /// #endif
    }

    onFrame(currentms : number) {
        this.frame++;
        this.update();
        this.resize();
        this.draw(this.ctx);
        window.requestAnimationFrame(() => this.onFrame(currentms));
    }

    update() {
        this.input.update();

        if (this.menuStack.length > 0) {
            if (!this.menuStack[this.menuStack.length - 1].update()) {
                this.menuStack.pop();
            }
        } else {
            if (this.input.pressed[Input.Action.MENU]) {
                this.menuStack.push(new PauseMenu());
            }
        }

        if (this.input.pressed[Input.Action.MENU]) {
            console.log(37);
        }
        if (this.input.released[Input.Action.MENU]) {
            console.log("released menu: " + this.input.framesHeld[Input.Action.MENU]);
        }

        if (this.input.pressed[Input.Action.RIGHT]) {
            this.audio.kick.play(0, this.audio.ctx.currentTime);
        }
        if (this.input.pressed[Input.Action.DOWN]) {
            this.audio.hihat.play(0, this.audio.ctx.currentTime);
        }
        if (this.input.pressed[Input.Action.UP]) {
            this.audio.ghost.play(this.audio.ctx.currentTime, 300, 1);
            this.audio.ghost.play(this.audio.ctx.currentTime + 1, 400, 1);
            this.audio.ghost.play(this.audio.ctx.currentTime + 2, 900, 1);
            this.audio.ghost.play(this.audio.ctx.currentTime + 3, 400, 1);
        }
        if (this.input.pressed[Input.Action.LEFT]) {
            this.audio.spirit.play(440, this.audio.ctx.currentTime);
            this.audio.spirit.play(472, this.audio.ctx.currentTime + 0.5);
        }

        this.fragglerock();

        this.player.update();
        this.monsters = this.monsters.filter(monster => monster.update());
        this.updateEntityPositions();

        if (this.player.frame && this.player.frame.hitbox) {
            this.monsters.forEach(monster => monster.hitBy(this.player));
        }


        this.particles = this.particles.filter(particle => particle.update());
        this.particles.push(new Particle(105, 100));
        //console.log(this.particles.length);

        // Example screenshake calls
        /*
        if (this.input.pressed[Input.Action.ATTACK]) {
            this.input.pressed[Input.Action.ATTACK] = false;
            this.screenshakes.push(new ScreenShake(30, 16, 16));
        }
        if (this.input.pressed[Input.Action.DEFLECT]) {
            this.input.pressed[Input.Action.DEFLECT] = false;
            this.screenshakes.push(new ScreenShake(20, 4, 4));
        }
        */

        this.screenshakes = this.screenshakes.filter(shake => shake.update());


        this.hud.update(); // TODO: update hud??
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(150, 128, 128, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        let shakeX = 0, shakeY = 0;
        this.screenshakes.forEach(shake => {
            shakeX += shake.x;
            shakeY += shake.y;
        });
        ctx.translate(shakeX, shakeY);

        this.player.draw(ctx);

        //Text.renderText(ctx, 250, 120, 20, 'THE ELEPHANTS');
        //Text.renderText(ctx, 100, 200, 64, 'AB0123456789');
        //Text.renderText(ctx, 100, 150, 30, 'AB0123456789');

        for (let particle of this.particles) particle.draw(ctx);

        for (let monster of this.monsters) monster.draw(ctx);

        this.hud.draw(ctx);

  //      var bubble = ctx.createLinearGradient(
        // Let's add blue noise?
        /*for (let i = 100; i < 300; i += 5) {
            for(let j = 100; j < 120; j += 5) {
                let [x, y] = [Math.random() * 5, Math.random() * 5];
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(i+Math.floor(x),j+Math.floor(y),1,1);
            }
        }*/

        ctx.restore();

        for (let menu of this.menuStack) menu.draw(ctx);
    }

    resize() {
        let width = this.canvas.clientWidth;
        let height = this.canvas.clientHeight;
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    fragglerock() {
        if (this.monsters.length < 1) {
            let monster = new Demon1(200, 100);
            this.monsters.push(monster);
        }
        if (this.input.pressed[Input.Action.DEFLECT]) {
            let monster = new Demon1(200, 100);
            this.monsters.push(monster);
        }
    }

    colliding(p1: Point, p2: Point): boolean {
        return distance(p1, p2) < 32;
    }

    updateEntityPositions() {
        let entities: any[] = this.monsters.concat([this.player] as any[]);
        for (let i = 0; i < entities.length; i++) {
            for (let j = 0; j < entities.length; j++) {
                if (i === j) continue;
                let suggestion = entities[i].next;
                if (!this.colliding(suggestion, entities[j])) {
                    continue;
                }
                suggestion = { x: entities[i].next.x, y: entities[i].y };
                if (!this.colliding(suggestion, entities[j])) {
                    entities[i].next = suggestion;
                    continue;
                }
                suggestion = { x: entities[i].x, y: entities[i].next.y };
                if (!this.colliding(suggestion, entities[j])) {
                    entities[i].next = suggestion;
                    continue;
                }

                // at this point it appears blah blah blah
                if (this.colliding(entities[i], entities[j])) {
                    continue;
                }

                // at this point we've prevented any movement from this object,
                // so there's no longer any point in checking further collisions
                entities[i].next = { x: entities[i].x, y: entities[i].y };
                break;
            }
            Object.assign(entities[i], entities[i].next);
        }
    }
}
