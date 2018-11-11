let length = 300;
let mouseX;
let mouseY;
let cube;

class Sticker {
    constructor(face, shiftX, shiftY) {
        this.element = document.createElement("div");
        this.element.classList.add("sticker");
        this.element.classList.add(face);
        this.matrix = mat4.create();
        mat4.translate(this.matrix, this.matrix, [shiftX * length / 3, shiftY * length / 3, length / 2]);
        this.updateElement();
    }

    rotate(angle, axis) {
        let rotation = mat4.fromRotation(mat4.create(), angle, axis);
        mat4.multiply(this.matrix, rotation, this.matrix);
        this.matrix = this.matrix.map(x => Math.round(x));
        this.updateElement();
    }

    updateElement() {
        this.element.style.transform = "matrix3d(" + this.matrix + ")";
    }

    getCoordinates() {
        let t = vec3.create();
        mat4.getTranslation(t, this.matrix);
        for (let i = 0; i < 3; i++) {
            if (t[i] >= length / 3) {
                t[i] = 1;
            } else if (t[i] <= -length / 3) {
                t[i] = -1;
            } else {
                t[i] = 0;
            }
        }
        return t;
    }

    getTranslation() {
        let t = vec3.create();
        mat4.getTranslation(t, this.matrix);
        return t;
    }
}

class Cube {
    constructor() {
        this.element = document.createElement("div");
        this.element.classList.add("cube");
        this.stickers = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let s;
                s = new Sticker("face-front", i - 1, j - 1);
                this.stickers.push(s);
                this.element.appendChild(s.element);
                s = new Sticker("face-back", i - 1, j - 1);
                this.stickers.push(s);
                s.rotate(Math.PI, [0, 1, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-right", i - 1, j - 1);
                this.stickers.push(s);
                s.rotate(Math.PI / 2, [0, 1, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-left", i - 1, j - 1);
                this.stickers.push(s);
                s.rotate(-Math.PI / 2, [0, 1, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-top", i - 1, j - 1);
                this.stickers.push(s);
                s.rotate(Math.PI / 2, [1, 0, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-bottom", i - 1, j - 1);
                this.stickers.push(s);
                s.rotate(-Math.PI / 2, [1, 0, 0]);
                this.element.appendChild(s.element);
            }
        }
    }

    sticker(element) {
        for (let i = 0; i < this.stickers.length; i++) {
            if (this.stickers[i].element === element) {
                return this.stickers[i];
            }
        }
    }

    move(axis, coordinates, direction) {
        vec3.multiply(coordinates, coordinates, axis);
        for (let i = 0; i < this.stickers.length; i++) {
            let s = this.stickers[i];
            let t = s.getCoordinates();
            vec3.multiply(t, t, axis);
            if (vec3.equals(coordinates, t)) {
                s.rotate(direction * Math.PI/2, axis);
            }
        }
    }

    shuffle(n) {
        for (let i = 0; i < n; i++) {
            let axisIndex = Math.floor(Math.random() * 3);
            let axisDirection = Math.floor(Math.random() * 2);
            let rotationDirection = Math.floor(Math.random() * 2);
            let axis = [0, 0, 0];
            axis[axisIndex] = 1;
            let coordinates = [0, 0, 0];
            coordinates[axisIndex] = 2 * axisDirection - 1;
            this.move(axis, coordinates, 2 * rotationDirection - 1);
        }
    }
}

function handleKey(event) {
    switch (event.key) {
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowUp":
        case "ArrowDown":
            event.preventDefault();
            let element = document.elementFromPoint(mouseX, mouseY);
            if (element.classList.contains("sticker")) {
                let s = cube.sticker(element);
                let t = s.getTranslation();
                switch(event.key) {
                    case "ArrowRight":
                        if (Math.abs(t[1]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), 1);
                        } else {
                            cube.move([0, 1, 0], s.getCoordinates(), 1);
                        }
                        break;
                    case "ArrowLeft":
                        if (Math.abs(t[1]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), -1);
                        } else {
                            cube.move([0, 1, 0], s.getCoordinates(), -1);
                        }
                        break;
                    case "ArrowUp":
                        if (Math.abs(t[0]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), -1);
                        } else {
                            cube.move([1, 0, 0], s.getCoordinates(), 1);
                        }
                        break;
                    case "ArrowDown":
                        if (Math.abs(t[0]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), 1);
                        } else {
                            cube.move([1, 0, 0], s.getCoordinates(), -1);
                        }
                        break;
                }
            } else {

            }
    }
}

window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowUp":
        case "ArrowDown":
            event.preventDefault();
            let element = document.elementFromPoint(mouseX, mouseY);
            if (element.classList.contains("sticker")) {
                let s = cube.sticker(element);
                let t = s.getTranslation();
                switch (event.key) {
                    case "ArrowRight":
                        if (Math.abs(t[1]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), 1);
                        } else {
                            cube.move([0, 1, 0], s.getCoordinates(), 1);
                        }
                        break;
                    case "ArrowLeft":
                        if (Math.abs(t[1]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), -1);
                        } else {
                            cube.move([0, 1, 0], s.getCoordinates(), -1);
                        }
                        break;
                    case "ArrowUp":
                        if (Math.abs(t[0]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), -1);
                        } else {
                            cube.move([1, 0, 0], s.getCoordinates(), 1);
                        }
                        break;
                    case "ArrowDown":
                        if (Math.abs(t[0]) >= length / 2) {
                            cube.move([0, 0, 1], s.getCoordinates(), 1);
                        } else {
                            cube.move([1, 0, 0], s.getCoordinates(), -1);
                        }
                        break;
                }
            }
    }
});

window.addEventListener('mousemove', function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

window.onload = function() {
    cube = new Cube();
    document.getElementById("scene").appendChild(cube.element);
};