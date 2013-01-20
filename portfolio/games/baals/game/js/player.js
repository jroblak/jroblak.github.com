// Global for player speed -- bad work aruond for the level up funtion
pspeed = 1;


// Player entity 
Crafty.c("Player", {
	// List of objects holding various states for the player. Should be fairly obvious
	hp: {
		current: 3,
		max: 3
	},
	sword: {
		type: "basic"
	},
	questItems: {
		ball: false, // First boss item -- enables magic attack
		ball2: false, // Second boss item -- enables magic jump
		ball3: false // Third boss item -- TBD
	},
	magic: {
		current: 10,
		max: 10
	},
	otherItems: {
		addLater: false, // Example expandability, neither do anything right now
		moreLater: false
	},
	attack: false, //   Various states the player can be in.
	shoot: false,  //   Used to delay repeat actions in a very short amount of time.
	blink: false,  //   (including getting hurt)  
	hurt: false,  
	jumpDist: 75,  //	Magic jump distance. May make expandable later 
	facing: "down",//   Player 'facing' direction -- used for animations, attacks, jumps, etc.

	// Initial constructor function
	init: function() {
		this.requires("2D, DOM, Collision, Fourway, Keyboard, SpriteAnimation, player")
		.attr({x: 16, y:200,z:3})
		.collision(new Crafty.polygon([0,0],[0,11],
									  [11,11],[11,0])) // Custom polygon for better collision
		.fourway(1)
        .animate("walk_left", 6, 3, 8)
        .animate("walk_right", 9, 3, 11)
        .animate("walk_up", 3, 3, 5)
        .animate("walk_down", 0, 3, 2)
		.onHit('Enemy', function() {
			Crafty.trigger('Hurt');
		})
		// Various bindings for attacks, jumps, etc. -- Keybindings for movement are built into 'Fourway' seen above
		.bind("KeyDown", function(e) {
			if(e.keyCode === Crafty.keys['Z'] && this.attack === false){
				this.attack = true;
				Crafty.audio.play("swing"+Crafty.math.randomInt(1, 3), 1);
				this.swingAttack();
				this.timeout(function() {
					this.attack = false;
				}, 300);
			}
			else if(e.keyCode === Crafty.keys['X'] && this.shoot === false &&
					this.magic.current >= 1 && this.questItems.ball === true) {
				this.shoot = true;
				this.magic.current -= 1;
				Crafty.audio.play("spell", 1);
				mbars[this.magic.current].destroy();  // TODO: Add fade animation!
				this.magicBolt();
				this.timeout(function() {
					this.shoot = false;
				}, 400);
				
			} else if(e.keyCode === Crafty.keys['C'] && this.blink === false &&
					this.magic.current >= 1 && this.questItems.ball2 === true) {
				this.blink = true;
				Crafty.audio.play("jump", 1);
				this.magic.current -= 1;
				mbars[this.magic.current].destroy();  // TODO: Add fade animation!
				this.magicJump();
				this.timeout(function() {
					this.blink = false;
				}, 700);
				// 'Cheat' key for testing purposes - gives magic, health, hearts, abilities, etc.	
			} else if(e.keyCode === Crafty.keys['P']) {
				Crafty.trigger("mspawner");
				Crafty.trigger("bspawner");
				this.questItems.ball = true;
				this.questItems.ball2 = true;
			}
		}) // Animation binding -- every time the player changes directions, 'Fourway' fires a "New Direction" trigger. 
		   // Use this to change the sprite animation
        .bind("NewDirection", function(direction) {
            if (direction.x < 0) {
            	if (!this.isPlaying("walk_left")) {
               		this.stop().animate("walk_left", 10, -1);
					this.facing = "left";
				}
        	}
        	if (direction.x > 0) {
            	if (!this.isPlaying("walk_right")) {
              		this.stop().animate("walk_right", 10, -1);
					this.facing = "right";
				}
        	}
        	if (direction.y < 0) {
            	if (!this.isPlaying("walk_up")) {
               		this.stop().animate("walk_up", 10, -1);
					this.facing = "up";
				}
        	}
        	if (direction.y > 0) {
            	if (!this.isPlaying("walk_down")) {
               		this.stop().animate("walk_down", 10, -1);
					this.facing = "down";
				}
        	}
        	if(!direction.x && !direction.y) {
            	this.stop();
        	}
        }) 
		.bind("Hurt", function() {
			if(this.hurt === false) {
				this.hurt = true;
				Crafty.audio.play("hurt", 1);
				this.hp.current -= 1;
				hearts[this.hp.current]
				.animate("flicker", 0, 0, 1).animate("flicker", 3, 10);
				this.timeout(function() {
					this.hurt = false;
				}, 1000);
			}
			if(this.hp.current === 0){
				Crafty.trigger("Die");
			}
		})
		.bind("Die", function() {
			//add dying animation
			this.timeout(function() {
				Crafty.scene("GameOver");
			}, 1000);
		})
        .bind("Moved", function(from) {
    		if(this.hit('solid')){
        		this.attr({x: from.x, y:from.y});
    		}
    		if((from.y + Crafty.viewport.y) >= 320){
    			Crafty.trigger("nexttile", "d");
    		} else if((from.x + Crafty.viewport.x) >= 480) {
				Crafty.trigger("nexttile", "r");
			} else if((from.y + Crafty.viewport.y) <= 0) {
				Crafty.trigger("nexttile", "u");
			} else if((from.x + Crafty.viewport.x) <= 0) {
				Crafty.trigger("nexttile", "l");
			}
    	});

    	return this;
    },
	
	magicJump: function() {
		//this.stop().animate("blink", 10, -1);
		
		if(this.facing === "up") {
			theJump = this.y + Crafty.viewport.y - 18;
			if(theJump <= this.jumpDist){
				this.y -= theJump;
			} else {
				this.y -= this.jumpDist;
			}
		} else if (this.facing === "down") {
			theJump = 320 - (this.y + Crafty.viewport.y + 32);
			if(theJump <= this.jumpDist){
				this.y += theJump;
			} else {
				this.y += this.jumpDist;
			}
		} else if (this.facing === "right") {
			theJump = 480 - (this.x + Crafty.viewport.x + 32);
			if(theJump <= this.jumpDist){
				this.x += theJump;
			} else {
				this.x += this.jumpDist;
			}
		} else {
			theJump = this.x + Crafty.viewport.x - 18;
			if(theJump <= this.jumpDist){
				this.x -= theJump;
			} else {
				this.x -= this.jumpDist;
			}
		}

		//this.timeout(function() {
		//	this.stop().animate("blinkin", 10, -1)
		//}, 100);
	},
	// move speeds and z to the weapon.js
	magicBolt: function(){
		if(this.facing === "up") {
			Crafty.e("Magic", "MagicAttack")
			.attr({
				x:this.x, y:this.y - 7, z:1,
				xspeed: 0, yspeed: -pspeed-2, face: "up"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		} else if (this.facing === "down") {
			Crafty.e("Magic", "MagicAttack")
			.attr({
				x:this.x, y:this.y + 7, z:1,
				xspeed: 0, yspeed: pspeed+2, face: "down"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		} else if (this.facing === "right") {
			Crafty.e("Magic", "MagicAttack")
			.attr({
				x:this.x + 7, y:this.y, z:1,
				xspeed: pspeed+2, yspeed: 0, face: "right"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		} else {
			Crafty.e("Magic", "MagicAttack")
			.attr({
				x:this.x - 7, y:this.y, z:1,
				xspeed: -pspeed-2, yspeed: 0, face: "left"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		}
	},
	
	swingAttack: function(){
				
		if(this.facing === "up") {
			Crafty.e(this.sword.type, "SwordAttack")
			.attr({
				x:this.x, y:this.y - 7, z:1,
				xspeed: 0, yspeed: -pspeed
				})
			.animate("uattack", 4, 2, 10)
			.animate("uattack", 7, 1);
		} else if (this.facing === "down") {
			Crafty.e(this.sword.type, "SwordAttack")
			.attr({
				x:this.x, y:this.y + 7, z:1,
				xspeed: 0, yspeed: pspeed
				})
			.animate("dattack", 4, 4, 10)
			.animate("dattack", 7, 1);
		} else if (this.facing === "right") {
			Crafty.e(this.sword.type, "SwordAttack")
			.attr({
				x:this.x + 7, y:this.y, z:1,
				xspeed: pspeed, yspeed: 0
				})
			.animate("rattack", 4, 0, 10)
			.animate("rattack", 7, 1);
		} else {
			Crafty.e(this.sword.type, "SwordAttack")
			.attr({
				x:this.x - 7, y:this.y, z:1,
				xspeed: -pspeed, yspeed: 0
				})
			.animate("lattack", 10, 0, 4)
			.animate("lattack", 7, 1);
		}
	
	}
	
});

Crafty.c("KeyListener", {
	init: function() {
		this.requires("Keyboard")
		.bind("KeyDown", function(e) {
			if(e.keyCode === Crafty.keys['ENTER']){
				Crafty.scene("main");
				this.timeout(function() {
					this.destroy();
				}, 10);
			}
		});
	}
});
