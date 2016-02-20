define(['focusManager'], function (focusManager) {

    var themeId = 'existential';

	function loadLatestRecordings(element) {

        var options = {
            limit: 20,
            IsInProgress: false
        };

        return Emby.Models.liveTvRecordings(options).then(function (result) {

            var section = element.querySelector('.latestSection');

            Existential.CardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard',
                rows: 1,
                width: Existential.CardBuilder.homePortraitWidth
            });
        });
    }

    function view(element, parentId, autoFocus) {
        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function () {

            return Promise.all([
                loadLatestRecordings(element),
            ]);
        };

        self.destroy = function () {

        };
    }

    return view;

});
