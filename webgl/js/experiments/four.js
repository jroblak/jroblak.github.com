webgl.four = (function() {

    /* GLOBALS */
    var shaderProgram = null;

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var mvMatrixStack = [];

    var starVertexPositionBuffer = null;
    var starVertexTextureCoordBuffer = null;

    var stars = [];

    var tilt = 70;
    var zoom = -10;
    var spin = 0;

    var lastTick = 0;
    var rafid = -1;
    var effectiveFps = 60 / 1000;

    var thetexture = null;

    /* STAR OBJECT */
    function Star(startDist, rotSpeed) {
      this.angle = 0;
      this.dist = startDist;
      this.rotSpeed = rotSpeed;

      this.randomizeColors();
    }

    Star.prototype.draw = function(tilt, spin) {
      mvPushMatrix();
      mat4.rotate(mvMatrix, mvMatrix, degToRad(this.angle), [0.0, 1.0, 0.0]);
      mat4.translate(mvMatrix, mvMatrix, [this.dist, 0.0, 0.0]);

      // correct for tilting screen
      mat4.rotate(mvMatrix, mvMatrix, degToRad(-this.angle), [0.0, 1.0, 0.0]);
      mat4.rotate(mvMatrix, mvMatrix, degToRad(-tilt), [1.0, 0.0, 0.0]);

      gl.uniform3f(shaderProgram.colorUniform, this.twinkleR, this.twinkleG, this.twinkleB);
      drawStar();

      mat4.rotate(mvMatrix, mvMatrix, degToRad(spin), [0.0, 0.0, 1.0]);

      gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
      drawStar();

      mvPopMatrix();
    };

    Star.prototype.animate = function(elapsedTime) {
      this.angle += this.rotSpeed * effectiveFps * elapsedTime;
      this.dist -= 0.01 * effectiveFps * elapsedTime;

      if (this.dist < 0.0) {
        this.dist += 5.0;
        this.randomizeColors();
      }
    };

    Star.prototype.randomizeColors = function() {
      // Give the star a random color for normal
      // circumstances...
      this.r = Math.random();
      this.g = Math.random();
      this.b = Math.random();

      // When the star is twinkling, we draw it twice, once
      // in the color below (not spinning) and then once in the
      // main color defined above.
      this.twinkleR = Math.random();
      this.twinkleG = Math.random();
      this.twinkleB = Math.random();
    };


    /* MAIN CODE */
    function enter() {
        initShaders();
        initBuffers();
        initObjects();
        
        // blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);

        // async, so last
        initTextures();
    }


    function initObjects() {
      for (var i = 0; i < 25; i++) {
        stars.push(new Star((i / 25) * 5.0, i / 25));
      }
    }


    function initTextures() {
        thetexture = gl.createTexture();
        thetexture.image = new Image();
        thetexture.image.onload = function () {
            handleLoadedTexture(thetexture);
            enableSelector();
            tick();
        }

        thetexture.image.src = "/webgl/textures/" + currentId + "/4.gif";
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
        shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
    }


    function initBuffers() {
        starVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
        vertices = [
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0,  1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        starVertexPositionBuffer.itemSize = 3;
        starVertexPositionBuffer.numItems = 4;

        starVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
        var textureCoords = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        starVertexTextureCoordBuffer.itemSize = 2;
        starVertexTextureCoordBuffer.numItems = 4;
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
        drawScene();
        animate();
    }


    function drawScene() {
        // set the size and clear the screen
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, zoom]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(tilt), [1, 0, 0]);

        for (var i in stars) {
          stars[i].draw(tilt, spin);
          spin += 0.1;
        }
    }


    function drawStar() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, thetexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, starVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, starVertexPositionBuffer.numItems);
    }


    function animate() {
        var tickNow = new Date().getTime();
        if (lastTick != 0) {
            var elapsed = tickNow - lastTick;

            // animate each object
            for (var i in stars) {
              stars[i].animate(elapsed);
            }
        }

        lastTick = tickNow;
    }


    function end() {
        shaderProgram = null;
        starVertexPositionBuffer = null;
        starVertexTextureCoordBuffer = null;
        stars = [];
        lastTick = 0;
        thetexture = null;
        cancelAnimationFrame(rafid);
        mvMatrix = mat4.create();
        pMatrix = mat4.create();
        mvMatrixStack = [];
        rafid = -1;

        gl.disable(gl.BLEND);
    }


    return {
        enter: enter,
        end: end
    }

})();
