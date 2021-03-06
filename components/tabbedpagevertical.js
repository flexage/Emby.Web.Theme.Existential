define(['loading', 'slyScroller', './focushandler', 'focusManager', 'connectionManager', 'imageLoader', 'inputManager', 'playbackManager'], function (loading, slyScroller, focusHandler, focusManager, connectionManager, imageLoader, inputManager, playbackManager) {

    var skinId = 'existential';

    var apiClient = connectionManager.currentApiClient();

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

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

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                elem.focus();
            }
        });

        userViewNames.addEventListener('focus', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

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
            var oldSelectedItem = document.querySelector('.selectedItemId')
            var oldSelectedItemId = '';
            if(oldSelectedItem) {
                oldSelectedItemId = oldSelectedItem.getAttribute('data-selected-id');
            }
            // Build Item Info Pane
            var itemInfoElement = document.querySelector('.itemInfo');
            var selectedIndexElement = document.querySelector('.selectedIndex');
            var focused = focusManager.focusableParent(e.target);

            var itemId = focused.getAttribute('data-id');

            if(itemId === oldSelectedItemId) return;

            Emby.Models.item(itemId).then(function (item) {
                console.log('itemResult', item);

                var imageUrlPrimary = apiClient.getImageUrl(item.Id, {
                    type: "Primary",
                    maxHeight: 400,
                    maxWidth: 300,
                    tag: item.ImageTags.Primary
                });

                var imageUrlBackdrop = apiClient.getImageUrl(item.Id, {
                    type: "Backdrop",
                    maxHeight: 1920,
                    maxWidth: 1080,
                    tag: item.BackDropImageTags
                });

                var html = '';
                html += '<div class="selectedItemId hide" data-selected-id="' + itemId + '"></div>'
                html += '<div class="primary lazy" data-src="' + imageUrlPrimary + '"></div>';
                html += '<div class="backdrop lazy" data-src="' + imageUrlBackdrop + '"></div>';

                html += '<div class="textInfo">';
                html += '<h1 class="name">' + item.Name + '</h1>';
                html += '<h1 class="year">' + item.ProductionYear + '</h1>';

                if(item.Genres.length > 0){
                    html += '<h2 class="genres">' + item.Genres.join(' / ') + '</h2>';
                }

                html += '<p class="overview">' + item.Overview + '</p>';
                html += '</div>';
                if(item.CommunityRating) {
                    html += '<div class="communityRating"><span class="rating">' + item.CommunityRating + '</span><span divider>/</span>10</div>';
                }

                if(item.RunTimeTicks)
                {
                    var runTime = Math.ceil((item.RunTimeTicks / 10000) / 60000);
                    html += '<div class="runTime">' + runTime + ' minutes</div>';
                }

                // var videoStream = (item.MediaStreams || []).filter(function (i) {
                //     return i.Type == 'Video';
                // })[0] || {};
                // var audioStream = (item.MediaStreams || []).filter(function (i) {
                //     return i.Type == 'Audio';
                // })[0] || {};
                //
                // console.log('videoStream', videoStream);
                // console.log('audioStream', audioStream);
                //
                // if(videoStream) {
                //     html += '';
                // }

                html += '<div class="mediaInfoPrimary">';
                var mediaSource = item.MediaSources[0];

                var videoStream = (mediaSource.MediaStreams || []).filter(function (i) {
                    return i.Type == 'Video';
                })[0] || {};
                var audioStream = (mediaSource.MediaStreams || []).filter(function (i) {
                    return i.Type == 'Audio';
                })[0] || {};

                var resolutionText = getResolutionText(item);
                if (resolutionText) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + resolutionText + '</div>';
                }

                var channels = getChannels(item);
                var channelText;

                if (channels == 8) {

                    channelText = '7.1';

                } else if (channels == 7) {

                    channelText = '6.1';

                } else if (channels == 6) {

                    channelText = '5.1';

                } else if (channels == 2) {

                    channelText = '2.0';
                }

                if (channelText) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + channelText + '</div>';
                }

                html += '</div>';

                html += '<div class="mediaInfo">';

                if (mediaSource.Container) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + mediaSource.Container + '</div>';
                }

                if (videoStream.Codec) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + videoStream.Codec + '</div>';
                }

                if (audioStream.Codec == 'dca' && audioStream.Profile) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + audioStream.Profile + '</div>';
                } else if (audioStream.Codec) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + audioStream.Codec + '</div>';
                }

                if (videoStream.AspectRatio) {
                    html += '<div class="mediaInfoIcon mediaInfoText">' + videoStream.AspectRatio + '</div>';
                }

                html += '</div>';

                itemInfoElement.innerHTML = html;

                imageLoader.lazyChildren(itemInfoElement);


                var index = focused.getAttribute('data-index');
                if (index) {
                    selectedIndexElement.innerHTML = 1 + parseInt(index);
                }

                var overviewElement = itemInfoElement.querySelector('.overview');

                var overviewHeight = overviewElement.scrollHeight;
                console.log('overviewElement.clientHeight', overviewElement.clientHeight);
                console.log('overviewElement.scrollHeight', overviewElement.scrollHeight);

                var scrollTime = 5000;

                //initOverviewScroll(overviewElement, overviewHeight, scrollTime);

                setTimeout(function () {
                    scrollOverview(overviewElement);
                }, 2000);


                // Selected Menu
                var selectedMenu = document.querySelector('.selectedMenu');

                var html = '';
                if(item.UserData.PlaybackPositionTicks > 0)
                {
                    // Convert ticks to hours and minutes
                    var positionTime = Math.ceil((item.UserData.PlaybackPositionTicks / 10000) / 60000);

                    html += '<button class="playbackResume" data-item-id="' + itemId + '">Resume from ' + positionTime + ' minutes</button>';
                }

                html += '<button class="playbackPlay" data-item-id="' + itemId + '">Play</button>';

                html += '<button class="moreInfo" data-item-id="' + itemId + '">More info</button>';

                if(item.LocalTrailerCount > 0)
                {
                    html += '<button class="playbackTrailer" data-item-id="' + itemId + '">Trailer</button>';
                }

                html += '<button>Mark as watched</button>';

                selectedMenu.innerHTML = html;

                bindSelectedMenuEvents(selectedMenu);
            });
        }

        function scrollOverview(overviewElement)
        {
            var currentPosition = overviewElement.scrollTop;
            var elementScrollHeight = overviewElement.scrollHeight;
            var elementClientHeight = overviewElement.clientHeight;

            if(currentPosition >= (elementScrollHeight - elementClientHeight) - 1) {
                setTimeout(function() {
                    overviewElement.scrollTop = 0;
                    setTimeout(function () {
                        scrollOverview(overviewElement);
                    }, 2000);
                }, 3000);
                return;
            }

            overviewElement.scrollTop += 1;

            setTimeout(function() {
                scrollOverview(overviewElement);
            }, 75);
        }

        function getResolutionText(item) {

            if (!item.MediaSources || !item.MediaSources.length) {
                return null;
            }

            return item.MediaSources[0].MediaStreams.filter(function (i) {

                return i.Type == 'Video';

            }).map(function (i) {

                if (i.Height) {

                    if (i.Width >= 4000) {
                        return '4K';
                    }
                    if (i.Width >= 2500) {
                        return '1440P';
                    }
                    if (i.Width >= 1900) {
                        return '1080P';
                    }
                    if (i.Width >= 1260) {
                        return '720P';
                    }
                    if (i.Width >= 700) {
                        return '480P';
                    }

                }
                return null;
            })[0];

        }

        function getChannels(item) {

            if (!item.MediaSources || !item.MediaSources.length) {
                return 0;
            }

            return item.MediaSources[0].MediaStreams.filter(function (i) {

                return i.Type == 'Audio';

            }).map(function (i) {
                return i.Channels;
            })[0];

        }

        function bindSelectedMenuEvents(selectedMenu) {

            inputManager.on(window, onInputCommand);

            selectedMenu.addEventListener('click', function(e) {
                var focussed = focusManager.focusableParent(e.target);
            });

            var playbackPlay = selectedMenu.querySelector('.playbackPlay');
            if(playbackPlay)
            {
              playbackPlay.addEventListener('click', function (e) {
                  var itemId = e.target.getAttribute('data-item-id');
                  Emby.Models.item(itemId).then(function (item) {
                      playbackManager.play({
                          items: [item]
                      });
                  });
              });
            }

            var playbackResume = selectedMenu.querySelector('.playbackResume');
            if(playbackResume)
            {
              playbackResume.addEventListener('click', function (e) {
                  var itemId = e.target.getAttribute('data-item-id');
                  Emby.Models.item(itemId).then(function (item) {
                      playbackManager.play({
                          ids: [itemId],
                          startPositionTicks: item.UserData.PlaybackPositionTicks,
                          serverId: item.ServerId
                      });
                  });
              });
            }

            var playbackTrailer = selectedMenu.querySelector('.playbackTrailer');
            if(playbackTrailer)
            {
              playbackTrailer.addEventListener('click', function (e) {
                var itemId = e.target.getAttribute('data-item-id');
                console.log("Playing Trailer for ...", itemId);
                Emby.Models.item(itemId).then(function (item) {
                  console.log(item);
                  playbackManager.playTrailer(item);
                });
              });
            }
        }

        function onInputCommand(e) {
            console.log('****** onInputCommand');
            if(parentWithClass(document.activeElement, 'selectedMenu'))
            {
                console.log('****** if(parentWithClass(document.activeElement, selectedMenu))');
                var selectedMenu = parentWithClass(document.activeElement, 'selectedMenu');
                var selectedItemId = document.querySelector('.selectedItemId').getAttribute('data-selected-id');
                console.log('selectedItemId', selectedItemId);
                var selectedItem = document.querySelector('.libraryScrollSlider [data-id="' + selectedItemId + '"]')
                console.log('selectedItem', selectedItem);

                switch (e.detail.command) {

                    case 'back':
                        e.preventDefault();
                        selectedMenu.classList.add('offScreen');
                        focusManager.focus(selectedItem);
                        break;
                    case 'left':
                        e.preventDefault();
                        selectedMenu.classList.add('offScreen');
                        focusManager.focus(selectedItem);
                        break;
                    case 'right':
                    case 'up':
                    case 'down':
                    case 'select':
                    case 'menu':
                    case 'info':
                    case 'play':
                    case 'playpause':
                    case 'pause':
                    case 'fastforward':
                    case 'rewind':
                        break;
                    default:
                        break;
                }
            }
        }

        function updateVertbarClock() {

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

            var clock = document.querySelector('.vertClock');

            if (clock) {
                clock.innerHTML = time;
            }

            // var dateEl = document.querySelector('.footerDate');
            //
            // if (dateEl){
            //     dateEl.innerHTML = dateString;
            // }
        }

        updateVertbarClock();

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
