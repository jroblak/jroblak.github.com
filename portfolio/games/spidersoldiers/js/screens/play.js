game.playScreen = me.ScreenObject.extend({
    onResetEvent : function () {
        me.game.onLevelLoaded = this.onLevelLoaded.bind(this);

        me.levelDirector.loadLevel("main");
        me.game.addHUD(0, 0, global.WIDTH, 20, "rgba(0, 0, 0, 0.5)");
        me.game.HUD.addItem("latency", new game.Info(10, 5, "latency"));
        me.game.HUD.addItem("connected", new game.Info(100, 5, "connected players"));

        playerById = function(id) {
            var i;

            for (i = 0; i < global.state.remotePlayers.length; i++) {
                if (global.state.remotePlayers[i].id == id)
                    return global.state.remotePlayers[i];
            };

            return false;
        };
    },

    onLevelLoaded : function (name) {
        me.game.viewport.fadeOut("#000", 500);

        global.state.localPlayer = new game.Player(40, 190, {
            spritewidth: 50,
            spriteheight: 30,
            name: "player"
        });
        global.state.localPlayer.id = "player";

        me.game.add(global.state.localPlayer, 4);
        me.game.sort();

        socket = io.connect("http://localhost", {port: 8000, transports: ["websocket"]});

        socket.on("connect", this.onSocketConnected);
        socket.on("new player", this.onNewPlayer);
        socket.on("move player", this.onMovePlayer);
        socket.on("remove player", this.onRemovePlayer);
        socket.on("pong", this.updateLatency);
    },

    onDestroyEvent: function () {
        // Unbind keys
        me.input.unbindKey(me.input.KEY.LEFT);
        me.input.unbindKey(me.input.KEY.RIGHT);
        me.input.unbindKey(me.input.KEY.UP);
        me.input.unbindKey(me.input.KEY.DOWN);
    },

    onSocketConnected: function() {
        console.log("Connected to socket server");
        socket.emit("new player", {x: global.state.localPlayer.pos.x, y: global.state.localPlayer.pos.y})
        setInterval(function () {
            global.state.emitTime = +new Date;
            socket.emit('ping');
        }, 500);
    },

    updateLatency: function() {
        global.state.latency = (+new Date - global.state.emitTime)
        console.log(global.state.latency);
        me.game.HUD.setItemValue("latency", global.state.latency);
    },

    onNewPlayer: function(data) {
        var newPlayer = new game.Player(data.x, data.y, {
            spritewidth: 50,
            spriteheight: 30,
            name: "o"
        });
        newPlayer.id = data.id;
        newPlayer.name = data.name;

        global.state.remotePlayers.push(newPlayer);

        me.game.add(newPlayer, 3);
        me.game.sort(game.sort);

        me.game.HUD.setItemValue("connected", global.state.remotePlayers.length);
    },

    onRemovePlayer: function(data) {
        var removePlayer = playerById(data.id);

        if(!removePlayer) {
            console.log("Player not found "+data.id);
            return;
        };

        me.game.remove(removePlayer);
        me.game.sort();
        global.state.remotePlayers.splice(global.state.remotePlayers.indexOf(removePlayer), 1);
    },

    onMovePlayer: function(data) {
        var movePlayer = playerById(data.id);

        if(!movePlayer || movePlayer.name === 'player') {
            return;
        }
        console.log(movePlayer.name+" just moved");
        movePlayer.pos.x = data.x;
        movePlayer.pos.y = data.y;
    }
});
