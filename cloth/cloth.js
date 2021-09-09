import {Vector2} from "./geometry.js";

export class Node {
    constructor(position, mass, isFixed = false) {
        this.mass = mass;
        this.position = position;
        this.speed = new Vector2();
        this.links = [];
        this.isFixed = isFixed;
    }

    resetForce() {
        this.force = new Vector2(0, 1).scaled(this.mass);
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
    }

    updateForces() {
        const p1 = this.node1.position;
        const p2 = this.node2.position;
        const d = p1.distanceTo(p2) - this.length;
        const u = p2.subtraction(p1);
        if (d > 0) {
            this.node1.force.add(u.scaled(d * this.strength));
            this.node2.force.add(u.scaled(-d * this.strength));
        }
    }

    draw(context) {
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(...this.node1.position.asTuple());
        context.lineTo(...this.node2.position.asTuple());
        context.stroke();
    }
}


export class Cloth {
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
        for(const link of this.links) {
            link.draw(context);
        }
        for(const node of this.nodes) {
            node.draw(context);
        }
    }
}