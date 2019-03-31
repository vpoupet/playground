/**
 * Converts a value in degrees to radians.
 *
 * @param angle {number} value in degrees
 * @returns {number} value in radians
 */
function radians(angle) {
    return angle * Math.PI / 180;
}

/**
 * Representation of the style that can be applied to an SVG Node.
 */
class Style {
    /**
     * @param attributes dictionary mapping SVG properties (string) to their values (automatically included in the
     * SVG representation of the Style)
     * @param data dictionary of extra variables that might be propagated down (do not appear automatically in SVG
     * representation)
     */
    constructor(attributes={}, data={}) {
        this.attributes = attributes;
        this.data = data;
        this.transform = [];
        this.parent_transform = undefined;
        this.show_transform = true;
    }

    /**
     * Sets the value of an SVG attribute.
     *
     * @param key {string} name of the attribute
     * @param value value of the attribute
     * @returns {Style} the Style itself
     */
    set(key, value) {
        this.attributes[key] = value;
        return this;
    }

    /**
     * Removes an SVG attribute.
     *
     * @param key {string} name of the attribute
     * @returns {Style} the Style itself
     */
    unset(key) {
        delete this.attributes[key];
        return this;
    }

    /**
     * Adds or sets the attributes in the given dictionary.
     *
     * @param dict dictionary mapping attribute names to their values
     * @returns {Style} the Style itself
     */
    update(dict) {
        Object.assign(this.attributes, dict);
        return this;
    }

    /**
     * @returns {Style} a shallow copy of the current Style
     */
    copy() {
        let new_style = new Style();
        new_style.transform = [...this.transform];
        Object.assign(new_style.attributes, this.attributes);
        Object.assign(new_style.data, this.data);
        return new_style;
    }

    /**
     * Adds a new transformation to the Style's list of transformations.
     * The new transformation is inserted at the beginning of the list (to conform to the SVG order).
     *
     * @param t {Transform} the new transformation
     * @returns {Style} the Style itself
     */
    add_transform(t) {
        this.transform.unshift(t);
        return this;
    }

    /**
     * Removes the last added transformation (the first element of the list `transform`).
     * Does nothing if the list of transformations is empty.
     *
     * @returns {Style} the Style itself
     */
    pop_transform() {
        this.transform.shift();
        return this;
    }

    /**
     * Clears the list of transformations.
     *
     * @returns {Style} the Style itself
     */
    clear_transform() {
        this.transform.length = 0;
        return this;
    }

    /**
     * Adds a 2D translation to the list of transformations.
     *
     * @param dx {number} translation distance along the x-axis
     * @param dy {number} translation distance along the y-axis
     * @returns {Style} the Style itself
     */
    translate(dx, dy) {
        this.add_transform(new Translate(dx, dy));
        return this;
    }

    /**
     * Adds a 2D rotation to the list of transformations.
     *
     * @param angle {number} angle of the rotation (in degrees)
     * @param cx {number} (optional) the x-coordinate of the center of the rotation (default 0)
     * @param cy {number} (optional) the y-coordinate of the center of the rotation (default 0)
     * @returns {Style} the Style itself
     */
    rotate(angle, cx=0, cy=0) {
        this.add_transform(new Rotate(angle, cx, cy));
        return this;
    }

    /**
     * Adds a 2D scale transformation to the list of transformations.
     *
     * @param sx {number} scaling factor along the x-axis
     * @param sy {number} scaling factor along the y-axis
     * @returns {Style} the Style itself
     */
    scale(sx, sy=undefined) {
        this.add_transform(new Scale(sx, sy));
        return this;
    }

    /**
     * Adds a 2D skew along the x-axis to the list of transformations.
     *
     * @param angle {number} angle of the skew (in degrees)
     * @returns {Style} the Style itself
     */
    skew_x(angle) {
        this.add_transform(new SkewX(angle));
        return this;
    }

    /**
     * Adds a 2D skew along the y-axis to the list of transformations.
     *
     * @param angle {number} angle of the skew (in degrees)
     * @returns {Style} the Style itself
     */
    skew_y(angle) {
        this.add_transform(new SkewY(angle));
        return this;
    }

    /**
     * Adds a generic 2D matrix transformation to the list of transformations.
     * The resulting matrix is a 3x3 matrix:
     *
     *     | a c e |
     *     | b d f |
     *     | 0 0 1 |
     *
     * @param a{number} matrix cell value at index (0, 0)
     * @param b{number} matrix cell value at index (0, 1)
     * @param c{number} matrix cell value at index (1, 0)
     * @param d{number} matrix cell value at index (1, 1)
     * @param e{number} (optional) matrix cell value at index (2, 0) (default 0)
     * @param f{number} (optional) matrix cell value at index (2, 1) (default 0)
     * @returns {Style} the Style itself
     */
    transform2d(a, b, c, d, e=0, f=0) {
        this.add_transform(new Matrix(a, b, c, d, e, f));
        return this;
    }

    /**
     * Adds a 3D translation to the list of transformations.
     *
     * @param dx {number} translation distance along the x-axis
     * @param dy {number} translation distance along the y-axis
     * @param dz {number} translation distance along the z-axis
     * @returns {Style} the Style itself
     */
    translate3d(dx, dy, dz) {
        return this.add_transform(new Translate3D(dx, dy, dz));
    }

    /**
     * Adds a 3D rotation around the x-axis to the list of transformations.
     *
     * @param angle {number} rotation angle (in degrees)
     * @returns {Style} the Style itself
     */
    rotate_x(angle) {
        return this.add_transform(new RotateX(angle));
    }

    /**
     * Adds a 3D rotation around the y-axis to the list of transformations.
     *
     * @param angle {number} rotation angle (in degrees)
     * @returns {Style} the Style itself
     */
    rotate_y(angle) {
        return this.add_transform(new RotateY(angle));
    }

    /**
     * Adds a 3D rotation around the z-axis to the list of transformations.
     * (This is equivalent to a 2D rotation around the origin)
     *
     * @param angle {number} rotation angle (in degrees)
     * @returns {Style} the Style itself
     */
    rotate_z(angle) {
        return this.add_transform(new RotateZ(angle));
    }

    /**
     * Adds a 3D scaling transformation to the list of transformations.
     *
     * @param sx {number} scaling factor along the x-axis
     * @param sy {number} (optional) scaling factor along the y-axis
     * @param sz {number} (optional) scaling factor along the z-axis
     *
     * If only one parameter is given (sx), the same factor is used along all 3 axes.
     * If only two parameters are given (sx and sy), no scaling is performed along the z-axis (sz is set to 1).
     * @returns {Style} the Style itself
     */
    scale3d(sx, sy=undefined, sz=undefined) {
        return this.add_transform(new Scale(sx, sy, sz));
    }

    /**
     * Adds a generic 3D matrix transformation to the list of transformations.
     * The corresponding matrix is a 4x4 matrix:
     *
     *     | x0 y0 z0 tx |
     *     | x1 y1 z1 ty |
     *     | x2 y2 z2 tz |
     *     |  0  0  0  1 |
     *
     * @param x0 {number} matrix cell value at index (0, 0)
     * @param x1 {number} matrix cell value at index (0, 1)
     * @param x2 {number} matrix cell value at index (0, 2)
     * @param y0 {number} matrix cell value at index (1, 0)
     * @param y1 {number} matrix cell value at index (1, 1)
     * @param y2 {number} matrix cell value at index (1, 2)
     * @param z0 {number} matrix cell value at index (2, 0)
     * @param z1 {number} matrix cell value at index (2, 1)
     * @param z2 {number} matrix cell value at index (2, 2)
     * @param tx {number} matrix cell value at index (3, 0)
     * @param ty {number} matrix cell value at index (3, 1)
     * @param tz {number} matrix cell value at index (3, 2)
     * @returns {Style} the Style itself
     */
    transform3d(x0, x1, x2, y0, y1, y2, z0, z1, z2, tx=0, ty=0, tz=0) {
        return this.add_transform(new Matrix3D(x0, x1, x2, y0, y1, y2, z0, z1, z2, tx, ty, tz));
    }

    /**
     * @returns {boolean} true if the Style has "inherited" a transformation from a parent Node in the SVG tree
     * (when propagating 3D transforms) or if the Style contains a 3D transform itself. false otherwise.
     */
    has_transform3d() {
        if (this.parent_transform !== undefined) {
            return true;
        }
        for (let t of this.transform) {
            if (t instanceof Transform3D) {
                return true;
            }
        }
        return false;
    }

    /**
     * @returns {Transform3D} the resulting 3D transformation obtained by applying all the transformations of the
     * Style and, possibly, the transform inherited from parent Nodes in the SVG tree.
     */
    get_transform3d() {
        let m = mat4.create();
        for (let t of this.transform) {
            mat4.multiply(m, m, t.as_mat4());
        }
        if (this.parent_transform !== undefined) {
            mat4.multiply(m, this.parent_transform.as_mat4(), m);
        }
        return new Transform3D(m);
    }

    /**
     * @returns {string} the SVG representation of the Style (a string that can be inserted in an SVG tag)
     */
    svg() {
        let elements = Object.keys(this.attributes).map(k => `${k}="${this.attributes[k]}"`);
        if (this.show_transform) {
            if (this.has_transform3d()) {
                elements.push(`transform="${this.get_transform3d().svg()}"`);
            } else {
                elements.push(`transform="${this.transform.map(t => t.svg()).join(" ")}"`);
            }
        }
        return elements.join(" ");
    }
}

/**
 * Representation of an SVG tag.
 */
class Tag {
    /**
     * @param name {string} the name of the Tag
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * @returns {string} the string representation of the proper parameters of the Tag
     *
     * @param data an object of extra data that can be used to generate the parameters
     */
    parameters_string(data) {
        return "";
    }
}

/**
 * Representation of the <svg> tag, which should be the root tag of any valid SVG image.
 */
class SVG extends Tag {
    /**
     * @param width {number} width of the image
     * @param height {number} height of the image
     */
    constructor(width, height) {
        super("svg");
        this.width = width;
        this.height = height;
    }

    parameters_string(data) {
        return `width="${this.width}" height="${this.height}"`;
    }
}

/**
 * Representation of the Group (<g>) tag
 */
class Group extends Tag {
    constructor() {
        super("g");
    }
}

/**
 * Representation of the Rectangle (<rect>) tag.
 */
class Rectangle extends Tag {
    /**
     * @param x {number} x-coordinate of the origin
     * @param y {number} y-coordinate of the origin
     * @param width {number} width
     * @param height {number} height
     * @param rx {number} (optional) corner radius (along x-axis) (default 0)
     * @param ry {number} (optional) corner radius (along y-axis) (default 0)
     */
    constructor(x, y, width, height, rx=0, ry=0) {
        super("rect");
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rx = rx;
        this.ry = ry;
    }

    parameters_string(data) {
        let r = `x="${this.x}" y="${this.y}" width="${this.width}" height="${this.height}"`;
        if (this.rx !== 0 || this.ry !== 0) {
            return r + ` rx="${this.rx}" ry="${this.ry}"`;
        } else {
            return r;
        }
    }
}

/**
 * Representation of the <circle> tag.
 */
class Circle extends Tag {
    /**
     * @param cx {number} x-coordinate of the center
     * @param cy {number} y-coordinate of the center
     * @param r {number} radius
     */
    constructor(cx, cy, r) {
        super("circle");
        this.cx = cx;
        this.cy = cy;
        this.r = r;
    }

    parameters_string(data) {
        return `cx="${this.cx}" cy="${this.cy}" r="${this.r}"`;
    }
}

/**
 * Representation of the <polyline> and <polygon> tags.
 */
class Polyline extends Tag {
    /**
     * @param points {number[][]} list of points along the polyline (each point is an array of 2 numbers)
     * @param is_closed {boolean} true if the line should be closed (polygon) false otherwise (polyline)
     */
    constructor(points, is_closed=false) {
        if (is_closed) {
            super("polygon");
        } else {
            super("polyline");
        }
        this.points = points;
    }

    parameters_string(data) {
        return `points="${this.points.map(p => `${p[0]},${p[1]}`).join(' ')}"`;
    }
}

/**
 * Representation of SVG tags that contain 3D information.
 */
class Tag3D extends Tag {
    constructor(name) {
        super(name);
        this.parent_transform = undefined;
    }
}

/**
 * Representation of a 3D polyline or polygon (line with 3D points)
 */
class Polyline3D extends Tag3D {
    /**
     * @param points {number[][]} list of points along the polyline (each point is an array of 3 numbers)
     * @param is_closed {boolean} true if the line should be closed (polygon) false otherwise (polyline)
     */
    constructor(points, is_closed=false) {
        if (is_closed) {
            super("polygon");
        } else {
            super("polyline");
        }
        this.points = points;
    }

    parameters_string(data) {
        let points;
        if (this.parent_transform !== undefined) {
            points = this.points.map(p => this.parent_transform.apply_to(p));
        } else {
            points = this.points;
        }
        return `points="${points.map(p => `${p[0]},${p[1]}`).join(' ')}"`;
    }
}

/**
 * Representation of a node in the SVG tree.
 *
 * A SVGNode contains
 *   - a Tag
 *   - a Style (applied to the Tag)
 *   - a list of children SVGNodes that represent the SVG tags contained inside the node's Tag
 */
class SVGNode {
    /**
     * @param tag {Tag} the Tag of the node
     * @param style {Style} the Style to apply to the Tag
     * @param content {SVGNode[]} a list of SVGNode elements corresponding to the SVG tags contained in the node's Tag
     */
    constructor(tag, style=new Style(), content=[]) {
        this.tag = tag;
        this.style = style;
        this.content = content;
        this.data = {};
    }

    /**
     * @returns {string} the SVG representation of the node and all its content.
     */
    svg() {
        let inner_str = this.tag.name;
        let parameters_str = this.tag.parameters_string(this.data);
        if (parameters_str.length > 0) { inner_str += " " + parameters_str; }
        let style_str = this.style.svg();
        if (style_str.length > 0) { inner_str += " " + style_str; }
        let content_str = this.content.map(n => n.svg()).join("");
        if (content_str.length > 0) {
            return `<${inner_str}>${content_str}</${this.tag.name}>`;
        } else {
            return `<${inner_str} />`;
        }
    }

    /**
     * Adds a child node to the node's content
     * @param element {Tag | SVGNode} the element to add
     * @param style {Style} (optional) the Style to attach to the element
     *
     * If the given element is a Tag, a new SVGNode is created with the element as tag and the given Style as style
     * (or an empty Style if none was given), and appended to the current SVGNode's content.
     * If the element is an SVGNode and a Style is given, the element's style is replaced with the one given and the
     * element is appended to the current node's content. If no Style is given, the element is inserted directly.
     */
    add(element, style=undefined) {
        if (element instanceof Tag) {
            // the new element is a Tag, a new SVGNode is created with the Tag and Style and inserted
            if (style === undefined) {
                style = new Style();
            }
            this.content.push(new SVGNode(element, style));
        } else {
            // the new element is an SVGNode
            if (style !== undefined) {
                element.style = style;
            }
            this.content.push(element);
        }
    }

    /**
     * Returns whether it is necessary to propagate 3D transforms down the SVG tree or not.
     *
     * 3D transforms should be propagated down if there is a node in the descendants of the current node that either
     * has a 3D transform in its style or a tag with 3D values (Tag3D), or if the tag of the current node is a Tag3D.
     *
     * @returns {boolean} true if 3D transforms should be propagated down the tree from the current node, false
     * otherwise.
     */
    should_propagate_transform3d() {
        if (this.tag instanceof Tag3D) {
            return true;
        }
        for (let n of this.content) {
            if (n.style.has_transform3d() || n.should_propagate_transform3d()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Recursively propagates 3D transforms down the tree as necessary.
     *
     * This function transforms the SVG tree (from the current node) so that it can be represented with 2D
     * transformations alone.
     */
    propagate_transform3d() {
        if (this.style.has_transform3d()) {
            // the current node's style contains 3D transformations
            let matrix = this.style.get_transform3d(); // merge all transformations as a single transformation matrix

            if (this.should_propagate_transform3d()) {
                // there are elements "under" the current node that also use 3D transformations (or 3D points)
                // in that case the current node does not display its transformation directly (show_transform = false)
                // and instead transmits its current transformation to all children and to the tag.
                this.style.show_transform = false;
                this.tag.parent_transform = matrix;
                for (let n of this.content) {
                    n.style.parent_transform = matrix;
                }
            }
        }
        if (this.should_propagate_transform3d()) {
            // the function is called recursively to all contained children if necessary
            for (let n of this.content) {
                n.propagate_transform3d();
            }
        }
    }

    /**
     * Recursively propagates the data attribute of the node's style to all children nodes.
     */
    propagate_data() {
        Object.assign(this.data, this.style.data);
        for (let n of this.content) {
            n.data = {};
            Object.assign(n.data, this.data);
            n.propagate_data();
        }
    }
}

/**
 * Representation of affine transformations (2D or 3D).
 */
class Transform {
    /**
     * @returns {string} the string representing the transformation in SVG format
     */
    svg() {
       return "";
    }

    /**
     * @returns {mat4} the 4x4 matrix representation of the affine transformation
     */
    as_mat4() {
        return mat4.create();
    }
}

/**
 * Representation of a generic 2D matrix transformation:
 *     | a c e |
 *     | b d f |
 *     | 0 0 1 |
 */
class Matrix extends Transform {
    /**
     * @param a{number} matrix cell value at index (0, 0)
     * @param b{number} matrix cell value at index (0, 1)
     * @param c{number} matrix cell value at index (1, 0)
     * @param d{number} matrix cell value at index (1, 1)
     * @param e{number} (optional) matrix cell value at index (2, 0) (default 0)
     * @param f{number} (optional) matrix cell value at index (2, 1) (default 0)
     */
    constructor(a, b, c, d, e=0, f=0) {
        super();
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }

    svg() {
        return `matrix(${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f})`
    }

    as_mat4() {
        return mat4.fromValues(this.a, this.b, 0, 0, this.c, this.d, 0, 0, 0, 0, 1, 0, this.e, this.f, 0, 1);
    }
}

/**
 * Representation of a 2D translation.
 */
class Translate extends Transform {
    /**
     *
     * @param dx {number} translation distance along the x-axis
     * @param dy {number} translation distance along the y-axis
     */
    constructor(dx, dy) {
        super();
        this.dx = dx;
        this.dy = dy;
    }

    svg() {
        return `translate(${this.dx} ${this.dy})`;
    }

    as_mat4() {
        let r = {};
        return mat4.fromTranslation(r, vec3.fromValues(this.dx, this.dy, 0));
    }
}

/**
 * Representation of a 2D rotation.
 */
class Rotate extends Transform {
    /**
     * @param angle {number} angle of the rotation (in degrees)
     * @param cx {number} (optional) the x-coordinate of the center of the rotation (default 0)
     * @param cy {number} (optional) the y-coordinate of the center of the rotation (default 0)
     */
    constructor(angle, cx=0, cy=0) {
        super();
        this.angle = angle;
        this.cx = cx;
        this.cy = cy;
    }

    svg() {
        if (this.cx === 0 && this.cy === 0) {
            return `rotate(${this.angle})`;
        } else {
            return `rotate(${this.angle} ${this.cx} ${this.cy})`;
        }
    }

    as_mat4() {
        let r = {};
        return mat4.fromZRotation(r, radians(this.angle));
    }
}

/**
 * Representation of a 2D scale transformation.
 */
class Scale extends Transform {
    /**
     * @param sx {number} scaling factor along the x-axis
     * @param sy {number} scaling factor along the y-axis
     */
    constructor(sx, sy=undefined) {
        super();
        if (sy === undefined) { sy = sx; }
        this.sx = sx;
        this.sy = sy;
    }

    svg() {
        if (this.sx === this.sy) {
            return `scale(${this.sx})`;
        } else {
            return `scale(${this.sx} ${this.sy})`;
        }
    }

    as_mat4() {
        let r = {};
        return mat4.fromScaling(r, vec3.fromValues(this.sx, this.sy, 1));
    }
}

/**
 * Representation of a skew transformation along the x-axis.
 */
class SkewX extends Transform {
    /**
     * @param angle {number} angle of the skew (in degrees)
     */
    constructor(angle) {
        super();
        this.angle = angle;
    }

    svg() {
        return `skewX(${this.angle})`;
    }

    as_mat4() {
        return new Matrix3D(1, 0, 0, Math.tan(radians(this.angle)), 1, 0, 0, 0, 1);
    }
}

/**
 * Representation of a skew transformation along the y-axis.
 */
class SkewY extends Transform {
    /**
     * @param angle {number} angle of the skew (in degrees)
     */
    constructor(angle) {
        super();
        this.angle = angle;
    }

    svg() {
        return `skewY(${this.angle})`;
    }

    as_mat4() {
        return new Matrix3D(1, Math.tan(radians(this.angle)), 0, 0, 1, 0, 0, 0, 1);
    }
}

/**
 * Representation of a generic 3D affine transformation as a 4x4 matrix.
 */
class Transform3D extends Transform {
    /**
     * @param matrix {mat4} the 4x4 matrix corresponding to the affine transformation
     */
    constructor(matrix=mat4.create()) {
        super();
        this.matrix = matrix;
    }

    /**
     * Returns the image of a given 3D point by the Transformation.
     *
     * @param point {number[]} the input 3D point (as an array of 3 numbers)
     * @returns {vec3} the coordinates of the image of the point by the Transformation
     */
    apply_to(point) {
        let v = vec3.fromValues(...point);
        return vec3.transformMat4(v, v, this.as_mat4());
    }

    svg() {
        let m = this.as_mat4();
        return new Matrix(m[0], m[1], m[4], m[5], m[12], m[13]).svg();
    }

    as_mat4() {
        return this.matrix;
    }
}

/**
 * Representation of a 3D translation.
 */
class Translate3D extends Transform3D {
    /**
     * @param dx {number} translation distance along the x-axis
     * @param dy {number} translation distance along the y-axis
     * @param dz {number} translation distance along the z-axis
     */
    constructor(dx, dy, dz) {
        super();
        this.dx = dx;
        this.dy = dy;
        this.dz = dz;
    }

    as_mat4() {
        return mat4.fromTranslation(this.matrix, vec3.fromValues(this.dx, this.dy, this.dz));
    }
}

/**
 * Representation of a 3D rotation around the x-axis.
 */
class RotateX extends Transform3D {
    /**
     * @param angle {number} rotation angle (in degrees)
     */
    constructor(angle) {
        super();
        this.angle = angle;
    }

    as_mat4() {
        return mat4.fromXRotation(this.matrix, radians(this.angle));
    }
}

/**
 * Representation of a 3D rotation around the x-axis.
 */
class RotateY extends Transform3D {
    /**
     * @param angle {number} rotation angle (in degrees)
     */
    constructor(angle) {
        super();
        this.angle = angle;
    }

    as_mat4() {
        return mat4.fromYRotation(this.matrix, radians(this.angle));
    }
}

/**
 * Representation of a 3D rotation around the x-axis.
 * (Corresponds to a 2D rotation around the origin)
 */
class RotateZ extends Transform3D {
    /**
     * @param angle {number} rotation angle (in degrees)
     */
    constructor(angle) {
        super();
        this.angle = angle;
    }

    as_mat4() {
        return mat4.fromZRotation(this.matrix, radians(this.angle));
    }
}

/**
 * Representation of a 3D scale transformation.
 */
class Scale3D extends Transform3D {
    /**
     * @param sx {number} scaling factor along the x-axis
     * @param sy {number} (optional) scaling factor along the y-axis
     * @param sz {number} (optional) scaling factor along the z-axis
     *
     * If only one parameter is given (sx), the same factor is used along all 3 axes.
     * If only two parameters are given (sx and sy), no scaling is performed along the z-axis (sz is set to 1).
     */
    constructor(sx, sy=undefined, sz=undefined) {
        if (sy === undefined) {
            sy = sx;
            sz = sx;
        } else if (sz === undefined) {
            sz = 1;
        }
        super();
        this.sx = sx;
        this.sy = sy;
        this.sz = sz;
    }

    as_mat4() {
        return mat4.fromScaling(this.matrix, vec3.fromValues(this.sx, this.sy, this.sz));
    }
}

/**
 * Representation of a generic 3D matrix transformation:
 *
 *     | x0 y0 z0 tx |
 *     | x1 y1 z1 ty |
 *     | x2 y2 z2 tz |
 *     |  0  0  0  1 |
 */
class Matrix3D extends Transform3D {
    /**
     * @param x0 {number} matrix cell value at index (0, 0)
     * @param x1 {number} matrix cell value at index (0, 1)
     * @param x2 {number} matrix cell value at index (0, 2)
     * @param y0 {number} matrix cell value at index (1, 0)
     * @param y1 {number} matrix cell value at index (1, 1)
     * @param y2 {number} matrix cell value at index (1, 2)
     * @param z0 {number} matrix cell value at index (2, 0)
     * @param z1 {number} matrix cell value at index (2, 1)
     * @param z2 {number} matrix cell value at index (2, 2)
     * @param tx {number} matrix cell value at index (3, 0)
     * @param ty {number} matrix cell value at index (3, 1)
     * @param tz {number} matrix cell value at index (3, 2)
     */
    constructor(x0, x1, x2, y0, y1, y2, z0, z1, z2, tx=0, ty=0, tz=0) {
        super();
        this.x0 = x0;
        this.x1 = x1;
        this.x2 = x2;
        this.y0 = y0;
        this.y1 = y1;
        this.y2 = y2;
        this.z0 = z0;
        this.z1 = z1;
        this.z2 = z2;
        this.tx = tx;
        this.ty = ty;
        this.tz = tz;
    }

    as_mat4() {
        return mat4.fromValues(
            this.x0, this.x1, this.x2, 0,
            this.y0, this.y1, this.y2, 0,
            this.z0, this.z1, this.z2, 0,
            this.tx, this.ty, this.tz, 1);
    }
}