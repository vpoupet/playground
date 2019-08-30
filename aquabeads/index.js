/**
 * Tracks whether the mouse button is currently pressed
 * @type {boolean}
 */
let mouseDown = false;
/**
 * The BeadType that is currently selected
 * @type {BeadType}
 */
let selectedType;
/**
 * SVG Element containing common definitions (symbols, masks, gradients, etc.)
 * @type {SVGElement}
 */
let defs = SVG.new("defs");
/**
 * Whether the grid only reacts to touches with a pressure-enabled stylus or to all touches
 * @type {boolean}
 */
let stylusOnly = false;

/**
 * Stroke color of empty cells
 * @type {string}
 */
EMPTY_STROKE = "#DDDDDD";
/**
 * Stroke color of beads
 * @type {string}
 */
BEAD_STROKE = "#434343";
/**
 * Stroke color of selection border
 * @type {string}
 */
SELECT_STROKE = "#333333";


/**
 * Representation of a type of beads
 */
class BeadType {
    /**
     * @param {string} color
     */
    constructor(color = undefined) {
        /**
         * The color of the beads
         * @type {undefined}
         */
        this.color = color;
        /**
         * Unique identifier of the type (initialized from static counter)
         * @type {string}
         */
        this.id = `t${BeadType.counter}`;
        BeadType.counter += 1;
        /**
         * SVGElement representing the bead type (placed in defs and used with <use> elements
         * @type {Element|void}
         */
        this.node = this.makeNode().setAttribute("id", this.id);
        defs.appendChild(this.node);
    }

    /**
     * Creates and returns the SVGElement representing the bead type (can be overridden by subclasses)
     * (called when the BeadType is created and stored in this.node)
     * @returns {SVGElement}
     */
    makeNode() {
        return SVG.Group()
            .appendChild(
                SVG.Circle(0, 0, .45)
                    .setAttributes({
                        fill: "white",
                        stroke: EMPTY_STROKE,
                        stroke_width: .03,
                    }));
    }

    /**
     * Returns the SVG Element used as border to highlight the bead type when selected in the color picker
     *
     * @returns {SVGElement}
     */
    makeContour() {
        return SVG.Group()
            .appendChild(
                SVG.Circle(0, 0, .45)
                    .setAttributes({
                        fill: "none",
                        stroke_width: .1,
                        stroke: SELECT_STROKE,
                    }));
    }
}

/**
 * Automatically incremented counter for generating unique identifiers
 * @type {number}
 */
BeadType.counter = 0;
/**
 * Default BeadType for empty cells
 * @type {BeadType}
 */
BeadType.default = new BeadType();


/**
 * Representation of regular (pearl-shaped) bead types
 */
class RoundType extends BeadType {
    makeNode() {
        return SVG.Group()
            .appendChild(
                SVG.Circle(0, 0, .45)
                    .setAttributes({     // main colored circle
                        fill: this.color,
                        stroke: "none",
                    }))
            .appendChild(
                SVG.Circle(0, 0, .45)   // shadow
                    .setAttributes({
                        fill: "black",
                        fill_opacity: .3,
                        mask: "url(#cell-mask)",
                    }))
            .appendChild(
                SVG.Circle(-.15, -.15, .05)     // shine
                    .setAttributes({
                        fill: "white",
                        stroke: "none",
                    }))
            .appendChild(
                SVG.Circle(0, 0, .45)   // stroke
                    .setAttributes({
                        fill: "none",
                        stroke: BEAD_STROKE,
                        stroke_width: .03,
                    }));
    }
}


/**
 * Representation of gem-shaped bead types
 */
class GemType extends BeadType {
    makeNode() {
        // create gradient and add it to defs
        defs.appendChild(
            SVG.new("radialGradient")
                .setAttributes({
                    id: `g${this.id}`,
                })
                .appendChild(
                    SVG.new("stop")
                        .setAttributes({
                            offset: "0%",
                            style: `stop-color:#FFFFFF;stop-opacity: 0`,
                        }))
                .appendChild(
                    SVG.new("stop")
                        .setAttributes({
                            offset: "60%",
                            style: `stop-color:${this.color};stop-opacity: 1`,
                        }))
        );

        return SVG.Group()
            .appendChild(
                SVG.NGon(6, .4)     // main colored hexagon
                    .setAttributes({
                        fill: `url(#g${this.id})`,  // gradient
                    }))
            .appendChild(
                SVG.Circle(-.1, -.1, .1)     // top-left shine
                    .setAttributes({
                        fill: "white",
                        stroke: "none",
                    }))
            .appendChild(
                SVG.Circle(.15, .15, .05)     // bottom-right shine
                    .setAttributes({
                        fill: "white",
                        stroke: "none",
                    }))
            .appendChild(
                SVG.NGon(6, .4)     // stroke
                    .setAttributes({
                        fill: "none",
                        stroke: BEAD_STROKE,
                        stroke_width: .03,
                    }));
    }

    makeContour() {
        return SVG.NGon(6, .45).setAttributes({
            fill: "none",
            stroke_width: .1,
            stroke: SELECT_STROKE,
        });
    }
}


let octogon = [];
for (let i = 0; i < 8; i++) {
    let a = (i + .5) * Math.PI / 4;
    octogon.push(new Point(
        Math.cos(a),
        Math.sin(a)));
}

class PolygonType extends BeadType {
    makeNode() {
        let r = .45;
        let shadowTriangle = SVG.Polyline([
            new Point(Math.cos(Math.PI / 8), Math.sin(Math.PI / 8)).scale(r/2),
            new Point(Math.cos(Math.PI / 8), Math.sin(Math.PI / 8)).scale(r),
            new Point(Math.cos(Math.PI / 8), -Math.sin(Math.PI / 8)).scale(r),
            new Point(Math.cos(Math.PI / 8), -Math.sin(Math.PI / 8)).scale(r/2)], true)
            .setAttributes({
                fill: "black",
            });
        return SVG.Group()
            .appendChild(
                SVG.Polyline(octogon.map(p => p.scale(r)), true)
                    .setAttributes({
                        fill: this.color,
                        stroke: "none",
                    }))
            .appendChild(
                SVG.Polyline(octogon.map(p => p.scale(r / 2)), true)
                    .setAttributes({
                        fill: "white",
                        fill_opacity: .2,
                    })
            )
            .appendChild(shadowTriangle.setAttribute("fill-opacity", .3))
            .appendChild(shadowTriangle.cloneNode().rotate(90).setAttribute("fill-opacity", .3))
            .appendChild(shadowTriangle.cloneNode().rotate(180).setAttribute("fill-opacity", .1))
            .appendChild(shadowTriangle.cloneNode().rotate(-90).setAttribute("fill-opacity", .1))
            .appendChild(
                SVG.Polyline(octogon.map(p => p.scale(r)), true)
                    .setAttributes({
                        fill: "none",
                        stroke: BEAD_STROKE,
                        stroke_width: .03,
                    })
            ).rotate(11.25);
    }

    makeContour() {
        let r = .45;
        return SVG.Polyline(octogon.map(p => p.scale(r)), true).setAttributes({
            fill: "none",
            stroke_width: .1,
            stroke: SELECT_STROKE,
        }).rotate(11.25);
    }
}

/**
 * Representation of the list of buttons representing all available BeadTypes
 */
class ColorPicker {
    /**
     * @param {BeadType[]} beadTypes list of available bead types
     */
    constructor(beadTypes) {
        // beadTypes.unshift(BeadType.default);    // Add the empty cell as an available bead type
        // selectedType = beadTypes[1];

        /**
         * HTMLElement representing the color picker (a <div> containing the elements representing each button)
         * @type {HTMLElement}
         */
        this.node = document.createElement("div").addClass("colorpicker");
        this.buttons = beadTypes.map(t => new ColorButton(t, this));

        for (let b of this.buttons) {
            this.node.appendChild(b.node);
        }
    }

    /**
     * Updates the HTMLElement representing the color picker, and the elements representing the buttons
     * (should be called whenever the state of the color picker is changed)
     */
    updateNode() {
        for (let b of this.buttons) {
            b.updateNode();
        }
    }
}


/**
 * Representation of a button to select a BeadType
 */
class ColorButton {
    /**
     * @param {BeadType} type the type that the button selects
     * @param {ColorPicker} colorPicker the ColorPicker in which the button is included
     */
    constructor(type, colorPicker) {
        /**
         * the type that the button selects
         * @type {BeadType}
         */
        this.type = type;
        /**
         * the ColorPicker in which the button is included
         * @type {ColorPicker}
         */
        this.colorPicker = colorPicker;

        /**
         * SVGElement representing the contour used to highlight the button if it is selected (hidden when the button
         * is not selected)
         * @type {SVGElement}
         */
        this.contour = this.type.makeContour();

        /**
         * SVGElement for the button (represents the BeadType of the button)
         * @type {SVGElement}
         */
        this.node = SVG.Image(1, 1, -.5, -.5)
            .appendChild(
                SVG.new("use")
                    .setAttributes({
                        x: 0,
                        y: 0,
                        href: '#' + type.id,
                    }))
            .appendChild(this.contour);
        this.updateNode();

        // add event listeners
        this.node.addEventListener('click', () => {
            selectedType = this.type;
            this.colorPicker.updateNode();
        });
    }

    /**
     * Updates the buttons SVGElement to reflect the state of the color picker
     * (hides or shows the contour depending on button selection)
     */
    updateNode() {
        if (selectedType === this.type) {
            this.contour.removeAttribute("display");
        } else {
            this.contour.setAttribute("display", "none");
        }
    }
}


/**
 * Representation of a grid cell, that can contain a bead
 */
class Cell {
    /**
     * @param {number} col column of the cell in the grid
     * @param {number} row row of the cell in the grid
     */
    constructor(col, row) {
        /**
         * x-coordinate of the cell when drawn in an hexagonal grid
         * @type {number}
         */
        this.x = col + (row % 2) / 2;
        /**
         * y-coordinate of the cell when drawn in an hexagonal grid
         * @type {number}
         */
        this.y = row * Math.sqrt(3) / 2;
        /**
         * type of the bead in the cell
         * @type {BeadType}
         */
        this.type = BeadType.default;

        /**
         * SVG <use> Element that points to the SVGElement of the BeadType of the cell
         * @type {SVGElement}
         */
        this.symbol = SVG.new("use").setAttributes({
            x: this.x,
            y: this.y,
            href: '#' + this.type.id,
        });

        /**
         * SVGElement representing the cell on the grid
         * @type {Element}
         */
        this.node = SVG.Group()
            .appendChild(this.symbol)
            .appendChild(   // invisible circle on top for touch event propagation
                SVG.Circle(this.x, this.y, .5).setAttributes({
                    fill_opacity: 0,
                }));

        // add event listeners
        this.node.addEventListener("setType", () => this.setType());    // custom event triggered to change the type
        this.node.addEventListener("mousedown", () => this.setType());
        this.node.addEventListener("mouseover", () => {
            if (mouseDown) {
                this.setType();
            }
        });
    }

    /**
     * Changes the BeadType of the cell
     * @param {BeadType} t the new BeadType of the cell (defaults to the current value of selectedType)
     */
    setType(t = undefined) {
        if (t === undefined) {
            t = selectedType;
        }
        if (!(this.type === t)) {
            this.type = t;
            this.symbol.setAttribute("href", '#' + this.type.id);
        }
    }
}


/**
 * Representation of the grid of cells on which beads can be placed
 */
class Grid {
    /**
     * @param {number} width width of the grid
     * @param {number} height height of the grid
     */
    constructor(width, height) {
        /**
         * width of the grid (number of cells on even rows, odd rows contain one less cell)
         * @type {number}
         */
        this.width = width;
        /**
         * height of the grid (number of rows)
         * @type {number}
         */
        this.height = height;
        /**
         * 2D array containing the cells of the grid in row major order
         * @type {Cell[][]}
         */
        this.cells = [];
        /**
         * SVGElement representing the whole grid
         * @type {SVGElement}
         */
        this.node = SVG.Image(width + .5, height * Math.sqrt(3) / 2 + 1, -.5, -.5);

        // create the cells
        for (let y = 0; y < height; y++) {
            let line = [];
            for (let x = 0; x < width - (y % 2); x++) {
                let c = new Cell(x, y);
                line.push(c);
                this.node.appendChild(c.node);
            }
            this.cells.push(line);
        }

        // add event listeners
        this.node.addEventListener("touchstart", this.ontouch);
        this.node.addEventListener("touchmove", this.ontouch);
    }

    /**
     * Reacts to touches on the grid
     * @param {TouchEvent} e the touch event
     */
    ontouch(e) {
        let stylusOnly = document.getElementById("stylus").checked;
        for (let touch of e.changedTouches) {
            if (!stylusOnly || touch.touchType === 'stylus') {
                // change the type of the touched cell
                let el = document.elementFromPoint(touch.clientX, touch.clientY);
                el.dispatchEvent(new Event("setType", {bubbles: true}));
            }
        }
        e.preventDefault();     // cancel default behavior to avoid scrolling
    }

    /**
     * Shifts the values on the cells to the left (leftmost values are removed, rightmost cells are set as empty)
     */
    shiftLeft() {
        for (let line of this.cells) {
            for (let i = 0; i < line.length - 1; i++) {
                line[i].setType(line[i + 1].type);
            }
            line[line.length - 1].setType(BeadType.default);
        }
    }

    /**
     * Shifts the values on the cells to the right (rightmost values are removed, leftmost cells are set as empty)
     */
    shiftRight() {
        for (let line of this.cells) {
            for (let i = line.length - 1; i > 0; i--) {
                line[i].setType(line[i - 1].type);
            }
            line[0].setType(BeadType.default);
        }
    }

    /**
     * Shifts the values on the cells to the top-left
     */
    shiftUp() {
        for (let row = 0; row < this.height - 1; row++) {
            if (row % 2 === 0) {
                for (let col = 0; col < this.width - 1; col++) {
                    this.cells[row][col].setType(this.cells[row + 1][col].type);
                }
                this.cells[row][this.width - 1].setType(BeadType.default);
            } else {
                for (let col = 0; col < this.width - 1; col++) {
                    this.cells[row][col].setType(this.cells[row + 1][col + 1].type);
                }
            }
        }
        for (let col = 0; col < this.width - 1; col++) {
            this.cells[this.height - 1][col].setType(BeadType.default);
        }
    }

    /**
     * Shifts the values on the cells to the bottom-right
     */
    shiftDown() {
        for (let row = this.height - 1; row > 0; row--) {
            if (row % 2 === 0) {
                for (let col = 1; col < this.width; col++) {
                    this.cells[row][col].setType(this.cells[row - 1][col - 1].type);
                }
                this.cells[row][0].setType(BeadType.default);
            } else {
                for (let col = 0; col < this.width - 1; col++) {
                    this.cells[row][col].setType(this.cells[row - 1][col].type);
                }
            }
        }
        for (let col = 0; col < this.width; col++) {
            this.cells[0][col].setType(BeadType.default);
        }
    }

    /**
     * Resets the state of all cells in the grid (to empty cells)
     */
    clear() {
        for (let line of this.cells) {
            for (let cell of line) {
                cell.setType(BeadType.default);
            }
        }
    }

    /**
     * Opens the grid image in the window to be saved in the browser as an SVG image
     */
    save() {
        this.node.insertBefore(defs, this.node.firstChild);
        this.node.save();
    }
}


window.onload = function () {
    // create the mask used to draw the shadow on round beads
    defs.appendChild(
        SVG.new("mask")
            .setAttributes({
                id: "cell-mask",
                maskContentUnits: "objectBoundingBox",
                stroke: "none",
            })
            .appendChild(
                SVG.Circle(.5, .5, .5)
                    .setAttribute("fill", "white"))
            .appendChild(
                SVG.Circle(.3, .3, .6)
                    .setAttribute("fill", "black")
            ));
    // add the defs as an independent <svg> tag
    document.body.appendChild(SVG.Image().appendChild(defs));

    // available bead types
    let beadTypes = [
        new RoundType("#C74245"),
        new RoundType("#FBE04C"),
        new RoundType("#DF8CB1"),
        new RoundType("#ECAC3C"),
        new RoundType("#EBB385"),
        new RoundType("#B1C940"),
        new RoundType("#4B9E51"),
        new RoundType("#60BDEB"),
        new RoundType("#225EAB"),
        new RoundType("#F3ED98"),
        new RoundType("#6c411d"),
        new RoundType("#ab6630"),
        new RoundType("#754A93"),
        new RoundType("#8a8a8a"),
        new RoundType("#343332"),
        new RoundType("#f0f0f0"),
        new PolygonType("#C74245"),
        new PolygonType("#FBE04C"),
        new PolygonType("#DF8CB1"),
        new PolygonType("#ECAC3C"),
        new PolygonType("#EBB385"),
        new PolygonType("#B1C940"),
        new PolygonType("#4B9E51"),
        new PolygonType("#60BDEB"),
        new PolygonType("#225EAB"),
        new PolygonType("#F3ED98"),
        new PolygonType("#6c411d"),
        new PolygonType("#ab6630"),
        new PolygonType("#754A93"),
        new PolygonType("#8a8a8a"),
        new PolygonType("#343332"),
        new PolygonType("#f0f0f0"),
        new GemType("#794C29"),
        new GemType("#DB8FAE"),
        new GemType("#D05D3C"),
        new GemType("#DA8340"),
        new GemType("#FAD949"),
        new GemType("#7BAF52"),
        new GemType("#00AAD8"),
        new GemType("#56538C"),
        BeadType.default,   // empty type
    ];
    selectedType = beadTypes[0];

    // create and display the color picker
    let colorPicker = new ColorPicker(beadTypes);
    document.getElementById("colors").appendChild(colorPicker.node);
    // create and display the grid
    let grid = new Grid(22, 26);
    let cells = document.getElementById("cells");
    cells.insertBefore(grid.node, cells.firstChild);

    // add global event listeners
    document.addEventListener("mousedown", () => mouseDown = true);
    document.addEventListener("mouseup", () => mouseDown = false);
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
            grid.shiftRight();
            e.preventDefault();
        } else if (e.key === "ArrowLeft") {
            grid.shiftLeft();
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            grid.shiftUp();
            e.preventDefault();
        } else if (e.key === "ArrowDown") {
            grid.shiftDown();
            e.preventDefault();
        }
    });
    document.getElementById("saveButton").addEventListener("click", () => grid.save());
    document.getElementById("clearButton").addEventListener("click", () => grid.clear());
};

function updateStylus() {
    stylusOnly = document.getElementById("stylus").checked;
}