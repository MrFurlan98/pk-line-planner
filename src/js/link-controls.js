$("#calc").prop("checked", true);

$(".tab").on({
    click: function() {
        var tab = $(this).attr("id");
        window.location = `#/${tab}${tab == "dex" && LAST_DEX_ENTRY ? `/${LAST_DEX_ENTRY}` : ""}`;
    }
});

CURRENT_TAB = "calc";
function changeTab(tab) {
    if (tab == CURRENT_TAB) return;
	$(".wrapper").hide();
    if (!["calc", "dex", "box", "map", "settings"].includes(tab)) tab = "calc";
    $(`#${tab}-wrapper`).show();
    $(".tabSelection").detach().appendTo(`#${tab}-wrapper .settings`);
    $(`#${tab}:radio[name='tab']`).prop("checked", true).change();
    if (tab == "dex") $(".dex-searchbar").val("").trigger("input").select();
    else if (tab == "map") refreshMapDupes();
    CURRENT_TAB = tab;
}

LAST_HASH = "";
function navigate(hash) {
    if (hash == LAST_HASH) return;
    LAST_HASH = hash;
    hash = hash.split("#/")[1];
    var tab = hash.split("/")[0];
    if (tab != CURRENT_TAB) changeTab(tab);
    if (tab == "dex") {
        var target = hash.split(/\/(.*)/s);
        if (target.length > 1) loadDexEntry(target[1]);
    }
}

$(window).on("ready popstate", function() {
    navigate(window.location.hash);
});
