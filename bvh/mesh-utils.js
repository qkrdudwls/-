function translateGeometry(geo, offset) {
    for (let i = 0; i < geo.vertices.length; i += 4) {
        geo.vertices[i + 0] += offset[0];
        geo.vertices[i + 1] += offset[1];
        geo.vertices[i + 2] += offset[2];
    }
}

function cloneGeometry(geo) {
    return {
        vertices: geo.vertices.slice(),
        normals: geo.normals.slice(),
        indices: geo.indices.slice()
    };
}

function mergeGeometries(...geos) {
    let vertices = [];
    let normals = [];
    let indices = [];
    let vertexOffset = 0;

    for (const geo of geos) {
        vertices.push(...geo.vertices);
        normals.push(...geo.normals);

        for (let idx of geo.indices) {
            indices.push(idx + vertexOffset);
        }

        vertexOffset += geo.vertices.length / 4;
    }

    return {
        vertices: vertices,
        normals: normals,
        indices: indices
    };
}