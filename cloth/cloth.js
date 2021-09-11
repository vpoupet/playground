import {Vector2} from "../geometry.js";

const GRAVITY = 200;
const DAMPING_COEFF = 1;

const STRUCTURAL_LINK_STRENGTH = 10;
const SHEAR_LINK_STRENGTH = 10;
const FLEXION_LINK_STRENGTH = 10;

const STRUCTURAL_LINK_STROKESTYLE = "#000000";
const SHEAR_LINK_STROKESTYLE = "#FF0000";
const FLEXION_LINK_STROKESTYLE = "#0000FF";

const STRUCTURAL_LINK_LINEWIDTH = 2;
const SHEAR_LINK_LINEWIDTH = .5;
const FLEXION_LINK_LINEWIDTH = .5;

export class Node {
    constructor(position, isFixed = false, color = "#0000FF") {
        this.position = position;
        this.speed = new Vector2();
        this.links = new Set();
        this.isFixed = isFixed;
        this.color = color;
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

    hasLinkTo(other) {
        for (const link of this.links) {
            if (link.node1 === other || link.node2 === other) {
                return true;
            }
        }
        return false;
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
        this.isStructural = false;
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

function fillPolygon(nodes, color, context) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(nodes[0].position.x, nodes[0].position.y);
    for (let i = 1; i < nodes.length; i++) {
        context.lineTo(nodes[i].position.x, nodes[i].position.y);
    }
    context.closePath();
    context.fill();
}

export class Cloth extends MassSpringSystem {
    constructor(nbNodesH, nbNodesV, linkLength) {
        const nodes = new Set();
        const links = new Set();
        const grid = [];
        // make nodes
        for (let i = 0; i < nbNodesV; i++) {
            const line = [];
            for (let j = 0; j < nbNodesH; j++) {
                const node = new Node(new Vector2(linkLength * j, linkLength * i));
                node.rowIndex = i;
                node.columnIndex = j;
                nodes.add(node);
                line.push(node);
            }
            grid.push(line);
        }
        // make structural links
        for (let i = 1; i < nbNodesV; i++) {
            for (let j = 0; j < nbNodesH; j++) {
                const link = new Link(grid[i - 1][j], grid[i][j], linkLength, STRUCTURAL_LINK_STRENGTH);
                link.strokeStyle = STRUCTURAL_LINK_STROKESTYLE;
                link.lineWidth = STRUCTURAL_LINK_LINEWIDTH;
                link.isStructural = true;
                links.add(link);
            }
        }
        for (let i = 0; i < nbNodesV; i++) {
            for (let j = 1; j < nbNodesH; j++) {
                const link = new Link(grid[i][j - 1], grid[i][j], linkLength, STRUCTURAL_LINK_STRENGTH);
                link.strokeStyle = STRUCTURAL_LINK_STROKESTYLE;
                link.lineWidth = STRUCTURAL_LINK_LINEWIDTH;
                link.isStructural = true;
                links.add(link);
            }
        }
        // make shear links
        const shearLinkLength = Math.sqrt(2) * linkLength;
        for (let i = 1; i < nbNodesV; i++) {
            for (let j = 1; j < nbNodesH; j++) {
                const link = new Link(grid[i - 1][j - 1], grid[i][j], shearLinkLength, SHEAR_LINK_STRENGTH);
                link.strokeStyle = SHEAR_LINK_STROKESTYLE;
                link.lineWidth = SHEAR_LINK_LINEWIDTH;
                links.add(link);
            }
        }
        for (let i = 0; i < nbNodesV - 1; i++) {
            for (let j = 1; j < nbNodesH; j++) {
                const link = new Link(grid[i][j], grid[i + 1][j - 1], shearLinkLength, SHEAR_LINK_STRENGTH);
                link.strokeStyle = SHEAR_LINK_STROKESTYLE;
                link.lineWidth = SHEAR_LINK_LINEWIDTH;
                links.add(link);
            }
        }
        // make flexion links
        for (let i = 2; i < nbNodesV; i++) {
            for (let j = 0; j < nbNodesH; j++) {
                const link = new Link(grid[i - 2][j], grid[i][j], 2 * linkLength, FLEXION_LINK_STRENGTH, false);
                link.strokeStyle = FLEXION_LINK_STROKESTYLE;
                link.lineWidth = FLEXION_LINK_LINEWIDTH;
                links.add(link);
            }
        }
        for (let i = 0; i < nbNodesV; i++) {
            for (let j = 2; j < nbNodesH; j++) {
                const link = new Link(grid[i][j - 2], grid[i][j], 2 * linkLength, FLEXION_LINK_STRENGTH, false);
                link.strokeStyle = FLEXION_LINK_STROKESTYLE;
                link.lineWidth = FLEXION_LINK_LINEWIDTH;
                links.add(link);
            }
        }
        const cloth = new MassSpringSystem(nodes, links);
        cloth.grid = grid;

        super(nodes, links);
        this.grid = grid;
    }

    draw(context, shouldDrawLinks=true, shouldDrawTexture=true) {
        if (shouldDrawTexture) {
            for (let i = 0; i < this.grid.length - 1; i++) {
                for (let j = 0; j < this.grid[0].length - 1; j++) {
                    const n0 = this.grid[i][j];
                    const n1 = this.grid[i + 1][j];
                    const n2 = this.grid[i + 1][j + 1];
                    const n3 = this.grid[i][j + 1];
                    if (n0.hasLinkTo(n1) && n1.hasLinkTo(n2) && n2.hasLinkTo(n3) && n3.hasLinkTo(n0)) {
                        fillPolygon([n0, n1, n2, n3], n0.color, context);
                    } else {
                        if (n0.hasLinkTo(n1) && n1.hasLinkTo(n2)) {
                            fillPolygon([n0, n1, n2], n0.color, context);
                        }
                        if (n1.hasLinkTo(n2) && n2.hasLinkTo(n3)) {
                            fillPolygon([n1, n2, n3], n0.color, context);
                        }
                        if (n2.hasLinkTo(n3) && n3.hasLinkTo(n0)) {
                            fillPolygon([n2, n3, n0], n0.color, context);
                        }
                        if (n3.hasLinkTo(n0) && n0.hasLinkTo(n1)) {
                            fillPolygon([n3, n0, n1], n0.color, context);
                        }

                    }
                }
            }
        }
        if (shouldDrawLinks) {
            super.draw(context);
        }
    }

}