define(['focusManager', './../components/backdrop'], function (focusManager, themeBackdrop) {

    var themeId = 'existential';

	function loadLatestRecordings(element) {

        var options = {
            limit: 20,
            IsInProgress: false
        };

        return Emby.Models.liveTvRecordings(options).then(function (result) {
            
            var item = result.Items[0];
            if(item.BackdropImageTags.length){
                themeBackdrop.setBackdrops([item]);
            }

            var section = element.querySelector('.latestSection');

            Existential.CardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard',
                rows: 1,
                showTitle: true,
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
