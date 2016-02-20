define(['./spotlight', 'focusManager', './../components/backdrop'], function (spotlight, focusManager, themeBackdrop) {

	var themeId = 'existential';

    function loadLatest(element, parentId) {

        var options = {

            IncludeItemTypes: "Episode",
            Limit: 50,
            Fields: "PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.latestItems(options).then(function (result) {
			var item = result[0];
            themeBackdrop.setBackdrops([item]);

            var section = element.querySelector('.latestSection');

            Existential.CardBuilder.buildCards(result, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard',
                rows: 1,
                width: Existential.CardBuilder.homeThumbWidth,
                preferThumb: true,
                showGroupCount: true
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

        self.loadData = function () {

            return Promise.all([
            	loadLatest(element, parentId)
            ]);
        };

		addEventListeners();

        self.destroy = function () {

        };
    }

    return view;

});
