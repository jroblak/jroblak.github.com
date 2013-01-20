//Enemy
Crafty.c("Enemy", {
	speed: 0,
	direction: 0,
	hp: 1,
	pClose: false,
	init: function(){
		this.speed = Crafty.math.randomInt(1, 2);
		this.direction = Crafty.math.randomInt(-this.speed,this.speed);
		if(this.speed === 2){
			this.speed = -1;
		}

		this.requires("2D, DOM, enemy, Collision, solid, SpriteAnimation")
		.animate("move", 0, 4, 1)
		.animate("move", 20, -1)
		.bind("EnterFrame", function() {
			this.x = this.x + this.speed;
			this.y = this.y + this.direction;
			
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}else if(this.hit('solid')){
        		this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
    		}else if (this.pClose){
				this.speed = 0;
				this.direction = 0;
				dX = this.x - Crafty(Crafty("Player")[0]).x
				dY = this.y - Crafty(Crafty("Player")[0]).y
				if(dX > 0){
					this.speed = -.8 ;
				}else{
					this.speed = .8;
				}if(dY > 0){
					this.direction = -.8;
				} else{
					this.direction = .8;
				}
			}
			
			if((Crafty.math.abs(Crafty(Crafty("Player")[0]).x - this.x) < 60) &&
			   (Crafty.math.abs(Crafty(Crafty("Player")[0]).y - this.y) < 60))
			{ 
				this.pClose = true;
			} else {
				this.pClose = false;
			}

		})
		.onHit("SwordAttack", function() {
			Crafty.audio.play("enemy", 1);
			this.destroy(); // TO ADD: AI (attack), HP (trigger hurt function)
		});
	}
});

Crafty.c("wEnemy", {
	speed: 0,
	direction: 0,
	hp: 1,
	pClose: false,
	init: function(){
		this.speed = Crafty.math.randomInt(1, 2);
		this.direction = Crafty.math.randomInt(-this.speed,this.speed);
		if(this.speed === 2){
			this.speed = -1;
		}

		this.requires("2D, DOM, wenemy, Collision, solid, SpriteAnimation")
		.animate("move", 0, 2, 2)
		.animate("move", 20, -1)
		.bind("EnterFrame", function() {
			this.x = this.x + this.speed;
			this.y = this.y + this.direction;
			
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}else if(this.hit('solid')){
        		this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
    		}else if (this.pClose){
				this.speed = 0;
				this.direction = 0;
				dX = this.x - Crafty(Crafty("Player")[0]).x
				dY = this.y - Crafty(Crafty("Player")[0]).y
				if(dX > 0){
					this.speed = -.8 ;
				}else{
					this.speed = .8;
				}if(dY > 0){
					this.direction = -.8;
				} else{
					this.direction = .8;
				}
			}
			
			if((Crafty.math.abs(Crafty(Crafty("Player")[0]).x - this.x) < 60) &&
			   (Crafty.math.abs(Crafty(Crafty("Player")[0]).y - this.y) < 60))
			{ 
				this.pClose = true;
			} else {
				this.pClose = false;
			}

		})
		.onHit("SwordAttack", function() {
			Crafty.audio.play("benemy", 1);
			this.destroy(); // TO ADD: AI (attack), HP (trigger hurt function)
		});
	}
});

Crafty.c("AEnemy", {
	speed: 0,
	direction: 0,
	shooting: false,
	hp: 1,
	init: function(){
		this.speed = Crafty.math.randomInt(1, 2);
		this.direction = Crafty.math.randomInt(-this.speed,this.speed);
		if(this.speed === 2){
			this.speed = -1;
		}

		this.requires("2D, DOM, aenemy, Collision, solid, SpriteAnimation")
		.animate("move", 0, 5, 1)
		.animate("move", 20, -1)
		.bind("EnterFrame", function() {
			if(!this.shooting){
				this.x = this.x + this.speed;
				this.y = this.y + this.direction;
			}
			
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}else if(this.hit('solid')){
        		this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
    		}
			
			if((Crafty.math.abs(Crafty(Crafty("Player")[0]).x - this.x) < 5) && !this.shooting)
			{ 	
				this.shooting = true;
				this.shoot("y", (Crafty(Crafty("Player")[0]).y - this.y));
				this.timeout(function() {
					this.shooting = false;
				}, 3000);
			}
			if ((Crafty.math.abs(Crafty(Crafty("Player")[0]).y - this.y) < 5) && !this.shooting){
				this.shooting = true;
				this.shoot("x", (Crafty(Crafty("Player")[0]).x - this.x));
				this.timeout(function() {
					this.shooting = false;
				}, 3000);
			}

		})
		.onHit("SwordAttack", function() {
			Crafty.audio.play("enemy", 1);
			this.destroy(); // TO ADD: AI (attack), HP (trigger hurt function)
		});
	},
	
	shoot: function(xy, dirdiff) {
		if(xy === "y"){
			if(dirdiff > 0){
				Crafty.e("EArrow", "darrow")
				.attr({
					x:this.x, y:this.y + 7, z:1,
					xspeed: 0, yspeed: 4, face: "down"
				});
			} else if(dirdiff < 0) {
				Crafty.e("EArrow", "uarrow")
				.attr({
					x:this.x, y:this.y - 7, z:1,
					xspeed: 0, yspeed: -4, face: "up"
				});
			}
		}else if(xy === "x"){
			if(dirdiff > 0){
				Crafty.e("EArrow", "rarrow")
				.attr({x:this.x + 7, y:this.y, 
				z:1,xspeed: 4, yspeed: 0, 
				face: "right"
				});
			} else if(dirdiff < 0) {
				Crafty.e("EArrow", "larrow")
				.attr({
					x:this.x - 7, y:this.y, z:1,
					xspeed: -4, yspeed: 0, face: "left"
				});
			}
		}
	}
	
});

Crafty.c("bEnemy", {
	speed: 5,
	facing: 'down',
	fly: false,
	flyto: false,
	hp: 1,
	init: function(){
		
		this.requires("2D, DOM, batsprite, Collision, SpriteAnimation")
		.animate("fly_left", 3, 7, 5)
        .animate("fly_right", 3, 9, 5)
        .animate("fly_up", 3, 6, 5)
        .animate("fly_down", 3, 8, 5)
		.bind("EnterFrame", function() {
			if(this.facing === 'up'){
				this.animate("fly_up", 10, -1);
			} else if(this.facing === 'down'){
				this.animate("fly_down", 10, -1);
			} else if(this.facing === 'right') {
				this.animate("fly_right", 10, -1);
			} else {
				this.animate("fly_left", 10, -1);
			}
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
			}else if(this.hit('solid')){
				this.fly = false;
  				this.timeout(function() {
					this.flyto = false;
				}, 1000);
        		if(this.facing === 'up'){
					this.facing = 'down';
					this.stop().animate("fly_down", 10, -1);
					this.y += 8;
				} else if(this.facing === 'down'){
					this.facing = 'up';
					this.stop().animate("fly_up", 10, -1);
					this.y -= 8;
				} else if(this.facing === 'right') {
					this.facing = 'left';
					this.stop().animate("fly_left", 10, -1);
					this.x -= 8;
				} else {
					this.facing = 'right';
					this.stop().animate("fly_right", 10, -1);
					this.x += 8;
				}
    		}
			
			if(((Crafty.math.abs(Crafty(Crafty("Player")[0]).x - this.x) < 15) ||
			   (Crafty.math.abs(Crafty(Crafty("Player")[0]).y - this.y) < 15)) 
				&& !this.flyto && !this.fly)
			{ 
				this.fly = true;
				this.flyto = true;
			} 

			if(this.fly){
				if(this.facing === 'up'){
					this.y -= this.speed;
				} else if(this.facing === 'down'){
					this.y += this.speed;
				} else if(this.facing === 'right') {
					this.x += this.speed;
				} else {
					this.x -= this.speed;
				}
			}

		})
		.onHit("SwordAttack", function() {
			Crafty.audio.play("benemy", 1);
			this.destroy(); // TO ADD: AI (attack), HP (trigger hurt function)
		});
	}
});

Crafty.c("Boss1", {
	speed: .6,
	direction: .6,
	hp: 5,
	bhurt: false,
	battack: false,
	init: function(){
		this.requires("2D, DOM, b1sprite, Collision, SpriteAnimation, solid")
		.animate("b1move", 3, 2, 5)
		.animate("b1move", 10, -1)
		.bind("EnterFrame", function() {
			if(!this.battack){
				this.x = this.x + this.speed;
				this.y = this.y + this.direction;
			}
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}else if(this.hit('solid')){
        		this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}
			if((Crafty.math.randomInt(1,100) < 2) && !this.battack){
				this.bossAttack();
			}
		})
		.onHit("SwordAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss1", 1);
				this.bhurt = true;
				this.hp -= 1;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("B1Die");
			}
		})
		.bind("B1Die", function() {
			Crafty.e("Ball1").attr({x: this.x, y:this.y, z:2});
			this.destroy();
		});
		
	},
	
	bossAttack: function(){
		this.battack = true;
		
		Crafty.e("EMagic")
			.attr({
				x:this.x, y:this.y - 32, z:1,
				xspeed: 0, yspeed: -pspeed-2, face: "up"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x, y:this.y + 32, z:1,
				xspeed: 0, yspeed: pspeed+2, face: "down"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x + 32, y:this.y, z:1,
				xspeed: pspeed+2, yspeed: 0, face: "right"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x - 32, y:this.y, z:1,
				xspeed: -pspeed-2, yspeed: 0, face: "left"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		
		this.timeout(function() {
					this.battack = false;
		}, 3000);
	
	}
});

Crafty.c("Boss2", {
	speed: .25,
	direction: .25,
	xp: .25,
	yd: .25,
	hp: 5,
	bhurt: false,
	battack: false,
	init: function(){
		this.requires("2D, DOM, b2sprite, Collision, SpriteAnimation, solid")
		.animate("b2move", 0, 2, 2)
		.animate("teleport", 0, 5, 2)
		.animate("b2move", 10, -1)
		.bind("EnterFrame", function() {
			
			dX = this.x - Crafty(Crafty("Player")[0]).x
			dY = this.y - Crafty(Crafty("Player")[0]).y
			if(dX > 0){
				this.speed = -this.xp;
			}else{
				this.speed = this.xp;
			}if(dY > 0){
				this.direction = -this.yd;
			} else{
				this.direction = this.yd;
			}
			
			this.x += this.speed;
			this.y += this.direction;
			
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
			}
			if((Crafty.math.randomInt(1,300) === 1) && !this.battack){
				this.bossAttack();
			}
		})
		.onHit("SwordAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss2", 1);
				this.bhurt = true;
				this.hp -= 1;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("B2Die");
			}
		})
		.onHit("MagicAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss2", 1);
				this.bhurt = true;
				this.hp -= 2;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("B2Die");
			}
		})
		.bind("B2Die", function() {
			Crafty.e("Ball2").attr({x: this.x, y:this.y, z:2});
			this.destroy();
		});
		
	},
	
	bossAttack: function(){
		this.battack = true;
		this.stop().animate("teleport", 10, -1);
		this.x = Crafty.math.randomInt(32,448)-Crafty.viewport.x;
		this.y = Crafty.math.randomInt(32,292)-Crafty.viewport.y;
		
		this.xp += .25;
		this.yd += .25;
		
		this.timeout(function() {
					this.stop().animate("b2move", 10, -1);
		}, 500);
		
		this.timeout(function() {
					this.battack = false;
		}, 1500);
	
	}
});

Crafty.c("Boss3", {
	speed: .6,
	direction: .6,
	hp: 6,
	bhurt: false,
	facing: 'down',
	battack: false,
	init: function(){
		this.requires("2D, DOM, b3sprite, Collision, SpriteAnimation, solid")
		.animate("b3movedown", 6, 2, 8)
		.animate("b3moveleft", 6, 3, 8)
		.animate("b3moveright", 6, 4, 8)
		.animate("b3moveup", 6, 5, 8)
		.animate("b3movedown", 10, -1)
		.bind("EnterFrame", function() {
			if(!this.battack){
				this.x = this.x + this.speed;
				this.y = this.y + this.direction;
			}
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}else if(this.hit('solid')){
        		this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}
			if((Crafty.math.randomInt(1,100) < 2) && !this.battack){
				this.bossAttack();
			}
		})
		.onHit("SwordAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss3", 1);
				this.bhurt = true;
				this.hp -= 1;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("B3Die");
			}
		})
		.onHit("MagicAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss3", 1);
				this.bhurt = true;
				this.hp -= 2;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("B3Die");
			}
		})
		.bind("B3Die", function() {
			Crafty.e("Ball3").attr({x: this.x, y:this.y, z:2});
			this.destroy();
		});
		
	},
	
	bossAttack: function(){
		this.battack = true;
		
		Crafty.e("EMagic")
			.attr({
				x:this.x, y:this.y - 32, z:1,
				xspeed: 0, yspeed: -pspeed-2, face: "up"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x, y:this.y + 32, z:1,
				xspeed: 0, yspeed: pspeed+2, face: "down"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x + 32, y:this.y, z:1,
				xspeed: pspeed+2, yspeed: 0, face: "right"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x - 32, y:this.y, z:1,
				xspeed: -pspeed-2, yspeed: 0, face: "left"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		
		this.timeout(function() {
					this.battack = false;
		}, 1000);
	
	}
});

//ADD THIS
Crafty.c("Baal", {
	speed: 1,
	direction: 1,
	hp: 10,
	bhurt: false,
	facing: 'down',
	battack: false,
	init: function(){
		this.requires("2D, DOM, baal, Collision, SpriteAnimation, solid")
		.animate("baalmovedown", 0, 0, 2)
		.animate("baalmoveleft", 0, 1, 2)
		.animate("baalmoveright", 0, 2, 2)
		.animate("baalmoveup", 0, 3, 2)
		.animate("baalmovedown", 10, -1)
		.bind("EnterFrame", function() {
			if(!this.battack){
				this.x = this.x + this.speed;
				this.y = this.y + this.direction;
			}
			if(this.hit('Player')){
				Crafty.trigger("Hurt");
				this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}else if(this.hit('solid')){
        		this.attr({x: this.x - this.speed, y:this.y - this.direction});
				this.speed = Crafty.math.randomInt(1, 2);
				this.direction = Crafty.math.randomInt(-this.speed,this.speed);
				if(this.speed === 2){
					this.speed = -1;
				}
			}
			if((Crafty.math.randomInt(1,100) < 2) && !this.battack){
				this.bossAttack();
			}
		})
		.onHit("SwordAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss3", 1);
				this.bhurt = true;
				this.hp -= 1;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("BaalDie");
			}
		})
		.onHit("MagicAttack", function() {
			if(this.bhurt === false){
				Crafty.audio.play("boss3", 1);
				this.bhurt = true;
				this.hp -= 2;
				
				this.timeout(function() {
					this.bhurt = false;
				}, 250);
			}
			if(this.hp <= 0) {
				this.trigger("B3Die");
			}
		})
		.bind("BaalDie", function() {
			Crafty.scene("Victory");
			this.destroy();
		});
		
	},
	
	bossAttack: function(){
		this.battack = true;
		
		Crafty.e("EMagic")
			.attr({
				x:this.x, y:this.y - 32, z:1,
				xspeed: 0, yspeed: -pspeed-2, face: "up"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x, y:this.y + 32, z:1,
				xspeed: 0, yspeed: pspeed+2, face: "down"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x + 32, y:this.y, z:1,
				xspeed: pspeed+2, yspeed: 0, face: "right"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		Crafty.e("EMagic")
			.attr({
				x:this.x - 32, y:this.y, z:1,
				xspeed: -pspeed-2, yspeed: 0, face: "left"
				})
				.animate("mattack", 4, 5, 10)
				.animate("mattack", 7, -1);
		
		this.timeout(function() {
					this.battack = false;
		}, 1000);
	
	}
});