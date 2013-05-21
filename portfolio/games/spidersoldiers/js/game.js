// Globals
var global = {
    WIDTH: 1136,
    HEIGHT: 640,
    DOUBLE: true,
    DEBUG: true,
    state: {
        localPlayer: undefined,
        remotePlayers: []
    }
}

var game = {
    onload: function() {
        if (!me.video.init("screen", global.WIDTH, global.HEIGHT, global.DOUBLE)) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        me.sys.preRender = true;
        me.sys.useNativeAnimFrame = true;
        me.sys.stopOnAudioError = false;
        me.debug.renderCollisionMap = true;
        me.debug.renderHitBox = true;
        me.debug.renderVelocity = true;

        me.loader.onload = this.loaded.bind(this);
        this.loadResources();

        // Start loading / load screen
        me.state.set(me.state.LOADING, new game.loadScreen());
        me.state.change(me.state.LOADING);
    },

    // Awesome resource loading function stolen from Jason Oster
    loadResources: function () {
        var resources = [];

        // Graphics.
        this.resources["img"].forEach(function forEach(value) {
            resources.push({
                name: value,
                type: "image",
                src : "assets/img/" + value + ".png"
            })
        });

        // Atlases.
        this.resources["tps"].forEach(function forEach(value) {
            resources.push({
                name  : value,
                type  : "tps",
                src   : "assets/img/" + value + ".json"
            })
        });

        // Maps.
        this.resources["map"].forEach(function forEach(value) {
            resources.push({
                 name  : value,
                 type  : "tmx",
                 src   : "assets/maps/" + value + ".json"
            })
        });

        // Load the resources.
        me.loader.preload(resources);
    },

    loaded : function () {
        // Game states
        me.state.set(me.state.MENU, new game.startScreen());
        game.playscreen = new game.playScreen();
        me.state.set(me.state.PLAY, game.playscreen);
        me.state.set(me.state.GAME_END, new game.EndScreen());

        me.input.bindKey(me.input.KEY.ENTER, "action");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.LEFT, "left");
        me.input.bindKey(me.input.KEY.SPACE, "jump");

        //me.entityPool.add("player", game.Player, 35, 260);
        //me.entityPool.add("virgil", game.Virgil);

        // Load texture.
        game.texture = new me.TextureAtlas(
            me.loader.getAtlas("texture"),
            me.loader.getImage("texture")
        );

        me.game.sort(game.sort);

        // Start the game.
        me.state.change(me.state.MENU);
    },
};
