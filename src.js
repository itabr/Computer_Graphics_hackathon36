var gl;
var shaderProgram;

var mvMatrix = mat4.create();
var mv_MatrixStack = [];
var pMatrix = mat4.create();

// Texture

var bmwTexture;
var benzTexture;
var teslaTexture;
var porscheTexture;
var maseratiTexture;


// ACTUAL CAR SPEED PROPORTIONS from cars racing the Nurburgring lap.
// Distance of 20.8 km.
// Data Collected from https://nurburgringlaptimes.com/lap-times-top-100/

// This proportion changes the speed of all the cars proportionally
var OVERALL_PROPORTION = 0.35;

// The speed value proportion is calculated from the car's lap finish time
// from the website's data. The rotation speed is changed by the same factor.
var bmw_depth = -2;
var bmw_speed = 0.1339644548 * OVERALL_PROPORTION;
var bmw_rot_speed = 0.2 * 1.339644548;

var benz_depth = -2;
var benz_speed = 0.139236981 * OVERALL_PROPORTION;
var benz_rot_speed = 0.2 * 1.39236981;

var tesla_depth = -2;
var tesla_speed = 0.1 * OVERALL_PROPORTION;
var tesla_rot_speed = 0.2;

var porsche_depth = -2;
var porsche_speed = 0.143884892 * OVERALL_PROPORTION;
var porsche_rot_speed = 0.2 * 1.43884892;

var maserati_depth = -2;
var maserati_speed = 0.135046929 * OVERALL_PROPORTION;
var maserati_rot_speed = 0.2 * 1.35046929;

// These values determine the direction in which the spheres rotate. These will change when the car finishes the second half of the lap
// in the opposite direction.

var rot_num_bmw = -1;
var rot_num_benz = -1;
var rot_num_tesla = -1;
var rot_num_porsche = -1;
var rot_num_maserati = -1;

// These values help in printing out the statements when the cars finish the race.

var finish = '';
var count_bmw = 1;
var count_benz = 1;
var count_tesla = 1;
var count_maserati = 1;
var count_porsche = 1;


function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {

    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    
    return shader;

}

// setting up the required shaders.

function initShaders() {

    var fragmentShader = getShader(gl,"shader-fs");
    var vertexShader = getShader(gl,"shader-vs");
    
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
    
    // settign up the matirx
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

    // setting up the shader for lighting
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");

}

//  setting up the routine for handling texture 

function handleLoadedTexture(texture) {

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);

}

// The initTexture function attaches the gif images to the spheres, which
// represent different racecars. Five textures are created and initialized.

// initTexture calls the Texture routine to apply the picture

function initTexture() {
    
    bmwTexture = gl.createTexture();
    bmwTexture.image = new Image();
    bmwTexture.image.onload = function () {
        handleLoadedTexture(bmwTexture)
    }
    bmwTexture.image.src = "gif/bmw.gif";
    
    benzTexture = gl.createTexture();
    benzTexture.image = new Image();
    benzTexture.image.onload = function () {
        handleLoadedTexture(benzTexture)
    }
    benzTexture.image.src = "gif/benz.gif";
    
    teslaTexture = gl.createTexture();
    teslaTexture.image = new Image();
    teslaTexture.image.onload = function () {
        handleLoadedTexture(teslaTexture)
    }
    teslaTexture.image.src = "gif/tesla.gif";
    
    porscheTexture = gl.createTexture();
    porscheTexture.image = new Image();
    porscheTexture.image.onload = function () {
        handleLoadedTexture(porscheTexture)
    }
    porscheTexture.image.src = "gif/porsche.gif";
    
    maseratiTexture = gl.createTexture();
    maseratiTexture.image = new Image();
    maseratiTexture.image.onload = function () {
        handleLoadedTexture(maseratiTexture)
    }
    maseratiTexture.image.src = "gif/maserati.gif";

}

// handloing the stack for matrix

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mv_MatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mv_MatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mv_MatrixStack.pop();
}

function setMatrixUniforms() {

    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);

}

// Creates the vertex position, normal, and coordinate buffers for all the cars.
// spheres rotate at different speeds based on their actual relative speeds.

var RotationMatrix_bmw = mat4.create();
mat4.identity(RotationMatrix_bmw);
var bmwVertexPositionBuffer;
var bmwVertexNormalBuffer;
var bmwVertexTextureCoordBuffer;
var bmwVertexIndexBuffer;
var vertexPositionData_bmw = [];
var normalData_bmw = [];
var textureCoordData_bmw= [];
var indexData_bmw = [];


var RotationMatrix_benz = mat4.create();
mat4.identity(RotationMatrix_benz);
var benzVertexPositionBuffer;
var benzVertexNormalBuffer;
var benzVertexTextureCoordBuffer;
var benzVertexIndexBuffer;
var vertexPositionData_benz = [];
var normalData_benz = [];
var textureCoordData_benz = [];
var indexData_benz = [];


var RotationMatrix_tesla = mat4.create();
mat4.identity(RotationMatrix_tesla);
var teslaVertexPositionBuffer;
var teslaVertexNormalBuffer;
var teslaVertexTextureCoordBuffer;
var teslaVertexIndexBuffer;
var vertexPositionData_tesla = [];
var normalData_tesla = [];
var textureCoordData_tesla = [];
var indexData_tesla = [];


var RotationMatrix_porsche = mat4.create();
mat4.identity(RotationMatrix_porsche);
var porscheVertexPositionBuffer;
var porscheVertexNormalBuffer;
var porscheVertexTextureCoordBuffer;
var porscheVertexIndexBuffer;
var vertexPositionData_porsche = [];
var normalData_porsche = [];
var textureCoordData_porsche = [];
var indexData_porsche = [];


var RotationMatrix_maserati = mat4.create();
mat4.identity(RotationMatrix_maserati);
var maseratiVertexPositionBuffer;
var maseratiVertexNormalBuffer;
var maseratiVertexTextureCoordBuffer;
var maseratiVertexIndexBuffer;
var vertexPositionData_maserati = [];
var normalData_maserati = [];
var textureCoordData_maserati = [];
var indexData_maserati = [];


// Initializes all the buffers for position, coordinate, and normal data. Uses trig functions to enable rotation.

function initBuffers() {
    
    var latitude = 50;
    var longitude = 50;
    
    // BMW initialize buffers
    
    // BMW is positioned at the center, with a distance 0 away from origin.

    var dist_bmw = 0;
    var radius_bmw = 0.1;

    // sphere routine for pushing the coordinates for the points into the matrix
    // latitude and longitude represent how many points are we using for the sphere
    // larger the latitude and longitude the sphere will be more smooth

    for (var latNumber=0; latNumber <= latitude; latNumber++) {
        var theta = latNumber * Math.PI / latitude;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitude; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitude;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta + dist_bmw;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 0.75 - (longNumber / longitude);
            var v = 1 - (latNumber / latitude);
            
            normalData_bmw.push(x);
            normalData_bmw.push(y);
            normalData_bmw.push(z);
            textureCoordData_bmw.push(u);
            textureCoordData_bmw.push(v);
            vertexPositionData_bmw.push(radius_bmw * x);
            vertexPositionData_bmw.push(radius_bmw * y);
            vertexPositionData_bmw.push(radius_bmw * z);
        }
    }
    
    for (var latNumber=0; latNumber < latitude; latNumber++) {
        for (var longNumber=0; longNumber < longitude; longNumber++) {
            var first = (latNumber * (longitude + 1)) + longNumber;
            var second = first + longitude + 1;
            indexData_bmw.push(first);
            indexData_bmw.push(second);
            indexData_bmw.push(first + 1);
            
            indexData_bmw.push(second);
            indexData_bmw.push(second + 1);
            indexData_bmw.push(first + 1);
        }
    }
    
    // Initialize normal buffer
    bmwVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bmwVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData_bmw), gl.STATIC_DRAW);
    bmwVertexNormalBuffer.itemSize = 3;
    bmwVertexNormalBuffer.numItems = normalData_bmw.length / 3;
    
    // Initialize texture buffer
    bmwVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bmwVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData_bmw), gl.STATIC_DRAW);
    bmwVertexTextureCoordBuffer.itemSize = 2;
    bmwVertexTextureCoordBuffer.numItems = textureCoordData_bmw.length / 2;
    
    // Initialize position buffer
    bmwVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bmwVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData_bmw), gl.STATIC_DRAW);
    bmwVertexPositionBuffer.itemSize = 3;
    bmwVertexPositionBuffer.numItems = vertexPositionData_bmw.length / 3;
    
    // Initialize buffer of vertex indices
    bmwVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bmwVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData_bmw), gl.STATIC_DRAW);
    bmwVertexIndexBuffer.itemSize = 1;
    bmwVertexIndexBuffer.numItems = indexData_bmw.length;
    
    
    
    // Mercedes Benz initialize buffers
    
    // Mercedes is second to right, with distance 5 away from the origin.
    var dist_benz = 5;
    var radius_benz = 0.1;
    
    for (var latNumber=0; latNumber <= latitude; latNumber++) {
        var theta = latNumber * Math.PI / latitude;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitude; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitude;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta + dist_benz;         // change the possiotn of the x
            // console.log(x);
            
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 0.75 - (longNumber / longitude);
            var v = 1 - (latNumber / latitude);
            
            normalData_benz.push(x);
            normalData_benz.push(y);
            normalData_benz.push(z);
            textureCoordData_benz.push(u);
            textureCoordData_benz.push(v);
            vertexPositionData_benz.push(radius_benz * x);
            vertexPositionData_benz.push(radius_benz * y);
            vertexPositionData_benz.push(radius_benz * z);
        }
    }
    
    for (var latNumber=0; latNumber < latitude; latNumber++) {
        for (var longNumber=0; longNumber < longitude; longNumber++) {
            var first = (latNumber * (longitude + 1)) + longNumber;
            var second = first + longitude + 1;
            indexData_benz.push(first);
            indexData_benz.push(second);
            indexData_benz.push(first + 1);
            
            indexData_benz.push(second);
            indexData_benz.push(second + 1);
            indexData_benz.push(first + 1);
        }
    }
    
    
    benzVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, benzVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData_benz), gl.STATIC_DRAW);
    benzVertexNormalBuffer.itemSize = 3;
    benzVertexNormalBuffer.numItems = normalData_benz.length / 3;
    
    benzVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, benzVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData_benz), gl.STATIC_DRAW);
    benzVertexTextureCoordBuffer.itemSize = 2;
    benzVertexTextureCoordBuffer.numItems = textureCoordData_benz.length / 2;
    
    benzVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, benzVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData_benz), gl.STATIC_DRAW);
    benzVertexPositionBuffer.itemSize = 3;
    benzVertexPositionBuffer.numItems = vertexPositionData_benz.length / 3;
    
    benzVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, benzVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData_benz), gl.STATIC_DRAW);
    benzVertexIndexBuffer.itemSize = 1;
    benzVertexIndexBuffer.numItems = indexData_benz.length;
    
    
    
    // Tesla initialize buffers
    
    // Tesla is second to left, with distance -5 away from the origin.
    var dist_tesla = -5;
    var radius_tesla = 0.1;
    
    for (var latNumber=0; latNumber <= latitude; latNumber++) {
        var theta = latNumber * Math.PI / latitude;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitude; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitude;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta + dist_tesla;         // change the possiotn of the x
            
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 0.75 - (longNumber / longitude);
            var v = 1 - (latNumber / latitude);
            
            normalData_tesla.push(x);
            normalData_tesla.push(y);
            normalData_tesla.push(z);
            textureCoordData_tesla.push(u);
            textureCoordData_tesla.push(v);
            vertexPositionData_tesla.push(radius_tesla * x);
            vertexPositionData_tesla.push(radius_tesla * y);
            vertexPositionData_tesla.push(radius_tesla * z);
        }
    }
    
    for (var latNumber=0; latNumber < latitude; latNumber++) {
        for (var longNumber=0; longNumber < longitude; longNumber++) {
            var first = (latNumber * (longitude + 1)) + longNumber;
            var second = first + longitude + 1;
            indexData_tesla.push(first);
            indexData_tesla.push(second);
            indexData_tesla.push(first + 1);
            indexData_tesla.push(second);
            indexData_tesla.push(second + 1);
            indexData_tesla.push(first + 1);
        }
    }
    
    teslaVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teslaVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData_tesla), gl.STATIC_DRAW);
    teslaVertexNormalBuffer.itemSize = 3;
    teslaVertexNormalBuffer.numItems = normalData_tesla.length / 3;
    
    teslaVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teslaVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData_tesla), gl.STATIC_DRAW);
    teslaVertexTextureCoordBuffer.itemSize = 2;
    teslaVertexTextureCoordBuffer.numItems = textureCoordData_tesla.length / 2;
    
    teslaVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teslaVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData_tesla), gl.STATIC_DRAW);
    teslaVertexPositionBuffer.itemSize = 3;
    teslaVertexPositionBuffer.numItems = vertexPositionData_tesla.length / 3;
    
    teslaVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teslaVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData_tesla), gl.STATIC_DRAW);
    teslaVertexIndexBuffer.itemSize = 1;
    teslaVertexIndexBuffer.numItems = indexData_tesla.length;
    
    // Porsche initialize buffers
    
    // Porsche is at the rightmost position with distance 10 away from the origin.
    var dist_porsche = 10;
    var radius_porsche = 0.1;
    
    for (var latNumber=0; latNumber <= latitude; latNumber++) {
        var theta = latNumber * Math.PI / latitude;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitude; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitude;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta + dist_porsche;         // change the possiotn of the x
            
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 0.75 - (longNumber / longitude);
            var v = 1 - (latNumber / latitude);
            
            normalData_porsche.push(x);
            normalData_porsche.push(y);
            normalData_porsche.push(z);
            textureCoordData_porsche.push(u);
            textureCoordData_porsche.push(v);
            vertexPositionData_porsche.push(radius_porsche * x);
            vertexPositionData_porsche.push(radius_porsche * y);
            vertexPositionData_porsche.push(radius_porsche * z);
        }
    }
    
    for (var latNumber=0; latNumber < latitude; latNumber++) {
        for (var longNumber=0; longNumber < longitude; longNumber++) {
            var first = (latNumber * (longitude + 1)) + longNumber;
            var second = first + longitude + 1;
            indexData_porsche.push(first);
            indexData_porsche.push(second);
            indexData_porsche.push(first + 1);
            
            indexData_porsche.push(second);
            indexData_porsche.push(second + 1);
            indexData_porsche.push(first + 1);
        }
    }
    
    porscheVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, porscheVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData_porsche), gl.STATIC_DRAW);
    porscheVertexNormalBuffer.itemSize = 3;
    porscheVertexNormalBuffer.numItems = normalData_porsche.length / 3;
    
    porscheVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, porscheVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData_porsche), gl.STATIC_DRAW);
    porscheVertexTextureCoordBuffer.itemSize = 2;
    porscheVertexTextureCoordBuffer.numItems = textureCoordData_porsche.length / 2;
    
    porscheVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, porscheVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData_porsche), gl.STATIC_DRAW);
    porscheVertexPositionBuffer.itemSize = 3;
    porscheVertexPositionBuffer.numItems = vertexPositionData_porsche.length / 3;
    
    porscheVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, porscheVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData_porsche), gl.STATIC_DRAW);
    porscheVertexIndexBuffer.itemSize = 1;
    porscheVertexIndexBuffer.numItems = indexData_porsche.length;
    
    // Maserati initialize buffers
    
    // Maserati is at the leftmost position with distance -10 away from the origin.
    var dist_maserati = -10;
    
    var radius_maserati = 0.1;
    
    for (var latNumber=0; latNumber <= latitude; latNumber++) {
        var theta = latNumber * Math.PI / latitude;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitude; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitude;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta + dist_maserati;         // change the possiotn of the x
            // console.log(x);
            
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 0.75 - (longNumber / longitude);
            var v = 1 - (latNumber / latitude);
            
            normalData_maserati.push(x);
            normalData_maserati.push(y);
            normalData_maserati.push(z);
            textureCoordData_maserati.push(u);
            textureCoordData_maserati.push(v);
            vertexPositionData_maserati.push(radius_maserati * x);
            vertexPositionData_maserati.push(radius_maserati * y);
            vertexPositionData_maserati.push(radius_maserati * z);
        }
    }
    
    for (var latNumber=0; latNumber < latitude; latNumber++) {
        for (var longNumber=0; longNumber < longitude; longNumber++) {
            var first = (latNumber * (longitude + 1)) + longNumber;
            var second = first + longitude + 1;
            indexData_maserati.push(first);
            indexData_maserati.push(second);
            indexData_maserati.push(first + 1);
            indexData_maserati.push(second);
            indexData_maserati.push(second + 1);
            indexData_maserati.push(first + 1);
        }
    }
    
    maseratiVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, maseratiVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData_maserati), gl.STATIC_DRAW);
    maseratiVertexNormalBuffer.itemSize = 3;
    maseratiVertexNormalBuffer.numItems = normalData_maserati.length / 3;
    
    maseratiVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, maseratiVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData_maserati), gl.STATIC_DRAW);
    maseratiVertexTextureCoordBuffer.itemSize = 2;
    maseratiVertexTextureCoordBuffer.numItems = textureCoordData_maserati.length / 2;
    
    maseratiVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, maseratiVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData_maserati), gl.STATIC_DRAW);
    maseratiVertexPositionBuffer.itemSize = 3;
    maseratiVertexPositionBuffer.numItems = vertexPositionData_maserati.length / 3;
    
    maseratiVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, maseratiVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData_maserati), gl.STATIC_DRAW);
    maseratiVertexIndexBuffer.itemSize = 1;
    maseratiVertexIndexBuffer.numItems = indexData_maserati.length;
}


function drawScene() {
    
    // Code to set lighting direction and parameters
    
    gl.viewport(0, 0, gl.viewportWidth , gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(30, gl.viewportWidth / gl.viewportHeight , 1, 2000.0, pMatrix);

    gl.uniform1i(shaderProgram.useLightingUniform, 1);
    gl.uniform3f( shaderProgram.ambientColorUniform, parseFloat(0.2), parseFloat(0.2), parseFloat(0.2) );
    var lightingDirection = [ parseFloat(0.0), parseFloat(-1), parseFloat(-0.6) ];

    var adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, -1);
    gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
        
    gl.uniform3f(shaderProgram.directionalColorUniform, parseFloat(0.8), parseFloat(0.8), parseFloat(0.8) );
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    mvPushMatrix();
    mat4.identity(mvMatrix);
    bmw_depth = bmw_depth - bmw_speed;
    mat4.translate(mvMatrix, [0, -0.3, bmw_depth]);
    
    // Make sure the sphere turns around after going inwards a specified depth.
    // Change the rotation value and print out the statement when the object
    // finishes the race.
    
    if(bmw_depth < -25){
        bmw_speed = bmw_speed * -1;
        rot_num_bmw =  rot_num_bmw * -1;
    }
    if(bmw_depth > 0 && count_bmw == 1 ){
        finish = finish + "The BMW M4 GTS finishes fourth!" + "<br>";
        count_bmw = 0;
    }

    document.getElementById("log").innerHTML = finish;

    mat4.rotate(RotationMatrix_bmw, bmw_rot_speed, [rot_num_bmw, 0, 0]);
    mat4.multiply(mvMatrix, RotationMatrix_bmw);
    
    // Draw the BMW sphere with texture mapping
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bmwTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bmwVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bmwVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bmwVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, bmwVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bmwVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, bmwVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bmwVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, bmwVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    mvPopMatrix();
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    mvPushMatrix();
    mat4.identity(mvMatrix);
    benz_depth = benz_depth - benz_speed;

    mat4.translate(mvMatrix, [0, -0.3, benz_depth]);
    
    // Make sure the sphere turns around after going inwards a specified depth.
    // Change the rotation value and print out the statement when the object
    // finishes the race.

    if(benz_depth < -25){
        benz_speed = benz_speed * -1;
        rot_num_benz =  rot_num_benz * -1;
    }

    if(benz_depth > 0 && count_benz == 1 ){
        finish = finish + "The Mercedes Benz AMG GT-R comes in a close second!" + "<br>";
        count_benz = 0;
    }

    mat4.rotate(RotationMatrix_benz, benz_rot_speed, [rot_num_benz, 0, 0]);
    mat4.multiply(mvMatrix, RotationMatrix_benz);
    
    // Draw the Mercedes Benz sphere with texture mapping
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, benzTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, benzVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, benzVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, benzVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, benzVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, benzVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, benzVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, benzVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, benzVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    mvPopMatrix();
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    mvPushMatrix();
    mat4.identity(mvMatrix);
    tesla_depth = tesla_depth - tesla_speed;
    mat4.translate(mvMatrix, [0, -0.3, tesla_depth]);
    
    // Make sure the sphere turns around after going inwards a specified depth.
    // Change the rotation value and print out the statement when the object
    // finishes the race.
    
    if( tesla_depth < -25){
        tesla_speed = tesla_speed * -1;
        rot_num_tesla =  rot_num_tesla * -1;
    }

    if(tesla_depth > 0 && count_tesla == 1 ){
        finish = finish + "The electric Tesla Model S finishes last!" + "<br>";
        count_tesla = 0;
    }

    mat4.rotate(RotationMatrix_tesla, tesla_rot_speed, [rot_num_tesla, 0, 0]);
    mat4.multiply(mvMatrix, RotationMatrix_tesla);
    
    // Draw the Tesla sphere with texture mapping

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, teslaTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, teslaVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teslaVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, teslaVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, teslaVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, teslaVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teslaVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teslaVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, teslaVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    mvPopMatrix();
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    mvPushMatrix();
    mat4.identity(mvMatrix);
    porsche_depth = porsche_depth - porsche_speed;
    mat4.translate(mvMatrix, [0, -0.3, porsche_depth]);
    
    // Make sure the sphere turns around after going inwards a specified depth.
    // Change the rotation value and print out the statement when the object
    // finishes the race.

    if( porsche_depth < -25){
        porsche_speed = porsche_speed * -1;
        rot_num_porsche =  rot_num_porsche * -1;
    }

    if( porsche_depth > 0 && count_porsche == 1 ){
        finish = finish + "The Porsche 918 Spyder finishes in first!" + "<br>";
        count_porsche = 0;
    }

    mat4.rotate(RotationMatrix_porsche, porsche_rot_speed, [rot_num_porsche, 0, 0]);
    mat4.multiply(mvMatrix, RotationMatrix_porsche);
    
    // Draw the Porsche sphere with texture mapping
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, porscheTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, porscheVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, porscheVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, porscheVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, porscheVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, porscheVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, porscheVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, porscheVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, porscheVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    mvPopMatrix();
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    mvPushMatrix();
    mat4.identity(mvMatrix);
    maserati_depth = maserati_depth - maserati_speed;
    mat4.translate(mvMatrix, [0, -0.3, maserati_depth]);
    
    // Make sure the sphere turns around after going inwards a specified depth.
    // Change the rotation value and print out the statement when the object
    // finishes the race.
    
    if(maserati_depth < -25){
        maserati_speed = maserati_speed * -1;
        rot_num_maserati =  rot_num_maserati * -1;
    }

    if( maserati_depth > 0 && count_maserati == 1 ){
        finish = finish + "The Maserati MC12 comes in third!" + "<br>";
        count_maserati = 0;
    }

    mat4.rotate(RotationMatrix_maserati, maserati_rot_speed, [rot_num_maserati, 0, 0]);
    mat4.multiply(mvMatrix, RotationMatrix_maserati);
    
    // Draw the Maserati sphere with texture mapping

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, maseratiTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, maseratiVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, maseratiVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, maseratiVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, maseratiVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, maseratiVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, maseratiVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, maseratiVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, maseratiVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
    mvPopMatrix();
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
}

function render() {
    drawScene();
    requestAnimFrame(render);
}

function webGLStart() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    render();
}
