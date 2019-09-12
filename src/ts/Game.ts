import { Input } from './input';
import { Player } from './player';
import { Text } from './Text';
import { ScreenShake } from './ScreenShake';
import { Hud } from './Hud';
import { Menu, PauseMenu, IntroMenuA, IntroMenuB, OutroMenu } from './Menu';
import { Audio } from './Audio';
import { Assets, Sprite, drawPoly } from './Assets';
import { Demon1 } from './Demon1';
import { game } from './Globals';
import { Canvas } from './Canvas';
import { Particle, PortalParticle, SuperParticle } from './Particle';
import { Hive } from './Hive';
import { Point, intersectingPolygons, intersectingCircles, RAD, vectorFromAngle, distance } from './Geometry';
import { HEARTBEAT } from './Config';
import { Tween } from './Tween';

/**
 * Game state.
 */
export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    input: Input;
    player: Player;
    hud: Hud;
    frame: number;

    menuStack: Menu[];
    particles: Particle[];
    screenshakes: ScreenShake[];
    audio: Audio;

    monsters: Demon1[];

    bloodplanes: Array<[Canvas, number, number]>;

    artifacts: Canvas[];

    shadow: Canvas;

    score: number;

    hive: Hive;

    started: boolean;

    superFired: boolean;

    frozen: boolean;

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

        this.shadow = new Canvas(this.canvas.width, this.canvas.height);

        await Assets.init();

        this.artifacts = [
            await Assets.grayscaleNoise(this.canvas.width, this.canvas.height),
            await Assets.grayscaleNoise(this.canvas.width, this.canvas.height),
            await Assets.grayscaleNoise(this.canvas.width, this.canvas.height)
        ];

        this.input = new Input();
        await this.input.init();

        this.player = new Player();

        this.hud = new Hud();

        this.particles = [];
        this.screenshakes = [];
        this.menuStack = [];

        this.monsters = [];

        // Create, but do not initialize, the audio object. The audio object will be
        // initialized as soon as possible by the first user input event, to meet
        // requirements of the browser.
        this.audio = new Audio();

        this.score = 0;

        this.hive = new Hive();
    }

    start() {
        this.frame = 0;

        this.started = true;
        this.update();
        this.started = false;

        this.menuStack.push(new IntroMenuA({
            onClose: () => {
                this.menuStack.push(new IntroMenuB({}));
            }
        }));

        //this.framems = performance.now();
        window.requestAnimationFrame(() => this.onFrame(1));
        //this.frame = 0;
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
        this.audio.queueSongNotes();

        if (this.menuStack.length > 0) {
            if (!this.menuStack[this.menuStack.length - 1].update()) {
                let menu = this.menuStack.pop();
                if (menu.onClose) menu.onClose();
            }
        } else {
            this.started = true;
            /*if (this.input.pressed[Input.Action.MENU]) {
                this.menuStack.push(new PauseMenu());
            }*/
        }

        if (this.input.pressed[Input.Action.MUTE]) {
            this.audio.muted = !this.audio.muted;
        }

        if (this.input.pressed[Input.Action.FREEZE]) {
            this.frozen = !this.frozen;
        }

        if (this.frozen) return;
        if (!this.started) return;

        this.hive.update();

        this.fragglerock();

        this.player.update();
        this.monsters = this.monsters.filter(monster => monster.update());
        this.updateEntityPositions();

        let hitbox = this.player.getHitPolygon();
        if (hitbox) {
            let hitCount = 0;
            this.monsters.forEach(monster => {
                if (intersectingPolygons(hitbox, monster.getBoundingPolygon())) {
                    if (!monster.frame.invuln) hitCount++;
                    monster.hitBy(this.player);
                }
            });

            this.player.setCombo(hitCount);
        }

        this.monsters.forEach(monster => {
            let hitbox = monster.getHitPolygon();
            if (hitbox) {
                if (intersectingPolygons(hitbox, this.player.getBoundingPolygon())) {
                    this.player.hitBy(monster);
                }
            }
        });

        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].update()) this.particles.splice(i--, 1);
        }
        //this.particles = this.particles.filter(particle => particle.update());
        //this.particles.push(new Particle(105, 100));

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

        // Super wave destroys monsters underneath it
        for (let particle of this.particles.filter(p => p instanceof SuperParticle)) {
            let r = (particle as SuperParticle).effectiveRadius();
            for (let i = 0; i < this.monsters.length; i++) {
                let d = distance(this.player, this.monsters[i]);
                if (d > r - 50 && d < r + 50) {
                    this.monsters.splice(i, 1);
                    i--;
                }
            }
        }

        if (this.particles.length === 0 && this.monsters.length === 0 && this.superFired && this.menuStack.length === 0) {
            this.menuStack.push(new OutroMenu({}));
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(150, 128, 128, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.shadow.ctx.globalCompositeOperation = 'copy';
        //this.shadow.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shadow.ctx.fillStyle = 'rgba(0, 0, 0, 0.99)';
        this.shadow.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.shadow.ctx.globalCompositeOperation = 'destination-out';
        let grd = this.shadow.ctx.createRadialGradient(game.player.x, game.player.y, 0, game.player.x, game.player.y, 200);
        grd.addColorStop(0, "rgba(0, 0, 0, 1)");
        grd.addColorStop(0.5, "rgba(0, 0, 0, 0.95)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");
        this.shadow.ctx.fillStyle = grd;
        this.shadow.ctx.beginPath();
        this.shadow.ctx.arc(game.player.x, game.player.y, 200, 0, 2 * Math.PI);
        this.shadow.ctx.fill();

        for (let particle of this.particles.filter(p => p instanceof PortalParticle)) {
            let r = (particle as PortalParticle).effectiveRadius();
            this.shadow.ctx.globalCompositeOperation = 'destination-out';
            let grd = this.shadow.ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, r);
            grd.addColorStop(0, "rgba(0, 0, 0, 0.7)");
            grd.addColorStop(1, "rgba(0, 0, 0, 0)");
            this.shadow.ctx.fillStyle = grd;
            this.shadow.ctx.beginPath();
            this.shadow.ctx.arc(particle.x, particle.y, r, 0, 2 * Math.PI);
            this.shadow.ctx.fill();
        }

        this.shadow.ctx.globalCompositeOperation = 'source-atop';
        for (let monster of this.monsters) {
            this.shadow.ctx.beginPath();
            this.shadow.ctx.arc(monster.x, monster.y, 200, 0, 2 * Math.PI);
        }

        /*
          we don't even use bloodplanes (splatter terrain) anymore because i just
          render all of them as particles
        ctx.globalAlpha = 1 - this.bloodplanes[0][1] / this.bloodplanes[0][2];
        ctx.globalAlpha = 0.9;
        ctx.drawImage(this.bloodplanes[0][0].canvas, 0, 0);
        ctx.globalAlpha = 1 - this.bloodplanes[1][1] / this.bloodplanes[1][2];
        ctx.drawImage(this.bloodplanes[1][0].canvas, 0, 0);
        ctx.globalAlpha = 1 - this.bloodplanes[2][1] / this.bloodplanes[2][2];
        ctx.drawImage(this.bloodplanes[2][0].canvas, 0, 0);
        ctx.globalAlpha = 1;
        */

        ctx.save();
        let shakeX = 0, shakeY = 0;
        this.screenshakes.forEach(shake => {
            shakeX += shake.x;
            shakeY += shake.y;
        });
        ctx.translate(shakeX, shakeY);

        // low-hanging fruit here (pre-render the map since it never changes)
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 10; j++) {
                let k = ((i * i * 13) + j * 17) % 9;
                Sprite.drawSprite(ctx, Sprite.tiles[k], i * 32 - 16, j * 32 - 8);
            }
        }

        for (let particle of this.particles) if (!particle.foreground && !game.superFired) particle.draw(ctx);

        this.player.draw(ctx);

        //Text.renderText(ctx, 250, 120, 20, 'THE ELEPHANTS');
        //Text.renderText(ctx, 100, 200, 64, 'AB0123456789');
        //Text.renderText(ctx, 100, 150, 30, 'AB0123456789');

        for (let monster of this.monsters) monster.draw(ctx);

  //      var bubble = ctx.createLinearGradient(
        // Let's add blue noise?
        /*for (let i = 100; i < 300; i += 5) {
            for(let j = 100; j < 120; j += 5) {
                let [x, y] = [Math.random() * 5, Math.random() * 5];
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(i+Math.floor(x),j+Math.floor(y),1,1);
            }
        }*/

        for (let particle of this.particles) if (particle.foreground) particle.draw(ctx);

        ctx.drawImage(this.shadow.canvas, 0, 0);
        let noiseLoop = Math.floor(this.frame / 8) % 3;
        ctx.globalAlpha = 0.06;
        ctx.drawImage(this.artifacts[noiseLoop].canvas, 0, 0);
        ctx.globalAlpha = 1;

        this.hud.draw(ctx);
        this.hive.draw(ctx);

        ctx.restore();

        /*
        if (this.frame % HEARTBEAT === 0 || (this.frame - 1) % HEARTBEAT === 0 || (this.frame - 2) % HEARTBEAT === 0) {
            ctx.fillStyle = 'rgba(255, 255, 30, 0.3)';
            ctx.fillRect(100, 0, 100, 10);
        }
        */

        for (let menu of this.menuStack) menu.draw(ctx);
    }

    resize() {
        let width = this.canvas.clientWidth;
        let height = this.canvas.clientHeight;

        // We'd uncomment this if we wanted to always lock pixel size to screen
        // size, but we are intentionally upscaling 480x270 fixed to the size
        // of the user's browser.
        //
        // (In the process, we're accepting that it could look kind of ugly and
        // skewed if the user has an unusual aspect ratio.)

        /*if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;

            this.bloodplane.canvas.width = width;
            this.bloodplane.canvas.height = height;
        }*/
    }

    fragglerock() {
        if (this.superFired) return;

        if (this.monsters.length < 10 && Math.random() < 0.01) {
            this.spawnNewMonster();
        }

        if (this.monsters.length < 1) {
            this.spawnNewMonster();
        }
    }

    spawnNewMonster() {
        let r = Math.random() * RAD[360];
        let p = vectorFromAngle(r);
        let d = Math.random() * 100 + 100;
        let monster = new Demon1(this.player.x + p.x * d, this.player.y + p.y * d);
        this.monsters.push(monster);

        let point = { x: monster.x, y: monster.y };
        this.particles.push(new PortalParticle(point, point, Tween.linear, Sprite.portal, 68));
    }

    updateEntityPositions() {
        let entities: any[] = this.monsters.concat([this.player] as any[]);
        for (let i = 0; i < entities.length; i++) {
            for (let j = 0; j < entities.length; j++) {
                if (i === j) continue;
                if (entities[i].noclip()) continue;
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
