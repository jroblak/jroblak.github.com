// http://delphic.me.uk/webgltext.html
webgl.five = (function() {

    /* GLOBALS */
    var shaderProgram = null;

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var mvMatrixStack = [];

    var worldVertexPositionBuffer = null;
    var worldVertexTextureCoordBuffer = null;

    var lastTick = 0;
    var rafid = -1;
    var effectiveFps = 60 / 1000;

    var thetexture = null;
    var texturecanvas = null;

    var pitch = 0;
    var pitchRate = 0;

    var yaw = 0;
    var yawRate = 0;

    var xPos = 0;
    var yPos = 0.4;
    var zPos = 0;

    var joggingAngle = 0;

    var speed = 0;
    var currentlyPressedKeys = {};

    var text = "Arrows or WASD to move; Page Up / Page Down to alter pitch";

    /* MAIN CODE */
    function enter() {
        initShaders();
        loadWorld();
        $('#textoverlay').text(text);

        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;
        
        // async, so last
        initTextures();
    }


    function loadWorld() {
        var request = new XMLHttpRequest();
        request.open("GET", "/webgl/models/world.txt", false);

        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            handleLoadedWorld(request.responseText);
          }
        }

        request.send();
    }


    function handleLoadedWorld(data) {
        var lines = data.split("\n");
        var vertexCount = 0;
        var vertexPositions = [];
        var vertexTextureCoords = [];
        for (var i in lines) {
            var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
            if (vals.length == 5 && vals[0] != "//") {
                // It is a line describing a vertex; get X, Y and Z first
                vertexPositions.push(parseFloat(vals[0]));
                vertexPositions.push(parseFloat(vals[1]));
                vertexPositions.push(parseFloat(vals[2]));

                // And then the texture coords
                vertexTextureCoords.push(parseFloat(vals[3]));
                vertexTextureCoords.push(parseFloat(vals[4]));

                vertexCount += 1;
            }
        }

        worldVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
        worldVertexPositionBuffer.itemSize = 3;
        worldVertexPositionBuffer.numItems = vertexCount;

        worldVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
        worldVertexTextureCoordBuffer.itemSize = 2;
        worldVertexTextureCoordBuffer.numItems = vertexCount;
    }


    function initTextures() {
        thetexture = gl.createTexture();
        thetexture.image = new Image();
        thetexture.image.onload = function () {
            handleLoadedTexture(thetexture);
            enableSelector();
            tick();
        }

        thetexture.image.src = "/webgl/textures/" + currentId + "/5.gif";
    }


    function handleLoadedTexture(texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }


    function initShaders() {
        var fragmentShader = loadShaders(gl, "fs/fragment")[0];
        var vertexShader = loadShaders(gl, "vs/vertex")[0];

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    }


    function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;
    }

    
    function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
    }


    function handleKeys() {
        if (currentlyPressedKeys[33]) {
            // Page Up
            pitchRate = 0.1;
        } else if (currentlyPressedKeys[34]) {
            // Page Down
            pitchRate = -0.1;
        } else {
            pitchRate = 0;
        }

        if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
            // Left cursor key or A
            yawRate = 0.1;
        } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
            // Right cursor key or D
            yawRate = -0.1;
        } else {
            yawRate = 0;
        }

        if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
            // Up cursor key or W
            speed = 0.003;
        } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
            // Down cursor key
            speed = -0.003;
        } else {
            speed = 0;
        }
    }


    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.copy(copy, mvMatrix);
        mvMatrixStack.push(copy);
    }


    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
          throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }


    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }


    function tick() {
        rafid = requestAnimationFrame(tick);
        handleKeys();
        drawScene();
        animate();
    }


    function drawScene() {
        // set the size and clear the screen
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        mat4.identity(mvMatrix);

        mat4.rotate(mvMatrix, mvMatrix, degToRad(-pitch), [1, 0, 0]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(-yaw), [0, 1, 0]);
        mat4.translate(mvMatrix, mvMatrix, [-xPos, -yPos, -zPos]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, thetexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);
    }


    function animate() {
        var tickNow = new Date().getTime();
        if (lastTick != 0) {
            var elapsed = tickNow - lastTick;

            if (speed != 0) {
                xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
                zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;

                joggingAngle += elapsed * 0.6;
                yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4;
            }

            yaw += yawRate * elapsed;
            pitch += pitchRate * elapsed;
        }

        lastTick = tickNow;
    }


    function end() {
        shaderProgram = null;
        lastTick = 0;
        thetexture = null;
        texturecanvas = null;
        cancelAnimationFrame(rafid);
        mvMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrixStack = [];
        rafid = -1;
        $('#textoverlay').text('');
    }


    return {
        enter: enter,
        end: end
    }

})();
