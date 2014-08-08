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

        ctx.shadowBlur = 1;
        ctx.shadowColor = "black";
        ctx.fillStyle = 'grey';
        ctx.fillRect(193, 230, 170, 190);
    }

    function run() {
        drawNyc();
        pingMta();
        loop();
    }

    function fourFiveSix() {
        var color = '#00933C';
        var delaycolor = 'red';
        var changecolor = 'yellow';
        ctx.shadowColor = "#00491C";

        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(400, 210);
        ctx.lineTo(400, 750);

        if (currData.line[1].status !== "GOOD SERVICE") {
            ctx.strokeStyle = delaycolor;
        } else ctx.strokeStyle = color;
        ctx.stroke();
    }

    function ace() {
        var color = '#2850AD';
        var delaycolor = 'red';
        var changecolor = 'yellow';
        ctx.shadowColor = "#1E3D7F";

        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(150, 5);
        ctx.lineTo(150, 40);
        ctx.lineTo(190, 100);
        ctx.lineTo(190, 580);
        ctx.lineTo(300, 580);
        ctx.lineTo(300, 690);
        ctx.lineTo(450, 690);
        if (currData.line[1].status !== "GOOD SERVICE") {
            ctx.strokeStyle = delaycolor;
        } else ctx.strokeStyle = color;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(190, 435);
        ctx.lineTo(435, 435);
        ctx.stroke();
    }

    function jz() {
        var color = '#996633';
        var delaycolor = '';
        var changecolor = '';

    }

    function oneTwoThree() {
        var color = '#EE352E';
        var delaycolor = 'darkred';
        var changecolor = 'yellow';
        ctx.shadowColor = "#821D1A";

        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(190, 5);
        ctx.lineTo(170, 40);
        ctx.lineTo(170, 390);
        ctx.lineTo(250, 490);
        ctx.lineTo(250, 723);
        if (currData.line[1].status !== "GOOD SERVICE") {
            ctx.strokeStyle = delaycolor;
        } else ctx.strokeStyle = color;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(170, 250);
        ctx.lineTo(255, 250);
        ctx.lineTo(255, 170);
        ctx.lineTo(245, 170);
        ctx.stroke();

        ctx.lineTo(255, 170);
        ctx.lineTo(255, 180);
        ctx.lineTo(285, 165);
        ctx.stroke();
    }

    function bdfm() {
        var color = '#FF6319';
        var delaycolor = '';
        var changecolor = '';
    }

    function s() {
        var color = '#808183';
        var delaycolor = '';
        var changecolor = '';
    }

    function nqr() {
        var color = '#FCCC0A';
        var delaycolor = '';
        var changecolor = '';
    }

    function seven() {
        var color = '#B933AD';
        var delaycolor = '';
        var changecolor = '';
    }

    function draw() {
        if (currData === null) return;
        fourFiveSix();
        oneTwoThree();
        ace();
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