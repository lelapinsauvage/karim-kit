// Public surface of the kit. Import from here rather than reaching into src/,
// so a consuming project depends on names rather than on file paths.
export { quad, hexToRgb } from './src/gl.js';
export { panel, SUN_RANGE, SUN_GROUPS, SUN_UNIFORM } from './src/panel.js';
