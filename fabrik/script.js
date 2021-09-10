import {BoneLine} from "./bones.js";
import {Vector2} from "../geometry.js";

let context;
const target = new Vector2(800, 600);
const anchor = new Vector2(400, 300);
const boneLine = new BoneLine(new Array(50).fill(10));

function update() {
    boneLine.solve(anchor, target, 5);
    context.clearRect(0, 0, 800, 600);
    boneLine.draw(context);
    window.requestAnimationFrame(update);
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 600;
    context = canvas.getContext("2d");

    canvas.addEventListener("mousemove", (e) => {
        const rect = e.target.getBoundingClientRect();
        target.x = e.clientX - rect.x;
        target.y = e.clientY - rect.y;
    });

    update();
});