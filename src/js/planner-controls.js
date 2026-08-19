/*
 * Line planner UI.
 *
 * Renders the trainer's party alongside a canvas of turn nodes joined by
 * labelled arrows. Nodes are dragged into place by hand; the arrows route
 * themselves.
 */

var CURRENT_LINE = "";
var DRAG = null;
var CONNECTING = null;
var EDITING_NODE = "";
// Pokémon being dragged out of one of the party strips into the canvas.
var MON_DRAG = null;
// A card drag finishes with a click, which would otherwise open the slot picker.
var SUPPRESS_SLOT_CLICK = false;

/*
 * The party strips take a good third of the panel, so they fold away when the
 * canvas needs the room. Remembered, since it's a working preference rather
 * than something to re-set on every visit.
 */
function partiesOpen() {
    return localStorage.plannerPartiesOpen !== "false";
}

function applyPartiesFold() {
    var open = partiesOpen();
    $(".planner-party-row").toggleClass("hide", !open);
    $(".planner-ai-flags").toggleClass("hide", !open);
    $("#planner-toggle-parties")
        .toggleClass("folded", !open)
        .attr("title", open
            ? "Hide the teams and box, to give the canvas more room"
            : "Show the teams and box");
}

/*
 * Blind mode's button. Marked `active` rather than `folded` because it is a way
 * of working rather than something collapsed away, and it is worth being obvious:
 * a card with no numbers on it should never leave you wondering whether the
 * planner is being coy or simply hasn't worked them out.
 */
function applyBlindMode() {
    var blind = blindMode();
    $("#planner-toggle-blind")
        .toggleClass("active", blind)
        .attr("title", blind
            ? "Blind mode is on: base power instead of damage, no health bars, no speed. Click to show the numbers again."
            : "Blind mode: hide damage, health and speed, and work the fight out yourself. Moves go back to showing base power.");
}

function currentLine() {
    return LINES[CURRENT_LINE];
}

/* ---------------------------------------------------------------- line list */

function renderLineList() {
    var list = $(".planner-line-list").empty();
    var ids = Object.keys(LINES);
    if (!ids.length) {
        list.append(`<li class="planner-empty">No lines yet.</li>`);
    }
    for (var i in ids) {
        var line = LINES[ids[i]];
        list.append(
            `<li class="planner-line-item${line.id === CURRENT_LINE ? " selected" : ""}" data-line="${line.id}">
                <span class="planner-line-name">${line.name}</span>
                <button class="planner-delete-line" title="Delete this line">&times;</button>
            </li>`);
    }

    $(".planner-line-item").on("click", function(e) {
        if ($(e.target).hasClass("planner-delete-line")) return;
        selectLine($(this).attr("data-line"));
    });
    $(".planner-delete-line").on("click", function() {
        var id = $(this).closest(".planner-line-item").attr("data-line");
        if (!confirm(`Delete the line for ${LINES[id].name}?`)) return;
        deleteLine(id);
        if (CURRENT_LINE === id) CURRENT_LINE = "";
        renderLineList();
        renderLine();
    });

    // The split counts are "how many you still don't have", so they move with it.
    renderSplitList();
}

function selectLine(id) {
    CURRENT_LINE = id;
    renderLineList();
    renderLine();
}

/* -------------------------------------------------------------- quick setup */

/*
 * A blank line for every trainer in a split - the stretch of the game between
 * one gym leader and the next.
 *
 * Building them one at a time is the tedious part of starting a run: the Byron
 * split alone is 69 fights, and none of them can be planned until it exists. The
 * button makes the shell; the thinking is still yours.
 *
 * Trainers you already have a line for are left alone rather than duplicated, so
 * the button is safe to press twice and useful when a split grows a fight you
 * skipped the first time round.
 */
function renderSplitList() {
    var list = $(".planner-split-list").empty();
    if (typeof SPLITS_PK === "undefined") {
        list.append(`<span class="planner-empty">No split data loaded.</span>`);
        return;
    }
    var planned = {};
    Object.values(LINES).forEach(function(line) { planned[line.trainer] = true; });

    SPLITS_PK.forEach(function(split) {
        var todo = split.trainers.filter(function(t) { return !planned[t]; });
        list.append(
            `<button class="planner-split-btn${todo.length ? "" : " done"}"
                     data-split="${escapeAttr(split.name)}"
                     title="${escapeAttr(todo.length
                        ? `Create ${todo.length} blank line${todo.length === 1 ? "" : "s"} — every trainer in the ${split.name} split you don't already have one for.`
                        : `Every trainer in the ${split.name} split already has a line.`)}">
                <span class="planner-split-name">${split.name}</span>
                <span class="planner-split-count">${todo.length || "✓"}</span>
            </button>`);
    });
}

function setUpSplit(name) {
    var split = (typeof SPLITS_PK === "undefined" ? [] : SPLITS_PK)
        .find(function(s) { return s.name === name; });
    if (!split) return;

    var planned = {};
    Object.values(LINES).forEach(function(line) { planned[line.trainer] = true; });
    var todo = split.trainers.filter(function(t) { return !planned[t]; });
    if (!todo.length) return;

    if (!confirm(`Create ${todo.length} blank line${todo.length === 1 ? "" : "s"} for the ${name} split?`)) return;

    /*
     * In the order they are fought, so the list reads like the run. The first one
     * is selected afterwards, since that is the fight you are about to plan.
     */
    var first = "";
    todo.forEach(function(trainer) {
        var line = newLine(trainer);
        addLine(line);
        if (!first) first = line.id;
    });
    saveLines();
    renderSplitList();
    if (first) selectLine(first);
    else { renderLineList(); renderLine(); }
}

/* -------------------------------------------------------------- foe display */

/*
 * Every party in the fight, not just the one whose name is on the line. A tag
 * or two-trainer battle has two opposing trainers, and a tag battle adds an
 * ally whose Pokémon fill your second slot - none of which can be planned
 * around if they aren't shown.
 */
function renderFoeParty() {
    var strip = $(".planner-foe-party").empty();
    var line = currentLine();
    if (!line) return;
    var format = battleFormat(line.trainer);

    format.trainers.forEach(function(trainer, index) {
        // Only worth naming when there is more than one of them.
        if (format.trainers.length > 1) {
            strip.append(`<span class="planner-party-owner">${trainer}</span>`);
        }
        renderTrainerParty(strip, trainer, "planner-foe", "data-foe", index);
    });

    var partnerBlock = $(".planner-partner-block");
    if (format.partner) {
        partnerBlock.removeClass("hide");
        $(".planner-partner-name").text(format.partner);
        renderTrainerParty($(".planner-partner-party").empty(), format.partner,
            "planner-partner-mon", "data-partner", 0);
    } else {
        partnerBlock.addClass("hide");
        $(".planner-partner-party").empty();
    }

    renderAiFlags(format);
}

function renderTrainerParty(strip, trainer, cls, attr, ownerIndex) {
    var setdex = GAME.setdex();
    var party = GAME.partyOrder()[trainer] || [];
    party.forEach(function(speciesName) {
        var species = GAME.species()[toID(speciesName)];
        if (!species) return;
        var set = setdex[speciesName] && setdex[speciesName][trainer];
        var item = set && set.item ? ITEMS[toID(set.item)] : null;
        strip.append(
            `<span class="${cls} planner-card" ${attr}="${speciesName}" data-owner="${ownerIndex}"
                   title="${speciesName} - ${trainer}">
                <img class="planner-card-sprite" src="${GAME.sprites.species(species)}" alt="${speciesName}">
                <span class="planner-card-name">${species.name}</span>
                <span class="planner-card-meta">${set ? `Lv. ${set.level}` : ""}</span>
                ${renderCardAbility(set ? set.ability : "")}
                ${renderCardItem(item)}
            </span>`);
    });
}

/*
 * AI flags decide how much branching a fight actually needs, so they sit beside
 * the parties. With two opposing trainers each set is labelled, since they can
 * differ.
 */
function renderAiFlags(format) {
    var badges = $(".planner-ai-flags").empty();
    format.trainers.forEach(function(trainer) {
        var flags = GAME.aiFlags()[trainer];
        if (!flags) return;
        var active = Object.keys(flags).filter(x => flags[x]);
        if (!active.length) return;
        badges.append(`<span class="planner-flag-label">${format.trainers.length > 1 ? trainer : "AI"}:</span>`);
        active.forEach(function(flag) {
            badges.append(`<span class="planner-flag" title="${aiFlagHint(flag)}">${flag}</span>`);
        });
    });
}

/*
 * Your roster, mirroring the opposing party strip. Picking a Pokémon here and
 * then clicking a turn drops it in, which beats opening the turn editor and
 * hunting through a dropdown every time you reshuffle a plan.
 */
function renderTeamStrip() {
    if (!boxRoster().length) {
        $(".planner-your-party").empty().append(
            `<span class="planner-party-empty">Nothing in the Box yet - add your caught Pokémon on the Box tab.</span>`);
        $(".planner-box-party").empty();
        $(".planner-box-block").addClass("hide");
        return;
    }

    renderMonStrip($(".planner-your-party"), teamRoster(),
        "Drag onto a turn, onto another team member to swap, or into the box to bench it", false);
    renderBoxPage();
}

// How many Pokémon fit in one box - a 6x5 grid.
const BOX_COLUMNS = 6;
const BOX_ROWS = 5;
const BOX_CAPACITY = BOX_COLUMNS * BOX_ROWS;
var BOX_PAGE = 0;

/*
 * The bench, paged into fixed-size boxes. The grid always renders a full set of
 * slots so it keeps its shape as Pokémon come and go, and fills from the top
 * left rather than centring.
 */
function renderBoxPage() {
    var bench = benchRoster();
    var pages = Math.max(1, Math.ceil(bench.length / BOX_CAPACITY));
    if (BOX_PAGE >= pages) BOX_PAGE = pages - 1;
    if (BOX_PAGE < 0) BOX_PAGE = 0;

    $(".planner-box-block").toggleClass("hide", !bench.length);
    $(".planner-box-title").text(pages > 1 ? `Box ${BOX_PAGE + 1} / ${pages}` : "Box");
    $(".planner-box-prev").prop("disabled", BOX_PAGE === 0);
    $(".planner-box-next").prop("disabled", BOX_PAGE >= pages - 1);

    var page = bench.slice(BOX_PAGE * BOX_CAPACITY, (BOX_PAGE + 1) * BOX_CAPACITY);
    var strip = $(".planner-box-party").empty();

    for (var i = 0; i < BOX_CAPACITY; i++) {
        var entry = page[i];
        if (!entry) {
            strip.append(`<span class="planner-box-slot empty"></span>`);
            continue;
        }
        var species = GAME.species()[toID(entry.species)];
        if (!species) {
            strip.append(`<span class="planner-box-slot empty"></span>`);
            continue;
        }
        var level = entry.set.level ?? 100;
        strip.append(
            `<span class="planner-box-slot planner-mine compact${entry.dead ? " dead" : ""}"
                   data-mon="${entry.ref}"
                   title="${entry.nickname || species.name} - ${species.name}, Lv. ${level}${entry.dead ? ", fainted" : ""}. Drag onto a team member to swap it in, or straight onto a turn">
                <img class="planner-mine-icon" src="${GAME.sprites.speciesIcon(species)}" alt="${entry.species}">
            </span>`);
    }
}

function renderMonStrip(strip, roster, hint, compact) {
    strip.empty();
    if (!roster.length) {
        strip.append(`<span class="planner-party-empty">Empty - drag a Pokémon here.</span>`);
        return;
    }
    roster.forEach(function(entry) {
        var species = GAME.species()[toID(entry.species)];
        if (!species) return;
        var level = entry.set.level ?? 100;
        var title = `${entry.nickname || species.name} - ${species.name}, Lv. ${level}${entry.dead ? ", fainted" : ""}. ${hint}`;
        if (compact) {
            strip.append(
                `<span class="planner-mine compact${entry.dead ? " dead" : ""}" data-mon="${entry.ref}" title="${title}">
                    <img class="planner-mine-icon" src="${GAME.sprites.speciesIcon(species)}" alt="${entry.species}">
                </span>`);
            return;
        }
        var item = entry.set.item ? ITEMS[toID(entry.set.item)] : null;
        strip.append(
            `<span class="planner-mine planner-card${entry.dead ? " dead" : ""}" data-mon="${entry.ref}" title="${title}">
                <img class="planner-card-sprite" src="${GAME.sprites.species(species)}" alt="${entry.species}">
                <span class="planner-card-name">${entry.nickname || species.name}</span>
                <span class="planner-card-meta">Lv. ${level}</span>
                ${renderCardAbility(entry.set.ability)}
                ${renderCardItem(item, true)}
            </span>`);
    });
}

/*
 * Always rendered, even with nothing held, so a card without an item is the
 * same height as one with - otherwise the two party rows don't line up.
 *
 * Your own cards are editable; the opposing party comes from the game's own
 * trainer data, so there's nothing meaningful to change there.
 */
/*
 * Abilities decide plans constantly here - Rock Head means Head Smash costs
 * Cranidos nothing, Hyper Cutter means Intimidate does nothing to your Luxio -
 * so the name sits on the card with its full description behind a hover.
 */
function renderCardAbility(abilityName) {
    if (!abilityName) return `<span class="planner-card-ability empty"></span>`;
    var ability = ABILITIES[toID(abilityName)];
    var name = ability ? ability.name : abilityName;
    var text = ability && ability.desc ? String(ability.desc.battle || "") : "";
    var known = abilityEffect(abilityName);
    return `<span class="planner-card-ability${known ? " tracked" : ""}" title="${name}${text ? " - " + text.replace(/"/g, "'") : ""}">${name}</span>`;
}

function renderCardItem(item, editable) {
    var cls = `planner-card-item${editable ? " editable" : ""}`;
    if (!item) {
        return `<span class="${cls} empty">${editable ? `<span class="planner-item-add">+ item</span>` : ``}</span>`;
    }
    return `<span class="${cls}"><img src="${GAME.sprites.item(item)}" alt=""> ${item.name}</span>`;
}

// Plain-language note on what each flag means for planning a line.
function aiFlagHint(flag) {
    switch (flag) {
        case "Setup": return "Will use stat-boosting moves - expect a free turn, or a sweep if you give it one.";
        case "Risky": return "Will gamble on low-accuracy or high-roll plays. Plan a miss branch.";
        case "CheckHP": return "Switches out when low. Plan for the switch rather than a clean KO.";
        case "DamagePriority": return "Favours priority moves. Check whether your low-HP branches survive.";
        case "BatonPass": return "Will pass boosts along. Killing the passer early matters.";
        case "Weather": return "Will set weather. Damage numbers shift once it's up.";
        case "Harassment": return "Uses status and disruption rather than damage.";
        case "TagStrategy": return "Coordinates with a partner in a double battle.";
        case "Expert": return "Picks the strongest move rather than a random one.";
        case "EvaluateAttack": return "Accounts for type matchups when choosing a move.";
        case "Basic": return "Avoids obviously bad moves.";
        default: return flag;
    }
}

/* ------------------------------------------------------------------- canvas */

function renderLine() {
    var line = currentLine();
    $(".planner-canvas-nodes").empty();
    $(".planner-canvas-edges").empty();

    if (!line) {
        $(".planner-workspace").addClass("hide");
        $(".planner-placeholder").removeClass("hide");
        return;
    }
    $(".planner-workspace").removeClass("hide");
    $(".planner-placeholder").addClass("hide");
    $(".planner-trainer-name").text(line.trainer);

    renderFoeParty();
    renderTeamStrip();
    // Re-applied because both strips are rebuilt above.
    applyPartiesFold();

    /*
     * Every turn's state, computed once and parents-first. Cleared and rebuilt on
     * every render, so nothing here can outlive the plan it came from.
     */
    warmNodeStates(line);

    var visible = visibleNodes(line);
    for (var id in line.nodes) {
        if (visible[id]) renderNode(line.nodes[id], line, visible);
    }
    renderEdges(visible);
}

function renderNode(node, line, visible) {
    line = line || currentLine();
    var state = computeNodeState(line, node.id);
    var slots = slotCount(line);
    var format = battleFormat(line.trainer);
    /*
     * What the turn actually does with each slot's move: which lose it to being
     * outsped, flinched or Protected against, where a Follow Me sends the rest,
     * and who is guarding. Worked out by running the turn against a throwaway
     * copy of the state, so the card can't claim something the fold won't do.
     */
    var report = turnReport(line, node, state);
    var anyDead = false;
    for (var i = 0; i < slots; i++) {
        var entry = monAt(node, "you", i) ? boxEntry(monAt(node, "you", i)) : null;
        if (entry && entry.dead) anyDead = true;
    }

    $(".planner-canvas-nodes").append(
        `<div class="planner-node${slots > 1 ? " doubles" : ""}${anyDead ? " dead" : ""}${node.collapsed ? " has-folded" : ""}"
              data-node="${node.id}" style="left: ${node.x}px; top: ${node.y}px;">
            ${renderStateBar(state)}
            <div class="planner-node-head">
                <span class="planner-slots">${renderSlots(line, node, state, "you", slots, format)}</span>
                <span class="planner-node-vs">vs</span>
                <span class="planner-slots">${renderSlots(line, node, state, "them", slots, format)}</span>
            </div>
            ${renderStatusBlock(line, node, state)}
            ${renderMovePickers(line, node, state, slots, format, report)}
            ${node.note ? `<div class="planner-node-note">${node.note}</div>` : ``}
            <div class="planner-node-buttons">
                ${renderWarnings(line, node, state, report)}
                ${renderFoldControl(node, line, visible)}
                <button class="planner-edit-node btn planner-btn small">Edit</button>
                <button class="planner-remove-node btn planner-btn small">Remove</button>
            </div>
            <div class="planner-node-handle" title="Drag onto another turn to branch to it, or onto empty space for a copy of this one"></div>
        </div>`);
}

/*
 * One column per Pokemon out on a side. In a tag battle your second slot is the
 * AI partner: still settable, since a plan has to assume something about it,
 * but marked so it never reads as an instruction you control.
 */
/*
 * Who moves first, shown against the slot.
 *
 * Priority bracket beats speed, and Platinum Kaizo rebalanced the brackets, so a
 * slot can be first while being slower - which is worth saying rather than
 * leaving to be inferred from two numbers. A tie is called a tie: it is genuinely
 * random, and no plan should rest on it.
 */
function renderSpeed(line, node, state, side, slot, slots) {
    if (typeof speedFor !== "function" || blindMode()) return "";
    if (!monAt(node, side, slot)) return "";

    var other = side === "you" ? "them" : "you";
    var against = monAt(node, other, slot) ? slot : (monAt(node, other, 0) ? 0 : 1);
    if (!monAt(node, other, against)) return "";

    var mine = speedFor(line, node, state, side, slot);
    var theirs = speedFor(line, node, state, other, against);
    if (!mine || !theirs) return "";

    var myPrio = movePriority(moveAt(node, side, slot));
    var theirPrio = movePriority(moveAt(node, other, against));

    // Under Trick Room the slower one goes first - but only within a bracket.
    var reversed = !!state.trickRoom;
    var faster = myPrio !== theirPrio
        ? myPrio > theirPrio
        : (reversed ? mine < theirs : mine > theirs);
    var tied = myPrio === theirPrio && mine === theirs;
    var byPriority = myPrio !== theirPrio;

    var hint = `Speed ${mine} against ${theirs}` +
        (byPriority ? `, but the brackets decide it: priority ${myPrio > 0 ? "+" : ""}${myPrio} against ${theirPrio > 0 ? "+" : ""}${theirPrio}.` : ".") +
        (reversed && !byPriority ? " Trick Room is up, so the slower one moves first." : "") +
        (tied ? " A tie is settled at random, so don't build the plan on it." : "");

    if (tied) return `<span class="planner-speed tie" title="${escapeAttr(hint)}">= SPD</span>`;
    return `<span class="planner-speed ${faster ? "fast" : "slow"}" title="${escapeAttr(hint)}">${
        faster ? "&#9650;" : "&#9660;"} ${byPriority ? "PRI" : "SPD"}</span>`;
}

function renderSlots(line, node, state, side, slots, format) {
    var out = "";
    for (var i = 0; i < slots; i++) {
        var ref = monAt(node, side, i);
        var isPartner = side === "you" && i === 1 && format.id === "tag";
        var species = null;
        var label = "";
        var sub = "";

        if (side === "you" && !isPartner) {
            var entry = ref ? boxEntry(ref) : null;
            species = entry ? GAME.species()[toID(entry.species)] : null;
            label = entry ? (entry.nickname || entry.species) : "Pick a Pokémon";
        } else if (isPartner) {
            // The partner's Pokemon come from their party, not your Box.
            species = ref ? GAME.species()[toID(ref)] : null;
            var pset = trainerSet(trainerForSlot(line, "you", i), ref);
            label = species ? species.name : "Partner";
            sub = pset ? ` <em>Lv.${pset.level}</em>` : "";
        } else {
            species = ref ? GAME.species()[toID(ref)] : null;
            var set = foeSetFor(line, node, ref);
            label = species ? species.name : "any";
            sub = set ? ` <em>Lv.${set.level}</em>` : "";
        }

        var mon = slotState(line, node, state, side, i);
        var trapped = trapReason(line, node, state, side, i);
        out += `<span class="planner-slot${side === "them" ? " foe" : ""}${isPartner ? " ai" : ""}${!ref ? " empty" : ""}"
                      data-side="${side}" data-slot="${i}">
            ${species
                ? `<img class="planner-sprite" src="${GAME.sprites.species(species)}" alt="">`
                : `<span class="planner-node-blank">?</span>`}
            <span class="planner-slot-name">${label}${sub}</span>
            ${ref ? renderHp(mon) : ``}
            ${ref ? renderItemTrigger(line, node, state, side, i) : ``}
            ${ref ? renderSpeed(line, node, state, side, i, slots) : ``}
            ${renderStatus(mon, trapped)}
            ${renderBoosts(mon.boosts)}
            <span class="planner-chosen">${slotActionText(line, node, side, i, isPartner)}</span>
        </span>`;
    }
    return out;
}

/*
 * What is wrong with this turn, if anything.
 *
 * A count and a list on hover rather than anything louder: these are notes on
 * your plan, and every one of them is something you may have meant. Nothing is
 * corrected and nothing is blocked - the card simply says what it noticed.
 *
 * Absent entirely when the turn is fine, so a clean line stays clean.
 */
function renderWarnings(line, node, state, report) {
    var warnings = validateNode(line, node, state, report);

    // A branch out of this turn that the arithmetic rules out belongs here too:
    // it is this turn's moves that make the condition impossible.
    childEdges(line, node.id).forEach(function(edge) {
        var problem = validateEdge(line, edge);
        if (problem) warnings.push({text: problem});
    });

    /*
     * A move that switches its own user out, on a turn that leaves the same
     * Pokémon standing there afterwards. U-turn and Baton Pass don't offer this
     * as a choice - the switch is the move - so a plan that keeps it out is one
     * the game refuses, which is exactly the bar these warnings are held to.
     *
     * Checked against the turns that follow rather than this one, because that is
     * where the switch shows: the planner reads a changed slot as the switch, and
     * an *unchanged* one as the plan saying nobody left.
     */
    var slots = slotCount(line);
    ["you", "them"].forEach(function(side) {
        for (var slot = 0; slot < slots; slot++) {
            var ref = monAt(node, side, slot);
            var move = findMove(moveAt(node, side, slot));
            if (!ref || !move || !switchesUserOut(move.name)) continue;
            if (!actedAt(node, side, slot)) continue;
            if (switchTargetAt(node, side, slot)) continue;
            if (switchAfterAt(node, side, slot)) continue;
            var who = speciesAt(line, node, side, slot);
            warnings.push({text: `${(who && who.name) || ref} leaves the field after ${move.name}, ` +
                `and nobody is set to come in — say who with the arrow button under its moves.`});
        }
    });

    if (!warnings.length) return "";
    var list = warnings.map(function(w) { return "• " + w.text; }).join("\n");
    return `<button class="planner-warn-badge" title="${escapeAttr(
        (warnings.length === 1 ? "One thing worth checking on this turn:" : warnings.length + " things worth checking on this turn:")
        + "\n\n" + list)
    }">&#9888; ${warnings.length}</button>`;
}

/*
 * Fold control for everything downstream. Only shown when there is something to
 * fold, and the count reflects what is actually hidden - a turn still reachable
 * by another branch doesn't disappear and isn't counted.
 */
function renderFoldControl(node, line, visible) {
    if (!visible || !childEdges(line, node.id).length) return "";
    if (!node.collapsed) {
        return `<button class="planner-fold-node btn planner-btn small" title="Fold away the turns that follow this one">Fold</button>`;
    }
    var hidden = hiddenBehind(line, node.id, visible);
    return `<button class="planner-fold-node folded btn planner-btn small" title="Show the turns that follow this one">${hidden} hidden</button>`;
}

/*
 * Both movesets side by side, so a turn is picked by comparing what you can do
 * against what's coming back. Collapses once the turn is decided, which is what
 * keeps a long line readable.
 */
function renderMovePickers(line, node, state, slots, format, report) {
    if (!node.movesOpen) {
        return `<div class="planner-moves collapsed"><button class="planner-moves-toggle" title="Show the movesets">Moves</button></div>`;
    }

    /*
     * Yours on the left, theirs on the right, always - so a move is read across
     * the middle against what it's up against. In a double each side stacks its
     * two Pokémon vertically inside its own column, which keeps that left/right
     * comparison intact instead of interleaving the two sides.
     */
    var columns = ["you", "them"].map(function(side) {
        var stack = "";
        for (var i = 0; i < slots; i++) stack += renderSlotPicker(line, node, state, side, i, format, report);
        return `<div class="planner-move-side ${side}">${stack}</div>`;
    }).join("");

    return `<div class="planner-moves">
        <button class="planner-moves-toggle open" title="Hide the movesets">Moves</button>
        <div class="planner-move-columns">${columns}</div>
    </div>`;
}

function renderSlotPicker(line, node, state, side, slot, format, report) {
    var ref = monAt(node, side, slot);
    var isPartner = side === "you" && slot === 1 && format.id === "tag";
    var moves = [];
    var title;

    if (side === "you" && !isPartner) {
        var entry = ref ? boxEntry(ref) : null;
        moves = entry && entry.set.moves ? entry.set.moves : [];
        title = entry ? (entry.nickname || entry.species) : "Yours";
    } else if (isPartner) {
        var pset = trainerSet(trainerForSlot(line, "you", slot), ref);
        moves = pset && pset.moves ? pset.moves : [];
        title = ref ? (GAME.species()[toID(ref)] || {}).name || ref : "Partner";
    } else {
        var set = foeSetFor(line, node, ref);
        moves = set && set.moves ? set.moves : [];
        title = ref ? (GAME.species()[toID(ref)] || {}).name || ref : "Theirs";
    }

    var switching = switchTargetAt(node, side, slot);
    /*
     * A trapped slot cannot switch, so the button says so rather than letting a
     * plan be built on a move the game will refuse. Still clickable when a
     * switch is already set there, so an now-illegal one can be cleared.
     */
    var trap = trapReason(line, node, state, side, slot);
    return `<div class="planner-move-column${isPartner ? " ai" : ""}" data-side="${side}" data-slot="${slot}">
        <span class="planner-move-column-title">${title}${isPartner ? " (AI)" : ""}</span>
        ${renderMoveList(line, node, state, moves, moveAt(node, side, slot), side, slot, report)}
        ${renderAimPicker(line, node, side, slot, format, report)}
        ${renderSelfSwitch(line, node, side, slot)}
        <button class="planner-switch-btn${side === "them" ? " them" : ""}${switching ? " active" : ""}${trap && !switching ? " trapped" : ""}"
                data-side="${side}" data-slot="${slot}"
                title="${trap ? trapHint(trap) : "Switch instead of attacking. The turn is given up, so whoever comes in takes the hit."}">&#8646; ${trap ? "Trapped" : "Switch"}</button>
    </div>`;
}

/*
 * Who comes in behind a U-turn or a Baton Pass.
 *
 * Only shown when the chosen move is one of those, because it is the only time
 * the question exists - and it is a different question from the Switch button
 * next to it. That one is "switch *instead* of attacking"; this one is "the move
 * already happened, and it has taken this Pokémon off the field."
 */
function renderSelfSwitch(line, node, side, slot) {
    if (switchTargetAt(node, side, slot)) return "";

    var move = moveAt(node, side, slot);
    var own = switchesUserOut(move);
    // Being dragged out by the other side's Roar asks the same question.
    var blown = own ? null : phazedInto(node, side, slot, slotCount(line));
    if (!own && !blown) return "";

    var incoming = switchAfterAt(node, side, slot);
    var name = "";
    if (incoming) {
        if (side === "you" && !isPartnerSlot(line, side, slot)) {
            var entry = boxEntry(incoming);
            name = entry ? (entry.nickname || entry.species) : incoming;
        } else {
            name = (GAME.species()[toID(incoming)] || {}).name || incoming;
        }
    }

    var cause = own ? findMove(move).name : findMove(moveAt(node, side === "you" ? "them" : "you", blown.by)).name;
    var hint;
    if (own) {
        hint = incoming
            ? `${cause} takes this Pokémon off the field and brings ${name} in. Click to change who.`
            : `${cause} switches its user out — it isn't optional. Click to say who comes in, or the plan keeps a Pokémon out that the game has already removed.`;
    } else {
        hint = incoming
            ? `${cause} drags this Pokémon out and ${name} in. The game picks at random, so this is you recording which one it was. Click to change it.`
            : `${cause} drags this Pokémon off the field. Which one replaces it is random, so the planner won't guess — click to say who it was.`;
    }

    return `<button class="planner-selfswitch-btn${side === "them" ? " them" : ""}${incoming ? " active" : " unset"}${own ? "" : " forced"}"
                    data-side="${side}" data-slot="${slot}"
                    title="${escapeAttr(hint)}">${own ? "&#8594;" : "&#8598;"} ${incoming ? name : "who comes in?"}</button>`;
}

/*
 * Which of the two opposing Pokémon this slot is attacking.
 *
 * Only ever shown in a double, because it is the only place the question exists:
 * with one Pokémon a side there is nothing to choose. Both of theirs are within
 * reach of both of yours - a 2v2 has no far slot - so focusing two attackers
 * onto one target is a real option and has to be sayable.
 *
 * A spread move has no choice to make and says so instead of offering one.
 */
function renderAimPicker(line, node, side, slot, format, report) {
    if (slotCount(line) < 2) return "";
    if (!monAt(node, side, slot)) return "";
    if (switchTargetAt(node, side, slot)) return "";

    var move = findMove(moveAt(node, side, slot));
    if (move && /allAdjacentFoes|allAdjacent/i.test(move.target || "")) {
        return `<span class="planner-aim spread" title="${escapeAttr(
            move.name + " hits both of them, so there is nothing to aim.")}">&#8594; both</span>`;
    }

    var otherSide = side === "you" ? "them" : "you";
    var chosen = aimAt(node, side, slot);
    var drawnBy = (report && report.redirect && report.redirect[otherSide]);
    if (drawnBy === undefined) drawnBy = null;
    // What it actually lands on right now, aim or fallback, so the highlight
    // always matches the damage figures above it - which means following a
    // Follow Me, since the aim is exactly what that move overrules.
    var landing = targetsOf(node, side, slot, moveAt(node, side, slot), chosen, drawnBy)[0];
    var redirected = drawnBy !== null && landing === drawnBy && chosen !== drawnBy &&
        redirectable(moveAt(node, side, slot));

    var buttons = [0, 1].map(function(i) {
        var ref = monAt(node, otherSide, i);
        if (!ref) return "";
        var name = otherSide === "them" || isPartnerSlot(line, otherSide, i)
            ? ((GAME.species()[toID(ref)] || {}).name || ref)
            : (function() { var e = boxEntry(ref); return e ? (e.nickname || e.species) : ref; })();
        var hint = redirected && i === drawnBy
            ? `${name} is drawing this move onto itself, whatever the aim says.`
            : `Attack ${name}.` + (chosen === null
                ? " Nothing is stated yet, so this is just whoever is across."
                : "");
        return `<button class="planner-aim-btn${landing === i ? " active" : ""}${redirected && i === drawnBy ? " drawn" : ""}"
                        data-side="${side}" data-slot="${slot}" data-aim="${i}"
                        title="${escapeAttr(hint)}">${name}</button>`;
    }).join("");

    if (!buttons) return "";
    var label = redirected
        ? "This move is being pulled onto the Pokémon drawing it, so the aim doesn't decide where it lands."
        : "Which of them this Pokémon attacks. Both are in reach of both of yours.";
    return `<span class="planner-aim${redirected ? " redirected" : ""}" title="${escapeAttr(label)}">&#8594;${buttons}</span>`;
}

function renderMoveList(line, node, state, moves, selected, side, slot, report) {
    if (!moves.length) {
        return `<span class="planner-move-empty">${side === "you" ? "Nobody here yet" : "No opponent yet"}</span>`;
    }
    var denied = (report && report.denied) || {};
    var otherSide = side === "you" ? "them" : "you";
    /*
     * Where this slot's moves actually land, and what is waiting for them. Both
     * belong to the whole moveset rather than to the chosen move: Follow Me draws
     * every single-target move alike, and a Protect refuses them all, so the
     * figures beside the moves you *didn't* pick have to say the same thing.
     */
    var drawnBy = (report && report.redirect && report.redirect[otherSide]);
    if (drawnBy === undefined) drawnBy = null;
    var guards = (report && report.guarding) || {};
    /*
     * A slot whose move never lands takes nothing off anybody, so its damage
     * figures are struck through - the same treatment the chosen move above gets.
     * They stay visible rather than blanking, because what it *would* have done
     * is exactly why it matters that it didn't.
     *
     * Two ways to get here, and they read differently: you said so, or it was
     * outsped and killed before it could move.
     */
    var saidSo = !actedAt(node, side, slot);
    var reason = denied[side + slot] || "";
    /*
     * "blocked" is the one denial that belongs to a move rather than to the slot,
     * since Protect only stops what the game lets it stop - so it is worked out
     * per move below and left out of the slot-wide stop here.
     */
    var stopped = saidSo || (!!reason && reason !== "blocked");

    var WHY = {
        outsped: `Outsped and knocked out before it can move, on every roll — so none of this lands.\n\nOnly a certain KO does this. If the kill depends on the roll, the move still goes off and the fork belongs on a branch instead.`,
        flinched: `Flinched by Fake Out before it could move, so none of this lands.\n\nFake Out's flinch is the one in this game that always happens rather than rolling for it.`,
        failed: `Fake Out only works on the user's first turn out. This isn't it, so the move fails outright — no damage, no flinch — and the turn is spent.`,
        phazed: `Dragged off the field before it could move, so none of this lands.\n\nRoar and Whirlwind are −6 priority in this game, so they almost always go last and the attack happens first. This is the rare turn where it doesn't.`
    };

    /*
     * What is standing in this move's way, in the order it would be met. Read per
     * move because all three answers depend on the move: Protect stops only what
     * carries the game's own Protect flag, and Endure and a shaky Protect change
     * what the hit *leaves* rather than whether it happens.
     */
    function guardWaiting(name) {
        var landing = targetsOf(node, side, slot, name, aimAt(node, side, slot), drawnBy);
        var kinds = landing.map(function(t) { return guards[otherSide + t] || null; });
        // Only a guard on every target it lands on says anything certain.
        if (!kinds.length || kinds.some(function(g) { return !g; })) return null;
        var first = kinds[0];
        if (!kinds.every(function(g) { return g.kind === first.kind && g.certain === first.certain; })) return null;
        if (first.kind === "block" && !blockedByProtect(name)) return null;
        return first;
    }

    return moves.map(function(name) {
        var move = findMove(name);
        var isSelected = selected === name;
        if (!move) {
            return `<span class="planner-move ${side}${isSelected ? " selected" : ""}" data-move="${name}" data-side="${side}" data-slot="${slot}">${name}</span>`;
        }

        var guard = stopped ? null : guardWaiting(name);
        var blocked = !!(guard && guard.kind === "block" && guard.certain);

        /*
         * The damage replaces base power rather than sitting beside it: the row
         * has no room for both, and the tooltip carries the base power anyway.
         * Anything without an honest number - a status move, an empty slot
         * opposite, a move this game has deleted - keeps showing power, so a
         * blank never reads as an immunity.
         */
        /*
         * Always the ordinary hit, never the crit a branch out of this turn may
         * ask for. A card shows what a move does; a crit is something a branch
         * says happened, and it belongs in the health it leaves behind rather
         * than in a figure that would then mean different things on different
         * turns.
         */
        var damage = plannerDamage(line, node, state, side, slot, name, false, drawnBy);
        var figure = damage
            ? `<span class="planner-move-dmg${damageClass(damage)}${stopped || blocked ? " denied" : ""}">${damageText(damage)}</span>`
            : `<span class="planner-move-bp">${move.category === "status" ? "—" : move.basePower}</span>`;

        var tooltip = `${move.name} — ${move.category}, ${move.basePower || 0} BP, ${move.accuracy || "—"}% acc`;
        /*
         * The calculator's own sentence, which names every modifier it applied -
         * and already ends with the KO chance, so that isn't repeated here.
         */
        if (damage) tooltip = `${damage.desc}\n\n${tooltip}`;
        /*
         * A move that lands a varying number of times has two uncertainties
         * stacked on each other, which is why its range looks so wide. Worth
         * saying, along with the fact that a KO here means the fewest hits.
         */
        if (damage && damage.hits && damage.hits.max > damage.hits.min) {
            tooltip = `Hits ${damage.hits.min}-${damage.hits.max} times, so the range covers ${damage.hits.min} hits on the worst roll up to ${damage.hits.max} on the best. A KO is only claimed if ${damage.hits.min} hits would do it.\n\n${tooltip}`;
        }
        /*
         * What the other side is doing about it, said before the numbers because
         * it changes what those numbers mean - and whether that is something the
         * plan is relying on or something it is gambling on.
         */
        if (guard) {
            var who = (function() {
                var landing = targetsOf(node, side, slot, name, aimAt(node, side, slot), drawnBy)[0];
                var ref = monAt(node, otherSide, landing);
                var species = speciesAt(line, node, otherSide, landing);
                return (species && species.name) || ref || "it";
            })();
            tooltip = (guard.kind === "block"
                ? `${who} is using ${guard.move}, so this doesn't land at all — no damage and no effect. The figure is what it would have done.`
                : `${who} is using ${guard.move}, so this lands in full but cannot knock it out — it holds on with 1 HP. End-of-turn damage still can.`
            ) + (guard.certain ? "" :
                `\n\nThat is a repeat, so it can fail. The plan assumes it holds; branch the turn and mark that slot "didn't act" on the arm where it doesn't.`
            ) + `\n\n${tooltip}`;
        }
        // Where it actually lands, when that isn't where it was pointed.
        if (drawnBy !== null && redirectable(name) &&
            targetsOf(node, side, slot, name, aimAt(node, side, slot), drawnBy)[0] === drawnBy &&
            aimAt(node, side, slot) !== drawnBy) {
            var drawer = speciesAt(line, node, otherSide, drawnBy);
            tooltip = `Pulled onto ${(drawer && drawer.name) || "the other slot"} by Follow Me, so this figure is against that Pokémon rather than the one aimed at.\n\n${tooltip}`;
        }
        /*
         * And what this slot's own guard is worth. The streak is read off the
         * state coming *into* the turn, so it says the same thing whether or not
         * the move is the one selected - which is the point, since it is exactly
         * what you are deciding when you look at the list.
         */
        var mine = guardKind(name);
        if (mine) {
            var streak = (monState(state, side, monAt(node, side, slot)).protectStreak || 0);
            tooltip = (streak === 0
                ? (mine === "block"
                    ? `Guaranteed here: the first use always works. Nothing it stops lands at all.\n\nUsing it again next turn halves the chance, and the card will say so.`
                    : `Guaranteed here: the first use always works. Attacks still land in full; it just holds on with 1 HP.\n\nEnd-of-turn damage goes through it.`)
                : `This would be the ${ordinal(streak + 1)} in a row, so it can fail — the chance has halved at least once. The plan assumes it holds; branch the turn and mark this slot "didn't act" on the arm where it doesn't.\n\nUsing anything else in between puts it back to guaranteed.`
            ) + `\n\n${tooltip}`;
        }
        if (redirectsMoves(name)) {
            tooltip = `Pulls every single-target move the other side throws onto this Pokémon, whatever they were aimed at. Spread moves, hazards and Counter aren't affected.\n\n${tooltip}`;
        }
        /*
         * Why the number is nothing, said first, because a zero on its own reads
         * like a mistake. calc's own sentence below already names the ability
         * where one is responsible, but not the type chart.
         */
        if (damage && damage.immune) {
            var absorbed = damage.absorbed;
            if (absorbed && absorbed.heal) {
                tooltip = `${absorbed.ability} absorbs this: it deals no damage and heals ${absorbed.heal} HP instead. Attacking into it is worse than doing nothing.\n\n${tooltip}`;
            } else if (absorbed && absorbed.boosts) {
                tooltip = `${absorbed.ability} takes this instead of damage: no damage, and ${Object.keys(absorbed.boosts).map(function(s) {
                    return `${absorbed.boosts[s] > 0 ? "+" : ""}${absorbed.boosts[s]} ${BOOST_LABELS[s] || s}`; }).join(", ")} for them.\n\n${tooltip}`;
            } else {
                tooltip = `Does nothing at all — it can't touch this Pokémon.\n\n${tooltip}`;
            }
        }
        if (saidSo) {
            tooltip = `This move never goes off on this turn, so none of it lands — the turn is marked "didn't act".\n\n${tooltip}`;
        } else if (WHY[reason]) {
            tooltip = `${WHY[reason]}\n\n${tooltip}`;
        }

        return `<span class="planner-move ${side}${isSelected ? " selected" : ""}" data-move="${name}" data-side="${side}" data-slot="${slot}"
                      title="${escapeAttr(tooltip)}">
            <img src="${GAME.sprites.type(move.type)}" alt="">
            <span class="planner-move-name">${move.name}</span>
            ${figure}
            ${NO_DROP_MOVES.indexOf(move.id) >= 0 ? `<span class="planner-nodrop" title="Platinum Kaizo removes this move's stat drop - it has no drawback here.">nd</span>` : ``}
        </span>`;
    }).join("");
}

/*
 * calc's descriptions carry quotes and angle brackets ("252+ Atk Cranidos Head
 * Smash vs. ..."), and these go into a title attribute built by string
 * concatenation, so they have to be escaped rather than trusted.
 */
function escapeAttr(text) {
    return String(text)
        .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/*
 * Why a slot is stuck, in the terms a plan cares about. A 2-5 binding move gets
 * the same treatment as sleep: turns elapsed, and never a promise about when it
 * lets go.
 */
function trapHint(trap) {
    if (trap.kind === "ability") {
        return `Trapped by ${trap.by} - it can't switch out while that Pokémon is opposite it.`;
    }
    if (!trap.expires) {
        return trap.self
            ? "Rooted by its own Ingrain, which is the price of the healing - it recovers 1/16 each turn and cannot switch out for the rest of the fight."
            : "Trapped for the rest of the fight - Mean Look and friends don't wear off.";
    }
    if (trap.guaranteed) {
        return `Bound for exactly ${TRAP_MAX_TURNS} turns - the Grip Claw takes away the early release - with ${trap.turns} elapsed.`;
    }
    return `Bound by a binding move, ${trap.turns} of at most ${TRAP_MAX_TURNS} turns elapsed. These run 2-5 turns, so it can let go on any turn from here and is free after ${TRAP_MAX_TURNS} - branch the early release rather than counting on it.`;
}

// The move shown under a sprite once it's been chosen.
function chosenMoveText(name) {
    if (!name) return `<span class="planner-node-blank">—</span>`;
    var move = findMove(name);
    if (!move) return `<b>${name}</b> <span class="planner-node-warn" title="This game has no move by that name.">?</span>`;
    return `<img class="planner-move-type" src="${GAME.sprites.type(move.type)}" alt=""> <b>${move.name}</b>` +
        (NO_DROP_MOVES.indexOf(move.id) >= 0 ? ` <span class="planner-nodrop" title="Platinum Kaizo removes this move's stat drop - it has no drawback here.">nd</span>` : ``);
}

/*
 * The health bar for one slot.
 *
 * Two segments, because HP down a line is a range and not a number: the solid
 * part is what the Pokémon has for certain even on the worst run of rolls, and
 * the paler part on top is the rest of the band, the health it has only if the
 * rolls went its way. Reading the solid edge alone is reading the plan
 * pessimistically, which is the way a Nuzlocke wants to be read.
 *
 * Colour follows that same worst case. A slot nothing has touched yet still gets
 * a full bar rather than nothing, so a row of cards can be scanned down.
 */
function renderHp(mon) {
    if (blindMode()) return "";
    var hp = hpOf(mon);
    if (!hp) {
        return `<span class="planner-hp" title="Undamaged so far on this branch.">
            <span class="planner-hp-bar"><span class="planner-hp-min good" style="width: 100%"></span></span>
        </span>`;
    }
    if (hp.max <= 0) {
        return `<span class="planner-hp fainted" title="Nothing left on this branch - it faints here.">
            <span class="planner-hp-bar"></span>
            <span class="planner-hp-text">FAINTED</span>
        </span>`;
    }

    var lowPct = Math.max(0, hp.min) * 100 / hp.full;
    var highPct = Math.max(0, hp.max) * 100 / hp.full;
    // The worst case decides the colour, the same way it decides the reading.
    var health = lowPct > 50 ? "good" : lowPct > 20 ? "warn" : "bad";
    var lo = Math.round(lowPct);
    var hi = Math.round(highPct);

    return `<span class="planner-hp" title="${escapeAttr(
        `${hp.min}-${hp.max} of ${hp.full} HP.\n\nA damage roll is 85-100%, so what it has left is a range rather than a number, and it widens with every hit. A branch out of a turn - You KO, You don't KO - narrows it again.`)}">
        <span class="planner-hp-bar">
            <span class="planner-hp-min ${health}" style="width: ${lowPct}%"></span>
            <span class="planner-hp-band ${health}" style="width: ${highPct - lowPct}%"></span>
        </span>
        <span class="planner-hp-text ${health}">${lo === hi ? `${lo}%` : `${lo}–${hi}%`}</span>
    </span>`;
}

/*
 * The held item, and a way to spend it.
 *
 * A berry that fires on a health threshold is only claimed once the whole band
 * is under the line, because while it straddles, whether it went off is a coin
 * flip and firing it would change what happens next rather than merely how much
 * is left. That leaves a real gap, and this is what fills it: one click says the
 * berry went off on this turn, and the plan is derived from there.
 *
 * It sits against the HP bar rather than in the turn editor because that is
 * where you are looking when the question comes up, and because the answer shows
 * up an inch to its left.
 */
const ORB_VERB = {tox: "badly poisons", psn: "poisons", brn: "burns"};

function renderItemTrigger(line, node, state, side, slot) {
    if (blindMode()) return "";
    var holder = activeHolder(line, node, side, slot);
    if (!holder || !holder.item) return "";
    var fx = itemEffect(holder.item);
    if (!fx) return "";

    var spent = itemRecord(state, side, holder.id);
    if (spent) {
        return `<span class="planner-item-pip spent" title="${escapeAttr(
            `${spent.name} is gone — it was used earlier on this branch, and it only works once.`)}">${spent.name}</span>`;
    }

    var stated = itemStatedAt(node, side, slot);
    var what = fx.heal
        ? (fx.heal.points !== undefined
            ? `restores ${fx.heal.points} HP`
            : `restores ${fx.heal.fraction[0]}/${fx.heal.fraction[1]} of its health`)
        : fx.clearsNegative ? "clears its stat drops"
        : fx.survives ? "lets it survive one hit from full health"
        // Written out rather than built from the status name, which doesn't
        // inflect: "Badly poisoned" + "es" is not a word.
        : fx.selfStatus ? `${ORB_VERB[fx.selfStatus] || "statuses"} its holder at the end of every turn`
        : fx.resists ? `halves one super-effective ${fx.resists.type} hit, then it's gone`
        : `gives it ${Object.keys(fx.boost || {}).map(function(s) {
            return `${fx.boost[s] > 0 ? "+" : ""}${fx.boost[s]} ${BOOST_LABELS[s] || s}`; }).join(", ")}`;

    /*
     * Only a health threshold gets a button, because it is the only trigger the
     * planner refuses to guess at - the band can straddle the line, and saying
     * which side of it the fight landed on is your call.
     *
     * Everything else fires on its own and has no decision in it: a Focus Sash
     * catches a particular hit as it lands, a resist berry is spent by whoever
     * attacks into it, an orb goes off every turn whether or not anyone wants it,
     * and White Herb waits for a stat drop to exist. Those are shown, not offered.
     */
    if (!fx.threshold) {
        return `<span class="planner-item-pip" title="${escapeAttr(
            `${fx.name} — ${what}. The planner applies it on its own; there's nothing to decide.`)}">${fx.name}</span>`;
    }

    var hint = `${fx.name} — ${what} once it drops below ${Math.round(fx.threshold[0] * 100 / fx.threshold[1])}%.\n\n` +
        (stated
            ? `You've said it went off on this turn, so the plan uses it here. Click to take that back.`
            : `The planner fires it on its own once the health bar is entirely under that line. While the bar straddles it, it's a coin flip — click to say it went off on this turn.`);

    return `<button class="planner-item-pip use${stated ? " stated" : ""}"
                    data-side="${side}" data-slot="${slot}"
                    title="${escapeAttr(hint)}">${fx.name}</button>`;
}

const BOOST_LABELS = {atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe", acc: "Acc", eva: "Eva"};

// Non-volatile status plus any volatiles, shown against the Pokémon carrying it.
function renderStatus(side, trapped) {
    var parts = [];
    if (trapped) {
        var count = trapped.expires && trapped.turns ? ` ${trapped.turns}` : "";
        parts.push(`<span class="planner-status trapped" title="${trapHint(trapped)}">TRAP${count}</span>`);
    }
    if (side.status && STATUSES[side.status]) {
        var turns = side.statusTurns || 0;
        /*
         * Sleep is the one worth counting: it runs 1-4 turns in this
         * generation, so the number is a risk gauge rather than a countdown.
         */
        /*
         * The count is turns elapsed, not a countdown. Sleep duration is random
         * and isn't in the game data, so no number here is a promise - it can
         * break on any turn, including the very first. Plan the early wake as a
         * branch rather than trusting the count.
         */
        /*
         * Sleep is pinned at both ends and random in between, so the hint says
         * which of the three a turn is in rather than implying it is all luck.
         */
        var left = SLEEP_MAX_TURNS - turns;
        var hint = side.status === "slp"
            ? (turns === 0
                ? `Just fell asleep, and cannot wake on this turn - that much is guaranteed. Awake by turn ${SLEEP_MAX_TURNS} at the latest.`
                : `Asleep, ${turns} turn${turns === 1 ? "" : "s"} elapsed. ${
                    left <= 1
                        ? "It wakes at the end of this one whatever happens."
                        : `It can wake on any turn from here, and is awake after ${left} more at the latest - branch the early wake, or mark it as ending when it breaks.`
                }`)
            : side.status === "frz"
                /*
                 * Freeze is the one status with no ceiling at all: a flat 20% a
                 * turn, so it can outlast the whole fight. Saying so stops the
                 * count reading like a countdown the way sleep's does.
                 */
                ? `Frozen${turns > 0 ? `, ${turns} turn${turns === 1 ? "" : "s"} elapsed` : ""}. A flat 20% chance to thaw each turn and no limit on how long it lasts, so branch the thaw rather than counting on it. Any Fire move that hits also thaws it.`
                : side.status === "tox"
                    ? `Badly poisoned, ${turns} turn${turns === 1 ? "" : "s"} elapsed - the damage ramps with this count. Switching out resets the count but not the poison.`
                    : STATUSES[side.status].name + (turns > 0 ? `, ${turns} turn${turns === 1 ? "" : "s"} elapsed` : "");
        parts.push(`<span class="planner-status ${side.status}" title="${hint}">${STATUSES[side.status].short}${turns > 0 ? ` ${turns}` : ""}</span>`);
    }
    /*
     * Perish leads, because it outranks everything else on the card: at zero the
     * Pokemon is gone regardless of what the rest of the plan says.
     */
    if (side.perish > 0) {
        parts.push(`<span class="planner-status perish" title="Perish Song: faints in ${side.perish} turn${side.perish === 1 ? "" : "s"}, counting this one. Switching out is the only way off it.">PERISH ${side.perish}</span>`);
    } else if (side.perish === 0 && side.perishDone) {
        parts.push(`<span class="planner-status perish-done" title="The Perish Song count ran out - this Pokémon faints here.">FAINTS</span>`);
    }
    for (var v in side.volatiles) {
        if (!side.volatiles[v]) continue;
        var info = VOLATILES[v];
        var elapsed = (side.volatileTurns || {})[v] || 0;
        // Only the ones that run out on their own carry a number.
        var vHint = info
            ? (info.maxTurns
                ? `${info.name}. ${elapsed} of at most ${info.maxTurns} turns elapsed - it can end on any turn from here and is gone after ${info.maxTurns}.`
                : `${info.name}. No turn limit; it lasts until the Pokémon leaves the field.`)
            : v;
        parts.push(`<span class="planner-status volatile" title="${vHint}">${info ? info.short : v}${
            info && info.maxTurns && elapsed ? ` ${elapsed}` : ""}</span>`);
    }
    return parts.length ? `<span class="planner-statuses">${parts.join("")}</span>` : "";
}

function renderBoosts(boosts) {
    var parts = [];
    for (var stat in boosts) {
        if (!boosts[stat]) continue;
        parts.push(`<span class="planner-boost ${boosts[stat] > 0 ? "up" : "down"}">${boosts[stat] > 0 ? "+" : ""}${boosts[stat]} ${BOOST_LABELS[stat] || stat}</span>`);
    }
    return parts.length ? `<span class="planner-boosts">${parts.join("")}</span>` : "";
}

const HAZARD_LABELS = {
    isSR: "Stealth Rock",
    spikes: "Spikes",
    toxicSpikes: "Toxic Spikes",
    isReflect: "Reflect",
    isLightScreen: "Light Screen",
    isTailwind: "Tailwind"
};

// Field state that persists across turns, shown above the matchup it affects.
function renderStateBar(state) {
    var parts = [];
    if (state.weather) {
        /*
         * Standing weather is nobody's doing, so it needs saying - otherwise the
         * first turn of a fight on Route 228 looks like the planner inventing a
         * sandstorm.
         */
        var fromBattle = state.weatherSource === "battle";
        parts.push(`<span class="planner-field${fromBattle ? " standing" : ""}"${
            fromBattle ? ` title="This fight takes place in ${state.weather.toLowerCase()} - it is up before either side moves. A weather move or ability still overrides it."` : ``
        }>${state.weather}${fromBattle ? " (battle)" : ""}</span>`);
    }
    /*
     * Trick Room reorders the whole fight, so it belongs up here with the weather
     * rather than against either side.
     */
    if (state.trickRoom) {
        parts.push(`<span class="planner-field trickroom" title="${escapeAttr(
            "Trick Room: the slower Pokémon moves first inside each priority bracket. A Quick Attack still goes before a Tackle - only the speed comparison is flipped.\n\nIn this game it lasts until the move is used again rather than running out after five turns."
        )}">Trick Room</span>`);
    }
    /*
     * A Wish in the air. Shown against the side because it belongs to the slot
     * rather than to whoever made it - which is the point: switch, and the
     * arrival collects it.
     */
    ["you", "them"].forEach(function(side) {
        ((state[side] || {}).pending || []).forEach(function(list, slot) {
            (list || []).forEach(function(item) {
                var heals = item.kind === "heal";
                var hint = heals
                    ? `${item.name} lands on this slot at the end of ${item.turns > 1 ? "next turn" : "this turn"}, healing whoever is standing in it by ${item.amount} HP.\n\nThe amount was fixed when it was used — half of that Pokémon's max HP, not the receiver's — so switching something frailer in still collects the same number.`
                    : `${item.name} lands on this slot at the end of ${item.turns > 1 ? "next turn" : "this turn"}, hitting whoever is standing in it for ${item.amount} HP.\n\nThe damage was worked out when the move was used, against whoever was standing there then — switching doesn't dodge it, and the Pokémon that takes it may not be the one it was aimed at.`;
                parts.push(`<span class="planner-field ${side} pending ${heals ? "heal" : "hurt"}" title="${escapeAttr(hint)}">${
                    side === "you" ? "Your" : "Their"} slot ${slot + 1}: ${item.name} &middot; ${item.turns}</span>`);
            });
        });
    });

    ["you", "them"].forEach(function(side) {
        var hazards = state[side].hazards;
        for (var field in hazards) {
            if (!hazards[field]) continue;
            var label = HAZARD_LABELS[field] || field;
            var whose = side === "you" ? "Your side" : "Their side";
            /*
             * A screen's value is the turns it has left, not a layer count, so
             * it reads as a countdown rather than "Reflect x5".
             */
            if (TIMED_SIDE[field]) {
                var left = hazards[field];
                var hint = SCREENS[field]
                    ? `${label} lasts 5 turns from when it was set, or 8 if that Pokémon held a Light Clay. ${left} left, counting this one.`
                    : `Tailwind doubles this side's Speed for 3 turns. ${left} left, counting this one. Defog doesn't clear it and Brick Break doesn't break it.`;
                parts.push(`<span class="planner-field ${side} screen" title="${escapeAttr(hint)}">${whose}: ${label} &middot; ${left}</span>`);
                continue;
            }
            var layers = hazards[field] > 1 ? ` x${hazards[field]}` : "";
            parts.push(`<span class="planner-field ${side}">${whose}: ${label}${layers}</span>`);
        }
    });
    // A spent item is easy to forget and changes whether a plan works.
    var WHY_SPENT = {
        cure: "to cure a status. It only works once, so anything later sticks.",
        heal: "to heal. It only works once, so nothing later gets it back.",
        boost: "for the stat change. It only works once.",
        survive: "to survive a hit from full health. It only works once.",
        resist: "to halve a super-effective hit. It only works once, so the next one lands in full."
    };
    ["you", "them"].forEach(function(side) {
        var used = (state.itemsUsed && state.itemsUsed[side]) || {};
        for (var who in used) {
            var record = itemRecord(state, side, who);
            if (!record) continue;
            parts.push(`<span class="planner-field cured ${side}" title="${escapeAttr(
                `${who} used its ${record.name} ${WHY_SPENT[record.why] || "already."}`)}">${record.name} spent</span>`);
        }
    });
    if (state.ambiguous) {
        parts.push(`<span class="planner-field ambiguous" title="This turn is reachable by more than one branch, and they don't all leave the same boosts and hazards behind. Showing the first; edit the turn to pin it.">mixed state</span>`);
    }
    return parts.length ? `<div class="planner-state-bar">${parts.join("")}</div>` : "";
}

// The payoff of pre-statusing, called out where it applies.
function renderStatusBlock(line, node, state) {
    var mine = slotState(line, node, state, "you", 0);
    if (!mine.status) return "";
    var flags = GAME.aiFlags()[line.trainer];
    if (!flags || !flags.Harassment) return "";
    return `<div class="planner-status-block" title="A Pokémon can only carry one non-volatile status, so this one is immune to anything else they try. This trainer's AI leads with status and disruption.">
        Status locked - ${STATUSES[mine.status].name} blocks theirs
    </div>`;
}

/*
 * What a slot is doing this turn, shown under its sprite. A switch names who is
 * coming in; otherwise it is the chosen move.
 */
function slotActionText(line, node, side, slot, isPartner) {
    var target = switchTargetAt(node, side, slot);
    if (target) {
        var name = target;
        if (side === "you") {
            var entry = boxEntry(target);
            name = entry ? (entry.nickname || entry.species) : target;
        } else {
            var species = GAME.species()[toID(target)];
            name = species ? species.name : target;
        }
        return `<span class="planner-switch" title="Switching gives up the turn - whoever comes in takes the hit.">&#8646; <b>${name}</b></span>`;
    }
    var move = moveAt(node, side, slot);
    if (!move) return `<span class="planner-node-blank">—</span>`;
    /*
     * A move that never went off is still worth showing - it says what they
     * were going to do - but struck through, so the card doesn't read as though
     * its effects landed.
     */
    if (!actedAt(node, side, slot)) {
        return `<span class="planner-denied" title="This move never went off, so none of its effects apply.">${chosenMoveText(move)}</span>`;
    }
    // A partner's move is a prediction, not an order, so it reads as one.
    return (isPartner ? `<span class="planner-predicted">likely </span>` : "") + chosenMoveText(move);
}

const SVG_NS = "http://www.w3.org/2000/svg";

// SVG children must be created in the SVG namespace; building them from an HTML
// string produces unrenderable HTML elements that merely share the tag name.
function svgEl(tag, attrs, text) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var name in attrs) el.setAttribute(name, attrs[name]);
    if (text !== undefined) el.textContent = text;
    return el;
}

/*
 * Picks which edges of the two cards an arrow should join. Turns usually read
 * top-to-bottom, but laying a sequence out left-to-right is just as natural, and
 * forcing a bottom-to-top curve there makes the arrow loop back over the card.
 * So: drop straight down when the target is genuinely below, otherwise go out
 * the side.
 */
/*
 * `spread` bows the curve sideways so branches sharing endpoints stay apart;
 * `labelShift` stacks their labels vertically, because label text is far wider
 * than the horizontal gap and would otherwise overlap into nonsense.
 */
function routeEdge(from, to, spread, labelShift) {
    spread = spread || 0;
    labelShift = labelShift || 0;
    var gap = to.y - (from.y + from.h);
    if (gap > -20) {
        var x1 = from.x + from.w / 2;
        var y1 = from.y + from.h;
        var x2 = to.x + to.w / 2;
        var y2 = to.y;
        var dy = Math.max(30, Math.abs(y2 - y1) / 2);
        return {
            d: `M ${x1} ${y1} C ${x1 + spread} ${y1 + dy}, ${x2 + spread} ${y2 - dy}, ${x2} ${y2}`,
            labelX: (x1 + x2) / 2 + spread,
            labelY: (y1 + y2) / 2 + labelShift
        };
    }

    // Side route: leave the edge facing the target and enter the opposite one.
    var leftToRight = to.x >= from.x;
    var sx = leftToRight ? from.x + from.w : from.x;
    var sy = from.y + from.h / 2;
    var tx = leftToRight ? to.x : to.x + to.w;
    var ty = to.y + to.h / 2;
    var dx = Math.max(30, Math.abs(tx - sx) / 2);
    return {
        d: `M ${sx} ${sy} C ${sx + (leftToRight ? dx : -dx)} ${sy + spread}, ${tx - (leftToRight ? dx : -dx)} ${ty + spread}, ${tx} ${ty}`,
        labelX: (sx + tx) / 2,
        labelY: (sy + ty) / 2 - 6 + spread + labelShift
    };
}

// How far apart to bow branches that share the same pair of turns, and how far
// apart to stack their labels.
const EDGE_SPREAD = 34;
const EDGE_LABEL_STEP = 13;

/*
 * Position of each edge within its from/to group, so parallel branches can be
 * fanned out symmetrically around the direct route.
 */
function edgeSpreads(line) {
    var groups = {};
    Object.keys(line.edges).forEach(function(id) {
        var edge = line.edges[id];
        var key = `${edge.from}|${edge.to}`;
        (groups[key] = groups[key] || []).push(id);
    });
    var spreads = {};
    Object.keys(groups).forEach(function(key) {
        var ids = groups[key];
        ids.forEach(function(id, i) {
            var offset = i - (ids.length - 1) / 2;
            spreads[id] = {
                spread: offset * EDGE_SPREAD,
                labelShift: ids.length > 1 ? offset * EDGE_LABEL_STEP : 0
            };
        });
    });
    return spreads;
}

function renderEdges(visible) {
    var line = currentLine();
    visible = visible || visibleNodes(line);
    var svg = $(".planner-canvas-edges")[0];
    // Keep <defs>, drop everything drawn last time.
    $(svg).children().not("defs").remove();

    var spreads = edgeSpreads(line);

    for (var id in line.edges) {
        var edge = line.edges[id];
        var from = line.nodes[edge.from];
        var to = line.nodes[edge.to];
        if (!from || !to) continue;
        // An arrow into a folded-away turn has nothing to point at.
        if (!visible[edge.from] || !visible[edge.to]) continue;

        var fromEl = $(`.planner-node[data-node="${edge.from}"]`);
        var toEl = $(`.planner-node[data-node="${edge.to}"]`);
        if (!fromEl.length || !toEl.length) continue;

        var route = routeEdge(
            {x: from.x, y: from.y, w: fromEl.outerWidth(), h: fromEl.outerHeight()},
            {x: to.x, y: to.y, w: toEl.outerWidth(), h: toEl.outerHeight()},
            spreads[edge.id].spread, spreads[edge.id].labelShift);
        var condition = conditionFor(edge);

        svg.appendChild(svgEl("path", {
            d: route.d,
            class: `planner-edge ${condition.color}`,
            "marker-end": `url(#planner-arrow-${condition.color})`
        }));

        /*
         * A branch the arithmetic rules out is marked on the arrow itself, since
         * that is the thing that would have to change. The turn's own badge says
         * the same, but the label is where you would go to fix it.
         */
        var impossible = validateEdge(line, edge);
        var label = svgEl("text", {
            x: route.labelX,
            y: route.labelY,
            class: `planner-edge-label ${condition.color}${impossible ? " impossible" : ""}`,
            "data-edge": edge.id
        }, (impossible ? "⚠ " : "") + (edge.label || condition.name));
        label.appendChild(svgEl("title", {},
            impossible
                ? impossible + "\n\nClick to change or delete this branch."
                : "Click to change or delete this branch"));
        label.addEventListener("click", editEdgeFromLabel);
        svg.appendChild(label);
    }
}

// Clicking a label edits it. Deleting is a deliberate choice inside the editor,
// not the consequence of clicking the most obvious target on the arrow.
function editEdgeFromLabel() {
    openEdgeEditor(this.getAttribute("data-edge"));
}

/* --------------------------------------------------------------- turn editor */

/*
 * Only what the card can't already do.
 *
 * Choosing Pokémon, moves and switches all happen on the card itself now - by
 * dragging one in, clicking a move, or using its switch button - and none of
 * that could be expressed for four slots through a pair of dropdowns anyway.
 * What's left is the turn's note and any status carried into it.
 */
var nodeEditorPopup = `
<fieldset class="planner-node-popup">
    <legend align="center">Edit Turn</legend>
    <p class="planner-hint">Pokémon and moves are set on the card itself: drag one in, click a move, or use its switch button. Right-click a slot to empty it.</p>
    <hr />
    <div class="planner-tabs"></div>
    <div class="planner-tab-panels"></div>
    <hr />
    <div class="planner-form">
        <label>Note</label><input class="planner-edit-note" type="text" placeholder="e.g. needs Sash intact" />
    </div>
    <hr />
    <span class="buttons">
        <button id="planner-cancel-node" class="btn planner-btn">Cancel</button>
        <button id="planner-save-node" class="btn planner-btn">Save</button>
    </span>
</fieldset>`;

function openNodeEditor(nodeId) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    if (!node) return;
    EDITING_NODE = nodeId;

    $("#planner-popup-container").html(nodeEditorPopup).removeClass("hide").show();

    /*
     * One tab per occupied slot, because everything below belongs to a single
     * Pokemon: its status, its stages, its volatiles, whether it got to act.
     * A double would otherwise stack four of each down one column and run off
     * the screen. All panels stay in the DOM so saving reads them regardless of
     * which is on top.
     */
    var slots = slotCount(line);
    var filled = [];
    ["you", "them"].forEach(function(side) {
        for (var i = 0; i < slots; i++) {
            var ref = monAt(node, side, i);
            if (!ref) continue;
            filled.push({
                side: side, slot: i, ref: ref,
                label: side === "you" && !isPartnerSlot(line, side, i)
                    ? ((boxEntry(ref) || {}).nickname || ref)
                    : ((GAME.species()[toID(ref)] || {}).name || ref)
            });
        }
    });

    if (!filled.length) {
        $(".planner-tabs").empty();
        $(".planner-tab-panels").html(
            `<p class="planner-hint">Nobody is on this turn yet. Drag a Pokémon onto the card, or click a slot.</p>`);
    }

    EDITING_INHERITED = {};
    var inherited = inheritedState(line, nodeId);
    var skipped = node.skipped || {you: [], them: []};

    $(".planner-tabs").html(filled.map(function(s, i) {
        return `<button type="button" class="planner-tab ${s.side}${i === 0 ? " active" : ""}"
                        data-side="${s.side}" data-slot="${s.slot}">${s.label}</button>`;
    }).join(""));

    $(".planner-tab-panels").html(filled.map(function(s, i) {
        var status = seedFor(node, "statusSeed", s.side, s.slot, "");
        var stages = seedFor(node, "boostSeed", s.side, s.slot, {});

        var was = monState(inherited, s.side, s.ref).volatiles;
        var on = {};
        for (var v in was) if (was[v]) on[v] = true;
        EDITING_INHERITED[s.side + s.slot] = Object.keys(on);
        seedFor(node, "volatileClear", s.side, s.slot, []).forEach(function(id) { delete on[id]; });
        seedFor(node, "volatileSeed", s.side, s.slot, []).forEach(function(id) { on[id] = true; });

        var statusOptions = [`<option value="">(inherit)</option>`,
            // Sleep and freeze end on their own schedule, so this is how you say
            // when they broke rather than guessing a fixed number of turns.
            `<option value="${STATUS_CURED}"${status === STATUS_CURED ? " selected" : ""}>— ends on this turn —</option>`]
            .concat(Object.keys(STATUSES).map(function(id) {
                return `<option value="${id}"${status === id ? " selected" : ""}>${STATUSES[id].name}</option>`;
            })).join("");

        return `<div class="planner-tab-panel${i === 0 ? " active" : ""}" data-side="${s.side}" data-slot="${s.slot}">
            <div class="planner-form">
                <label>Status</label>
                <select class="planner-edit-status" data-side="${s.side}" data-slot="${s.slot}"
                        title="Status carried into this turn - for walking in pre-slept or pre-poisoned so nothing worse can land. Carries down to later turns.">${statusOptions}</select>
                <label>Didn't act</label>
                <span><button type="button" class="planner-condition planner-skip${(skipped[s.side] || [])[s.slot] ? " bad selected" : ""}"
                        data-side="${s.side}" data-slot="${s.slot}"
                        title="Its move never went off - KO'd before acting, flinched, fully paralysed, or missed. The move's effects are skipped.">Move didn't go off</button></span>
                <label>Health</label>
                <span><input type="number" min="0" max="100" step="1" class="planner-edit-hp"
                        data-side="${s.side}" data-slot="${s.slot}" placeholder="inherit"
                        value="${seedFor(node, "hpSeed", s.side, s.slot, null) === null ? "" : seedFor(node, "hpSeed", s.side, s.slot, null)}"
                        title="Health carried into this turn, as a percentage. Leave blank to use what the plan works out.&#10;&#10;Stating it pins the range to a single number, which is what you want for a line that starts mid-fight, or when the band has widened past being useful and you know what actually happened."> %</span>
            </div>
            <span class="planner-panel-label" title="Added on top of what this turn inherited. Leave at 0 to change nothing.">Stat stages</span>
            <span class="planner-boost-edit" data-side="${s.side}" data-slot="${s.slot}">${
                Object.keys(BOOST_LABELS).map(function(stat) {
                    return `<label class="planner-boost-field" title="${BOOST_LABELS[stat]} stages this turn adds">
                        <span>${BOOST_LABELS[stat]}</span>
                        <input type="number" min="-6" max="6" step="1" data-stat="${stat}" value="${stages[stat] || 0}">
                    </label>`;
                }).join("")
            }</span>
            <span class="planner-panel-label" title="These sit alongside the status rather than replacing it, and clear when the Pokémon switches out.">Volatiles</span>
            <span class="planner-volatiles" data-side="${s.side}" data-slot="${s.slot}">${
                Object.keys(VOLATILES).map(function(id) {
                    return `<button type="button" class="planner-condition planner-volatile${on[id] ? " neutral selected" : ""}"
                                    data-volatile="${id}" title="${VOLATILES[id].name}">${VOLATILES[id].short}</button>`;
                }).join("")
            }</span>
        </div>`;
    }).join(""));
    $(".planner-edit-note").val(node.note || "");
}

// What each side had coming into the turn being edited, so saving can record
// only what this turn changes rather than pinning the whole set.
var EDITING_INHERITED = {};

// Which volatiles this turn switches on, and which it switches off, per slot.
function volatileEdits(side, slot) {
    var selected = $(`.planner-volatiles[data-side="${side}"][data-slot="${slot}"] .planner-volatile.selected`)
        .map(function() { return $(this).attr("data-volatile"); }).get();
    var was = EDITING_INHERITED[side + slot] || [];
    return {
        add: selected.filter(id => was.indexOf(id) < 0),
        clear: was.filter(id => selected.indexOf(id) < 0)
    };
}

function closeNodeEditor() {
    $("#planner-popup-container").hide().empty();
    EDITING_NODE = "";
}

/* ------------------------------------------------------------------- switch */

var switchEditorPopup = `
<fieldset class="planner-switch-popup">
    <legend align="center">Switch</legend>
    <p class="planner-hint">You give up the turn to do this, so whoever comes in takes their attack. Their boosts stay; yours reset.</p>
    <div class="planner-switch-list"></div>
    <hr />
    <span class="buttons">
        <button id="planner-clear-switch" class="btn planner-btn">Attack instead</button>
        <button id="planner-cancel-switch" class="btn planner-btn">Cancel</button>
    </span>
</fieldset>`;

var EDITING_SWITCH_NODE = "";
var EDITING_SWITCH_SIDE = "you";
var EDITING_SWITCH_SLOT = 0;

/*
 * Who can legally occupy a slot. Three different sources depending on whose
 * slot it is - your Box, an opposing trainer's party, or the ally's party -
 * which both the switch picker and the slot picker need, so it lives in one
 * place rather than being spelled out per caller.
 */
function slotOptionsFor(line, node, side, slot, exclude) {
    var setdex = GAME.setdex();
    exclude = exclude || [];

    function fromParty(trainer) {
        return (GAME.partyOrder()[trainer] || [])
            .filter(name => exclude.indexOf(name) < 0)
            .map(function(name) {
                var species = GAME.species()[toID(name)];
                if (!species) return null;
                var set = setdex[name] && setdex[name][trainer];
                return {
                    ref: name, label: species.name, species: species,
                    level: set ? set.level : null, dead: false
                };
            })
            .filter(x => x);
    }

    if (side === "them") return fromParty(trainerForSlot(line, "them", slot));
    if (isPartnerSlot(line, "you", slot)) return fromParty(trainerForSlot(line, "you", slot));

    /*
     * Your party, not the whole Box. A Pokémon in storage isn't at the fight -
     * it can't lead and it can't be switched to, so offering it would let a
     * plan be built on something that could never happen.
     */
    return teamRoster()
        .filter(entry => exclude.indexOf(entry.ref) < 0)
        .map(function(entry) {
            var species = GAME.species()[toID(entry.species)];
            if (!species) return null;
            return {
                ref: entry.ref, label: entry.nickname || species.name, species: species,
                level: entry.set.level ?? 100, dead: entry.dead
            };
        })
        .filter(x => x);
}

function renderPickerOptions(list, options, current, emptyText) {
    if (!options.length) {
        list.append(`<span class="planner-party-empty">${emptyText}</span>`);
        return;
    }
    options.forEach(function(option) {
        list.append(
            `<button class="planner-switch-option${current === option.ref ? " selected" : ""}${option.dead ? " dead" : ""}"
                     data-mon="${option.ref}"${option.dead ? " disabled" : ""}
                     title="${option.label}${option.level ? `, Lv. ${option.level}` : ""}${option.dead ? ", fainted" : ""}">
                <img src="${GAME.sprites.speciesIcon(option.species)}" alt="">
                <span>${option.label}</span>
            </button>`);
    });
}

/*
 * The same picker serves both: choosing to switch *instead* of attacking, and
 * naming who arrives after a move that has already switched its user out. They
 * ask the same question of the same roster and differ only in what the answer is
 * written to, so `EDITING_SWITCH_AFTER` is the whole of the difference.
 */
var EDITING_SWITCH_AFTER = false;

function openSwitchEditor(nodeId, side, slot, afterMove) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    if (!node) return;
    EDITING_SWITCH_NODE = nodeId;
    EDITING_SWITCH_SIDE = side;
    EDITING_SWITCH_SLOT = slot || 0;
    EDITING_SWITCH_AFTER = !!afterMove;

    /*
     * The move responsible is this slot's own when it switches itself out, and
     * the *other* side's when a Roar is dragging it out.
     */
    var forced = afterMove && !switchesUserOut(moveAt(node, side, EDITING_SWITCH_SLOT))
        ? phazedInto(node, side, EDITING_SWITCH_SLOT, slotCount(line)) : null;
    var move = !afterMove ? null
        : forced ? findMove(moveAt(node, side === "you" ? "them" : "you", forced.by))
        : findMove(moveAt(node, side, EDITING_SWITCH_SLOT));

    $("#planner-popup-container").html(switchEditorPopup).removeClass("hide").show();
    $(".planner-switch-popup legend").text(afterMove
        ? `After ${move ? move.name : "the move"}`
        : (side === "them" ? "They switch" : "Switch"));
    $(".planner-switch-popup .planner-hint").text(afterMove
        ? (forced
            ? `${move ? move.name : "The move"} drags this Pokémon out and something random in. The planner won't pick for you — say which one it was, and it walks into any hazards on the way.`
            : `${move ? move.name : "The move"} lands first and then takes its user off the field, so whoever comes in arrives after the damage — and walks into any hazards on the way.`)
        : side === "them"
            ? "They give up the turn to do this, so whoever comes in takes your attack. Your boosts stay; theirs reset."
            : "You give up the turn to do this, so whoever comes in takes their attack. Their boosts stay; yours reset.");
    $("#planner-clear-switch").text(afterMove
        ? "Nobody yet"
        : (side === "them" ? "They attack instead" : "Attack instead"));

    // Whoever is already out can't also be the one switching in.
    var onField = [monAt(node, side, 0), monAt(node, side, 1)].filter(x => x);
    renderPickerOptions($(".planner-switch-list"),
        slotOptionsFor(line, node, side, EDITING_SWITCH_SLOT, onField),
        afterMove ? switchAfterAt(node, side, EDITING_SWITCH_SLOT)
                  : switchTargetAt(node, side, EDITING_SWITCH_SLOT),
        side === "them" ? "Nobody else on their team." : "Nobody else on your team to switch to.");
}

/* -------------------------------------------------------------- slot picker */

var slotPickerPopup = `
<fieldset class="planner-switch-popup planner-slot-popup">
    <legend align="center">Choose a Pokémon</legend>
    <p class="planner-hint"></p>
    <div class="planner-switch-list"></div>
    <hr />
    <span class="buttons">
        <button id="planner-clear-slot" class="btn planner-btn">Leave empty</button>
        <button id="planner-cancel-slot" class="btn planner-btn">Cancel</button>
    </span>
</fieldset>`;

var EDITING_SLOT_NODE = "";
var EDITING_SLOT_SIDE = "you";
var EDITING_SLOT_INDEX = 0;

/*
 * Filling a slot without dragging. Dragging from a party strip is quicker when
 * the strips are open, but they fold away - and then there would be no way to
 * fill a slot at all.
 */
function openSlotPicker(nodeId, side, slot) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    if (!node) return;
    EDITING_SLOT_NODE = nodeId;
    EDITING_SLOT_SIDE = side;
    EDITING_SLOT_INDEX = slot;

    $("#planner-popup-container").html(slotPickerPopup).removeClass("hide").show();
    $(".planner-slot-popup .planner-hint").text(
        side === "them" ? "Which of theirs is out for this turn?"
            : isPartnerSlot(line, "you", slot) ? "Which of your partner's Pokémon is out? They act on their own, so this is what you expect to be there."
            : "Which of yours is out for this turn?");

    // The other slot on the same side is already taken.
    var other = monAt(node, side, slot === 0 ? 1 : 0);
    renderPickerOptions($(".planner-slot-popup .planner-switch-list"),
        slotOptionsFor(line, node, side, slot, other ? [other] : []),
        monAt(node, side, slot),
        side === "them" ? "This trainer has no Pokémon listed." : "Nothing on your team yet - add one from the box.");
}

function closeSlotPicker() {
    $("#planner-popup-container").hide().empty();
    EDITING_SLOT_NODE = "";
}

function setSlotMon(ref) {
    var line = currentLine();
    var node = line.nodes[EDITING_SLOT_NODE];
    if (!node) return;
    var slot = EDITING_SLOT_INDEX;
    if (EDITING_SLOT_SIDE === "you") {
        node.mons[slot] = ref;
        // Whatever it was doing probably isn't in the new Pokémon's set.
        node.actions[slot] = {type: "move", value: ""};
    } else {
        node.foes[slot] = ref;
        node.foeActions[slot] = {type: "move", value: ""};
    }
    saveLines();
    renderLine();
}

function closeSwitchEditor() {
    $("#planner-popup-container").hide().empty();
    EDITING_SWITCH_NODE = "";
    EDITING_SWITCH_SIDE = "you";
    EDITING_SWITCH_SLOT = 0;
}

// Writes to whichever side's action the picker was opened for.
function setSideAction(node, side, action) {
    var list = side === "them" ? node.foeActions : node.actions;
    list[EDITING_SWITCH_SLOT] = action;
}

// Who arrives after a U-turn. Lines saved before this field existed have none.
function setSwitchAfter(node, side, slot, ref) {
    if (!node.switchAfter) node.switchAfter = {you: ["", ""], them: ["", ""]};
    node.switchAfter[side][slot] = ref || "";
}

/* ---------------------------------------------------------------- held item */

var itemEditorPopup = `
<fieldset class="planner-item-popup">
    <legend align="center">Held Item</legend>
    <p class="planner-hint" id="planner-item-who"></p>
    <select class="planner-item-select"></select>
    <hr />
    <span class="buttons">
        <button id="planner-clear-item" class="btn planner-btn">Remove item</button>
        <button id="planner-cancel-item" class="btn planner-btn">Cancel</button>
        <button id="planner-save-item" class="btn planner-btn">Save</button>
    </span>
</fieldset>`;

var EDITING_ITEM_KEY = "";

// See trainerSelect(): select2 copies the class onto its own container.
function itemSelect() {
    return $("select.planner-item-select");
}

function openItemEditor(key) {
    var entry = boxEntry(key);
    if (!entry) return;
    EDITING_ITEM_KEY = key;

    $("#planner-popup-container").html(itemEditorPopup).removeClass("hide").show();
    $("#planner-item-who").text(`What is ${entry.nickname || entry.species} holding?`);

    var select = itemSelect();
    select.append(`<option value="">(nothing)</option>`);
    /*
     * Stored under the calculator's own item names, matching what the Box tab
     * writes, so the two stay interchangeable. Display uses the dex spelling,
     * which differs for a few ("Bright Powder" vs "BrightPowder").
     */
    Object.values(ITEMS)
        .filter(x => x.available !== false)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(function(item) {
            select.append(`<option value="${item.calcName || item.name}">${item.name}</option>`);
        });

    var current = entry.set.item ? ITEMS[toID(entry.set.item)] : null;
    select.val(current ? (current.calcName || current.name) : "");
    select.select2({width: "100%"});
}

function closeItemEditor() {
    var select = itemSelect();
    if (select.length && select.data("select2")) select.select2("destroy");
    $("#planner-popup-container").hide().empty();
    EDITING_ITEM_KEY = "";
}

// Writes straight back to the Box, which is where sets actually live.
function saveHeldItem(key, itemValue) {
    var entry = boxEntry(key);
    if (!entry) return;
    var customSets = JSON.parse(localStorage.customsets ?? "{}");
    var setName = entry.nickname || "Custom Set";
    if (!customSets[entry.species] || !customSets[entry.species][setName]) return;
    customSets[entry.species][setName].item = itemValue;
    localStorage.customsets = JSON.stringify(customSets);
    // The Box tab renders from the same store, so keep it in step.
    if (typeof reloadEncounters === "function") reloadEncounters();
}

/* ------------------------------------------------------------------ new line */

var newLinePopup = `
<fieldset class="planner-line-popup">
    <legend align="center">New Line</legend>
    <p class="planner-hint">Which fight is this line for? Start typing to filter.</p>
    <select class="planner-trainer-select"></select>
    <hr />
    <span class="buttons">
        <button id="planner-cancel-line" class="btn planner-btn">Cancel</button>
        <button id="planner-create-line" class="btn planner-btn">Create</button>
    </span>
</fieldset>`;

/*
 * There are ~485 trainers and plenty of near-identical names ("Galactic Mars #1"
 * vs "#2"), so this is a select2 dropdown with its filter box rather than a
 * free-text match - the same control the calculator uses elsewhere.
 */
/*
 * select2 3.x copies the original element's classes onto the container it
 * generates, so ".planner-trainer-select" matches both the <select> and a <div>.
 * jQuery reads the first match, which would be the div - hence the `select.`
 * qualifier everywhere the value is read.
 */
function trainerSelect() {
    return $("select.planner-trainer-select");
}

function openNewLineEditor() {
    $("#planner-popup-container").html(newLinePopup).removeClass("hide").show();

    var select = trainerSelect();
    trainerList().forEach(function(trainer) {
        select.append(`<option value="${trainer.name}">${trainer.name}</option>`);
    });
    /*
     * Not dropdownAutoWidth: trainer names like "Pokémon Trainer Barry #1
     * [Chimchar]" are wider than the dialog, and auto-width sizes the list to
     * the longest one, spilling it well outside the panel. Pinning it to the
     * control's width keeps it contained and lets long names ellipsize.
     */
    select.select2({width: "100%"});
    // Opening it straight away puts the cursor in the filter box.
    select.select2("open");
}

function closeNewLineEditor() {
    var select = trainerSelect();
    // select2 parks its dropdown outside the container, so it has to be torn
    // down explicitly or it survives the popup being emptied.
    if (select.length && select.data("select2")) select.select2("destroy");
    $("#planner-popup-container").hide().empty();
}

var edgeEditorPopup = `
<fieldset class="planner-edge-popup">
    <legend align="center">Edit Branch</legend>
    <p class="planner-hint">What has to happen for the fight to take this path?</p>
    <div class="planner-condition-grid"></div>
    <hr />
    <div class="planner-form">
        <label>Custom label</label><input class="planner-edit-edge-label" type="text" placeholder="Optional" title="Overrides the condition chosen above" />
    </div>
    <hr />
    <span class="buttons">
        <button id="planner-delete-edge" class="btn planner-btn">Delete branch</button>
        <button id="planner-cancel-edge" class="btn planner-btn">Cancel</button>
        <button id="planner-save-edge" class="btn planner-btn">Save</button>
    </span>
</fieldset>`;

var EDITING_EDGE = "";
var EDITING_CONDITION = "";

function openEdgeEditor(edgeId) {
    var edge = currentLine().edges[edgeId];
    if (!edge) return;
    EDITING_EDGE = edgeId;
    EDITING_CONDITION = conditionFor(edge).id;

    $("#planner-popup-container").html(edgeEditorPopup).removeClass("hide").show();
    renderConditionGrid();
    $(".planner-edit-edge-label").val(edge.label || "");
}

function closeEdgeEditor() {
    $("#planner-popup-container").hide().empty();
    EDITING_EDGE = "";
    EDITING_CONDITION = "";
}

// Grouped by who caused the fork, since that's how you think about it.
function renderConditionGrid() {
    var groups = [
        {title: "Something you did", side: "you"},
        {title: "Something they did", side: "them"},
        {title: "No condition", side: ""}
    ];
    var grid = $(".planner-condition-grid").empty();
    groups.forEach(function(group) {
        var ids = Object.keys(EDGE_CONDITIONS).filter(function(id) {
            return EDGE_CONDITIONS[id].side === group.side && id !== "custom";
        });
        if (!ids.length) return;
        grid.append(`<div class="planner-condition-group"><span class="planner-condition-title">${group.title}</span>${
            ids.map(function(id) {
                var condition = EDGE_CONDITIONS[id];
                return `<button class="planner-condition ${condition.color}${EDITING_CONDITION === id ? " selected" : ""}" data-condition="${id}">${condition.name}</button>`;
            }).join("")
        }</div>`);
    });
}

/* -------------------------------------------------------------- node editor */


/* --------------------------------------------------------------- drag/drop */

function beginDrag(e, nodeId) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    var canvas = $(".planner-canvas")[0].getBoundingClientRect();
    DRAG = {
        node: nodeId,
        offsetX: e.clientX - canvas.left - node.x,
        offsetY: e.clientY - canvas.top - node.y
    };
}

/* ------------------------------------------------- dragging in a Pokémon */

/*
 * Dragging out of a party strip. The strips sit outside the canvas, so the drag
 * is tracked on the document and a sprite follows the cursor to show what's in
 * hand. Dropping on a turn fills that side of it; dropping on empty canvas
 * starts a new turn already holding the Pokémon.
 */
function beginMonDrag(e, key, side, sprite, owner) {
    MON_DRAG = {ref: key, side: side, owner: owner || 0};
    $("<img class='planner-drag-ghost'>").attr("src", sprite).appendTo("body");
    moveMonGhost(e);
    $(".planner-canvas").addClass("assigning");
}

function moveMonGhost(e) {
    $(".planner-drag-ghost").css({left: `${e.clientX + 12}px`, top: `${e.clientY + 12}px`});
}

function endMonDrag() {
    MON_DRAG = null;
    $(".planner-drag-ghost").remove();
    $(".planner-canvas").removeClass("assigning");
}

// Puts the dragged Pokémon on the right side of a turn, clearing anything that
// no longer applies to it.
function assignDraggedMon(node, slot) {
    slot = slot || 0;
    /*
     * A partner only ever occupies the second slot, and in a two-trainer fight
     * each trainer owns one slot - so dropping one of their Pokemon anywhere on
     * the card puts it where it actually belongs.
     */
    if (MON_DRAG.side === "partner") {
        node.mons[1] = MON_DRAG.ref;
        node.actions[1] = {type: "move", value: ""};
        return;
    }
    /*
     * With two opposing trainers, a Pokémon can only stand in its own trainer's
     * slot, so the owner decides where it lands regardless of where it was
     * dropped. Checked against undefined rather than truthiness - the first
     * trainer's index is 0. A single trainer fielding two Pokémon is free to
     * use either slot, so this doesn't apply there.
     */
    if (MON_DRAG.side === "them" && MON_DRAG.owner !== undefined &&
        battleFormat(currentLine().trainer).trainers.length > 1) {
        slot = MON_DRAG.owner;
    }
    if (MON_DRAG.side === "you") {
        node.mons[slot] = MON_DRAG.ref;
        // The previous move probably isn't in this Pokémon's set.
        // The previous move probably isn't in this Pokemon's set.
        if (node.actions[slot] && node.actions[slot].type === "move") {
            var entry = boxEntry(MON_DRAG.ref);
            var moves = entry && entry.set.moves ? entry.set.moves : [];
            if (moves.indexOf(node.actions[slot].value) < 0) node.actions[slot] = {type: "move", value: ""};
        }
    } else {
        node.foes[slot] = MON_DRAG.ref;
        node.foeActions[slot] = {type: "move", value: ""};
    }
}

/*
 * Which slot the cursor was over when a Pokemon was dropped. Dropping on the
 * card but not on a particular slot falls back to the first.
 */
/*
 * Storage isn't the battlefield. Refusing this out loud beats letting a plan be
 * built on a Pokemon that could never actually be there.
 */
function rejectBoxedDrop() {
    if (!MON_DRAG || !MON_DRAG.fromBox) return false;
    var entry = boxEntry(MON_DRAG.ref);
    var name = entry ? (entry.nickname || entry.species) : "That Pokémon";
    endMonDrag();
    alert(`${name} is in the box, so it isn't at this fight.

Drag it onto your team first, then it can take a turn.`);
    return true;
}

function slotUnder(e) {
    var slot = $(e.target).closest(".planner-slot");
    return slot.length ? parseInt(slot.attr("data-slot"), 10) || 0 : 0;
}

function dropMonOnNode(nodeId, slot) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    if (!node) return endMonDrag();
    if (rejectBoxedDrop()) return;
    assignDraggedMon(node, slot);
    endMonDrag();
    saveLines();
    renderLine();
}

function dropMonOnEmpty(e) {
    if (rejectBoxedDrop()) return;
    var line = currentLine();
    var canvas = $(".planner-canvas")[0];
    var rect = canvas.getBoundingClientRect();
    var width = $(".planner-node").outerWidth() || 288;

    var node = newNode(
        Math.max(0, e.clientX - rect.left + canvas.scrollLeft - width / 2),
        Math.max(0, e.clientY - rect.top + canvas.scrollTop));
    node.movesOpen = true;
    assignDraggedMon(node);
    line.nodes[node.id] = node;

    endMonDrag();
    saveLines();
    renderLine();
}

function beginConnect(e, nodeId) {
    CONNECTING = {from: nodeId};
    $(".planner-canvas").addClass("connecting");
}

/*
 * Dropping a branch on empty canvas means "a new turn follows this one", so
 * make it rather than throwing the drag away.
 *
 * The turn is left empty and the branch unlabelled rather than opening an editor
 * for each: filling a card in is the fast part, and being handed two dialogs
 * before you have even seen where the turn landed is a lot to read through for
 * something you are usually about to do on the card anyway. Both are reachable
 * when wanted - Edit on the card, and the arrow's own label.
 */
function finishConnectToEmpty(e) {
    var line = currentLine();
    var canvas = $(".planner-canvas")[0];
    var rect = canvas.getBoundingClientRect();
    var width = $(".planner-node").outerWidth() || 274;

    // Arrows enter at the top centre, so drop the card under the cursor there.
    var node = newNode(
        Math.max(0, e.clientX - rect.left + canvas.scrollLeft - width / 2),
        Math.max(0, e.clientY - rect.top + canvas.scrollTop));
    copyTurnInto(node, line.nodes[CONNECTING.from]);
    node.movesOpen = true;
    line.nodes[node.id] = node;

    var edge = newEdge(CONNECTING.from, node.id, "always");
    line.edges[edge.id] = edge;

    CONNECTING = null;
    $(".planner-canvas").removeClass("connecting");
    saveLines();
    renderLine();
}

function finishConnect(toNodeId) {
    var line = currentLine();
    if (!CONNECTING || CONNECTING.from === toNodeId) {
        CONNECTING = null;
        $(".planner-canvas").removeClass("connecting");
        return;
    }
    // A fresh branch starts unlabelled, so repeating the drag before naming the
    // last one would just stack identical arrows on top of each other. Keep the
    // first instead of adding a second saying exactly the same nothing.
    if (!findDuplicateEdge(line, CONNECTING.from, toNodeId, "always", "")) {
        var edge = newEdge(CONNECTING.from, toNodeId, "always");
        line.edges[edge.id] = edge;
        saveLines();
    }
    CONNECTING = null;
    $(".planner-canvas").removeClass("connecting");
    /*
     * Joining two turns gives the second one a parent to inherit from, so the
     * whole line below is re-derived rather than only the arrow being drawn.
     */
    renderLine();
}

/* ---------------------------------------------------------------- bootstrap */

function initPlanner() {
    loadLines();
    applyPartiesFold();
    applyBlindMode();
    // Open the first line rather than landing on an empty placeholder when
    // there's an obvious one to show.
    var first = Object.keys(LINES)[0];
    if (first) {
        selectLine(first);
    } else {
        renderLineList();
        renderLine();
    }

    $("#planner-new-line").on("click", openNewLineEditor);

    renderSplitList();
    $(document).on("click", ".planner-split-btn", function() {
        setUpSplit($(this).attr("data-split"));
    });

    $(document).on("click", "#planner-cancel-line", function() {
        closeNewLineEditor();
    });

    $(document).on("click", "#planner-create-line", function() {
        var trainer = trainerSelect().val();
        if (!trainer) {
            // Silently doing nothing here just looks like a broken button.
            alert("Pick a trainer first.");
            return;
        }
        closeNewLineEditor();
        var line = addLine(newLine(trainer));
        renderLineList();
        selectLine(line.id);
    });

    $("#planner-add-node").on("click", function() {
        var line = currentLine();
        if (!line) return;
        // Stagger new cards so they don't land on top of each other.
        var count = Object.keys(line.nodes).length;
        var node = newNode(40 + (count % 3) * 260, 40 + Math.floor(count / 3) * 190);
        line.nodes[node.id] = node;
        saveLines();
        renderLine();
    });

    // Node interactions are delegated, since cards are re-rendered constantly.
    $(".planner-canvas").on("mousedown", ".planner-node-handle", function(e) {
        e.preventDefault();
        e.stopPropagation();
        beginConnect(e, $(this).closest(".planner-node").attr("data-node"));
    });

    $(".planner-canvas").on("mousedown", ".planner-node", function(e) {
        if ($(e.target).is("button") || $(e.target).hasClass("planner-node-handle")) return;
        if (CONNECTING) return;
        e.preventDefault();
        beginDrag(e, $(this).attr("data-node"));
    });

    $(".planner-canvas").on("mouseup", ".planner-node", function(e) {
        if (MON_DRAG) return dropMonOnNode($(this).attr("data-node"), slotUnder(e));
        if (CONNECTING) finishConnect($(this).attr("data-node"));
    });

    // Bound directly rather than delegated, so it runs after the handler above
    // has had its chance: if the drag survives, the drop missed every card.
    $(".planner-canvas").on("mouseup", function(e) {
        if (MON_DRAG) return dropMonOnEmpty(e);
        if (!CONNECTING) return;
        finishConnectToEmpty(e);
    });

    $(document).on("mousemove", function(e) {
        if (MON_DRAG) moveMonGhost(e);
        if (!DRAG) return;
        var line = currentLine();
        var node = line.nodes[DRAG.node];
        var canvas = $(".planner-canvas")[0].getBoundingClientRect();
        DRAG.moved = true;
        node.x = Math.max(0, e.clientX - canvas.left - DRAG.offsetX);
        node.y = Math.max(0, e.clientY - canvas.top - DRAG.offsetY);
        $(`.planner-node[data-node="${node.id}"]`).css({left: `${node.x}px`, top: `${node.y}px`});
        renderEdges();
    });

    $(document).on("mouseup", function() {
        if (DRAG) {
            if (DRAG.moved) SUPPRESS_SLOT_CLICK = true;
            saveLines();
            DRAG = null;
        }
        if (CONNECTING) {
            CONNECTING = null;
            $(".planner-canvas").removeClass("connecting");
        }
        // Released outside the canvas: drop it rather than leaving a stuck ghost.
        if (MON_DRAG) endMonDrag();
    });

    $(".planner-canvas").on("click", ".planner-fold-node", function(e) {
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        node.collapsed = !node.collapsed;
        saveLines();
        renderLine();
    });

    $(".planner-canvas").on("click", ".planner-edit-node", function() {
        openNodeEditor($(this).closest(".planner-node").attr("data-node"));
    });

    $(".planner-canvas").on("click", ".planner-remove-node", function() {
        var line = currentLine();
        var id = $(this).closest(".planner-node").attr("data-node");
        delete line.nodes[id];
        // Drop any branch that pointed at it, or it renders as a dangling arrow.
        for (var edgeId in line.edges) {
            if (line.edges[edgeId].from === id || line.edges[edgeId].to === id) delete line.edges[edgeId];
        }
        saveLines();
        renderLine();
    });

    // Click the item line on one of your own cards to change what it holds.
    $(".planner-your-party").on("mousedown", ".planner-card-item.editable", function(e) {
        // Beat the card's drag handler to it.
        e.preventDefault();
        e.stopPropagation();
    });

    $(".planner-your-party").on("click", ".planner-card-item.editable", function(e) {
        e.stopPropagation();
        openItemEditor($(this).closest(".planner-mine").attr("data-mon"));
    });

    $(document).on("click", "#planner-cancel-item", function() {
        closeItemEditor();
    });

    $(document).on("click", "#planner-clear-item", function() {
        saveHeldItem(EDITING_ITEM_KEY, "");
        closeItemEditor();
        renderLine();
    });

    $(document).on("click", "#planner-save-item", function() {
        saveHeldItem(EDITING_ITEM_KEY, itemSelect().val() || "");
        closeItemEditor();
        renderLine();
    });

    $(".planner-box-prev").on("click", function() {
        BOX_PAGE -= 1;
        renderBoxPage();
    });

    $(".planner-box-next").on("click", function() {
        BOX_PAGE += 1;
        renderBoxPage();
    });

    // Drag a Pokémon out of any strip and drop it on a turn.
    $(".planner-your-party").on("mousedown", ".planner-mine", function(e) {
        e.preventDefault();
        beginMonDrag(e, $(this).attr("data-mon"), "you", $(this).find("img").attr("src"));
    });

    /*
     * A boxed Pokemon can be dragged, but only to reorganise the party - it is
     * in storage, so it can't be put straight into a turn.
     */
    $(".planner-box-party").on("mousedown", ".planner-mine", function(e) {
        e.preventDefault();
        beginMonDrag(e, $(this).attr("data-mon"), "you", $(this).find("img").attr("src"));
        MON_DRAG.fromBox = true;
    });

    $(".planner-foe-party").on("mousedown", ".planner-foe", function(e) {
        e.preventDefault();
        beginMonDrag(e, $(this).attr("data-foe"), "them", $(this).find("img").attr("src"),
            parseInt($(this).attr("data-owner"), 10) || 0);
    });

    $(".planner-partner-party").on("mousedown", ".planner-partner-mon", function(e) {
        e.preventDefault();
        beginMonDrag(e, $(this).attr("data-partner"), "partner", $(this).find("img").attr("src"));
    });

    // Dropped onto a specific team member: the two trade places.
    $(".planner-your-party").on("mouseup", ".planner-mine", function(e) {
        if (!MON_DRAG || MON_DRAG.side !== "you") return;
        e.stopPropagation();
        swapIntoTeam(MON_DRAG.ref, $(this).attr("data-mon"));
        endMonDrag();
        renderLine();
    });

    // Dropped on the strip's empty space: just join the team if there's room.
    $(".planner-your-party").on("mouseup", function() {
        if (!MON_DRAG || MON_DRAG.side !== "you") return;
        var result = addToTeam(MON_DRAG.ref);
        endMonDrag();
        if (!result.ok) return alert(result.reason);
        renderLine();
    });

    $(".planner-box-party").on("mouseup", function() {
        if (!MON_DRAG || MON_DRAG.side !== "you") return;
        removeFromTeam(MON_DRAG.ref);
        endMonDrag();
        renderLine();
    });

    $(".planner-canvas").on("mousedown", ".planner-switch-btn", function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    /*
     * Left-click fills a slot, right-click empties it. Suppressed when the card
     * was actually dragged, since a drag ends in a click too.
     */
    $(".planner-canvas").on("click", ".planner-slot", function(e) {
        if (SUPPRESS_SLOT_CLICK) { SUPPRESS_SLOT_CLICK = false; return; }
        if ($(e.target).is("button")) return;
        e.stopPropagation();
        openSlotPicker($(this).closest(".planner-node").attr("data-node"),
            $(this).attr("data-side"), parseInt($(this).attr("data-slot"), 10) || 0);
    });

    $(document).on("click", ".planner-slot-popup .planner-switch-option", function(e) {
        e.stopPropagation();
        setSlotMon($(this).attr("data-mon"));
        closeSlotPicker();
    });

    $(document).on("click", "#planner-clear-slot", function() {
        setSlotMon("");
        closeSlotPicker();
    });

    $(document).on("click", "#planner-cancel-slot", function() {
        closeSlotPicker();
    });

    /*
     * Right-click empties a slot. Clearing is common enough while reshuffling a
     * plan that routing it through the turn editor was busywork, and there is
     * no other use for the context menu on a card.
     */
    $(".planner-canvas").on("contextmenu", ".planner-slot", function(e) {
        e.preventDefault();
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        var side = $(this).attr("data-side");
        var slot = parseInt($(this).attr("data-slot"), 10) || 0;
        if (!monAt(node, side, slot)) return;

        if (side === "you") {
            node.mons[slot] = "";
            node.actions[slot] = {type: "move", value: ""};
        } else {
            node.foes[slot] = "";
            node.foeActions[slot] = {type: "move", value: ""};
        }
        saveLines();
        // Emptying a slot changes what every later turn inherits.
        renderLine();
    });

    $(".planner-canvas").on("click", ".planner-switch-btn", function(e) {
        e.stopPropagation();
        // Trapped and not already switching: there is nothing legal to pick.
        if ($(this).hasClass("trapped")) return;
        openSwitchEditor($(this).closest(".planner-node").attr("data-node"),
            $(this).attr("data-side") || "you",
            parseInt($(this).attr("data-slot"), 10) || 0);
    });

    $(document).on("click", ".planner-switch-option", function() {
        // The slot picker reuses this markup and has its own handler.
        if ($(this).closest(".planner-slot-popup").length) return;
        var line = currentLine();
        var node = line.nodes[EDITING_SWITCH_NODE];
        if (!node) return closeSwitchEditor();
        if (EDITING_SWITCH_AFTER) setSwitchAfter(node, EDITING_SWITCH_SIDE, EDITING_SWITCH_SLOT, $(this).attr("data-mon"));
        else setSideAction(node, EDITING_SWITCH_SIDE, {type: "switch", value: $(this).attr("data-mon")});
        saveLines();
        closeSwitchEditor();
        // Switching changes who is out for every turn after this one.
        renderLine();
    });

    $(document).on("click", "#planner-clear-switch", function() {
        var line = currentLine();
        var node = line.nodes[EDITING_SWITCH_NODE];
        if (node) {
            if (EDITING_SWITCH_AFTER) setSwitchAfter(node, EDITING_SWITCH_SIDE, EDITING_SWITCH_SLOT, "");
            else setSideAction(node, EDITING_SWITCH_SIDE, {type: "move", value: ""});
            saveLines();
        }
        closeSwitchEditor();
        renderLine();
    });

    $(".planner-canvas").on("mousedown", ".planner-selfswitch-btn", function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    $(".planner-canvas").on("click", ".planner-selfswitch-btn", function(e) {
        e.stopPropagation();
        openSwitchEditor($(this).closest(".planner-node").attr("data-node"),
            $(this).attr("data-side") || "you",
            parseInt($(this).attr("data-slot"), 10) || 0, true);
    });

    $(document).on("click", "#planner-cancel-switch", function() {
        closeSwitchEditor();
    });

    // Choosing either side's move for the turn, straight from the card.
    $(".planner-canvas").on("click", ".planner-move", function(e) {
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        var move = $(this).attr("data-move");
        var slot = parseInt($(this).attr("data-slot"), 10) || 0;

        if ($(this).attr("data-side") === "you") {
            // Clicking the chosen move again clears it.
            var current = moveAt(node, "you", slot);
            node.actions[slot] = {type: "move", value: current === move ? "" : move};
        } else {
            node.foeActions[slot] = {type: "move", value: moveAt(node, "them", slot) === move ? "" : move};
        }
        saveLines();
        // Both sides feed the state of every turn below this one.
        renderLine();
    });

    $(".planner-canvas").on("click", ".planner-aim-btn", function(e) {
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        var side = $(this).attr("data-side");
        var slot = parseInt($(this).attr("data-slot"), 10) || 0;
        var aim = parseInt($(this).attr("data-aim"), 10) || 0;
        if (!node.aimedAt) node.aimedAt = {you: [null, null], them: [null, null]};
        // Clicking the current target again goes back to "whoever is across".
        node.aimedAt[side][slot] = aimAt(node, side, slot) === aim ? null : aim;
        saveLines();
        renderLine();
    });

    /*
     * "Its berry went off here." A statement about this turn, so it lives on the
     * node like every other seed - and like every other seed it overrules the
     * arithmetic rather than asking it. Clicking again takes it back.
     */
    $(".planner-canvas").on("click", ".planner-item-pip.use", function(e) {
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        var side = $(this).attr("data-side");
        var slot = parseInt($(this).attr("data-slot"), 10) || 0;
        if (!node.itemSeed) node.itemSeed = {you: [false, false], them: [false, false]};
        node.itemSeed[side][slot] = !itemStatedAt(node, side, slot);
        saveLines();
        // The item changes health, so every turn below this one is re-derived.
        renderLine();
    });

    $(".planner-canvas").on("click", ".planner-moves-toggle", function(e) {
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        node.movesOpen = !node.movesOpen;
        saveLines();
        renderLine();
    });

    $("#planner-toggle-parties").on("click", function() {
        localStorage.plannerPartiesOpen = partiesOpen() ? "false" : "true";
        applyPartiesFold();
    });

    $("#planner-toggle-blind").on("click", function() {
        setBlindMode(!blindMode());
        applyBlindMode();
        // Every card changes: the whole point is that the derivation changes too.
        renderLine();
    });

    $("#planner-toggle-moves").on("click", function() {
        var line = currentLine();
        if (!line) return;
        // Collapse everything unless it's all collapsed already.
        var anyOpen = Object.values(line.nodes).some(n => n.movesOpen);
        Object.values(line.nodes).forEach(n => { n.movesOpen = !anyOpen; });
        saveLines();
        renderLine();
    });

    // Dragging a card shouldn't start from its move list.
    $(".planner-canvas").on("mousedown", ".planner-move, .planner-moves-toggle", function(e) {
        e.stopPropagation();
    });

    // Delegated, since the editor markup is rebuilt on every open.
    $(document).on("click", ".planner-condition", function() {
        EDITING_CONDITION = $(this).attr("data-condition");
        renderConditionGrid();
    });

    $(document).on("click", "#planner-save-edge", function() {
        var line = currentLine();
        var edge = line.edges[EDITING_EDGE];
        var label = $(".planner-edit-edge-label").val().trim();
        // A custom label with no condition picked still needs somewhere to sit.
        var condition = EDITING_CONDITION || (label ? "custom" : "always");

        var clash = findDuplicateEdge(line, edge.from, edge.to, condition, label, edge.id);
        if (clash) {
            alert(`These two turns are already joined by a "${label || EDGE_CONDITIONS[condition].name}" branch.\n\nGive this one a different condition or label, or delete it.`);
            return;
        }

        edge.label = label;
        edge.condition = condition;
        saveLines();
        closeEdgeEditor();
        /*
         * The whole line, not just the arrows. A condition is not decoration: it
         * settles which way the roll went, so changing one re-derives the health
         * of every turn below it - and, for a crit, the damage figures on the
         * turn above. Redrawing the arrow alone left all of that showing the
         * previous branch's arithmetic until something else forced a render.
         */
        renderLine();
    });

    $(document).on("click", "#planner-cancel-edge", function() {
        closeEdgeEditor();
    });

    $(document).on("click", "#planner-delete-edge", function() {
        if (!confirm("Delete this branch?")) return;
        delete currentLine().edges[EDITING_EDGE];
        saveLines();
        closeEdgeEditor();
        // State inheritance follows the edges, so the cards below need redrawing.
        renderLine();
    });

    $(document).on("click", "#planner-cancel-node", function() {
        closeNodeEditor();
    });

    $(document).on("click", "#planner-save-node", function() {
        var line = currentLine();
        var node = line.nodes[EDITING_NODE];
        // Everything writes per slot; the dialog only rendered occupied ones,
        // so anything it didn't show keeps its empty default.
        node.statusSeed = {you: ["", ""], them: ["", ""]};
        $("select.planner-edit-status").each(function() {
            node.statusSeed[$(this).attr("data-side")][parseInt($(this).attr("data-slot"), 10) || 0] =
                $(this).val() || "";
        });

        // Only non-zero stages are kept, so an untouched turn stores nothing.
        node.boostSeed = {you: [{}, {}], them: [{}, {}]};
        $(".planner-boost-edit").each(function() {
            var target = node.boostSeed[$(this).attr("data-side")][parseInt($(this).attr("data-slot"), 10) || 0];
            $(this).find("input[data-stat]").each(function() {
                var value = parseInt($(this).val(), 10) || 0;
                if (value) target[$(this).attr("data-stat")] = value;
            });
        });

        /*
         * A blank field means "inherit", which is a different thing from 0 - so
         * this checks for an empty string rather than leaning on falsiness.
         */
        node.hpSeed = {you: [null, null], them: [null, null]};
        $(".planner-edit-hp").each(function() {
            var raw = $(this).val();
            if (raw === "" || raw === null) return;
            var pct = Math.max(0, Math.min(100, parseInt(raw, 10)));
            if (isNaN(pct)) return;
            node.hpSeed[$(this).attr("data-side")][parseInt($(this).attr("data-slot"), 10) || 0] = pct;
        });

        node.skipped = {you: [false, false], them: [false, false]};
        $(".planner-skip.selected").each(function() {
            node.skipped[$(this).attr("data-side")][parseInt($(this).attr("data-slot"), 10) || 0] = true;
        });

        node.volatileSeed = {you: [[], []], them: [[], []]};
        node.volatileClear = {you: [[], []], them: [[], []]};
        $(".planner-volatiles").each(function() {
            var side = $(this).attr("data-side");
            var slot = parseInt($(this).attr("data-slot"), 10) || 0;
            var edits = volatileEdits(side, slot);
            node.volatileSeed[side][slot] = edits.add;
            node.volatileClear[side][slot] = edits.clear;
        });
        node.note = $(".planner-edit-note").val();
        saveLines();
        closeNodeEditor();
        renderLine();
    });

    $(document).on("click", ".planner-volatile", function() {
        $(this).toggleClass("selected neutral");
    });

    $(document).on("click", ".planner-skip", function() {
        $(this).toggleClass("selected bad");
    });

    // Panels all stay in the DOM; only which one is on top changes, so saving
    // still reads every slot whichever tab happens to be open.
    $(document).on("click", ".planner-tab", function() {
        var side = $(this).attr("data-side");
        var slot = $(this).attr("data-slot");
        $(".planner-tab").removeClass("active");
        $(this).addClass("active");
        $(".planner-tab-panel").removeClass("active")
            .filter(`[data-side="${side}"][data-slot="${slot}"]`).addClass("active");
    });
}

$(document).ready(function() {
    initPlanner();
});
