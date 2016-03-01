define(['connectionManager', 'imageLoader'], function (connectionManager, imageLoader) {

    function buildPosters(items, options) {
        console.log("BUILDING POSTERS...", items);

        var apiClient = connectionManager.currentApiClient();

        var html = '';

        var counter = 1;

        for (var item in items)
        {
            if (counter == 1)
            {
                html += '<div class="clearAfter">';
            }

            //var imageUrl = Emby.Models.imageUrl(items[item], { type: 'Primary' });

            var imageUrl = apiClient.getImageUrl(items[item].Id, {
                type: "Primary",
                maxHeight: 400,
                maxWidth: 300,
                tag: items[item].ImageTags.Primary
            });

            var prefix = (items[item].SortName || items[item].Name || '')[0];

            if (prefix) {
                prefix = prefix.toUpperCase();
            }

            var watchFlag = '';
            if(items[item].UserData.PlaybackPositionTicks > 0)
            {
                watchFlag = '<iron-icon icon="pause"></iron-icon>';
            }
            else if(items[item].UserData.PlayCount == 0)
            {
                watchFlag = '<iron-icon icon="star"></iron-icon>';
            }

            html += '<button class="posterItem focusable" data-prefix="' + prefix + '" data-id="' + items[item].Id + '" data-index="' + item + '">';
            if(watchFlag != '')
            {
                html += '<div class="watchFlags">' + watchFlag + '</div>';
            }
            html += '<div class="posterItemImage lazy" data-src="' + imageUrl + '"></div>';

            if(items[item].IsHD)
            {
                html += '<iron-icon class="iconHd" icon="hd"></iron-icon>';
            }

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

        imageLoader.lazyChildren(options.itemsContainer);
    }

    var posterBuilder = {
        buildPosters: buildPosters
    };

    window.Existential = window.Existential || {};
    window.Existential.PosterBuilder = posterBuilder;

    return posterBuilder;
});
