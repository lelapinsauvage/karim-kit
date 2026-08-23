// minimal WebGL2 fullscreen-quad harness.
// no deps -- the shader is the artifact, not the wrapper.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s));
  }
  return s;
}

export function quad(canvas, frag) {
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // --- textures -------------------------------------------------------
  const texUnits = new Map();
  function texture(url, unit) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    // 1x1 transparent placeholder until the image lands
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // rect = the alpha bounding box in texture coords. cutouts come back with
    // wildly different amounts of empty padding, so framing by canvas height
    // makes identical figures render at different sizes. frame to content.
    const rec = { tex: t, unit, aspect: 1, rect: [0, 0, 1, 1], ready: false };
    texUnits.set(url, rec);
    const img = new Image();
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      // premultiply so the cutout's soft edge composites without a dark fringe
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      rec.rect   = alphaBounds(img);
      rec.aspect = (rec.rect[2] * img.width) / (rec.rect[3] * img.height);
      rec.ready  = true;
      rec.onready?.(rec);
    };
    img.src = url;
    return rec;
  }

  // one-time readback to find the opaque extent of a cutout
  function alphaBounds(img, threshold = 8) {
    const W = 220, H = Math.max(1, Math.round(W * img.height / img.width));
    const cv = Object.assign(document.createElement('canvas'), { width: W, height: H });
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (data[(y * W + x) * 4 + 3] > threshold) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return [0, 0, 1, 1];
    const pad = 1;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    return [x0 / W, y0 / H, (x1 - x0 + 1) / W, (y1 - y0 + 1) / H];
  }

  // a texture backed by a 2D canvas -- lets type be drawn with the browser's own
  // rasteriser and then composited INSIDE the shader, which is the only way the
  // figure can occlude it
  function canvasTexture(cv, unit) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const rec = {
      tex: t, unit,
      upload() {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      },
    };
    rec.upload();
    return rec;
  }

  const cache = new Map();
  const u = (name) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
    return cache.get(name);
  };

  // sizing is checked every frame rather than driven by an event.
  // resize listeners and ResizeObserver both missed cases here -- opening
  // devtools shrank the viewport without either firing, so the canvas kept
  // its load-time size and got clipped. two integer compares per frame can't
  // miss, whatever the browser decides to notify about.
  let lastW = 0, lastH = 0, lastDpr = 0;
  function syncSize() {
    // fullscreen on a retina display asks for ~6M pixels of a heavy fragment
    // shader. cap the ratio: past 1.5 nothing is visibly sharper here, and the
    // frame budget is what actually shows.
    const dpr = Math.min(devicePixelRatio, 1.5);
    // in fullscreen the fullscreen element defines the box, not the document
    const fs = document.fullscreenElement;
    const vv = window.visualViewport;
    const w = fs ? fs.clientWidth  : (vv ? Math.round(vv.width)  : document.documentElement.clientWidth);
    const h = fs ? fs.clientHeight : (vv ? Math.round(vv.height) : document.documentElement.clientHeight);
    if (w === lastW && h === lastH && dpr === lastDpr) return;
    lastW = w; lastH = h; lastDpr = dpr;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  syncSize();

  return {
    gl,
    program: prog,
    texture,
    canvasTexture,
    bind: (rec, uniformName) => {
      gl.activeTexture(gl.TEXTURE0 + rec.unit);
      gl.bindTexture(gl.TEXTURE_2D, rec.tex);
      const l = u(uniformName);
      if (l !== null) gl.uniform1i(l, rec.unit);
    },
    set: (name, v) => {
      // explicit: once a second program exists (a feedback pass), uniform
      // writes land on whatever program is current, not on this one
      gl.useProgram(prog);
      const l = u(name);
      if (l === null) return;
      if (name === 'uType') gl.uniform1i(l, v);
      else if (typeof v === 'number') gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      else if (v.length === 4) gl.uniform4f(l, v[0], v[1], v[2], v[3]);
      else gl.uniform3fv(l, v);   // flat Float32Array -> vec3[]
    },
    draw: () => {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      syncSize();
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

export const hexToRgb = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
};
