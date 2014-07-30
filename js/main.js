window.onload = function() {
    console.log("  __             __   __              __    __       __    ");
    console.log(" |__.--.--.-----|  |_|__.-----..-----|  |--|  .---.-|  |--.");
    console.log(" |  |  |  |__ --|   _|  |     ||  _  |  _  |  |  _  |    < ");
    console.log(" |  |_____|_____|____|__|__|__||_____|_____|__|___._|__|__|");
    console.log("|___|                                                      ");
    console.log("        j  u  s  t  i  n  o  b  l  a  k  .  c  o  m        ");

    var canvas = document.getElementById("bg-canv");

    // set up globals explicitly
    window.ctx = canvas.getContext("2d");
    window.w = $(window).width();
    window.h = $(window).height();
    window.particles = [];
    window.maxParticles = 50;
    window.colors = [{r:'255', g:'184', b:'54',  a:'0.5'},
                     {r:'92',  g:'95',  b:'114', a:'0.5'},
                     {r:'125', g:'127', b:'125', a:'0.5'},
                     {r:'238', g:'239', b:'247', a:'0.5'}];
    window.windStrength = 0;
    window.windDirection = 0;
    window.windTime = 0;

    canvas.width = w;
    canvas.height = h;

    ctx.viewportWidth = canvas.width;
    ctx.viewportHeight = canvas.height;
    
    createParticles(maxParticles);
    draw();
    loop();
};

function Particle(maxY) {
    this.direction = Math.floor(Math.random() * 2) == 1 ? 1 : -1;
    this.x = Math.round(Math.random() * w);
    this.vx = Math.random() * 0.5;
    this.y = -1 * Math.round((Math.random() * h) + 1);
    this.radius = Math.round(Math.random() * 1) + 1;
    this.color = colors[Math.round(Math.random() * 3)];
    this.changeTimer = Math.round((Math.random() * 50) + 1);
};

function createParticles(count) {
    for(var i = 0; i < count; i++){
        particles.push(new Particle);
    }
};

function removeParticles(idxs) {
    var count = idxs.length;
    while (count--) {
        particles.splice(idxs[count], 1);
    }

    createParticles(idxs.length);
};

function move(particle) {
    particle.x += particle.vx * particle.direction;
    particle.changeTimer -= 1;
    particle.y += 1;

    if (particle.changeTimer <= 0) {
        particle.vx = 0.5;
        particle.direction *= -1;
        particle.changeTimer = Math.round((Math.random() * 100) + 50);
    }
};


function draw() {
    lightEffect();
    drawFallingParts();
};

function lightEffect() {
    var offset = $('.title a').offset();
    var x = offset.left;
    var y = offset.top;
    var width = $('.title a').width();

    var text = 'JUSTINOBLAK';
    ctx.fillStyle = "#ffffff";
    ctx.font="30px Arial";
    ctx.fillText("Hello World",10,50)
};

function drawFallingParts() {
    var removals = [];
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'darker';

    // todo - calculate wind based on mouse movement

    for(var i = 0; i < maxParticles; i++){
        var particle = particles[i];

        move(particle);

        if (particle.x > w || particle.y > h) {
            removals.push(i);
        } else {
            ctx.fillStyle = 'rgba(' + particle.color.r +
                                ',' + particle.color.g +
                                ',' + particle.color.b +
                                ',' + particle.color.a + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
    }

    removeParticles(removals);
};

function loop() {
    draw();
    requestAnimationFrame(loop);
};
