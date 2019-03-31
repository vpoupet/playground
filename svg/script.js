function connect_chain(points) {
    let sequence = [];
    let last_point = points.pop();
    sequence.push(last_point);
    while (points.length > 0) {
        points.sort((p1, p2) => vec3.distance(last_point, p2) - vec3.distance(last_point, p1));
        last_point = points.pop();
        sequence.push(last_point);
    }
    return sequence;
}

/**
 * Returns the weighted center of two 3D points
 *
 * @param p1 {number[]} coordinates of the first point (array of 3 numbers)
 * @param p2 {number[]} coordinates of the second point (array of 3 numbers)
 * @param alpha {number} weight of the first point (second point will have weight (1-alpha))
 * @returns {vec3} coordinates of the weighted center of the two points (array of 3 numbers)
 */
function weighted_center(p1, p2, alpha) {
    let x1 = vec3.scale(vec3.create(), p1, alpha);
    let x2 = vec3.scale(vec3.create(), p2, 1 - alpha);
    return vec3.add(x1, x1, x2);
}

class NormalPolyline3D extends Polyline3D {
    constructor(points, is_closed=false, normal=vec3.create()) {
        super(points, is_closed);
        this.normal = normal;
    }

    get_normal() {
        return this.parent_transform.apply_to(this.normal);
    }
}

class ParametrizedHexagonalFace extends NormalPolyline3D {
    constructor(vertices, normal) {
        super([], true, normal);
        this.vertices = vertices;
    }

    parameters_string(data) {
        let [a, b, c] = this.vertices;
        this.points = [
            weighted_center(a, b, data.alpha),
            weighted_center(b, a, data.alpha),
            weighted_center(b, c, data.alpha),
            weighted_center(c, b, data.alpha),
            weighted_center(c, a, data.alpha),
            weighted_center(a, c, data.alpha)];
        return super.parameters_string(data);
    }
}

class ParametrizedPentagonalFace extends NormalPolyline3D {
    constructor(vertex, neighbors) {
        super([], true, vertex);
        this.vertex = vertex;
        this.neighbors = neighbors;
    }

    parameters_string(data) {
        this.points = this.neighbors.map(p => weighted_center(this.vertex, p, data.alpha));
        return super.parameters_string(data);
    }
}

class Icosahedron {
    constructor(container) {
        this.container = container;
        this.time = 0;
        let scale = 150;
        this.img = new SVGNode(
            new SVG(4 * scale, 4 * scale),
            new Style({
                'stroke': 'black',
                'stroke-width': 5,
                'fill-opacity': .9,
                'stroke-linejoin': 'round',
                'stroke-linecap': 'round',
            }));

        let ref = new SVGNode(
            new Group(),
            new Style().translate(2 * scale, 2 * scale));
        this.img.add(ref);

        this.icosahedron = new SVGNode(
            new Group(),
            new Style({}, {'alpha': .5}).rotate_x(0).rotate_y(0));

        ref.add(this.icosahedron);

        let pentagon_faces_style = new Style({'fill': 'green'});
        let hexagon_faces_style = new Style({'fill': 'yellow'});

        let pentagon_faces_back = new SVGNode(new Group(), pentagon_faces_style);
        let pentagon_faces = new SVGNode(new Group(), pentagon_faces_style);
        let hexagon_faces_back = new SVGNode(new Group(), hexagon_faces_style);
        let hexagon_faces = new SVGNode(new Group(), hexagon_faces_style);
        this.icosahedron.add(pentagon_faces_back);
        this.icosahedron.add(hexagon_faces_back);
        this.icosahedron.add(pentagon_faces);
        this.icosahedron.add(hexagon_faces);

        let phi = (1 + Math.sqrt(5)) / 2;
        let vertices = [];
        let points = [
            vec3.fromValues(0, scale, scale * phi),
            vec3.fromValues(0, -scale, scale * phi),
            vec3.fromValues(0, scale, -scale * phi),
            vec3.fromValues(0, -scale, -scale * phi)];

        vertices.push(...points);
        vertices.push(...points.map(p => vec3.fromValues(p[1], p[2], p[0])));
        vertices.push(...points.map(p => vec3.fromValues(p[2], p[0], p[1])));

        // icosahedron adjacency matrix (neighbors are at distance 2)
        let graph_matrix = Array(12).fill(0).map(x => Array(12).fill(false));
        for (let i = 0; i < 12; i++) {
            for (let j = i + 1; j < 12; j++) {
                if (vec3.distance(vertices[i], vertices[j]) < 2.01 * scale) {
                    graph_matrix[i][j] = true;
                    graph_matrix[j][i] = true;
                }
            }
        }

        // make pentagon faces (one for each of the icosahedron vertices)
        for (let i = 0; i < 12; i++) {
            let neighbors = [];
            for (let j = 0; j < 12; j++) {
                if (graph_matrix[i][j]) { neighbors.push(vertices[j]); }
            }
            pentagon_faces.add(new ParametrizedPentagonalFace(vertices[i], connect_chain(neighbors)));
        }

        // make hexagon faces (one for each of the icosahedron faces)
        for (let i = 0; i < 12; i++) {
            for (let j = i + 1; j < 12; j++) {
                for (let k = j + 1; k < 12; k++) {
                    if (graph_matrix[i][j] && graph_matrix[j][k] && graph_matrix[k][i]) {
                        let normal = vec3.cross(
                            vec3.create(),
                            vec3.subtract(vec3.create(), vertices[j], vertices[i]),
                            vec3.subtract(vec3.create(), vertices[k], vertices[i]));
                        if (vec3.dot(normal, vertices[i]) < 0) { vec3.negate(normal, normal); }
                        hexagon_faces.add(new ParametrizedHexagonalFace([vertices[i], vertices[j], vertices[k]], normal));
                    }
                }
            }
        }
    }

    order_faces() {
        let pentagon_faces = [];
        let hexagon_faces = [];
        let pf_back = this.icosahedron.content[0];
        let hf_back = this.icosahedron.content[1];
        let pf_front = this.icosahedron.content[2];
        let hf_front = this.icosahedron.content[3];
        pentagon_faces.push(...pf_back.content);
        pentagon_faces.push(...pf_front.content);
        hexagon_faces.push(...hf_back.content);
        hexagon_faces.push(...hf_front.content);
        pf_back.content.length = 0;
        hf_back.content.length = 0;
        pf_front.content.length = 0;
        hf_front.content.length = 0;
        for (let face of pentagon_faces) {
            let t = face.tag;
            if (t.get_normal()[2] > 0) {
                pf_front.add(face);
            } else {
                pf_back.add(face);
            }
        }
        for (let face of hexagon_faces) {
            let t = face.tag;
            if (t.get_normal()[2] > 0) {
                hf_front.add(face);
            } else {
                hf_back.add(face);
            }
        }
    }

    update() {
        this.time += 1;
        let [rot_x, rot_y] = this.icosahedron.style.transform;
        rot_x.angle = .4 * this.time;
        rot_y.angle = .6 * this.time;
        let lambda = (Math.sin(.02 * this.time) + 1) / 2;
        this.icosahedron.style.data.alpha = 1 - (lambda / 2);

        this.img.propagate_data();
        this.img.propagate_transform3d();
        this.order_faces();

        this.container.innerHTML = this.img.svg();
        window.requestAnimationFrame(this.update.bind(this));
    }
}

window.onload = () => {
    new Icosahedron(document.getElementById("svg-container")).update();
};
