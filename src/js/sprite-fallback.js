/*
 * Sprite fallback, for forks.
 *
 * The production image set lives in a separate private repository that is
 * checked out into src/img at deploy time (see .forgejo/workflows), so a fork
 * has none of it - only favicon.png is in the repo - and every /img/... request
 * 404s. games.js already resolves the *planner's* sprites from Showdown's CDN;
 * this extends the same treatment to the rest of the app: the Calc, Dex, Box
 * and Encounters tabs.
 *
 * Done as a capture-phase `error` listener rather than by rewriting the ~60
 * call sites that build /img/ paths, for three reasons:
 *
 *  - It costs nothing where the images exist. On the real deploy the event
 *    never fires and upstream's own sprites are used exactly as before.
 *    Rewriting the call sites would have replaced them permanently, and
 *    upstream's set is the better one - it covers things the CDN has no
 *    equivalent for.
 *  - Only one place builds CDN URLs (SHOWDOWN_SPRITES, in games.js), so the two
 *    can't drift apart.
 *  - Those call sites build their <img> tags inside innerHTML strings across
 *    six files. Editing every one of them is exactly the kind of bulk change
 *    that has silently broken things in this project before.
 *
 * `error` does not bubble, but it does propagate through the capture phase, so
 * one document-level listener catches every image on the page - including the
 * ones written into the DOM later as HTML strings.
 */

(function() {
    "use strict";

    /*
     * Transparent 1x1, for images the CDN has no counterpart for: the
     * encounter-method and move-tutor icons, and the map. Better than the
     * browser's broken-image glyph, and it keeps the layout's slot. Those
     * elements carry a `title` already, so the information is still reachable.
     */
    var BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    function svgIcon(svg) {
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

    /*
     * The speed indicators mean something a blank would silently drop, and they
     * are simple enough to just draw. Inline SVG rather than a glyph in a
     * <span>, so they stay <img> elements and need no stylesheet changes.
     */
    var SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'>";
    var DRAWN = {
        faster: svgIcon(SVG + "<path d='M6 1.5 11 10.5 1 10.5Z' fill='#2e9e5b'/></svg>"),
        slower: svgIcon(SVG + "<path d='M6 10.5 1 1.5 11 1.5Z' fill='#c0392b'/></svg>"),
        tie: svgIcon(SVG + "<path d='M1.5 3.6h9v1.7h-9zM1.5 6.7h9v1.7h-9z' fill='#8a8a8a'/></svg>")
    };

    function drawnFor(path) {
        var match = IMG_PATH.calc.exec(path);
        return match ? DRAWN[match[1]] || null : null;
    }

    /*
     * Matched against the tail of the path rather than anchored at the root.
     * Most call sites write "/img/...", but a handful in the Dex write "img/..."
     * relatively, and the app can be served from a subdirectory - a project-page
     * URL like /<repo>/ on GitHub Pages - in which case those arrive here as
     * "/<repo>/img/..." instead.
     */
    var IMG_PATH = {
        dex: /(?:^|\/)img\/dex\/(icon|large)\/(species|types|items|other)\/(.+)\.png$/,
        calc: /(?:^|\/)img\/calc\/icon\/([a-z]+)\.png$/
    };

    /*
     * TM and HM icons are the one case where the id can't be looked up
     * directly: the CDN indexes machines by type, not by number. The Dex stores
     * the link on the *move* (`machine`, negative for HMs), so the reverse map
     * is built by walking MOVES once - a page can carry fifty of these.
     */
    var machineTypes = null;

    function machineType(id) {
        if (!/^(?:tm|hm)\d+$/.test(id) || typeof MOVES === "undefined") return null;
        if (!machineTypes) {
            machineTypes = {};
            Object.keys(MOVES).forEach(function(key) {
                var move = MOVES[key];
                if (!move.machine || !move.type) return;
                var number = Math.abs(move.machine);
                machineTypes[(move.machine > 0 ? "tm" : "hm") + (number < 10 ? "0" : "") + number] = move.type;
            });
        }
        return machineTypes[id] || null;
    }

    /*
     * Maps one of the app's own image paths onto Showdown's CDN. Returns null
     * when there is no equivalent and the caller should blank it instead.
     */
    function cdnUrl(path) {
        if (typeof SHOWDOWN_SPRITES === "undefined") return null;

        var match = IMG_PATH.dex.exec(path);
        if (!match) return null;

        var large = match[1] === "large";
        var kind = match[2];
        var id = match[3];

        if (kind === "species") {
            var species = typeof SPECIES !== "undefined" ? SPECIES[id] : null;
            if (!species) return null;
            // The large art is keyed by name; the small icons by dex number.
            return large ? SHOWDOWN_SPRITES.species(species) : SHOWDOWN_SPRITES.speciesIcon(species);
        }

        if (kind === "types") {
            // Call sites pass the type both capitalised and not; the resolver
            // normalises either.
            return SHOWDOWN_SPRITES.type(id);
        }

        if (kind === "items") {
            var type = machineType(id);
            if (type) return SHOWDOWN_SPRITES.machine(id.slice(0, 2), type);
            var item = typeof ITEMS !== "undefined" ? ITEMS[id] : null;
            return item ? SHOWDOWN_SPRITES.item(item) : null;
        }

        /*
         * "other" is a grab bag. Move categories have a CDN counterpart; the
         * encounter methods and the tutor icon don't, and nothing on Showdown
         * stands in for them.
         */
        if (typeof CATEGORIES !== "undefined" && CATEGORIES[id.toLowerCase()]) {
            return SHOWDOWN_SPRITES.category(id);
        }
        return null;
    }

    /*
     * Two stages, so a CDN URL that 404s in turn - a Kaizo-only species, say -
     * ends up blank rather than looping back through here forever.
     */
    function onError(event) {
        var img = event.target;
        if (!img || img.tagName !== "IMG") return;

        var stage = img.getAttribute("data-sprite-fallback");
        if (stage === "blank") return;
        if (stage === "cdn") {
            img.setAttribute("data-sprite-fallback", "blank");
            img.src = BLANK;
            return;
        }

        var path;
        try {
            path = new URL(img.src, location.href).pathname;
        } catch (e) {
            return;
        }

        // Kept so a blanked image can still be traced back to what it wanted.
        img.setAttribute("data-sprite-original", path);

        var drawn = drawnFor(path);
        if (drawn) {
            img.setAttribute("data-sprite-fallback", "blank");
            img.src = drawn;
            return;
        }

        var url = cdnUrl(path);
        if (url) {
            img.setAttribute("data-sprite-fallback", "cdn");
            img.src = url;
            return;
        }

        img.setAttribute("data-sprite-fallback", "blank");
        img.src = BLANK;
    }

    document.addEventListener("error", onError, true);
})();
