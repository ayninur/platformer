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
     * Asset pre-loader object. Loads all images and sounds (also holds all image and audio objects)
     */
    var assetLoader = (function () {
        // images dictionary
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
        // total number of image assets
        var numImgs = Object.keys(this.imgs).length
        // total number of assets
        this.totalAssets = numImgs;
        /**
         * To ensure all assets are loaded before using them...
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
            // then finish callback
            if (assetsLoaded === this.totalAssets && typeof this.finished === "function") {
                this.finished();
            }

        }
    })();
})();