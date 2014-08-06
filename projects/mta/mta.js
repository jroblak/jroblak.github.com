var mta = function() {
    var canvas = document.getElementById("mtacanvas");

    // set up globals explicitly
    this.ctx = canvas.getContext("2d");
    this.w = 611;
    this.h = 764;
    this.currentMousePos = {};
    this.currData = null;
    this.ProtoBuf = dcodeIO.ProtoBuf;
    this.transit = ProtoBuf.protoFromFile('gtfs-realtime.proto').build('transit_realtime');

    canvas.width = w;
    canvas.height = h;

    ctx.viewportWidth = canvas.width;
    ctx.viewportHeight = canvas.height;

    drawNyc = function() {
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

    function draw() {
        //fourFiveSix();
    };

    function loop() {
        draw();
        requestAnimationFrame(loop);
    };

    function pingMta() {
        var request = new createCORSRequest('GET', 'http://datamine.mta.info/mta_esi.php?key=ef80ff678028e7cc96ba474e6194b7d6');
        if (!request) { return; }
        
        request.onload = function() {
            var text = request.responseText;
            console.log(text);
            try {
                console.log(transit.FeedMessage.decode(text))
            } catch(e) {
                console.log(e)
            }
        };
        
        request.send();
    };

    function createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();
        
        if ("withCredentials" in xhr) {
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            xhr = null;
        }
    
        return xhr;
    }

    return {
        run: run
    };
}();

window.onload = function() {
    mta.run();
};