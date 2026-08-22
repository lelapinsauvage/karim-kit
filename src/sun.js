import { quad, hexToRgb } from './gl.js';
import frag from './shaders/sun.frag?raw';
const view = quad(document.getElementById('c'), frag);
const $ = (id) => document.getElementById(id);
const NUM = { r:'uR', edge:'uEdge', coreSize:'uCoreSize', rimBand:'uRimBand', drift:'uDrift',
  glow:'uGlow', glowSize:'uGlowSize', grain:'uGrain', grainSize:'uGrainSize' };
const COL = { hot:'uHot', mid:'uMid', rim:'uRim', glowCol:'uGlowCol', bgA:'uBgA', bgB:'uBgB' };
function push(){
  for(const [id,u] of Object.entries(NUM)){const v=parseFloat($(id).value);view.set(u,v);
    const o=$('o-'+id); if(o)o.textContent=v.toFixed(3);}
  for(const [id,u] of Object.entries(COL)) view.set(u,hexToRgb($(id).value));
  const cx=parseFloat($('coreX').value), cy=parseFloat($('coreY').value);
  view.set('uCore',[cx,cy]); $('o-coreX').textContent=cx.toFixed(2); $('o-coreY').textContent=cy.toFixed(2);
  view.set('uPos',[0,0]);
}
for(const id of [...Object.keys(NUM),...Object.keys(COL),'coreX','coreY']) $(id).addEventListener('input',push);
push();
function frame(t){view.set('uTime',t*0.001);view.draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
