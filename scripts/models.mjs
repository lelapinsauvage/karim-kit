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
  // Name the OUTERMOST point or the frame gets set to the second-outermost one.
  // With the arms down that is the shoulders; the moment a hand comes up it is
  // the elbow, and a clause that only mentions shoulders cuts the arms off at
  // both sides while satisfying every word of itself.
  'Framed wide, with a clear margin of empty backdrop on the left and the right '
  + 'and above the head. Whatever is widest in this picture -- the shoulders, or '
  + 'the elbows if an arm is raised -- has empty backdrop beyond it on each side '
  + 'and does not touch, overlap or get cut by either edge. Nothing about the '
  + 'arms or hands leaves the frame. Pull the camera back until this is true. '
  // Sides and top clear, bottom RUNNING OFF. A body that stops inside the frame
  // has been amputated; a body that continues past the bottom edge has simply
  // been cropped, and once the figure is knocked out and stood in a scene only
  // the second one still reads as a person standing there.
  + 'The body continues down past the bottom edge of the frame and is cropped '
  + 'by it at the chest, not ending inside the frame.';

export const POSE = {
  centre:
    'Head and shoulders, square to camera, chin level, looking straight down '
    + 'the lens, chin a fraction lifted, jaw set, shoulders dropped and square. '
    + 'A held, deliberate stance directed by a photographer -- not a snapshot, '
    + 'not a casual standing pose. Centred, upright. '
    + FRAME,

  left:
    'Head and shoulders, body turned a quarter away so the shoulders sit on a '
    + 'diagonal, face turned back and eyes looking off to the LEFT of frame, '
    + 'past the camera, chin a fraction lifted, neck long, shoulders dropped '
    + 'and held. A deliberate stance directed by a photographer -- not a '
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
  p01: 'A dark-skinned Black woman in her early twenties, deep brown skin, '
    + 'round face, wide-set eyes, a scatter of freckles across the nose and '
    + 'cheeks, a small gap between her front teeth.',
  p02: 'A dark-skinned Black woman in her thirties, very deep brown skin, long '
    + 'neck, high angular cheekbones, a broad nose and full mouth, fine raised '
    + 'scarification lines across both cheekbones.',
  p03: 'A dark-skinned Black man in his late twenties, deep brown skin, square '
    + 'jaw, heavy brow, a fine scar through one eyebrow, close-cropped hair.',
  p04: 'A dark-skinned Black woman in her forties, deep brown skin, softer '
    + 'face, laughter lines at the eyes, a small mole above the lip, greying '
    + 'at the temples.',
  p05: 'A dark-skinned Black man in his early twenties, very deep brown skin, '
    + 'narrow face, sharp cheekbones, a wide mouth, shaved head.',
  p06: 'A dark-skinned Black woman in her late twenties, warm deep brown skin, '
    + 'strong straight nose, deep-set eyes, a birthmark on one temple.',
  p07: 'A dark-skinned Black man in his thirties, deep brown skin, full beard '
    + 'kept short, broad forehead, a chipped front tooth.',
  p08: 'A dark-skinned Black woman in her early thirties, very deep brown skin, '
    + 'oval face, long lashes, a beauty spot on one cheek, arched brows.',
  p09: 'A dark-skinned Black man in his forties, deep brown skin, lined '
    + 'forehead, a wide flat nose, grey coming through at the temples.',
  p10: 'A dark-skinned Black woman in her twenties, deep brown skin, heart-'
    + 'shaped face, small chin, a nose ring hole without the ring, freckled '
    + 'shoulders.',
};

// STREETWEAR SILHOUETTES CUT FROM HERITAGE TEXTILE -- a plate carrier made of
// antique kilim, a puffer in bandana paisley, a camp collar in Dutch wax. That
// is the register in the references, and it is the difference between a
// clothing line and a costume department. Nothing ceremonial, nothing tribal,
// nothing "inspired by".
// ---------------------------------------------------------------------------
// JEWELLERY. The product is on the hands and wrists, so the hands have to be
// in the frame and the crop has to fall below them -- the settled FRAME cuts
// at the chest, which severs the wrist that the watch is on. Neither pose
// looks left.
// ---------------------------------------------------------------------------
const FRAME_J =
  // THE ELBOWS ARE THE WIDEST THING, NOT THE HANDS.
  //
  // This clause already said the hands must not touch the edge, and they did
  // not -- they were at the collarbone, well inside. The arms were cut off at
  // both sides anyway, because raising a forearm to show a watch puts the ELBOW
  // further out than anything else in the picture, and nothing here named it.
  //
  // Name the outermost point or the frame gets set to the second-outermost one.
  'Framed wide enough that BOTH ELBOWS have empty backdrop beyond them on each '
  + 'side. The elbows are the widest points in this picture and they must not '
  + 'touch, overlap or be cut by the left or right edge. Nothing about either '
  + 'arm leaves the frame: elbow, forearm, wrist and hand are all completely '
  + 'inside it, with a clear margin of empty backdrop beyond, and a clear '
  + 'margin above the head. Both sleeves and the full width of the shoulders '
  + 'sit well inside the frame. Pull the camera back until this is true. '
  + 'The body continues down past the bottom edge of the frame and is cropped '
  + 'by it below the ribs, not ending inside the frame.';

const HANDS =
  'Both forearms raised into frame, one hand resting at the collarbone and the '
  + 'other at the jaw, fingers long and relaxed, wrists and knuckles turned '
  + 'toward the camera and sharply in focus so the jewellery reads clearly. '
  + 'Sleeves pushed back off the wrist. Hands anatomically correct, five '
  + 'fingers on each hand.';

const POSE_J = {
  centre:
    'Head, shoulders and both hands in frame, square to camera, chin a fraction '
    + 'lifted, jaw set, shoulders dropped and square, eyes looking off to the '
    + 'LEFT of frame past the camera, never down the lens. '
    + HANDS
    + ' A held, deliberate stance directed by a photographer -- not a snapshot, '
    + 'not a casual standing pose. '
    + FRAME_J,

  turned:
    'Head, shoulders and both hands in frame, body turned a quarter away so the '
    + 'shoulders sit on a diagonal, head carried back over the near shoulder and '
    + 'eyes looking off to the LEFT of frame past the camera, never down the '
    + 'lens, chin a fraction lifted, neck long, shoulders dropped and held. '
    + HANDS
    + ' A deliberate stance directed by a photographer -- not a snapshot, not a '
    + 'casual standing pose. '
    + FRAME_J,
};

// The garment is the ground the jewellery sits on: blunt slab-cut streetwear,
// pattern woven or dyed into the cloth, sleeves short or pushed back so the
// wrists and hands are bare. Gold, emerald and hammered brass worn in quantity
// so it reads as a line. Half the set wears the sculpted visor; the rest keep
// the face clear.
export const MODELS = [
  ['a01', POSE.left, 'deep cobalt blue', WHO.p01,
    'Wearing a boxy short-sleeved camp-collar shirt in heavy Dutch wax cotton, '
    + 'the geometry printed through the weave in vermilion, ochre yellow and '
    + 'cream, blunt squared shoulders, worn open over a black ribbed sleeveless '
    + 'tank top. Large hammered brass hoop earrings. Long fine box braids '
    + 'gathered high off the ears.'],

  ['a02', POSE.left, 'burnt terracotta', WHO.p02,
    'Wearing a short-sleeved knitted jacquard polo shirt, the diamond geometry '
    + 'knitted into the yarn in cobalt blue and acid yellow, contrast cream '
    + 'ribbed collar, open at the throat. A flat cast brass collar at the neck. '
    + 'Short coiled hair, faded at the sides.'],

  ['a03', POSE.left, 'hot pink', WHO.p03,
    'Wearing a sleeveless kente tank top, the bands woven through the cloth in '
    + 'ochre yellow, emerald green and black, blunt squared armholes, high '
    + 'straight neckline. A tight cowrie shell choker at the throat. Tight '
    + 'coiled locs in a high sculptural knot.'],

  ['a04', POSE.left, 'acid green', WHO.p04,
    'Wearing a blunt boxy short-sleeved work shirt in indigo adire, the pale '
    + 'cracked resist geometry dyed into the cloth in deep indigo and chalk '
    + 'white, worn open over a vermilion ribbed sleeveless tank top. A single '
    + 'heavy brass cuff earring wrapping the upper ear. Close-shaved head.'],

  ['a05', POSE.left, 'deep oxblood red', WHO.p05,
    'Wearing a short-sleeved shirt woven from fine raffia yarn, the open weave '
    + 'visible in the cloth, wide bands of acid green and natural straw, blunt '
    + 'squared shoulders, worn open over a cobalt blue ribbed sleeveless tank '
    + 'top. Long hammered brass ear drops, tapered blades. Long fine box braids '
    + 'gathered high off the ears.'],

  ['a06', POSE.left, 'pale mint', WHO.p06,
    'Wearing an oversized short-sleeved camp-collar shirt in heavy wax-print '
    + 'cotton, the geometry through the weave in cobalt blue, ochre yellow and '
    + 'black, hard squared slab shoulders, worn open over a cream ribbed '
    + 'sleeveless tank top. A wide hammered brass cuff high on one forearm. '
    + 'Shoulder-length locs pushed back off the ears.'],

  ['a07', POSE.left, 'flat olive green', WHO.p07,
    'Wearing a short-sleeved knitted jacquard polo shirt, the stepped geometry '
    + 'knitted into the yarn in vermilion and chalk cream, contrast black '
    + 'ribbed collar, worn over an acid yellow ribbed tank top. Wide flat brass '
    + 'disc earrings, edge-worn bright. Tight coiled locs in a high sculptural '
    + 'knot.'],

  ['a08', POSE.left, 'bright tangerine', WHO.p08,
    'Wearing a sleeveless kente tank top, the bands woven through the cloth in '
    + 'hot pink, emerald green and cream, blunt squared armholes, worn under a '
    + 'cropped sleeveless vest in black waxed cotton with squared slab '
    + 'shoulders. A short blackened bronze chain at the throat. Close-shaved '
    + 'head.'],

  ['a09', POSE.left, 'warm mustard yellow', WHO.p09,
    'Wearing a slab-cut short-sleeved shirt in indigo adire, the pale cracked '
    + 'geometry resist-dyed into the cloth in deep indigo, rust brown and chalk '
    + 'white, squared blunt shoulders, worn open over a cream ribbed sleeveless '
    + 'tank top. A row of cowrie shells strung tight at the throat. Long fine '
    + 'box braids gathered high off the ears.'],

  ['a10', POSE.left, 'deep teal', WHO.p10,
    'Wearing an oversized boxy short-sleeved shirt in woven kilim, the pattern '
    + 'woven through the cloth in vermilion, chalk white and black, squared slab '
    + 'shoulders, worn open over an emerald green ribbed sleeveless tank top. '
    + 'Heavy square brass ear studs, carved and stepped. Short coiled hair, '
    + 'faded at the sides.'],
];

// The lead phrase decides what is being made before any other word lands.
// 'Studio fashion portrait' gets a shoot; 'photograph of a person' gets a
// snapshot; 'film still' gets a scene. This is a shoot.
export const prompt = (pose, ground, who, body) =>
  `Studio fashion portrait. ${who} ${body} ${pose} ${GROUND(ground)} ${LIGHT} ${CAMERA} ${SKIN}`;
