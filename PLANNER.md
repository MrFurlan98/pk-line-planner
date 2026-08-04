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
- **One non-volatile status at a time**, which is what makes pre-statusing your
  own Pokémon a real tactic.
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

## Next

Model correctness is finished; what remains is either polish or additive.

The two big ones — **damage integration** and **auto-generated lines** — are
both unblocked now. Damage wants abilities and the slot shape, and it has both.
Auto-generation emits the same structures the manual builder uses, and the model
can now express switching, status that ends, and multi-battle formats.

Damage is the one to take first: it needs no further model work, and everything
below reads better with real numbers on the cards.

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

## The two big features

Both were held back until the model could carry them. It can now.

- **Damage integration** — KO chance, damage rolls, HP bars, speed order.
  `@smogon/calc` takes abilities, items, boosts, status and weather natively, and
  the planner already derives all of those, so this is mostly a matter of
  assembling a `Pokemon` and a `Field` per slot and reading the result back.
- **Auto-generated lines** ("risky" / "safe"). Emits the same structures the
  manual builder uses, so it inherits whatever the model can express — which now
  includes switching, status that ends, and the multi-battle formats. Wants
  damage first, since scoring a line means comparing outcomes.
