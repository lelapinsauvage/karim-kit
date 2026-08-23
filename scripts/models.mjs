// Batch model generation.
//
// Every prompt keeps the same six parts (see PROMPTING.md): format, subject and
// crop, pose as silhouette, garment with material named, FLAT light, capture.
// Only the pose and the garment change -- the light paragraph is identical
// everywhere, because a set of figures that were lit differently can never be
// dropped into the same scene.

const LIGHT = 'Even flat studio lighting, soft frontal light, no strong shadows, '
  + 'no rim light, neutral white balance, low contrast. Plain flat mid-grey '
  + 'seamless backdrop, nothing else in frame. Sharp focus, fine fibre detail '
  + 'visible, medium format, fashion editorial.';

export const MODELS = [
  ['p01', 'A dark-skinned woman facing camera straight on, shoulders square, chin level, gaze direct. Head shaved close. Wearing a wide flat disc collar of stacked brass rings sitting on the shoulders, and a matte black woven bodice.'],
  ['p02', 'A dark-skinned woman in strict side profile facing left, chin lifted. Hair in tall sculpted coils rising vertically. Wearing a high funnel collar of cut-pile raffia, dense velvet nap, deep indigo.'],
  ['p03', 'A dark-skinned man facing camera, shoulders square, head tilted slightly back. Short dense afro. Wearing an architectural shoulder piece in bogolan mud cloth, hard white geometry on near-black, standing away from the body.'],
  ['p04', 'A dark-skinned woman three-quarter turn to the right, looking back over her shoulder at camera. Long braided hair gathered high. Wearing a structured cape in strip-woven aso-oke with metallic thread, raised collar.'],
  ['p05', 'A dark-skinned woman facing camera, arms crossed low, shoulders wide. Sculptural headpiece of tightly coiled hair shaped into a flat crown. Wearing a beaded structural bodice, small coloured spheres in dense geometric rows.'],
  ['p06', 'A dark-skinned man in strict side profile facing right, neck long, chin level. Head wrapped in a tall sculpted headwrap of dark barkcloth. Wearing stacked brass neck coils and a matte black sleeveless garment.'],
  ['p07', 'A dark-skinned woman facing camera, head turned slightly left, eyes to camera. Hair sculpted into tall angular spikes standing out from the head. Wearing an oversized raffia dome collar covering the shoulders entirely.'],
  ['p08', 'A dark-skinned woman three-quarter turn to the left, chin down, gaze up to camera. Close-cropped hair with fine geometric parting. Wearing a stiff adire indigo shoulder piece with hand-painted white resist patterning.'],
  ['p09', 'A dark-skinned man facing camera straight on, shoulders square, expression still. Tall cylindrical hat in woven raffia. Wearing a heavy coat of open-weave wool with aged brass toggle fastenings, raised funnel collar.'],
  ['p10', 'A dark-skinned woman in strict side profile facing left, head tipped back, throat exposed. Hair in a single tall vertical column. Wearing a wide flat brass torque at the throat and a bogolan wrap across one shoulder.'],
];

export const prompt = (body) => `Editorial fashion photograph. ${body} ${LIGHT}`;
