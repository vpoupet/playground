Element.prototype.__setAttribute = Element.prototype.setAttribute;
/**
 * Redefinition of the setAttribute method to allow chaining calls (returns the object on which it is called)
 *
 * @param parameters
 * @returns {Element}
 */
Element.prototype.setAttribute = function(...parameters) {
    (this.__setAttribute(...parameters));
    return this;
};

Element.prototype.__appendChild = Element.prototype.appendChild;
/**
 * Redefinition of the appendChild method to allow chaining calls (returns the object on which it is called)
 *
 * @param parameters
 * @returns {Element}
 */
Element.prototype.appendChild = function(...parameters) {
    (this.__appendChild(...parameters));
    return this;
};

/**
 * Adds a class to the Element
 *
 * @param {string} className
 * @returns {Element}
 */
Element.prototype.addClass = function(className) {
    this.classList.add(className);
    return this;
};

/**
 * Sets attributes given as a dictionary
 *
 * @param dict dictionary mapping attribute names to their values. Underscores ('_') in attribute names are
 * automatically converted to dashes ('-')
 * @returns {Element}
 */
Element.prototype.setAttributes = function (dict) {
    for (let key in dict) {
        this.setAttribute(key.replace(/_/g, '-'), dict[key]);
    }
    return this;
};

/**
 * Opens an SVG element the current window so it can be saved from the browser.
 * Should only be called on <svg> tags
 */
SVGElement.prototype.save = function() {
    let serializer = new XMLSerializer();
    let blob = new Blob([serializer.serializeToString(this)],
        {'type': "image/svg+xml"});
    window.location = URL.createObjectURL(blob);
};

/**
 * Returns the list of SVG transformations applied to the SVGElement
 *
 * @returns {string[]} the list of transformations
 */
SVGElement.prototype.transform_list = function () {
    if (this.hasAttribute("transform")) {
        return this.getAttribute("transform").split(" ");
    } else {
        return [];
    }
};

/**
 * Adds an SVG transformation to the SVGElement
 *
 * @param {string} t the new transformation
 * @returns {SVGElement}
 */
SVGElement.prototype.add_transform = function (t) {
    let transform_list = this.transform_list();
    transform_list.push(t.toString());
    this.setAttribute("transform", transform_list.join(" "));
    return this;
};

/**
 * Removes the last transformation on the SVGElement
 *
 * @returns {SVGElement}
 */
SVGElement.prototype.pop_transform = function () {
    let transform_list = this.transform_list();
    transform_list.shift();
    this.setAttribute("transform", transform_list.join(" "));
    return this;
};

/**
 * Applies a generic 2D affine transformation to the SVGElement
 * The matrix applied is
 *   | a b e |
 *   | c d f |
 *   | 0 0 1 |
 *
 * @param {number} a coefficient of the transform matrix
 * @param {number} b coefficient of the transform matrix
 * @param {number} c coefficient of the transform matrix
 * @param {number} d coefficient of the transform matrix
 * @param {number} e coefficient of the transform matrix
 * @param {number} f coefficient of the transform matrix
 * @returns {SVGElement}
 */
SVGElement.prototype.transform = function (a, b, c, d, e = 0, f = 0) {
    this.add_transform(`matrix(${a} ${b} ${c} ${d} ${e} ${f})`);
    return this;
};

/**
 * Applies a translation to the SVGElement
 *
 * @param {number} dx x-component of the translation
 * @param {number} dy y-component of the translation
 * @returns {SVGElement}
 */
SVGElement.prototype.translate = function (dx, dy) {
    this.add_transform(`translate(${dx} ${dy})`);
    return this;
};

/**
 * Applies a rotation to the SVGElement
 *
 * @param {number} angle rotation angle (in degrees)
 * @param {number} cx x-coordinate of the center of rotation
 * @param {number} cy y-coordinate of the center of rotation
 * @returns {SVGElement}
 */
SVGElement.prototype.rotate = function (angle, cx = 0, cy = 0) {
    if (cx === 0 && cy === 0) {
        this.add_transform(`rotate(${angle})`);
    } else {
        this.add_transform(`rotate(${angle} ${cx} ${cy})`);
    }
    return this;
};

/**
 * Applies a scaling to the SVGElement
 *
 * @param {number} sx x-factor of the scaling
 * @param {number} sy y-factor of the scaling (defaults to sx)
 * @returns {SVGElement}
 */
SVGElement.prototype.scale = function (sx, sy = undefined) {
    if (sy === undefined) {
        sy = sx;
    }
    if (sx === sy) {
        this.add_transform(`scale(${sx})`);
    } else {
        this.add_transform(`scale(${sx} ${sy})`);
    }
    return this;
};

/**
 * Applies a skew along the x-axis to the SVGElement
 *
 * @param {number} angle skewing angle (in degrees)
 * @returns {SVGElement}
 */
SVGElement.prototype.skewX = function (angle) {
    this.add_transform(`skewX(${angle})`);
    return this;
};

/**
 * Applies a skew along the y-axis to the SVGElement
 *
 * @param {number} angle skewing angle (in degrees)
 * @returns {SVGElement}
 */
SVGElement.prototype.skewY = function (angle) {
    this.add_transform(`skewY(${angle})`);
    return this;
};

/**
 * Wrapper class for utility functions
 */
class SVG {
    /**
     * Creates and returns a new SVGElement
     *
     * @param {string} name the name of the created element
     * @returns {SVGElement} an SVGElement
     */
    static new(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    /**
     * Creates and returns an SVG Group element (<g>)
     *
     * @returns {SVGElement}
     * @constructor
     */
    static Group() {
        return SVG.new("g");
    }

    /**
     * Creates and returns an SVG Image element (<svg>)
     *
     * @param {number} width width of the image
     * @param {number} height height of the image
     * @param {number} minX starting x-coordinate
     * @param {number} minY starting y-coordinate
     * @returns {SVGElement}
     * @constructor
     */
    static Image(width=0, height=0, minX = 0, minY = 0) {
        let e = SVG.new('svg');
        e.setAttributes({
            version: "1.1",
            viewBox: `${minX} ${minY} ${width} ${height}`,
            xmlns: "http://www.w3.org/2000/svg",
        });
        return e;
    }

    /**
     * Creates and returns an SVG Rectangle element (<rect>)
     *
     * @param {number} x x-coordinate of the origin
     * @param {number} y y-coordinate of the origin
     * @param {number} width width of the rectangle
     * @param {number} height height of the rectangle
     * @param {number} rx x-radius of rounded corners
     * @param {number} ry y-radius of rounded corners (defaults to rx if rx is set)
     * @returns {SVGElement}
     * @constructor
     */
    static Rect(x, y, width = 1, height = 1, rx = 0, ry = undefined) {
        let e = SVG.new('rect');
        e.setAttributes({
            x: x,
            y: y,
            width: width,
            height: height,
        });
        if (rx !== 0) {
            if (ry === undefined) {
                ry = rx;
            }
            e.setAttribute("rx", rx);
            e.setAttribute("ry", ry);
        }
        return e;
    }

    /**
     * Creates and returns an SVG Circle element (<circle>)
     *
     * @param {number} cx x-coordinate of the center
     * @param {number} cy y-coordinate of the center
     * @param {number} r radius
     * @returns {SVGElement}
     * @constructor
     */
    static Circle(cx, cy, r) {
        let e = SVG.new('circle');
        e.setAttributes({
            cx: cx,
            cy: cy,
            r: r,
        });
        return e;
    }

    /**
     * Creates and returns an SVG Ellipse element (<ellipse>)
     *
     * @param {number} cx x-cordinate of the center
     * @param {number} cy y-cordinate of the center
     * @param {number} rx radius along the x-axis
     * @param {number} ry radius along the y-axis
     * @returns {SVGElement}
     * @constructor
     */
    static Ellipse(cx, cy, rx, ry) {
        let e = SVG.new('ellipse');
        e.setAttributes({
            cx: cx,
            cy: cy,
            rx: rx,
            ry: ry,
        });
        return e;
    }

    /**
     * Creates and returns an SVG Line element (<line>)
     *
     * @param {number} x1 x-coordinate of the starting point
     * @param {number} y1 y-coordinate of the starting point
     * @param {number} x2 x-coordinate of the ending point
     * @param {number} y2 y-coordinate of the ending point
     * @returns {SVGElement}
     * @constructor
     */
    static Line(x1, y1, x2, y2) {
        let e = SVG.new('line');
        e.setAttributes({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
        });
        return e;
    }

    /**
     * Creates and returns an SVG Polyline (open or closed) element (<polyline> or <polygon>)
     *
     * @param {Point[]} points list of points of the line
     * @param {boolean} is_closed whether the line is closed (polygon) or not (polyline)
     * @returns {SVGElement}
     * @constructor
     */
    static Polyline(points, is_closed = false) {
        let e;
        if (is_closed) {
            e = SVG.new('polygon');
        } else {
            e = SVG.new('polyline');
        }
        e.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(' '));
        return e;
    }

    /**
     * Creates and returns an SVG Polyline representing a regular polygon with n vertices
     *
     * @param {number} nbPoints number of vertices
     * @param {number} r radius of the polygon
     * @returns {SVGElement}
     * @constructor
     */
    static NGon(nbPoints, r=1) {
        let points = [];
        for (let i = 0; i < nbPoints; i++) {
            points.push(new Point(r * Math.cos(2 * i * Math.PI / nbPoints), r * Math.sin(2 * i * Math.PI / nbPoints)));
        }
        return SVG.Polyline(points, true);
    }

    /**
     * Creates and returns an SVG Group representing a grid
     *
     * @param {number} sizeX number of columns
     * @param {number} sizeY number of rows
     * @param {number} cellWidth width of a cell
     * @param {number} cellHeight height of a cell (defaults to cellWidth)
     * @returns {SVGElement}
     * @constructor
     */
    static Grid(sizeX, sizeY, cellWidth = 1, cellHeight = undefined) {
        let e = SVG.Group();
        e.setAttribute("stroke_linecap", "square");
        if (cellHeight === undefined) {
            cellHeight = cellWidth;
        }

        for (let i = 0; i <= sizeX; i++) {
            e.appendChild(SVG.Line(i * cellWidth, 0, i * cellWidth, sizeY * cellHeight));
        }
        for (let i = 0; i <= sizeY; i++) {
            e.appendChild(SVG.Line(0, i * cellHeight, sizeX * cellWidth, i * cellHeight));
        }
        return e;
    }
}


class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    scale(s) {
        return new Point(this.x * s, this.y * s);
    }

    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}


class PointSet {
    constructor() {
        this.points = [];
    }

    contains(p) {
        for (let x of this.points) {
            if (x.equals(p)) {
                return true;
            }
        }
        return false;
    }

    add(p) {
        if (p === undefined) { return; }
        if (!this.contains(p)) {
            this.points.push(p);
            return true;
        }
        return false;
    }

    delete(p) {
        if (p === undefined) { return; }
        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i].equals(p)) {
                this.points.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    toggle(p) {
        if (p === undefined) { return; }
        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i].equals(p)) {
                this.points.splice(i, 1);
                return false;
            }
        }
        this.points.push(p);
        return true;
    }

    addSet(s) {
        for (let x of s.points) {
            this.add(x);
        }
    }
}