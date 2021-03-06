define(['loading', './focushandler', 'focusManager'], function (loading, focusHandler, focusManager) {

    function verticalList(options) {

        var self = this;
        var getItemsMethod = options.getItemsMethod;

        self.render = function () {

            if (options.itemsContainer) {

                self.focusHandler = new focusHandler({
                    parent: options.itemsContainer,
                    selectedItemInfoInner: options.selectedItemInfoElement,
                    selectedIndexElement: options.selectedIndexElement,
                    slyFrame: options.slyFrame,
                    selectedItemMode: options.selectedItemMode
                });
            }

            loading.show();

            getItemsMethod(0, 2000).then(function (result) {

                // Normalize between the different response types
                if (result.Items == null && result.TotalRecordCount == null) {

                    result = {
                        Items: result,
                        TotalRecordCount: result.length
                    };
                }

                self.items = result.Items;

                if (options.listCountElement) {
                    options.listCountElement.innerHTML = result.TotalRecordCount;
                    options.listNumbersElement.classList.remove('hide');
                }

                // var cardOptions = options.cardOptions || {};
                // cardOptions.itemsContainer = options.itemsContainer;
                // cardOptions.shape = cardOptions.shape || 'autoVertical';
                // cardOptions.rows = cardOptions.rows;

                // Existential.CardBuilder.buildCards(result.Items, cardOptions);

                var posterOptions = {};
                posterOptions.itemsContainer = options.itemsContainer;

                Existential.PosterBuilder.buildPosters(result.Items, posterOptions);

                loading.hide();

                if (options.onRender) {
                    options.onRender();
                }

                //if (options.autoFocus !== false) {
                    setTimeout(function () {
                        var firstCard = options.itemsContainer.querySelector('.posterItem');

                        console.log('firstCard', firstCard);

                        if (firstCard) {
                            focusManager.focus(firstCard);
                        }
                    }, 400);
                //}

                bindPosterEvents(options.itemsContainer);
            });
        };

        function bindPosterEvents(container) {
            container.addEventListener('click', function(e) {
                var focused = focusManager.focusableParent(e.target);

                var selectMenu = document.querySelector('.selectedMenu');
                selectMenu.classList.remove('offScreen');

                focusManager.autoFocus(selectMenu);
            });
        }

        self.destroy = function () {

            if (self.focusHandler) {
                self.focusHandler.destroy();
                self.focusHandler = null;
            }

            if (options.selectedItemInfoElement) {
                options.selectedItemInfoElement.innerHTML = '';
                options.selectedItemInfoElement.classList.remove('selectedItemInfoInnerWithLogo');
            }
        };
    }

    return verticalList;
});
