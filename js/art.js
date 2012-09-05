window.onload = function(){
	var c = document.getElementById('canvas');
	var ctx = $('#canvas')[0].getContext('2d');

	// make canvas fill the whole window
	var w = $(document).width();
	var h = $(document).height();
	c.width = w;
	c.height = h;

	var lines = [];
	var particles = [];

	var linec = 10;
	for(var i = 0; i < linec; i++) {
		lines.push(new line());
	}
	
	function line() {
		this.speed = {x: -2.5+Math.random()*5, y: -15+Math.random()*10}; // figure this out
		this.color = 0; // color pallete with random to pick witch 4 or 5 colors
		this.width = Math.random()*10;
		this.cx1 = Math.random()*h/2; //appropriate math.random ranges?
		this.cy1 = Math.random()*w/2;
		this.cx2 = Math.random()*h/2;
		this.cy2 = Math.random()*w/2;
		this.endx = Math.random()*(h/2);
		this.endy = Math.random()*(w/2);
	}

	for(var i = 0; i < lines.length; i++){
		var l = lines[i];
		ctx.beginPath();
		ctx.moveTo(w/2+Math.floor((Math.random()*100)-100), h-10);
		ctx.bezierCurveTo(l.cx1, l.cy1, l.cx2, l.cy2, l.endx, l.endy);
		ctx.lineWidth = l.width;
		ctx.strokeStyle = "red";
		ctx.stroke();
	}
	
	
}

