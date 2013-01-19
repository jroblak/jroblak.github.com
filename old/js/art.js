window.onload = function(){
	var c = document.getElementById('canvas');
	var ctx = $('#canvas')[0].getContext('2d');

	// make canvas fill the whole window
	var w = $(document).width();
	var h = $(document).height();
	c.width = w;
	c.height = h;


	for(var i = 0; i < 10; i++){
		ctx.beginPath();
		ctx.moveTo(w/2+Math.floor((Math.random()*100)-100), h-10);
		ctx.bezierCurveTo(Math.random()*h, Math.random()*w, Math.random()*h, Math.random()*w, Math.random()*h, Math.random()*w);
		ctx.lineWidth = Math.random()*8;
		ctx.lineCap = 'round';
		var colorp = Math.random()*5;
		if(colorp < 3) {
			ctx.strokeStyle = 'rgba(51,55,69,'+Math.floor((Math.random())+1)+')';
		} else if(colorp > 3 && colorp < 4) {
			ctx.strokeStyle = 'rgba(119,196,211,'+Math.floor((Math.random())+1)+')';
		} else if(colorp > 4 && colorp < 5) {
			ctx.strokeStyle = 'rgba(234,46,73,'+Math.floor((Math.random())+1)+')';
		} 
		ctx.stroke();
	}
	
};

