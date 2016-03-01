define(['./spotlight', 'imageLoader', 'focusManager', './../cards/cardbuilder', './../themeinfo', 'itemShortcuts'], function (spotlight, imageLoader, focusManager, cardbuilder, themeInfo, itemShortcuts) {

    var themeId = 'existential';

    function loadLatest(element, parentId) {

        var options = {

            IncludeItemTypes: "Movie",
            Limit: 50,
            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.latestItems(options).then(function (result) {
            var item = result[0];

            if(item.BackdropImageTags.length){
                themeBackdrop.setBackdrops([item]);
            }

            var latestSection = element.querySelector('.latestSection');

            cardBuilder.buildCards(result, {
                parentContainer: latestSection,
                itemsContainer: latestSection.querySelector('.itemsContainer'),
                shape: 'portraitCard',
                rows: 1,
                width: Existential.CardBuilder.homePortraitWidth
            });
        });
    }

    function addEventListeners() {
        var latestSection = document.querySelector('.latestSection');
        latestSection.addEventListener('focus', function (e) {
            if(window.Existential.debounce)
            {
                window.Existential.debounce(function() {
                    var elem = Emby.Dom.parentWithClass(e.target, 'itemAction');
                    var itemId = elem.getAttribute('data-id');

                    Emby.Models.item(itemId).then(function (item) {
                        themeBackdrop.setBackdrops([item]);
                    });
                }, 400);
            }
        }, true);
    }

    function view(element, parentId, autoFocus) {

        var self = this;

        self.loadData = function (isRefresh) {

            var promises = [
                loadLatest(element, parentId)
            ];

            return promises;
        };

        addEventListeners();

        itemShortcuts.on(element.querySelector('.recommendations'));

        self.destroy = function () {

        };
    }

    return view;

});
