// wrap inside immediately invoked function expression (IIFE)
(function () {
    // get canvas context so we can use them
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    // create global variables
    var player = {};
    var ground = [];
    // default variables for where the platfroms will be placed (4 rows from bottom)
    var platformWidth = 32;
    var platformHeight = canvas.height - platformWidth * 4;
    /**
     * Request Animation Polyfill
     */
    var requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
    /**
     * Asset pre-loader object. Loads all images and sounds (holds all image and audio objects)
     */
    var assetLoader = (function () {
        // images dictionary (all img assets)
        this.imgs = {
            "bg": "imgs/bg.png",
            "sky": "imgs/sky.png",
            "backdrop": "imgs/backdrop.png",
            "backdrop2": "imgs/backdrop_ground.png",
            "grass": "imgs/grass.png",
            "avatar_normal": "imgs/normal_walk.png"
        };

        // counts how many assets have been loaded
        var assetsLoaded = 0;
        // counting img assets so we know how much are needed to load before starting game
        var numImgs = Object.keys(this.imgs).length;
        // total number of assets
        this.totalAssets = numImgs;
        /**
         * Marks the loaded assets to ensure all assets are loaded before using them...
         * @param {number} dic - Dictionary name ('imgs')
         * @param {number} name - Name of asset in the dictionary
         */
        function assetLoaded(dic, name) {
            // if asset is not loading then just return
            if (this[dic][name].status !== "loading") {
                return;
            }
            this[dic][name].status = "loaded";
            assetsLoaded++; //if not then add 1 to assetsLoader counter
            // if the loaded assets is equal to the number in the imgs objects 
            // then finish callback --defined at the end so we know when loaded
            if (assetsLoaded === this.totalAssets && typeof this.finished === "function") {
                this.finished();
            }
        }
        /**
         * will start download process by turning img assets in to img object, marking it as loading, gives a cb function once loaded
         */
        this.downloadAll = function () {
            // create a private reference to the 'this' pointer so it can be used later
            var _this = this;
            var src;
            // loop through imgs in the this.imgs dictionary
            for (var img in this.imgs) {
                // if the img dir has img as a property which it does
                if (this.imgs.hasOwnProperty(img)) {
                    src = this.imgs[img];
                    // create closure for event binding IIFE also creates img object
                    // we wrap in IIFE to assign a cb that can use the img in the downloadall function
                    (function (_this, img) {
                        _this.imgs[img] = new Image();
                        _this.imgs[img].status = "loading";
                        _this.imgs[img].name = img;
                        // once loaded .call gives assetLoaded this cb function
                        _this.imgs[img].onload = function () { assetLoaded.call(_this, "imgs", img) };
                        _this.imgs[img].src = src;
                    })(_this, img);
                }
            }

        }
        return {
            imgs: this.imgs,
            totalAssets: this.totalAssets,
            downloadAll: this.downloadAll
        };
    })();

    assetLoader.finished = function () {
        startGame();
    }
})();