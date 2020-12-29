/////////////////////////////////////////////////////////////
// DRAW CANVAS
/////////////////////////////////////////////////////////////
// wrap inside immediately invoked function expression (IIFE)
const drawCanvas = function () {
    // get canvas context so we can use them
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    // create global variables
    var player, score, stop, ticker;
    var ground = [], water = [], enemies = [], environment = [];
    var platformHeight, platformLength, gapLength;
    var platformWidth = 32;
    var platformBase = canvas.height - platformWidth;//bottom row of the game
    var platformSpacer = 64;

    // /**
    //  * Get a random number range
    //  * @param {integer}
    //  * @param {integer}
    //  */
    // function rand(low, high) {
    //     return Math.floor(Math.random() * (high - low + 1) + low)
    // }

    /**
     * Request Animation Polyfill
     */
    var requestAnimFrame = function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element) {
                window.setTimeout(callback, 1000 / 60);
            };
    }
    requestAnimFrame()

    ///////////////////////////////////////////////
    // CREATE ASSET LOADER - loads and access imgs
    //////////////////////////////////////////////
    /**
     * Asset pre-loader object. Loads all images and sounds (holds all image and audio objects)
     */
    var assetLoader = (function () {
        // images dictionary (all img assets)
        this.imgs = {
            'bg': 'imgs/bg.png',
            'sky': 'imgs/sky.png',
            'backdrop': 'imgs/backdrop.png',
            'backdrop2': 'imgs/backdrop_ground.png',
            'grass': 'imgs/grass.png',
            'avatar_normal': 'imgs/normal_walk.png',
            'water': 'imgs/backdrop_ground.png',
            'grass1': 'imgs/grassMid1.png',
            'grass2': 'imgs/grassMid2.png',
            'bridge': 'imgs/bridge.png',
            'plant': 'imgs/plant.png',
            'bush1': 'imgs/bush1.png',
            'bush2': 'imgs/bush2.png',
            'cliff': 'imgs/grassCliffRight.png',
            // 'spikes': 'imgs/spikes.png',  
            'box': 'imgs/boxCoin.png',
            'slime': 'imgs/slime.png'
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

    /** //change to class inheritance**
     * Vector: stores current position and how to update the position with every frame for every object in our game
     * @param {integer} x - Center x coordinate
     * @param {integer} y - Center y coordinate
     * @param {integer} dx - Change in x
     * @param {integer} dy - Change in y
     */
    // with this object later we can create all of our game objects that will inherit from it 
    function Vector(x, y, dx, dy) {
        // positioned
        this.x = x || 0;
        this.y = y || 0;
        // direction
        this.dx = dx || 0;
        this.dy = dy || 0;
    }

    /**
     * Advance the vectors position by dx and dy
     */
    Vector.prototype.advance = function () {
        this.x += this.dx;
        this.y += this.dy;
    };

    /**
     * Minimum Distance - determines if the horse will collide with a platform of enemy
     * to avoid the possibility of the object and the hourse missing eachother because of the frame we must calculate if at any point from point a to point b his path crosses the other object
     * @param {Vector}
     * @return minDist
     */
    Vector.prototype.minDist = function (vec) {
        var minDist = Infinity; //or greater than any other number or the largest value btwn the two objects
        var max = Math.max(Math.abs(this.dx), Math.abs(this.dy),
            Math.abs(vec.dx), Math.abs(vec.dy)); // stores x&y distance of this vec and the vector
        var slice = 1 / max;
        var x, y, distSquared;
        // determine the center of each object (because the equation only works if measured from center to center) (radian)
        var vec1 = {}, vec2 = {};
        vec1.x = this.x + this.width / 2;
        vec1.y = this.y + this.height / 2;
        vec2.x = vec.x + vec.width / 2;
        vec2.y = vec.y + vec.height / 2;

        // calculate the distance logic
        for (var percent = 0; percent < 1; percent += slice) {
            x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
            y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
            distSquared = x * x + y * y;

            minDist = Math.min(minDist, distSquared);
        }

        // we only need to return the smallest distance between the 2 objects bc this number determines whether or not the objects collided
        return Math.sqrt(minDist);
    };
    /**
     * The Player Object
     */

    var player = (function (player) {
        //  add properties directly to the imported player object
        // we'll start by defining the variables used to make horse run and jump
        player.width = 155;
        player.height = 125;
        player.speed = 6;

        // jumping
        player.gravity = 1;
        player.dy = 0;
        player.jumpDy = -10;
        player.isFalling = false; //let's us know when player is falling (so can't jump)
        player.isJumping = false; //let's us know when horse goes up in the air

        // spritesheets
        player.sheet = new SpriteSheet('imgs/normal_walk.png', player.width, player.height);
        // create 3 animations for each set of actions
        player.walkAnim = new Animation(player.sheet, 4, 0, 15);
        player.jumpAnim = new Animation(player.sheet, 4, 15, 15);
        player.fallAnim = new Animation(player.sheet, 4, 11, 11);
        player.anim = player.walkAnim;

        // use call to call the vector object so that it can set the x,y,dx,&dy variables for the player
        // like calling the contructor of parent object
        Vector.call(player, 0, 0, 0, player.dy);

        var jumpCounter = 0;  // how long the jump button can be pressed down will also controls so jumps aren't indefinite 

        /**
         * Update players position
         */

        //  determines if player is able to jump
        player.update = function () {
            //  if not currently jumping or falling
            if (KEY_STATUS.space && player.dy === 0 && !player.isJumping) {
                //  then jumping 
                player.isJumping = true;
                // after jump come back down
                player.dy = player.jumpDy;
                // lastly update counter
                jumpCounter = 12
            }
            //  if the player is at 12 and still jumping
            if (KEY_STATUS.space && jumpCounter) {
                // then come back down
                player.dy = player.jumpDy;
            }
            // update players position
            jumpCounter = Math.max(jumpCounter - 1, 0);
            this.advance();
            // add gravity if player is jumping or falling
            if (player.isFalling || player.isJumping) {
                player.dy += player.gravity;
            }
            // change animation if falling
            if (player.dy > 0) {
                player.anim = player.fallAnim;
            }
            // change animation is jumping
            else if (player.dy < 0) {
                player.anim = player.jumpAnim;
            }
            else {
                player.anim = player.walkAnim;
            }
            //lastly update animation
            player.anim.update();
        };
        /**
         * Draw player at current position to the screen
         */
        player.draw = function () {
            player.anim.draw(player.x, player.y);
        };
        /**
         * Reset the player's position for when game starts&restarts
         */
        player.reset = function () {
            player.x = 64;
            player.y = 250;
        };
        return player;
    })(Object.create(Vector.prototype));

    // /**
    //  * Keeping track of the spacebar events on key up and key down create an event
    //  */
    // var KEY_CODES = {
    //     32: "space"
    // };
    // var KEY_STATUS = {};
    // for (var code in KEY_CODES) {
    //     if (KEY_CODES.hasOwnProperty(code)) {
    //         KEY_STATUS[KEY_CODES[code]] = false;
    //     }
    // }
    // // update a better/more updated way to write this
    // document.onkeydown = function (e) {
    //     var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    //     if (KEY_CODES[keyCode]) {
    //         e.preventDefault();
    //         KEY_STATUS[KEY_CODES[keyCode]] = true;
    //     }
    // }
    // document.onkeyup = function (e) {
    //     var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    //     if (KEY_CODES[keyCode]) {
    //         e.preventDefault();
    //         KEY_STATUS[KEY_CODES[keyCode]] = false;
    //     }
    // }
    /**
     * Sprites are anything drawn to the screen (ground, obstacles)
     * @param {integer} x - Starting x position of the player
     * @param {integer} y - Starting y position of the player
     * @param {string} type - Type of sprite
     */
    // Sprite Object is for all the other non player objects on the screen since all are virtually the same we only need one object to define them
    // the object only needs to know where the image is on the screen and how to update and draw it
    // must be passed a type that matches one of the image name from assetLoader
    function Sprite(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = platformWidth;
        this.height = platformWidth;
        this.type = type;
        Vector.call(this, x, y, 0, 0); // call vector object so it can set these variables

        /**
         * Update the Sprite's position by the player's speed
         */
        this.update = function () {
            this.dx = -player.speed; //players speed but in the opposite direction
            this.advance();
        }
        /**
         * finally draw sprite at current position
         */
        this.draw = function () {
            ctx.save();
            ctx.translate(0.5, 0.5);
            ctx.drawImage(assetLoader.imgs[this.type], this.x, this.y);
            ctx.restore();
        };
    }
    Sprite.prototype = Object.create(Vector.prototype);

    /**
       * Get the type of a platform based on platform height
       * @return Type of platform
       */
    function getType() {
        var type;
        switch (platformHeight) {
            case 0:
            case 1:
                type = Math.random() > 0.5 ? 'grass1' : 'grass2';
                break;
            case 2:
                type = 'grass';
                break;
            case 3:
                type = 'bridge';
                break;
            case 4:
                type = 'box';
                break;
        }
        if (platformLength === 1 && platformHeight < 3 && rand(0, 3) === 0) {
            type = 'cliff';
        }

        return type;
    }
    /**
       * Update all ground position and draw. Also check for collision against the player.
       */
    function updateGround() {
        // animate ground
        player.isFalling = true;
        for (var i = 0; i < ground.length; i++) {
            ground[i].update();
            ground[i].draw();

            // stop the player from falling when landing on a platform
            var angle;
            if (player.minDist(ground[i]) <= player.height / 2 + platformWidth / 2 &&
                (angle = Math.atan2(player.y - ground[i].y, player.x - ground[i].x) * 180 / Math.PI) > -130 &&
                angle < -50) {
                player.isJumping = false;
                player.isFalling = false;
                player.y = ground[i].y - player.height + 5;
                player.dy = 0;
            }
        }

        // remove ground that have gone off screen
        if (ground[0] && ground[0].x < -platformWidth) {
            ground.splice(0, 1);
        }
    }

    /**
     * Update all water position and draw.
     */
    function updateWater() {
        // animate water
        for (var i = 0; i < water.length; i++) {
            water[i].update();
            water[i].draw();
        }

        // remove water that has gone off screen
        if (water[0] && water[0].x < -platformWidth) {
            var w = water.splice(0, 1)[0];
            w.x = water[water.length - 1].x + platformWidth;
            water.push(w);
        }
    }

    /**
     * Update all environment position and draw.
     */
    function updateEnvironment() {
        // animate environment
        for (var i = 0; i < environment.length; i++) {
            environment[i].update();
            environment[i].draw();
        }

        // remove environment that have gone off screen
        if (environment[0] && environment[0].x < -platformWidth) {
            environment.splice(0, 1);
        }
    }

    /**
     * Update all enemies position and draw. Also check for collision against the player.
     */
    function updateEnemies() {
        // animate enemies
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].update();
            enemies[i].draw();

            // player ran into enemy
            if (player.minDist(enemies[i]) <= player.width - platformWidth / 2) {
                gameOver();
            }
        }

        // remove enemies that have gone off screen
        if (enemies[0] && enemies[0].x < -platformWidth) {
            enemies.splice(0, 1);
        }
    }

    /**
     * Update the players position and draw
     */
    function updatePlayer() {
        player.update();
        player.draw();

        // game over
        if (player.y + player.height >= canvas.height) {
            gameOver();
        }
    }


    /**
     * Get a random number between range
     * @param {integer}
     * @param {integer}
     */
    // randomly determines
    function rand(low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }
    /**
     * Bound a number between range
     * @param {integer} num - Number to bound
     * @param {integer}
     * @param {integer}
     */
    function bound(num, low, high) {
        return Math.max(Math.min(num, high), low);
    }
    /**
     * Spawn new sprites off screen
     */
    function spawnSprites() {
        // increase score which tracks how many platforms the player has crossed or how far the player has run
        score++;
        // creates any gaps by not creating new sprites if gap length is > 0
        // first create a gap
        if (gapLength > 0) {
            gapLength -= 1;
        }
        // then create ground
        else if (platformLength > 0) {
            var type = getType();
            // if no gaps then create a new platform based on the height of the current platform
            ground.push(new Sprite(
                canvas.width + platformWidth % player.speed,
                platformBase - platformHeight * platformSpacer,
                type
            ));
            // if no gaps or platforms left to create generate new gap speed
            platformLength -= 1;
            // add random environment sprites
            spawnEnvironmentSprites();
            // add random enemies
            spawnEnemySprites();
        }
        // start over
        else {
            // increase gap length every speed increase of 4
            gapLength = rand(player.speed - 2, player.speed);
            // only allow a ground to increase by 1 so not too high
            platformHeight = bound(rand(0, platformHeight + rand(0, 2)), 0, 4);
            platformLength = rand(Math.floor(player.speed / 2), player.speed * 4);
        }
    }
    /**
       * Spawn new environment sprites off screen
       */
    function spawnEnvironmentSprites() {
        if (score > 40 && rand(0, 20) === 0 && platformHeight < 3) {
            if (Math.random() > 0.5) {
                environment.push(new Sprite(
                    canvas.width + platformWidth % player.speed,
                    platformBase - platformHeight * platformSpacer - platformWidth,
                    'plant'
                ));
            }
            else if (platformLength > 2) {
                environment.push(new Sprite(
                    canvas.width + platformWidth % player.speed,
                    platformBase - platformHeight * platformSpacer - platformWidth,
                    'bush1'
                ));
                environment.push(new Sprite(
                    canvas.width + platformWidth % player.speed + platformWidth,
                    platformBase - platformHeight * platformSpacer - platformWidth,
                    'bush2'
                ));
            }
        }
    }

    /**
     * Spawn new enemy sprites off screen
     */
    function spawnEnemySprites() {
        if (score > 100 && Math.random() > 0.96 && enemies.length < 3 && platformLength > 5 &&
            (enemies.length ? canvas.width - enemies[enemies.length - 1].x >= platformWidth * 3 ||
                canvas.width - enemies[enemies.length - 1].x < platformWidth : true)) {
            enemies.push(new Sprite(
                canvas.width + platformWidth % player.speed,
                platformBase - platformHeight * platformSpacer - platformWidth,
                Math.random() > 0.5 ? 'spikes' : 'slime'
            ));
        }
    }
    // }
    /**
       * Game loop
       */
    function animate() {
        if (!stop) {
            requestAnimFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            background.draw();

            // update entities
            updateWater();
            updateEnvironment();
            updatePlayer();
            updateGround();
            updateEnemies();

            // draw the score
            ctx.fillText('Score: ' + score + 'm', canvas.width - 140, 30);

            // spawn a new Sprite
            if (ticker % Math.floor(platformWidth / player.speed) === 0) {
                spawnSprites();
            }

            // increase player speed only when player is jumping
            if (ticker > (Math.floor(platformWidth / player.speed) * player.speed * 20) && player.dy !== 0) {
                player.speed = bound(++player.speed, 0, 15);
                player.walkAnim.frameSpeed = Math.floor(platformWidth / player.speed) - 1;

                // reset ticker
                ticker = 0;

                // spawn a platform to fill in gap created by increasing player speed
                if (gapLength === 0) {
                    var type = getType();
                    ground.push(new Sprite(
                        canvas.width + platformWidth % player.speed,
                        platformBase - platformHeight * platformSpacer,
                        type
                    ));
                    platformLength--;
                }
            }

            ticker++;
        }
    }

    /**
     * Keep track of the spacebar events
     */
    var KEY_CODES = {
        32: 'space'
    };
    var KEY_STATUS = {};
    for (var code in KEY_CODES) {
        if (KEY_CODES.hasOwnProperty(code)) {
            KEY_STATUS[KEY_CODES[code]] = false;
        }
    }
    document.onkeydown = function (e) {
        var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
        if (KEY_CODES[keyCode]) {
            e.preventDefault();
            KEY_STATUS[KEY_CODES[keyCode]] = true;
        }
    };
    document.onkeyup = function (e) {
        var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
        if (KEY_CODES[keyCode]) {
            e.preventDefault();
            KEY_STATUS[KEY_CODES[keyCode]] = false;
        }
    };

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
     * Start the game - reset all variables and entities, spawn ground and water.
     */
    function startGame() {
        document.getElementById('game-over').style.display = 'none';
        ground = [];
        water = [];
        environment = [];
        enemies = [];
        player.reset();
        ticker = 0;
        stop = false;
        score = 0;
        platformHeight = 2;
        platformLength = 15;
        gapLength = 0;

        ctx.font = '16px arial, sans-serif';

        for (var i = 0; i < 30; i++) {
            ground.push(new Sprite(i * (platformWidth - 3), platformBase - platformHeight * platformSpacer, 'grass'));
        }

        for (i = 0; i < canvas.width / 32 + 2; i++) {
            water.push(new Sprite(i * platformWidth, platformBase, 'water'));
        }

        background.reset();

        animate();
    }

    /**
     * End the game and restart
     */
    function gameOver() {
        stop = true;
        document.getElementById('game-over').style.display = 'block';
    }

    document.getElementById('restart').addEventListener('click', startGame);

    assetLoader.downloadAll();
}();