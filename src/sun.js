import { quad, hexToRgb } from './gl.js';
import frag from './shaders/sun.frag?raw';
const view = quad(document.getElementById('c'), frag);
const $ = (id) => document.getElementById(id);
const NUM = { r:'uR', edge:'uEdge', coreSize:'uCoreSize', rimBand:'uRimBand', drift:'uDrift',
  glow:'uGlow', glowSize:'uGlowSize', grain:'uGrain', grainSize:'uGrainSize',
  grainMask:'uGrainMask' };
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

// hex field <-> swatch, both directions. typing a hex is faster than the
// native picker, and it is how colours actually arrive -- from a ref or Figma.
for(const id of Object.keys(COL)){
  const sw=$(id), hx=$(id+'-hex');
  sw.addEventListener('input',()=>{ hx.value=sw.value; });
  hx.addEventListener('input',()=>{
    let v=hx.value.trim(); if(v[0]!=='#') v='#'+v;
    if(/^#[0-9a-fA-F]{6}$/.test(v)){ sw.value=v; push(); }
  });
}

// dump the whole state -- so a look you like can be pasted straight into a
// character file instead of being re-dialled by hand
$('copy').onclick=()=>{
  const o={};
  for(const id of Object.keys(NUM)) o[id]=parseFloat($(id).value);
  o.core=[parseFloat($('coreX').value),parseFloat($('coreY').value)];
  for(const id of Object.keys(COL)) o[id]=$(id).value;
  const txt=JSON.stringify(o,null,2);
  navigator.clipboard.writeText(txt);
  $('copy').textContent='copied'; setTimeout(()=>$('copy').textContent='copy settings',900);
};

push();
function frame(t){view.set('uTime',t*0.001);view.draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
