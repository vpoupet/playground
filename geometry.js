export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    asTuple() {
        return [this.x, this.y];
    }

    moveTo(target) {
        this.x = target.x;
        this.y = target.y;
    }

    squareNorm() {
        return this.x * this.x + this.y * this.y;
    }

    norm() {
        return Math.sqrt(this.squareNorm());
    }

    distanceTo(other) {
        return this.subtraction(other).norm();
    }

    addition(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    subtraction(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
    }

    normalize(length = 1) {
        const scale = length / this.norm();
        this.x *= scale;
        this.y *= scale;
    }

    normalized(length = 1) {
        const scale = length / this.norm();
        return new Vector2(this.x * scale, this.y * scale);
    }

    scale(coefficient) {
        this.x *= coefficient;
        this.y *= coefficient;
    }

    scaled(coefficient) {
        return new Vector2(this.x * coefficient, this.y * coefficient);
    }

    clamp(size) {
        if (this.norm() > size) {
            this.normalize(size);
        }
    }

    clamped(size) {
        if (this.norm() > size) {
            return this.normalized(size);
        }
        return new Vector2(this.x, this.y);
    }
}

function ccw(p1, p2, p3) {
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
}

export function intersect(p1, p2, p3, p4) {
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}