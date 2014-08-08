var mta = function() {
    var canvas = document.getElementById("mtacanvas");

    // set up globals explicitly
    var ctx = canvas.getContext("2d");
    var w = 611;
    var h = 764;
    var currentMousePos = {};
    var currData = null;

    canvas.width = w;
    canvas.height = h;

    ctx.viewportWidth = canvas.width;
    ctx.viewportHeight = canvas.height;

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

    function run() {
        drawNyc();
        pingMta();
        loop();
    }

    var fourFiveSix = function() {
        ctx.beginPath();
        ctx.arc(400, 210, 5, 0, Math.PI * 2, true);
        ctx.moveTo(398, 210);
        ctx.lineTo(398, 750);
        ctx.arc(400, 750, 5, 0, Math.PI * 2, true);
        ctx.lineTo(403, 750);
        ctx.lineTo(403, 210);
        ctx.closePath();
        if (currData.line[1].status !== "GOOD SERVICE") {
            ctx.fillStyle = 'red';
        } else ctx.fillStyle = '#00933C';
        ctx.strokeStyle = '#005420';
        ctx.fill();
        ctx.stroke();
    }

    function draw() {
        if (currData === null) return;
        fourFiveSix();
    };

    function loop() {
        draw();
        requestAnimationFrame(loop);
    };

    function pingMta() {
        var request = $.ajax({
            url: 'http://priv.justinoblak.com/mta-api/subway',
            crossDomain: true
        }).done(function(data) {
            currData = $.parseJSON(data);
        });
    };

    return {
        run: run
    };
}();

$(function() {
    mta.run();
});