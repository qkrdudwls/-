"use strict";

let gl, program;
let stack = [];
let root;

let modelViewMatrix, projectionMatrix;
let uModelViewMatrix, uProjectionMatrix, uNormalMatrix;
let vNormal;

let eye = vec3(0.0, 0.3, 2.5);
let at = vec3(0.0, 0.1, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let sphereBuffer, cylinderBuffer;
let sphereIndexBuffer, cylinderIndexBuffer;
let sphereNormalBuffer, cylinderNormalBuffer;
let sphereData, cylinderData;

let texturedSphereData;
let texturedSphereBuffer, texturedSphereIndexBuffer, texturedSphereNormalBuffer, texturedSphereTexCoordBuffer;

let uTexture, uUseTexture, texture;
let groundBuffer, groundIndexBuffer, groundNormalBuffer;
let groundData;
let groundTexture;
let groundTexCoordBuffer;

let uLightPosition, uLightColor, uAmbientLight, uDiffuseStrength;

let helmetTexture, spacesuitTexture, metalTexture, glassTexture;
let plssTexture, chestControlTexture, bootTexture;

let lastTime = 0;
let currentEnvironment = 'earth';

window.groundOffsetZ = 0.0;

//camera 위치
const cameraStart = vec3(-5, 2, 5);
const cameraEnd = vec3(5, 2, 5);

function lerpVec3(a, b, t) {
    return vec3(
        a[0] * (1 - t) + b[0] * t,
        a[1] * (1 - t) + b[1] * t,
        a[2] * (1 - t) + b[2] * t
    );
}

function createNode(name, translation, render, sibling = null, child = null) {
    let node = {
        name: name,
        translation: translation,
        rotation: vec3(0.0, 0.0, 0.0),
        transform: mat4(),
        worldMatrix: mat4(),
        render: render,
        sibling: sibling,
        child: child
    }
    return node;
}

function buildTreeFromHierarchy(joints, hierarchy, render) {
    const nodes = {};

    for (let name in joints) {
        nodes[name] = createNode(name, vec3(0, 0, 0), render);
    }

    function setLocalTranslation(name, parentPos) {
        const globalPos = vec3(joints[name][0], joints[name][1], joints[name][2]);
        const localPos = subtract(globalPos, parentPos);

        nodes[name].translation = localPos;

        const children = hierarchy[name];
        if (children.length === 0) return;

        nodes[name].child = nodes[children[0]];
        for (let i = 0; i < children.length - 1; i++) {
            nodes[children[i]].sibling = nodes[children[i + 1]];
        }

        for (let child of children) {
            setLocalTranslation(child, globalPos);
        }
    }

    const hipsPos = vec3(joints["HIPS"][0], joints["HIPS"][1], joints["HIPS"][2]);
    nodes["HIPS"].translation = hipsPos;

    if (hierarchy["HIPS"].length > 0) {
        nodes["HIPS"].child = nodes[hierarchy["HIPS"][0]];

        for (let i = 0; i< hierarchy["HIPS"].length - 1; i++) {
            nodes[hierarchy["HIPS"][i]].sibling = nodes[hierarchy["HIPS"][i + 1]];
        }
    }

    for (let child of hierarchy["HIPS"]) {
        setLocalTranslation(child, hipsPos);
    }

    return nodes["HIPS"];
}

function traverse(root) {
    if (root === null) return;
    
    stack = [];
    stack.push({ node: root, parentMatrix: mat4(), parentNode: null });

    while (stack.length > 0) {
        const current = stack.pop();
        const node = current.node;
        const parentMatrix = current.parentMatrix;
        const parentNode = current.parentNode;

        if (!node) continue;

        const t = translate(node.translation[0], node.translation[1], node.translation[2]);
        const rx = rotate(node.rotation[0], vec3(1, 0, 0));
        const ry = rotate(node.rotation[1], vec3(0, 1, 0));
        const rz = rotate(node.rotation[2], vec3(0, 0, 1));

        node.transform = mult(t, mult(rz, mult(ry, rx)));
        node.worldMatrix = mult(parentMatrix, node.transform);

        renderJoint(node.worldMatrix, node.name);

        if (parentNode) {
            const fromVec = mult(parentMatrix, vec4(0, 0, 0, 1));
            const toVec = mult(node.worldMatrix, vec4(0, 0, 0, 1));
            renderBone(fromVec, toVec, parentNode.name, node.name);
        }

        if (node.sibling) {
            stack.push({ 
                node: node.sibling, 
                parentMatrix: parentMatrix, 
                parentNode: parentNode 
            });
        }

        if (node.child) {
            stack.push({ 
                node: node.child, 
                parentMatrix: node.worldMatrix, 
                parentNode: node 
            });
        }
    }
}

function initGround() {
    groundData = createGroundPlane(100.0, 100.0);

    groundBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundData.vertices), gl.STATIC_DRAW);

    groundNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundData.normals), gl.STATIC_DRAW);

    groundTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundData.texCoords), gl.STATIC_DRAW);

    groundIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(groundData.indices), gl.STATIC_DRAW);

    groundTexture = gl.createTexture();
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, groundTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    };
    image.src = "./images/earth.jpg";
}

function updateGroundTexture(imagePath) {
    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, groundTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    };
    image.src = imagePath;
}

function initTextures() {
    helmetTexture = gl.createTexture();
    createGoldVisorTexture(helmetTexture);

    spacesuitTexture = gl.createTexture();
    createSpaceSuitFabricTexture(spacesuitTexture);

    metalTexture = gl.createTexture();
    createMetalTexture(metalTexture);

    plssTexture = gl.createTexture();
    createPLSSTexture(plssTexture);

    chestControlTexture = gl.createTexture();
    createChestControlTexture(chestControlTexture);

    bootTexture = gl.createTexture();
    createSpaceBootTexture(bootTexture);
}

function createGoldVisorTexture(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.3, '#FFC000');
    gradient.addColorStop(0.6, '#FFB000');
    gradient.addColorStop(0.8, '#D4AF37');
    gradient.addColorStop(1, '#B8860B');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    ctx.globalCompositeOperation = 'screen';
    const highlight = ctx.createLinearGradient(0, 0, 512, 200);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, 512, 200);

    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 5; i++) {
        const y = i * 100 + 50;
        const curveGradient = ctx.createLinearGradient(0, y - 20, 0, y + 20);
        curveGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        curveGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        curveGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = curveGradient;
        ctx.fillRect(0, y - 20, 512, 40);
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createSpaceSuitFabricTexture(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 4) {
        for (let x = 0; x < 512; x += 4) {
            const intensity = 0.95 + Math.sin(x * 0.1) * 0.02 + Math.sin(y * 0.1) * 0.02;
            const color = Math.floor(245 * intensity);
            ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
            ctx.fillRect(x, y, 2, 2);
        }
    }

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 512; i += 8) {
        ctx.strokeStyle = '#E8E8E8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 3 + 1;
        const brightness = Math.random() * 20 + 235;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(x, y, size, size);
    }

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#D0D0D0';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 512);
    ctx.moveTo(384, 0);
    ctx.lineTo(384, 512);
    ctx.stroke();

    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 10 + 5;
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createMetalTexture(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#C5C5C5';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 512; i++) {
        const intensity = 0.8 + Math.sin(i * 0.05) * 0.15 + Math.random() * 0.1;
        const color = Math.floor(197 * intensity);
        ctx.strokeStyle = `rgb(${color}, ${color}, ${color})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 2 + 1;
        const brightness = Math.random() * 40 + 180;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(x, y, size, size);
    }

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#808080';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#808080';
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createPLSSTexture(texture) {
    // PLSS (Portable Life Support System) - backpack texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base white with slight blue tint (like actual PLSS)
    ctx.fillStyle = '#F8F8FF';
    ctx.fillRect(0, 0, 512, 512);

    // Add control panel areas
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(50, 100, 200, 150);
    ctx.fillRect(300, 200, 150, 100);

    // Add warning labels and text areas (simulated)
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(60, 110, 80, 20);
    ctx.fillRect(320, 210, 60, 15);

    // Add NASA logo area
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(400, 50, 80, 40);

    // Add control knobs and switches
    ctx.fillStyle = '#606060';
    for (let i = 0; i < 10; i++) {
        const x = 80 + (i % 3) * 40;
        const y = 140 + Math.floor(i / 3) * 30;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#606060';
    }

    // Add cooling lines texture
    ctx.strokeStyle = '#D0D0D0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(20, 50 + i * 60);
        ctx.lineTo(490, 50 + i * 60);
        ctx.stroke();
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createChestControlTexture(texture) {
    // DCM (Display and Control Module) chest control texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base dark panel
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 0, 256, 256);

    // Add main display area
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 20, 216, 80);

    // Add LED indicators
    const colors = ['#00FF00', '#FF0000', '#FFFF00', '#0000FF'];
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = colors[i % 4];
        ctx.beginPath();
        ctx.arc(30 + i * 25, 130, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Add control buttons
    ctx.fillStyle = '#808080';
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const x = 40 + col * 45;
            const y = 160 + row * 25;
            ctx.fillRect(x, y, 20, 15);
            
            // Add button highlight
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x + 1, y + 1, 18, 2);
            ctx.fillStyle = '#808080';
        }
    }

    // Add NASA text area
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText('NASA', 200, 40);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createSpaceBootTexture(texture) {
    // EMU boots texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base white boot color
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, 256, 256);

    // Add sole pattern
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 200, 256, 56);

    // Add tread pattern on sole
    ctx.fillStyle = '#606060';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            ctx.fillRect(10 + i * 30, 210 + j * 10, 20, 5);
        }
    }

    // Add boot reinforcement areas
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(20, 50, 216, 30);
    ctx.fillRect(50, 100, 156, 40);

    // Add lace/strap areas
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(80, 60 + i * 15);
        ctx.lineTo(176, 60 + i * 15);
        ctx.stroke();
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

window.onload = function init() {
    const canvas = document.getElementById("glCanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL is not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    uTexture = gl.getUniformLocation(program, "uTexture");
    uUseTexture = gl.getUniformLocation(program, "uUseTexture");

    uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");

    uLightPosition = gl.getUniformLocation(program, "uLightPosition");
    uLightColor = gl.getUniformLocation(program, "uLightColor");
    uAmbientLight = gl.getUniformLocation(program, "uAmbientLight");
    uDiffuseStrength = gl.getUniformLocation(program, "uDiffuseStrength");

        //camera
    document.getElementById("cameraSlider").addEventListener("input", (e) => {
        const t = parseFloat(e.target.value);
        eye = lerpVec3(cameraStart, cameraEnd, t);
        modelViewMatrix = lookAt(eye, at, up);
    });
    document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        const step = 0.1;

        // 카메라가 at 쪽을 향하는 단위 벡터
        const viewDir = normalize(subtract(at, eye));

        if (key === "m") {
            // 확대: 앞으로 전진
            eye = add(eye, scale(step, viewDir));
        } else if (key === "n") {
            // 축소: 뒤로 후퇴
            eye = subtract(eye, scale(step, viewDir));
        }
        modelViewMatrix = lookAt(eye, at, up);
    });

    gl.uniform3fv(uLightPosition, flatten(vec3(1.0, 2.0, 2.0)));
    gl.uniform3fv(uLightColor, flatten(vec3(1.0, 1.0, 1.0)));
    gl.uniform3fv(uAmbientLight, flatten(vec3(0.2, 0.2, 0.2)));
    gl.uniform1f(uDiffuseStrength, 0.8);

    sphereData = createSphere(0.05, 12, 12);
    cylinderData = createClosedCylinder(0.05, 0.05, 1.0, 8, 1);

    sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.vertices), gl.STATIC_DRAW);

    sphereNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.normals), gl.STATIC_DRAW);

    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereData.indices), gl.STATIC_DRAW);

    cylinderBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderData.vertices), gl.STATIC_DRAW);

    cylinderNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderData.normals), gl.STATIC_DRAW);

    cylinderIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinderData.indices), gl.STATIC_DRAW);

    initGround();
    initTextures();

    root = buildTreeFromHierarchy(JOINTS, hierarchy, renderJoint);

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(60, canvas.width / canvas.height, 0.1, 10.0);

    animationSystem.startAnimation("spaceWalk", null, false);

    render();
}

function renderJoint(worldMatrix, jointName) {
    gl.useProgram(program);

    let geometry, texture, scale = 1.0;
    let useCustomGeometry = false;

    switch(jointName) {
        case "HEAD":
            geometry = createAstronautHelmet(0.15);
            texture = helmetTexture;
            scale = 1.0;
            useCustomGeometry = true;
            break;
            
        case "SPINE":
        case "SPINE1":
        case "SPINE2":
            geometry = createSpacesuitTorso(0.4, 0.3, 0.25);
            texture = spacesuitTexture;
            scale = 1.0;
            useCustomGeometry = true;
            break;
            
        case "LEFTUPLEG":
        case "RIGHTUPLEG":
        case "LEFTLEG":
        case "RIGHTLEG":
            geometry = createSpacesuitLeg(0.1, 0.4);
            texture = spacesuitTexture;
            scale = 1.0;
            useCustomGeometry = true;
            break;
            
        case "LEFTFOOT":
        case "RIGHTFOOT":
            geometry = createSpaceBoot(0.15, 0.1, 0.25);
            texture = spacesuitTexture;
            scale = 1.0;
            useCustomGeometry = true;
            break;
            
        case "LEFTHAND":
        case "RIGHTHAND":
            geometry = createSpaceGlove(0.12);
            texture = spacesuitTexture;
            scale = 1.0;
            useCustomGeometry = true;
            break;
        case "LEFT_SHOULDER":
        case "RIGHT_SHOULDER":
        case "LEFT_FOREARM":
        case "RIGHT_FOREARM":
            geometry = sphereData;
            texture = spacesuitTexture;
            scale = 1.25;
            break;
        default:
            break;
    }

    if (useCustomGeometry) renderCustomGeometry(worldMatrix, geometry, texture, scale);
    else renderDefaultSphere(worldMatrix, scale);

    if (jointName === "SPINE2") renderBackPack(worldMatrix);
    if (jointName === "SPINE1") renderChestPanel(worldMatrix);
}

function renderCustomGeometry(worldMatrix, geometry, texture, scale) {
    gl.uniform1i(uUseTexture, 1);
    
    const mvMatrix = mult(modelViewMatrix, worldMatrix);
    const scaledMvMatrix = mult(mvMatrix, scalem(scale, scale, scale));
    
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(scaledMvMatrix));
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));
    
    const normalMatrix = transpose(inverse4(scaledMvMatrix));
    gl.uniformMatrix4fv(uNormalMatrix, false, flatten(normalMatrix));

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);

    if (geometry.texCoords) {
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.texCoords), gl.STATIC_DRAW);
        
        const vTexCoord = gl.getAttribLocation(program, "vTexCoord");
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoord);
    }

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uTexture, 0);
   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderBackPack(worldMatrix) {
    const backpackGeometry = createBackpack(0.3, 0.4, 0.15);
    const backpackMatrix = mult(worldMatrix, mult(translate(0, 0, -0.2), scalem(1, 1, 1)));
    renderCustomGeometry(backpackMatrix, backpackGeometry, plssTexture, 1.0);
}

function renderChestPanel(worldMatrix) {
    const panelGeometry = createChestPanel(0.2, 0.15, 0.05);
    const panelMatrix = mult(worldMatrix, mult(translate(0, -0.1, 0.15), scalem(1, 1, 1)));
    renderCustomGeometry(panelMatrix, panelGeometry, chestControlTexture, 1.0);
}

function renderDefaultSphere(worldMatrix, scale) {
    gl.uniform1i(uUseTexture, 0);
    
    const mvMatrix = mult(modelViewMatrix, worldMatrix);
    const scaledMvMatrix = mult(mvMatrix, scalem(scale, scale, scale));
    
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(scaledMvMatrix));
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));
    
    const normalMatrix = transpose(inverse4(scaledMvMatrix));
    gl.uniformMatrix4fv(uNormalMatrix, false, flatten(normalMatrix));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    const vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    if (vTexCoord !== -1) {
        gl.disableVertexAttribArray(vTexCoord);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderBone(from, to, parentName, childName) {
    gl.useProgram(program);
    gl.uniform1i(uUseTexture, 1);

    let radius = 0.05;
    
    if (parentName === "SPINE" || parentName === "SPINE1" || childName === "SPINE") {
        radius = 0.15;
    }
    else if (parentName.includes("LEG") || parentName.includes("UPLEG") || childName.includes("LEG") || childName.includes("UPLEG")) {
        radius = 0.09;
    }
    else if (parentName.includes("ARM") || childName.includes("ARM") || parentName === "NECK" || childName === "NECK") {
        radius = 0.08;
    }
    
    const customCylinder = createClosedCylinder(radius, radius, 1.0, 12, 1);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(customCylinder.vertices), gl.STATIC_DRAW);
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(customCylinder.normals), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(customCylinder.indices), gl.STATIC_DRAW);
    
    const cylinderMatrix = calculateCylinderMatrix(from, to);
    const mvMatrix = mult(modelViewMatrix, cylinderMatrix);
    
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));
    const normalMatrix = transpose(inverse4(mvMatrix));
    gl.uniformMatrix4fv(uNormalMatrix, false, flatten(normalMatrix));
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, spacesuitTexture);
    gl.uniform1i(uTexture, 0);
    
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    const vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    if (vTexCoord !== -1) gl.disableVertexAttribArray(vTexCoord);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, customCylinder.indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderGround() {
    gl.useProgram(program);
    gl.uniform1i(uUseTexture, 1);

    const mvMatrix = mult(modelViewMatrix, translate(0.0, -0.85, window.groundOffsetZ || 0.0));
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));
    const normalMatrix = transpose(inverse4(mvMatrix));
    gl.uniformMatrix4fv(uNormalMatrix, false, flatten(normalMatrix));

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, groundNormalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    const vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, groundTexCoordBuffer);
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.uniform1i(uTexture, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer);
    gl.drawElements(gl.TRIANGLES, groundData.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(uUseTexture, 0);
}

function render(time = 0) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const deltaTime = time - lastTime;
    lastTime = time;

    //const result = animationSystem.updateAnimation(deltaTime);
    //if (result) animationSystem.applyAnimationToTree(root, result.rotations, result.translations);

    const result = updateAnimations(deltaTime, root);


    renderGround();
    traverse(root);

    requestAnimationFrame(render);
}
