window.onload = function() {
    // the original image
    let image = document.getElementById("image");
    let description = document.getElementById('description');

    let canvas, context, imageData;

    // create and display a new canvas on page
    canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    document.body.insertBefore(canvas, description);
    // get canvas context and draw image in canvas
    context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    // extract image data from context
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // draw a dithered version of the image data in canvas
    dither(imageData);
    context.putImageData(imageData, 0, 0);


    // create and display a new canvas on page
    canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    document.body.insertBefore(canvas, description);
    // get canvas context and draw image in canvas
    context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    // extract image data from context
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // draw a grayscaled and dithered version of the image data in canvas
    grayscale(imageData);
    dither(imageData);
    context.putImageData(imageData, 0, 0);
};


/**
 * Returns the gray intensity corresponding to a RGB pixel representation
 * (see https://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale)
 * @param r red component
 * @param g green component
 * @param b blue component
 * @returns {number} a weighted sum of the components
 */
function gray(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}


/**
 * Converts a color imageData into a grayscale version
 * @param imageData the imageData to convert
 */
function grayscale(imageData) {
    let pixels = imageData.data;    // pixels array

    function index(x, y) {
        // get the pixel index in array
        return 4 * (imageData.width * y + x);
    }

    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            let i = gray(pixels[index(x, y)], pixels[index(x, y) + 1], pixels[index(x, y) + 2]);
            pixels[index(x, y)] = i;
            pixels[index(x, y) + 1] = i;
            pixels[index(x, y) + 2] = i;
        }
    }
}


/**
 * Converts an imageData into a dithered version, for which all components of all pixels are either 0 or 255
 * @param imageData the imageData to convert
 */
function dither(imageData) {
    let pixels = imageData.data;    // pixels array

    function index(x, y) {
        // get the pixel index in array
        return 4 * (imageData.width * y + x);
    }

    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            for (let c = 0; c < 3; c++) {
                // loop through all components
                let old_value = pixels[index(x, y) + c];    // original component value
                let new_value = (old_value < 128 ? 0 : 255);    // new value (rounded up or down to 0 or 255)
                let error_value = old_value - new_value;    // difference due to rounding

                // transfer the difference to the neighboring pixels
                // (see https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering)
                pixels[index(x, y) + c] = new_value;
                pixels[index(x + 1, y) + c] += error_value * 7 / 16;
                pixels[index(x - 1, y + 1) + c] += error_value * 3 / 16;
                pixels[index(x, y + 1) + c] += error_value * 5 / 16;
                pixels[index(x + 1, y + 1) + c] += error_value / 16;
            }
        }
    }
}
