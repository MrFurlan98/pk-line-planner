# Pokémon Platinum Kaizo — Line Planner

A fork of the [Platinum Kaizo Damage Calculator][pkcalc] that adds a **visual
line planner** for Nuzlocke runs.

> This is a personal fork, not the official calculator. The official PK calc
> lives at <https://pkcalc.anastarawneh.com> and is maintained by anastarawneh —
> please report issues with the calculator itself there, not here.

## What a "line" is

In a Nuzlocke a faint is permanent, so a fight isn't improvised — it's planned.
A **line** is the plan for a single trainer battle: which Pokémon leads, what it
does each turn, and where the plan branches when things don't go to script.

Platinum Kaizo makes this sharper than a normal run. Every trainer fields a full
competitive team with items and near-perfect IVs, so most fights need an answer
worked out in advance rather than found on the fly.

## What the planner does

- **Turns as cards on a canvas**, dragged into place and joined by labelled
  arrows. Drop an arrow on empty space to start the next turn there.
- **Both movesets side by side** on every turn, so a move is chosen by comparing
  what you can do against what's coming back at you.
- **Branches are directional** — *You KO* / *They KO you*, *You miss* /
  *They miss*, crit, crit KO, sacrifice, they switch, they set up — and several
  branches can converge on the same turn.
- **Fight state is derived, not typed in.** Stat boosts, entry hazards, screens,
  weather and status are worked out by walking back up the plan, so changing one
  turn updates everything after it.
  - Status is tracked per Pokémon: switching clears boosts and confusion, but a
    non-volatile status follows the Pokémon and comes back with it.
  - Only one non-volatile status at a time — which is what makes deliberately
    statusing your own Pokémon (Rest, Magic Guard + poison) a real tactic for
    locking the AI out of something worse.
- **Trainer AI flags** are shown in plain language, because they decide how much
  branching a fight actually needs. A `Risky` trainer needs a miss branch; a
  `CheckHP` one will switch rather than let you finish it.
- **Team and box** with drag-and-drop, held-item editing, and folding for the
  parts of a long plan you aren't looking at.

The roadmap is in [PLANNER.md](PLANNER.md).

## Running it locally

```sh
npm install
```

One `npm install` at the top level is enough — the root `postinstall` installs
`calc/` too.

```sh
node build
node server.js
```

Then open <http://localhost:3000>.

**Serve `dist/`, don't open `src/index.template.html` directly.** The template is
a build input: it has no `calc/` folder beside it, so `toID` and the whole
calculator engine are missing, and the page fails quietly rather than loudly.
Opening `dist/index.html` straight off disk doesn't work either, since the app
requests root-absolute paths like `/calc/util.js`.

After editing anything under `src/`, rebuild before refreshing:

```sh
node build view
```

`node build view` skips recompiling the TypeScript in `calc/`, which is only
needed if you changed that directory. The build stamps cache-busting hashes onto
the JS and CSS but not onto `index.html`, so hard-refresh (Ctrl+Shift+R) after a
rebuild.

### Sprites

The production image set lives in a separate private repository that is checked
out into `src/img/` at deploy time, so a fork has none and every `/img/dex/...`
request 404s. This fork resolves Pokémon, type and item sprites from
[Pokémon Showdown's CDN][psprites] instead, via the adapter in
`src/js/data/games.js`.

## Credits

This fork stands on two projects, and all the interesting parts belong to them.

**The Platinum Kaizo calculator** — by **anastarawneh**, who built the PK-specific
work this planner depends on entirely: every trainer's sets, the trainer AI
flags, encounter and location data, the Dex, encounter tracking, and the Lua
game-sync script. Source: <https://git.anastarawneh.com/anas/PKCalc>.

**The Smogon damage calculator** — originally created by **Honko** and primarily
maintained by **Austin** and **jetou**. Source: <https://github.com/smogon/damage-calc>.

- Gens 1-6 were originally implemented by Honko.
- The Omega Ruby / Alpha Sapphire update was done by gamut-was-taken and Austin.
- The Gen 7 update was done by Austin.
- The Gen 8 update was done by Austin and Kris.
- The Gen 9 update was done by Austin and Kris.
- Some CSS styling was contributed by Zarel to match the Pokémon Showdown! theme.

Many other contributors have added features or contributed bug fixes, please see
the [full list of contributors](https://github.com/smogon/damage-calc/graphs/contributors).

The git history of this repository is preserved from upstream, so every one of
those contributions is still attributed commit by commit.

Pokémon and all related names are trademarks of Nintendo, Game Freak and
Creatures Inc. This is an unofficial fan project and is not affiliated with them,
with Smogon, or with the Platinum Kaizo development team.

## License

Distributed under the terms of the [MIT License](LICENSE), unchanged from
upstream.

  [pkcalc]: https://git.anastarawneh.com/anas/PKCalc
  [psprites]: https://play.pokemonshowdown.com/sprites/
