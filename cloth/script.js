import {Cloth} from "./cloth.js";
import {Vector2, intersect} from "../geometry.js";

let context;
let cloth;
let lastUpdate = 0;
let isMouseDown = false;
let lastMouseX = undefined;
let lastMouseY = undefined;
let shouldDrawLinks = document.getElementById("linksCheckBox").checked;
let shouldDrawTexture = document.getElementById("textureCheckBox").checked;


function update() {
    const now = Date.now() / 1000;
    cloth.update(Math.min(now - lastUpdate, 1/10));
    for (const node of cloth.nodes) {
        if (node.position.y > 800) {
            cloth.removeNode(node);
        }
    }
    lastUpdate = now;
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, 800, 600);
    cloth.draw(context, shouldDrawLinks, shouldDrawTexture);
    window.requestAnimationFrame(update);
}

function reset() {
    cloth = new Cloth(31, 21, 20);

    const pattern = `\
..............................
..............................
..............................
........w....yyyyy....w.......
.......ww...yyyyyyy...ww......
.........w.yyyyyyyyy.w........
..........wrrrrrrrrrw.........
........yyyyyyyyyyyyyyy.......
...........w...w...w..........
...........w...w...w..........
...........ww.www.ww..........
............www.www...........
...........w.wwwww.w..........
..........w.........w.........
.........w..wwwwwww..w........
.......ww...w.....w...ww......
........w....wwwww....w.......
..............................
..............................
..............................
`.split('\n');

    for (let i = 0; i < cloth.grid.length; i++) {
        for (let j = 0; j < cloth.grid[0].length; j++) {
            const node = cloth.grid[i][j];
            switch (pattern[i][j]) {
                case 'w':
                    node.color = '#CCCCCC';
                    break;
                case 'y':
                    node.color = '#FFFF00';
                    break;
                case 'r':
                    node.color = '#FF0000';
                    break;
                default:
                    node.color = '#000000';
            }
            node.position.x += 100;
        }
    }
    // Fix position of some nodes
    cloth.grid[0][0].isFixed = true;
    cloth.grid[0][5].isFixed = true;
    cloth.grid[0][10].isFixed = true;
    cloth.grid[0][15].isFixed = true;
    cloth.grid[0][20].isFixed = true;
    cloth.grid[0][25].isFixed = true;
    cloth.grid[0][30].isFixed = true;
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 600;
    context = canvas.getContext("2d");

    canvas.addEventListener("pointerdown", e => {
        isMouseDown = true;
        const rect = canvas.getBoundingClientRect();
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
            const rect = canvas.getBoundingClientRect();
            const newMouseX = e.clientX - rect.x;
            const newMouseY = e.clientY - rect.y;
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

    document.getElementById("linksCheckBox").addEventListener("change", e => {
        shouldDrawLinks = e.target.checked;
    });
    document.getElementById("textureCheckBox").addEventListener("change", e => {
        shouldDrawTexture = e.target.checked;
    });
    document.getElementById("resetButton").addEventListener("click", reset);
    reset();
    update();
});