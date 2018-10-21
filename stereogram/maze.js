let width = 800;
let height = 400;
let fov = 1;
let wallHeight;
let plane0;
let depthCanvas;
let depthContext;
let depthData;
let depthPixels;
let player;
let pressedKeys = {};
let canvas;
let context;
let tileWidth = 128;
let tileHeight = 128;
let intensity = .25;
let tile;

function map0(x, y) {
    return plane0.getUint8(x + 64 * y);
}


function isBlocking(x, y) {
    return map0(x, y) <= 63;
}


function Player(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = 0.02;
    this.speed_a = 0.02;
    this.radius = 0.25;

    this.canMoveTo = function(x, y) {
        let r = this.radius;
        let fx = x % 1;
        x = ~~x;
        let fy = y % 1;
        y = ~~y;

        if (isBlocking(x, y)) return false;
        if (fx < r) {
            if (isBlocking(x- 1, y)) return false;
            if (fy < r && isBlocking(x - 1, y - 1)) return false;
            if (fy > 1 - r && isBlocking(x - 1, y + 1)) return false;
        }
        if (fx > 1 - r) {
            if (isBlocking(x + 1, y)) return false;
            if (fy < r && isBlocking(x + 1, y - 1)) return false;
            if (fy > 1 - r && isBlocking(x + 1, y + 1)) return false;
        }
        if (fy < r && isBlocking(x, y - 1)) return false;
        if (fy > 1 - r && isBlocking(x, y + 1)) return false;
        return true;
    };

    this.move = function(length) {
        let x = this.x + this.dx * length;
        let y = this.y + this.dy * length;
        if (this.canMoveTo(x, this.y)) {
            this.x = x;
        }
        if (this.canMoveTo(this.x, y)) {
            this.y = y;
        }
    };

    this.turn = function(alpha) {
        let dx = this.dx * Math.cos(alpha) - this.dy * Math.sin(alpha);
        this.dy = this.dx * Math.sin(alpha) + this.dy * Math.cos(alpha);
        this.dx = dx;
    };
}


function draw() {
    // update player position and direction
    if (pressedKeys["ArrowRight"]) { player.turn(player.speed_a) }
    if (pressedKeys["ArrowLeft"]) { player.turn(-player.speed_a) }
    if (pressedKeys["ArrowUp"]) { player.move(player.speed) }
    if (pressedKeys["ArrowDown"]) { player.move(-player.speed) }

    // draw walls visible game elements
    drawWalls();

    // draw to canvas
    depthContext.putImageData(depthData, 0, 0);
    makeStereogram(context, depthData);
    // call the function again on next frame
    requestAnimationFrame(draw);
}


function drawWalls() {
    for (let i = 0; i < width; i++) {
        // current column position on the camera plane
        let shift = fov * ((i << 1) - width) / width;
        // direction of the ray
        let rdx = player.dx - shift * player.dy;
        let rdy = player.dy + shift * player.dx;
        // direction in which the ray moves along each axis
        let stepx = rdx >= 0 ? 1 : -1;
        let stepy = rdy >= 0 ? 1 : -1;
        // take absolute values of ray direction
        rdx = stepx * rdx;
        rdy = stepy * rdy;
        // cell position of the ray on the map (starting from the player position)
        let cx = ~~player.x;
        let cy = ~~player.y;
        // remaining fractional distance from the ray position to the next cell (0 < rfx, rfy <= 1)
        let rfx = stepx > 0 ? 1 - (player.x % 1) : player.x % 1;
        if (rfx === 0) {
            rfx = 1;
            cx += stepx;
        }
        let rfy = stepy > 0 ? 1 - (player.y % 1) : player.y % 1;
        if (rfy === 0) {
            rfy = 1;
            cy += stepy;
        }

        // total time traveled by the ray
        let t = 0;
        // plane0 value of the cell visited by the ray
        let m0;

        while (true) {
            m0 = map0(cx, cy);
            if (m0 <= 63) {
                // hit a wall
                break;
            }
            // move to the next cell
            if (rfx * rdy <= rfy * rdx) {
                // move to next cell horizontally
                let dt = rfx / rdx;
                t += dt;
                rfx = 1;
                cx += stepx;
                rfy -= dt * rdy;
            } else {
                // move to next cell vertically
                let dt = rfy / rdy;
                t += dt;
                rfy = 1;
                cy += stepy;
                rfx -= dt * rdx;
            }
        }

        let h = wallHeight / (2 * t); // height of the line representing the wall on the current column

        let yi = Math.max(0, Math.ceil(height / 2 - h));
        // draw ceiling and floor
        let c;
        for (let j = 0; j <= yi; j++) {
            c = color(j);
            depthPixels.setUint32(4 * (i + width * j), c);
            depthPixels.setUint32(4 * (i + width * (height - 1 - j)), c);
        }
        // draw the wall
        // color = ((255 - yi) << 24) + 255;
        c = color(yi);
        for (let j = yi; j < height - 1 - yi; j++) {
            depthPixels.setUint32(4 * (i + width * j), c);
        }
    }
}


function color(y) {
    let c = ~~(255 * (300 - 2 * y) / 300);
    if (c < 0) {
        c = 0;
    }
    return (c << 24) | (c << 16) | (c << 8) | 0xFF;
}


function makeStereogram(context, depthData) {
    for (let i = 0; i < height; i += tileHeight) {
        context.drawImage(tile, 0, i);
        context.drawImage(tile, tileWidth, i);
    }

    let nbShift = 0;
    let depthBuffer = depthData.data;
    let imageData = context.getImageData(0, 0, width, height);
    let buffer = imageData.data;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let shift = ~~(depthBuffer[4 * (x + width * y)] * intensity) - tileWidth;
            if (shift !== -tileWidth) {
                nbShift += 1;
            }
            if (0 <= x + shift && x + shift < width) {
                buffer[4 * (x + width * y)] = buffer[4 * (x + shift + width * y)];
                buffer[4 * (x + width * y) + 1] = buffer[4 * (x + shift + width * y) + 1];
                buffer[4 * (x + width * y) + 2] = buffer[4 * (x + shift + width * y) + 2];
                buffer[4 * (x + width * y) + 3] = 255;
            }
        }
    }
    context.putImageData(imageData, 0, 0);
}


window.onload = function () {
    // prepare canvas
    depthCanvas = document.createElement("canvas");
    depthCanvas.width = width;
    depthCanvas.height = height;
    depthContext = depthCanvas.getContext("2d", {alpha: false});
    depthData = new ImageData(width, height);
    depthPixels = new DataView(depthData.data.buffer);
    document.body.appendChild(depthCanvas);

    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d", {alpha: false});
    document.body.appendChild(canvas);

    tile = new Image();
    tile.src = "tiles/camo.png";

    // prepare some variables
    wallHeight = width / (2 * fov);
    player = new Player(29.5, 57.5, 1, 0);

    // monitor key presses
    document.onkeydown = function (e) {
        pressedKeys[e.key] = true;
    };
    document.onkeyup = function (e) {
        pressedKeys[e.key] = false;
    };

    // load game files and start the drawing cycle
    let req = new XMLHttpRequest();
    req.onload = function() {
        plane0 = new DataView(this.response);
        draw();
    };
    req.responseType = "arraybuffer";
    req.open("GET", "maps/00.map");
    req.send();
};
