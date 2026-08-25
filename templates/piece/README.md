# The piece

`index.html` and `sun.js` are the finished work, verbatim. Copy them into the
project, change `LOOKS`, done.

    cp templates/piece/index.html   <project>/index.html
    cp templates/piece/sun.js       <project>/src/sun.js
    cp templates/piece/text.js      <project>/src/text.js
    cp src/gl.js                    <project>/src/gl.js
    cp src/shaders/sun.frag         <project>/src/shaders/

All four files, every time. `sun.js` imports `./gl.js`, `./text.js` and
`./shaders/sun.frag?raw` by relative path, so it runs with no dependency on the
kit at all -- which is what lets a finished piece be archived and still work
after the kit moves underneath it. Miss one and the page dies on a resolve
error before anything renders.

`LOOKS` is the only thing to edit — four entries, each one a figure and the
colours that travel with it:

```js
{ id:'l1', name:'Barkcloth', fig:'a01',
  pigment:'#AE7C1A', bg:'#E3DDD2', clothInk:'#8F7950',
  figH:0.850, figX:0.000, figBleed:0.050,
  pig:'Brass, unlacquered', origin:'Lagos · Foundry 4',
  material:'Barkcloth, beaten thin' },
```

`fig` is a filename in `src/figures/` without the extension.

## Do not rebuild any of this

The loader, the switch, the wave, the scramble, the reveal and the panel are all
in here and all correct. They were arrived at by watching them fail, and the
values are not derivable — `p ** 5` for the approach, ignition at
`smoothstep(0.90, 1.00, p)`, the cover releasing over 17 thousandths of the
reveal, the figure on `expoOut(seg(0.115, 0.78))`.

Assembling an equivalent from `scene()` and its parts produces something that
looks close and is wrong in a dozen small ways at once: the ground floods late,
the counter outlives the loader, the figure fades up behind the eclipse, the
transition degrades to a crossfade. Every one of those was found by rebuilding
instead of copying.

**If I ask for the loader, the slider, the transition or the reveal: copy this,
then change the data.**

`scene()` is for building something NEW. This is for reproducing what exists.
