# js13k-2019-letchworth-village

My 2019 entry for the js13kgames competition, "Letchworth Village".

Play the game online at [js13kgames.com](https://js13kgames.com/games/letchworth-village/).

## Description

Send demons _back to hell_ in this 2D top-down button masher. As an immortal demon hunter possessed by a cursed sword,
you awaken in Letchworth Village, an abandoned mental hospital in the midst of an ongoing demon invasion. Drown your
sword in demon blood and close the portal to hell for good!

HOW TO PLAY:

Kill demons and avoid taking damage to fully charge your sword. Once your sword meter glows yellow, unleash
your super to close the demon's portal and finish your mission.

- Move using arrow keys or gamepad left stick.
- Attack using *X* (XBox: *x*, PS4: *square*).
- Deflect/Counter using *Z* (XBox: *y*, PS4: *triangle*).
- Dash using *C* (XBox: *a*, PS4: *cross*).
- Super/Finisher - only when fully charged - using *SPACEBAR* (XBox: *b*, PS4: *circle*)

- Keyboard only: press *M* to mute audio if it gets annoying

COMPATIBILITY:

- Should be playable on desktop Chrome, Firefox, and Safari.
- :bug: Safari audio is questionable (be prepared to mute).
- :bug: If using a gamepad on Firefox, face buttons may be swapped.

TIPS/TRICKS (SPOILERS! CONTAINS MECHANIC DETAILS!)

The difficulty level is set pretty high, if you want to beat the game and you're having trouble,
read on. Don't read the following if you want to discover mechanics yourself...

- Repeatedly damage demons without _missing an attack_, _missing a counter_, or _getting hit_ to raise
  your wrath (combo counter). Wrath increases your movement speed, attack range, and damage.
- Most importantly, keep wrath at 8x or above to kill demons in one hit instead of two.
- Hit-and-run tactics can make maintaining wrath easier.
- When possible, circle demons and attack right after they miss. Circling is a little bit easier
  (feels more natural) on a gamepad than a keyboard.
- You can buffer all inputs. _In particular_, dashes last 10 frames and there is no iframe cooldown,
  so you can buffer dash through a demon pack with complete immunity if necessary.
- The cooldown from a _successful_ deflect is invulnerable and can be buffered into a dash, making
  a successful deflect extremely safe. A failed deflect will reset your wrath and the cooldown is
  _not_ invulnerable. Sitting still and repeatedly buffering deflect will kill a surprising number
  of demons, but eventually you'll get hit and you cannot build wrath this way.
- Using a buffered dash > deflect > dash is your "cheap trick" and is a great way to maintain high
  wrath if used in the middle of a demon pack. It's not risk-free: if you are unlucky you could miss
  your deflect or not buffer the second dash fast enough and get hit, but it's very effective even so.

## Changelog

#### v1.0-submission

- Early testing version (uncovered some fresh bugs).

#### v1.1-submission

- This is the version submitted to the js13k competition.

#### v1.2

- Build refactor!
  - Cut out some custom building steps and replace with `rollup`.
  - Using `rollup` + `typescript` adds just a few bytes but is easier to work with.
  - Cut a bunch of unused extra files and node packages.

#### v1.3

- Sprite Sheet refactor!
  - Instead of exporting individually, the build now creates a single combined spritesheet.
  - Spritesheet position data is generated automatically instead of manually.
  - Generated TS/PNG file is now checked in instead of individual PNG files.

## Building the game

- `/src` contains the game source files and assets
- `dist/temp` and `dist/build` are used while generating the build
- `/dist/final` contains the final zip file (checked in)

To rebuild, `npm install && gulp build` from the project folder.

> NOTE: During the build, all `.aseprite` files will automatically be rolled into the single
> `spritesheet-gen.png` file, with corresponding position data written to `SpriteSheet-gen.ts`.
>
> If you don't have Aseprite installed locally, this step will fail, but the game will still
> build (you won't get updated image assets, but all the source code will still compile).
>
> If you'd like to modify the image assets without Aseprite, you'll need to hand-edit the
> spritesheet image and manually update the `SpriteSheet-gen.ts` file to reflect any sprites
> you add.

## Postmortem

### Inspiration

This is my second year competing in js13k and a lot has changed! There are so many people entering this year and it was a lot
of fun to keep up with people's progress in twitter and in the js13k slack channel.

I didn't really set out to make _this game_. My original goal, fresh off the high of a NG+5 Sekiro playthrough, was to capture
that feeling of trouncing a boss - that perfectly-pulled-off rhythm of attacks, deflections, and dodges. Turns out that that
is pretty hard to do (go figure), and when I ran out of time, I had to abandon the idea of explorable levels, of a variety
of demons to kill, etc.

The game contains only the tiniest thread of cheesy story, but what is there is intended to honor DOOM's straightforward
"hey, there's demons here, send them back where they belong!" approach to storytelling. The location is a real former
mental hospital (supposedly an inspiration for American Horror Story: Asylum); I originally thought that each level of the
game could be in a different location, linked by heavy trauma, but levels ended up on the chopping block due to time
so the only location became the name of the game instead.

### TypeScript

This year I tried something new and wrote my entry in TypeScript instead of JavaScript. I wasn't a TypeScript expert and
so there was a learning curve with the build process and with choices I needed to make in the source files.

Overall, I think there are some _huge_ benefits to working with TypeScript. It was extremely rare to load up my game
in the browser and not have it work, because all of my classic and constant blunders (passing the wrong things to audio
APIs or passing a context instead of a canvas etc.) can all be caught as you type (VSCode plugins ftw). Refactoring is
a joy because once you rename / change a function you're calling everywhere, you immediately get compile errors to fix
instead of hunting down changes manually using grep or by reloading in the browser and waiting for an exception.

There is a negative though, which is that I think I underestimated the TypeScript _tax_. It takes longer to write stuff
in TypeScript, and the naturally "hack this thing together fast" style of a game jam can get slowed down. I wasted
too much time in the first couple weeks designing perfect interfaces / types / classes, only to realize that I was way
behind on actual features.

Would I use TypeScript again in a future js13k project? Yes, I think so, but I would be cautious about committing to
any early design decisions -- keep the tax low by skimming the surface and still getting ~70% of the benefits. If
used correctly I think TS can be an overall time saver, even for a golf project like js13k.

### Animations

In this game I tried to stick to an "animation system", where instead of a giant switch statement in your entity's
update function, you had this concept of frames and animations made out of frames. There's a lot of rough edges
_but_ I'm actually pretty pleased with how it turned out - I ended up adding the deflection mechanic in the last
48 hours and it was pretty easy, largely due to the framework I already built.

For this game (and for some future game ideas I have) I want to switch from my old time-based model to a "frame-based"
model - like a fighting game, rather than a shooter. My loop is based on that this year which means if your computer
were to slow down or is a little underpowered, my entire game (including the movement and even the audio!) would
"slow down" with it, rather than just getting choppier.

Eventually I'd like to experiment with a dynamic frame-based model (where the entire loop is frame-based, but you
can perform multiple update loops per animation frame if you are falling behind). I didn't get around to it this year
though.

### Collisions!

Collision detection (and responding to them) is a much harder problem than I thought it was going to be. Whatever
you do, don't do anything this game does, which is basically "just barely" working enough to get by. I'll be
exploring this a lot more in future games, I suspect.

### Build Process

Most of my build process is inherited from last year's `gulp` file, with some tweaks and fixes for TypeScript and
to do extra cramming (consolidating most assets into a single file). I ran out of time to explore more, I'm hoping
next year I can get this thing back on track and have a nice clean build.

### Sprites

I built all the frames for this project in [aseprite](https://www.aseprite.org/), and then exported each category
as its own sprite sheet using their Export Spritesheet feature (slick). I was able to get under the limit, but
if I needed extra space the obvious next step is to get them all into _one_ sprite sheet. I haven't explored that
space yet, I think I'd still want separate ase files for my own sanity, but perhaps a custom cleanup step could
combine them for me (or I could investigate one of the sprite packers available out there on the web).

Speaking of the Export Spritesheet feature - it will write out for you a data file containing the different slices.
I didn't take advantage of that and manually added them to my `Assets` file by hand because I wanted to link some
additional data points - like anchor point, bounding box, and hit box of each sprite - to the individual frames.
Ideally I could find a way to do both... something to explore for next year maybe!

### Game mechanics

This was by far the most fun of working on this Game.$. I really wanted to treat this as a frame-by-frame game,
like a Guilty Gear or Street Fighter, where it's not about velocity and acceleration, but about individual
hit frames, invulnerability frames, etc.

For the player, a lot of what I wanted did get into the game:

- Attacks have built-in movement and stun/cooldown frames (missing stuff has consequences).
- Player can buffer inputs while an animation is playing (dash > attack, counter > dash, etc).
- Both player and enemies have their own "hit" frames, "stun" frames, etc.

Unfortunately I couldn't tighten mechanics down as much as I would have liked -- because my collisions are
so muddy and my AI is so unpredictable, it didn't feel good to play, so to compensate I gave Deflect/Counter
a very generous 25 frames (Sekiro has a 30 frame non-spammed deflect, so how bad could it be?), and I ended
up removing the cooldown from dash altogether, so dash is totally invuln spammable.

(In a less rushed version of this game, where monster AI was more predictable and could be reacted to and
collisions were more accurate, I would remove a lot of iframes and force you to time your dashes and counters
better. Maybe next year!)

I also would have liked a wider variety (and cooler looking) attacks, but it is 13k :).

The combo system is a real dream of mine, I would have loved a Devil May Cry-style combo meter where pulling
off strings of dashes, attacks, and counters would make it go up and getting hit would reset it. Again, the
unpredictable monster AI gets in the way here, the only way to keep a combo is to play hit-and-run, which
means there is no incentive to stay up close. For this reason I opted to modify the combo system a bit,
it allows infinite time between attacks, but punishes you for "whiffing" attacks. It's not perfect but
it seems like the right compromise.

## Conclusions

Thanks for playing and for reading, and special thanks to Andrzej and the rest of the js13k team for setting all this up!
