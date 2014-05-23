/* GLOBALS */
var gl;
var currentId = "one";
var webgl = {};


jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


function enableSelector() {
    $("#rightValues").prop('disabled', false);
}


$(function() {
	var canvas = document.getElementById("canvas");
    canvas.width = $('.content').width();
    canvas.height = 500;
	initGL(canvas);

	// Load default WebGL project
	testAndLoad();

	$("#rightValues").change(function() {
        $(this).prop('disabled', 'disabled');
		currentId = $(this).val();
		testAndLoad();
	})
});


function startWebGl() {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

    webgl[currentId].enter();
}


function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    	alert('Error - ' + e);
    }

    if (!gl) {
        alert("Could not initialise WebGL!");
    }
}


function testAndLoad() {
    var functionName = webgl[currentId];
	var path = "/js/webgl/" + currentId + ".js";

	if (typeof functionName === 'undefined') {
        $.loadScript(path, function(){
    		startWebGl();
    	});
    } else {
        startWebGl();
    }
}

function loadShaders(gl, shaders) {
	var shaders = [].concat(shaders);

    function compileShader() {
        var xhr = this;
        var i = xhr.i;

        if (xhr.readyState == 4) {
        	var type = shaders[i].slice(0, 2) == "fs" ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER;
            shaders[i] = gl.createShader(type);

            gl.shaderSource(shaders[i], xhr.responseText);
            gl.compileShader(shaders[i]);

            if (!gl.getShaderParameter(shaders[i], gl.COMPILE_STATUS)) {
                throw gl.getShaderInfoLog(shaders[i]);
            }
        }
    }

    for (var i = 0; i < shaders.length; i++) {
        var xhr = new XMLHttpRequest;
        var shaderName = shaders[i].slice(3, shaders[i].length);
        xhr.i = i;

        xhr.open("get", "/js/webgl/shaders/" + currentId + "/" + shaderName + ".c", false);

        xhr.send(null);
        compileShader.call(xhr);
    }

    return shaders;
}