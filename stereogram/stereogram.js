let intensity = .25;
let depthMap;
let tile;


function makeStereogram(depthMap, tile) {
    if (depthMap.width === 0 || tile.width === 0) {
        // depth map or tile not yet loaded
        return;
    }

    // get depth map data
    let width = depthMap.width;
    let height = depthMap.height;
    let depthCanvas = document.createElement("canvas");
    depthCanvas.width = width;
    depthCanvas.height = height;
    let depthContext = depthCanvas.getContext("2d", {alpha: false});
    depthContext.drawImage(depthMap, 0, 0);
    let depthData = depthContext.getImageData(0, 0, width, height);
    let depthBuffer = depthData.data;

    // get tile info
    let tileWidth = tile.width;
    let tileHeight = tile.height;

    // prepare target context
    let canvas = document.getElementById('stereogram');
    canvas.width = width;
    canvas.height = height;
    let context = canvas.getContext("2d", {alpha: false});
    // draw first two tile columns
    for (let i = 0; i < height; i += tileHeight) {
        context.drawImage(tile, 0, i);
        context.drawImage(tile, tileWidth, i);
    }
    // get target buffer
    let imageData = context.getImageData(0, 0, width, height);
    let buffer = imageData.data;

    // make stereogram
    let nbShift = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let shift = ~~(depthBuffer[4 * (x + width * y)] * intensity) - tileWidth;
            if (shift !== -tileWidth) {
                nbShift += 1;
            }
            if (0 <= x + shift && x + shift < width) {
                let offset = (x + width * y) << 2;
                let offset_shift = (x + shift + width * y) << 2;
                buffer[offset] = buffer[offset_shift];
                buffer[offset + 1] = buffer[offset_shift + 1];
                buffer[offset + 2] = buffer[offset_shift + 2];
                buffer[offset + 3] = 255;
            }
        }
    }
    context.putImageData(imageData, 0, 0);
}


function updateDepthMap(event) {
    let url;
    if (event.target.tagName === 'SELECT') {
        let select = document.getElementById('depth_select');
        url = select.options[select.selectedIndex].value;
    } else {
        let picker = document.getElementById('depth_picker');
        url = window.URL.createObjectURL(picker.files[0]);
    }
    depthMap.src = url;
}


function updateTile(event) {
    let url;
    if (event.target.tagName === 'SELECT') {
        let select = document.getElementById('tile_select');
        url = select.options[select.selectedIndex].value;
    } else {
        let picker = document.getElementById('tile_picker');
        url = window.URL.createObjectURL(picker.files[0]);
    }
    tile.src = url;
}


window.onload = function () {
    // depth map image
    depthMap = new Image();
    depthMap.onload = function () {
        makeStereogram(depthMap, tile);
    };
    depthMap.src = document.getElementById('depth_select').options[0].value;

    // tile image
    tile = new Image();
    tile.onload = function() {
        makeStereogram(depthMap, tile);
    };
    tile.src = document.getElementById('tile_select').options[0].value;

    // selectors
    document.getElementById("depth_picker").addEventListener('change', updateDepthMap, false);
    document.getElementById("depth_select").addEventListener('change', updateDepthMap, false);
    document.getElementById("tile_picker").addEventListener('change', updateTile, false);
    document.getElementById("tile_select").addEventListener('change', updateTile, false);
};
