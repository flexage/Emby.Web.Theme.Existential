define([], function () {

    function buildPosters(items, options) {
        //alert("BUILDING POSTERS...");
        console.log("BUILDING POSTERS...", items);

        var html = '';

        var counter = 1;

        for (var item in items)
        {
            if (counter == 1)
            {
                html += '<div class="clearAfter">';
            }

            var imageUrl = Emby.Models.imageUrl(items[item], { type: 'Primary' });

            //Emby.Models.imageUrl(item, { type: 'Primary' });

            html += '<button class="posterItem focusable">';
            html += '<img src="' + imageUrl + '">';
            html += '<div class="title">';
            html += items[item].Name;
            html += '</div>';

            if(items[item].UserData.PlayCount > 0)
            {
                html += '<div class="watched"></div>';
            }

            html += '</button>';

            if (counter == 3)
            {
                html += '</div>';

                counter = 0;
            }

            counter++;
        }

        options.itemsContainer.innerHTML = html;
    }

    var posterBuilder = {
        buildPosters: buildPosters
    };

    window.Existential = window.Existential || {};
    window.Existential.PosterBuilder = posterBuilder;

    return posterBuilder;
});