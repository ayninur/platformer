/////////////////////////////////////////////////////////////
// DRAW CANVAS
/////////////////////////////////////////////////////////////
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

    ///////////////////////////////////////////////
    // CREATE ASSET LOADER - loads and access imgs
    //////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////
    // SPITESHEET - Sprite animation for our main character
    ////////////////////////////////////////////////////////

    /**
   * Creates a Spritesheet
   * @param {string} - Path to the image.
   * @param {number} - Width (in px) of each frame.
   * @param {number} - Height (in px) of each frame.
   */
    function SpriteSheet(path, frameWidth, frameHeight) {
        this.image = new Image();
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;

        // calculate the number of frames in a row after the image loads
        var self = this;
        this.image.onload = function () {
            self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
        };

        this.image.src = path;
    }

    /**
     * Creates an animation from a spritesheet.
     * @param {SpriteSheet} - The spritesheet used to create the animation.
     * @param {number}      - Number of frames to wait for before transitioning the animation.
     * @param {array}       - Range or sequence of frame numbers for the animation.
     * @param {boolean}     - Repeat the animation once completed.
     */
    function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

        var animationSequence = [];  // array holding the order of the animation
        var currentFrame = 0;        // the current frame to draw
        var counter = 0;             // keep track of frame rate

        // start and end range for frames
        for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
            animationSequence.push(frameNumber);

        /**
         * Update the animation
         */
        this.update = function () {

            // update to the next frame if it is time
            if (counter == (frameSpeed - 1))
                currentFrame = (currentFrame + 1) % animationSequence.length;

            // update the counter
            counter = (counter + 1) % frameSpeed;
        };

        /**
         * Draw the current frame
         * @param {integer} x - X position to draw
         * @param {integer} y - Y position to draw
         */
        this.draw = function (x, y) {
            // get the row and col of the frame
            var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
            var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

            ctx.drawImage(
                spritesheet.image,
                col * spritesheet.frameWidth, row * spritesheet.frameHeight,
                spritesheet.frameWidth, spritesheet.frameHeight,
                x, y,
                spritesheet.frameWidth, spritesheet.frameHeight);
        };
    }

    /**
     * Create a parallax background - creates an illusion of moving by panning the image
     */
    var background = (function () {
        var sky = {};
        var backdrop = {};
        var backdrop2 = {};

        /**
         * Draw the backgrounds to the screen at different speeds
         */
        this.draw = function () {
            ctx.drawImage(assetLoader.imgs.bg, 0, 0);

            // Pan background
            sky.x -= sky.speed;
            backdrop.x -= backdrop.speed;
            backdrop2.x -= backdrop2.speed;

            // draw images side by side to loop
            ctx.drawImage(assetLoader.imgs.sky, sky.x, sky.y);
            ctx.drawImage(assetLoader.imgs.sky, sky.x + canvas.width, sky.y);

            ctx.drawImage(assetLoader.imgs.backdrop, backdrop.x, backdrop.y);
            ctx.drawImage(assetLoader.imgs.backdrop, backdrop.x + canvas.width, backdrop.y);

            ctx.drawImage(assetLoader.imgs.backdrop2, backdrop2.x, backdrop2.y);
            ctx.drawImage(assetLoader.imgs.backdrop2, backdrop2.x + canvas.width, backdrop2.y);

            // If the image scrolled off the screen, reset
            if (sky.x + assetLoader.imgs.sky.width <= 0)
                sky.x = 0;
            if (backdrop.x + assetLoader.imgs.backdrop.width <= 0)
                backdrop.x = 0;
            if (backdrop2.x + assetLoader.imgs.backdrop2.width <= 0)
                backdrop2.x = 0;
        };

        /**
         * Reset background to zero
         */
        this.reset = function () {
            sky.x = 0;
            sky.y = 0;
            sky.speed = 0.2;

            backdrop.x = 0;
            backdrop.y = 0;
            backdrop.speed = 0.4;

            backdrop2.x = 0;
            backdrop2.y = 0;
            backdrop2.speed = 0.6;
        }

        return {
            draw: this.draw,
            reset: this.reset
        };
    })();

    /**
     * Game loop
     */
    function animate() {
        requestAnimFrame(animate);

        background.draw();

        for (i = 0; i < ground.length; i++) {
            ground[i].x -= player.speed;
            ctx.drawImage(assetLoader.imgs.grass, ground[i].x, ground[i].y);
        }

        if (ground[0].x <= -platformWidth) {
            ground.shift();
            ground.push({ 'x': ground[ground.length - 1].x + platformWidth, 'y': platformHeight });
        }

        player.anim.update();
        player.anim.draw(90, 260);
    }

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
     * Start the game (by creating an animation loop) - reset all variables and entities, spawn platforms and water.
     */
    function startGame() {
        // setup the player
        player.width = 150;
        player.height = 130;
        player.speed = 6; //moves all objects on the screen at a constant rate (not the player)
        player.sheet = new SpriteSheet('imgs/normal_walk.png', player.width, player.height);
        player.anim = new Animation(player.sheet, 4, 0, 15);

        // create the ground tiles (ensure theres 2 more than would fit on screen so we have a buffer)
        for (i = 0, length = Math.floor(canvas.width / platformWidth) + 2; i < length; i++) {
            ground[i] = { 'x': i * platformWidth, 'y': platformHeight };
        }

        background.reset();

        animate();
    }

    assetLoader.downloadAll();
})();