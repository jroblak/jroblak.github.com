webgl.three = (function() {

    /* GLOBALS */
    var shaderProgram = null;

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var mvMatrixStack = [];

    var cubeVertexPositionBuffer = null;
    var cubeVertexTextureCoordBuffer = null;
    var cubeVertexIndexBuffer = null;
    var cubeVertexNormalBuffer = null;

    var xRot = 0;
    var yRot = 0;
    var zRot = 0;

    var lastTick = 0;
    var rafid = -1;

    var thetexture = null;

    function enter() {
        initShaders();
        initBuffers();
        initTextures();

         // blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
    }


    function initTextures() {
        thetexture = gl.createTexture();
        thetexture.image = new Image();
        thetexture.image.onload = function () {
            handleLoadedTexture(thetexture);
            enableSelector();
            tick();
        }

        thetexture.image.src = "/webgl/textures/" + currentId + "/3.gif";
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

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
        shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
        shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
        shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
    }


    function initBuffers() {
        cubeVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
        vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        cubeVertexPositionBuffer.itemSize = 3;
        cubeVertexPositionBuffer.numItems = 24;

        cubeVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
        var vertexNormals = [
          // Front face
           0.0,  0.0,  1.0,
           0.0,  0.0,  1.0,
           0.0,  0.0,  1.0,
           0.0,  0.0,  1.0,

          // Back face
           0.0,  0.0, -1.0,
           0.0,  0.0, -1.0,
           0.0,  0.0, -1.0,
           0.0,  0.0, -1.0,

          // Top face
           0.0,  1.0,  0.0,
           0.0,  1.0,  0.0,
           0.0,  1.0,  0.0,
           0.0,  1.0,  0.0,

          // Bottom face
           0.0, -1.0,  0.0,
           0.0, -1.0,  0.0,
           0.0, -1.0,  0.0,
           0.0, -1.0,  0.0,

          // Right face
           1.0,  0.0,  0.0,
           1.0,  0.0,  0.0,
           1.0,  0.0,  0.0,
           1.0,  0.0,  0.0,

          // Left face
          -1.0,  0.0,  0.0,
          -1.0,  0.0,  0.0,
          -1.0,  0.0,  0.0,
          -1.0,  0.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        cubeVertexNormalBuffer.itemSize = 3;
        cubeVertexNormalBuffer.numItems = 24;

        cubeVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
        var textureCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,

          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,

          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,

          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        cubeVertexTextureCoordBuffer.itemSize = 2;
        cubeVertexTextureCoordBuffer.numItems = 24;

        cubeVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        cubeVertexIndexBuffer.itemSize = 1;
        cubeVertexIndexBuffer.numItems = 36;
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

        var normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, mvMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
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

        mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -5.0]);

        mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), [1, 0, 0]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(yRot), [0, 1, 0]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(zRot), [0, 0, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, thetexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0)

        gl.uniform1i(shaderProgram.useLightingUniform, true); // always use lighting
        gl.uniform3fv(shaderProgram.ambientColorUniform, [0.7, 0.7, 0.7]);

        gl.uniform1f(shaderProgram.alphaUniform, 0.5);

        // lighting
        var adjustedLD = vec3.create();
        vec3.normalize(adjustedLD, [-0.8, -0.8, -1.0]); // normalizes (normally user input)
        vec3.scale(adjustedLD, adjustedLD, -1); // scales by -1 to change from where light is coming from to where it is going
        gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

        gl.uniform3fv(shaderProgram.directionalColorUniform, [0.4, 0.4, 0.4]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }


    function animate() {
        var tickNow = new Date().getTime();
        if (lastTick != 0) {
            var elapsed = tickNow - lastTick;

            xRot += (75 * elapsed) / 1000.0;
            yRot += (75 * elapsed) / 1000.0;
            zRot += (75 * elapsed) / 1000.0;
        }

        lastTick = tickNow;
    }


    function end() {
        shaderProgram = null;
        cubeVertexPositionBuffer = null;
        cubeVertexTextureCoordBuffer = null;
        cubeVertexIndexBuffer = null;
        cubeVertexNormalBuffer = null;
        xRot = 0;
        yRot = 0;
        zRot = 0;
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
