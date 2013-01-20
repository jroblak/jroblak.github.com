window.onload = function() {

	Crafty.init(480, 320);
	
	// Global for the map loading functions -- descriptions for map tile code numbers
	var GRASS = 1;
	var BUSH = 2;
	var ENEMY = 3;
	var OBST = 4;
	var ARENEMY = 6;
	var BOSS1 = 5;
	var BOSS2 = 7;
	var LRIVER = 8;
	var CRIVER = 9;
	var RRIVER = 10;
	var TLLAVA = 11;
	var LLAVA = 12;
	var BLLAVA = 13;
	var TLAVA = 14;
	var LAVA = 15;
	var BLAVA = 16;
	var TRLAVA = 17;
	var RLAVA = 18;
	var BRLAVA = 19;
	var BAT = 20;
	var BOSS3 = 21;
	var BAAL = 22;
	var WORM = 23;
	
	// current X/Y tile (based on world map postion) that the player is on
	var xTile = 0;
	var yTile = 0;
	
	// Markers to determine if player is spawned, magic bar is spawned, or bosses are spawned.
	// Used to assist the load map function so things aren't loaded twice or more.
	spawn = false;
	mspawn = false;
	bspawn = false;
	threeSpawn = false;
	caveFlag = false;
	desertFlag = false;
	var theTileC = tile4c;
	
	// Array to hold map assets - used so that the previously loaded assets can be moved around
	// rather than having to re-load assets every time the map tile changes
	var grassy = [];
	var bushy = [];
	var cavey = [];
	mbars = [];
	hearts = [];
	bars = [];
	
	// Counters used with the above arrays for map positioning
	var bCount = 0;
	var gCount = 0;
	var cCount = 0;
	
	// Sprite loaders
	Crafty.sprite(16, "game/img/smallsprites.png", {
		grass1: [0,0],
		grass2: [1,0],
		grass3: [2,0],
		grass4: [3,0],
		stuff1: [0,1],
		stuff2: [1, 1],
		stuff3: [2, 1],
		stuff4: [3, 1],
		bush1: [0,2],
		bush2: [1,2],
		player: [0,3],
		enemy: [0,4],
		aenemy: [0,5],
		uarrow: [2,6],
		darrow: [3,6],
		larrow: [1,6],
		rarrow: [0,6],
		rattack: [4,0],
		lattack: [10,1],
		dattack: [4,4],
		uattack: [4,2],
		mattack: [4,5],
		mubu: [7,7],
		mdbu: [11,7],
		mrbu: [11,6],
		mlbu: [4,6],
		leriv: [0,7],
		ceriv:[1,7],
		ririv:[2,7],
		desertfloor1: [0,8],
		desertfloor2: [1,8],
		desertfloor3: [2,8],
		desertfloor4: [3,8],
		dstuff1: [4,8],
		dstuff2: [5,8],
		dstuff3: [6,8],
		dbush1: [7,8],
		dbush2: [8,8]
	});

	Crafty.sprite(32, "game/img/largesprites.png", {
		fullheart: [0, 0],
		eheart: [1, 0],
		blocktree: [2,0],
		treebu: [3,0],
		mbarbot: [0,1],
		mbartop: [1,1],
		mbarmid: [2,1],
		mbarfill: [3,1],
		b1sprite: [3,2],
		b2sprite: [0,2],
		b3sprite: [6,2],
		cavefloor1: [0,8],
		cavefloor2: [1,8],
		cavefloor3: [0,9],
		cavefloor4: [1,9],
		tllava: [6,7],
		llava: [6,8],
		bllava: [6,9],
		tlava: [7,7],
		lava: [7,8],
		blava: [7,9],
		brlava: [8,9],
		rlava: [8,8],
		trlava: [8,7],
		batsprite: [3,6],
		cavewall1: [6,6],
		cavewall2: [7,6],
		cavewall3: [8,6]
	});
	
	Crafty.sprite(32, "/game/img/wenemy.png", {
		wenemy: [0,0]
	});
	
	Crafty.sprite(64, "game/img/baal.png", {
		baal: [0,0]
	});
	
	Crafty.audio.add({
		swing1: ["game/sfx/swing.mp3","game/sfx/swing.ogg"],
		swing2: ["game/sfx/swing2.mp3","game/sfx/swing2.mp3"],
		swing3: ["game/sfx/swing3.mp3","game/sfx/swing3.mp3"],
		spell: ["game/sfx/spell.mp3","game/sfx/spell.ogg"],
		jump: ["game/sfx/jump.mp3","game/sfx/jump.ogg"],
		hurt:["game/sfx/hurt.mp3","game/sfx/hurt.ogg"],
		level:["game/sfx/level.mp3","game/sfx/level.ogg"],

		boss1: ["game/sfx/boss1.mp3","game/sfx/boss1.ogg"], 
		boss2:["game/sfx/boss2.mp3","game/sfx/boss2.ogg"], 
		boss3:["game/sfx/boss3.mp3","game/sfx/boss3.ogg"], 
		enemy:["game/sfx/enemy.mp3","game/sfx/enemy.ogg"], 
		benemy:["game/sfx/benemy.mp3","game/sfx/benemy.ogg"],

		title:["game/sfx/title.mp3","game/sfx/title.ogg"],
		cave:["game/sfx/cave.mp3","game/sfx/cave.ogg"],
		desert:["game/sfx/desert.mp3","game/sfx/desert.ogg"],
		ending:["game/sfx/ending.mp3", "game/sfx/ending.ogg"]
	});

	Crafty.audio.add("default",
					["game/sfx/default.mp3"],["game/sfx/default.ogg"]);
	// inital function to generate all the entities
	function generateEnts() {
		// Player init
		player = Crafty.e("Player");
		// Hearts init
		for(var i = 1; i <= player.hp.max; i++){
			var xPos = 480 - (i * 34);
			hearts[i-1] = Crafty.e("2D, DOM, eheart, fullheart, SpriteAnimation, Heart")
						.attr({ x: xPos, y: 3, z: 4 });
		}
		// Grass and border init
		for(var i = 0; i < 600; i++) {	
      			grassy[i] = Crafty.e("2D, DOM, grass" + Crafty.math.randomInt(1, 4));
				
				if(i < 95)
					bushy[i] = Crafty.e("2D, DOM, solid, bush" + Crafty.math.randomInt(1, 2));
		}
		
		Crafty.e("2D, DOM, blocktree, SpriteAnimation, Collision, solid")
				.attr({x:150, y:290, z:2})
				.collision(new Crafty.polygon([0,7],[0,32],
									  [32,32],[32,7]))
				.onHit('SwordAttack', function() {
					$('#gamepanel > span').text("A giant downed tree blocks this path..a sword won't work. Maybe something else will?").hide().fadeIn('slow');
				})
				.onHit("MagicAttack", function(){
					this.destroy();
				}); 
	}
	
	// fucntion to level up the player -- add health, magic, etc
	function luPlayer() {
	
		player.magic.current = player.magic.max;
		Crafty.audio.play("level", 1);
		for(var i = 0; i<player.hp.max; i++){
			hearts[i].destroy();
		}

		for(var i = 0; i < player.magic.current; i++){
			mbars[i].destroy();
		}
		
		player.hp.max += 1;
		player.hp.current = player.hp.max;
		for(var i = 1; i <= player.hp.max; i++){
			var xPos = 480 - (i * 34);
			hearts[i-1] = Crafty.e("2D, DOM, eheart, fullheart, SpriteAnimation, Heart")
						.attr({ x: xPos-Crafty.viewport.x , y: 3-Crafty.viewport.y, z: 4 });
		}
		for(var i = 0; i < player.magic.current; i++){
			mbars[i] = Crafty.e("2D, DOM, mbarfill").attr({x:480-32-Crafty.viewport.x,y:103-(i*8)-Crafty.viewport.y,z:4});
		}
		
		pspeed += .25
		player.fourway(pspeed);
	}
	
	// Function that loads the new map tiles -- moves previously generated elements, as well
	// as loads new assets as needed.

	// Gets a bit confusing because I mixed 16px and 32px map tiles, so I need 2 maps tiles 
	// for the caves, and 2 different nested for loops to go through both. A sloppy work around
	// but it works
	function loadMap(theTile) {
		
		Crafty("remove").each(function() {
			this.destroy();
		});
		
		if(theTile === tile4){
			theTileC = tile4c;
		} else {
			theTileC = tile5c;
		}
		

		for(var k = 1; k <= player.hp.max; k++){
			hearts[k-1].attr({ x: (480 - (k * 34))-Crafty.viewport.x  , y: 3-Crafty.viewport.y});
		}
		
		if(theTile === tile4 || theTile === tile5){

			for(var i = 0; i < 15; i++){
				for(var j = 0; j < 10; j++) {
					Crafty.e("2D, DOM, remove, cavefloor" + Crafty.math.randomInt(1, 4))
						.attr({x: (i * 32)-Crafty.viewport.x, y: (j * 32)-Crafty.viewport.y});
				}
			}

			for(var i = 0; i < 95; i++) {	
					cavey[i] = Crafty.e("2D, DOM, solid, remove, cavewall" + Crafty.math.randomInt(1, 3));
			}

			for(var i = 0; i < 15; i++){
				for(var j = 0; j < 10; j++) {

					if(theTileC[j][i] === BUSH) {
						cavey[cCount].attr({x: (i * 32)-Crafty.viewport.x, y: (j * 32)-Crafty.viewport.y, z:2});
						cCount = cCount + 1;
					} else if(theTileC[j][i] === TLLAVA) {
							Crafty.e("2D, DOM, tllava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y, z:1});
					} else if(theTileC[j][i] === LLAVA) {
							Crafty.e("2D, DOM, llava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === BLLAVA) {
							Crafty.e("2D, DOM, bllava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === TLAVA) {
							Crafty.e("2D, DOM, tlava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === LAVA) {
							Crafty.e("2D, DOM, lava, remove, Collision,solid,river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === BLAVA) {
							Crafty.e("2D, DOM, blava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === TRLAVA) {
							Crafty.e("2D, DOM, trlava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === RLAVA) {
							Crafty.e("2D, DOM, rlava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === BRLAVA) {
							Crafty.e("2D, DOM, brlava, remove, Collision,solid, river")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:1});
					} else if(theTileC[j][i] === BAT) {
						if(j === 1 && !(i === 1 || i === 13)) {
							Crafty.e("bEnemy, remove, kill")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:2, facing: 'down'});
						} else if(j === 8 && !(i === 1 || i === 13)) {
							Crafty.e("bEnemy, remove, kill")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:2, facing: 'up'});
						} else if(i === 1) {
							Crafty.e("bEnemy, remove, kill")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:2, facing: 'right'});
						} else {
							Crafty.e("bEnemy, remove, kill")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:2, facing: 'left'});
						}
					} else if(theTileC[j][i] === BOSS3 && !threeSpawn) {
							Crafty.e("Boss3", "remove")
							.attr({x:(i * 32)-Crafty.viewport.x, 
								   y: (j * 32)-Crafty.viewport.y,
								   z:3});
					}
				}
			}
		}
		
		if(theTile === tile9 || theTile === tile10){
			for(var i = 0; i < 30; i++) {
				for(var j = 0; j < 20; j++) {
					Crafty.e("2D, DOM, remove, desertfloor" + Crafty.math.randomInt(1, 4))
						.attr({x: (i * 16)-Crafty.viewport.x, y: (j * 16)-Crafty.viewport.y});
					if (theTile[j][i] === BUSH){
						Crafty.e("2D, DOM, remove, solid, dbush" + Crafty.math.randomInt(1, 2))
							.attr({x: (i * 16)-Crafty.viewport.x, y: (j * 16)-Crafty.viewport.y});
					} else if (theTile[j][i] === BAAL){
						Crafty.e("Baal", "remove")
							.attr({x: (i * 16)-Crafty.viewport.x, y: (j * 16)-Crafty.viewport.y, z:3});
					} else if(theTile[j][i] === WORM) {
						Crafty.e("wEnemy", "remove")
							.attr({x: (i * 16)-Crafty.viewport.x, y: (j * 16)-Crafty.viewport.y, z:3});
					}
				}
			}
		}

		if(mspawn){
			
			for(var i = 0; i< 10; i++){
				mbars[i].attr({ x: 448-Crafty.viewport.x , y:103-(i*8)-Crafty.viewport.y});
			}
			
			bars[0].attr({x:480-34-Crafty.viewport.x,y:37-Crafty.viewport.y});
			bars[1].attr({x:480-34-Crafty.viewport.x,y:37+22-Crafty.viewport.y});
			bars[2].attr({x:480-34-Crafty.viewport.x,y:37+21+22-Crafty.viewport.y});
			bars[3].attr({x:480-34-Crafty.viewport.x,y:37+21+22+17-Crafty.viewport.y});
		} 
		
		for(var i = 0; i < 30; i++) {

			for(var j = 0; j < 20; j++) {
				
				if(!(theTile === tile9 || theTile === tile10)) {
      				grassy[gCount].attr({x: (i * 16)-Crafty.viewport.x, y: (j * 16)-Crafty.viewport.y});
					gCount = gCount + 1;
				} 
				if (theTile[j][i] === BUSH && !(theTile === tile4 || theTile === tile5 || theTile === tile9 || theTile === tile10)) {
					bushy[bCount].attr({x: (i * 16)-Crafty.viewport.x, y: (j * 16)-Crafty.viewport.y, z:2});
					bCount = bCount + 1;
				}

				else if (theTile[j][i] === OBST) {
					if(theTile === tile9 || theTile === tile10){
						Crafty.e("2D, DOM, solid, remove, SpriteAnimation, dstuff" + Crafty.math.randomInt(1, 3))
							.attr({x: (i * 16)-Crafty.viewport.x,
								   y: (j * 16)-Crafty.viewport.y,
								   z:2});
					}
					
    				else {
    					Crafty.e("2D, DOM, solid, remove, SpriteAnimation, stuff" + Crafty.math.randomInt(1, 4))
							.attr({x: (i * 16)-Crafty.viewport.x,
								   y: (j * 16)-Crafty.viewport.y,
								   z:2});
						}
				} else if (theTile[j][i] === ENEMY) {
					Crafty.e("Enemy", "remove", "kill")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:3});
				} else if (theTile[j][i] === BOSS1 && !mspawn) {
					Crafty.e("Boss1", "remove", "kill")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:3});

				} else if (theTile[j][i] === BOSS2 && !bspawn) {
					Crafty.e("Boss2", "remove")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:3});

				}else if(theTile[j][i] === ARENEMY) {
					Crafty.e("AEnemy", "remove", "kill")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:3});
				}else if(theTile[j][i] === LRIVER) {
					Crafty.e("2D, DOM, leriv, remove, Collision, solid, river")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:1});
				} else if(theTile[j][i] === CRIVER) {
					Crafty.e("2D, DOM, ceriv, remove, Collision, solid, river")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:1});
				} else if(theTile[j][i] === RRIVER) {
					Crafty.e("2D, DOM, ririv, remove, Collision, solid, river")
							.attr({x:(i * 16)-Crafty.viewport.x, 
								   y: (j * 16)-Crafty.viewport.y,
								   z:1});
				}  
			}
		}
		
		bCount = 0;
		gCount = 0;	
		cCount = 0;
	}


	Crafty.scene("loading", function() {
		
		var toLoad = [];
		//toLoad.push("game/img/smallsprites.png", "game/img/largesprites.png");
		
		for(var i in Crafty.assets) {
			toLoad.push(i);
		}
		
		Crafty.background("url(game/img/loading.png) black");

		Crafty.load(toLoad, function() {
			
			Crafty.scene("title");
		},
        function(e) {
            var src = e.src ||"";
          
            //update progress
            console.log("loading: "+src.substr(src.lastIndexOf('/') + 1).toLowerCase());
			console.log(e.percent);
      
        },
        function(e) {
            //uh oh, error loading
            var src = e.src ||"";
            console.log("Error on loading: "+src.substr(src.lastIndexOf('/') + 1).toLowerCase());
        }
        );
	});

	Crafty.scene("loading");
	
	// Add title screen
	Crafty.scene("title", function() {
		Crafty.background("url(game/img/title.png) black");
		Crafty.audio.play("title", -1);
		Crafty.e("KeyListener", "delete");
	});
	
	Crafty.scene("main", function() {
		
		Crafty.background("#000");
		Crafty.audio.stop();
		Crafty.audio.play("default", -1, 1);

		if(!spawn){
			spawn = true;
			generateEnts();
			$('#gamepanel span').text("You wake in a field. Surrounded by demons! Don't die yet.").hide().fadeIn('slow');
		}
		
		loadMap(world[yTile][xTile]);
		
		Crafty.bind("mspawner", function() {
			bars[0] = Crafty.e("2D, DOM, mbartop").attr({x:480-34-Crafty.viewport.x,y:37-Crafty.viewport.y,z:4});
			bars[1] = Crafty.e("2D, DOM, mbarmid").attr({x:480-34-Crafty.viewport.x,y:37+22-Crafty.viewport.y,z:4});
			bars[2] = Crafty.e("2D, DOM, mbarmid").attr({x:480-34-Crafty.viewport.x,y:37+21+22-Crafty.viewport.y,z:4});
			bars[3] = Crafty.e("2D, DOM, mbarbot").attr({x:480-34-Crafty.viewport.x,y:37+21+22+17-Crafty.viewport.y,z:4});
			for(var i = 0; i < player.magic.current; i++){
				mbars[i] = Crafty.e("2D, DOM, mbarfill").attr({x:480-32-Crafty.viewport.x,y:103-(i*8)-Crafty.viewport.y,z:4});
			}
			$('#gamepanel span').text('You rip the monsters giant, magical ball from him and feel the magic pulsating through you. Your life and speed increase! You can now shoot magic!...about that tree').hide().fadeIn('slow');
			luPlayer();
			$('.about > span').append('X - Magic Attack<br>').hide().fadeIn('slow');
			mspawn = true;
			
		});
		
		Crafty.bind("bspawner", function() {
			$('#gamepanel span').text('Another kill, another magical ball. Your life and speed increase! You can now feel teleport-y! Lets move on.').hide().fadeIn('slow');
			luPlayer();
			bspawn = true;
			$('.about > span').append('C - Flash Jump<br>').hide().fadeIn('slow');
		});

		Crafty.bind("threeSpawner", function() {
			$('#gamepanel span').text('The last minion and another ball. Your life and speed increase again! Time to find the final boss.').hide().fadeIn('slow');
			luPlayer();
			threeSpawn = true;
		});
		// TO DO: visited flags to change text alerts
		Crafty.bind("nexttile", function(dir) {
			if(dir === "d"){
				yTile = yTile + 1;
				Crafty.viewport.scroll('_y', -320*yTile);
				loadMap(world[yTile][xTile]);
				if(world[yTile][xTile] === tile3){
					$('#gamepanel span').text('An ambush!!').hide().fadeIn('slow');
				} else if(world[yTile][xTile] === tile6 && !bspawn) {
					$('#gamepanel span').text('Another monster lies in your path. You feel the power of his balls').hide().fadeIn('slow');
				} else if(world[yTile][xTile] === tile6) {
					$('#gamepanel span').text('Your work here is done....').hide().fadeIn('slow');
				} else if(world[yTile][xTile] === tile9) {
					$('#gamepanel span').text('A desert..you can feel the end of your journey approaching..').hide().fadeIn('slow');
					if(!desertFlag){
						desertFlag = true;
						Crafty.audio.stop();
						Crafty.audio.play("desert", -1);
					} 
				} else {
					$('#gamepanel span').text('Back here..').hide().fadeIn('slow');
				}
			}
			else if(dir === "u") {
				yTile = yTile - 1;
				Crafty.viewport.scroll('_y', -320*yTile);
				loadMap(world[yTile][xTile]);
				if(world[yTile][xTile] === tile1){
					$('#gamepanel span').text('Back here....looks the same').hide().fadeIn('slow');
				} if(world[yTile][xTile] === tile4){
					$('#gamepanel span').text('A cave...need to be ballsy to make it through here').hide().fadeIn('slow');
					if(!caveFlag){
						caveFlag = true;
						Crafty.audio.stop();
						Crafty.audio.play("cave", -1);
					} 
				} else {
					$('#gamepanel span').text('Back here..').hide().fadeIn('slow');
				}
			}
			else if(dir === "r") {
				xTile = xTile + 1;
				Crafty.viewport.scroll('_x', -480*xTile);
				loadMap(world[yTile][xTile]);
				if(world[yTile][xTile] === tile2 && !mspawn){
					$('#gamepanel span').text('You see a giant monster across the field. You can feel the magic eminating from his balls. Prob should kill him.').hide().fadeIn('slow');
				} else if (world[yTile][xTile] === tile2 && mspawn){
					$('#gamepanel span').text('Back here....nothing new').hide().fadeIn('slow');
				}  else if (world[yTile][xTile] === tile7 && !bspawn){
					$('#gamepanel span').text('A raging river lies in your path. You need some kind of..ability to cross.').hide().fadeIn('slow');
				} else if (world[yTile][xTile] === tile7){
					$('#gamepanel span').text('A raging river lies in your path. Teleport across! The cave above beckons..').hide().fadeIn('slow');
				} else if (world[yTile][xTile] === tile5 && !threeSpawn){
					$('#gamepanel span').text('The final minor lies ahead. One last ball before you can try to end this hell.').hide().fadeIn('slow');
				} else if (world[yTile][xTile] === tile5){
					$('#gamepanel span').text('Nothing left for you here...').hide().fadeIn('slow');
				} else {
					$('#gamepanel span').text('Back here..').hide().fadeIn('slow');
				}
				
			}
			else if(dir === "l") {
				xTile = xTile - 1;				
				Crafty.viewport.scroll('_x', -480*xTile);
				loadMap(world[yTile][xTile]);
				if(world[yTile][xTile] === tile1){
					$('#gamepanel span').text('Back here....lets try heading South').hide().fadeIn('slow');
				} else if(world[yTile][xTile] === tile10) {
					$('#gamepanel span').text("Ba'al lies directly in your path. It's you or him in the fight for his balls!").hide().fadeIn('slow');
				} else {
					$('#gamepanel span').text('Back here..').hide().fadeIn('slow');
				}
			}
		});
	});


	Crafty.scene("GameOver", function() {
		
		$('#gamepanel span').text('The light fades from your eyes...you die').hide().fadeIn('slow');
		Crafty.background("url(game/img/gameover.png) black");	
		Crafty.audio.stop();
		
	});
	
	Crafty.scene("Victory", function() {
		Crafty.audio.stop()
		Crafty.audio.play("ending", -1);
		$('#gamepanel span').text('Congratulations!').hide().fadeIn('slow');
		Crafty.background("url(game/img/victory.png) black");

	});
};