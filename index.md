# Description

This projects is a collection of small experimentations with web technologies (mostly *Javascript*)

## [Rubik's Cube](./cube/index.html)

TODO: Description

## [Dithering](./dithering/index.html)

Implementation of [Floyd-Steinberg dithering](https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering) in
*Javascript* following a [Coding Train coding challenge](https://www.youtube.com/watch?v=0L2n8Tg2FwI).

The original tutorial used the [*p5.js*](https://p5js.org/) library but it is here implemented directly in an HTML
canvas by manipulating the pixels in the `ImageData`.

The original image is on the left. The central canvas is the result of the dithering algorithm on each component
(each color component is either 0 or 255, for a total of 8 colors), the rightmost one is performed on a greyscaled
version of the image resulting in an image with fully white or fully black pixels only.


## [Autostereogram](./stereogram/index.html)

Generation of 3D [autostereogram](https://en.wikipedia.org/wiki/Autostereogram) from a greyscale depth map.

The user can choose one of the available depth maps and tiles or upload files.

* The depth map image should represent a 3D object by representing the depth of a pixel by its intensity (brightest in 
front). If the image is a colored image, only the red component is considered.
* The tile image is used to produce the stereogram (by repeating the tile with horizontal shifts of pixels depending 
on depth). It is preferable to use a small (less than 128px) tilable pattern.


## [Perlin Flight](./flight/index.html)

Travel across a wireframe landscape randomly generated from [Perlin noise](https://en.wikipedia.org/wiki/Perlin_noise).

This script uses the [*p5.js*](https://p5js.org/) library for drawing the wireframe landscape and for its Perlin noise
generator.

Direction of movement can be controlled by the position of the hovering mouse cursor on the canvas (position relative
to the center).

## [Recaman Sequence](./recaman/index.html)

Visual representation of the [Recamán sequence](https://oeis.org/A005132) (as presented in a [Coding Train coding 
challenge](https://www.youtube.com/watch?v=DhFZfzOvNTU)).
