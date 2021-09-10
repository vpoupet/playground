import {Link, MassSpringSystem, Node} from "./cloth.js";
import {Vector2, intersect} from "../geometry.js";

const STRUCTURAL_LINK_STRENGTH = 10;
const SHEAR_LINK_STRENGTH = 10;
const FLEXION_LINK_STRENGTH = 10;

const STRUCTURAL_LINK_STROKESTYLE = "#000000";
const SHEAR_LINK_STROKESTYLE = "#FF0000";
const FLEXION_LINK_STROKESTYLE = "#0000FF";

const STRUCTURAL_LINK_LINEWIDTH = 2;
const SHEAR_LINK_LINEWIDTH = .5;
const FLEXION_LINK_LINEWIDTH = .5;

let context;
let cloth;
let lastUpdate = 0;
let isMouseDown = false;
let lastMouseX = undefined;
let lastMouseY = undefined;



function update() {
    const now = Date.now() / 1000;
    cloth.update(Math.min(now - lastUpdate, 1/10));
    for (const node of cloth.nodes) {
        if (node.position.y > 800) {
            cloth.removeNode(node);
        }
    }
    lastUpdate = now;
    context.clearRect(0, 0, 800, 600);
    cloth.draw(context);
    window.requestAnimationFrame(update);
}

function makeCloth(nbNodesH, nbNodesV, linkLength) {
    const nodes = new Set();
    const links = new Set();
    const grid = [];
    // make nodes
    for (let i = 0; i < nbNodesV; i++) {
        const line = [];
        for (let j = 0; j < nbNodesH; j++) {
            const node = new Node(new Vector2(linkLength * j, linkLength * i));
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
            links.add(link);
        }
    }
    for (let i = 0; i < nbNodesV; i++) {
        for (let j = 1; j < nbNodesH; j++) {
            const link = new Link(grid[i][j - 1], grid[i][j], linkLength, STRUCTURAL_LINK_STRENGTH);
            link.strokeStyle = STRUCTURAL_LINK_STROKESTYLE;
            link.lineWidth = STRUCTURAL_LINK_LINEWIDTH;
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
    return cloth;
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 600;
    context = canvas.getContext("2d");
    cloth = makeCloth(31, 20, 20);
    for (const node of cloth.nodes) {
        node.position.x += 100;
    }
    // Fix position of some nodes
    cloth.grid[0][0].isFixed = true;
    cloth.grid[0][5].isFixed = true;
    cloth.grid[0][10].isFixed = true;
    cloth.grid[0][15].isFixed = true;
    cloth.grid[0][20].isFixed = true;
    cloth.grid[0][25].isFixed = true;
    cloth.grid[0][30].isFixed = true;

    canvas.addEventListener("pointerdown", e => {
        isMouseDown = true;
        const rect = e.target.getBoundingClientRect();
        lastMouseX = e.clientX - rect.x;
        lastMouseY = e.clientY - rect.y;
    });
    canvas.addEventListener("pointerleave", e => {
        isMouseDown = false;
        lastMouseX = undefined;
        lastMouseY = undefined;
    });
    canvas.addEventListener("pointerup", e => {
        isMouseDown = false;
        lastMouseX = undefined;
        lastMouseY = undefined;
    });
    canvas.addEventListener("pointermove", e => {
        if (isMouseDown) {
            const rect = e.target.getBoundingClientRect();
            const newMouseX = e.clientX - rect.x;
            const newMouseY = e.clientY - rect.x;
            for (const link of [...cloth.links]) {
                if (intersect(
                    link.node1.position,
                    link.node2.position,
                    new Vector2(lastMouseX, lastMouseY),
                    new Vector2(newMouseX, newMouseY)
                )) {
                    cloth.removeLink(link);
                }
            }
            lastMouseX = newMouseX;
            lastMouseY = newMouseY;
        }
    })

    update();
});