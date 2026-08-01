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
}

function selectLine(id) {
    CURRENT_LINE = id;
    renderLineList();
    renderLine();
}

/* -------------------------------------------------------------- foe display */

function renderFoeParty() {
    var strip = $(".planner-foe-party").empty();
    var line = currentLine();
    if (!line) return;

    var setdex = GAME.setdex();
    var party = GAME.partyOrder()[line.trainer] || [];
    for (var i in party) {
        var speciesName = party[i];
        var species = GAME.species()[toID(speciesName)];
        if (!species) continue;
        var set = setdex[speciesName] && setdex[speciesName][line.trainer];
        var item = set && set.item ? ITEMS[toID(set.item)] : null;
        strip.append(
            `<span class="planner-foe planner-card" data-foe="${speciesName}" title="${speciesName}">
                <img class="planner-card-sprite" src="${GAME.sprites.species(species)}" alt="${speciesName}">
                <span class="planner-card-name">${species.name}</span>
                <span class="planner-card-meta">${set ? `Lv. ${set.level}` : ""}</span>
                ${renderCardItem(item)}
            </span>`);
    }

    // AI flags decide how much branching a fight actually needs, so they belong
    // next to the party rather than buried in a tooltip.
    var flags = GAME.aiFlags()[line.trainer];
    var badges = $(".planner-ai-flags").empty();
    if (flags) {
        var active = Object.keys(flags).filter(x => flags[x]);
        if (active.length) {
            badges.append(`<span class="planner-flag-label">AI:</span>`);
            for (var j in active) {
                badges.append(`<span class="planner-flag" title="${aiFlagHint(active[j])}">${active[j]}</span>`);
            }
        }
    }
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
                   data-mon="${entry.key}"
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
                `<span class="planner-mine compact${entry.dead ? " dead" : ""}" data-mon="${entry.key}" title="${title}">
                    <img class="planner-mine-icon" src="${GAME.sprites.speciesIcon(species)}" alt="${entry.species}">
                </span>`);
            return;
        }
        var item = entry.set.item ? ITEMS[toID(entry.set.item)] : null;
        strip.append(
            `<span class="planner-mine planner-card${entry.dead ? " dead" : ""}" data-mon="${entry.key}" title="${title}">
                <img class="planner-card-sprite" src="${GAME.sprites.species(species)}" alt="${entry.species}">
                <span class="planner-card-name">${entry.nickname || species.name}</span>
                <span class="planner-card-meta">Lv. ${level}</span>
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

    var visible = visibleNodes(line);
    for (var id in line.nodes) {
        if (visible[id]) renderNode(line.nodes[id], line, visible);
    }
    renderEdges(visible);
}

function renderNode(node, line, visible) {
    line = line || currentLine();
    var mon = node.mon ? boxEntry(node.mon) : null;
    var monSpecies = mon ? GAME.species()[toID(mon.species)] : null;
    var foeSpecies = node.foe ? GAME.species()[toID(node.foe)] : null;
    var set = foeSet(line, node);
    var state = computeNodeState(line, node.id);

    $(".planner-canvas-nodes").append(
        `<div class="planner-node${mon && mon.dead ? " dead" : ""}${node.collapsed ? " has-folded" : ""}" data-node="${node.id}" style="left: ${node.x}px; top: ${node.y}px;">
            ${renderStateBar(state)}
            <div class="planner-node-head">
                <span class="planner-node-side">
                    ${monSpecies ? `<img class="planner-sprite" src="${GAME.sprites.species(monSpecies)}" alt="">` : `<span class="planner-node-blank">?</span>`}
                    <span>${mon ? (mon.nickname || mon.species) : "Pick a Pokémon"}</span>
                    ${renderStatus(state.you)}
                    ${renderBoosts(state.you.boosts)}
                    <span class="planner-chosen">${nodeActionText(node)}</span>
                </span>
                <span class="planner-node-vs">vs</span>
                <span class="planner-node-side foe">
                    ${foeSpecies ? `<img class="planner-sprite" src="${GAME.sprites.species(foeSpecies)}" alt="">` : `<span class="planner-node-blank">?</span>`}
                    <span>${foeSpecies ? foeSpecies.name : "any"}${set ? ` <em>Lv.${set.level}</em>` : ``}</span>
                    ${renderStatus(state.them)}
                    ${renderBoosts(state.them.boosts)}
                    <span class="planner-chosen">${chosenMoveText(node.foeMove)}</span>
                </span>
            </div>
            ${renderStatusBlock(line, state)}
            ${renderMovePickers(node, mon, set)}
            ${node.note ? `<div class="planner-node-note">${node.note}</div>` : ``}
            <div class="planner-node-buttons">
                ${renderFoldControl(node, line, visible)}
                <button class="planner-edit-node btn planner-btn small">Edit</button>
                <button class="planner-remove-node btn planner-btn small">Remove</button>
            </div>
            <div class="planner-node-handle" title="Drag onto another turn to branch to it, or onto empty space to make a new one"></div>
        </div>`);
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
function renderMovePickers(node, mon, set) {
    var yourMoves = mon && mon.set.moves ? mon.set.moves : [];
    var theirMoves = set && set.moves ? set.moves : [];
    if (!yourMoves.length && !theirMoves.length) return "";

    if (!node.movesOpen) {
        return `<div class="planner-moves collapsed"><button class="planner-moves-toggle" title="Show both movesets">Moves</button></div>`;
    }

    return `<div class="planner-moves">
        <button class="planner-moves-toggle open" title="Hide the movesets">Moves</button>
        <div class="planner-move-columns">
            <div class="planner-move-column">
                <span class="planner-move-column-title">Yours</span>
                ${renderMoveList(yourMoves, node.action && node.action.type === "move" ? node.action.value : "", "you")}
            </div>
            <div class="planner-move-column">
                <span class="planner-move-column-title">Theirs</span>
                ${renderMoveList(theirMoves, node.foeMove, "them")}
            </div>
        </div>
    </div>`;
}

function renderMoveList(moves, selected, side) {
    if (!moves.length) {
        return `<span class="planner-move-empty">${side === "you" ? "Pick a Pokémon first" : "Pick an opponent first"}</span>`;
    }
    return moves.map(function(name) {
        var move = findMove(name);
        var isSelected = selected === name;
        if (!move) {
            return `<span class="planner-move ${side}${isSelected ? " selected" : ""}" data-move="${name}" data-side="${side}">${name}</span>`;
        }
        var power = move.category === "status" ? "—" : move.basePower;
        return `<span class="planner-move ${side}${isSelected ? " selected" : ""}" data-move="${name}" data-side="${side}"
                      title="${move.name} — ${move.category}, ${move.basePower || 0} BP, ${move.accuracy || "—"}% acc">
            <img src="${GAME.sprites.type(move.type)}" alt="">
            <span class="planner-move-name">${move.name}</span>
            <span class="planner-move-bp">${power}</span>
            ${NO_DROP_MOVES.indexOf(move.id) >= 0 ? `<span class="planner-nodrop" title="Platinum Kaizo removes this move's stat drop - it has no drawback here.">nd</span>` : ``}
        </span>`;
    }).join("");
}

// The move shown under a sprite once it's been chosen.
function chosenMoveText(name) {
    if (!name) return `<span class="planner-node-blank">—</span>`;
    var move = findMove(name);
    if (!move) return `<b>${name}</b> <span class="planner-node-warn" title="This game has no move by that name.">?</span>`;
    return `<img class="planner-move-type" src="${GAME.sprites.type(move.type)}" alt=""> <b>${move.name}</b>` +
        (NO_DROP_MOVES.indexOf(move.id) >= 0 ? ` <span class="planner-nodrop" title="Platinum Kaizo removes this move's stat drop - it has no drawback here.">nd</span>` : ``);
}

const BOOST_LABELS = {atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe", acc: "Acc", eva: "Eva"};

// Non-volatile status plus any volatiles, shown against the Pokémon carrying it.
function renderStatus(side) {
    var parts = [];
    if (side.status && STATUSES[side.status]) {
        parts.push(`<span class="planner-status ${side.status}" title="${STATUSES[side.status].name}">${STATUSES[side.status].short}</span>`);
    }
    for (var v in side.volatiles) {
        if (!side.volatiles[v]) continue;
        var info = VOLATILES[v];
        parts.push(`<span class="planner-status volatile" title="${info ? info.name : v}">${info ? info.short : v}</span>`);
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
    isLightScreen: "Light Screen"
};

// Field state that persists across turns, shown above the matchup it affects.
function renderStateBar(state) {
    var parts = [];
    if (state.weather) parts.push(`<span class="planner-field">${state.weather}</span>`);
    ["you", "them"].forEach(function(side) {
        var hazards = state[side].hazards;
        for (var field in hazards) {
            if (!hazards[field]) continue;
            var label = HAZARD_LABELS[field] || field;
            var layers = hazards[field] > 1 ? ` x${hazards[field]}` : "";
            parts.push(`<span class="planner-field ${side}">${side === "you" ? "Your side" : "Their side"}: ${label}${layers}</span>`);
        }
    });
    if (state.ambiguous) {
        parts.push(`<span class="planner-field ambiguous" title="This turn is reachable by more than one branch, and they don't all leave the same boosts and hazards behind. Showing the first; edit the turn to pin it.">mixed state</span>`);
    }
    return parts.length ? `<div class="planner-state-bar">${parts.join("")}</div>` : "";
}

// The payoff of pre-statusing, called out where it applies.
function renderStatusBlock(line, state) {
    if (!statusBlockActive(line, state)) return "";
    return `<div class="planner-status-block" title="A Pokémon can only carry one non-volatile status, so this one is immune to anything else they try. This trainer's AI leads with status and disruption.">
        Status locked - ${STATUSES[state.you.status].name} blocks theirs
    </div>`;
}

function nodeActionText(node) {
    if (!node.action || !node.action.value) return `<span class="planner-node-blank">—</span>`;
    if (node.action.type === "switch") {
        var to = boxEntry(node.action.value);
        return `<span class="planner-switch">Switch to <b>${to ? (to.nickname || to.species) : node.action.value}</b></span>`;
    }
    // A set can name a move the game doesn't have (imports, or a hack that cut
    // it), so chosenMoveText falls back to the bare name rather than an icon.
    return chosenMoveText(node.action.value);
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

        var label = svgEl("text", {
            x: route.labelX,
            y: route.labelY,
            class: `planner-edge-label ${condition.color}`,
            "data-edge": edge.id
        }, edge.label || condition.name);
        label.appendChild(svgEl("title", {}, "Click to change or delete this branch"));
        label.addEventListener("click", editEdgeFromLabel);
        svg.appendChild(label);
    }
}

// Clicking a label edits it. Deleting is a deliberate choice inside the editor,
// not the consequence of clicking the most obvious target on the arrow.
function editEdgeFromLabel() {
    openEdgeEditor(this.getAttribute("data-edge"));
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

var nodeEditorPopup = `
<fieldset class="planner-node-popup">
    <legend align="center">Edit Turn</legend>
    <div class="planner-form">
        <label>Your Pokémon</label><select class="planner-edit-mon"></select>
        <label>Their Pokémon</label><select class="planner-edit-foe"></select>
    </div>
    <hr />
    <div class="planner-form">
        <label>Action</label><select class="planner-edit-action-type">
            <option value="move">Use move</option>
            <option value="switch">Switch to</option>
        </select>
        <label>Which</label><select class="planner-edit-action-value"></select>
    </div>
    <hr />
    <p class="planner-hint">Status carried into this turn - for walking in pre-slept or pre-poisoned so they can't land something worse. Carries down to later turns.</p>
    <div class="planner-form">
        <label>Your status</label><select class="planner-edit-status-you"></select>
        <label>Their status</label><select class="planner-edit-status-them"></select>
    </div>
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

/*
 * The Box tab owns #popup-container and binds its buttons directly, so reusing
 * it here would tear those handlers off the moment a turn is edited. The
 * planner gets its own overlay instead.
 *
 * The markup is rebuilt on each open and the selects are filled in place:
 * serialising them to an HTML string would drop the current selection, since
 * .val() sets a property rather than the selected attribute.
 */
function openNodeEditor(nodeId) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    EDITING_NODE = nodeId;

    $("#planner-popup-container").html(nodeEditorPopup).removeClass("hide").show();

    var roster = boxRoster();
    var monSelect = $(".planner-edit-mon").empty().append(`<option value="">(none)</option>`);
    for (var i in roster) {
        monSelect.append(`<option value="${roster[i].key}"${roster[i].dead ? " disabled" : ""}>${roster[i].nickname || roster[i].species}${roster[i].dead ? " (dead)" : ""}</option>`);
    }
    monSelect.val(node.mon);

    var party = GAME.partyOrder()[line.trainer] || [];
    var foeSelect = $(".planner-edit-foe").empty().append(`<option value="">(any)</option>`);
    for (var j in party) foeSelect.append(`<option value="${party[j]}">${party[j]}</option>`);
    foeSelect.val(node.foe);

    $(".planner-edit-action-type").val(node.action ? node.action.type : "move");
    refreshActionValues(node.action ? node.action.value : "");

    var seed = node.statusSeed || {you: "", them: ""};
    [["you", ".planner-edit-status-you"], ["them", ".planner-edit-status-them"]].forEach(function(pair) {
        var select = $(pair[1]).empty().append(`<option value="">(inherit)</option>`);
        Object.keys(STATUSES).forEach(function(id) {
            select.append(`<option value="${id}">${STATUSES[id].name}</option>`);
        });
        select.val(seed[pair[0]] || "");
    });

    $(".planner-edit-note").val(node.note || "");
}

function closeNodeEditor() {
    $("#planner-popup-container").hide().empty();
    EDITING_NODE = "";
}

function closeEdgeEditor() {
    $("#planner-popup-container").hide().empty();
    EDITING_EDGE = "";
    EDITING_CONDITION = "";
}

// The "which" dropdown is either the active Pokémon's moves or the rest of the box.
function refreshActionValues(selected) {
    var line = currentLine();
    var node = line.nodes[EDITING_NODE];
    var type = $(".planner-edit-action-type").val();
    var select = $(".planner-edit-action-value").empty();

    if (type === "switch") {
        var roster = boxRoster();
        select.append(`<option value="">(pick one)</option>`);
        for (var i in roster) {
            if (roster[i].key === $(".planner-edit-mon").val()) continue;
            select.append(`<option value="${roster[i].key}"${roster[i].dead ? " disabled" : ""}>${roster[i].nickname || roster[i].species}</option>`);
        }
    } else {
        var monKey = $(".planner-edit-mon").val() || (node && node.mon);
        var mon = monKey ? boxEntry(monKey) : null;
        select.append(`<option value="">(pick one)</option>`);
        var moves = mon && mon.set.moves ? mon.set.moves : [];
        for (var j in moves) select.append(`<option value="${moves[j]}">${moves[j]}</option>`);
    }
    select.val(selected || "");
}

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
function beginMonDrag(e, key, side, sprite) {
    MON_DRAG = {key: key, side: side};
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
function assignDraggedMon(node) {
    if (MON_DRAG.side === "you") {
        node.mon = MON_DRAG.key;
        // The previous move probably isn't in this Pokémon's set.
        if (node.action && node.action.type === "move") {
            var entry = boxEntry(MON_DRAG.key);
            var moves = entry && entry.set.moves ? entry.set.moves : [];
            if (moves.indexOf(node.action.value) < 0) node.action = {type: "move", value: ""};
        }
    } else {
        node.foe = MON_DRAG.key;
        node.foeMove = "";
    }
}

function dropMonOnNode(nodeId) {
    var line = currentLine();
    var node = line.nodes[nodeId];
    if (!node) return endMonDrag();
    assignDraggedMon(node);
    endMonDrag();
    saveLines();
    renderLine();
}

function dropMonOnEmpty(e) {
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
 * make it rather than throwing the drag away. The turn editor opens straight
 * after, and backing out of it removes both the node and the arrow so a
 * cancelled drag leaves nothing behind.
 */
var PENDING_NEW = null;

function finishConnectToEmpty(e) {
    var line = currentLine();
    var canvas = $(".planner-canvas")[0];
    var rect = canvas.getBoundingClientRect();
    var width = $(".planner-node").outerWidth() || 274;

    // Arrows enter at the top centre, so drop the card under the cursor there.
    var node = newNode(
        Math.max(0, e.clientX - rect.left + canvas.scrollLeft - width / 2),
        Math.max(0, e.clientY - rect.top + canvas.scrollTop));
    node.movesOpen = true;
    line.nodes[node.id] = node;

    var edge = newEdge(CONNECTING.from, node.id, "always");
    line.edges[edge.id] = edge;

    CONNECTING = null;
    $(".planner-canvas").removeClass("connecting");
    saveLines();
    renderLine();

    PENDING_NEW = {node: node.id, edge: edge.id};
    openNodeEditor(node.id);
}

function discardPendingNew() {
    if (!PENDING_NEW) return;
    var line = currentLine();
    delete line.nodes[PENDING_NEW.node];
    delete line.edges[PENDING_NEW.edge];
    PENDING_NEW = null;
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
    // last one would just stack identical arrows. Reopen that one instead.
    var existing = findDuplicateEdge(line, CONNECTING.from, toNodeId, "always", "");
    var edge = existing;
    if (!edge) {
        edge = newEdge(CONNECTING.from, toNodeId, "always");
        line.edges[edge.id] = edge;
        saveLines();
    }
    CONNECTING = null;
    $(".planner-canvas").removeClass("connecting");
    renderEdges();
    // A new branch has no meaning yet, so go straight to naming it.
    openEdgeEditor(edge.id);
}

/* ---------------------------------------------------------------- bootstrap */

function initPlanner() {
    loadLines();
    applyPartiesFold();
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

    $(".planner-canvas").on("mouseup", ".planner-node", function() {
        if (MON_DRAG) return dropMonOnNode($(this).attr("data-node"));
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
        node.x = Math.max(0, e.clientX - canvas.left - DRAG.offsetX);
        node.y = Math.max(0, e.clientY - canvas.top - DRAG.offsetY);
        $(`.planner-node[data-node="${node.id}"]`).css({left: `${node.x}px`, top: `${node.y}px`});
        renderEdges();
    });

    $(document).on("mouseup", function() {
        if (DRAG) {
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
    $(".planner-your-party, .planner-box-party").on("mousedown", ".planner-mine", function(e) {
        e.preventDefault();
        beginMonDrag(e, $(this).attr("data-mon"), "you", $(this).find("img").attr("src"));
    });

    $(".planner-foe-party").on("mousedown", ".planner-foe", function(e) {
        e.preventDefault();
        beginMonDrag(e, $(this).attr("data-foe"), "them", $(this).find("img").attr("src"));
    });

    // Dropped onto a specific team member: the two trade places.
    $(".planner-your-party").on("mouseup", ".planner-mine", function(e) {
        if (!MON_DRAG || MON_DRAG.side !== "you") return;
        e.stopPropagation();
        swapIntoTeam(MON_DRAG.key, $(this).attr("data-mon"));
        endMonDrag();
        renderLine();
    });

    // Dropped on the strip's empty space: just join the team if there's room.
    $(".planner-your-party").on("mouseup", function() {
        if (!MON_DRAG || MON_DRAG.side !== "you") return;
        var result = addToTeam(MON_DRAG.key);
        endMonDrag();
        if (!result.ok) return alert(result.reason);
        renderLine();
    });

    $(".planner-box-party").on("mouseup", function() {
        if (!MON_DRAG || MON_DRAG.side !== "you") return;
        removeFromTeam(MON_DRAG.key);
        endMonDrag();
        renderLine();
    });

    // Choosing either side's move for the turn, straight from the card.
    $(".planner-canvas").on("click", ".planner-move", function(e) {
        e.stopPropagation();
        var line = currentLine();
        var node = line.nodes[$(this).closest(".planner-node").attr("data-node")];
        var move = $(this).attr("data-move");

        if ($(this).attr("data-side") === "you") {
            // Clicking the chosen move again clears it.
            var current = node.action && node.action.type === "move" ? node.action.value : "";
            node.action = {type: "move", value: current === move ? "" : move};
        } else {
            node.foeMove = node.foeMove === move ? "" : move;
        }
        saveLines();
        // Both sides feed the state of every turn below this one.
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
    $(document).on("change", ".planner-edit-action-type, .planner-edit-mon", function() {
        refreshActionValues("");
    });

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
        renderEdges();
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
        // Backing out of a turn that only existed because of the drag undoes it.
        discardPendingNew();
    });

    $(document).on("click", "#planner-save-node", function() {
        var line = currentLine();
        var node = line.nodes[EDITING_NODE];
        node.mon = $(".planner-edit-mon").val();
        var foe = $(".planner-edit-foe").val();
        // A pinned move belongs to the Pokémon it came from; swapping the
        // opponent would otherwise leave a move they don't have.
        if (foe !== node.foe) node.foeMove = "";
        node.foe = foe;
        node.action = {
            type: $(".planner-edit-action-type").val(),
            value: $(".planner-edit-action-value").val()
        };
        node.statusSeed = {
            you: $(".planner-edit-status-you").val() || "",
            them: $(".planner-edit-status-them").val() || ""
        };
        node.note = $(".planner-edit-note").val();
        saveLines();
        closeNodeEditor();
        renderLine();

        // A turn made by dragging still needs to say when that path is taken,
        // so go straight on to naming the branch.
        if (PENDING_NEW) {
            var edgeId = PENDING_NEW.edge;
            PENDING_NEW = null;
            openEdgeEditor(edgeId);
        }
    });
}

$(document).ready(function() {
    initPlanner();
});
