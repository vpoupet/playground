import {BoneLine} from "./bones.js";
import {Node, Link, Cloth} from "./cloth.js";
import {Vector2} from "./geometry.js";

let context;
let cloth;
let lastUpdate = 0;
const target = new Vector2(800, 600);
const anchor = new Vector2(400, 300);
const boneLine = new BoneLine(new Array(50).fill(10));


// function update() {
//     boneLine.solve(anchor, target, 5);
//     context.clearRect(0, 0, 800, 600);
//     boneLine.draw(context);
//     window.requestAnimationFrame(update);
// }


function update() {
    const now = Date.now();
    cloth.update(Math.min(1/20, now - lastUpdate));
    lastUpdate = now;
    context.clearRect(0, 0, 800, 600);
    cloth.draw(context);
    window.requestAnimationFrame(update);

}

// window.addEventListener("load", () => {
//     const canvas = document.getElementById("canvas");
//     canvas.width = 800;
//     canvas.height = 600;
//     context = canvas.getContext("2d");
//
//     canvas.addEventListener("mousemove", (e) => {
//         const rect = e.target.getBoundingClientRect();
//         target.x = e.clientX - rect.x;
//         target.y = e.clientY - rect.y;
//     });
//
//     update();
// });

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 600;
    context = canvas.getContext("2d");

    const nodes = [];
    const links = [];
    const nbNodesHeight = 50;
    const nbNodesWidth = 80;
    const linkLength = 10;
    const linkStrength = 10;
    for (let i = 0; i < nbNodesHeight; i++) {
        for (let j = 0; j < nbNodesWidth; j++) {
            nodes.push(new Node(new Vector2(linkLength * j, linkLength * i), 1));
            if (j > 0) {
                links.push(new Link(nodes[i * nbNodesWidth + j - 1], nodes[i * nbNodesWidth + j], linkLength, linkStrength));
            }
            if (i > 0) {
                links.push(new Link(nodes[(i - 1) * nbNodesWidth + j], nodes[i * nbNodesWidth + j], linkLength, linkStrength));
            }
        }
    }
    nodes[0].isFixed = true;
    nodes[10].isFixed = true;
    nodes[20].isFixed = true;
    nodes[30].isFixed = true;
    nodes[40].isFixed = true;
    nodes[50].isFixed = true;
    nodes[60].isFixed = true;
    nodes[70].isFixed = true;
    cloth = new Cloth(nodes, links);

    update();
});