//enemy arrow
Crafty.c("EArrow", {
	dmg: 1,
	init: function(){
		this.requires("2D, DOM, SpriteAnimation, Collision")
		.bind("EnterFrame", function(){
			this.x += this.xspeed;
			this.y += this.yspeed;
			this.timeout(function() {
					this.shooting = false;
			}, 7000);
		})
		.onHit("Player", function(){
			Crafty.trigger("Hurt");
			this.destroy();
		});
		
		return this;
	}
});

Crafty.c("Ball2", {
	init: function() {
		this.requires("2D, DOM, mattack, SpriteAnimation, Collision")
		.animate("mattack", 4, 5, 10)
		.animate("mattack", 7, -1)
		.onHit("Player", function() {
			player.questItems.ball2 = true;
			Crafty.trigger("bspawner");
			this.destroy();
		});
	}
});

Crafty.c("Ball1", {
	init: function() {
		this.requires("2D, DOM, mattack, SpriteAnimation, Collision")
		.animate("mattack", 4, 5, 10)
		.animate("mattack", 7, -1)
		.onHit("Player", function() {
			player.questItems.ball = true;
			Crafty.trigger("mspawner");
			this.destroy();
		});
	}
});

Crafty.c("Ball3", {
	init: function() {
		this.requires("2D, DOM, mattack, SpriteAnimation, Collision")
		.animate("mattack", 4, 5, 10)
		.animate("mattack", 7, -1)
		.onHit("Player", function() {
			player.questItems.ball3 = true;
			Crafty.trigger("threeSpawner");
			this.destroy();
		});
	}
});
//Sword 
Crafty.c("basic", {
	dmg: 1,
	init: function(){
		this.requires("2D, DOM, rattack, lattack, uattack, dattack, SpriteAnimation")
		.bind("EnterFrame", function(){
			this.x += this.xspeed;
			this.y += this.yspeed;
		});
		
		this.timeout(function() {
					this.destroy();
				}, 150);
				
		return this;
	}
});

//magic bolt
Crafty.c("Magic", {
	dmg: 2,
	init: function(){
		this.requires("2D, DOM, mattack, mubu, mdbu, mrbu, mlbu, Collision, SpriteAnimation")
		.animate("mubu", 7, 7, 4)
        .animate("mrbu", 11, 6, 8)
        .animate("mdbu", 11, 7, 8)
        .animate("mlbu", 4, 6, 7)
		.bind("EnterFrame", function(){
			this.x += this.xspeed;
			this.y += this.yspeed;
		})
		.onHit("kill", function(ent){
			this.xspeed = 0;
			this.yspeed = 0;
			var en = ent[0].obj;
			if(this.face === 'right'){
				this.stop().animate("mrbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			else if(this.face === 'left'){
				this.stop().animate("mlbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			else if(this.face === 'up'){
				this.stop().animate("mubu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			else{
				this.stop().animate("mdbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			en.hp -= this.dmg;
			Crafty.audio.play("enemy", 1);
			if(en.hp <= 0){
				en.destroy();
			}
		})
		// fix this strange bug!!!
		.onHit("solid", function(){
		if(!this.hit('river')) {
			this.xspeed = 0;
			this.yspeed = 0;
			if(this.face === 'right'){
				this.stop().animate("mrbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
			else if(this.face === 'left'){
				this.stop().animate("mlbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
			else if(this.face === 'up'){
				this.stop().animate("mubu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
			else{
				this.stop().animate("mdbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
		}	
		});
		
		return this;
	}
});

Crafty.c("EMagic", {
	dmg: 2,
	init: function(){
		this.requires("2D, DOM, mattack, mubu, mdbu, mrbu, mlbu, Collision, SpriteAnimation")
		.animate("mubu", 7, 7, 4)
        .animate("mrbu", 11, 6, 8)
        .animate("mdbu", 11, 7, 8)
        .animate("mlbu", 4, 6, 7)
		.bind("EnterFrame", function(){
			this.x += this.xspeed;
			this.y += this.yspeed;
		})
		.onHit("Player", function(){
			this.xspeed = 0;
			this.yspeed = 0;
			Crafty.trigger("Hurt");
			if(this.face === 'right'){
				this.stop().animate("mrbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			else if(this.face === 'left'){
				this.stop().animate("mlbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			else if(this.face === 'up'){
				this.stop().animate("mubu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
			else{
				this.stop().animate("mdbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 150);
			}
		})
		
		.onHit("solid", function(){
			this.xspeed = 0;
			this.yspeed = 0;
			if(this.face === 'right'){
				this.stop().animate("mrbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
			else if(this.face === 'left'){
				this.stop().animate("mlbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
			else if(this.face === 'up'){
				this.stop().animate("mubu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
			else{
				this.stop().animate("mdbu", 7, 1);
				this.timeout(function() {
					this.destroy();
				}, 25);
			}
		});
		
		return this;
	}
});