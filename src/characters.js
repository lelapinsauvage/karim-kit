// A chain, not a set. Each character's GROUND is the previous character's DISC,
// and its INK is the previous character's DISC INK. That is what lets the
// changeover run forward only: the disc grows until it is the whole field --
// which is already the next character's ground -- and the next disc is then
// born from zero at the centre. Nothing ever travels back.
//
// The last entry's disc closes the loop onto the first entry's ground.

export const CHARACTERS = [
  {
    name: 'ORACLE',
    shape: 2.0,                                   // elbow -- greek key
    scale: 9,
    groundA: '#fde67e', groundB: '#f7d95e',       // acid yellow
    ink: '#8fd78d',
    type: '#1b1a12',                              // reserved for type
    haloForm: 0, haloN: 8, haloR: 0.34,
    discShape: 0.4, discScale: 1.8,
    discInk: '#ffd166',
    discA: '#ff3d8b', discB: '#8a1f6a',           // -> SIGNAL's ground
  },
  {
    name: 'SIGNAL',
    shape: 0.2,                                   // arc -- flowing
    scale: 7,
    groundA: '#ff3d8b', groundB: '#8a1f6a',
    ink: '#ffd166',
    type: '#fff3d6',
    haloForm: 0, haloN: 6, haloR: 0.40,
    discShape: 1.6, discScale: 1.2,
    discInk: '#f4efe3',
    discA: '#1f8f6b', discB: '#0d4436',           // -> KIN's ground
  },
  {
    name: 'KIN',
    shape: 1.0,                                   // chord -- blocky
    scale: 12,
    groundA: '#1f8f6b', groundB: '#0d4436',
    ink: '#f4efe3',
    type: '#f4efe3',
    haloForm: 1, haloN: 6, haloR: 0.36,           // hexagon
    discShape: 2.4, discScale: 2.2,
    discInk: '#ffb3c7',
    discA: '#c8102e', discB: '#6b0715',           // -> AFRICANA's ground
  },
  {
    name: 'AFRICANA',
    shape: 2.6,                                   // step -- circuit
    scale: 10,
    groundA: '#c8102e', groundB: '#6b0715',
    ink: '#ffb3c7',
    type: '#fff0f3',
    haloForm: 2, haloN: 8, haloR: 0.44,           // star
    discShape: 0.0, discScale: 0.7,
    discInk: '#8fd78d',                           // -> ORACLE's ink
    discA: '#fde67e', discB: '#f7d95e',           // -> ORACLE's ground. loop closed.
  },
];
