let nb_rows = 100;
let nb_cols = 100;
let p_x = 0;
let p_y = 0;
let perlin_factor = .1;

let max_speed = 50;

function setup() {
    let canvas = createCanvas(800, 600, WEBGL);
    canvas.parent('canvas_container');
    noFill();
    stroke(255);
    strokeWeight(.5);
}

function draw() {
    background(0);
    rotateX(PI/3);
    translate(-1000, -2*height, 0);
    scale(20);

    for (let y = 0 ; y <= nb_rows; y++) {
        beginShape(TRIANGLE_STRIP);
        for (let x = 0; x <= nb_cols; x++) {
            vertex(x, y, 10 * noise(perlin_factor * (x + p_x), perlin_factor * (y + p_y)));
            vertex(x, (y + 1), 10 * noise(perlin_factor * (x + p_x), perlin_factor * (y + 1 + p_y)));
        }
        endShape();
    }
    let speed_x = mouseX - width/2;
    let speed_y = mouseY - height/2;
    let norm = sqrt(speed_x * speed_x + speed_y * speed_y);
    if (norm > max_speed) {
        speed_x *= max_speed / norm;
        speed_y *= max_speed / norm;
    }
    p_x += .01 * speed_x;
    p_y += .01 * speed_y;
}