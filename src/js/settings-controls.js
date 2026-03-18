SETTINGS = {
    gender: "Male",
    starter: "Turtwig",
    dupeTracker: true,
    showAIFlags: true,
    dupes: []
};

function saveSettings() {
    localStorage.settings = JSON.stringify(SETTINGS);
}

$(document).ready(function() {
    if (!localStorage.settings) {
        saveSettings();
    }
    SETTINGS = {...SETTINGS, ...JSON.parse(localStorage.settings)};
    saveSettings();
    setRival2Gender();
    setStarters();

    $(`#${SETTINGS.gender.toLowerCase()}:radio[name='gender']`).prop("checked", true).change();
    $(`#${SETTINGS.starter.toLowerCase()}:radio[name='starter']`).prop("checked", true).change();
    $(`#${prefersDarkTheme ? "dark" : "light"}:radio[name='theme']`).prop("checked", true).change();
    $(`#dupeTracker`).prop("checked", SETTINGS.dupeTracker).change();
    $(`#showAIFlags`).prop("checked", SETTINGS.showAIFlags).change();
    $("#dupes").val(SETTINGS.dupes.join("\n")).change().prop("disabled", !SETTINGS.dupeTracker);

    $("input:radio[name='gender']").change(function () {
    	SETTINGS.gender = $(this).val();
    	setRival2Gender();
        saveSettings();
    });
    $("input:radio[name='starter']").change(function () {
    	SETTINGS.starter = $(this).val();
    	setStarters();
        saveSettings();
    });
    $("input:radio[name='theme']").change(function () {
        setDarkTheme($(this).val() == "Dark");
    });
    $("input#dupeTracker").change(function () {
    	SETTINGS.dupeTracker = $(this).prop("checked");
    	$("#dupes").prop("disabled", !SETTINGS.dupeTracker);
        saveSettings();
    });
    $("input#showAIFlags").change(function () {
        SETTINGS.showAIFlags = $(this).prop("checked");
        // Show or hide all existing flag boxes immediately
        if (SETTINGS.showAIFlags) {
            $(".ai-flags-box[data-has-flags='true']").removeClass("hide");
        } else {
            $(".ai-flags-box").addClass("hide");
        }
        saveSettings();
    });
    $("textarea#dupes").change(function () {
        var lines = $(this).val().split("\n");
        var dupes = [];
    	for (var i in lines) {
            var str = toID(lines[i]);
            if (SPECIES[str]) {
                var species = SPECIES[str];
                while (species.prevo) species = SPECIES[species.prevo];
                if (!dupes.includes(species.id)) dupes.push(species.id);
            }
        }
        SETTINGS.dupes = dupes;
        saveSettings();
    });
});