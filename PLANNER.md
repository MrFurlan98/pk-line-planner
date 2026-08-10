# Line Planner — roadmap

A visual planner for a single trainer fight: which Pokémon leads, what it does
each turn, and how the plan branches when the fight doesn't go to script.

Lives in the **Planner** tab. Source: `src/js/planner-model.js` (state and
persistence), `src/js/planner-calc.js` (damage, the only file that touches
`@smogon/calc`), `src/js/planner-controls.js` (UI), `src/css/planner.css`,
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
  Block and Spider Web never wear off. The binding moves run 2–5 turns, so 5 is
  a ceiling like confusion's and the grip ends there either way; a **Grip Claw**
  doesn't extend that in this game, it removes the early release, so the hold is
  exactly 5 rather than anywhere from 2. Switching out clears any of it.
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
- **Volatiles with a ceiling end at it; the rest never expire.** Confusion runs
  2–5, Encore 4–8, Disable 4–7 — random in the middle, certain at the end — so
  the planner ends them there and the badge counts up to it. Encore can also
  break early on PP, which isn't tracked, so only its ceiling is relied on.
  Leech Seed, Torment, infatuation and Substitute have no turn limit and are
  cleared only by leaving the field or by hand.
- **Freeze is the one condition with no ceiling at all** — a flat 20% a turn, so
  it can outlast a whole fight. Branch the thaw; don't count on it.
- **Badly poisoned resets its counter on a switch, but not the status.** The
  damage ramps with that count, so it matters that coming back in resumes at
  1/16 rather than where it left off.
- **Curing berries** are modelled and spent once — Roark's Cranidos holds a Lum
  Berry, so a plan built on poisoning it doesn't work.
- **Sleep is pinned at both ends and random in between.** A Pokémon cannot wake
  on the turn it falls asleep, and after **4 turns** it is awake regardless —
  both guaranteed, so the planner models the wake rather than making you branch
  it. The turns between are a real coin flip and stay one: the badge counts up,
  and an early wake is still a branch. The duration isn't in the game data, so
  the 4 comes from the mechanic itself.
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
- **Spread moves** hit both opposing slots; everything else hits one, and *which*
  one is a choice. A 2v2 has no far slot — every position is adjacent to every
  other — so either of your Pokémon can attack either of theirs, and pointing
  both of yours at one of theirs is most of what makes a double a double. Pinning
  each slot to the one across from it, which is what the model used to do, ruled
  that out entirely.
  - Stated per slot in `aimedAt`, or null for "whoever is across", which is what
    every line saved before this keeps doing.
  - Kept beside the actions rather than on them: actions are replaced wholesale
    in half a dozen places and an aim stored inside one would be silently lost.
  - The picker only appears in a double, because it is the only place the
    question exists — and a spread move says *both* rather than offering a choice
    it doesn't have.

### Damage, per move

- **Every move on the card shows what it does**, as a percentage range of the
  target's health, in the space base power used to occupy. Worked out against
  everything the turn already knows — boosts, status, ability, item, screens and
  the weather the fight is standing in — because all of that was already derived
  and `@smogon/calc` takes it natively.
- **Gen 4 in this fork *is* Platinum Kaizo.** `calc/src/data/moves.ts` builds its
  gen-4 table by patching DPP with the hack's changes and deleting the moves it
  removes, and `species.ts` does the same to base stats. So a plain
  `calc.calculate(4, ...)` returns Kaizo numbers, and nothing here re-implements
  them. `GAME.gen` is read rather than the global `gen`, which follows the
  calculator tab's dropdown and must not change what the planner says.
- **A guaranteed KO says `KO` rather than a number.** Past the kill the range
  informs nothing — Kaizo overkill runs to "222–265" — and it is the one case
  wide enough to push a long move name into an ellipsis. The range that *does*
  matter is the one straddling 100, and that one is shown in full: it is exactly
  the fork a *You KO / You don't KO* branch is drawn for.
- **Colour reads from your side**, like the branch conditions: green is your KO,
  red is theirs. The tooltip carries the calculator's own full sentence, which
  names every modifier it applied.
### HP, carried down the line

- **HP is a range, not a number.** A damage roll is 85–100%, so what a Pokémon
  has left is `{min, max}`, widening by the spread on every hit. Same treatment
  sleep and the binding moves get: certain where the mechanic is certain, a gauge
  where it isn't. The bar draws both — solid for what it holds even on the worst
  run of rolls, pale for the rest — so reading the solid edge alone is reading
  the plan pessimistically, which is how a Nuzlocke wants to be read.
- **The branch conditions are what narrow it.** They already said which way the
  roll went; now they're read rather than only drawn. *You KO* / *You crit KO* /
  *Sacrifice* pin the target to nothing; *You don't KO* / *You survive* lift the
  floor off zero; *You crit* / *They crit* recalculate that turn with `isCrit`.
  This is what stops the band widening forever — every fork prunes it. A miss is
  deliberately not in the list: `skipped` already means "its move never went
  off", and two mechanisms for one fact would double-count.
- **A branch that disagrees with the arithmetic still wins.** If nothing's range
  straddles zero, the statement is applied anyway, to one slot only — you are
  recording what happened, not asking to be second-guessed, exactly as with every
  other seed. Where several slots *are* uncertain, all of them resolve.
- **Something that came into a turn already dead gets no move**, which is what
  makes a KO actually deny the *next* turn. Not an inference — arithmetic on a
  branch you drew.
- **Dying during a turn does not take that turn's move away.** Both sides move on
  the same turn, so a Pokémon that faints still got its own move off first unless
  you say otherwise. The fainted check is therefore a snapshot taken before any
  move resolves, not a live test as the loop runs: testing live meant whichever
  side the loop reached first silently denied the other, which is the planner
  deciding who was faster — the one thing it has no way to know. That call stays
  on the *didn't act* toggle.
- **A denied move's damage is struck through on the card** rather than hidden.
  None of it lands, but what it *would* have done is exactly why you denied it.

### Turn order

Speed was the missing half of the *didn't act* toggle: with damage in, who moves
first is finally derivable, so a Pokémon outsped and killed outright no longer
gets a move it never had.

- **Priority is read from the move table, never assumed.** Platinum Kaizo
  rebalanced the brackets and it is not subtle: Trick Room and Block are **+7**
  where the base game has Trick Room at −7, Tailwind is +5, Fake Out +3,
  ExtremeSpeed and Sucker Punch +2, and the hazard moves get +1. Hardcoding
  vanilla values would silently get the order wrong in exactly the fights that
  turn on it. The negatives *are* vanilla — Roar −6, Counter −5, Focus Punch −3.
  (`calc/src/data/moves.ts` cannot arbitrate here: it only fills in priority
  where damage needs it, so Roar reads 0 there.)
- **Speed comes from calc's own `getFinalSpeed`**, not a reimplementation, so the
  planner's order and the calculator's can't drift. It already handles stat
  stages, paralysis (a quarter in this generation, not gen 7's half), Choice
  Scarf, the weather abilities and Tailwind.
- **Only a certain KO denies a move.** Outsped *and* dead on every roll, which is
  the same class of fact as sleep ending after four turns. A kill that depends on
  the roll leaves the move landing, because that fork is what a *You KO / You
  don't KO* branch is drawn for.
- **Simultaneous slots can't deny each other.** Actions are grouped by priority
  and speed, and every member of a group is handed the same snapshot — a tie is
  settled at random in game, and no plan should rest on it.
- **Two things make the order unknowable, and both abstain rather than guess**: a
  **Quick Claw** on the victim (a flat 20% to jump the queue, 38 of 2121 trainer
  sets) and a genuine tie. Neither ever denies a move.
- **Stall, Lagging Tail and Full Incense go last** within their bracket.
- **Tailwind** doubles its side's Speed for 3 turns. It lives in the side's
  `hazards` map like the screens and counts down the same way, but is
  deliberately *not* in `SCREENS`: Brick Break doesn't break it and Defog doesn't
  clear it, so `TIMED_SIDE` is the superset that ticks and `SCREENS` stays the
  subset those two moves touch. The doubling itself is free — `isTailwind` is one
  of calc's own `Side` fields, so `getFinalSpeed` applies it.
- **Trick Room** flips the speed comparison, and only that one — priority
  brackets still win outright, so a Quick Attack goes before a Tackle under it.
  It lives on the state beside the weather, since it belongs to the field rather
  than to either side.
  - **It is a toggle, not a timer.** This game's own text is "Reverses the speed
    order of the battle until the move is used again", where the base game gives
    it five turns — so there is no counter to keep and casting it again turns it
    off. Modelling it as a duration would have been importing a rule this game
    doesn't have.
  - **It takes effect from the next turn, not the one it lands on.** Gen 4 settles
    turn order once at the top of a turn and never revisits it — there is no
    dynamic speed until gen 8 — so `turnOrder` reading the flag off the state it
    was handed is exactly right, and no mid-turn re-sort is needed. At +7 priority
    the cast itself goes first regardless.
  - Nine sets across seven trainers carry it, and five of those nine are in
    doubles or tag fights: Slowking, Slowbro, Dusknoir, Bronzor, Spiritomb. They
    are slow and bulky on purpose — Trick Room *is* the set, not a footnote.

### Fake Out

The one move whose flinch is a certainty rather than a chance, which is the only
reason it can be modelled at all — the percentage flinchers (Bite, Rock Slide,
Air Slash) are left alone for the same reason a 10% burn is. **121 of the 2121
trainer sets carry it**, and at +3 priority in Kaizo it nearly always resolves
first, so a lead that Fake Outs really does take the other side's whole first
turn away.

Neither half of it is in the generated tables: the effect text isn't in the "Has
a 100% chance to…" form `gen-move-effects.js` matches, and flinch isn't a
volatile the planner tracks — it lasts a fraction of a turn rather than turns.
So both halves are code:

- **It fails after the first turn**, doing nothing at all — no damage, no flinch
  — while still costing the turn. Tracked by `turnsActive` on the Pokémon.
- **A turn spent switching in doesn't count**, because the Pokémon never got to
  move, so it can still Fake Out on the turn *after* it arrives. Leaving the
  field resets the counter, so a Pokémon brought back in can use it again.
- **Inner Focus refuses the flinch** outright.
- **A flinch can only take the turn from something strictly slower**, held back
  until the speed group finishes — two Pokémon moving at the same instant can't
  flinch each other out of a move, exactly as with a KO.
- **`hpSeed` states health outright**, per slot, as a percentage. An absolute
  rather than a delta, because its job is to collapse the range back to a point:
  for a line that opens mid-fight, or when the band has widened past being useful
  and you know what actually happened.
- **End-of-turn damage is modelled**, because `@smogon/calc` computes one move
  against one target and stops — and without the rest an HP bar drifts further
  from the truth every turn, worst in the long fights most worth planning.
  Weather, Leftovers, Black Sludge, Sticky Barb, Leech Seed (which *moves* HP,
  Big Root and Liquid Ooze included) and status. The fractions and the exception
  lists come from calc's own `getEndOfTurn`, so the planner's HP and the
  calculator's KO chances can't disagree about the same fight. Sand Veil earns
  its place here as well as in evasion: Roark's Gible takes nothing from his own
  gym's sandstorm.
- **The order of those effects is load-bearing, and so is fainting part-way
  through.** Gen 4 resolves them in a fixed sequence, and a Pokémon that dies at
  step three never reaches step four — so a sandstorm can kill something whose
  Leftovers would otherwise have saved it. `healMon` refuses anything already
  gone, which is the whole reason it isn't a one-liner.
  - The sequence: **Wish** → weather damage and the weather abilities →
    Ingrain and Aqua Ring → Leftovers, Black Sludge, Sticky Barb → **Leech Seed**
    → poison and burn → **Future Sight and Doom Desire**. Wish sits near the
    front and the delayed attacks at the very back, which is why a Wish can pull
    something out of a sandstorm and a Future Sight cannot be outrun by one.
  - **A band straddling zero heals only at the top.** It survived on some rolls
    and not others, so the healing applies to the rolls where there was still
    somebody to heal and the bottom of the band stays at nothing.
- **Toxic keeps its own count**, not `statusTurns`. That one is incremented at
  the top of a turn, so it reads 1 for a poison carried in but 0 for one a move
  landed this turn — two different numbers for what is equally the first tick.
  Leaving the field resets the count and not the status, which is the whole value
  of switching out of it.
- **Two different denominators, on purpose.** A move's percentage is of *max* HP,
  which is what a damage figure conventionally means and what keeps it stable as
  the fight wears on. Whether it *kills* is measured against what the target has
  left. "KO" means it dies even on the roll that treated it best.
- **Recoil, drain and Life Orb** come off the user. Drain, Shell Bell and Pain
  Split are read from calc's `getRecovery`, whose `recovery` array is already
  exact HP — only its `text` is a percentage. Recoil is worked out here instead:
  `getRecoil` returns a rounded percentage and says so in its own source (*"TODO:
  return recoil damage as exact HP"*), and converting that back loses a point or
  two per hit, which compounds. The move carries its own fraction and the damage
  is already exact, so the honest sum is shorter than the round trip.
- **Entry hazards bite on the way in**, straight from the moves' own text:
  Stealth Rock 1/8 scaled by the Rock matchup, Spikes 1/8, 1/6 or 1/4 by layer
  for grounded Pokémon only, Toxic Spikes poisoning for one layer and badly
  poisoning for two. Magic Guard takes none of the damage but is still poisoned.
  - The Toxic Spikes half had **never done anything**: the layers were tracked,
    displayed and removable, but nothing walking into them was ever poisoned.
- **Healing moves** are generated rather than hardcoded — the effect text is
  regular enough to parse ("Heals the user by 50% of its total HP"), and the
  drain moves are excluded by requiring *of its total HP* rather than *of the
  damage dealt*. Synthesis, Moonlight and Morning Sun carry their weather swing:
  two thirds in sun, a **quarter in anything else**, which in a fight that starts
  in sand is the difference between a recovery move and a wasted turn.
  - Fractions are emitted as `[numerator, denominator]`, not decimals. Two thirds
    as a double is a hair under two thirds, and `floor(maxHP * 0.666…)` is a
    rounding bug waiting for the right max HP.
  - Worth knowing: this game's **Lunar Dance is a plain 50% self-heal**, not the
    faint-and-restore of the base game. The generator picked that up from the
    game's own text, which is the argument for generating rather than assuming.
- **Aqua Ring and Ingrain** hand back a sixteenth every turn. Both are volatiles
  carrying a `regen` denominator beside `maxTurns` — the same kind of fact, a
  rule about the condition rather than something to parse for. Ingrain also roots
  its user: it can never switch out, which is the price of the healing.
- **Delayed effects belong to the slot, not the Pokémon**, which is the whole
  point of every move that queues one. They live in `state[side].pending[slot]`
  and count down the way Perish Song does, just against a slot.
  - **Wish** lands at the end of the *following* turn: Wish, switch, and the
    arrival is healed on the way in. The amount is fixed when it is used, at half
    the **user's** max HP, so switching something frailer in still collects the
    same number.
  - **Future Sight and Doom Desire** are the mirror image — the damage is worked
    out now, against whoever is standing there now, and lands two turns later on
    whatever is standing there by then. Verified: aimed at a Cranidos, collected
    by the Bonsly that replaced it. Switching does not dodge it.
  - The stored count is **ticks, not the wording's "turns later"**, and the two
    differ by one: the turn the move is used on ends with a tick of its own,
    which the countdown absorbs before any waiting starts. Wish says "the next
    turn" and takes 2; Future Sight says "2 turns later" and takes 3.
  - Future Sight's queued number is the **middle of the roll** rather than the
    band. Two turns of extra uncertainty on top of everything else would widen
    the range past being useful, and the number really was settled when the move
    went off — it just hasn't arrived.
- **Pain Split** levels the two bars: both end on the average of what they had,
  each capped at its own maximum. Neither an attack nor a heal — which it is
  depends entirely on who was worse off, which is why something frail and nearly
  dead uses it to drag a healthy Pokémon down to meet it. Verified both ways: at
  13/63 against a full 52/52 both land on 32, and at full health the 52/52 stays
  put rather than overhealing.
- **Roost sheds its user's Flying type for the rest of the turn**, which is what
  lets it Roost into a Rock or Electric move and live. Two things make this
  fiddlier than it looks:
  - `calculate()` clones both Pokémon and `clone()` re-derives types from the
    species, so assigning to `.types` afterwards is silently discarded. It has to
    go through the constructor's `overrides`.
  - `overrides` is *deep-merged* into the species, so a one-element array leaves
    the original second type showing through at index 1. The override carries an
    explicit `null` second type instead. Verified: Head Smash into a Roosting
    Staravia drops from 122–146 to 61–73, while Crunch stays put.
- **Leech Seed refuses a Grass type**, which its own text says outright and the
  planner had been ignoring — a plan could rest on seeding something the game
  won't let you seed. Generated as `failsAgainstType`; Leech Seed is the only
  move in the game with that phrasing.

- **The state walk is memoised per render.** Phase one measured this and found a
  cache saved nothing; folding damage into every turn reversed that, because each
  turn now runs a calculation per move and the walk is quadratic. Warmed
  parents-first by `warmNodeStates`, a 30-turn line costs 34 ms against 449 ms
  uncached. `renderLine` clears it before drawing, so an entry never outlives the
  plan it came from and there is no hand invalidation to get wrong.

- **Not yet: speed order, recoil and drain.** See below.

### Blind mode

A toolbar toggle that puts the numbers away: base power back on the moves, no
health bars, no speed markers, and nothing denied for being outsped and killed.
The same argument the roadmap makes against generated lines, in miniature —
working the fight out yourself is the part of a Nuzlocke that is actually the
game, and a damage figure is useful without always being wanted.

- **It switches off the derivation, not just the display**, and that distinction
  is the whole feature. Hiding alone would still leak the numbers back through
  their consequences: a move struck through tells you it is a guaranteed KO just
  as plainly as the figure would have. So `foldDamage` returns early, `speedFor`
  gives every slot the same unknown speed, and `ensureHp` refuses to put anything
  on a scale — no HP is carried at all.
- **Everything that comes from the rules stays on**: hazards, screens, weather,
  status, trapping, Perish Song, and Fake Out both flinching and failing. None of
  those is an answer you were meant to work out.
- Global rather than per line, like the party fold, and remembered across
  reloads. The button carries an `active` state, because a card with no numbers
  should never leave you wondering whether the planner is being coy or simply
  hasn't worked them out.

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

The turn editor holds only what the card can't: the note, and the status, stat
stages, volatiles and health carried into the turn.

### A "How to use" page

`src/how-to-use.html` — a standalone page reachable from the Planner sidebar and
from the empty-state placeholder. It pulls in `planner.css` and renders **real,
styled components** rather than screenshots, so it can't go stale the way a
screenshot does: every card, badge, arrow and button on it is the same markup
`planner-controls.js` emits.

Built for the feedback deploy, so it also states plainly what *isn't* built yet,
to keep that out of the feedback.

Two things worth knowing before editing it:

- The branch diagram's arrows are **measured off the real cards** at load, using
  the same route `routeEdge()` uses. Hardcoded coordinates drifted the moment a
  card's padding changed; these can't.
- `main.css` pins `html, body { min-width: 100em }` for the calculator's
  fixed-width tables. The page overrides it, and the components too wide for a
  phone (a doubles card, the branch editor) scroll inside `.doc-scroll` rather
  than dragging the page sideways.

---

## Next: validation warnings

Damage makes several of these real for the first time — a branch whose condition
the arithmetic says is impossible, a turn where a fainted Pokémon is still given
a move, a plan that keeps attacking something already dead.

### Worth knowing about Roost

Shedding Flying is not uniformly good for the Pokémon doing it, which is easy to
get backwards. Against a Normal/Flying target, measured:

| move type | Normal/Flying | pure Normal | |
|---|---|---|---|
| Fighting | 25–30 | 50–60 | doubles |
| Bug | 8–10 | 17–20 | doubles |
| Ground | *immune* | 17–20 | becomes hittable |
| Rock | 56–68 | 28–34 | **halves** |

Flying is *weak* to Rock, Electric and Ice, so Roosting **removes** those
weaknesses — a Head Smash into a Roosting bird hits for half, not double. What it
costs is the Flying resistances and the Ground immunity.

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
