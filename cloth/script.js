import {BoneLine} from "./bones.js";
import {Vector2} from "./geometry.js";

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext("2d");

    const boneLine = new BoneLine([40, 40, 40, 40, 40, 40, 40]);

    canvas.addEventListener("mousemove", (e) => {
        context.clearRect(0, 0, 800, 600);
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        boneLine.solve(new Vector2(400, 300), new Vector2(x, y), 5);
        boneLine.draw(context);
    });
});