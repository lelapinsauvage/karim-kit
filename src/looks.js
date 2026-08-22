// Four looks, one pigment each. The palette is not four colours -- it is four
// dye and pigment traditions. Brutalism is truth to materials; so is this.

export const LOOKS = [
  {
    lot: '01', name: 'Otjize',
    pigment: 'Red earth', origin: 'Kunene', cloth: 'Raffia, brass',
    halo: '#C1272D', haloDeep: '#5E0D11',       // Himba ochre + butterfat
    haloInk: '#1A0406',
    form: 0, sides: 8,                           // circle
    shape: 2.0, scale: 26.0,                     // elbow -- greek key
  },
  {
    lot: '02', name: 'Adire',
    pigment: 'Indigo', origin: 'Abeokuta', cloth: 'Resist-dyed cotton',
    halo: '#1B2A6B', haloDeep: '#080D28',        // Yoruba indigo
    haloInk: '#D7DCF2',
    form: 1, sides: 3,                           // triangle
    shape: 0.4, scale: 21.0,                     // arc
  },
  {
    lot: '03', name: 'Efun',
    pigment: 'White clay', origin: 'Cross River', cloth: 'Bleached linen',
    halo: '#EDE6D8', haloDeep: '#A79E8C',        // chalk, rites
    haloInk: '#17150F',
    form: 1, sides: 4,                           // square
    shape: 1.6, scale: 17.0,                     // chord
  },
  {
    lot: '04', name: 'Ashanti',
    pigment: 'Cast brass', origin: 'Kumasi', cloth: 'Wool, gold thread',
    halo: '#B08D3F', haloDeep: '#3D2C0B',        // goldweights, Benin bronze
    haloInk: '#120C02',
    form: 2, sides: 8,                           // star
    shape: 2.4, scale: 23.0,                     // step -- circuit
  },
];

// The ground never changes. One field, four events.
export const GROUND = {
  a: '#141416', b: '#08080A',
  ink: '#232327',      // ambient: a few values above the ground, nothing more
};
