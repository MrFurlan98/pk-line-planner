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
- **Damage on every move**, as a percentage range, worked out against the boosts,
  status, items, abilities, screens and weather the turn already has in play.
- **Health carried down the plan**, as a range rather than a number — a damage
  roll is 85–100%, so the bar shows what a Pokémon holds for certain and what it
  holds only if the rolls went its way. Weather, poison, burn, Leech Seed and
  Leftovers are taken off at the end of each turn; entry hazards bite on the way
  in; and recoil, drain, Life Orb and the healing moves all move the bar too.
  - The band widens with every hit and **narrows at every branch**, because a
    branch already says which way the roll went: *You KO* pins the target to
    nothing, *You don't KO* lifts it off zero, *You crit* recalculates the turn.
  - Something dead on every roll doesn't get a turn — which is what makes a KO
    actually deny the next move.
- **Targeting is yours to choose in a double.** Both of their Pokémon are in
  reach of both of yours, so you can point two attackers at one of theirs —
  which is usually the whole plan. Spread moves hit both regardless.
- **Turn order is worked out**, priority bracket first and then speed, so a
  Pokémon you outspeed and kill outright loses its move. Only a *certain* KO does
  that: if the kill depends on the roll, the move still lands and the fork
  belongs on a branch. Speed ties and Quick Claw holders are left alone rather
  than guessed at.
  - **Trick Room** reverses it while up — only the speed comparison, so priority
    moves still go first. In this game it lasts until the move is used again
    rather than five turns, and it starts from the turn *after* it's cast.
  - Priority is read from this game's own move table, because Platinum Kaizo
    rebalanced the brackets heavily — Trick Room and Block at +7, Tailwind +5,
    Fake Out +3, and the hazard moves at +1.
  - **Fake Out** is modelled properly: it flinches the target on the user's first
    turn out, fails outright on every turn after, and works again after a switch.
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
- **Warnings for what can't work** — a Pokémon that's dead, a move it no longer
  knows, a Leech Seed into a Grass type, a branch the numbers say can't happen.
  Only certainties are flagged, and nothing is corrected for you.
- **Blind mode**, a toolbar toggle that puts the numbers away — base power back
  on the moves, no health bars, no speed. Working the fight out yourself is the
  part of a Nuzlocke that's actually the game, so the damage is there when you
  want it and gone when you don't. It turns the calculation off rather than
  hiding it, so nothing leaks the answer back.
- **Trainer AI flags** are shown in plain language, because they decide how much
  branching a fight actually needs. A `Risky` trainer needs a miss branch; a
  `CheckHP` one will switch rather than let you finish it.
- **Team and box** with drag-and-drop, held-item editing, and folding for the
  parts of a long plan you aren't looking at.

A good deal of this isn't discoverable by looking at the screen — dragging a
turn's connector nub onto empty canvas to start the next turn, clicking an
arrow's label to edit or delete a branch — so there's a **How to use** page at
`/how-to-use.html`, linked from the Planner tab. It renders real, styled cards
pulled from `planner.css` rather than screenshots, so it can't fall out of date
with the UI.

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
