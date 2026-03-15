var x, y, target;

function refreshMapDupes() {
    $(".dupe-marker").remove();
    if (!SETTINGS.dupeTracker) return;
    var dupes = getDupedLocations();
    var markers = 0;
    for (var i in dupes) {
        var location = LOCATIONS[dupes[i]];
        for (var j in location.coords) {
            var [x, y] = location.coords[j];
            var x_offset = (markers % 32) * 24;
            var y_offset = Math.floor(markers / 32) * 24;
            $(".dupe-overlay").append(`<img src="/img/map/cross.png" class="dupe-marker" style="top: ${(y + 5) * 24 - y_offset}px; left: ${x * 24 - x_offset}px">`);
            markers += 1;
        }
    }
}

$(document).ready(function() {
    $(".map").on({
        mousemove: function(e) {
            var map = $(this).closest(".map")[0];
            var newX = Math.floor((e.pageX - map.offsetLeft) / 24);
            var newY = Math.floor((e.pageY - map.offsetTop) / 24) - 5;

            if (newY < 0) {
                $(".cursor").hide();
                return;
            }
            $(".cursor").show();
        
            if (x != newX || y != newY) {
                x = newX;
                y = newY;
                $(".cursor").css({top: `${(y + 5) * 24}px`, left: `${x * 24}px`})
                    .removeClass("target-tile").off("click");
                $(".location-name").empty();
                target = "";
                for (var id in LOCATIONS) {
                    var location = LOCATIONS[id];
                    for (var i in location.coords) {
                        var coords = location.coords[i];
                        if (coords[0] == x && coords[1] == y) {
                            target = `location/${location.id}`;
                            $(".cursor").addClass("target-tile").on("click", function() {
                                $(".location-name").empty();
                                window.location = `#/dex/${target}`;
                            });
                            $(".location-name").text(location.name);
                            break;
                        }
                    }
                    if (target) break;
                }
            }
        },
        mouseleave: function() {
            $(".cursor").hide();
            $(".location-name").empty();
        }
    });
});