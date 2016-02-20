define(['loading', './../components/tabbedpage', './../components/backdrop', 'focusManager', 'playbackManager', 'inputManager'], function (loading, tabbedPage, themeBackdrop, focusManager, playbackManager, inputManager) {

    var themeId = 'existential';

    function updateFooterClock() {

        var date = new Date();
        var time = date.toLocaleTimeString().toLowerCase();

        var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var dateString = date.toLocaleDateString("en-GB", dateOptions);
        console.log("dateString", dateString);

        if (time.indexOf('am') != -1 || time.indexOf('pm') != -1) {

            var hour = date.getHours() % 12;
            var suffix = date.getHours() > 11 ? 'pm' : 'am';
            if (!hour) {
                hour = 12;
            }
            var minutes = date.getMinutes();

            if (minutes < 10) {
                minutes = '0' + minutes;
            }

            time = '<span class="hour">' + hour + '</span><span class="minutes">' + minutes + '</span><span class="suffix">' +  suffix + '</span>';
        }

        var clock = document.querySelector('.footerClock');

        if (clock) {
            clock.innerHTML = time;
        }

        var dateEl = document.querySelector('.footerDate');

        if (dateEl){
            dateEl.innerHTML = dateString;
        }
    }

	function loadViewHtml(page, parentId, html, viewName, autoFocus, self) {

        var homeScrollContent = page.querySelector('.contentScrollSlider');

        html = html;
        homeScrollContent.innerHTML = Globalize.translateHtml(html, themeId);

        require([themeId + '/home/views.' + viewName], function (viewBuilder) {

            var homePanel = homeScrollContent;
            var tabView = new viewBuilder(homePanel, parentId, autoFocus);
            tabView.element = homePanel;
            tabView.loadData();
            self.tabView = tabView;
        });
    }

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    return function (view, params) {

        var self = this;
        var needsRefresh;

        // Update clock
        updateFooterClock();
        setInterval(updateFooterClock, 50000);

        // Listen for navigation input and override
        inputManager.on(window, onInputCommand);
        function onInputCommand(e) {
            var ral = document.querySelector('.latestSection');
            var views = document.querySelector('.userViewNames');

            switch (e.detail.command) {
                case 'up':
                    e.preventDefault();

                    ral.classList.add('active');
                    views.classList.add('hidden');

                    setTimeout(function () {
                        focusManager.autoFocus(ral);
                    }, 600);

                    console.log("Up Button Pressed!!!");
                    break;
                case 'down':
                    e.preventDefault();

                    console.log('ral.classList', ral.classList);

                    if (ral.classList.contains('active'))
                    {
                        ral.classList.remove('active');
                        views.classList.remove('hidden');
                        focusManager.autoFocus(views);
                    }
                    else {
                        alert("No active class, we should show sub-menu ;)");
                    }

                    console.log("Down Button Pressed!!!");
                    break;
                default:
                    break;
            }
        }

        function reloadTabData(tabView) {

            if (!needsRefresh) {
                return;
            }

            var activeElement = document.activeElement;
            var card = activeElement ? parentWithClass(activeElement, 'card') : null;
            var itemId = card ? card.getAttribute('data-id') : null;
            var parentItemsContainer = activeElement ? parentWithClass(activeElement, 'itemsContainer') : null;

            tabView.loadData(true).then(function () {

                var tabView = self.tabView;

                if (!activeElement || !document.body.contains(activeElement)) {

                    // need to re-focus
                    if (itemId) {
                        card = tabView.element.querySelector('*[data-id=\'' + itemId + '\']');

                        if (card) {

                            var newParentItemsContainer = parentWithClass(card, 'itemsContainer');

                            if (newParentItemsContainer == parentItemsContainer) {
                                focusManager.focus(card);
                                return;
                            }
                        }
                    }

                    var focusParent = parentItemsContainer && document.body.contains(parentItemsContainer) ? parentItemsContainer : tabView.element;
                    focusManager.autoFocus(focusParent);
                }

            });
        }

        function onPlaybackStopped() {
            needsRefresh = true;
        }

        Events.on(playbackManager, 'playbackstop', onPlaybackStopped);

        view.addEventListener('viewshow', function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle('');

            themeBackdrop.setStaticBackdrop();

            if (isRestored) {
                if (self.tabView) {
                    reloadTabData(self.tabView);
                }
            } else {
                loading.show();

                renderTabs(view, self);
            }
        });

        view.addEventListener('viewhide', function () {

            needsRefresh = false;
        });

        view.addEventListener('viewdestroy', function () {

            if (self.tabbedPage) {
                self.tabbedPage.destroy();
            }
            if (self.tabView) {
                self.tabView.destroy();
            }

            Events.off(playbackManager, 'playbackstop', onPlaybackStopped);
        });

        function renderTabs(view, pageInstance) {

            Emby.Models.userViews().then(function (result) {
                var tabbedPageInstance = new tabbedPage(view, {
                    handleFocus: true,
                    immediateSpeed: 100
                });

                tabbedPageInstance.loadViewContent = loadViewContent;
                tabbedPageInstance.renderTabs(result.Items);
                pageInstance.tabbedPage = tabbedPageInstance;

                var navElement = document.querySelector('.userViewNames');
                console.log('navElement', navElement);
                focusManager.autoFocus(navElement);
            });
        }

        var isFirstLoad = true;

        function loadViewContent(page, id, type) {

            return new Promise(function (resolve, reject) {

                type = (type || '').toLowerCase();

                var viewName = '';

                switch (type) {
                    case 'tvshows':
                        viewName = 'tv';
                        break;
                    case 'movies':
                        viewName = 'movies';
                        break;
                    case 'channels':
                        viewName = 'channels';
                        break;
                    case 'music':
                        viewName = 'music';
                        break;
                    case 'playlists':
                        viewName = 'playlists';
                        break;
                    case 'boxsets':
                        viewName = 'collections';
                        break;
                    case 'livetv':
                        viewName = 'livetv';
                        break;
                    default:
                        viewName = 'generic';
                        break;
                }

                var xhr = new XMLHttpRequest();
                xhr.open('GET', Emby.PluginManager.mapPath(themeId, 'home/views.' + viewName + '.html'), true);

                xhr.onload = function (e) {

                    var html = this.response;
                    loadViewHtml(page, id, html, viewName, isFirstLoad, self);
                    isFirstLoad = false;
                    resolve();
                }

                xhr.send();
            });
        }
    }

});
