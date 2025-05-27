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

function createBox(width, height, depth) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = [
        -w, -h,  d, 1.0,
         w, -h,  d, 1.0,
         w,  h,  d, 1.0,
        -w,  h,  d, 1.0,

        -w, -h, -d, 1.0,
        -w,  h, -d, 1.0,
         w,  h, -d, 1.0,
         w, -h, -d, 1.0,

        -w,  h, -d, 1.0,
        -w,  h,  d, 1.0,
         w,  h,  d, 1.0,
         w,  h, -d, 1.0,

        -w, -h, -d, 1.0,
         w, -h, -d, 1.0,
         w, -h,  d, 1.0,
        -w, -h,  d, 1.0,

         w, -h, -d, 1.0,
         w,  h, -d, 1.0,
         w,  h,  d, 1.0,
         w, -h,  d, 1.0,

        -w, -h, -d, 1.0,
        -w, -h,  d, 1.0,
        -w,  h,  d, 1.0,
        -w,  h, -d, 1.0
    ];

    const normals = [
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
        -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
    ];

    const indices = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9,10, 8,10,11,
       12,13,14, 12,14,15,
       16,17,18, 16,18,19,
       20,21,22, 20,22,23
    ];

    return {
        vertices: vertices,
        normals: normals,
        indices: indices
    };
}

function createRoundBox(width, height, depth, radius = 0.03, segments = 0) {
    const box = createBox(width - 2 * radius, height - 2 * radius, depth - 2 * radius);
    const corner = createSphere(radius, segments, segments);
    const parts = [box];

    const offsets = [-1, 1];
    for (let x of offsets) {
        for (let y of offsets) {
            for (let z of offsets) {
                const c = cloneGeometry(corner);
                translateGeometry(c, [
                    x * (width / 2 - radius),
                    y * (height / 2 - radius),
                    z * (depth / 2 - radius)
                ]);
                parts.push(c);
            }
        }
    }

    return mergeGeometries(...parts);
}

function createHelmet(radius = 0.12) {
    return createSphere(radius, 24, 24);
} 

function createEdge(width, height, depth) {
    return createRoundBox(width, height, depth, 0.02);
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

function createClosedCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments) {
    const cyl = createCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments);

    let vertices = [...cyl.vertices];
    let normals = [...cyl.normals];
    let indices = [...cyl.indices];

    const topCenterIndex = vertices.length / 4;
    vertices.push(0, height, 0, 1.0);
    normals.push(0, 1, 0);

    const bottomCenterIndex = topCenterIndex + 1;
    vertices.push(0, 0, 0, 1.0);
    normals.push(0, -1, 0);

    for (let i = 0; i < radialSegments; i++) {
        const curr = i;
        const next = (i + 1) % radialSegments;
        indices.push(topCenterIndex, curr, next);
    }

    const offset = (heightSegments) * (radialSegments + 1);
    for (let i = 0; i < radialSegments; i++) {
        const curr = offset + i;
        const next = offset + (i + 1) % radialSegments;
        indices.push(bottomCenterIndex, next, curr);
    }

    return {
        vertices: vertices,
        normals: normals,
        indices: indices
    };
}

function createTexturedSphere(radius, latBands, longBands) {
    let vertices = [];
    let normals = [];
    let texCoords = [];
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

            const u = long / longBands;
            const v = lat / latBands;
            texCoords.push(u);
            texCoords.push(v);
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
        texCoords: texCoords,
        indices: indices
    };
}

function createGroundPlane(width, depth) {
    const w = width / 2;
    const d = depth / 2;

    const vertices = [
        -w, 0.0, -d, 1.0,
         w, 0.0, -d, 1.0,
         w, 0.0,  d, 1.0,
        -w, 0.0,  d, 1.0
    ];

    const normals = [
        0, 1, 0,  0, 1, 0,
        0, 1, 0,  0, 1, 0
    ];

    const texCoords = [
        0, 0, 1, 0, 1, 1, 0, 1
    ];

    const indices = [0, 1, 2, 0, 2, 3];

    return {
        vertices,
        normals,
        texCoords,
        indices
    };
}

function createAstronautHelmet(radius = 0.15) {
    const helmet = createTexturedSphere(radius, 24, 24);
    return helmet;
}

function createBackpack(width = 0.3, height = 0.8, depth = 0.15) {
    return createRoundBox(width, height, depth, 0.02);
}

function createChestPanel(width = 0.2, height = 0.15, depth = 0.05) {
    return createRoundBox(width, height, depth, 0.01);
}

function createSpacesuitTorso(width = 0.4, height = 0.5, depth = 0.25) {
    return createRoundBox(width, height, depth, 0.03);
}

function createSpacesuitArm(radius = 0.08, length = 1.0) {
    return createClosedCylinder(radius, radius, length, 12, 4);
}

function createSpacesuitLeg(radius = 0.1, length = 1.0) {
    return createClosedCylinder(radius, radius, length, 12, 4);
}

function createSpaceGlove(radius = 0.12) {
    return createSphere(radius, 16, 16);
}

function createSpaceBoot(width = 0.15, height = 0.1, depth = 0.25) {
    return createRoundBox(width, height, depth, 0.02);
}

function cloneGeometry(geometry) {
    return {
        vertices: [...geometry.vertices],
        normals: [...geometry.normals],
        indices: [...geometry.indices],
        texCoords: geometry.texCoords ? [...geometry.texCoords] : undefined
    };
}

function translateGeometry(geometry, translation) {
    const [tx, ty, tz] = translation;
    
    for (let i = 0; i < geometry.vertices.length; i += 4) {
        geometry.vertices[i] += tx;
        geometry.vertices[i + 1] += ty;
        geometry.vertices[i + 2] += tz;
    }
    
    return geometry;
}

function mergeGeometries(...geometries) {
    const merged = {
        vertices: [],
        normals: [],
        indices: [],
        texCoords: []
    };
    
    let vertexOffset = 0;
    
    for (const geometry of geometries) {
        merged.vertices.push(...geometry.vertices);
        merged.normals.push(...geometry.normals);

        if (geometry.texCoords) {
            merged.texCoords.push(...geometry.texCoords);
        }

        const adjustedIndices = geometry.indices.map(index => index + vertexOffset);
        merged.indices.push(...adjustedIndices);

        vertexOffset += geometry.vertices.length / 4; 
    }
    
    if (merged.texCoords.length === 0) {
        delete merged.texCoords;
    }
    
    return merged;
}