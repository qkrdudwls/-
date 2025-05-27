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

let lastTime = 0;
let currentEnvironment = 'earth';

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
    groundData = createGroundPlane(10.0, 10.0);

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
    image.src = "./images/venus.jpg";
}

function initTextures() {
    helmetTexture = gl.createTexture();
    const helmetImage = new Image();
    helmetImage.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, helmetTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, helmetImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    createGoldVisorTexture(helmetTexture);

    spacesuitTexture = gl.createTexture();
    createSpaceSuitFabricTexture(spacesuitTexture);

    metalTexture = gl.createTexture();
    createMetalTexture(metalTexture);
}

function createGoldVisorTexture(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF8C00');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, 256, 128);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createSpaceSuitFabricTexture(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(240, 240, 240, ${Math.random() * 0.3})`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createMetalTexture(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.5, '#808080');
    gradient.addColorStop(1, '#404040');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

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
    renderCustomGeometry(backpackMatrix, backpackGeometry, metalTexture, 1.0);
}

function renderChestPanel(worldMatrix) {
    const panelGeometry = createChestPanel(0.2, 0.15, 0.05);
    const panelMatrix = mult(worldMatrix, mult(translate(0, -0.1, 0.15), scalem(1, 1, 1)));
    renderCustomGeometry(panelMatrix, panelGeometry, metalTexture, 1.0);
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

    const mvMatrix = mult(modelViewMatrix, translate(0.0, -0.85, 0.0));
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

    const result = animationSystem.updateAnimation(deltaTime);
    if (result) animationSystem.applyAnimationToTree(root, result.rotations, result.translations);

    renderGround();
    traverse(root);

    requestAnimationFrame(render);
}