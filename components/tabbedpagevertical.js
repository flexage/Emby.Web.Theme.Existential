define(['loading', 'slyScroller', './focushandler', 'focusManager', 'connectionManager', 'imageLoader'], function (loading, slyScroller, focusHandler, focusManager, connectionManager, imageLoader) {

    var themeId = 'existential';

    var apiClient = connectionManager.currentApiClient();

    function createHeaderScroller(view, instance, initialTabId) {

        var userViewNames = view.querySelector('.userViewNames');

        var scrollFrame = userViewNames.querySelector('.scrollFrame');

        var options = {
            horizontal: 1,
            itemNav: 'basic',
            mouseDragging: 1,
            touchDragging: 1,
            slidee: userViewNames.querySelector('.scrollSlider'),
            itemSelector: '.btnUserViewHeader',
            activateOn: 'focus',
            smart: true,
            releaseSwing: true,
            scrollBy: 200,
            speed: 500,
            elasticBounds: 1,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
            elasticBounds: 1,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
            scrollWidth: userViewNames.querySelectorAll('.btnUserViewHeader').length * (screen.width / 5)
        };

        slyScroller.create(scrollFrame, options).then(function (slyFrame) {
            slyFrame.init();
            loading.hide();

            var initialTab = initialTabId ? userViewNames.querySelector('.btnUserViewHeader[data-id=\'' + initialTabId + '\']') : null;

            if (!initialTab) {
                initialTab = userViewNames.querySelector('.btnUserViewHeader');
            }
            instance.headerSlyFrame = slyFrame;
            instance.setFocusDelay(view, initialTab);
        });
    }

    function initEvents(view, instance) {

        // Catch events on the view headers
        var userViewNames = view.querySelector('.userViewNames');

        userViewNames.addEventListener('mousedown', function (e) {

            var elem = Emby.Dom.parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                elem.focus();
            }
        });

        userViewNames.addEventListener('focus', function (e) {

            var elem = Emby.Dom.parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                instance.headerSlyFrame.toCenter(elem);
                instance.setFocusDelay(view, elem);
            }
        }, true);
    }

    function selectUserView(page, id, self) {

        var btn = page.querySelector(".btnUserViewHeader[data-id='" + id + "']");

        self.bodySlyFrame.slideTo(0, true);

        page.querySelector('.contentScrollSlider').innerHTML = '';
        var promise = self.loadViewContent.call(self, page, id, btn.getAttribute('data-type'));

        if (promise) {
            promise.then(function () {
                fadeInRight(page.querySelector('.contentScrollSlider'));
            });
        }
    }

    function fadeInRight(elem, iterations) {

        var translateX = Math.round(window.innerWidth / 100);
        var keyframes = [
          { opacity: '0', transform: 'translate3d(' + translateX + 'px, 0, 0)', offset: 0 },
          { opacity: '1', transform: 'none', offset: 1 }];
        var timing = { duration: 300, iterations: iterations };
        elem.animate(keyframes, timing);
    }

    function tabbedPage(page, pageOptions) {

        var self = this;
        pageOptions = pageOptions || {};

        // lock the height so that the location of the top tabs won't fluctuate
        var contentScrollSlider = page.querySelector('.contentScrollSlider');
        //contentScrollSlider.classList.add('focuscontainer-x');

        var selectedItemInfoInner = page.querySelector('.selectedItemInfoInner');
        var selectedIndexElement = page.querySelector('.selectedIndex');

        var tagName = 'paper-button';

        self.renderTabs = function (tabs, initialTabId) {

            page.querySelector('.viewsScrollSlider').innerHTML = tabs.map(function (i) {

                return '<' + tagName + ' class="flat btnUserViewHeader" data-id="' + i.Id + '" data-type="' + (i.CollectionType || '') + '"><h2 class="userViewButtonText">' + i.Name + '</h2></' + tagName + '>';

            }).join('');

            createHeaderScroller(page, self, initialTabId);
            initEvents(page, self);
            createHorizontalScroller(page);
        };

        var viewsScrollSlider = page.querySelector('.viewsScrollSlider');
        viewsScrollSlider.classList.add('focusable');
        viewsScrollSlider.classList.add('focuscontainer-x');
        viewsScrollSlider.focus = focusViewSlider;

        function onAlphaPickerValueChanged() {

            var value = pageOptions.alphaPicker.value();

            trySelectValue(value);
        }

        function trySelectValue(value) {

            var card;

            // If it's the symbol just pick the first card
            if (value == '#') {

                card = contentScrollSlider.querySelector('.posterItem');

                if (card) {
                    self.bodySlyFrame.toCenter(card, false);
                    return;
                }
            }

            card = contentScrollSlider.querySelector('.posterItem[data-prefix^=\'' + value + '\']');

            if (card) {
                self.bodySlyFrame.toCenter(card, false);
                return;
            }

            // go to the previous letter
            var values = pageOptions.alphaPicker.values();
            var index = values.indexOf(value);

            if (index < values.length - 2) {
                trySelectValue(values[index + 1]);
            } else {
                var all = contentScrollSlider.querySelectorAll('.posterItem');
                card = all.length ? all[all.length - 1] : null;

                if (card) {
                    self.bodySlyFrame.toCenter(card, false);
                }
            }
        }

        if (pageOptions.alphaPicker) {
            pageOptions.alphaPicker.on('alphavaluechanged', onAlphaPickerValueChanged);
        }

        function focusViewSlider() {

            var selected = this.querySelector('.selected');

            if (selected) {
                focusManager.focus(selected);
            } else {
                focusManager.autoFocus(this);
            }
        }

        var focusTimeout;
        var focusDelay = 0;
        self.setFocusDelay = function (view, elem) {

            var viewId = elem.getAttribute('data-id');

            var btn = view.querySelector('.btnUserViewHeader.selected');

            if (btn) {

                if (viewId == btn.getAttribute('data-id')) {
                    return;
                }
                btn.classList.remove('selected');
            }

            elem.classList.add('selected');

            if (focusTimeout) {
                clearTimeout(focusTimeout);
            }
            focusTimeout = setTimeout(function () {

                selectUserView(view, viewId, self);

            }, focusDelay);

            // No delay the first time
            focusDelay = 700;
        };

        function createHorizontalScroller(view) {

            var scrollFrame = view.querySelector('.itemScrollFrame');

            var options = {
                horizontal: 0,
                slidee: view.querySelector('.libraryScrollSlider'),
                scrollBy: 200,
                speed: 270,
                scrollWidth: 1000000,
                immediateSpeed: 100
            };

            slyScroller.create(scrollFrame, options).then(function (slyFrame) {
                self.bodySlyFrame = slyFrame;
                self.bodySlyFrame.init();
                initFocusHandler(view, self.bodySlyFrame);
            });
        }

        function initFocusHandler(view) {

            // if (pageOptions.handleFocus) {
            //
            //     var scrollSlider = view.querySelector('.contentScrollSlider');
            //
            //     self.focusHandler = new focusHandler({
            //         parent: scrollSlider,
            //         selectedItemInfoInner: selectedItemInfoInner,
            //         selectedIndexElement: selectedIndexElement,
            //         animateFocus: pageOptions.animateFocus,
            //         slyFrame: self.bodySlyFrame
            //     });
            // }

            view.addEventListener('focus', libraryItemFocus, true);
        }

        function libraryItemFocus(e) {
            var itemInfoElement = document.querySelector('.itemInfo');
            var focused = focusManager.focusableParent(e.target);

            console.log('**** focused', focused);

            var itemId = focused.getAttribute('data-id');
            console.log('Item ID', itemId);

            Emby.Models.item(itemId).then(function (item) {
                console.log('itemResult', item);

                var imageUrlPrimary = apiClient.getImageUrl(item.Id, {
                    type: "Primary",
                    maxHeight: 400,
                    maxWidth: 300,
                    tag: item.ImageTags.Primary
                });

                console.log('imageUrlPrimary', imageUrlPrimary);

                var imageUrlBackdrop = apiClient.getImageUrl(item.Id, {
                    type: "Backdrop",
                    maxHeight: 1920,
                    maxWidth: 1080,
                    tag: item.BackDropImageTags
                });

                console.log('imageUrlBackdrop', imageUrlBackdrop);


                var html = '';
                html += '<div class="primary lazy" data-src="' + imageUrlPrimary + '"></div>';
                html += '<div class="backdrop lazy" data-src="' + imageUrlBackdrop + '"></div>';
                html += '<div class="textInfo">';
                html += '<h1 class="name">' + item.Name + '</h1>';
                html += '<p class="overview">' + item.Overview + '</p>';
                html += '</div>';

                itemInfoElement.innerHTML = html;

                imageLoader.lazyChildren(itemInfoElement);
            });
        }

        self.destroy = function () {

            if (pageOptions.alphaPicker) {
                pageOptions.alphaPicker.off('alphavaluechanged', onAlphaPickerValueChanged);
            }

            if (self.focusHandler) {
                self.focusHandler.destroy();
                self.focusHandler = null
            }
            if (self.bodySlyFrame) {
                self.bodySlyFrame.destroy();
                self.bodySlyFrame = null
            }
            if (self.headerSlyFrame) {
                self.headerSlyFrame.destroy();
                self.headerSlyFrame = null
            }
        };
    }

    return tabbedPage;
});
