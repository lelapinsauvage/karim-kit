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

// ---------------------------------------------------------------------------
// TWO looks. Pass the one you want to prompt().
//
//   'flat'   -- even, frontal, relightable. The shader supplies all the drama.
//   'cinema' -- backlit, deep shadow side, halation. The photograph already has
//               its own light, and the shader agrees with it.
//
// The choice is not cosmetic. Flat front-on soft light IS e-commerce lighting --
// it is chosen to describe a garment, and describing is the opposite of what a
// cinematic frame does. But it relights cleanly, which is why it was here first.
// ---------------------------------------------------------------------------

const CAPTURE_FLAT =
  'Shot on Kodak Portra 400, 85mm lens, Hasselblad. Visible skin pores and '
  + 'natural skin texture, faint specular sheen on the skin, catchlight in the '
  + 'eyes, fine film grain, slight asymmetry in the face. '
  + 'No beauty retouch, no smooth skin filter, no plastic skin, no symmetrical face.';

// Even and frontal, but from a large soft source -- flat enough to relight,
// with enough shaping that it still reads as a photograph.
const LIGHT_FLAT =
  'Lit by one large softbox directly front-on, very soft and even, shadows open '
  + 'and weak, no rim light, no hard key, neutral white balance, low contrast. '
  + 'Flat seamless studio backdrop in mid grey, nothing else in frame.';

// Cinema. A motion picture stock rather than a portrait negative: Portra is a
// low-contrast film built to be kind to skin, and kindness is not what this is
// for. 500T is tungsten-balanced, coarse-grained and haloes around a hot edge.
// The lens goes wider and closer -- 85mm is a portrait length and it flatters;
// 40mm at a short distance puts the viewer in the room.
const CAPTURE_CINEMA =
  'Shot on Kodak Vision3 500T, 40mm spherical prime, shot wide open. Halation '
  + 'blooming softly around the brightest edges the way tungsten stock does. '
  + 'Coarse 35mm grain, filmic highlight rolloff, blacks lifted slightly rather '
  + 'than crushed. Visible skin pores, faint specular sheen on the skin, slight '
  + 'asymmetry in the face. No beauty retouch, no smooth skin filter, no plastic '
  + 'skin, no symmetrical face, no digital sharpening, no HDR.';

// Backlit, because the figure stands in front of a sun. A frame where the
// brightest thing is behind the subject and the front falls away is both the
// cinematic version and the honest one -- the light in the photograph and the
// light in the composition are the same light.
//
// The backdrop stays MID GREY, not black. A dark backdrop behind a rim-lit
// subject looks better in the raw generation and mattes badly: the cutter takes
// the haze and the halation with the background, and what is left has a hard
// bright outline around a hole. Let the shader put the atmosphere back --
// figLift exists for exactly this.
const LIGHT_CINEMA =
  'Lit from behind and slightly to one side by a single hard source, so the '
  + 'edge of the head and shoulders burns bright and the front of the figure '
  + 'falls into deep shadow. One weak bounce from the front keeps detail in the '
  + 'shadow side. Strong contrast, warm key against cool shadow. Flat seamless '
  + 'studio backdrop in mid grey, nothing else in frame.';

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

const LOOKS = {
  flat:   { light: LIGHT_FLAT,   capture: CAPTURE_FLAT,   lead: 'Editorial fashion photograph.' },
  cinema: { light: LIGHT_CINEMA, capture: CAPTURE_CINEMA, lead: 'Film still.' },
};

// 'Film still' rather than 'editorial photograph' is doing real work in the
// lead. It changes what the model thinks it is making before a single other
// word lands -- one implies a shoot, the other implies a scene the camera
// happened to be present for.
export const prompt = (body, look = 'flat') => {
  const L = LOOKS[look] ?? LOOKS.flat;
  return `${L.lead} ${body} ${L.light} ${L.capture}`;
};
