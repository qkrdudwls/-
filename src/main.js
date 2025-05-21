"use strict";

let gl, program;
let stack = [];
let root;

let modelViewMatrix, projectionMatrix;
let uModelViewMatrix, uProjectionMatrix, uNormalMatrix;
let vNormal;

let sphereBuffer, cylinderBuffer;
let sphereIndexBuffer, cylinderIndexBuffer;
let sphereNormalBuffer, cylinderNormalBuffer;
let sphereData, cylinderData;

let uLightPosition, uLightColor, uAmbientLight, uDiffuseStrength;

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

        renderJoint(node.worldMatrix);

        if (parentNode) {
            const fromVec = mult(parentMatrix, vec4(0, 0, 0, 1));
            const toVec = mult(node.worldMatrix, vec4(0, 0, 0, 1));
            renderBone(fromVec, toVec);
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

function animateTree(node, time) {
    let angle = Math.sin(time * 0.002) * 30;

    if (node.name === "LEFT_ARM") node.rotation[2] = angle;
    if (node.name === "RIGHT_ARM") node.rotation[2] = -angle;

    if (node.child) animateTree(node.child, time);
    if (node.sibling) animateTree(node.sibling, time);
}

window.onload = function init() {
    const canvas = document.getElementById("glCanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL is not available") };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

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

    sphereData = createSphere(0.015, 12, 12);

    sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.vertices), gl.STATIC_DRAW);

    sphereNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.normals), gl.STATIC_DRAW);

    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereData.indices), gl.STATIC_DRAW);

    cylinderData = createCylinder(0.008, 0.008, 1.0, 8, 1);

    cylinderBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderData.vertices), gl.STATIC_DRAW);

    cylinderNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderData.normals), gl.STATIC_DRAW);

    cylinderIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinderData.indices), gl.STATIC_DRAW);

    root = buildTreeFromHierarchy(JOINTS, hierarchy, renderJoint);

    modelViewMatrix = lookAt(vec3(0.0, 0.3, 1.5), vec3(0.0, 0.1, 0.0), vec3(0.0, 1.0, 0.0));
    projectionMatrix = perspective(60, canvas.width / canvas.height, 0.1, 10.0);

    render();
}

function renderJoint(worldMatrix) {
    gl.useProgram(program);

    const mvMatrix = mult(modelViewMatrix, worldMatrix);
    const scale = 1.0;
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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderBone(from, to) {
    gl.useProgram(program);

    try {
        const cylinderMatrix = calculateCylinderMatrix(from, to);
        const mvMatrix = mult(modelViewMatrix, cylinderMatrix);

        gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(mvMatrix));
        gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));

        const normalMatrix = transpose(inverse4(mvMatrix));
        gl.uniformMatrix4fv(uNormalMatrix, false, flatten(normalMatrix));

        gl.bindBuffer(gl.ARRAY_BUFFER, cylinderBuffer);
        const vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, cylinderNormalBuffer);
        const vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderIndexBuffer);
        gl.drawElements(gl.TRIANGLES, cylinderData.indices.length, gl.UNSIGNED_SHORT, 0);
    } catch (error) {
        console.error("Error rendering bone:", error);
    }
}

function render(time = 0) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    animateTree(root, time);

    traverse(root);

    requestAnimationFrame(render);
}