"use strict";

function createSphere(radius, latBands, longBands) {
    let vertices = [];
    let normals = [];
    let indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
        const theta = lat * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let long = 0; long <= longBands; long++) {
            const phi = long * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            vertices.push(radius * x);
            vertices.push(radius * y);
            vertices.push(radius * z);
            vertices.push(1.0);

            normals.push(x);
            normals.push(y);
            normals.push(z);
        }
    }
    
    for (let lat = 0; lat < latBands; lat++) {
        for (let long = 0; long < longBands; long++) {
            const first = (lat * (longBands + 1)) + long;
            const second = first + longBands + 1;

            indices.push(first);
            indices.push(second);
            indices.push(first + 1);

            indices.push(second);
            indices.push(second + 1);
            indices.push(first + 1);
        }
    }

    return {
        vertices: vertices,
        normals: normals,
        indices: indices
    };
}

function createCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments) {
    let vertices = [];
    let normals = [];
    let indices = [];

    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const radius = v * (radiusBottom - radiusTop) + radiusTop;
        const currY = v * height;

        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const theta = u * Math.PI * 2;

            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            vertices.push(radius * cosTheta);
            vertices.push(currY);
            vertices.push(radius * sinTheta);
            vertices.push(1.0);

            const nx = cosTheta;
            const ny = 0;
            const nz = sinTheta;

            normals.push(nx);
            normals.push(ny);
            normals.push(nz);
        }
    }

    const ringVertexCount = radialSegments + 1;

    for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < radialSegments; x++) {
            const a = y * ringVertexCount + x;
            const b = a + ringVertexCount;
            const c = a + 1;
            const d = b + 1;

            indices.push(a);
            indices.push(b);
            indices.push(c);

            indices.push(c);
            indices.push(b);
            indices.push(d);
        }
    }

    return {
        vertices: vertices,
        normals: normals,
        indices: indices
    };
}

function calculateCylinderMatrix(from, to) {
    const fromPoint = from.length === 4 ? vec3(from[0], from[1], from[2]) : vec3(from[0], from[1], from[2]);
    const toPoint = to.length === 4 ? vec3(to[0], to[1], to[2]) : vec3(to[0], to[1], to[2]);
    
    const dirVec = subtract(toPoint, fromPoint);
    
    const cylinderLength = length(dirVec);
    
    if (cylinderLength < 0.00001) {
        return translate(fromPoint[0], fromPoint[1], fromPoint[2]);
    }
    
    const dir = normalize(dirVec);
    const upVector = vec3(0, 1, 0);
    
    if (Math.abs(dir[0]) < 0.000001 && Math.abs(dir[2]) < 0.000001) {
        const translationMatrix = translate(fromPoint[0], fromPoint[1], fromPoint[2]);
        const scaleMatrix = scalem(1.0, cylinderLength, 1.0);
        const rotationMatrix = dir[1] > 0 ? mat4() : rotate(180, vec3(1, 0, 0));
        return mult(translationMatrix, mult(rotationMatrix, scaleMatrix));
    }
    
    let rotAxis = cross(upVector, dir);

    if (length(rotAxis) < 0.000001) {
        rotAxis = vec3(1, 0, 0);
    } else {
        rotAxis = normalize(rotAxis);
    }

    const dotProduct = dot(upVector, dir);
    const rotAngle = Math.acos(Math.max(-1, Math.min(1, dotProduct))) * 180 / Math.PI;

    const translationMatrix = translate(fromPoint[0], fromPoint[1], fromPoint[2]);
    const rotationMatrix = rotate(rotAngle, rotAxis);
    const scaleMatrix = scalem(1.0, cylinderLength, 1.0);

    return mult(translationMatrix, mult(rotationMatrix, scaleMatrix));
}