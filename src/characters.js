// A chain, not a set. Each character's GROUND is the previous character's DISC
// in EVERY respect -- colours, ink, tile family and scale. Chaining only the
// colours left the pattern to snap at the handover, which read as the frame
// suddenly zooming. So:
//
//     shape[i+1] == discShape[i]
//     scale[i+1] == scale[i] * discScale[i]
//
// and the discScale factors multiply to 1.0 around the loop (2.0 * 0.6 * 1.8 * 0.46296) so the scale returns exactly to where it began after four steps. That is what lets the
// changeover run forward only: the disc grows until it is the whole field --
// which is already the next character's ground -- and the next disc is then
// born from zero at the centre. Nothing ever travels back.
//
// The last entry's disc closes the loop onto the first entry's ground.

export const CHARACTERS = [
  {
    name: 'ORACLE',
    shape: 2.0,                                   // elbow -- greek key
    scale: 28.0,
    groundA: '#fde67e', groundB: '#f7d95e',       // acid yellow
    ink: '#8fd78d',
    type: '#1b1a12',                              // reserved for type
    haloForm: 0, haloN: 8, haloR: 0.34,
    discShape: 0.4, discScale: 0.5,
    discInk: '#ffd166',
    discA: '#ff3d8b', discB: '#8a1f6a',           // -> SIGNAL's ground
  },
  {
    name: 'SIGNAL',
    shape: 0.4,                                   // arc -- flowing
    scale: 22.4,
    groundA: '#ff3d8b', groundB: '#8a1f6a',
    ink: '#ffd166',
    type: '#fff3d6',
    haloForm: 0, haloN: 6, haloR: 0.40,
    discShape: 1.6, discScale: 0.45,
    discInk: '#f4efe3',
    discA: '#1f8f6b', discB: '#0d4436',           // -> KIN's ground
  },
  {
    name: 'KIN',
    shape: 1.6,                                   // chord -- blocky
    scale: 16.1,
    groundA: '#1f8f6b', groundB: '#0d4436',
    ink: '#f4efe3',
    type: '#f4efe3',
    haloForm: 1, haloN: 6, haloR: 0.36,           // hexagon
    discShape: 2.4, discScale: 0.75,
    discInk: '#ffb3c7',
    discA: '#c8102e', discB: '#6b0715',           // -> AFRICANA's ground
  },
  {
    name: 'AFRICANA',
    shape: 2.4,                                   // step -- circuit
    scale: 19.35,
    groundA: '#c8102e', groundB: '#6b0715',
    ink: '#ffb3c7',
    type: '#fff0f3',
    haloForm: 2, haloN: 8, haloR: 0.44,           // star
    discShape: 2.0, discScale: 0.9043,
    discInk: '#8fd78d',                           // -> ORACLE's ink
    discA: '#fde67e', discB: '#f7d95e',           // -> ORACLE's ground. loop closed.
  },
];
