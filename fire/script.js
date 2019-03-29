let width = 320;
let height = 200;
let zoom = 3;
let context;
let imageData;
let data;

function draw() {
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = 4 * (i * width + j);
            data[p] = ~~(
                (data[(p + 4 * width - 4) % data.length] +
                data[(p + 4 * width) % data.length] +
                data[(p + 4 * width + 4) % data.length] +
                data[(p + 8 * width) % data.length])
                / 4.01
            );
        }
    }
    for (let i = 0; i < width; i++) {
        let p = 4 * (i + width * (height - 1));
        data[p] = ~~(Math.random() * 255);
    }
    context.putImageData(imageData, 0, 0);
    context.drawImage(canvas, 0, 0);
    requestAnimationFrame(draw);
}

window.onload = function() {
    let canvas = document.getElementById("main");
    canvas.width = zoom * width;
    canvas.height = zoom * height;
    context = canvas.getContext('2d');
    context.scale(3, 3);
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);
    imageData = context.getImageData(0, 0, width, height);
    data = imageData.data;
    draw();
};