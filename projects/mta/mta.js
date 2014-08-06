window.onload = function() {
    var canvas = document.getElementById("mtacanvas");

    // set up globals explicitly
    window.ctx = canvas.getContext("2d");
    window.w = 611;
    window.h = 764;
    window.currentMousePos = {};

    canvas.width = w;
    canvas.height = h;

    ctx.viewportWidth = canvas.width;
    ctx.viewportHeight = canvas.height;

    drawNyc();
    loop();
};

function drawNyc() {
    ctx.beginPath();
    ctx.moveTo(141, 32);
    ctx.lineTo(163, 12);
    ctx.lineTo(195, 12);
    ctx.lineTo(215, 32);
    ctx.lineTo(215, 99);
    ctx.lineTo(279, 168);
    ctx.lineTo(349, 168);
    ctx.lineTo(426, 243);
    ctx.lineTo(426, 492);
    ctx.lineTo(484, 549);
    ctx.lineTo(484, 637);
    ctx.lineTo(371, 758);
    ctx.lineTo(288, 758);
    ctx.lineTo(141, 591);
    ctx.closePath();

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.stroke();
    ctx.fill();
}

function fourFiveSix() {
    
}

function draw() {
    // hit api
    fourFiveSix();
};

function loop() {
    draw();
    requestAnimationFrame(loop);
};