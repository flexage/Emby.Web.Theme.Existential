define(['./spotlight', 'imageLoader', 'focusManager', './../components/backdrop'], function (spotlight, imageLoader, focusManager, themeBackdrop) {

    var themeId = 'existential';

    function loadLatest(element, parentId) {

        var options = {

            IncludeItemTypes: "Movie",
            Limit: 12,
            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.latestItems(options).then(function (result) {
            var item = result[0];
            themeBackdrop.setBackdrops([item]);

            var latestSection = element.querySelector('.latestSection');

            Existential.CardBuilder.buildCards(result, {
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

        self.destroy = function () {

        };
    }

    return view;

});
