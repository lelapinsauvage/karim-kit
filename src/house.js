// The tuned state, lifted verbatim out of the finished piece.
//
// Forty numbers arrived at by dragging. They cannot be taught, recalled or
// re-derived under a clock -- so they ship as a value rather than as advice.
// SUN_NEUTRAL is where a build STARTS, unresolved and obviously so; HOUSE is
// what it can be handed when the look is wanted rather than discovered.
//
//   scene(canvas, { state: HOUSE })     // straight to it
//   s.set(HOUSE)                        // or later, on request
//
// CHARACTERS carries what changes per figure: the pigment taken from what each
// one is actually wearing, the ground, the ink, and the provenance line that
// travels with it.

export const HOUSE = {
  r:0.350, edge:0.146, coreSize:0.99, rimBand:0.75, drift:1.18,
  glow:0.22, glowSize:0.34, glowMode:1, rimW:0.045, rimStr:0.9, rimIn:0.06,
  grain:0.15, grainSize:1.45, grainMask:0.75, spread:0.30,
  bgFall:0.62, bgFloor:0.88, warmth:0.40, purity:0.62, wobble:1.42,
  cloth:0.32, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
  clothWave:7.5, clothSpeed:1.9, charge:0.18, chargeSpd:0.55, chargeLen:9,
  light:0.85, rake:0.82, sheen:0.4, cord:1.3,
  figMode:0, tear:1.0, thread:0.7, figH:0.85, figX:0.055, figBleed:0.06, figDark:0.07, figTint:0.18, figLift:0,
  coreX:0.19, coreY:-0.110, typeInk:0.07,
};

export const CHARACTERS = [
  { id:'l1', name:'Barkcloth', fig:'n02',
    pigment:'#A8531F', bg:'#E2DBD1', clothInk:'#967154', warmth:0.58,
    figH:0.85, figX:0.055, figBleed:0.06,
    pig:'Beaten fig bark · ómútuba', origin:'Buganda, Uganda',
    material:'Barkcloth, cowrie, raffia' },

  { id:'l2', name:'Efun', fig:'n06',
    pigment:'#5C6660', bg:'#DDDDD9', clothInk:'#7E857F', purity:0.50,
    figH:0.85, figX:0.055, figBleed:0.06,
    pig:'White clay · efun', origin:'Cross River, Nigeria',
    material:'Cotton veil, seed pearl, brass' },

  { id:'l3', name:'Adire', fig:'n08',
    pigment:'#243A7A', bg:'#D5D7DB', clothInk:'#6C7791',
    rimW:0.035, rimStr:1.05, purity:0.70, flip:true,
    figH:0.85, figX:0.055, figBleed:0.06,
    pig:'Indigo · cassava resist', origin:'Abeokuta, Nigeria',
    material:'Adire cotton, cast brass' },

  { id:'l4', name:'Raffia', fig:'n10',
    pigment:'#5E6B2F', bg:'#DEDCD0', clothInk:'#7E8560', warmth:0.45, flip:true,
    figH:0.85, figX:0.055, figBleed:0.06,
    pig:'Raffia palm · undyed', origin:'Kasai, DR Congo',
    material:'Open-weave raffia' },
];
