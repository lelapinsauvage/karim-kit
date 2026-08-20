// Each character owns the whole field, not just a portrait. The background IS
// the character: its tile family, its palette, and the form of its halo.
// Swapping characters tweens every one of these at once.
//
// figure: path to a transparent-background cutout, or null for a silhouette
// placeholder until the real asset exists.

export const CHARACTERS = [
  {
    name: 'ORACLE',
    figure: '/src/figures/oracle.png',
    shape: 2.0,        // elbow -- greek key
    scale: 9,
    ground: '#fde67e',
    ink: '#8fd78d',
    haloForm: 0,       // circle
    haloN: 8,
    haloR: 0.34,
    discShape: 0.4,
    discScale: 1.8,
    discInk: '#ffd166',
    discA: '#ff3d8b',
    discB: '#8a1f6a',
  },
  {
    name: 'SUNFLOWER',
    figure: '/src/figures/sunflower.png',
    shape: 0.2,        // arc -- flowing
    scale: 7,
    ground: '#1b4a8a',
    ink: '#f2a03d',
    haloForm: 0,
    haloN: 6,
    haloR: 0.42,
    discShape: 1.6,
    discScale: 1.2,
    discInk: '#123f2e',
    discA: '#ff7a1c',
    discB: '#2f8f5b',
  },
  {
    name: 'PICK',
    figure: '/src/figures/pick.png',
    shape: 1.0,        // chord -- blocky
    scale: 12,
    ground: '#b8121b',
    ink: '#f2c4b8',
    haloForm: 1,       // polygon
    haloN: 6,
    haloR: 0.36,
    discShape: 2.4,
    discScale: 2.2,
    discInk: '#ffe08a',
    discA: '#2a2fd6',
    discB: '#0d1149',
  },
  {
    name: 'AFRICANA',
    figure: '/src/figures/africana.png',
    shape: 2.6,        // step -- circuit
    scale: 10,
    ground: '#5b3ea8',
    ink: '#8e6fd6',
    haloForm: 2,       // star
    haloN: 8,
    haloR: 0.44,
    discShape: 0.0,
    discScale: 0.7,
    discInk: '#5b3ea8',
    discA: '#f5a623',
    discB: '#e8801a',
  },
];
