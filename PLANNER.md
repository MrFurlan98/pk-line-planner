# Line Planner — roadmap

A visual planner for a single trainer fight: which Pokémon leads, what it does
each turn, and how the plan branches when the fight doesn't go to script.

Lives in the **Planner** tab. Source: `src/js/planner-model.js` (state and
persistence), `src/js/planner-controls.js` (UI), `src/css/planner.css`,
`src/js/data/games.js` (per-game adapter), `src/js/data/move_effects.js`
(generated — see `tools/gen-move-effects.js`).

---

## Built

- **Turns as nodes**, dragged into place, joined by labelled arrows.
- **Both movesets on the card**, side by side; pick your move and the one you're
  planning around from theirs. Collapsible per turn, or all at once.
- **Directional branch conditions** — You KO / They KO you, You miss / They miss,
  crit, crit KO, sacrifice, they switch, they set up, plus custom labels.
  Several branches can join the same pair of turns.
- **Persistent fight state**, derived by walking back up the graph, never stored:
  stat boosts, entry hazards, screens, weather, and status.
  - Status is per-Pokémon: cleared boosts and volatiles on a switch, but a
    non-volatile status follows the Pokémon and returns with it.
  - Non-volatile statuses are mutually exclusive, which is what makes
    pre-statusing your own Pokémon (Rest, Magic Guard + poison) work as a way to
    lock the AI out of something worse.
  - Turns reachable by more than one branch are flagged "mixed state".
- **Trainer AI flags** surfaced with plain-language hints, since they decide how
  much branching a fight actually needs.
- **Team and box** with drag-and-drop: onto a turn, onto another Pokémon to swap,
  or onto empty canvas to start a new turn. Box paginates 6×5.
- **Held items** editable straight from the team card.
- **Folding**: move pickers, the team/box strip, and whole subtrees. Subtree
  folding only hides what is reachable *exclusively* through the folded turn, so
  convergent branches don't vanish.
- Platinum Kaizo's removal of self-inflicted stat drops (Superpower, Overheat,
  Psycho Boost, Draco Meteor, Leaf Storm) is flagged on the card.

---

## Next: model correctness

These come first because **auto-generation emits the same structures the manual
builder uses** — anything the model can't express, a generated line can't
express either. They also get more expensive to add later, since every line
built meanwhile bakes in the current assumptions.

Items 1–4 are small and independent. Item 5 is the large one, and the ordering
is deliberate: it changes the node shape, so anything built against the current
one-active-per-side model would need reworking afterwards.

### 1. Stable Pokémon identity

Nodes reference a Pokémon by its box key, `"Species (Nickname)"`. That key
changes when it evolves, and `addToDex` deletes the old entry when it re-keys
(`src/js/moveset_import.js`), so every node pointing at it silently degrades to
"Pick a Pokémon".

`set.data.id` already exists and is stable — `<PID>-<IVs>-<met level>`, all
immutable for the life of a Pokémon, and already used to match across evolution.
Nodes should use it when present and fall back to the species+nickname key when
it isn't (hand-made box entries leave it empty).

### 2. Switching as a first-class action

Half-modelled today: selectable in the turn editor, invisible on the card, and
it doesn't represent taking a free hit on the switch turn. Any generated line
will switch constantly.

### 3. Status wearing off

Sleep lasts a few turns, freeze thaws, Lum Berry cures on contact. A status
currently persists for the whole line, so a plan can be built on a Pokémon that
is still "asleep" ten turns later.

### 4. Abilities on the card

Not shown anywhere, for either side. In Kaizo this matters constantly — Roark's
Cranidos has Rock Head, so Head Smash costs it nothing; his Corsola and Lileep
have Solid Rock. Damage numbers will be wrong without it, and move choice would
be too.

### 5. Multi-battle formats

**38.4% of trainers are involved in one — 190 of 495.** Not a corner case, and
not one format but three, all already described in `src/js/data/flags.js` under
`battleType`:

| Key | What it is | Count |
| --- | --- | --- |
| `double` | Two trainers fought at once (1v1 and 1v2) | 32 pairings |
| `trueDouble` | A genuine 2v2 against one trainer | 36 |
| `tag` | You fight alongside an AI partner | 39 |

139 trainers additionally carry the `TagStrategy` AI flag, which marks partner
coordination. Major fights are included, not just route trainers: **Leader
Volkner**, **Galactic Boss Cyrus #3**, all three Commanders (Mars, Jupiter,
Saturn), and **Barry at Spear Pillar**.

The model is 1v1 throughout — one `mon` and one `foe` per turn — so this reaches
into the node shape, the card layout, state derivation (spread moves, a partner
applying status or screens) and the branch conditions ("they KO your partner").

**This belongs before damage and auto-generation, not after.** Damage
integration built against a one-active-per-side node would have to be reworked
to add a second slot, so doing it in the other order pays for the same work
twice. Auto-generation simply cannot address 38% of the game without it.

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

---

## Later

- **Type effectiveness per move** on the card. The type chart is already loaded,
  so this is nearly free, and it isn't damage calc — just the matchup.
- **Validation warnings**: no move set on a turn, the Pokémon is dead, the move
  is no longer in its set.
- **Level-cap awareness** — flag a Pokémon over the cap for that badge.
- **Canvas zoom** and keyboard shortcuts (add turn, delete, Esc to close).

---

## Deferred deliberately

Both of these sit on top of the model work above, so they come after all of it.

- **Damage integration** — KO chance, damage rolls, HP bars, speed order. Wants
  abilities (4) and the multi-battle node shape (5) first; boosts, hazards and
  status are already in place to feed it.
- **Auto-generated lines** ("risky" / "safe"). Emits the same structures the
  manual builder uses, so it inherits every limitation the model still has.
