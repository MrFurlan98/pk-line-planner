# Line Planner — roadmap

A visual planner for a single trainer fight: which Pokémon leads, what it does
each turn, and how the plan branches when the fight doesn't go to script.

Lives in the **Planner** tab. Source: `src/js/planner-model.js` (state and
persistence), `src/js/planner-calc.js` (damage, the only file that touches
`@smogon/calc`), `src/js/planner-controls.js` (UI), `src/css/planner.css`,
`src/js/data/games.js` (per-game adapter), and two generated data files:
`src/js/data/move_effects.js`, `src/js/data/ability_effects.js` and
`src/js/data/item_effects.js` — regenerate with `node tools/gen-move-effects.js`,
`node tools/gen-ability-effects.js` and `node tools/gen-item-effects.js`. Plus
`src/js/data/splits.js`, which is the odd one out: it comes from a community
spreadsheet rather than the game's own data, so `tools/gen-splits.js` fetches
over the network. See **Setting up a split**.

---

## Built

### The plan itself

- **Turns as nodes**, dragged into place, joined by labelled arrows. Drop an
  arrow on empty canvas and the next turn arrives as a **copy** of the one it
  came from — who is out, what they do, who they aim at, and the note. A branch
  is nearly always a near-copy of its parent, and rebuilding four slots and four
  moves by hand was the most tedious thing in the tool.
  - What it leaves behind is everything that *states* something rather than
    arranging it: the status, stat-stage, volatile and health seeds, and the
    "didn't act" flags. Those are corrections applied on top of what a turn
    inherits, so copying them would apply them twice — a carried +2 Attack would
    quietly become +4. The new turn inherits all of it from its parent anyway.
  - A slot that **switched** copies as the Pokémon who came in, with the switch
    dropped, since sending in something already standing there is the one thing
    a copied turn must not do.
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
- **Held items that heal or boost go off too**, and can be spent by hand. See
  below.
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
- **A move that lands a varying number of times is two uncertainties, not one.**
  The 2–5 hit moves — Bullet Seed, Rock Blast, Fury Swipes and five others — are
  settled by calc at three hits, the average, and a KO worked out from three is
  a lie the moment the move stops at two. Each end of the band is taken from the
  matching end of the hit span instead: fewest hits on the worst roll, most hits
  on the best. A `KO` therefore means *two* hits would already do it.
  - Against a Bonsly with 26 HP left, calc alone reads 30–36 and calls it a KO.
    Two hits is 20–24 and doesn't. The planner now says 45–136 and no KO.
  - Hit counts come from **this game's** table rather than calc's, because the
    two disagree: Triple Kick is 1–3 here and a flat 3 in calc.
  - Fixed multi-hit moves (Double Kick, Bonemerang, Twineedle) carry no extra
    uncertainty and are unaffected.
- **A guaranteed KO says `KO` rather than a number.** Past the kill the range
  informs nothing — Kaizo overkill runs to "222–265" — and it is the one case
  wide enough to push a long move name into an ellipsis. The range that *does*
  matter is the one straddling 100, and that one is shown in full: it is exactly
  the fork a *You KO / You don't KO* branch is drawn for.
- **Colour reads from your side**, like the branch conditions: green is your KO,
  red is theirs. The tooltip carries the calculator's own full sentence, which
  names every modifier it applied.
- **A move that can't touch its target says `0`**, and one that *heals* it says
  `+25`. Both used to fall back to base power, which read as an ordinary move
  nobody had worked out yet — the worst possible reading, since the point of both
  is "don't pick this".
  - The zero was a deliberate old choice, and the wrong one: the code returned
    null "rather than a zero that reads like an immunity", when an immunity is
    exactly what it is. In this generation a move that connects takes at least one
    point, so a flat zero from calc *means* immunity — the type chart's (Shadow
    Ball into a Normal type, Poison into a Steel) or an ability's (Levitate,
    Flash Fire, Wonder Guard). A dash still means "no number here", which is what
    a status move shows, so the two no longer collide.
  - **The absorb abilities are the case worth catching.** `@smogon/calc` returns
    zero for Volt Absorb, Water Absorb and Dry Skin and stops there, because it
    treats them as immunities and what happens *instead* is state. So the heal is
    the planner's half: a quarter of the target's maximum, applied where the hit
    would have gone in. Motor Drive is the same shape paid out in a stat stage,
    and it lands too.
  - Generated into `ability_effects.js` as `whenHitBy`, anchored on the phrase
    "when hit by" so Dry Skin's *other* clause — an eighth every turn in rain —
    can't be mistaken for it.
  - **Nothing comes back off the user.** A move that dealt nothing recoils
    nothing and drains nothing, and a Life Orb doesn't take its tenth. Verified:
    an immune Earthquake leaves a Life Orb holder untouched where a Steel move
    from the same Pokémon costs it 6 HP.
  - Free consequence: *You KO* into an immunity is now flagged as impossible,
    because the figure is a real zero rather than a missing number.
  - Also fixed a live oddity nobody had chased — Aipom's Water Gun on the sample
    doubles card read `40`, its base power, because the target had Dry Skin.
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
- **A crit changes the health it leaves behind, not the figure on the card.**
  The card shows what a move does; a crit is something a *branch* says happened,
  and a turn can fork several ways at once. One figure can't mean the ordinary
  hit down one arm and a crit down another, so it stays the ordinary hit and the
  crit shows up where it is unambiguous — in the HP each branch carries away.
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

### Refusing the turn: Protect, Detect, Endure and Follow Me

The other four moves that had to be code rather than data. None of them is in the
generated table — "Protects the user from incoming moves" and "Forces all
single-target moves to target the user" aren't effects `gen-move-effects.js`
extracts, and none of them is a volatile the planner tracks, because they last one
turn rather than turns. **63 trainer sets carry Protect, 29 Follow Me, 16 Endure
and 2 Detect**, and the two fights the notes use for doubles are both on the list:
Twins Liv & Liz have a Follow Me, and Galactic Luna #1 carries Follow Me *and*
Protect on the same Pokémon.

All four are **+3 priority** here, which is the whole reason they work — and the
turn order already knows that, so none of it is special-cased.

- **Protect and Detect stop the move outright**: no damage, no status, no stat
  drop, no Leech Seed. **Endure is the other shape** — the hit lands in full and
  only the faint is refused, so it holds on at 1 HP. Kept apart rather than
  collapsed into one flag, because they change different things.
- **What Protect stops is read from the move's own flags**, not from a list kept
  in the planner. The dex carries a `Protect` flag on exactly the moves the game
  lets it block, so Stealth Rock, Swords Dance, Perish Song and Rain Dance all go
  straight through without anything having to say so. Verified one by one.
- **Follow Me redirects every single-target move**, whatever it was aimed at. The
  dex decides what counts: `target: "normal"` is one adjacent Pokémon, and
  everything else — a spread move, a self-target, a hazard, Counter's scripted
  target — has no single victim to move. So an Earthquake still hits both.
  - It moves the *card's* figures too, not only the health carried away. A move
    pulled onto a different Pokémon is being calculated against different typing
    and different defences, and a card quoting the number against the target you
    picked would be quoting one that never happens. The aim row follows it, marks
    the drawing slot, and says why the aim isn't deciding this turn.
- **The first use is guaranteed; a repeat is a coin flip**, because that is the
  mechanic — each successive Protect halves the chance. **The guard is applied
  either way and the card warns you.** A repeat is a *fork*, and this tool already
  has a fork: draw the branch, and on the arm where it failed mark the slot
  *didn't act*, which makes the attack land. Hedging the health instead would be a
  second mechanism for a fact `skipped` already states — the same double-count
  that keeps a miss out of the branch conditions.
  - Verified end to end: three Protects in a row hold at `54–54` throughout, with
    the second and third warning; marking the second *didn't act* lands the Head
    Smash for `38–41` **and resets the streak**, so the third is guaranteed again
    and drops its warning. An attack in between does the same.
  - Protect, Detect and Endure share the one streak. Leaving the field resets it,
    and so does the guard not going off.
- **This is the one warning that fires on something possible.** Every other one
  here fires on the impossible, and the roadmap is emphatic about why. It earns
  the exception by being rare, by being *invisible otherwise* — a blocked move
  looks identical whether the block was guaranteed or a gamble — and by naming the
  branch it wants to become rather than just expressing doubt.
- **A guard only refuses something strictly slower**, held back to the end of the
  speed group exactly as a flinch is, and the same for a Follow Me. Two Pokémon
  moving at the same instant move in an order nothing here can know. Verified on
  the real thing: with Pachirisu at 50, Aipom at 42 and Croagunk at 28 and all
  three at +3, the Follow Me lands first and pulls Aipom's Fake Out off the
  Protecting Croagunk entirely.
- **They stay on in blind mode.** Both are rules rather than answers — they belong
  with the hazards and the weather, not with the numbers — and the fold applies
  them there either way, so the card is told about them too. Nothing
  damage-derived leaks in with them: no HP is carried in blind mode, so nothing is
  ever fainted and nothing is ever outsped.
- **A guard makes a branch unjudgeable, so validation abstains.** The check that
  rules out an impossible *You KO* knows what a move does and nothing else, and a
  guard breaks that in both directions at once: a Protect makes the KO impossible,
  a repeat one makes it a coin flip, and an Endure holds the faint off the move
  while leaving the sandstorm free to finish the job a moment later. So the branch
  is left alone rather than contradicted. Fixing this caught a genuine false
  positive — *You don't KO* into a Protect was being called impossible, on a turn
  where it is exactly what happens.

### Catching something on the way out: Pursuit and Rage

**In this game Rage is a second Pursuit.** Its text is word for word identical —
*"If the target attempts to switch out, this move hits before the switch, and
deals double the damage"* — where the base game's Rage raises Attack when hit and
has nothing to do with switching at all. Between them that is **198 trainer sets**,
Pursuit on 124 and Rage on 74, and this is the strongest argument yet for
generating these tables: a hand-written list built from memory would have carried
74 sets' worth of the wrong move.

The planner had neither half, and both were wrong in the same direction — a
declared switch resolves before any move does, so the planner was sending the
Pursuit at *whoever came in*, at *normal* power. That is precisely backwards from
what the move is for: switching away is how you dodge a hit, and this is the move
that punishes it.

- **It hits whoever is leaving.** The damage is worked out against the turn's
  parent, where that Pokémon is still standing, rather than against the field the
  switch has already changed.
- **Double base power, not double damage.** Doubling the finished range would
  drift a point or two on the rounding and compound down the line, so the doubling
  goes through calc's own `basePower` override and calc does the arithmetic.
- **Only against a stated switch**, which is a certainty rather than a guess about
  intent. Measured: 4–5 HP against a Pokémon that stays, 8–10 against the same one
  leaving, and the card shows whichever applies.

### Moves that switch their own user

**U-turn (66 sets) and Baton Pass (42) land their damage and then take their user
off the field**, which is the move rather than an option attached to it.

The switch itself can't be inferred, because the game asks the same question: who
comes in is a choice, and nothing in the plan implies it. So it is stated, in
`node.switchAfter`, and the card grows an arrow button under the moves whenever
the chosen move is one of these. Until it is answered the button is flagged and a
warning fires — the move isn't optional about switching, so a plan that keeps its
user out is one the game refuses.

- **The switch happens inside the turn order, between speed groups**, which is the
  whole point of the move: a faster U-turn leaves before the reply, and whoever it
  brought in takes that reply. `onField` is mutated as the groups run, so every
  slower slot resolves against the newcomer's typing, defences and health — and
  its hazards and its Intimidate land in time to matter to the moves still to
  come. Measured on Barry's Aipom: at 25 Speed against a 21, the Aipom U-turns,
  brings Taillow in, and **the attack aimed at Aipom kills Taillow instead**,
  with Aipom untouched at 31/31.
- **Held to the end of its speed group**, like the flinches and the guards, so
  only something *strictly slower* meets the newcomer. Two Pokémon moving at the
  same instant move in an order nothing here can know.
- **Turn order is settled once and never revisited**, so the arrival gets no place
  in it — correctly, since it hasn't moved. That is this generation's rule and the
  same reason Trick Room only bites from the following turn.
- **The newcomer is the one standing in the sandstorm**, and it walks into the
  hazards on the way in. Verified — a U-turn into a Stealth Rock takes the rocks,
  and the departing Pokémon keeps the health it left with.
- **The arrival never moved**, so its `turnsActive` stays at zero and it can Fake
  Out next turn. The credit for the turn goes to whoever used the move.
- **A U-turn that never went off switches nobody**, so being outsped and killed,
  flinched or Protected against leaves the user standing there. The denials
  `resolveMoves` already reports are what this reads.
- **Switching in is done once, not twice.** The end-of-turn sweep that catches an
  undeclared change has to skip these slots, or the newcomer's boosts get cleared
  a second time and its Intimidate fires twice. Verified at −1, not −2.
- **Branching off a U-turn carries the newcomer through**, the same way a declared
  switch does, and drops the move with it.
- **Volt Switch isn't in this game at all**, so there is nothing to model.
- **Baton Pass hands its work over rather than dropping it**, which is the whole
  reason 42 sets carry it: stat changes, Substitute and the volatiles all move to
  whoever comes in. Taken before the slot is cleared and put back after, because
  `leaveField` does the clearing and has no business knowing which move caused the
  switch. Measured: a +2 Attack survives a Baton Pass and is dropped by a U-turn.
  - **The Perish Song count goes too**, which is the trap worth knowing — passing
    a count to a teammate hands them the faint rather than escaping it, where an
    ordinary switch shakes it off.
  - **A trap goes across, but only the kind that never wears off.** The table's
    own `expires` flag turns out to be exactly the right line: Mean Look, Block
    and Spider Web are `false` and do follow the Pass; every binding move is
    `true` and simply ends when its victim leaves. That is the generation's rule,
    and it fell out of data that was already there rather than needing a list.
    - **Ingrain's self-root passes with it**, being on the `false` side, which is
      what keeps the recipient coherent — it already inherits the volatile doing
      the healing, so inheriting the root that pays for it is the consistent half.
    - **The ability traps aren't involved.** Shadow Tag, Arena Trap and Magnet
      Pull are derived from whoever is standing opposite rather than stored, so
      they re-derive against the newcomer on their own and copying them would be
      wrong.
    - It carries through to enforcement, not just display: the Pokémon that
      receives a Mean Look finds its own Switch button reading **Trapped**.
      Verified, along with a Wrap correctly *not* passing and a U-turn passing
      nothing at all.
  - **The non-volatile status doesn't**, and shouldn't: it belongs to the Pokémon
    that caught it and stays with it on the bench.

### Roar and Whirlwind

They drag the *target* out. Which Pokémon arrives is explicitly random, so the
planner never picks one — it is stated, in the same `switchAfter` field a U-turn
writes to, against the slot being dragged out, since the question is identical:
who is standing here after this turn's switch. The card puts the button on that
slot's column and marks it italic, because it is the one switch on a card that
nobody chose.

What *is* certain is everything the departing Pokémon takes with it — its boosts,
its volatiles — and that is now derived rather than left to the player.

- **The interrupted move is denied when the Roar genuinely resolves first**, held
  to the end of its speed group exactly as a flinch is. But **Roar and Whirlwind
  are −6 priority here**, so they almost always go last and the attack has already
  happened: in practice this fires only against another −6 move. Implemented
  because it is free and correct, not because it will come up.
- Three sets each, so little rests on any of it.

### Held items that go off

A Berry Juice quietly restoring 20 HP is the difference between a plan that works
and one that doesn't, and until now the planner tracked only the *curing* berries
— so a Sitrus, an Oran or a Berry Juice simply never happened.

The table is **generated from the items' own descriptions**, like the move and
ability tables, by `tools/gen-item-effects.js`. 17 items, and the same narrow
scope the ability table draws: **HP and stat stages, which is what the planner
tracks**. Damage-only items — Life Orb, the Choice set, Expert Belt, the
type-resist berries — stay `@smogon/calc`'s job, and modelling them twice would
only let the two drift.

Generating rather than assuming earned its keep immediately: **this game's Ganlon
and Apicot berries have no health threshold at all**, where the base game gates
both at 25%. Their text says "immediately", so they fire on arrival. The same
lesson Lunar Dance taught.

- **Trigger shapes.** A threshold (Sitrus, Oran, Berry Juice at half; the pinch
  stat berries at a quarter), on arrival (Ganlon, Apicot, Berserk Gene), or a
  condition of its own — White Herb waits for a stat drop to exist and is not
  spent on a turn with none.
- **The orbs status their own holder at the end of the turn**, and are the last
  thing a turn does. That ordering is the point: a Toxic Orb lands the poison
  *now* and it starts costing health on the *next* turn, where firing it any
  earlier would have the holder taking a tick of its own poison immediately.
  Neither orb is consumed, which is exactly why a Guts or Poison Heal set carries
  one — 26 sets hold a Toxic Orb and 17 a Flame Orb. Verified against Poison Heal
  (the damage becomes healing), against Immunity and Water Veil (both refuse it),
  and against a Pokémon already statused (an orb can't override).
- **Only a health threshold gets the button.** It is the only trigger the planner
  refuses to guess at. Everything else fires on its own and has no decision in
  it — a Focus Sash catches a particular hit as it lands, a resist berry is spent
  by whoever attacks into it, an orb goes off whether anyone wants it to — so
  those are shown rather than offered.
- **Both of a berry's chances are taken**: once the turn's moves have landed, and
  again after the end-of-turn chip. The second is not the rare case it looks —
  235 fights start in weather, and a sandstorm is what puts most things under
  half. Doing it only at the back would let something die on the way there.
- **A threshold is only claimed when the whole band is under the line.** While it
  straddles, whether the berry went off is a coin flip — and unlike a damage
  roll, an item firing changes *what happens next* rather than only how much is
  left, so there is no honest way to carry both. Measured: a 20–28 band out of 57
  fires; 20–32 does not.
- **So there is a button.** A small pip under the health bar, per slot, naming
  the item. One click states that it went off on this turn, and the plan is
  derived from there; clicking again takes it back. It is a seed like every other
  one — the statement wins over the arithmetic — which is why stating it works
  even from full health.
  - It sits against the HP bar rather than in the turn editor because that is
    where you are looking when the question comes up, and the answer appears an
    inch to its left.
  - Once spent it stays visible, struck through. A berry that is gone is exactly
    the reason a later turn doesn't work.
- **Focus Sash is modelled; Focus Band is not.** "Survive a fatal attack **from
  full HP**" is a certainty when the condition is met, so it is applied inside
  the hit it refuses, next to Endure's floor. A Focus Band is a flat 10% to live,
  which is the same class of thing as a 10% burn and stays out. And "from full"
  is load-bearing: a Sash on something already chipped does nothing, and a band
  that has widened at all fails the test — verified both ways.
- **The Figy family keep their sting.** They heal an eighth and confuse anything
  whose nature dislikes the flavour, which is a fact about the holder rather than
  about the fight, so it is read off the set.
- **A spent consumable stops reaching `@smogon/calc`.** calc applies whatever item
  it is given, every single calculation, with no notion of one being used up — so
  a **type-resist berry halved every hit for the rest of the fight**. A Yache
  Berry gets one super-effective Ice hit and is then gone; the planner was letting
  a plan rest on a resistance that only ever existed once.
  - The reduction itself is still calc's, and the table deliberately records only
    the berry's *type* and never its fraction: applying the halving here as well
    would halve it twice. What the planner adds is knowing when it has been spent.
  - Spending it needs the type chart, since the berry only triggers on a
    super-effective hit of its own type — read from `calc.TYPE_CHART`, the same
    one Stealth Rock's Rock multiplier comes from.
  - Measured on Croagunk's Payapa Berry against a Psybeam: `72–88%` on the first
    hit and `KO` on the second, where both used to read `72–88%`.
  - The healing and curing berries had the same hole; it simply never showed,
    because none of those changes a damage figure.
- **Deliberately out, and the generator prints each one** so the omission is
  checked rather than assumed: Custap, Micle, Lansat and Starf, Leppa (PP),
  Enigma Berry, Chilan Berry (this game's data has an empty type for it), and
  everything probabilistic. What each of those would actually take is written up
  under **Later → The four items left out**; Custap is the one worth doing.
- **Three false matches were caught this way** and fixed in the rules rather than
  in the output: bag items like Potion and Lemonade matching the healing rule,
  the Choice items read as a +1 stage because the rule shrugged at "by 50%", and
  Enigma Berry stripped of its condition into an unconditional quarter-heal.

### Back to health

- **The level is editable on the card**, per slot, because a long fight changes
  it. Something that levels up on turn six of a gym leader has its stats move
  *that instant*, so a plan drawn at the level you walked in with quietly stops
  being true half way through — and the longer the fight, the more it matters,
  which is exactly backwards from how much attention it was getting.
  - **Stated, not derived.** Working it out would need experience yields, who
    actually participated, and the badge's level cap, and the answer would still
    be a guess about how the fight went. This is the same escape hatch the stat
    stages and the health get: you say it, and the arithmetic gives way.
  - **It carries down the line**, unlike the other seeds, because levelling up is
    not something that wears off. So it is written onto the *Pokémon's* record
    rather than the turn's, which also means it follows the Pokémon out of a
    switch and back, and leaves the other slots alone.
  - Applied before the health seed, since health is a share of a maximum the
    level decides — setting it after would measure the old bar and keep the
    number. Verified: Lv20 → Lv26 takes a Makuhita from 63 max HP to 78, and its
    Vital Throw from 38–48 to 56–68 on that turn and every turn below it.
  - Shown in the place the foe's `Lv.15` already sat, so both sides now read the
    same way, and it only stops looking like plain context once it has been
    corrected. Clearing it goes back to whatever the Box or the trainer's set
    says.
  - **Evolution is a different thing and needs nothing here**: this generation
    evolves *after* a battle, not during one, and a line already survives that on
    its own — slots are keyed by an identity that outlives the species change.
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
  acts on them. 27 are modelled: status and stat-drop protection, Intimidate,
  weather setters, trapping, Natural Cure, the absorb abilities, and the two that
  bill whoever touches their holder. Damage-only abilities are left to
  `@smogon/calc`, which already implements them.
  - **Rough Skin and Aftermath** come off the *attacker*, which is why neither was
    happening: everything else in the fold moves health on the target's side.
    Rough Skin takes an eighth for **every hit that made contact**, so a 2–5 hit
    move pays between two and five times — read across the same span the damage
    is. Aftermath takes a quarter, but only if the hit was fatal: certain when the
    whole band is gone, and on a band that straddles zero only the attacker's low
    end pays, since that is the run of rolls where anybody died.
    - Contact comes from the move's own `Contact` flag, the same way Protect's
      does — 150 of the 295 damaging moves carry it.
    - **Magic Guard pays neither**, as it pays no other indirect damage.
    - Charged **per target**, unlike recoil: a spread move into two Rough Skins is
      billed by both, which is the whole point of the ability.
    - Aftermath is called off by a **Damp** anywhere on the field. No trainer set
      in this game carries Damp, but a Box Pokémon can, so it is checked rather
      than assumed away.
    - The 30% contact abilities — Static, Effect Spore, Poison Point, Flame Body,
      Cute Charm — stay out, and land in the generator's unmatched report. A 30%
      paralysis is not something a plan may rest on.
- **Held items**, editable in place, writing straight back to the Box.
- **Trainer AI flags** in plain language, labelled per trainer when there are two.
- Platinum Kaizo's removal of self-inflicted stat drops (Superpower, Overheat,
  Psycho Boost, Draco Meteor, Leaf Storm) is flagged.

### Setting up a split

A fold-away panel in the sidebar with a button per split — the stretch of the
game between one gym leader and the next. One click makes a blank line for every
trainer in it, in the order they are fought.

Building those by hand is the tedious part of starting a run: the Byron split
alone is **69 fights**, and none of them can be planned until the line exists.
The button makes the shells; the thinking is still yours, which is the same line
the roadmap draws around generated lines.

- **Trainers you already have a line for are skipped**, so it is safe to press
  twice, and useful when you come back to a split you only half-planned. The
  count on each button is how many it would still make, and a split that is
  fully laid out shows a tick instead.
- **The line list is grouped by split and folded**, which is what makes the
  buttons usable at all: setting up Roark and Galactic is 133 lines, and flat
  that is a list you scroll past rather than read. Folded it is three rows and
  59px of sidebar.
  - Each group counts how many of its lines have any turns in them yet — `0/106`
    for one nobody has started — so how far through a split you are reads at a
    glance, and a line that has never been opened is dimmed.
  - Lines are ordered by the split rather than by when they were made, so the
    list reads like the run.
  - Which groups are open is remembered, and the group holding the line you are
    working on always opens, since a re-render shouldn't lose sight of where you
    are.
  - A trainer in no split — or a line made before the splits existed — lands in
    an **Other** group rather than disappearing.
- **`newLineId()` had to be made genuinely unique**, not merely unlikely to
  collide. Timestamp plus four random digits was fine one line at a time; seventy
  inside a millisecond is a birthday problem with about a **one in four** chance
  of two landing on the same id — which wouldn't error, it would silently
  overwrite one line with another. Verified by making 71 in one click and
  checking every id came out distinct.

**The split grouping is not in the game's data.** Nothing in `sets.js`,
`flags.js` or `party_order.js` knows what order trainers come in or where the
badges fall. It comes from the community's Platinum Kaizo reference sheet, which
`tools/gen-splits.js` reads — the one generator here that reaches across the
network rather than to a local file, so run it deliberately and check its report.

Getting the two to agree was the actual work. The sheet writes names for a person
reading them, and a raw match against `sets.js` was **24%**. Normalising gets it
to **420 fights with nothing unresolved**:

- Everything in brackets is a note to the reader — `(Right)`, `(DOUBLE)`,
  `(MULTI BATTLE WITH …)`, `(Gauntlet Start)*` — and none of it is the name.
- A find-and-replace in the sheet ate spaces, leaving `Galacticf Venus`,
  `CyclistFMegan`, `School KidfChristine`. Repaired by pattern rather than by a
  hand-written list, since it is regular.
- Class names it spells its own way: `Pkmn Breeder`, `Blackbelt`, `BirdKeeper`,
  `Pokekid`, `Picknicker`, `Leader CrasherWake`.
- **The two suffixes in `sets.js` mean opposite things**, which is the subtle
  one. `Galactic Mercury #1/#2/#3` are three separate fights and are consumed one
  per sighting as the splits are walked in order; `Pokémon Trainer Barry #2
  [Chimchar]` is one fight with three ways it can go, so all three are kept.
  Expanding both alike gave 591 fights for a game with 485 trainers.
- **Cyrus is the one the rules can't reach.** The sheet calls him "Leader Cyrus"
  throughout while the game data has four numbered teams. Byron's is #1; the
  Galactic split's is #2, settled by matching its party — Deoxys-Defense,
  Rampardos, Heatran, Registeel, Dusknoir, Regigigas — rather than by trusting
  the sheet's "(Trick Room)" label, which turns out to be a nickname for the team
  rather than a move any of them carries.
- **Tag partners are deliberately absent**: Dawn/Lucas, Cheryl, Marley, Riley and
  Mira are allies, not fights, and the planner already reads them from `flags.js`.
- **School Kid Harrison and Christine are in the sheet and not in the game data** —
  there are no School Kid trainers in `sets.js` at all. Listed as a known omission
  so the generator's report stays empty and a genuinely new mismatch stands out.

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

### Validation warnings

A count on the card, with the list on hover, and nothing louder. Absent entirely
when a turn is fine, so a clean line stays clean.

**Every check is a certainty, never a suspicion.** A warning that fires on a
maybe is worse than none at all — it trains you to ignore the ones that matter,
and half of what this planner tracks is deliberately uncertain. So nothing fires
on a roll going one way or the other, only on what can't be true however the
rolls fall. Nothing is ever corrected either: these are notes on your plan, which
is the same line the roadmap draws around generated lines.

- A Pokémon **dead in the Box**, or one **already fainted** on this branch still
  being given a move, or a move aimed at something that has already fainted.
- A move the Pokémon **no longer knows**, usually because the Box was edited.
  Compared by move *identity*, not by name: a set carries the game's own
  spelling and the dex carries its display name, so `Self-Destruct` and
  `Selfdestruct` are the same move. Matching on text reported every one of those
  as forgotten — a false positive found by running it against the sample line.
- A move that **fails outright**: Leech Seed into a Grass type, or a Fake Out
  that isn't its user's first turn. Both were already refused by the model and
  said nothing about it.
- An **occupied slot with no move chosen**, and the same Pokémon in both slots.
- A **branch the arithmetic rules out** — *You KO* where nothing on that side
  kills on any roll, or *You don't KO* where it kills on every one. Anything
  between the two is exactly what a branch is for, so it passes silently. Marked
  on the arrow as well as on the card, since the arrow is where you'd fix it.
- **Blind mode silences the damage-derived ones** and keeps the rest, so the
  warnings can't smuggle back the numbers the mode is there to hide.

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

## Next: history across attempts

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
- **Duplicate a turn onto the canvas**, rather than only out of its parent —
  dragging the nub already copies, but there is no way to copy a turn that isn't
  becoming a branch of it.
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
- **Level-cap awareness** — flag a Pokémon over the cap for that badge. This one
  is a validation warning too, and only left out because it needs badge data the
  planner doesn't read yet.
- **Canvas zoom** and keyboard shortcuts (add turn, delete, Esc to close).

### The charge turn, and the semi-invulnerable one

Not previously in this file at all — it lived only in the "How to use" page's
*not built yet* list, and the version there was **wrong about which moves it
covers**, which is the whole reason it belongs here now. Read off the game's own
move text rather than the base game's rules:

- **Only four moves charge**: SolarBeam (and it *skips the charge in sun*), Fly,
  Razor Wind and Shadow Force. The planner lands all four on the turn they are
  picked.
- **Platinum Kaizo rewrote the rest into one-turn moves**, so they need nothing:
  Dig is a plain 60 BP with "No additional effect", Dive 80, Sky Attack 120 with
  recoil, Bounce 85 with a paralysis chance. Hyper Beam and Giga Impact recoil
  instead of recharging. Skull Bash is deleted outright.
  - The old note named **Dig** as one of its three examples. It also wrote
    "Solar Beam" where this game spells it `SolarBeam` — the two-spellings trap,
    caught again.
- **Focus Punch is not one of these.** It charges at the start of the turn and
  attacks at the end of the *same* turn, failing if the user is hit first. One
  turn, at −3 priority. What it wants is the fail condition, not a charge turn.
- **The semi-invulnerable turn is the other half, and arguably the better half.**
  Fly and Shadow Force spend a turn out of reach, and **eleven moves carry text
  that exists solely to carve out the exception** — "Never misses, except if the
  target is in a semi-invulnerable turn": Swift, Aerial Ace, Aura Sphere, Shock
  Wave, Magical Leaf, Faint Attack, Vital Throw, Aurora Beam, Shadow Punch,
  Magnet Bomb and Dragon Pulse. A turn nothing lands on changes a plan more than
  a turn spent charging does.

Both halves are certainties, so both are modellable. The charge turn wants the
`pending` machinery Wish and Future Sight already use.

### The four items left out, and what each would need

All four are in the dex and all four are printed by `gen-item-effects.js` as
unmatched, so nothing here is a data problem — each one needs a subsystem the
planner doesn't have yet. Ordered by how much they'd be worth.

- **Custap Berry** — 32 trainer sets, easily the one worth doing. Below 25% HP
  the holder moves **first in its priority bracket** on its next move, which is a
  guaranteed Quick Claw. Two pieces: `turnOrder` already sorts a `last` flag for
  Stall, Lagging Tail and Full Incense, so the symmetric `first` is small; the
  awkward half is that the berry triggers at the *end* of a turn and pays out on
  the *next* one, so it wants the `pending` machinery Wish and Future Sight use
  rather than the two firing points the other items share. Note it would deny a
  move rather than merely reorder one, so it has to be a certainty — which it is,
  once the band is wholly under a quarter, exactly like the rest.
- **Micle Berry** — accuracy isn't tracked at all. Nothing in the planner reads
  or derives it, and a +20% on the next move only matters through a miss, which
  the planner deliberately leaves to the `skipped` toggle. Probably the one to
  leave alone: it would be the first thing to make an accuracy subsystem exist,
  for an effect the plan can't rest on anyway.
- **Lansat Berry** — crit ratio isn't tracked either. Crits are a *branch* here,
  not a probability, so a raised ratio has nothing to change: `You crit` already
  says it happened. It would be a card annotation at most.
- **Starf Berry** — a **random** stat by two stages, which the roadmap's own rule
  rules out. It could only ever be a hand-stated boost, and `boostSeed` already
  does that. Worth a line in the docs rather than any code.

Also worth remembering: **Enigma Berry** heals a quarter when hit by a
super-effective move. That is a real condition and a deterministic one — it is
out only because the item firing points ask "is the band under a threshold", and
this asks about the move that just landed. It would fit in `foldDamage` beside
the Focus Sash, which already works that way. No trainer carries it.

### What is still missing around switching

- **Nothing enforces that a phazed Pokémon is a legal choice**, beyond the picker
  offering the trainer's party — a fainted one is greyed out, but the planner
  won't stop a plan naming the same Pokémon twice across a fight.

### Lightning Rod and Storm Drain

Left for later, but they are now nearly free and worth doing before the list
above. This game's text for both is **"Forces \<type\> type single-target moves to
redirect to the user"** — which is Follow Me's mechanic, not an absorb, and Follow
Me's redirection already exists and already understands what "single-target"
means.

What it needs: a redirect keyed on the move's *type* rather than on a move having
been used, sourced from the ability instead of from `state.redirect`. The awkward
part is precedence — an ability redirect is passive and permanent while a Follow
Me is a turn's action, so the two can be up at once and one has to win. Worth
checking against the game before guessing which.

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
