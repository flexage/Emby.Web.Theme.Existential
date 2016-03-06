define([], function () {

    var skinId = 'existential';

	function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clearBackdrops() {
        Emby.Backdrop.clearBackdrops(true);
    }

    function setStaticBackdrop() {

        return;
        //var path = Emby.PluginManager.mapPath(skinId, 'css/images/blur' + getRandomInt(1, 6) + '.png');
        var path = Emby.PluginManager.mapPath(skinId, 'css/images/bg1.jpg');
        Emby.Backdrop.setBackdrop(path);

        setTimeout(function () {
            document.querySelector('.skinContainer').classList.add('staticBackdrop');
        }, 1000);
    }

    function setBackdrops(items, isFocused) {

        //var skinContainer = document.querySelector('.skinContainer');

        //if (isFocused) {
        //    if (!skinContainer.classList.contains('listBackdropIn')) {
        //        skinContainer.classList.add('listBackdropIn');
        //        skinContainer.classList.remove('listBackdropOut');
        //    }
        //} else {
        //    if (!skinContainer.classList.contains('listBackdropOut')) {
        //        skinContainer.classList.remove('listBackdropIn');
        //        skinContainer.classList.add('listBackdropOut');
        //    }
        //}
        //document.querySelector('.skinContainer').classList.remove('staticBackdrop');

        if (isFocused) {
            Emby.Backdrop.setBackdrops(items);
        } else {
            Emby.Backdrop.setBackdrops(items);
        }
    }

    function subdued(isSubdued) {

        var elem = document.querySelector('.skinContainer');
        if (isSubdued) {

            elem.classList.remove('detailBackdrop');

        } else {
            elem.classList.add('detailBackdrop');
        }
    }

    return {
        setStaticBackdrop: setStaticBackdrop,
        setBackdrops: setBackdrops,
        subdued: subdued
    };
});
