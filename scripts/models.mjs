// Model generation prompts.
//
// Rebuilt after the first batch came back reading as AI. Four things caused
// that, and each has a fix:
//
//   plastic skin      -> name a FILM STOCK and a focal length, and ask for pores
//                        explicitly. Naming a stock is the single strongest
//                        instruction available: it carries a whole tonal
//                        signature -- grain, contrast curve, skin rendering --
//                        where adjectives carry almost nothing.
//   symmetrical faces -> negative constraints. "no beauty retouch, no smooth
//                        skin filter, no symmetrical face."
//   poses nobody      -> describe an ACTION, not a pose. "looking away from
//   shoots               camera", "hand at the jaw", "chin lifted, eyes down".
//                        Chin-level-shoulders-square is a passport photo.
//   generic garments  -> describe the SHAPE and the material, not the culture.
//                        "African-inspired" returns the model's average of
//                        everything, which is why it looks like nothing.
//
// The lighting clause stays identical across every prompt. Figures lit
// differently cannot share a scene, and by the time you notice you have
// generated all of them.

const CAPTURE =
  'Shot on Kodak Portra 400, 85mm lens, Hasselblad. Visible skin pores and '
  + 'natural skin texture, faint specular sheen on the skin, catchlight in the '
  + 'eyes, fine film grain, slight asymmetry in the face. '
  + 'No beauty retouch, no smooth skin filter, no plastic skin, no symmetrical face.';

// Even and frontal, but from a large soft source -- flat enough to relight,
// with enough shaping that it still reads as a photograph.
const LIGHT =
  'Lit by one large softbox directly front-on, very soft and even, shadows open '
  + 'and weak, no rim light, no hard key, neutral white balance, low contrast. '
  + 'Flat seamless studio backdrop in mid grey, nothing else in frame.';

export const MODELS = [
  ['n01', 'A dark-skinned woman, head and shoulders, chin lifted and eyes '
    + 'looking down past the lens, mouth relaxed. Hair sculpted into two tall '
    + 'twin peaks rising from the crown, matte and dense. Cowrie shells strung '
    + 'in rows across the brow. Heavy brass hoop at one ear.'],

  ['n02', 'A dark-skinned man, head and shoulders, turned three-quarters away '
    + 'and looking back over his shoulder at the lens, jaw set. Close-cropped '
    + 'hair with a fine parting cut into it. Wearing a stiff triangular chest '
    + 'panel in tan barkcloth edged with a dense row of cowrie shells, bare '
    + 'shoulders, raffia tassels at the shoulder points.'],

  ['n03', 'A dark-skinned woman, head and shoulders, one hand flat against her '
    + 'jaw, elbow out of frame, eyes to camera. Hair in four large round Bantu '
    + 'knots. Small gold nose ring, layered fine gold chains at the throat. '
    + 'Freckles across the nose and cheeks.'],

  ['n04', 'A dark-skinned woman in strict profile facing left, chin raised, '
    + 'throat exposed, eyes closed. Beaded cap in burnt orange seed beads with '
    + 'a fringe of cowrie shells across the forehead. Long beaded earring '
    + 'falling in dense strands to the shoulder.'],

  ['n05', 'A dark-skinned man, head and shoulders, facing camera, head tipped '
    + 'slightly back, half-smile. Tall flat-topped hair squared off at the '
    + 'edges. Wearing an oversized mesh jersey printed with dense black adinkra '
    + 'symbols on rust red, collar open.'],

  ['n06', 'A dark-skinned woman, head and shoulders, shoulders turned away and '
    + 'face toward the lens, gaze level and unbothered. Fine raised scarification '
    + 'lines across both cheekbones. White cotton veil draped over a beaded '
    + 'skullcap. Long thin brass earring.'],

  ['n07', 'A dark-skinned woman, head and shoulders, arms crossed low, leaning '
    + 'slightly forward. Large round afro shaped into a perfect halo. Wearing a '
    + 'cropped camp-collar shirt in a bold red, black and gold tile print, '
    + 'buttons open at the throat.'],

  ['n08', 'A dark-skinned man in strict profile facing right, chin down, brow '
    + 'heavy. Head wrapped in indigo cloth with hand-painted white resist '
    + 'markings, wrapped tall and flat at the crown. Stacked brass coils at the '
    + 'neck, bare shoulders.'],

  ['n09', 'A dark-skinned woman, head and shoulders, turning into the lens as if '
    + 'caught mid-movement, hair still swinging. Long thin braids gathered high '
    + 'and falling loose. Wearing a heavy collar of flat hammered brass discs '
    + 'over a plain black tank.'],

  ['n10', 'A dark-skinned woman, head and shoulders, seen from slightly below, '
    + 'looking off to the right of frame. Hair in tight coiled locs pulled into '
    + 'a high sculptural knot. Wearing an open-weave raffia shoulder piece in '
    + 'natural straw, loose threads visible at the edge.'],
];

export const prompt = (body) =>
  `Editorial fashion photograph. ${body} ${LIGHT} ${CAPTURE}`;
