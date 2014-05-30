// http://delphic.me.uk/webgltext.html
webgl.six = (function() {

    /* GLOBALS */
    var shaderProgram = null;

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var mvMatrixStack = [];

    var moonVertexPositionBuffer;
    var moonVertexNormalBuffer;
    var moonVertexTextureCoordBuffer;
    var moonVertexIndexBuffer;
    var moonRotationMatrix = mat4.create();
    mat4.identity(moonRotationMatrix);

    var lastTick = 0;
    var rafid = -1;

    var moonAngle = 0;

    var thetexture = null;


    /* MAIN CODE */
    function enter() {
        initShaders();
        initBuffers();
        
        // async, so last
        initTextures();
    }


    function initTextures() {
        thetexture = gl.createTexture();
        thetexture.image = new Image();
        thetexture.image.onload = function () {
            handleLoadedTexture(thetexture);
            enableSelector();
            tick();
        }

        thetexture.image.src = "/webgl/textures/" + currentId + "/6.gif";
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

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
        shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
        shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");
    }


    function handleKeyDown(event) {
        event.preventDefault();
        currentlyPressedKeys[event.keyCode] = true;
    }

    
    function handleKeyUp(event) {
        event.preventDefault();
        currentlyPressedKeys[event.keyCode] = false;
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


    function animate() {
        var tickNow = new Date().getTime();
        if (lastTick != 0) {
            var elapsed = tickNow - lastTick;

            moonAngle += 0.05 * elapsed;
        }
        lastTick = tickNow;
    }


    function initBuffers() {
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 2;
        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];

        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                textureCoordData.push(u);
                textureCoordData.push(v);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }

        var indexData = [];
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }

        moonVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
        moonVertexNormalBuffer.itemSize = 3;
        moonVertexNormalBuffer.numItems = normalData.length / 3;

        moonVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
        moonVertexTextureCoordBuffer.itemSize = 2;
        moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

        moonVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        moonVertexPositionBuffer.itemSize = 3;
        moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

        moonVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        moonVertexIndexBuffer.itemSize = 1;
        moonVertexIndexBuffer.numItems = indexData.length;
    }


    function drawScene() {
        // set the size and clear the screen
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        gl.uniform3fv(shaderProgram.ambientColorUniform, [0.2, 0.2, 0.2]);
        gl.uniform3fv(shaderProgram.pointLightingLocationUniform, [0.0, 0.0, -20.0]);
        gl.uniform3fv(shaderProgram.pointLightingColorUniform, [0.8, 0.8, 0.8]);

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, mvMatrix, [0, 0, -20]);

        mvPushMatrix();
        mat4.rotate(mvMatrix, mvMatrix, degToRad(moonAngle), [0, 5, 0]);
        mat4.translate(mvMatrix, mvMatrix, [3, 0, 0]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, thetexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, moonVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        mvPopMatrix();
    }


    function end() {
        shaderProgram = null;
        lastTick = 0;
        thetexture = null;
        cancelAnimationFrame(rafid);
        mvMatrix = mat4.create();
        pMatrix = mat4.create();
        moonRotationMatrix = mat4.create();
        mat4.identity(moonRotationMatrix);
        mvMatrixStack = [];
        rafid = -1;
        moonAngle = 0;
    }


    return {
        enter: enter,
        end: end
    }

})();
