// Separa las semillas de fuentes/floaters/sesame.png en recortes individuales -> public/images/floaters/seeds/seed-N.webp
import sharp from 'sharp';
import { mkdirSync, rmSync } from 'node:fs';

const { data, info } = await sharp('fuentes/floaters/sesame.png').flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const isSeed = new Uint8Array(w * h);
for (let p = 0; p < w * h; p++) {
  const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
  isSeed[p] = r - b > 55 && r < 252 ? 1 : 0; // tostado: más rojo que azul; el halo blanco no pasa
}
const label = new Int32Array(w * h);
const boxes = [];
for (let start = 0; start < w * h; start++) {
  if (!isSeed[start] || label[start]) continue;
  const id = boxes.length + 1;
  let [x0, y0, x1, y1, n] = [w, h, 0, 0, 0];
  const stack = [start];
  label[start] = id;
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); n++;
    for (const q of [p - 1, p + 1, p - w, p + w]) {
      if (q >= 0 && q < w * h && isSeed[q] && !label[q] && Math.abs((q % w) - x) <= 1) { label[q] = id; stack.push(q); }
    }
  }
  boxes.push({ id, x0, y0, x1, y1, n });
}
const seeds = boxes.filter((b) => b.n > 3000 && b.n < 20000); // sin migas ni semillas pegadas
rmSync('public/images/floaters/seeds', { recursive: true, force: true });
mkdirSync('public/images/floaters/seeds', { recursive: true });
let i = 0;
for (const b of seeds) {
  const pad = 4, bw = b.x1 - b.x0 + 1 + pad * 2, bh = b.y1 - b.y0 + 1 + pad * 2;
  const inSeed = (x, y) => {
    const sx = b.x0 - pad + x, sy = b.y0 - pad + y;
    return sx >= 0 && sy >= 0 && sx < w && sy < h && label[sy * w + sx] === b.id;
  };
  // Las semillas son convexas: se rellena entre el primer y último píxel de cada fila Y de cada columna
  // (así los brillos del borde, que no pasan el filtro de color, quedan dentro).
  const rowMin = new Array(bh).fill(Infinity), rowMax = new Array(bh).fill(-1);
  const colMin = new Array(bw).fill(Infinity), colMax = new Array(bw).fill(-1);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (inSeed(x, y)) {
    rowMin[y] = Math.min(rowMin[y], x); rowMax[y] = Math.max(rowMax[y], x);
    colMin[x] = Math.min(colMin[x], y); colMax[x] = Math.max(colMax[x], y);
  }
  const outside = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    outside[y * bw + x] = x >= rowMin[y] && x <= rowMax[y] && y >= colMin[x] && y <= colMax[x] ? 0 : 1;
  }
  const out = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const sx = b.x0 - pad + x, sy = b.y0 - pad + y, o = (y * bw + x) * 4;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
    const p = sy * w + sx;
    out[o] = data[p * 3]; out[o + 1] = data[p * 3 + 1]; out[o + 2] = data[p * 3 + 2];
    out[o + 3] = outside[y * bw + x] ? 0 : 255;
  }
  const alpha = await sharp(out, { raw: { width: bw, height: bh, channels: 4 } }).extractChannel(3).blur(0.8).toColourspace('b-w').raw().toBuffer();
  for (let p = 0; p < bw * bh; p++) out[p * 4 + 3] = alpha[p];
  await sharp(out, { raw: { width: bw, height: bh, channels: 4 } }).resize(96, 96, { fit: 'inside' }).webp({ quality: 85, alphaQuality: 90 }).toFile(`public/images/floaters/seeds/seed-${++i}.webp`);
}
console.log("semillas:", i, "— revisa a ojo y borra las mal recortadas (las pegadas o con brillos en el borde)");
