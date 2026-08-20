// Dark ambient field, saturated halo.
//
// The ground is near-black with its ink only a few values lighter -- the pattern
// is present but ambient, so type can sit anywhere on it. Inside the halo the
// same pattern runs at full contrast. All the energy is in the shape; the frame
// stays quiet.
//
// The SHAPE and SCALE chain still holds, because those numbers have to match
// exactly at the handover or the pattern re-registers:
//
//     shape[i+1] == discShape[i]
//     scale[i+1] == scale[i] * discScale[i] * ZOOM        (ZOOM = 1.6)
//
// Colour is no longer chained: the outer disc lerps toward the next character's
// ground as it expands, so by full cover it already IS the next dark field.
//
// Ink is a PAIR. The stroke runs a gradient between the two along a slowly
// drifting diagonal -- cool at one end, warm at the other. A flat ink reads as
// print; a shifting one reads as anodised metal, which is where the futurism
// lives. Ground inks stay near the ground's value so the field stays ambient.
//
// Halo forms: circle, triangle, square, star. `haloForm` 1 is a regular polygon
// with `haloN` sides, so 3 and 4 were always available.

export const CHARACTERS = [
  {
    name: 'ORACLE',
    shape: 2.0, scale: 28.0,                      // elbow -- greek key
    groundA: '#424242', groundB: '#141414',
    inkA: '#4a5a66', inkB: '#63505f',            // ambient: steel -> mauve
    type: '#f2f0ed',
    haloForm: 0, haloN: 8, haloR: 0.26,
    discShape: 0.4, discScale: 0.5,
    discA: '#ff1d25', discB: '#8f0a12',
    discInkA: '#12060c', discInkB: '#2a0710',
  },
  {
    name: 'SIGNAL',
    shape: 0.4, scale: 22.4,                      // arc -- flowing
    groundA: '#3d3f41', groundB: '#111314',
    inkA: '#48585f', inkB: '#5f5350',
    type: '#f2f0ed',
    haloForm: 1, haloN: 3, haloR: 0.32,           // triangle
    discShape: 1.6, discScale: 0.45,
    discA: '#ff8a1c', discB: '#9c3d02',
    discInkA: '#170e02', discInkB: '#2b0f0a',
  },
  {
    name: 'KIN',
    shape: 1.6, scale: 16.1,                      // chord -- blocky
    groundA: '#3c3a36', groundB: '#121110',
    inkA: '#43524f', inkB: '#585045',
    type: '#f2f0ed',
    haloForm: 1, haloN: 4, haloR: 0.27,           // square
    discShape: 2.4, discScale: 0.75,
    discA: '#16a06f', discB: '#06392a',
    discInkA: '#d8fff2', discInkB: '#fff2d9',     // light on deep green
  },
  {
    name: 'AFRICANA',
    shape: 2.4, scale: 19.35,                     // step -- circuit
    groundA: '#3a363d', groundB: '#111015',
    inkA: '#454f61', inkB: '#5b4657',
    type: '#f2f0ed',
    haloForm: 2, haloN: 8, haloR: 0.30,           // star
    discShape: 2.0, discScale: 0.9043,
    discA: '#8a4bff', discB: '#2b0f68',
    discInkA: '#e2e8ff', discInkB: '#ffe6f4',
  },
];
