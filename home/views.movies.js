define(['./spotlight', 'imageLoader', 'focusManager', './../components/backdrop'], function (spotlight, imageLoader, focusManager, skinBackdrop) {

    var skinId = 'existential';

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

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
                skinBackdrop.setBackdrops([item]);
            }

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
                    var elem = parentWithClass(e.target, 'itemAction');
                    var itemId = elem.getAttribute('data-id');

                    Emby.Models.item(itemId).then(function (item) {
                        skinBackdrop.setBackdrops([item]);
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
