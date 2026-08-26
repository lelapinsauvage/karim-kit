// Model generation prompts.
//
// Rewritten against the reference folders. What was wrong before, in order of
// how much damage each did:
//
//   ETHNOGRAPHIC COSTUME. Barkcloth chest panels, cowrie bibs, raffia tassels.
//   That is a museum diorama, not a clothing line. The references are
//   contemporary fashion — wax-print camp collars, knitted jacquard polos,
//   bandana-paisley puffers, oversized tailoring. African design language on
//   garments people actually wear.
//
//   MUD PALETTE. Ochre, barkcloth, indigo, olive: every prompt sat in earth
//   tones. The references are loud — vermilion on cobalt, acid green with
//   cream, cobalt with ochre yellow, pink against green. Saturated,
//   complementary, joyful. The colour is the point.
//
//   GREY BACKDROP. Every reference shoots against a SATURATED coloured
//   seamless — oxblood, olive, mint, hot pink, cobalt. The drama is in the
//   backdrop and the styling, never in the lighting.
//
//   BACKLIGHT. A cinematic key behind the subject looked better in isolation
//   and wrong against the references, which are lit flat, soft and frontal.
//   That lighting is not a compromise for the shader's benefit — it is what
//   the look actually is.
//
// The references now go to the model as images, not as adjectives. Words select
// from an average of everything the model has seen; a reference selects from a
// picture. Pass REFS=~/Desktop/afro\ models,~/Desktop/afro\ clothes

// ---------------------------------------------------------------------------
// LOCKED. Identical in every prompt. Figures that differ here cannot share a
// frame, and by the time that is obvious the whole set is generated.
// ---------------------------------------------------------------------------

// Soft, large, frontal, open. Beauty-dish or big softbox close and slightly
// above, white bounce underneath. Shadows present but weak. No rim, no hard
// key, no backlight — every reference is lit this way, and the modelling comes
// from the size and closeness of the source rather than from contrast.
const LIGHT =
  'Cinematic editorial studio lighting. One hard directional key set high and '
  + 'to one side, throwing a defined shadow down the far side of the face and '
  + 'along the jaw, with a single weak bounce holding that shadow open. Deep '
  + 'contrast, sculpted falloff, strong dramatic modelling. A narrow rim of '
  + 'light catching the top edge of the shoulder and the cheekbone. Rich '
  + 'specular sheen on the skin, catchlight in both eyes. '
  // A saturated backdrop bounces its own colour into hair and shoulder edges,
  // and the matte keeps every bit of it -- a red fringe round an afro, a green
  // one down a braid. In a real studio you fix that by walking the subject
  // forward, so ask for that rather than for the symptom to be absent.
  + 'Subject standing several metres forward of the backdrop, lit separately '
  + 'from it, with no colour spill or coloured reflection onto the hair, skin '
  + 'or shoulders. Clean edge separation between subject and background.';

// Medium format, moderate tele, stopped down. The references are sharp
// throughout — this is not a shallow-depth-of-field look, the garment has to
// read as clearly as the face.
const CAMERA =
  'Shot on a Hasselblad with a 100mm lens at f/5.6, everything from the front '
  + 'of the face to the shoulders in focus. Fine 120 film grain. Natural '
  + 'colour, neutral white balance, no colour grade, no teal and orange.';

// Skin, and the constraints that keep it off the plastic default.
const SKIN =
  'Clear, healthy, luminous skin. Visible skin pores and natural skin texture, fine facial hair, slight '
  + 'asymmetry in the face, a real person rather than a composite. No beauty '
  + 'retouch, no smooth skin filter, no plastic skin, no symmetrical face, no '
  + 'digital sharpening, no HDR, no wax figure.';

// ---------------------------------------------------------------------------
// TWO POSITIONS. Only two, so the set is a series rather than four unrelated
// photographs. Both keep the whole head and both shoulders inside the frame
// with clear air around them: nothing is ever cut by the left or right edge,
// because the figure gets knocked out and stood in an empty scene, and a
// shoulder amputated by a frame edge that no longer exists reads as damage.
// ---------------------------------------------------------------------------
// Wide enough that the garment survives the knockout. The figure is cut out
// and stood in an empty scene, so a sleeve severed by an edge that no longer
// exists reads as damage rather than as a crop -- and a puffer or a wide
// shoulder eats far more width than a head-and-shoulders crop expects.
const FRAME =
  // Name the OUTERMOST point or the frame gets set to the second-outermost one.
  // Standing with the arms down that is the shoulders or the hair; the moment
  // an arm swings away from the body it is the elbow.
  'Full-length standing figure. Framed wide, with a clear margin of empty '
  + 'backdrop on the left and the right and above the head. Whatever is widest '
  + 'in this picture -- the shoulders, the hair, or an elbow if an arm comes '
  + 'away from the body -- has empty backdrop beyond it on each side and does '
  + 'not touch, overlap or get cut by either edge. The whole of the hair, '
  + 'including the tallest point of it, sits inside the frame with clear air '
  + 'above. Nothing about the arms or hands leaves the frame. Pull the camera '
  + 'back until this is true. '
  // Sides and top clear, bottom RUNNING OFF. A body that stops inside the frame
  // has been amputated; a body that continues past the bottom edge has simply
  // been cropped, and once the figure is knocked out and stood in a scene only
  // the second one still reads as a person standing there.
  + 'The body continues down past the bottom edge of the frame and is cropped '
  + 'by it below the knee, not ending inside the frame.';

export const POSE = {
  left:
    'Standing at full height, weight settled evenly on both feet, body turned '
    + 'a quarter away so the shoulders sit on a diagonal, head carried back and '
    + 'tilted UP, chin lifted well above level, eyes looking UP and off to the '
    + 'LEFT of frame, past and above the camera, never down the lens. Throat '
    + 'open, neck long, shoulders dropped and held, arms hanging relaxed at the '
    + 'sides. A held, deliberate stance directed by a photographer -- not a '
    + 'snapshot, not a casual standing pose. '
    + FRAME,
};

// ---------------------------------------------------------------------------
// The backdrop is a saturated colour, chosen AGAINST the garment. Never grey,
// never white, never black. The background remover takes it out cleanly at any
// colour, so this costs nothing and it is most of why the references look like
// photographs and the old generations looked like inventory.
// ---------------------------------------------------------------------------
const GROUND = (colour) =>
  `Seamless studio paper backdrop in ${colour}, evenly lit, completely plain, `
  + 'nothing else in frame.';

// ---------------------------------------------------------------------------
// The set. Each entry: pose, backdrop colour, and the garment.
//
// Garments are described as GARMENTS — cut, fabric, construction, and the two
// or three colours in the print. Never as heritage. "Wax-print camp-collar
// shirt in cobalt and ochre" is a thing a person owns; "African-inspired
// ceremonial textile" is a thing a model averages into mush.
// ---------------------------------------------------------------------------
// WHO. This clause is not optional and removing it was the single worst thing
// in the previous version: describing only the garment leaves the subject to
// the model's default, and the default is a racially indeterminate face. The
// three figures that worked -- n06, n10, a02 -- all name the person first.
//
// Naming the hair matters as much as naming the skin. Box braids, coiled locs,
// a beaded skullcap: these are what make the face read as the person intended
// rather than as an average.
// TEN PEOPLE, not four descriptions used twice each.
//
// Four WHO blocks across ten figures meant three of them opened with the same
// sentence word for word -- and the same sentence returns the same face, because
// a description with nothing specific in it resolves to the model's average of
// that description. The set then reads as one person photographed ten times in
// different clothes, which is what a lookbook must never look like.
//
// So: one per figure, and each carries something the others do not. Age,
// the shape of the face, a mark, the hair. Specific beats flattering -- a gap
// in the teeth, a heavy brow, freckles, a shaved head are what make a face a
// person rather than a composite.
const WHO = {
  f01: 'A Black American woman in her early twenties, deep blue-black skin, '
    + 'round full face, wide-set eyes, a dense scatter of freckles across the '
    + 'nose and cheeks, a small gap between her front teeth.',
  f02: 'A Black American woman in her thirties, warm russet-brown skin, long '
    + 'neck, high angular cheekbones, a broad nose and full mouth, a raised '
    + 'beauty mark beside the right eye.',
  f03: 'A Black American woman in her forties, light golden-amber skin, soft '
    + 'square face, deep laughter lines at the eyes, a small mole above the '
    + 'lip, grey coming through at the temples.',
  f04: 'A Black American woman in her late twenties, dark umber skin, narrow '
    + 'face, sharp pointed chin, heavy straight brows, pale vitiligo patches '
    + 'across one cheek and down the side of the throat.',
  m01: 'A Black American man in his late twenties, deep chocolate-brown skin, '
    + 'square heavy jaw, thick low brow, a fine scar cutting through one '
    + 'eyebrow, a wide mouth.',
  m02: 'A Black American man in his forties, dark bronze skin with a reddish '
    + 'undertone, lined forehead, a wide flat nose, a chipped front tooth, a '
    + 'short beard with grey coming through it.',
  m03: 'A Black American man in his early twenties, very dark skin, lean '
    + 'angular face, high forehead, deep-set eyes, a raised keloid mark along '
    + 'the jawline, no facial hair.',
  m04: 'A Black American man in his thirties, medium tan-brown skin, broad '
    + 'round face, thick moustache, a gold-capped upper tooth, freckles across '
    + 'both cheeks.',
};

export const MODELS = [
  ['f01', POSE.left, 'deep cobalt blue', WHO.f01,
    'Wearing a boxy short-sleeved camp-collar shirt in heavy cotton, a '
    + 'wax-print concentric-disc repeat dyed into the cloth in vermilion, ochre '
    + 'yellow and cream, blunt squared shoulders, open at the throat over a '
    + 'black ribbed sleeveless tank top, with wide straight-leg vermilion '
    + 'cotton trousers. Large hammered brass hoop earrings. Coiled twists '
    + 'gathered high off the crown into a tall standing pineapple.'],

  ['f02', POSE.left, 'burnt terracotta', WHO.f02,
    'Wearing a short-sleeved knitted jacquard polo shirt, a mosaic quatrefoil '
    + 'repeat knitted into the yarn in cobalt blue and acid yellow, contrast '
    + 'cream ribbed collar, open at the throat, with wide cream cotton '
    + 'trousers. A flat cast brass collar at the neck. A big round afro picked '
    + 'out full and even.'],

  ['f03', POSE.left, 'hot pink', WHO.f03,
    'Wearing a sleeveless tank top, kente strip-weave banding woven through '
    + 'the cloth in emerald green, ochre yellow and black, blunt squared '
    + 'armholes, high straight neckline, with wide emerald green cotton shorts '
    + 'cut to the knee. A tight cowrie shell choker at the throat. Natural '
    + 'hair cropped close and tapered to the skin at the sides.'],

  ['f04', POSE.left, 'acid green', WHO.f04,
    'Wearing a blunt boxy short-sleeved shirt in indigo-dyed cotton, cracked '
    + 'adire resist medallions dyed into the cloth in deep indigo and chalk '
    + 'white, worn open over a vermilion ribbed sleeveless tank top, with '
    + 'straight indigo cotton trousers. A single heavy brass cuff earring '
    + 'wrapping the upper ear. A big round afro picked out wide and even.'],

  ['m01', POSE.left, 'deep oxblood red', WHO.m01,
    'Wearing a short-sleeved shirt in open-weave cotton gauze, the weave '
    + 'visible in the cloth, wide bands of acid green and natural straw with '
    + 'domino-dot geometry woven in, blunt squared shoulders, worn open over a '
    + 'cobalt blue ribbed sleeveless tank top, with wide cobalt blue cotton '
    + 'trousers. Long hammered brass ear drops, tapered blades. Cornrows '
    + 'braided flat in tight arcs across the scalp, falling into short locs at '
    + 'the nape.'],

  ['m02', POSE.left, 'marigold yellow', WHO.m02,
    'Wearing a sleeveless kente tank top, strip-weave bands woven through the '
    + 'cloth in cobalt blue, emerald green and black, blunt squared armholes, '
    + 'high straight neckline, with wide straight-leg emerald green cotton '
    + 'trousers. A heavy hammered brass cuff on one wrist. A short flat-topped '
    + 'afro, faded to the skin at the sides.'],

  ['m03', POSE.left, 'violet purple', WHO.m03,
    'Wearing a boxy short-sleeved knitted polo shirt, a bogolan mud-cloth '
    + 'lattice knitted into the yarn in tangerine orange, chalk white and '
    + 'black, contrast black ribbed collar, open at the throat, with wide '
    + 'straight-leg tangerine orange cotton trousers. A single flat brass disc '
    + 'pendant on a short chain. A high flat-top fade with sharp squared '
    + 'edges.'],

  ['m04', POSE.left, 'mint green', WHO.m04,
    'Wearing a short-sleeved camp-collar shirt in heavy cotton, a wax-print '
    + 'broken-record spiral repeat dyed into the cloth in vermilion, cream and '
    + 'black, blunt squared shoulders, open at the throat over a cream ribbed '
    + 'sleeveless tank top, with wide straight-leg black cotton trousers. A '
    + 'row of cowrie shells strung tight at the throat. Shoulder-length '
    + 'free-form locs, thick and uneven, tied back off the face.'],
];

// The lead phrase decides what is being made before any other word lands.
// 'Studio fashion portrait' gets a shoot; 'photograph of a person' gets a
// snapshot; 'film still' gets a scene. This is a shoot.
export const prompt = (pose, ground, who, body) =>
  `Studio fashion portrait. ${who} ${body} ${pose} ${GROUND(ground)} ${LIGHT} ${CAMERA} ${SKIN}`;
