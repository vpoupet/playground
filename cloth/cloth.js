import {Vector2} from "../geometry.js";

const GRAVITY = 200;
const DAMPING_COEFF = 1;

export class Node {
    constructor(position, isFixed = false) {
        this.position = position;
        this.speed = new Vector2();
        this.links = new Set();
        this.isFixed = isFixed;
    }

    resetForce() {
        this.force = new Vector2(0, GRAVITY);
        this.force.add(this.speed.scaled(-DAMPING_COEFF))
    }

    updatePosition(deltaTime) {
        if (!this.isFixed) {
            this.speed.add(this.force.scaled(deltaTime));
            this.position.add(this.speed.scaled(deltaTime));
        }
    }

    draw(context) {
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(this.position.x, this.position.y, 2, 0, 2 * Math.PI, false);
        context.fill();
    }
}


export class Link {
    constructor(node1, node2, length, strength) {
        this.node1 = node1;
        this.node2 = node2;
        this.length = length;
        this.strength = strength;
        this.shouldDraw = true;
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this.node1.links.add(this);
        this.node2.links.add(this);
    }

    updateForces() {
        const p1 = this.node1.position;
        const p2 = this.node2.position;
        const d = Math.min(p1.distanceTo(p2) - this.length, 10);
        if (d > 0) {
            const u = p2.subtraction(p1);
            this.node1.force.add(u.scaled(d * this.strength));
            this.node2.force.add(u.scaled(-d * this.strength));
        }
    }

    draw(context) {
        if (this.shouldDraw) {
            context.strokeStyle = this.strokeStyle;
            context.lineWidth = this.lineWidth;
            context.beginPath();
            context.moveTo(...this.node1.position.asTuple());
            context.lineTo(...this.node2.position.asTuple());
            context.stroke();
        }
    }
}


export class MassSpringSystem {
    constructor(nodes, links) {
        this.nodes = nodes;
        this.links = links;
    }

    update(deltaTime) {
        for (const node of this.nodes) {
            node.resetForce();
        }
        for (const link of this.links) {
            link.updateForces();
        }
        for (const node of this.nodes) {
            node.updatePosition(deltaTime);
        }
    }

    draw(context) {
        for (const link of this.links) {
            link.draw(context);
        }
        for (const node of this.nodes) {
            node.draw(context);
        }
    }

    removeNode(node) {
        for (const link of [...node.links]) {
            this.removeLink(link);
        }
    }

    removeLink(link) {
        const node1 = link.node1;
        const node2 = link.node2;
        this.links.delete(link);
        node1.links.delete(link);
        if (node1.links.size === 0) {
            this.nodes.delete(node1);
        }
        node2.links.delete(link);
        if (node2.links.size === 0) {
            this.nodes.delete(node2);
        }
    }
}
