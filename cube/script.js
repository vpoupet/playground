/**
 * Cube side length in px (should be an integer multiple of 6)
 * @type {number}
 */
const side = 300;
/**
 * Coordinates of the mouse (tracked automatically)
 * @type {number[]}
 */
let mouseLocation = [0, 0];
/**
 * Cube instance
 * @type {Cube}
 */
let cube;
/**
 * Currently tracked touch (started inside the cube)
 * @type {{id: string, location: number[], sticker: Sticker}}
 */
let currentTouch;
/**
 * 2D screen vectors corresponding to the positive 3D axes of the cube
 * @type {number[][]}
 */
let axes;

let moves = [];
const notationLetters = ["XLMR", "YDEU", "ZBSF"];

class Move {
    constructor(axisIndex, rotationAngle, coordinateValue = undefined) {
        this.axisIndex = axisIndex;
        this.rotationAngle = rotationAngle;
        this.coordinateValue = coordinateValue;
    }

    altCoordinateValue() {
        if (this.axisIndex === 1) return -this.coordinateValue;
        return this.coordinateValue;
    }

    altRotationAngle() {
        if (this.axisIndex === 1) return -this.rotationAngle;
        return this.rotationAngle;
    }

    inverse() {
        return new Move(this.axisIndex, -this.rotationAngle, this.coordinateValue);
    }

    letter() {
        if (this.coordinateValue === undefined) return notationLetters[this.axisIndex][0];
        return notationLetters[this.axisIndex][this.altCoordinateValue() + 2];
    }

    notation() {
        const relativeAngle = this.altCoordinateValue() === -1 ? -this.altRotationAngle() : this.altRotationAngle();
        switch (relativeAngle) {
            case 1:
                return this.letter();
            case 2:
            case -2:
                return this.letter() + "2";
            case -1:
                return this.letter() + "'";
        }
    }

    static random() {
        const axisIndex = Math.floor(Math.random() * 3);
        const rotationAngle = Math.floor(Math.random() * 2) * 2 - 1;
        const coordinateValue = Math.floor(Math.random() * 3) - 1;
        return new Move(axisIndex, rotationAngle, coordinateValue);
    }
}

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
        const coloredSquare = document.createElement("div");
        coloredSquare.classList.add("color-square");
        this.element.appendChild(coloredSquare);
        /**
         * current transformation of the sticker (rotation and translation)
         * @type {mat4}
         */
        this.matrix = mat4.create();
        /**
         * initial transformation of the sticker when the cube is initialized
         * @type {mat4}
         */
        this.startMatrix = undefined;
        // move the sticker from the center of the cube to its position on the "front face" (it will be rotated to the
        // correct face later
        mat4.translate(this.matrix, this.matrix, [shiftX * side / 3, shiftY * side / 3, side / 2]);
        this.updateElement();
    }

    /**
     * Rotate the sticker around the cube
     *
     * @param angle {number} angle of rotation in randians
     * @param axis {number[]} triple describing the rotation axis
     */
    rotate(angle, axis) {
        const rotation = mat4.fromRotation(mat4.create(), angle, axis);
        mat4.multiply(this.matrix, rotation, this.matrix);
        // because the regular rotations are all multiples of PI/2 around the main axes, coordinates should
        // always be integers and are rounded to maintain precision
        this.matrix = this.matrix.map(x => Math.round(x));
        this.updateElement();
    }

    /**
     * Resets the sticker to it initial position
     */
    reset() {
        this.matrix = mat4.clone(this.startMatrix);
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
        let t = mat4.getTranslation(vec3.create(), this.matrix);
        return vec3.round(t, vec3.scale(t, t, 1 / 150));
    }

    /**
     * Returns the normal vector of the Sticker
     *
     * @returns {vec3} a triple corresponding to the coordinates of the normal vector of the sticker
     */
    getFaceVector() {
        let v = mat4.getTranslation(vec3.create(), this.matrix);
        return vec3.round(v, vec3.scale(v, v, 1 / 220));
    }

    /**
     * Returns the 3D axis orthogonal to the sticker's normal vector that most closely macthes the 2D given vector
     * (the 2D vector is a direction on the screen, and it is matched to the apparent directions of the 3D axes of
     * the cube)
     *
     * @param v {vec2} the 2D screen vector to convert into a 3D axis
     * @returns {vec3} a 3D axis (triple of values with exactly one non-zero value
     */
    makeForce(v) {
        const faceVector = this.getFaceVector();
        let maxAbsProjection = 0;
        let maxIndex = 0;
        for (let i = 0; i < 3; i++) {
            if (faceVector[i] === 0) {
                const p = vec2.dot(v, axes[i]);
                if (Math.abs(p) >= maxAbsProjection) {
                    maxAbsProjection = Math.abs(p);
                    maxIndex = i;
                }
            }
        }
        let forceVector = vec3.create();
        forceVector[maxIndex] = Math.sign(vec2.dot(v, axes[maxIndex]));
        return forceVector;
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
        this.stickers = [];
        // create all the stickers on the cube (9 for each face)
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let s;
                s = new Sticker("face-front", i, j);
                this.stickers.push(s);
                this.element.appendChild(s.element);
                s = new Sticker("face-back", i, j);
                this.stickers.push(s);
                s.rotate(Math.PI, [0, 1, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-right", i, j);
                this.stickers.push(s);
                s.rotate(Math.PI / 2, [0, 1, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-left", i, j);
                this.stickers.push(s);
                s.rotate(-Math.PI / 2, [0, 1, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-top", i, j);
                this.stickers.push(s);
                s.rotate(Math.PI / 2, [1, 0, 0]);
                this.element.appendChild(s.element);
                s = new Sticker("face-bottom", i, j);
                this.stickers.push(s);
                s.rotate(-Math.PI / 2, [1, 0, 0]);
                this.element.appendChild(s.element);
            }
        }
        // save starting position of all stickers
        for (let s of this.stickers) {
            s.startMatrix = mat4.clone(s.matrix);
        }

        // add logo on central sticker of front face
        for (let s of this.stickers) {
            const c = s.getCoordinates();
            if (c[0] === 0 && c[1] === 0 && c[2] === 1) {
                s.element.getElementsByClassName("color-square")[0].classList.add("logo");
                break;
            }
        }
        this.isLocked = false;
        this.moves = [];
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
            for (let s of this.stickers) {
                if (s.element === element) {
                    return s;
                }
            }
        }
        return null;
    }

    /**
     * Rotate a slice of the cube
     *
     * The slice and rotation are determined from a sticker and a 2D vector. The sticker will be rotated in the
     * 3D axis that most closely matches the given 2D direction (each sticker can be rotated along the two axes that
     * are orthogonal to its face normal direction).
     *
     * @param sticker {Sticker} a Sticker of the slice that is being rotated
     * @param direction {number[]} 2D direction in which the sticker is being rotated
     */
    rotateSlice(sticker, direction) {
        if (this.isLocked) return;
        this.isLocked = true;

        const forceVector = sticker.makeForce(direction);
        const faceVector = sticker.getFaceVector();

        const rotationAxis = vec3.cross(vec3.create(), faceVector, forceVector);
        const axisIndex = rotationAxis.findIndex(x => x !== 0);
        let rotationAngle = rotationAxis[axisIndex];
        const coordinates = vec3.multiply(vec3.create(), sticker.getCoordinates(), rotationAxis);
        const coordinateValue = coordinates[axisIndex] * rotationAngle;

        const m = new Move(axisIndex, rotationAngle, coordinateValue);
        this.animateMove(m);
    }

    animateMove(m, callback=undefined) {
        this.addMove(m);
        let rotationAxis = [0, 0, 0];
        rotationAxis[m.axisIndex] = 1;

        // To avoid graphical glitches that appear if the stickers are rotated individually, they are grouped in a
        // single element, rotate the element as a whole in an animation, then extract the stickers and rotate them to
        // their final position instantly.
        const stickers = [];  // list of stickers to rotate
        const rotationElement = document.createElement("div");    // div containing the sticker elements
        this.element.appendChild(rotationElement);
        rotationElement.classList.add("rotation-block");

        // add all stickers that should be rotated
        for (let s of this.stickers) {
            let t = s.getCoordinates();
            if (m.coordinateValue === undefined || t[m.axisIndex] === m.coordinateValue) {
                stickers.push(s);
                rotationElement.appendChild(s.element);
            }
        }

        // callback when rotation animation finishes (all stickers are removed from the face, and rotated to their
        // final position (not animated)
        rotationElement.addEventListener('transitionend', function () {
            for (let s of stickers) {
                this.element.appendChild(s.element);
                s.rotate(m.rotationAngle * Math.PI / 2, rotationAxis);
            }
            rotationElement.remove();
            this.isLocked = false;  // unlock the cube after the rotation animation

            if (callback !== undefined) callback();
        }.bind(this), false);

        // the rotation is called asynchronously otherwise it isn't animated
        setTimeout(function () {
            rotationElement.style.transform = `rotate3d(${rotationAxis},${90 * m.rotationAngle}deg)`;
        }, 0);
    }

    fastMove(m) {
        // do nothing if cube is already performing a rotation
        if (this.isLocked) return;

        this.addMove(m);
        let rotationAxis = [0, 0, 0];
        rotationAxis[m.axisIndex] = 1;

        for (let s of this.stickers) {
            let t = s.getCoordinates();
            if (m.coordinateValue === undefined || t[m.axisIndex] === m.coordinateValue) {
                s.rotate(m.rotationAngle * Math.PI / 2, rotationAxis);
            }
        }
    }

    /**
     * Rotate the whole cube.
     *
     * The rotation is determined from a sticker and a 2D vector. The sticker will be rotated in the
     * 3D axis that most closely matches the given 2D direction (each sticker can be rotated along the two axes that
     * are orthogonal to its face normal direction).
     *
     * @param sticker {Sticker} a Sticker of the cube
     * @param direction {number[]} 2D direction in which the sticker is being rotated
     */
    rotateCube(sticker, direction) {

        if (this.isLocked) return;
        this.isLocked = true;

        const forceVector = sticker.makeForce(direction);
        const faceVector = sticker.getFaceVector();
        const rotationAxis = vec3.cross(vec3.create(), faceVector, forceVector);
        const axisIndex = rotationAxis.findIndex(x => x !== 0);
        let rotationAngle = rotationAxis[axisIndex];

        const m = new Move(axisIndex, rotationAngle);
        this.animateMove(m);
        this.addMove(m);
    }

    /**
     * Shuffles the cube by performing a number of random rotations
     *
     * @param n {number} number of random rotations to perform
     */
    shuffle(n) {
        for (let i = 0; i < n; i++) {
            this.fastMove(Move.random());
        }
    }

    /**
     * Resets the cube to its starting position
     */
    reset() {
        for (let s of this.stickers) {
            s.reset();
        }
        this.moves = [];
    }

    /**
     * Returns the 2D vectors corresponding to the directions of the main 3D axes of the cube on screen
     *
     * @returns {number[][]} An array of 3 2D unit vectors (arrays of 2 numbers) representing the direction on the
     * screen 2D plane that corresponds to the positive X, Y and Z 3D cube axes.
     *
     * To determine the vectors, the function creates a point-element (0-width and 0-height div), moves it to
     * different corners of the cube (in 3D) and queries the screen coordinates of the resulting 2D point.
     */
    getAxes() {
        const refPoint = document.createElement("div");
        const baseTranslation = `translateX(${side / 2}px) translateY(-${side / 2}px) translateZ(${side / 2}px)`;
        this.element.appendChild(refPoint);
        refPoint.style.transform = baseTranslation;
        let bounds = refPoint.getBoundingClientRect();
        const p0 = vec2.fromValues(bounds.x, bounds.y);
        const axes = [];
        let v;

        // get X axis
        refPoint.style.transform = "rotateY(-90deg) " + baseTranslation;
        bounds = refPoint.getBoundingClientRect();
        v = vec2.sub(vec2.create(), p0, [bounds.x, bounds.y]);
        vec2.normalize(v, v);
        axes.push(v);

        // get Y axis
        refPoint.style.transform = "rotateX(-90deg) " + baseTranslation;
        bounds = refPoint.getBoundingClientRect();
        v = vec2.sub(vec2.create(), [bounds.x, bounds.y], p0);
        vec2.normalize(v, v);
        axes.push(v);

        // get Z axis
        refPoint.style.transform = "rotateY(90deg) " + baseTranslation;
        bounds = refPoint.getBoundingClientRect();
        v = vec2.sub(vec2.create(), p0, [bounds.x, bounds.y]);
        vec2.normalize(v, v);
        axes.push(v);

        refPoint.remove();
        return axes;
    }

    addMove(newMove) {
        const lastMove = this.moves[this.moves.length - 1];
        if (lastMove !== undefined && lastMove.letter() === newMove.letter()) {
            lastMove.rotationAngle = (lastMove.rotationAngle + newMove.rotationAngle + 5) % 4 - 1;
            if (lastMove.rotationAngle === 0) {
                this.moves.pop();
            }
        } else {
            this.moves.push(newMove);
        }
    }

    showMoves() {
        console.log(this.moves.map(x => x.notation()).join(", "));
    }

    rewind() {
        const lastMove = this.moves[this.moves.length - 1];
        if (lastMove !== undefined) {
            this.animateMove(new Move(lastMove.axisIndex, -lastMove.rotationAngle, lastMove.coordinateValue));
        }
    }

    rewindAll() {
        if (this.moves.length > 0) {
            const lastmove = this.moves[this.moves.length - 1];
            this.animateMove(lastmove.inverse(), this.rewindAll.bind(this));
        }
    }
}


window.addEventListener('keydown', function (event) {
    const element = document.elementFromPoint(...mouseLocation);
    const sticker = cube.getSticker(element);
    let direction;
    if (sticker) {
        // react to direction key presses
        switch (event.key) {
            case "ArrowRight":
            case "d":
            case "D":
                direction = [1, 0];
                break;
            case "ArrowLeft":
            case "q":
            case "Q":
                direction = [-1, 0];
                break;
            case "ArrowUp":
            case "z":
            case "Z":
                direction = [0, -1];
                break;
            case "ArrowDown":
            case "s":
            case "S":
                direction = [0, 1];
                break;
        }
        if (direction) {
            event.preventDefault();
            if (event.shiftKey) {
                cube.rotateCube(sticker, direction);
            } else {
                cube.rotateSlice(sticker, direction);
            }
        }
    }
});

window.onload = function () {
    // create cube and display it on screen
    cube = new Cube();
    document.getElementById("scene").appendChild(cube.element);
    axes = cube.getAxes();
};

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("touchstart", handleTouchStart);
window.addEventListener("touchmove", handleTouchMove, {passive: false});
window.addEventListener("touchend", endTouch);
window.addEventListener("touchstop", endTouch);

function handleMouseMove(event) {
    // track position of cursor
    mouseLocation = [event.clientX, event.clientY];
}

function handleTouchStart(event) {
    if (!currentTouch) {
        const touch = event.touches[0];
        const sticker = cube.getSticker(document.elementFromPoint(touch.clientX, touch.clientY));
        if (sticker) {
            currentTouch = {
                id: touch.identifier,
                sticker: sticker,
                location: [touch.clientX, touch.clientY],
            };
        }
    }
}

function handleTouchMove(event) {
    if (currentTouch) {
        event.preventDefault();
        for (let touch of event.touches) {
            if (touch.identifier === currentTouch.id) {
                // found the tracked touch element
                const t = vec2.sub(vec2.create(), [touch.clientX, touch.clientY], currentTouch.location);
                if (vec2.length(t) >= side / 3) {
                    if (event.touches.length === 1) {
                        cube.rotateSlice(currentTouch.sticker, t);
                    } else {
                        cube.rotateCube(currentTouch.sticker, t);
                    }
                    currentTouch = undefined;
                }
                break;
            }
        }
    }
}

function endTouch(event) {
    if (currentTouch) {
        for (let touch of event.touches) {
            if (touch.identifier === currentTouch.id) {
                return;
            }
        }
        currentTouch = undefined;
    }
}

