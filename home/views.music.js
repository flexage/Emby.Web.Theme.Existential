define([], function () {

    var skinId = 'existential';

	function loadLatest(element, parentId) {

        var options = {

            IncludeItemTypes: "Audio",
            Limit: 100,
            Fields: "PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.latestItems(options).then(function (result) {

            var section = element.querySelector('.latestSection');

            Existential.CardBuilder.buildCards(result, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'squareCard',
                rows: 1,
                width: Existential.CardBuilder.homePortraitWidth
            });
        });
    }

    function view(element, parentId, autoFocus) {
        var self = this;

        if (autoFocus) {
            Emby.FocusManager.autoFocus(element, true);
        }

        self.loadData = function (isRefresh) {

            if (isRefresh) {
                return Promise.resolve();
            }

            return Promise.all([
                loadLatest(element, parentId),
            ]);
        };

        self.destroy = function () {

        };
    }

    return view;

});
