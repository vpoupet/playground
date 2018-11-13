/**
 * Cube side length in px (should be an integer multiple of 6)
 * @type {number}
 */
let length = 300;
/**
 * X-coordinate of the mouse (tracked automatically)
 * @type {number}
 */
let mouseX;
/**
 * Y-coordinate of the mouse (tracked automatically)
 * @type {number}
 */
let mouseY;
/**
 * Cube instance
 * @type {Cube}
 */
let cube;

/**
 * Representation of a cube's sticker face
 *
 * Attributes:
 * - element {HTMLElement} the div representing the sticker
 * - matrix {mat4} 4x4 matrix representing the transformation applied to the sticker
 */
class Sticker {
    /**
     * Constructor
     *
     * @param face {string} description of the face the sticker is on ("face-front", "face-back", "face-top",
     * "face-bottom", "face-right" or "face-left")
     * @param shiftX {number} X-translation of the sticker on its face (-1, 0 or 1)
     * @param shiftY {number} Y-translation of the sticker on its face (-1, 0 or 1)
     */
    constructor(face, shiftX, shiftY) {
        // stickers are black square divs, containing an inner colored square
        this.element = document.createElement("div");
        this.element.classList.add("sticker");
        this.element.classList.add(face);
        let coloredSquare = document.createElement("div");
        coloredSquare.classList.add("color-square");
        this.element.appendChild(coloredSquare);
        // the matrix represents the transformation of the sticker (rotation and translation)
        this.matrix = mat4.create();
        // move the sticker from the center of the cube to its position on the "front face" (it will be rotated to the
        // correct face later
        mat4.translate(this.matrix, this.matrix, [shiftX * length / 3, shiftY * length / 3, length / 2]);
        this.updateElement();
    }

    /**
     * Rotate the sticker around the cube
     *
     * @param angle {number} angle of rotation in randians
     * @param axis {number[]} triple describing the rotation axis
     */
    rotate(angle, axis) {
        let rotation = mat4.fromRotation(mat4.create(), angle, axis);
        mat4.multiply(this.matrix, rotation, this.matrix);
        // because the regular rotations are all multiples of PI/2 around the main axes, coordinates should
        // always be integers and are rounded to maintain precision
        this.matrix = this.matrix.map(x => Math.round(x));
        this.updateElement();
    }

    /**
     * Updates the transformation on the HTML element.
     * (should be called whenever the transformation matrix is updated)
     */
    updateElement() {
        this.element.style.transform = "matrix3d(" + this.matrix + ")";
    }

    /**
     * Returns the coordinates of the sticker on the cube
     *
     * @returns {vec3} a triple of coordinates in {-1, 0, 1} describing the small cube on which the sticker is
     */
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

    /**
     * Returns the current translation of the sticker.
     *
     * @returns {vec3}
     */
    getTranslation() {
        let t = vec3.create();
        mat4.getTranslation(t, this.matrix);
        return t;
    }
}


/**
 * Representation of a Rubik's cube
 *
 * Attributes:
 * - isLocked {boolean} whether the cube is currently performing a rotation
 * - element {HTMLElement} div representing the Cube on the web page
 * - stickers {Sticker[]} list of all stickers on the cube
 */
class Cube {
    /**
     * Constructor function
     */
    constructor() {
        this.element = document.createElement("div");
        this.element.classList.add("cube");
        // create all the stickers on the cube (9 for each face)
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
        // add logo on central sticker of front face
        this.stickers.forEach(s => {
            let c = s.getCoordinates();
            if (c[0] === 0 && c[1] === 0 && c[2] === 1) {
                s.element.classList.add("logo");
            }
        });
        this.isLocked = false;
    }

    /**
     * Returns the sticker containing a given HTML element, if any
     *
     * @param element {HTMLElement} the element that is part of the div representing a Sticker
     * @returns {Sticker} the Sticker containing the element, or null is the element is not part of a Sticker
     */
    getSticker(element) {
        // get the closest parent with class "sticker" (if any)
        element = element.closest('.sticker');
        if (element) {
            // find the Sticker corresponding to the located element
            for (let i = 0; i < this.stickers.length; i++) {
                if (this.stickers[i].element === element) {
                    return this.stickers[i];
                }
            }
        }
        return null;
    }

    /**
     * Rotate a slice of the cube
     *
     * @param axis {number[]} triple describing the axis of rotation (should be in {-1, 0, 1}^3 with only one
     * non-zero value)
     * @param coordinates {number[]} triple of coordinates of a small cube (in {-1, 0, 1}^3). The designated cube
     * defines the slice that will be rotated
     * @param direction {number} direction of the rotation (1 or -1)
     */
    move(axis, coordinates, direction) {
        // do nothing if cube is already performing a rotation
        if (this.isLocked) { return; }

        // lock the cube until end of rotation
        this.isLocked = true;

        // extract the coordinate that corresponds to the rotation axis
        vec3.multiply(coordinates, coordinates, axis);

        // To avoid graphical glitches that appear if the stickers are rotated individually, they are grouped in a
        // single element, rotate the element as a whole in an animation, then extract the stickers and rotate them to
        // their final position instantly.
        let face = [];  // list of stickers to rotate
        let rotationElement = document.createElement("div");    // div containing the sticker elements
        this.element.appendChild(rotationElement);
        rotationElement.classList.add("rotation");

        // add all stickers that should be rotated
        for (let i = 0; i < this.stickers.length; i++) {
            let s = this.stickers[i];
            let t = s.getCoordinates();
            vec3.multiply(t, t, axis);
            if (vec3.equals(coordinates, t)) {
                face.push(s);
                rotationElement.appendChild(s.element);
            }
        }

        // callback when rotation animation finishes (all stickers are removed from the face, and rotated to their
        // final position (not animated)
        rotationElement.addEventListener('transitionend', function() {
            for (let i = 0; i < face.length; i++) {
                this.element.appendChild(face[i].element);
                face[i].rotate(direction * Math.PI/2, axis);
            }
            rotationElement.remove();
            this.isLocked = false;  // unlock the cube after the rotation animation
        }.bind(this), false);

        // the rotation is called asynchronously otherwise it isn't animated
        setTimeout(function() {
            rotationElement.style.transform = `rotate3d(${axis[0]}, ${axis[1]}, ${axis[2]}, ${90 * direction}deg)`;
        }, 0);
    }

    /**
     * Rotate a slice of the cube. This function is similar to the `move` function, but it rotates the Stickers
     * directly so there is no animation (and no need to group the stickers as a face)
     *
     * @param axis {number[]} triple describing the axis of rotation (should be in {-1, 0, 1}^3 with only one
     * non-zero value)
     * @param coordinates {number[]} triple of coordinates of a small cube (in {-1, 0, 1}^3). The designated cube
     * defines the slice that will be rotated
     * @param direction {number} direction of the rotation (1 or -1)
     */
    fastMove(axis, coordinates, direction) {
        // do nothing if cube is already performing a rotation
        if (this.isLocked) { return; }

        // extract the coordinate that corresponds to the rotation axis
        vec3.multiply(coordinates, coordinates, axis);

        // add all stickers that should be rotated
        for (let i = 0; i < this.stickers.length; i++) {
            let s = this.stickers[i];
            let t = s.getCoordinates();
            vec3.multiply(t, t, axis);
            if (vec3.equals(coordinates, t)) {
                s.rotate(direction * Math.PI/2, axis);
            }
        }
    }

    /**
     * Rotate the whole cube.
     *
     * @param axis {number[]} triple of coordinates to describe the axis of the rotation
     * @param direction {number} value indicating the direction of the rotation (1 or -1)
     */
    rotate(axis, direction) {
        // do nothing if cube is already performing a rotation
        if (this.isLocked) { return; }

        // lock the cube until end of rotation
        this.isLocked = true;

        // To avoid graphical glitches that appear if the stickers are rotated individually, they are grouped in a
        // single element, rotate the element as a whole in an animation, then extract the stickers and rotate them to
        // their final position instantly.
        let rotationElement = document.createElement("div");    // div containing the sticker elements
        this.element.appendChild(rotationElement);
        rotationElement.classList.add("rotation");

        // add all stickers
        for (let i = 0; i < this.stickers.length; i++) {
            rotationElement.appendChild(this.stickers[i].element);
        }

        // callback when rotation animation finishes (all stickers are removed from the face, and rotated to their
        // final position (not animated)
        rotationElement.addEventListener('transitionend', function() {
            for (let i = 0; i < this.stickers.length; i++) {
                this.element.appendChild(this.stickers[i].element);
                this.stickers[i].rotate(direction * Math.PI/2, axis);
            }
            rotationElement.remove();
            this.isLocked = false;  // unlock the cube after the rotation animation
        }.bind(this), false);

        // the rotation is called asynchronously otherwise it isn't animated
        setTimeout(function() {
            rotationElement.style.transform = `rotate3d(${axis[0]}, ${axis[1]}, ${axis[2]}, ${90 * direction}deg)`;
        }, 0);
    }

    /**
     * Shuffles the cube by performing a number of random rotations
     *
     * @param n {number} number of random rotations to perform
     */
    shuffle(n) {
        for (let i = 0; i < n; i++) {
            let axisIndex = Math.floor(Math.random() * 3);
            let axisDirection = Math.floor(Math.random() * 2);
            let rotationDirection = Math.floor(Math.random() * 2);
            let axis = [0, 0, 0];
            axis[axisIndex] = 1;
            let coordinates = [0, 0, 0];
            coordinates[axisIndex] = 2 * axisDirection - 1;
            this.fastMove(axis, coordinates, 2 * rotationDirection - 1, false);
        }
    }
}


window.addEventListener('keydown', function(event) {
    // react to direction key presses
    switch (event.key) {
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowUp":
        case "ArrowDown":
        case "z":
        case "q":
        case "s":
        case "d":
        case "Z":
        case "Q":
        case "S":
        case "D":
            event.preventDefault();
            let element = document.elementFromPoint(mouseX, mouseY);
            let sticker = cube.getSticker(element);
            if (sticker) {
                let t = sticker.getTranslation();
                let axis;
                let direction;
                switch (event.key) {
                    case "ArrowRight":
                    case "d":
                    case "D":
                        axis = (Math.abs(t[1]) >= length / 2) ? [0, 0, 1] : [0, 1, 0];
                        direction = 1;
                        break;
                    case "ArrowLeft":
                    case "q":
                    case "Q":
                        axis = (Math.abs(t[1]) >= length / 2) ? [0, 0, 1] : [0, 1, 0];
                        direction = -1;
                        break;
                    case "ArrowUp":
                    case "z":
                    case "Z":
                        if (Math.abs(t[0]) >= length / 2) {
                            axis = [0, 0, 1];
                            direction = -1;
                        } else {
                            axis = [1, 0, 0];
                            direction = 1;
                        }
                        break;
                    case "ArrowDown":
                    case "s":
                    case "S":
                        if (Math.abs(t[0]) >= length / 2) {
                            axis = [0, 0, 1];
                            direction = 1;
                        } else {
                            axis = [1, 0, 0];
                            direction = -1;
                        }
                        break;
                }
                if (event.shiftKey) {
                    cube.rotate(axis, direction);
                } else {
                    cube.move(axis, sticker.getCoordinates(), direction);
                }
            }
    }
});

window.onload = function() {
    // create cube and display it on screen
    cube = new Cube();
    document.getElementById("scene").appendChild(cube.element);
};

window.addEventListener("mousemove", handleMouseMove);

function handleMouseMove(event) {
    // track position of cursor
    mouseX = event.clientX;
    mouseY = event.clientY;
}
