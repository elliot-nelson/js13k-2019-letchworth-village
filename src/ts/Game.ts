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
import { distance, Point, collideHitboxCircle } from './Util';
import { Canvas } from './Canvas';
import { Particle } from './Particle';

/**
 * Game state.
 */
export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    bloodplane: Canvas;
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
        this.canvas.width = 640;
        this.canvas.height = 360;
        this.ctx = this.canvas.getContext('2d');

        this.bloodplane = new Canvas(this.canvas.width, this.canvas.height);

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
            this.monsters.forEach(monster => {
                if (collideHitboxCircle({ ...this.player.frame.hitbox, x: this.player.x, y: this.player.y }, monster, 16)) {
                    monster.hitBy(this.player);
                }
            });
        }

        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].update()) this.particles.splice(i--, 1);
        }
        //this.particles = this.particles.filter(particle => particle.update());
        //this.particles.push(new Particle(105, 100));
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

        ctx.drawImage(this.bloodplane.canvas, 0, 0, this.canvas.width, this.canvas.height);

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

        for (let monster of this.monsters) monster.draw(ctx);
        for (let particle of this.particles) particle.draw(ctx);

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
        /*if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;

            this.bloodplane.canvas.width = width;
            this.bloodplane.canvas.height = height;
        }*/
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
