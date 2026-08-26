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
  // SOFT, BUT OFF TO ONE SIDE.
  //
  // Flat and frontal is not the same as editorial, and this was set to flat.
  // A big source ON the lens axis lights everything equally and describes a
  // garment perfectly -- which is a catalogue photograph. The same source moved
  // forty-five degrees puts a shadow down the far cheek and under the jaw, and
  // that shadow is the whole difference between a product shot and a picture of
  // a person.
  //
  // Still no rim and still no hard key: a rim bakes into the cutout where it
  // fights the light the shader puts on her, and hard shadow loses the garment.
  // Soft light, moved.
  'Editorial studio lighting. One very large soft source at forty-five degrees '
  + 'to the subject and slightly above eye level, with a single weak bounce on '
  + 'the opposite side. A soft shadow falls down the far cheek and under the '
  + 'jaw and along the far side of the neck -- present and clearly readable, '
  + 'never black. The garment stays fully legible in the shadow. Moderate '
  + 'contrast, sculpted, deliberate. No rim light, no backlight, no hard key, '
  + 'no coloured gels. Faint specular sheen on the skin, catchlight in both '
  + 'eyes. '
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
// THE JEWELLERY IS THE SUBJECT NOW. One clause, shared, because a ring lit or
// finished differently from figure to figure stops being a line of jewellery
// and becomes ten unrelated props.
//
// Metal needs a shape to reflect: a specular highlight is a picture of the
// light source, and the one large soft source above gives it a clean
// rectangular catch. Without that named, brass comes back as orange plastic.
// The making is named for the same reason skin pores are -- planishing marks
// are what separate an object with a history from a render.
// ---------------------------------------------------------------------------
const JEWEL =
  'The metal is hand-hammered, uneven planishing marks across it, edges worn '
  + 'bright, carrying one clean rectangular highlight from the soft source. '
  + 'The rings and the wrist are as sharp as the face. No studio reflected in '
  + 'the metal.';

// ---------------------------------------------------------------------------
// ONE POSITION. Every figure stands the same way, so the set is a series
// rather than ten unrelated photographs -- and the near hand comes up to the
// jaw because that is the only place a ring reads at this crop.
// ---------------------------------------------------------------------------
// THE ELBOW WAS THE WIDEST THING IN THE PICTURE, AND NOW IT IS NOT.
//
// First pass named the elbow as the outermost point and told the camera to
// pull back until it cleared the edge. a03 and a06 came back with the whole
// upper arm running off the right edge anyway: the arm had been lifted to
// shoulder height and swung across the body, which puts the elbow further out
// than any camera position rescues at this crop.
//
// a07 is the one that worked, and the geometry is the fix -- forearm vertical,
// elbow low and tucked against the ribs, the whole arm inside the line of the
// shoulders. So the pose pulls the outermost point IN rather than asking the
// frame to reach further out, and the widest thing in the picture is the
// shoulders again. Both clauses say the same thing now; neither is left
// arguing for the old geometry.
const FRAME =
  // TIGHT, and nothing clipped. Those pull against each other and the answer is
  // to COMPOSE, not to zoom out.
  //
  // "Pull the camera back until nothing touches an edge" is the safe
  // instruction and it produces a passport photograph: the subject small in the
  // middle with air all round. The kept figures fill their frame -- head near
  // the top, shoulders near the sides, a margin rather than a border.
  'A tight head-and-shoulders portrait, the subject FILLING the frame: the top '
  + 'of the head close to the top edge and the shoulders close to the sides, '
  + 'with a small even margin of backdrop around them. Composed so that '
  + 'nothing is cut -- no shoulder, sleeve, elbow, hand or hair touches the '
  + 'left or right edge, and the top of the head is never cropped -- but the '
  + 'subject is close, not small in the middle of an empty picture. The bottom '
  + 'edge cuts across the CHEST, so the body runs off the bottom rather than '
  + 'ending inside the frame. No waist, no hips, no legs, no full-length '
  + 'figure.';

// ONE GESTURE EACH.
//
// A single pose paragraph applied to ten figures returns ten versions of the
// model's average of it -- the same failure as four descriptions producing four
// identical faces, one level up. The hand at the jaw is the one that worked;
// it should not be the only one.
//
// Picked per figure in the MODELS table. All of them keep the elbow low.
export const GESTURES = [
  'The near hand rests open beside the jaw, fingers long and slightly apart, the back of the hand to the camera.',
  'The near hand rests flat at the collarbone, fingers spread across it.',
  'One hand at the side of the neck, thumb along the jaw, chin turned a fraction into it.',
  'Both hands crossed low at the chest, wrists stacked, fingers relaxed.',
  'The near hand lifted to the ear, fingers just touching it, forearm close to the body.',
  'One hand loosely gripping the opposite shoulder, arm across the chest and low.',
  'The near hand at the throat, fingers curled, knuckles to the camera.',
  'A hand raised just past the chin, fingers loosely closed, held still.',
  'The near hand tucked under the jaw, chin resting lightly on the knuckles.',
  'One hand pressed flat to the upper chest, fingers together.',
];

export const POSE = {
  left: (GESTURE) =>
    // WHICH WAY SHE TURNS.
    //
    // "turned a quarter away" says nothing about direction, so half the set
    // came back facing right while the eyes went left -- a body pointing one
    // way and a gaze the other reads as a person being called from off-camera,
    // not as a figure standing in a frame. Direction is named now, and named
    // twice.
    // Direction named twice, because "turned a quarter away" names none and
    // half a set came back facing right with the eyes going left.
    'Head and shoulders, STANDING UPRIGHT, never seated. Body turned a quarter '
    + 'to the LEFT, left shoulder nearer the camera, head carried back over it, '
    + 'CHIN LEVEL, eyes off to the LEFT of frame past the camera. Turned left, '
    + 'looking left. Not facing right, not tilted up, not down the lens. Neck '
    + 'long, shoulders dropped. '
    // The gesture, and the one constraint that keeps it in frame: elbow DOWN.
    // A raised elbow is the widest thing in the picture and it is what got cut
    // off the sides.
    + GESTURE
    + ' The elbow stays low and tucked against the ribs, inside the line of the '
    + 'shoulders — never lifted, never swung out sideways. The other arm hangs '
    + 'out of frame. A deliberate stance directed by a photographer, not a '
    + 'snapshot. '
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
// The set. Each entry: pose, backdrop colour, the person, and then the
// jewellery FIRST and the garment after it -- the rings and the wrist are the
// subject now and the clothes are what they are worn against.
//
// Ten hands, ten different pieces: band, stack, signet, knuckle, shield, wire,
// disc, chain, shell, cuff. Two figures wearing the same ring are one figure
// photographed twice, exactly as two figures in the same colours are.
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
  p11: 'A Black woman in her mid twenties, dark sienna skin, heart-shaped '
    + 'face, very full mouth, a small vertical scar on the chin. ' + FACE,
  p12: 'A Black man in his late twenties, deep blue-black skin, long narrow '
    + 'face, prominent cheekbones, a mole high on one cheek. ' + FACE,
  p13: 'A Black woman in her early thirties, light copper-brown skin, square '
    + 'jaw, thick straight brows almost meeting. ' + FACE,
  p14: 'A Black man in his mid twenties, warm sepia skin, round face, soft '
    + 'full cheeks, a nose broken once and set slightly off centre. ' + FACE,
  p15: 'A Black woman in her late twenties, deep mahogany skin, long oval '
    + 'face, wide-set almond eyes, a narrow pointed chin. ' + FACE,
  p16: 'A Black man in his early thirties, dark olive-brown skin, broad flat '
    + 'cheekbones, a raised keloid scar along the jaw. ' + FACE,
  p17: 'A Black woman in her early twenties, very dark skin with a cool blue '
    + 'cast, small round face, wide nose, short upper lip. ' + FACE,
  p18: 'A Black man in his late twenties, golden-brown skin, angular face, a '
    + 'deep philtrum, one eyebrow naturally thinner than the other. ' + FACE,
  p19: 'A Black woman in her early thirties, warm caramel skin, strong square '
    + 'forehead, a scatter of dark moles across one cheek. ' + FACE,
  p20: 'A Black man in his early twenties, deep umber skin, narrow-set eyes, '
    + 'a long straight nose, a small mole beside the mouth. ' + FACE,
};

// STREETWEAR SILHOUETTES CUT FROM HERITAGE TEXTILE -- a plate carrier made of
// antique kilim, a puffer in bandana paisley, a camp collar in Dutch wax. That
// is the register in the references, and it is the difference between a
// clothing line and a costume department. Nothing ceremonial, nothing tribal,
// nothing "inspired by".
export const MODELS = [
  ['a01', POSE.left(GESTURES[0 % GESTURES.length]), 'deep cobalt blue', WHO.p01,
    'Three broad flat brass band rings on the raised hand, one to a finger, '
    + 'and a wide hammered brass cuff closed round that wrist. Wearing a boxy '
    + 'short-sleeved camp-collar shirt in heavy cotton, a wax-print concentric-'
    + 'disc repeat dyed into the cloth in vermilion and ochre yellow and cream, '
    + 'blunt squared shoulders, open at the throat over a black ribbed '
    + 'sleeveless tank top. Coiled twists gathered high off the crown into a '
    + 'tall standing pineapple.'],

  ['a02', POSE.left(GESTURES[1 % GESTURES.length]), 'burnt terracotta', WHO.p02,
    'Narrow brass rings stacked three and four deep on every finger of the '
    + 'raised hand, and a loose run of thin brass bangles down that forearm. '
    + 'Wearing a short-sleeved knitted jacquard polo shirt, a mosaic quatrefoil '
    + 'repeat knitted into the yarn in cobalt blue and acid yellow and cream, '
    + 'contrast cream ribbed collar, open at the throat. A big round afro '
    + 'picked out full and even.'],

  ['a03', POSE.left(GESTURES[2 % GESTURES.length]), 'hot pink', WHO.p03,
    'A heavy blackened-silver signet ring with a flat carved face on the raised '
    + 'hand, and a tight cowrie-shell bracelet strung round that wrist. Wearing '
    + 'a sleeveless tank top, kente strip-weave banding woven through the cloth '
    + 'in emerald green, ochre yellow and black, blunt squared armholes, high '
    + 'straight neckline. Natural hair cropped close and tapered to the skin at '
    + 'the sides.'],

  ['a04', POSE.left(GESTURES[3 % GESTURES.length]), 'acid green', WHO.p04,
    'Chunky cast brass knuckle rings across the middle joints of the raised '
    + 'hand, and one flat wide brass bangle on that wrist. Wearing a blunt boxy '
    + 'short-sleeved shirt in cotton, cracked adire resist medallions dyed into '
    + 'the cloth in hot pink and tangerine orange, blunt squared shoulders, '
    + 'open at the throat. Long fine box braids gathered high.'],

  ['a05', POSE.left(GESTURES[4 % GESTURES.length]), 'deep oxblood red', WHO.p05,
    'Wide hammered copper rings on the first two fingers of the raised hand, '
    + 'and a stack of thin copper bangles pushed up that forearm. Wearing a '
    + 'short-sleeved shirt in open-weave cotton gauze, the weave visible in the '
    + 'cloth, wide bands of mustard yellow and deep brown, blunt squared '
    + 'shoulders, open over a cobalt blue ribbed sleeveless tank top. Cornrows '
    + 'braided flat in tight arcs across the scalp, falling into short locs at '
    + 'the nape.'],

  ['a06', POSE.left(GESTURES[5 % GESTURES.length]), 'marigold yellow', WHO.p06,
    'One wide brass shield ring covering two knuckles of the raised hand, and a '
    + 'heavy hammered brass cuff high on that wrist. Wearing a sleeveless kente '
    + 'tank top, strip-weave bands woven through the cloth in cobalt blue, '
    + 'emerald green and black, blunt squared armholes, high straight neckline. '
    + 'A short flat-topped afro, faded to the skin at the sides.'],

  ['a07', POSE.left(GESTURES[6 % GESTURES.length]), 'violet purple', WHO.p07,
    'Twisted oxidised silver wire rings on three fingers of the raised hand, '
    + 'and a coiled silver wire bangle wound several times round that wrist. '
    + 'Wearing a boxy short-sleeved knitted polo shirt, a bogolan mud-cloth '
    + 'lattice knitted into the yarn in scarlet and forest green, contrast '
    + 'black ribbed collar, open at the throat. A high flat-top fade with sharp '
    + 'squared edges.'],

  ['a08', POSE.left(GESTURES[7 % GESTURES.length]), 'pale mint', WHO.p08,
    'Brass rings set with single cowrie shells on the raised hand, and a broad '
    + 'shell-and-brass bracelet on that wrist. Wearing a short-sleeved '
    + 'camp-collar shirt in heavy cotton, a wax-print broken-record spiral '
    + 'repeat dyed into the cloth in turquoise and burnt sienna, blunt squared '
    + 'shoulders, open at the throat over a cream ribbed sleeveless tank top. '
    + 'Shoulder-length free-form locs, thick and uneven, tied back off the '
    + 'face.'],

  ['a09', POSE.left(GESTURES[8 % GESTURES.length]), 'deep teal', WHO.p09,
    'Sculptural cast brass rings with blunt geometric heads on the raised hand, '
    + 'and a heavy open brass torque bangle on that wrist, the two ends not '
    + 'quite meeting. Wearing a sleeveless boxy tank top in aso-oke strip-weave '
    + 'cotton, narrow warp stripes and lozenge float-weave figures woven into '
    + 'the cloth in magenta and lime green, blunt squared armholes, high '
    + 'straight neckline. Bantu knots set in even rows across the scalp.'],

  ['a10', POSE.left(GESTURES[9 % GESTURES.length]), 'saffron orange', WHO.p10,
    'Flat hammered brass disc rings on the raised hand, each disc lying across '
    + 'the finger, and a heavy flat-link brass chain bracelet on that wrist. '
    + 'Wearing a short-sleeved camp-collar shirt in heavy cotton, a wax-print '
    + 'cowrie-and-spiral repeat dyed into the cloth in ochre and midnight blue, '
    + 'blunt squared shoulders, open at the throat over a cobalt blue ribbed '
    + 'sleeveless tank top. Natural hair shaved close and tapered to the skin '
    + 'all over.'],

  // ---------------------------------------------------------------------
  // The second ten. Ten more people, ten more backdrops, ten more pieces --
  // no colour and no ring repeated from the first ten, because the set is one
  // lookbook and a repeat reads as the same figure photographed twice.
  // ---------------------------------------------------------------------
  ['a11', POSE.left(GESTURES[10 % GESTURES.length]), 'scarlet red', WHO.p11,
    'A wide brass cigar band ring on the raised hand and a smooth brass tube '
    + 'bangle on that wrist. Wearing a boxy short-sleeved camp-collar shirt in '
    + 'heavy cotton, a wax-print fan repeat dyed into the cloth in turquoise '
    + 'and cream and black, blunt squared shoulders, open at the throat over a '
    + 'black ribbed sleeveless tank top. Long thin braids gathered into a high '
    + 'knot.'],

  ['a12', POSE.left(GESTURES[11 % GESTURES.length]), 'deep indigo', WHO.p12,
    'Blunt silver claw rings on two fingers of the raised hand and a flat wide '
    + 'silver cuff on that wrist. Wearing a blunt boxy short-sleeved shirt in '
    + 'cotton, adire resist stripes and dots dyed into the cloth in marigold '
    + 'yellow and chalk white, blunt squared shoulders, open at the throat. '
    + 'Short twists picked out and faded at the sides.'],

  ['a13', POSE.left(GESTURES[12 % GESTURES.length]), 'lime green', WHO.p13,
    'Beaten brass dome rings on the raised hand and a heavy flat brass chain '
    + 'round that wrist. Wearing a short-sleeved knitted jacquard polo shirt, '
    + 'a stepped-lozenge repeat knitted into the yarn in deep plum and black '
    + 'and cream, contrast plum ribbed collar, open at the throat. Micro '
    + 'braids pulled straight back off the face.'],

  ['a14', POSE.left(GESTURES[13 % GESTURES.length]), 'turquoise', WHO.p14,
    'Twisted brass rope rings on the raised hand and a matching brass rope '
    + 'bangle on that wrist. Wearing a sleeveless boxy tank top in aso-oke '
    + 'strip-weave cotton, narrow warp stripes woven into the cloth in scarlet '
    + 'and ochre, blunt squared armholes, high straight neckline. A dense crop '
    + 'of short coils, faded to the skin at the temples.'],

  ['a15', POSE.left(GESTURES[14 % GESTURES.length]), 'magenta', WHO.p15,
    'Blackened silver rings with flat square faces on the raised hand and a '
    + 'loose stack of thin silver bangles on that wrist. Wearing a short-'
    + 'sleeved shirt in open-weave cotton gauze, the weave visible in the '
    + 'cloth, broad bands of forest green and cream, blunt squared shoulders, '
    + 'open over a cream ribbed sleeveless tank top. Waist-length locs pulled '
    + 'back and bound at the crown.'],

  ['a16', POSE.left(GESTURES[15 % GESTURES.length]), 'deep plum', WHO.p16,
    'Flat brass spiral rings on the raised hand and a coiled brass wire band '
    + 'wound high on that wrist. Wearing a sleeveless kente tank top, strip-'
    + 'weave bands woven through the cloth in acid yellow and black and white, '
    + 'blunt squared armholes, high straight neckline. A low even fade with a '
    + 'sharp squared hairline.'],

  ['a17', POSE.left(GESTURES[16 % GESTURES.length]), 'cornflower blue', WHO.p17,
    'Heavy brass barrel rings on the raised hand and a hinged brass bangle on '
    + 'that wrist. Wearing a boxy short-sleeved camp-collar shirt in heavy '
    + 'cotton, a wax-print seed-and-chevron repeat dyed into the cloth in '
    + 'burnt orange and cream, blunt squared shoulders, open at the throat. '
    + 'Bantu knots set in two long rows.'],

  ['a18', POSE.left(GESTURES[17 % GESTURES.length]), 'olive green', WHO.p18,
    'Ridged silver band rings on three fingers of the raised hand and a flat '
    + 'silver plate cuff on that wrist. Wearing a boxy short-sleeved knitted '
    + 'polo shirt, a bogolan mud-cloth grid knitted into the yarn in hot pink '
    + 'and black, contrast black ribbed collar, open at the throat. A high '
    + 'sponge twist-out, dense and even.'],

  ['a19', POSE.left(GESTURES[18 % GESTURES.length]), 'coral', WHO.p19,
    'Openwork brass filigree rings on the raised hand and a cowrie-and-brass '
    + 'bracelet on that wrist. Wearing a sleeveless tank top, kente strip-'
    + 'weave banding woven through the cloth in cobalt blue and emerald green '
    + 'and black, blunt squared armholes, high straight neckline. Cornrows '
    + 'braided flat straight back, ending in a low bunch of locs.'],

  ['a20', POSE.left(GESTURES[19 % GESTURES.length]), 'chocolate brown', WHO.p20,
    'Brass rings with blunt pyramid heads on the raised hand and a wide beaten '
    + 'brass cuff on that wrist. Wearing a short-sleeved camp-collar shirt in '
    + 'heavy cotton, a wax-print concentric-square repeat dyed into the cloth '
    + 'in pale mint and vermilion, blunt squared shoulders, open at the throat '
    + 'over a vermilion ribbed sleeveless tank top. Hair shaved close with a '
    + 'single parting cut in at one side.'],
];

// The lead phrase decides what is being made before any other word lands.
// 'Studio fashion portrait' gets a shoot; 'photograph of a person' gets a
// snapshot; 'film still' gets a scene. This is a shoot.
export const prompt = (pose, ground, who, body) =>
  `Studio fashion portrait. ${who} ${body} ${pose} ${GROUND(ground)} ${LIGHT} ${CAMERA} ${SKIN} ${JEWEL}`;
