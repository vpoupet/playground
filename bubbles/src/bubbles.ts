export class Vector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    getMagnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector {
        const magnitude = this.getMagnitude();
        return new Vector(this.x / magnitude, this.y / magnitude);
    }

    add(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    subtract(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    multiply(scalar: number): Vector {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    distanceTo(other: Vector): number {
        return this.subtract(other).getMagnitude();
    }
}

export class Bubble {
    position: Vector;
    radius: number;
    velocity: Vector;
    color: string = '#262ecf';
    static ejectedSpeed: number = 500;
    static ejectedMassRatio = 1 / 20;

    constructor(position: Vector, radius: number, velocity: Vector) {
        this.position = position;
        this.radius = radius;
        this.velocity = velocity;
    }

    static getRadiusForMass(mass: number): number {
        return Math.sqrt(mass);
    }

    getMass(): number {
        return this.radius * this.radius;
    }

    setMass(mass: number): void {
        this.radius = Bubble.getRadiusForMass(mass);
    }

    getMomentum(): Vector {
        return this.velocity.multiply(this.getMass());
    }

    setMomentum(momentum: Vector): void {
        const mass = this.getMass();
        this.velocity = momentum.multiply(1 / mass);
    }

    update(dt: number): void {
        this.position = this.position.add(this.velocity.multiply(dt));
    }

    updateColor(playerBubble: Bubble): void {
        if (this.radius > playerBubble.radius) {
            this.color = '#c32626';
        } else {
            this.color = '#17a110';
        }
    }

    absorb(other: Bubble, deltaRadius: number): void {
        let deltaMass: number;
        if (deltaRadius >= other.radius) {
            deltaRadius = other.radius;
            deltaMass = other.getMass();
            other.radius = 0;
        } else {
            const otherInitialMass = other.getMass();
            other.radius -= deltaRadius;
            deltaMass = otherInitialMass - other.getMass();
        }
        const newMomentum = this.getMomentum().add(other.velocity.multiply(deltaMass));
        this.setMass(this.getMass() + deltaMass);
        this.setMomentum(newMomentum);
    }

    eject(direction: Vector): Bubble {
        const randomFactor = 1 - 0.6 * Math.random();
        const ejectedMass = this.getMass() * Bubble.ejectedMassRatio * randomFactor;
        const ejectedRadius = Bubble.getRadiusForMass(ejectedMass);
        this.setMass(this.getMass() - ejectedMass);

        const ejectedBubble = new Bubble(
            this.position.add(direction.multiply(this.radius + ejectedRadius)),
            ejectedRadius,
            this.velocity.add(direction.multiply(Bubble.ejectedSpeed))
        );
        this.setMomentum(this.getMomentum().subtract(ejectedBubble.getMomentum()));
        return ejectedBubble;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const grd = ctx.createRadialGradient(
            this.position.x,
            this.position.y,
            0,
            this.position.x,
            this.position.y,
            this.radius);
        grd.addColorStop(0.3, this.color + "00");
        grd.addColorStop(0.75, this.color + "00");
        grd.addColorStop(1, this.color);
        ctx.strokeStyle = this.color;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, .7 * this.radius, -3, -2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = .2 * this.radius;
        ctx.lineCap = "round";
        ctx.stroke();
    }
}

export class Arena {
    width: number;
    height: number;
    bubbles: Bubble[];
    playerBubble: Bubble;

    constructor(width: number, height: number, playerBubble: Bubble) {
        this.width = width;
        this.height = height;
        this.bubbles = [playerBubble];
        this.playerBubble = playerBubble;
    }

    bounce(bubble: Bubble): void {
        if (bubble.position.x - bubble.radius < 0) {
            bubble.position.x = bubble.radius;
            bubble.velocity.x = -bubble.velocity.x;
        } else if (bubble.position.x + bubble.radius > this.width) {
            bubble.position.x = this.width - bubble.radius;
            bubble.velocity.x = -bubble.velocity.x;
        }
        if (bubble.position.y - bubble.radius < 0) {
            bubble.position.y = bubble.radius;
            bubble.velocity.y = -bubble.velocity.y;
        } else if (bubble.position.y + bubble.radius > this.height) {
            bubble.position.y = this.height - bubble.radius;
            bubble.velocity.y = -bubble.velocity.y;
        }
    }

    update(dt: number): void {
        for (const bubble of this.bubbles) {
            bubble.update(dt);
            this.bounce(bubble);
            if (bubble !== this.playerBubble) {
                bubble.updateColor(this.playerBubble);
            }
        }
        for (let i = 0; i < this.bubbles.length; i++) {
            for (let j = i + 1; j < this.bubbles.length; j++) {
                const bubble1 = this.bubbles[i];
                const bubble2 = this.bubbles[j];
                const distance = bubble1.position.distanceTo(bubble2.position);
                if (distance < bubble1.radius + bubble2.radius) {
                    const deltaRadius = bubble1.radius + bubble2.radius - distance;
                    if (bubble1.radius >= bubble2.radius) {
                        bubble1.absorb(bubble2, deltaRadius);
                    } else {
                        bubble2.absorb(bubble1, deltaRadius);
                    }
                }
            }
        }
        this.bubbles = this.bubbles.filter(bubble => bubble.radius > 0);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = ctx.createLinearGradient(0, 0, 0, this.height);
        ctx.fillStyle.addColorStop(0, '#140b50');
        ctx.fillStyle.addColorStop(1, '#000000')
        ctx.fillRect(0, 0, this.width, this.height);
        for (const bubble of this.bubbles) {
            bubble.draw(ctx);
        }
    }
}