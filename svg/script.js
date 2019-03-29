let tetrahedron;

class Tetrahedron {
    constructor(scale) {
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
        this.rotation_group.transform = [new RotateX(this.angle), new RotateY(2 * this.angle)];
        this.img.propagate_transform3d();
        document.getElementById("svg-container").innerHTML = this.img.svg();
        window.requestAnimationFrame(tetrahedron.update.bind(tetrahedron));
    }
}


window.onload = () => {
    tetrahedron = new Tetrahedron(100);
    tetrahedron.update();
};

function make_circles() {
    let img = new SVGNode(new SVG(1000, 1000));
    let ref = new SVGNode(new Group(), new Style().translate(500, 500));
    img.add(ref);

    let circle = new Circle(0, 0, 300);
    let s = new Style().translate(0, 150);

    let circles = new SVGNode(
        new Group(),
        new Style({'fill-opacity': .5, 'stroke-width': 10, 'stroke': 'black'}));
    ref.add(circles);

    circles.add(circle, s.copy().set('fill', 'red'));
    circles.add(circle, s.copy().set('fill', 'green').rotate(120));
    circles.add(circle, s.copy().set('fill', 'blue').rotate(-120));

    return img;
}

function make_cube() {
    let img = new SVGNode(new SVG(1000, 1000));
    let ref = new SVGNode(new Group(), new Style().scale(1, -1).translate(500, 500));

    // a cube face
    let cube_face = new SVGNode(new Group(), new Style().translate(0, -300).scale(0.8660254038, 1).skew_y(30));
    // black rectangle as background of the face
    cube_face.add(new Rectangle(0, 0, 300, 300), new Style({'fill': 'black'}));
    // stickers
    cube_face.add(new Rectangle(5, 5, 90, 90, 10, 10));
    cube_face.add(new Rectangle(5, 105, 90, 90, 10, 10));
    cube_face.add(new Rectangle(5, 205, 90, 90, 10, 10));
    cube_face.add(new Rectangle(105, 5, 90, 90, 10, 10));
    cube_face.add(new Rectangle(105, 105, 90, 90, 10, 10));
    cube_face.add(new Rectangle(105, 205, 90, 90, 10, 10));
    cube_face.add(new Rectangle(205, 5, 90, 90, 10, 10));
    cube_face.add(new Rectangle(205, 105, 90, 90, 10, 10));
    cube_face.add(new Rectangle(205, 205, 90, 90, 10, 10));

    // right face
    let red_face = new SVGNode(new Group(), new Style({'fill': 'red'}));
    red_face.add(cube_face);
    ref.add(red_face);

    // top face
    let blue_face = new SVGNode(new Group(), new Style({'fill': 'blue'}).rotate(120));
    blue_face.add(cube_face);
    ref.add(blue_face);

    // left face
    let green_face = new SVGNode(new Group(), new Style({'fill': 'green'}).rotate(-120));
    green_face.add(cube_face);
    ref.add(green_face);

    img.add(ref);
    return img;
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

function make_tetrahedron() {
    return img;
}
