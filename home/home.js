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

                    var navElement = document.querySelector('.userViewNames');
                    console.log('navElement', navElement);
                    focusManager.autoFocus(navElement);
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

        // Catch events on the view headers
        var userViewNames = view.querySelector('.userViewNames');

        userViewNames.addEventListener('click', function (e) {
            var elem = parentWithClass(e.target, 'btnUserViewHeader');
            if (elem) {
                var viewId = elem.getAttribute('data-id');
                var viewType = elem.getAttribute('data-type');
                //console.log("viewType:" + viewType);

                Emby.Backdrop.clear();

                switch(viewType) {
                	case 'movies':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'movies/movies.html?parentid=' + viewId));
                	    break;
                	case 'tvshows':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'tv/tv.html?parentid=' + viewId));
                	    break;
                	case 'music':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'music/music.html?tab=albumartists&parentid=' + viewId));
                	    break;
                	case 'homevideos':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
                	    break;
                	case 'folders':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
                	    break;
                	default:
                		Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
                }
            }
        }, true);


        function renderSubMenuButtons(items) {
            var html = '';
            for(var item in items)
            {
                html += '<paper-button data-id="' + items[item].id + '" data-view="' + items[item].viewType + '" data-tab="' + items[item].tab + '"><iron-icon icon="' + items[item].icon + '"></iron-icon> ' + items[item].title + '</paper-button>';
            }

            return html;
        }

        userViewNames.addEventListener('focus', function (e) {

            var subMenu = document.querySelector('.subMenu');

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                console.log("userViewNames Focused", elem);

                var viewId = elem.getAttribute('data-id');
                var viewType = elem.getAttribute('data-type');

                var html = '';

                var items = null;

                switch (viewType) {
                    case 'movies':
                        viewName = 'movies';

                        items = [
                            {
                                id: viewId,
                                title: 'Genres',
                                icon: 'video-library',
                                viewType: viewName,
                                tab: 'genres'
                            },
                            {
                                id: viewId,
                                title: 'Years',
                                icon: 'today',
                                viewType: viewName,
                                tab: 'years'
                            },
                            {
                                id: viewId,
                                title: 'Unwatched',
                                icon: 'new-releases',
                                viewType: viewName,
                                tab: 'unwatched'
                            },
                            {
                                id: viewId,
                                title: 'Top Rated',
                                icon: 'stars',
                                viewType: viewName,
                                tab: 'toprated'
                            }
                        ];
                    break;
                    case 'tvshows':
                        viewName = 'tv';

                        items = [
                            {
                                id: viewId,
                                title: 'All Series',
                                icon: 'tv',
                                viewType: viewName,
                                tab: 'series'
                            },
                            {
                                id: viewId,
                                title: 'Upcoming',
                                icon: 'today',
                                viewType: viewName,
                                tab: 'upcoming'
                            },
                            {
                                id: viewId,
                                title: 'Genres',
                                icon: 'video-library',
                                viewType: viewName,
                                tab: 'genres'
                            }
                        ];
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

                if(items) {
                    html = renderSubMenuButtons(items);
                }

                subMenu.innerHTML = html;
            }
        }, true);

        document.querySelector('.subMenu').addEventListener('click', function (e) {
            console.log('SubMenu clicked!', e.target);

            var elem = e.target;
            if (elem) {
                var viewId = elem.getAttribute('data-id');
                var viewType = elem.getAttribute('data-view');
                var viewTab = elem.getAttribute('data-tab');

                Emby.Backdrop.clear();

                switch(viewType) {
                	case 'movies':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'movies/movies.html?tab=' + viewTab + '&parentid=' + viewId));
                	    break;
                	case 'tv':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'tv/tv.html?tab=' + viewTab + '&parentid=' + viewId));
                	    break;
                	case 'music':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'music/music.html?tab=' + viewTab + '&parentid=' + viewId));
                	    break;
                	case 'homevideos':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
                	    break;
                	case 'folders':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
                	    break;
                	default:
                		Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
                }
            }
        });

        var showSettingsMenu = function () {
            Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'settings/settings.html'));
            // Emby.Page.show(Emby.PluginManager.mapRoute(themeId, 'list/list.html?parentid=' + viewId));
        }
        document.querySelector('.footerSettingsButton').addEventListener('click', function () {
            Emby.Backdrop.clear();
            showSettingsMenu();
        });

        // movies
        // tvshows
        //

        // Listen for navigation input and override
        var onInputCommand = function(e) {
            var ral = document.querySelector('.latestSection');
            var views = document.querySelector('.userViewNames');
            var subMenu = document.querySelector('.subMenu');

            if(parentWithClass(document.activeElement, 'homeNavigation') || parentWithClass(document.activeElement, 'latestSection'))
            {
                switch (e.detail.command) {
                    case 'up':
                        console.log('document.activeElement', document.activeElement);

                        if(parentWithClass(document.activeElement, 'subMenu'))
                        {
                            subMenu.classList.remove('active');
                        }
                        else if(!document.activeElement.classList.contains('footerSettingsButton'))
                        {
                            e.preventDefault();

                            ral.classList.add('active');
                            views.classList.add('hidden');

                            setTimeout(function () {
                                focusManager.autoFocus(ral);
                            }, 600);
                        }

                        break;

                    case 'down':
                        // RAL is active
                        if (ral.classList.contains('active'))
                        {
                            e.preventDefault();
                            ral.classList.remove('active');
                            views.classList.remove('hidden');

                            setTimeout(function () {
                                focusManager.autoFocus(views);
                            }, 600);
                        }
                        // RAL is not active
                        else {
                            // User Views are visible
                            if(!views.classList.contains('hidden') && !subMenu.classList.contains('active'))
                            {
                                e.preventDefault();

                                subMenu.classList.add('active');

                                setTimeout(function () {
                                    focusManager.autoFocus(subMenu);
                                }, 600);
                            }
                            //alert("No active class, we should show sub-menu ;)");
                        }

                        break;

                    default:
                        break;
                }
            }
        }
        inputManager.on(window, onInputCommand);

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
