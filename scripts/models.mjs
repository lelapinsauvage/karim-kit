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
  'Framed wide, with a clear margin of empty backdrop on the left and the right '
  + 'and above the head. Both sleeves and the full width of the shoulders sit '
  + 'well inside the frame and never touch the left or right edge. '
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
const WHO = {
  w1: 'A dark-skinned Black woman with deep brown skin and West African '
    + 'features, high cheekbones, freckles across the nose.',
  w2: 'A dark-skinned Black woman with very deep brown skin, a broad nose and '
    + 'full mouth, fine raised scarification lines across both cheekbones.',
  m1: 'A dark-skinned Black man with deep brown skin and West African features, '
    + 'a strong jaw and heavy brow.',
  m2: 'A dark-skinned Black man with very deep brown skin, close-shaved head, '
    + 'sharp cheekbones.',
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
  'Framed wide enough to hold both raised hands, with a clear margin of empty '
  + 'backdrop on the left and the right and above the head. Both sleeves, the '
  + 'full width of the shoulders and both hands sit well inside the frame and '
  + 'never touch the left or right edge. '
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
    'Head, shoulders and both hands in frame, square to camera, chin level, '
    + 'looking straight down the lens, chin a fraction lifted, jaw set, '
    + 'shoulders dropped and square. Eyes on the lens, never off to the left. '
    + HANDS
    + ' A held, deliberate stance directed by a photographer -- not a snapshot, '
    + 'not a casual standing pose. '
    + FRAME_J,

  turned:
    'Head, shoulders and both hands in frame, body turned a quarter away so the '
    + 'shoulders sit on a diagonal, face turned back to the camera and eyes '
    + 'looking straight down the lens, never off to the left, chin a fraction '
    + 'lifted, neck long, shoulders dropped and held. '
    + HANDS
    + ' A deliberate stance directed by a photographer -- not a snapshot, not a '
    + 'casual standing pose. '
    + FRAME_J,
};

// The garment is the ground the jewellery sits on: two layers, pattern woven
// or dyed into the cloth, sleeves short or pushed back. One jewellery type per
// figure -- watch, rings or bracelets -- worn in quantity so it reads as a line.
export const MODELS = [
  ['j01', POSE_J.turned, 'deep oxblood red', WHO.w1,
    'Wearing a short-sleeved camp-collar shirt in indigo adire, the pale cracked '
    + 'geometry resist-dyed into the cloth, deep indigo and chalk white, worn '
    + 'open over an acid yellow ribbed sleeveless tank top. Wearing wraparound '
    + 'single-lens visor sunglasses, a glossy white sculpted frame with one '
    + 'continuous narrow mirrored black lens across both eyes, curved to the '
    + 'face, no nose bridge visible. On the raised wrist a large hammered brass '
    + 'wristwatch, a heavy angular case with a faceted sculptural bezel and a '
    + 'matte black dial, on a woven indigo strap. No other jewellery. Long fine '
    + 'box braids gathered high.'],

  ['j02', POSE_J.centre, 'flat olive green', WHO.w2,
    'Wearing an oversized boxy chore jacket in heavy wax-print cotton, vermilion '
    + 'and cream geometry printed through the weave, worn open over a cobalt '
    + 'blue ribbed sleeveless tank top. Wearing wraparound single-lens visor '
    + 'sunglasses, a chrome silver sculpted frame with one continuous narrow '
    + 'mirrored blue lens across both eyes, curved to the face. On the raised '
    + 'wrist an oversized brushed steel and brass wristwatch, a broad squared '
    + 'case with a stepped bezel and a vermilion dial, on a heavy brass link '
    + 'bracelet. No other jewellery. Tight coiled locs in a high sculptural '
    + 'knot.'],

  ['j03', POSE_J.turned, 'pale mint', WHO.m2,
    'Wearing a boxy cropped zip jacket in beaten barkcloth, the grain and fibre '
    + 'running through the material, rust brown streaked with black, worn over a '
    + 'cream cotton work shirt with the sleeves pushed back. Wearing wraparound '
    + 'single-lens visor sunglasses, a matte black sculpted frame with one '
    + 'continuous narrow mirrored orange lens across both eyes, curved to the '
    + 'face. A stack of four hammered brass and blackened bronze cuff bracelets '
    + 'up one forearm, wide, ridged, faceted like machined metal. No other '
    + 'jewellery. Close-shaved head.'],

  ['j04', POSE_J.centre, 'hot pink', WHO.m1,
    'Wearing an oversized rugby shirt in wide woven bands of ochre yellow and '
    + 'cream with a white collar, worn under a cropped sleeveless vest in indigo '
    + 'adire. Wearing wraparound single-lens visor sunglasses, a glossy white '
    + 'sculpted frame with one continuous narrow mirrored black lens across both '
    + 'eyes, curved to the face, no nose bridge visible. On the raised wrist an '
    + 'oversized brushed titanium and brass wristwatch, a broad sculptural case '
    + 'with an exposed skeleton movement and a bright cobalt dial, on a heavy '
    + 'brass link bracelet. No other jewellery. Shoulder-length locs.'],

  ['j05', POSE_J.turned, 'deep cobalt blue', WHO.w1,
    'Wearing a knitted jacquard polo shirt, the pattern knitted into the yarn in '
    + 'ochre yellow and black, contrast cream ribbed collar, worn over a '
    + 'vermilion ribbed tank top. Wearing wraparound single-lens visor '
    + 'sunglasses, a translucent amber sculpted frame with one continuous narrow '
    + 'mirrored bronze lens across both eyes, curved to the face. On the raised '
    + 'wrist a heavy cast-bronze wristwatch, a round case with a deeply carved '
    + 'geometric bezel and a cream enamel dial, on a black woven strap. No other '
    + 'jewellery. Long fine box braids gathered high.'],

  ['j06', POSE_J.centre, 'burnt terracotta', WHO.w2,
    'Wearing a short-sleeved shirt woven from fine raffia yarn, the open weave '
    + 'visible in the cloth, wide bands of acid green and natural straw, worn '
    + 'open over a black ribbed sleeveless tank top. Wearing wraparound '
    + 'single-lens visor sunglasses, a glossy acid green sculpted frame with one '
    + 'continuous narrow mirrored silver lens across both eyes, curved to the '
    + 'face. A wide hinged brass cuff bracelet on each wrist, hammered, ridged, '
    + 'with a raised carved ridge down the centre, and a slim beaded cowrie band '
    + 'beside one. No other jewellery. Tight coiled locs in a high sculptural '
    + 'knot.'],

  ['j07', POSE_J.turned, 'flat olive green', WHO.m1,
    'Wearing a boxy short-sleeved work shirt in indigo adire, the pale resist '
    + 'geometry dyed into the cloth, worn over a heavy cream long-sleeve thermal '
    + 'with the sleeves pushed back to the elbow. Wearing wraparound single-lens '
    + 'visor sunglasses, a chrome silver sculpted frame with one continuous '
    + 'narrow mirrored black lens across both eyes, curved to the face. A '
    + 'blackened brass wristwatch with a deep octagonal case, a carved bezel and '
    + 'a pale bone-white dial, on a woven raffia strap. No other jewellery. '
    + 'Short coiled hair, faded at the sides.'],

  ['j08', POSE_J.centre, 'deep oxblood red', WHO.m1,
    'Wearing an oversized boxy short-sleeved shirt in woven kilim, the pattern '
    + 'woven through the cloth in cobalt and ochre, worn open over a cream '
    + 'ribbed sleeveless tank top. Wearing wraparound single-lens visor '
    + 'sunglasses, a glossy white sculpted frame with one continuous narrow '
    + 'mirrored gold lens across both eyes, curved to the face. On the raised '
    + 'wrist a wide polished brass wristwatch, a cushion case with a fluted '
    + 'bezel and a deep green dial, on a stiff cobalt woven strap. No other '
    + 'jewellery. Short coiled hair, faded at the sides.'],

  ['j09', POSE_J.turned, 'pale mint', WHO.m2,
    'Wearing a knitted jacquard polo shirt, the geometry knitted into the yarn '
    + 'in black and chalk white, worn under a tan leather utility vest. Wearing '
    + 'wraparound single-lens visor sunglasses, a matte black sculpted frame '
    + 'with one continuous narrow mirrored green lens across both eyes, curved '
    + 'to the face. A stack of hammered brass bangles and one heavy blackened '
    + 'bronze chain bracelet on the raised wrist, links faceted and machined. No '
    + 'other jewellery. Close-shaved head.'],

  ['j10', POSE_J.centre, 'deep cobalt blue', WHO.w1,
    'Wearing a short-sleeved camp-collar shirt in heavy wax-print cotton, acid '
    + 'green and vermilion geometry through the weave, worn open over a black '
    + 'ribbed sleeveless tank top. Wearing wraparound single-lens visor '
    + 'sunglasses, a glossy hot pink sculpted frame with one continuous narrow '
    + 'mirrored black lens across both eyes, curved to the face, no nose bridge '
    + 'visible. On the raised wrist a large hammered brass wristwatch, an '
    + 'oversized angular case with a faceted sculptural bezel and a pale bone '
    + 'dial, on a black woven strap. No other jewellery. Long fine box braids '
    + 'gathered high.'],
];

// The lead phrase decides what is being made before any other word lands.
// 'Studio fashion portrait' gets a shoot; 'photograph of a person' gets a
// snapshot; 'film still' gets a scene. This is a shoot.
export const prompt = (pose, ground, who, body) =>
  `Studio fashion portrait. ${who} ${body} ${pose} ${GROUND(ground)} ${LIGHT} ${CAMERA} ${SKIN}`;
