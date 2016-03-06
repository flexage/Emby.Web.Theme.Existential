define(['./../components/backdrop'], function (skinBackdrop) {

    function loadAll(element, parentId, autoFocus) {

        var options = {

            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            SortBy: 'SortName'
        };

        return Emby.Models.items(options).then(function (result) {
            var item = result.Items[0];
            if(item.BackdropImageTags.length){
                skinBackdrop.setBackdrops([item]);
            }

            var section = element.querySelector('.latestSection');

            // Needed in case the view has been destroyed
            if (!section) {
                return;
            }

            Existential.CardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard',
                rows: 1,
                autoFocus: autoFocus,
                coverImage: true,
                showTitle: true
            });
        });
    }

    function view(element, parentId, autoFocus) {
        var self = this;

        self.loadData = function (isRefresh) {

            if (isRefresh) {
                return Promise.resolve();
            }

            return loadAll(element, parentId, autoFocus);
        };

        self.destroy = function () {

        };
    }

    return view;
});
