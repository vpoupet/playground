function radians(angle) {
    return angle * Math.PI / 180;
}

class Style {
    constructor(attributes={}, transform=[]) {
        this.attributes = attributes;
        this.transform = transform;
        this.parent_transform = undefined;
        this.show_transform = true;
    }

    set(key, value) {
        this.attributes[key] = value;
        return this;
    }

    unset(key) {
        delete this.attributes[key];
        return this;
    }

    update(dict) {
        Object.assign(this.attributes, dict);
        return this;
    }

    copy() {
        let new_style = new Style();
        new_style.transform = [...this.transform];
        Object.assign(new_style.attributes, this.attributes);
        return new_style;
    }

    add_transform(t) {
        this.transform.unshift(t);
        return this;
    }

    pop_transform() {
        this.transform.shift();
        return this;
    }

    clear_transform() {
        this.transform.length = 0;
        return this;
    }

    translate(dx, dy) {
        this.add_transform(new Translate(dx, dy));
        return this;
    }

    rotate(angle, cx=0, cy=0) {
        this.add_transform(new Rotate(angle, cx, cy));
        return this;
    }

    scale(sx, sy=undefined) {
        this.add_transform(new Scale(sx, sy));
        return this;
    }

    skew_x(angle) {
        this.add_transform(new SkewX(angle));
        return this;
    }

    skew_y(angle) {
        this.add_transform(new SkewY(angle));
        return this;
    }

    transform2d(a, b, c, d, e=0, f=0) {
        this.add_transform(new Matrix(a, b, c, d, e, f));
        return this;
    }

    translate3d(dx, dy, dz) {
        return this.add_transform(new Translate3D(dx, dy, dz));
    }

    rotate_x(angle) {
        return this.add_transform(new RotateX(angle));
    }

    rotate_y(angle) {
        return this.add_transform(new RotateY(angle));
    }

    rotate_z(angle) {
        return this.add_transform(new RotateZ(angle));
    }

    scale3d(sx, sy=undefined, sz=undefined) {
        return this.add_transform(new Scale(sx, sy, sz));
    }

    transform3d(x0, x1, x2, y0, y1, y2, z0, z1, z2, tx=0, ty=0, tz=0) {
        return this.add_transform(new Matrix3D(x0, x1, x2, y0, y1, y2, z0, z1, z2, tx, ty, tz));
    }

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

class Tag {
    constructor(name) {
        this.name = name;
    }

    parameters_string() {
        return "";
    }
}

class SVG extends Tag {
    constructor(width, height) {
        super("svg");
        this.width = width;
        this.height = height;
    }

    parameters_string() {
        return `width="${this.width}" height="${this.height}"`;
    }
}

class Group extends Tag {
    constructor() {
        super("g");
    }
}

class Rectangle extends Tag {
    constructor(x, y, width, height, rx=0, ry=0) {
        super("rect");
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rx = rx;
        this.ry = ry;
    }

    parameters_string() {
        let r = `x="${this.x}" y="${this.y}" width="${this.width}" height="${this.height}"`;
        if (this.rx !== 0 || this.ry !== 0) {
            return r + ` rx="${this.rx}" ry="${this.ry}"`;
        } else {
            return r;
        }
    }
}

class Circle extends Tag {
    constructor(cx, cy, r) {
        super("circle");
        this.cx = cx;
        this.cy = cy;
        this.r = r;
    }

    parameters_string() {
        return `cx="${this.cx}" cy="${this.cy}" r="${this.r}"`;
    }
}

class Polyline extends Tag {
    constructor(points, is_closed=false) {
        if (is_closed) {
            super("polygon");
        } else {
            super("polyline");
        }
        this.points = points;
    }

    parameters_string() {
        return `points="${this.points.map(p => `${p[0]},${p[1]}`).join(' ')}"`;
    }
}

class Tag3D extends Tag {
    constructor(name) {
        super(name);
        this.is3d = true;
        this.parent_transform = undefined;
    }
}

class Polyline3D extends Tag3D {
    constructor(points, is_closed=false) {
        if (is_closed) {
            super("polygon");
        } else {
            super("polyline");
        }
        this.points = points;
    }

    parameters_string() {
        let points;
        if (this.parent_transform !== undefined) {
            points = this.points.map(p => this.parent_transform.apply_to(p));
        } else {
            points = this.points;
        }
        return `points="${points.map(p => `${p[0]},${p[1]}`).join(' ')}"`;
    }
}

class SVGNode {
    constructor(tag, style=new Style(), content=[]) {
        this.tag = tag;
        this.style = style;
        this.content = content;
    }

    set_name(name) {
        this.name = name;
    }

    get_by_name(name) {
        if (this.name === name) {
            return this;
        }
        for (let n of this.content) {
            let r = n.get_by_name(name);
            if (r !== undefined) {
                return r;
            }
        }
    }

    svg() {
        let inner_str = this.tag.name;
        let parameters_str = this.tag.parameters_string();
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

    add(element, style=new Style()) {
        if (element instanceof Tag) {
            this.content.push(new SVGNode(element, style));
        } else {
            this.content.push(element);
        }
    }

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

    propagate_transform3d() {
        if (this.style.has_transform3d()) {
            let matrix = this.style.get_transform3d();

            if (this.should_propagate_transform3d()) {
                this.style.show_transform = false;
                this.tag.parent_transform = matrix;
                for (let n of this.content) {
                    n.style.parent_transform = matrix;
                }
            }
        }
        if (this.should_propagate_transform3d()) {
            for (let n of this.content) {
                n.propagate_transform3d();
            }
        }
    }
}

class Transform {
    as_mat4() {
        return mat4.create();
    }
}

class Matrix extends Transform {
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

class Translate extends Transform {
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

class Rotate extends Transform {
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

class Scale extends Transform {
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

class SkewX extends Transform {
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

class SkewY extends Transform {
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

class Transform3D extends Transform {
    constructor(matrix=mat4.create()) {
        super();
        this.matrix = matrix;
    }

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

class Translate3D extends Transform3D {
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

class RotateX extends Transform3D {
    constructor(angle) {
        super();
        this.angle = angle;
    }

    as_mat4() {
        return mat4.fromXRotation(this.matrix, radians(this.angle));
    }
}

class RotateY extends Transform3D {
    constructor(angle) {
        super();
        this.angle = angle;
    }

    as_mat4() {
        return mat4.fromYRotation(this.matrix, radians(this.angle));
    }
}

class RotateZ extends Transform3D {
    constructor(angle) {
        super();
        this.angle = angle;
    }

    as_mat4() {
        return mat4.fromZRotation(this.matrix, radians(this.angle));
    }
}

class Scale3D extends Transform3D {
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

class Matrix3D extends Transform3D {
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