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

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    sub(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
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
}