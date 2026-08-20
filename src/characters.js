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

export const CHARACTERS = [
  {
    name: 'ORACLE',
    shape: 2.0, scale: 28.0,                      // elbow -- greek key
    groundA: '#424242', groundB: '#141414',
    ink: '#565656',                               // ambient: barely above ground
    type: '#f2f0ed',
    haloForm: 0, haloN: 8, haloR: 0.26,
    discShape: 0.4, discScale: 0.5,
    discA: '#ff1d25', discB: '#8f0a12',
    discInk: '#180507',                           // near-black on red: full contrast
  },
  {
    name: 'SIGNAL',
    shape: 0.4, scale: 22.4,                      // arc -- flowing
    groundA: '#3d3f41', groundB: '#111314',
    ink: '#515456',
    type: '#f2f0ed',
    haloForm: 0, haloN: 6, haloR: 0.28,
    discShape: 1.6, discScale: 0.45,
    discA: '#ff8a1c', discB: '#9c3d02',
    discInk: '#1a0d00',
  },
  {
    name: 'KIN',
    shape: 1.6, scale: 16.1,                      // chord -- blocky
    groundA: '#3c3a36', groundB: '#121110',
    ink: '#4f4c46',
    type: '#f2f0ed',
    haloForm: 1, haloN: 6, haloR: 0.26,           // hexagon
    discShape: 2.4, discScale: 0.75,
    discA: '#16a06f', discB: '#06392a',
    discInk: '#eafff5',                           // light on deep green
  },
  {
    name: 'AFRICANA',
    shape: 2.4, scale: 19.35,                     // step -- circuit
    groundA: '#3a363d', groundB: '#111015',
    ink: '#4c4753',
    type: '#f2f0ed',
    haloForm: 2, haloN: 8, haloR: 0.30,           // star
    discShape: 2.0, discScale: 0.9043,
    discA: '#8a4bff', discB: '#2b0f68',
    discInk: '#f1e9ff',
  },
];
