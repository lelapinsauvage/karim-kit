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
  'Lit by one very large soft source close and slightly above the camera, with '
  + 'a white bounce card just below the chin. Shadows soft, open and weak. Even '
  + 'across the face. No rim light, no backlight, no hard key, no coloured gels '
  + 'on the subject. Faint specular sheen on the skin, catchlight in both eyes. '
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
  'Visible skin pores and natural skin texture, fine facial hair, slight '
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
  // ONE clause about the crop. Not four.
  //
  // The frame is a PORTRAIT: head, shoulders, upper chest, and the bottom edge
  // cuts across the chest. Not the waist, not the knee, not full length -- the
  // figure is knocked out and stood against a sun, and at full height she is a
  // small person on a big page with the garment unreadable.
  'A tight head-and-shoulders portrait. The top of the head has clear empty '
  + 'backdrop above it and is never cut. Both shoulders sit well inside the '
  + 'frame with backdrop beyond them on each side and never touch either edge. '
  + 'The bottom edge of the frame cuts across the CHEST, so the body runs off '
  + 'the bottom rather than ending inside the picture. No waist, no hips, no '
  + 'legs, no full-length figure.';

export const POSE = {
  left:
    // WHICH WAY SHE TURNS.
    //
    // "turned a quarter away" says nothing about direction, so half the set
    // came back facing right while the eyes went left -- a body pointing one
    // way and a gaze the other reads as a person being called from off-camera,
    // not as a figure standing in a frame. Direction is named now, and named
    // twice.
    'Head and shoulders, STANDING UPRIGHT, never seated. The body is turned a '
    + 'quarter to the LEFT so the left shoulder is nearer the camera and the '
    + 'right shoulder further away, the head carried back over the near '
    + 'shoulder, CHIN LEVEL, eyes looking off to the LEFT of frame past the '
    + 'camera. Turned left, looking left. Not turned to the right, not facing '
    + 'right, not tilted up, not looking upward, not down the lens. Neck long, '
    + 'shoulders dropped and held. A deliberate stance directed by a '
    + 'photographer -- not a snapshot, not a casual standing pose. '
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
// TEN PEOPLE. Twenties and thirties, all of them.
//
// No ageing markers at all -- no grey, no lines, no weathering, no hooded eyes.
// They read as character in a description and as age in a photograph, and this
// is a clothing line: the face has to be someone who could be wearing it now.
//
// Each carries something the others do not, because reusing a sentence returns
// the same face. Specific, not flattering: a gap in the teeth, a broad nose, a
// birthmark are what make a face a person rather than a composite.
//
// The expression is fixed and it is the same for all of them: level, mouth
// closed, unreadable. No smile, no reaction, no warmth toward the lens.
const FACE = 'Expression level and composed, mouth closed, unreadable. '
  + 'Not smiling, not laughing, no reaction, not friendly toward the camera.';

const WHO = {
  p01: 'A Black woman in her early twenties, deep blue-black skin, round full '
    + 'face, wide-set eyes, a dense scatter of freckles across the nose and '
    + 'cheeks. ' + FACE,
  p02: 'A Black woman in her thirties, warm russet-brown skin, long neck, high '
    + 'angular cheekbones, a broad nose and full mouth. ' + FACE,
  p03: 'A Black woman in her mid twenties, golden-amber skin, oval face, a '
    + 'small beauty mark beside the right eye, arched brows. ' + FACE,
  p04: 'A Black woman in her late twenties, dark umber skin, narrow face, '
    + 'sharp jaw, a small gap between the front teeth. ' + FACE,
  p05: 'A Black man in his late twenties, deep chocolate-brown skin, square '
    + 'jaw, heavy brow, a fine scar through one eyebrow. ' + FACE,
  p06: 'A Black man in his early thirties, dark bronze skin with a reddish '
    + 'cast, broad forehead, wide flat nose. ' + FACE,
  p07: 'A Black man in his early twenties, very dark skin, lean face, sharp '
    + 'cheekbones, a wide mouth. ' + FACE,
  p08: 'A Black man in his thirties, medium tan-brown skin, broad face, full '
    + 'beard kept very short, a chipped front tooth. ' + FACE,
  p09: 'A Black woman in her late twenties, deep espresso skin, strong straight '
    + 'nose, deep-set eyes, a birthmark on one temple. ' + FACE,
  p10: 'A Black man in his early thirties, dark walnut skin, clean-shaven, '
    + 'heavy jaw, a smooth scar across the left temple. ' + FACE,
};

// STREETWEAR SILHOUETTES CUT FROM HERITAGE TEXTILE -- a plate carrier made of
// antique kilim, a puffer in bandana paisley, a camp collar in Dutch wax. That
// is the register in the references, and it is the difference between a
// clothing line and a costume department. Nothing ceremonial, nothing tribal,
// nothing "inspired by".
export const MODELS = [
  ['a01', POSE.left, 'deep cobalt blue', WHO.p01,
    'Wearing a boxy short-sleeved camp-collar shirt in heavy cotton, a '
    + 'wax-print concentric-disc repeat dyed into the cloth in vermilion and ochre yellow and cream, blunt squared shoulders, open at the throat over a '
    + 'black ribbed sleeveless tank top. Large hammered brass hoop earrings. Coiled twists '
    + 'gathered high off the crown into a tall standing pineapple.'],

  ['a02', POSE.left, 'burnt terracotta', WHO.p02,
    'Wearing a short-sleeved knitted jacquard polo shirt, a mosaic quatrefoil '
    + 'repeat knitted into the yarn in cobalt blue and acid yellow and cream, contrast '
    + 'cream ribbed collar, open at the throat. A flat cast brass collar at the neck. A big round afro picked '
    + 'out full and even.'],

  ['a03', POSE.left, 'hot pink', WHO.p03,
    'Wearing a sleeveless tank top, kente strip-weave banding woven through '
    + 'the cloth in emerald green, ochre yellow and black, blunt squared '
    + 'armholes, high straight neckline. A tight cowrie shell choker at the throat. Natural '
    + 'hair cropped close and tapered to the skin at the sides.'],

  ['a04', POSE.left, 'acid green', WHO.p04,
    'Wearing a blunt boxy short-sleeved shirt in cotton, cracked adire resist '
    + 'medallions dyed into the cloth in hot pink and tangerine orange, blunt '
    + 'squared shoulders, open at the throat. A single flat brass ear cuff. '
    + 'Long fine box braids gathered high.'],

  ['a05', POSE.left, 'deep oxblood red', WHO.p05,
    'Wearing a short-sleeved shirt in open-weave cotton gauze, the weave '
    + 'visible in the cloth, wide bands of mustard yellow and deep brown, blunt squared shoulders,  open over a '
    + 'cobalt blue ribbed sleeveless tank top. Long hammered brass ear drops, tapered blades. Cornrows '
    + 'braided flat in tight arcs across the scalp, falling into short locs at '
    + 'the nape.'],

  ['a06', POSE.left, 'marigold yellow', WHO.p06,
    'Wearing a sleeveless kente tank top, strip-weave bands woven through the '
    + 'cloth in cobalt blue, emerald green and black, blunt squared armholes, '
    + 'high straight neckline. A heavy hammered brass cuff on one wrist. A short flat-topped '
    + 'afro, faded to the skin at the sides.'],

  ['a07', POSE.left, 'violet purple', WHO.p07,
    'Wearing a boxy short-sleeved knitted polo shirt, a bogolan mud-cloth '
    + 'lattice knitted into the yarn in scarlet and forest green, contrast black ribbed collar, open at the throat. A single flat brass disc '
    + 'pendant on a short chain. A high flat-top fade with sharp squared '
    + 'edges.'],

  ['a08', POSE.left, 'pale mint', WHO.p08,
    'Wearing a short-sleeved camp-collar shirt in heavy cotton, a wax-print '
    + 'broken-record spiral repeat dyed into the cloth in turquoise and burnt sienna, blunt squared shoulders, open at the throat over a cream ribbed '
    + 'sleeveless tank top. A '
    + 'row of cowrie shells strung tight at the throat. Shoulder-length '
    + 'free-form locs, thick and uneven, tied back off the face.'],
  ['a09', POSE.left, 'deep teal', WHO.p09,
    'Wearing a sleeveless boxy tank top in aso-oke strip-weave cotton, narrow '
    + 'warp stripes and lozenge float-weave figures woven into the cloth in magenta and lime green, blunt squared armholes, high straight '
    + 'neckline. A heavy cast '
    + 'brass torque at the throat. Bantu knots set in even rows across the '
    + 'scalp.'],

  ['a10', POSE.left, 'saffron orange', WHO.p10,
    'Wearing a short-sleeved camp-collar shirt in heavy cotton, a wax-print '
    + 'cowrie-and-spiral repeat dyed into the cloth in ochre and midnight blue, blunt squared shoulders, open at the throat over a '
    + 'cobalt blue ribbed sleeveless tank top. One large flat hammered brass disc earring. '
    + 'Natural hair shaved close and tapered to the skin all over.'],
];

// The lead phrase decides what is being made before any other word lands.
// 'Studio fashion portrait' gets a shoot; 'photograph of a person' gets a
// snapshot; 'film still' gets a scene. This is a shoot.
export const prompt = (pose, ground, who, body) =>
  `Studio fashion portrait. ${who} ${body} ${pose} ${GROUND(ground)} ${LIGHT} ${CAMERA} ${SKIN}`;
