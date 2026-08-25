// Public surface of the kit. Import from here rather than reaching into src/,
// so a consuming project depends on names rather than on file paths.
export { scene } from './src/scene.js';
export { quad, hexToRgb } from './src/gl.js';
export { panel, applySun, SUN_RANGE, SUN_GROUPS, SUN_UNIFORM, SUN_COLOUR,
         SUN_NEUTRAL, SUN_OFF } from './src/panel.js';
export { paletteFrom, rolesFrom, swatchStrip, rgb2hsv, hsv2rgb, toHex } from './src/palette.js';
export { HOUSE, CHARACTERS } from './src/house.js';
