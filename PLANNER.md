# Line Planner — roadmap

A visual planner for a single trainer fight: which Pokémon leads, what it does
each turn, and how the plan branches when the fight doesn't go to script.

Lives in the **Planner** tab. Source: `src/js/planner-model.js` (state and
persistence), `src/js/planner-controls.js` (UI), `src/css/planner.css`,
`src/js/data/games.js` (per-game adapter), and two generated data files:
`src/js/data/move_effects.js` and `src/js/data/ability_effects.js` — regenerate
with `node tools/gen-move-effects.js` / `node tools/gen-ability-effects.js`.

---

## Built

### The plan itself

- **Turns as nodes**, dragged into place, joined by labelled arrows. Drop an
  arrow on empty canvas to start the next turn there.
- **Directional branch conditions** — You KO / They KO you, You miss / They miss,
  crit, crit KO, wake/thaw, sacrifice, they switch, they set up, plus custom
  labels. Several branches can converge on the same turn; ids are per-edge, so
  they no longer overwrite each other.
- **Subtree folding** hides only what is reachable *exclusively* through the
  folded turn, so convergent branches don't vanish. The badge counts what is
  genuinely hidden.
- The party strips fold away too, and the choice is remembered.

### Fight state, all derived

Nothing about state is stored on a turn; it is recomputed by walking back up the
graph, so editing one turn updates everything after it.

- **Boosts, status and volatiles belong to the Pokémon, not the slot.** With two
  out per side "the side's boosts" stops meaning anything, and it makes
  switching fall out for free: a Pokémon keeps its own record, loses its boosts
  and volatiles on leaving the field, and keeps its status.
- **Hazards, screens and weather** belong to the side.
- **Hazards and screens can be removed**, by three different routes:
  **Defog** clears the target's side of hazards *and* screens; **Brick Break**
  takes only the screens, which makes it the one way through a Reflect that
  doesn't cost you the turn; and a **grounded Poison type soaks up Toxic Spikes**
  as it lands, the only removal nobody spends a turn on. Flying types and
  Levitate never touch them. Rapid Spin isn't a route — Kaizo deletes it.
- **The turn editor is tabbed, one tab per Pokémon on the turn.** Everything in
  a panel belongs to that one Pokémon — status, stat stages, volatiles, whether
  it got to act — which is how you think about a turn anyway. A four-slot double
  would otherwise stack four of each down one column and run off the screen; the
  dialog is a flat 332px instead. Panels stay in the DOM and are toggled with
  `.active` rather than `.hide` (which loses to any element's own `display`
  rule), so saving reads every slot whichever tab is on top.
- **Every seed is per slot, not per side.** Status, stat stages and volatiles
  were originally per side and applied to slot one only, so in a double the
  second Pokémon on each side could never be edited. The turn editor now shows a
  row per occupied slot, named after who is standing in it. Lines saved in the
  old shape migrate on load, with the old value becoming slot one — which is
  where it was being applied anyway.
- **Stat stages can be corrected by hand**, per slot, in the turn editor. A
  *delta* on top of what the turn inherited, not an override, so it composes
  with derived boosts and still respects the ±6 ceiling. This is the escape
  hatch for everything the move table deliberately won't promise — a
  secondary-effect drop that actually landed, a move whose text didn't parse, or
  a line that starts mid-fight already set up. No ability guard is applied: you
  are stating what happened, not an opponent trying to inflict it, so a Clear
  Body doesn't get to refuse your own correction.
- **A move can be denied.** Per-slot *didn't act* toggles in the turn editor
  skip that slot's effects when the turn folds in, so outspeeding a lead really
  does deny the Stealth Rock. It covers KO'd-before-acting, flinch, full
  paralysis, confusion self-hit and a plain miss — all the same thing to the
  model. The card still shows the move, struck through, so the plan records what
  they were *going* to do. The planner can't infer this itself: with no speed or
  damage data it has no way to know who moved first, so it's stated rather than
  derived. Worth revisiting once damage lands.
- **Trapping is enforced, not just displayed.** A trapped slot's Switch button
  reads *Trapped* and refuses, so a plan can't be built on a switch the game
  won't allow. Two sources, modelled differently: **abilities** (Shadow Tag,
  Arena Trap, Magnet Pull — all three are fielded in this game) are *derived*
  from whoever is opposite, because they stop the instant that Pokémon leaves;
  **moves** are recorded on the Pokémon, because they follow it. Mean Look,
  Block and Spider Web never wear off. The binding moves run 2–5 turns at
  random, so they get the sleep treatment — turns elapsed, never a floor —
  except with a **Grip Claw**, which pins them to exactly 5 and is the one case
  a plan can rely on. Switching out clears any of it.
- **Perish Song is counted down**, on both sides at once — it catches the singer
  too, which is the whole reason 14 trainer sets carrying it are dangerous to
  *them*. Switching out is the only escape and clears the count. At zero the
  slot reads FAINTS rather than emptying itself, so the plan still records who
  was out when it happened.
- **Screens expire.** Reflect and Light Screen run 5 turns, or 8 if the Pokémon
  that *set* them held a Light Clay, and the badge counts down. Both live in the
  side's `hazards` map, but a hazard's value counts layers while a screen's
  counts turns left — the `SCREENS` list is what tells the two apart.
- **Standing weather is detected, not configured.** 235 of 495 fights start in
  sun, rain, sand, hail or fog, from `flags.js weather`. It is applied before the
  leads, so a Drizzle or Sand Stream Pokémon still overrides it, and the card
  labels it "(battle)" so it doesn't read as the planner inventing a sandstorm.
  Roark's gym is in sand, which is the whole story of his Gible's Sand Veil.
- **One non-volatile status at a time**, which is what makes pre-statusing your
  own Pokémon a real tactic.
- **Volatiles sit alongside it**: confusion, Encore, Leech Seed, Disable,
  Torment, infatuation, Substitute. Moves apply them and they can also be set by
  hand. Taunt is deliberately absent — Platinum Kaizo deletes the move, along
  with Nightmare and Heal Block, so offering it would only invite plans that
  can't happen.
- **Nothing ends a volatile on a schedule.** Encore runs 4–8 turns *or* until
  the encored move runs out of PP, Disable 4–7; Leech Seed and Torment last
  until the target switches out. Two of those exits aren't predictable and PP
  isn't tracked, so — as with sleep — the planner never guesses. Switching out
  clears them, and the turn editor toggles them off individually.
- **Curing berries** are modelled and spent once — Roark's Cranidos holds a Lum
  Berry, so a plan built on poisoning it doesn't work.
- **Sleep is counted, not predicted.** Its duration is random and isn't in the
  game data, so the badge shows turns elapsed and never implies a floor. An
  early wake is planned as a branch; "ends on this turn" closes it out.
- Turns reachable by more than one branch are flagged "mixed state".

### Pokémon and slots

- **Stable identity** via `set.data.id` (`<PID>-<IVs>-<met level>`), so a line
  survives evolution. Falls back to the species+nickname key for hand-made Box
  entries, which have no id.
- **Two slots per side.** Singles use index 0 only, so one code path covers both.
- **Formats are detected, not configured**, from `flags.js battleType`:
  `single`, `trueDouble` (2v2), `double` (two trainers at once), `tag` (an AI
  ally). 190 of 495 trainers are in one.
- **Slots know who owns them** — your team, an opposing trainer, or the ally —
  and resolve sets accordingly. A tag partner's Pokémon come from their party.
- **Only your team can fight.** Boxed Pokémon can be dragged onto the team to
  swap in, but not into a turn.
- **Switching is a real action for either side**, and costs that slot its turn:
  whoever comes in takes the hit. Switches resolve before moves.
- **Spread moves** hit both opposing slots; everything else hits across.

### On the card

- Both movesets, **yours left and theirs right**, always — a double stacks its
  two Pokémon inside each side's column.
- **Abilities**, with the full description on hover, underlined when the planner
  acts on them. 21 are modelled: status and stat-drop protection, Intimidate,
  weather setters, trapping, Natural Cure. Damage-only abilities are left to
  `@smogon/calc`, which already implements them.
- **Held items**, editable in place, writing straight back to the Box.
- **Trainer AI flags** in plain language, labelled per trainer when there are two.
- Platinum Kaizo's removal of self-inflicted stat drops (Superpower, Overheat,
  Psycho Boost, Draco Meteor, Leaf Storm) is flagged.

### Filling a turn

Four ways in, because the strips can be folded away:

- **Drag** a Pokémon from a strip onto a slot
- **Click** an empty (or filled) slot to pick from the right source
- **Right-click** a slot to empty it
- **Switch** button per slot, for a mid-fight change

The turn editor holds only what the card can't: the note, and status carried
into the turn.

### A "How to use" page

`src/how-to-use.html` — a standalone page reachable from the Planner sidebar and
from the empty-state placeholder. It pulls in `planner.css` and renders **real,
styled components** rather than screenshots, so it can't go stale the way a
screenshot does: every card, badge, arrow and button on it is the same markup
`planner-controls.js` emits.

Built for the feedback deploy, so it also states plainly what *isn't* built yet
— damage numbers above all — to keep that out of the feedback.

Two things worth knowing before editing it:

- The branch diagram's arrows are **measured off the real cards** at load, using
  the same route `routeEdge()` uses. Hardcoded coordinates drifted the moment a
  card's padding changed; these can't.
- `main.css` pins `html, body { min-width: 100em }` for the calculator's
  fixed-width tables. The page overrides it, and the components too wide for a
  phone (a doubles card, the branch editor) scroll inside `.doc-scroll` rather
  than dragging the page sideways.

---

## Next: damage integration

Model correctness is finished; what remains is either polish or additive. Damage
is the one to take first — it needs no further model work, and everything below
reads better with real numbers on the cards.

KO chance, damage rolls, HP bars, speed order. `@smogon/calc` takes abilities,
items, boosts, status and weather natively, and the planner already derives all
of those, so this is mostly a matter of assembling a `Pokemon` and a `Field` per
slot and reading the result back. Abilities and the slot shape were the
prerequisites; both are done.

---

## Then: history across attempts

Resetting is the normal loop in a Nuzlocke, not an edge case. A planner that
forgets everything on reset throws away exactly the knowledge that makes the
next attempt better.

Lines currently live-update from the Box — right for a run in progress, wrong
for a past attempt. The resolution: **a line is live while its Pokémon still
exist, and freezes when they don't.**

- Store a light snapshot beside the reference (species, level, moves, item,
  ability, nature). Resolve live first; fall back to the snapshot and mark the
  line **historical** — read-only and dimmed.
- Editing a historical line should be blocked, offering **"Duplicate into
  current run"** instead, so a past attempt stays an honest record of what was
  actually done.
- Optional later: **runs** as a browsable concept, so attempts can be compared
  side by side. The snapshot already preserves the information; this only
  organises it.

---

## Then: making the builder pleasant

- **Rename and duplicate a line** — "Roark, safe" vs "Roark, risky" is how you
  compare plans; today both would just read "Leader Roark".
- **Duplicate a turn** — branches are usually near-copies of their parent, and
  rebuilding one by hand is the most tedious thing in the tool.
- **Line notes** — `line.notes` exists in the model and is never read or written.
- **Export / import a line as JSON** — backup and sharing; everything is already
  plain JSON.
- **Auto-layout** — folding hides mess, it doesn't arrange it. Laying turns out
  by depth would.

Each of these wants a line in the "How to use" page once it lands.

---

## Later

- **Type effectiveness per move** on the card. The type chart is already loaded,
  so this is nearly free, and it isn't damage calc — just the matchup.
- **Validation warnings**: no move set on a turn, the Pokémon is dead, the move
  is no longer in its set.
- **Level-cap awareness** — flag a Pokémon over the cap for that badge.
- **Canvas zoom** and keyboard shortcuts (add turn, delete, Esc to close).

---

## Not doing: auto-generated lines

Dropped after feedback, not for want of a way to build it — the model can express
everything a generated line would need, and damage would have supplied the
scoring.

**It spoils the game.** A tool that hands you the answer to a fight removes the
part of a Nuzlocke that is actually the game: working the fight out yourself,
being wrong, and losing something for it. The planner is worth having because it
makes *your* reasoning explicit and keeps it around — not because it reasons for
you.

That line is worth holding elsewhere too. Damage numbers, type matchups and
validation warnings all inform a decision you still make. Anything that ranks
whole plans and picks one is the thing this section rules out.
