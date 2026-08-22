import { quad, hexToRgb } from './gl.js';
import frag from './shaders/field.frag?raw';
const view = quad(document.getElementById('c'), frag);
const $ = (id) => document.getElementById(id);
const NUM = { bands:'uBands', variance:'uVariance', rule:'uRule', drift:'uDrift',
  scale:'uScale', shape:'uShape', weight:'uWeight', break:'uBreak', ink:'uInk' };
const COL = { inkA:'uInkA', inkB:'uInkB', groundA:'uGroundA', groundB:'uGroundB' };
function push(){
  for(const [id,u] of Object.entries(NUM)){const v=parseFloat($(id).value);view.set(u,v);
    const o=$('o-'+id); if(o)o.textContent=v.toFixed(2);}
  for(const [id,u] of Object.entries(COL)) view.set(u,hexToRgb($(id).value));
}
for(const id of [...Object.keys(NUM),...Object.keys(COL)]) $(id).addEventListener('input',push);
push();
function frame(t){view.set('uTime',t*0.001);view.draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
