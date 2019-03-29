function connect_convex_polygon(points) {
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

class Tetrahedron {
    constructor(container) {
        this.container = container;

        let scale = 100;
        let p0 = vec3.fromValues(scale, 0, -scale / Math.sqrt(2));
        let p1 = vec3.fromValues(-scale, 0, -scale / Math.sqrt(2));
        let p2 = vec3.fromValues(0, scale, scale / Math.sqrt(2));
        let p3 = vec3.fromValues(0, -scale, scale / Math.sqrt(2));

        this.img = new SVGNode(new SVG(4 * scale, 4 * scale), new Style({
            'stroke-width': 5,
            'stroke': 'black',
            'fill-opacity': .5,
            'stroke-linejoin': 'round',
            'fill': 'lightgreen',
        }));
        let ref = new SVGNode(new Group(), new Style().translate(2 * scale, 2 * scale));
        this.img.add(ref);
        this.rotation_group = new SVGNode(new Group());
        ref.add(this.rotation_group);

        this.rotation_group.add(new Polyline3D([p0, p1, p2], true));
        this.rotation_group.add(new Polyline3D([p0, p1, p3], true));
        this.rotation_group.add(new Polyline3D([p0, p2, p3], true));
        this.rotation_group.add(new Polyline3D([p1, p2, p3], true));

        this.angle = 0;
    }

    update() {
        this.angle += 1;
        this.rotation_group.style.transform = [new RotateX(this.angle), new RotateY(2 * this.angle)];
        this.img.propagate_transform3d();
        this.container.innerHTML = this.img.svg();
        window.requestAnimationFrame(this.update.bind(this));
    }
}

class Icosahedron {
    constructor(container) {
        this.container = container;
        this.angle = 0;
        let scale = 100;
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

        this.icosahedron = new SVGNode(new Group());
        ref.add(this.icosahedron);

        let pentagon_faces_style = new Style({'fill': 'lightgreen'});
        let hexagon_faces_style = new Style({'fill': 'lightblue'});

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
            let pentagon_vertices = [];
            for (let j = 0; j < 12; j++) {
                if (graph_matrix[i][j]) {
                    pentagon_vertices.push(weighted_center(vertices[i], vertices[j], 2/3));
                }
            }
            pentagon_faces.add(new NormalPolyline3D(
                connect_convex_polygon(pentagon_vertices),
                true,
                vertices[i]));
        }

        // make hexagon faces (one for each of the icosahedron faces)
        for (let i = 0; i < 12; i++) {
            for (let j = i + 1; j < 12; j++) {
                for (let k = j + 1; k < 12; k++) {
                    if (graph_matrix[i][j] && graph_matrix[j][k] && graph_matrix[k][i]) {
                        let a = vertices[i];
                        let b = vertices[j];
                        let c = vertices[k];
                        let normal = vec3.cross(
                            vec3.create(),
                            vec3.subtract(vec3.create(), b, a),
                            vec3.subtract(vec3.create(), c, a));
                        if (vec3.dot(normal, a) < 0) { vec3.negate(normal, normal); }
                        hexagon_faces.add(new NormalPolyline3D([
                            weighted_center(a, b, 2/3),
                            weighted_center(b, a, 2/3),
                            weighted_center(b, c, 2/3),
                            weighted_center(c, b, 2/3),
                            weighted_center(c, a, 2/3),
                            weighted_center(a, c, 2/3)], true, normal));
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
                pf_front.add(t);
            } else {
                pf_back.add(t);
            }
        }
        for (let face of hexagon_faces) {
            let t = face.tag;
            if (t.get_normal()[2] > 0) {
                hf_front.add(t);
            } else {
                hf_back.add(t);
            }
        }
    }

    update() {
        this.angle += .2;
        this.icosahedron.style.transform = [new RotateX(2 * this.angle), new RotateY(3 * this.angle)];
        this.img.propagate_transform3d();
        this.order_faces();
        this.container.innerHTML = this.img.svg();
        window.requestAnimationFrame(this.update.bind(this));
    }
}

function make_rubiks_cube() {
    let img = new SVGNode(new SVG(500, 500));
    // repère de référence (pour recentrer l'image à la fin)
    let ref = new SVGNode(new Group(), new Style().translate(250, 250));

    let cube = new SVGNode(new Group(), new Style().rotate_y(-15).rotate_x(20));

    let sticker = new Rectangle(-45, -45, 90, 90, 10, 10);
    // une bande de 3 stickers
    let strip_content = [
        new SVGNode(new Rectangle(-50, -150, 100, 300), new Style({'fill': 'black'})),
        new SVGNode(sticker, new Style()),
        new SVGNode(sticker, new Style().translate(0, -100)),
        new SVGNode(sticker, new Style().translate(0, 100)),
    ];

    // face noire pour boucher les trous
    cube.add(new Rectangle(-150, -150, 300, 300), new Style().rotate_y(90).translate3d(-50, 0, 0));

    // les bandes de couleur sur le bloc principal du cube
    cube.add(new SVGNode(
        new Group(),
        new Style({'fill': 'red'}).translate3d(0, 0, -150),
        strip_content));
    cube.add(new SVGNode(
        new Group(),
        new Style({'fill': 'red'}).translate3d(100, 0, -150),
        strip_content));
    cube.add(new SVGNode(
        new Group(),
        new Style({'fill': 'green'}).translate3d(0, 0, -150).rotate_x(-90),
        strip_content));
    cube.add(new SVGNode(
        new Group(),
        new Style({'fill': 'green'}).translate3d(100, 0, -150).rotate_x(-90),
        strip_content));

    // la tranche qui est tournée par rapport au reste du cube
    let rotated_slice = new SVGNode(new Group(), new Style().rotate_x(30));
    rotated_slice.set_name("slice");

    // les bandes de couleur sur la tranche
    rotated_slice.add(new SVGNode(
        new Group(),
        new Style({'fill': 'red'}).translate3d(-100, 0, -150),
        strip_content));
    rotated_slice.add(new SVGNode(
        new Group(),
        new Style({'fill': 'green'}).translate3d(-100, 0, -150).rotate_x(-90),
        strip_content));
    rotated_slice.add(new SVGNode(
        new Group(),
        new Style({'fill': 'blue'}).translate3d(-100, 0, -150).rotate_y(90),
        strip_content));
    rotated_slice.add(new SVGNode(
        new Group(),
        new Style({'fill': 'blue'}).translate3d(0, 0, -150).rotate_y(90),
        strip_content));
    rotated_slice.add(new SVGNode(
        new Group(),
        new Style({'fill': 'blue'}).translate3d(100, 0, -150).rotate_y(90),
        strip_content));
    cube.add(rotated_slice);

    ref.add(cube);
    img.add(ref);

    img.propagate_transform3d();
    return img;
}

window.onload = () => {
    // new Tetrahedron(document.getElementById("svg-container")).update();
    new Icosahedron(document.getElementById("svg-container")).update();
};
