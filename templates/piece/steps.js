// WHAT IS ON SCREEN. The shaders agent edits this file and nothing else to
// bring something up.
//
// up() is a console function and an agent has no console -- it can only write
// files. Telling it to "run up('sun')" was telling it to do something it cannot
// do, so it correctly reported that it could not and nothing appeared.
//
// This is the same list, in a file. Add a name, the page reloads, the step is
// applied. Karim can still type up('sun') in the console; both routes end in
// the same place.
//
// Order does not matter. Remove a name to take it away.
//
//   'sun'      the light body
//   'cloth'    the pattern field
//   'figures'  the cutouts
//   'type'     the lockup
//   'chrome'   nav, rail, CTA, slider
//   'slider'   arrow keys and the switch
//
// The loader is deliberately NOT here: it plays once on load and is asked for
// separately, or it would replay on every save.

export const STEPS = [];
