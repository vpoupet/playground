let sc = 4;

function setup() {
    let canvas = createCanvas(1000, 1000);
    canvas.parent('canvas_container');

    scale(sc);
    strokeWeight(1 / sc);
    noFill();

    let k = 1;  // incrément
    let n = 0;  // dernière valeur
    let m = 0;  // avant-dernière valeur
    let previousValues = new Set(); // ensemble des valeurs précédentes de la suite
    let angle = 0;
    while (k < 10000) {
        previousValues.add(n);
        m = n;
        if (n - k < 0 || previousValues.has(n - k)) {
            n += k;
        } else {
            n -= k;
        }

        arc((n + m) / 2, height / (2 * sc), k, k, angle, angle + PI);
        angle = PI - angle;
        k += 1;

    }
}

function draw() {
}

