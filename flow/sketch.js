let perlin_factor = .025;
let time_increment = .01;
let dim_x = 400;
let dim_y = 400;
let time = 0;
let field_intensity = 2;
let particles = [];
let nb_particles = 100;
let particle_speed = 2;

function setup() {
    let canvas = createCanvas(dim_x, dim_y);
    canvas.parent('canvas_container');
    strokeWeight(0);
    fill(0, 0, 0, 64);
    reset();
}

function field(x, y) {
    let fx = field_intensity * (noise(x * perlin_factor, y * perlin_factor, time) - 0.5);
    let fy = field_intensity * (noise(x * perlin_factor, y * perlin_factor, time + 53) - 0.5);
    return createVector(fx, fy);
}

function draw() {
    // scale(zoom);
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.update();
    }

    time += time_increment;
}


function Particle() {
    this.pos = createVector(random(dim_x), random(dim_y));
    this.prev_pos = createVector(0, 0);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0);

    this.update = function () {
        this.vel.add(field(this.pos.x, this.pos.y));
        this.vel.limit(particle_speed);
        this.prev_pos.x = this.pos.x;
        this.prev_pos.y = this.pos.y;
        this.pos.add(this.vel);
        // line(this.prev_pos.x, this.prev_pos.y, this.pos.x, this.pos.y);
        this.pos.x %= dim_x;
        this.pos.x += dim_x;
        this.pos.x %= dim_x;
        this.pos.y %= dim_y;
        this.pos.y += dim_y;
        this.pos.y %= dim_y;
        this.acc.mult(0);
        ellipse(this.pos.x, this.pos.y, 1);
    }
}

function reset() {
    background(255);
    for (let i = 0; i < nb_particles; i++) {
        particles[i] = new Particle();
    }
}