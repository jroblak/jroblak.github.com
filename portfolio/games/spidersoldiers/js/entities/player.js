game.Player = game.Entity.extend({
    init: function (x, y, settings) {
        this.parent(x, y, settings);
        this.setVelocity(4.0, 5.0);
        this.setFriction(0.5, 0.5);
        this.gravity *= 3;
        this.id;
        this.moving = false;
        this.direction = 'right';
        this.font = new me.Font("Verdana", 10, "#000", "center");

        if(this.name === "player") {
            global.state.localPlayer = this;
            me.game.viewport.follow(this, me.game.viewport.AXIS.BOTH);
        }

        var names = [];
        /*
        var dirs = [ "left", "right", "up", "down" ];
        for (var j = 0; j < dirs.length; j++) {
            for (var i = 1; i <= 7; i++) {
                names.push("player-" + dirs[j] + "-" + i + ".png");
            }
            names.push("player-stand-"+dirs[j]+".png")
        }
        */

        names.push("spider-1.png");
        names.push("spider-2.png");
        names.push("spider-3.png");

        this.renderable = game.texture.createAnimationFromName(names);
        this.renderable.animationspeed = ~~(me.sys.fps / 30);

        this.renderable.addAnimation("stand-left", [0]);
        this.renderable.addAnimation("left", [
            0, 1, 2
        ]);

        this.renderable.addAnimation("stand-right", [0]);
        this.renderable.addAnimation("right", [
            0, 1, 2
        ]);

        this.renderable.setCurrentAnimation("stand-right");
    },

    update : function () {
        // Movement
        var self = this;

        if(this.name === 'player') {
            if(me.input.isKeyPressed("left")) {
                this.moving = true;
                this.direction = "left";
            } else if(me.input.isKeyPressed("right")) {
                this.moving = true;
                this.direction = "right";
            }

            if(me.input.isKeyPressed("jump") && !this.jumping && !this.falling) {
                this.accel.y = 70;
                this.jumping = true;
            }

        }

        if(me.sys.isMobile) {
            var vp = me.game.viewport;

            me.input.registerMouseEvent("mousedown", vp, function () {
                var touches = me.input.touches;

                if(touches[0].x > self.pos.x) {
                    self.moving = true;
                    self.direction = "right";
                } else {
                    self.moving = true;
                    self.direction = "left";
                }
            }, false);
            me.input.registerMouseEvent("mouseup", vp, function () {
                self.moving = false;
            }, false);

        }

        me.game.collide(this, true);
        var result = this.parent();

        if(result) {
            socket.emit("move player", {x: this.pos.x, y: this.pos.y});
        }

        return result;
    },

    draw: function(context) {
            var self= this;
            this.font.draw(
                context,
                self.name,
                self.pos.x + 25,
                self.pos.y - 15
            );

            this.parent(context);
    }
});
