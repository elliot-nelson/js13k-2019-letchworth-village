import { Input } from './input';
import { Player } from './player';
import { createSplashPattern } from './Pattern';
import { Text } from './Text';
import { ScreenShake } from './ScreenShake';
import { Hud } from './Hud';
import { PauseMenu } from './PauseMenu';
import { Menu } from './Menu';
import { Audio } from './Audio';
import { Assets, Sprite, drawPoly } from './Assets';
import { Demon1 } from './Demon1';
import { game } from './Globals';
import { Canvas } from './Canvas';
import { Particle } from './Particle';
import { Hive } from './Hive';
import { Point, intersectingPolygons, intersectingCircles } from './Geometry';
import { HEARTBEAT } from './Config';

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

    bloodplanes: Array<[Canvas, number, number]>;

    score: number;

    hive: Hive;

    async init() {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.ctx = this.canvas.getContext('2d');

        this.bloodplanes = [
            [new Canvas(this.canvas.width, this.canvas.height), 0, 240],
            [new Canvas(this.canvas.width, this.canvas.height), 120, 240],
            [new Canvas(this.canvas.width, this.canvas.height), 240, 240]
        ];

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

        this.score = 0;

        this.hive = new Hive();
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

        this.hive.update();

        this.fragglerock();

        this.player.update();
        this.monsters = this.monsters.filter(monster => monster.update());
        this.updateEntityPositions();

        let hitbox = this.player.getHitPolygon();
        if (hitbox) {
            this.monsters.forEach(monster => {
                console.log(intersectingPolygons(hitbox, monster.getBoundingPolygon()));

                if (intersectingPolygons(hitbox, monster.getBoundingPolygon())) {
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

        // update bloodplanes
        /*this.bloodplanes[0][1]++;
        this.bloodplanes[1][1]++;
        this.bloodplanes[2][1]++;
        if (this.bloodplanes[2][1] > this.bloodplanes[2][2]) {
            this.bloodplanes.unshift(this.bloodplanes.pop());
            this.bloodplanes[0][1] = 0;
            this.bloodplanes[0][0].ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }*/
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(150, 128, 128, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.globalAlpha = 1 - this.bloodplanes[0][1] / this.bloodplanes[0][2];
        ctx.drawImage(this.bloodplanes[0][0].canvas, 0, 0);
        ctx.globalAlpha = 1 - this.bloodplanes[1][1] / this.bloodplanes[1][2];
        ctx.drawImage(this.bloodplanes[1][0].canvas, 0, 0);
        ctx.globalAlpha = 1 - this.bloodplanes[2][1] / this.bloodplanes[2][2];
        ctx.drawImage(this.bloodplanes[2][0].canvas, 0, 0);
        ctx.globalAlpha = 1;

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

        this.hive.draw(ctx);

        if (this.frame % HEARTBEAT === 0 || (this.frame - 1) % HEARTBEAT === 0 || (this.frame - 2) % HEARTBEAT === 0) {
            ctx.fillStyle = 'rgba(255, 255, 30, 0.3)';
            ctx.fillRect(100, 0, 100, 10);
        }

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

    updateEntityPositions() {
        let entities: any[] = this.monsters.concat([this.player] as any[]);
        for (let i = 0; i < entities.length; i++) {
            for (let j = 0; j < entities.length; j++) {
                if (i === j) continue;
                let circlei = entities[i].getBoundingCircle();
                let circlej = entities[j].getBoundingCircle();

                Object.assign(circlei, entities[i].next);
                if (!intersectingCircles(circlei, circlej)) {
                    continue;
                }

                circlei.x = entities[i].x;
                if (!intersectingCircles(circlei, circlej)) {
                    entities[i].next = { x: circlei.x, y: circlei.y };
                    continue;
                }

                circlei.x = entities[i].next.x;
                circlei.y = entities[i].y;
                if (!intersectingCircles(circlei, circlej)) {
                    entities[i].next = { x: circlei.x, y: circlei.y };
                    continue;
                }

                // at this point it appears blah blah blah
                circlei.x = entities[i].x;
                circlei.y = entities[i].y;
                if (intersectingCircles(circlei, circlej)) {
                    continue;
                }

                // at this point we've prevented any movement from this object,
                // so there's no longer any point in checking further collisions
                entities[i].next = { x: entities[i].x, y: entities[i].y };
                break;

                /*
                let polygoni = entities[i].getBoundingPolygon();
                let polygonj = entities[j].getBoundingPolygon();

                console.log(intersectingPolygons(polygoni, polygonj));

                Object.assign(polygoni, entities[i].next);
                if (!intersectingPolygons(polygoni, polygonj)) {
                    continue;
                }

                polygoni.x = entities[i].x;
                if (!intersectingPolygons(polygoni, polygonj)) {
                    entities[i].next = { x: polygoni.x, y: polygoni.y };
                    continue;
                }

                polygoni.x = entities[i].next.x;
                polygoni.y = entities[i].y;
                if (!intersectingPolygons(polygoni, polygonj)) {
                    entities[i].next = { x: polygoni.x, y: polygoni.y };
                    continue;
                }

                // at this point it appears blah blah blah
                polygoni.x = entities[i].x;
                polygoni.y = entities[i].y;
                if (this.colliding(entities[i], polygoni, entities[j], polygonj)) {
                    continue;
                }

                // at this point we've prevented any movement from this object,
                // so there's no longer any point in checking further collisions
                entities[i].next = { x: entities[i].x, y: entities[i].y };
                break;
                */
            }
            Object.assign(entities[i], entities[i].next);
        }
    }
}
