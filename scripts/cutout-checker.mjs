// Quita un fondo de cuadriculado "falso" (gris/blanco sin saturación) conectado al borde de la imagen.
// Uso: node scripts/cutout-checker.mjs entrada.png salida.png
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const chroma = (i) => Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
const LOW = 45; // por debajo: fondo gris; los brillos del queso quedan protegidos porque no tocan el borde
const bg = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || chroma(p * 3) >= LOW) continue;
  bg[p] = 1;
  const x = p % w, y = (p / w) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < w - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - w);
  if (y < h - 1) stack.push(p + w);
}
// Huecos encerrados (p. ej. entre brazo y cuerpo): zonas grandes de gris neutro y claro. Las pequeñas
// (brillos de los ojos) se respetan.
const gray = (p) => { const i = p * 3; return chroma(i) < 12 && Math.min(data[i], data[i + 1], data[i + 2]) > 200; };
const seen = new Uint8Array(w * h);
for (let start = 0; start < w * h; start++) {
  if (seen[start] || bg[start] || !gray(start)) continue;
  const region = [];
  const queue = [start];
  seen[start] = 1;
  while (queue.length) {
    const p = queue.pop();
    region.push(p);
    const x = p % w;
    for (const q of [p - 1, p + 1, p - w, p + w]) {
      if (q < 0 || q >= w * h || seen[q] || Math.abs((q % w) - x) > 1) continue;
      // El cuadriculado alterna dos grises: se aceptan ambos, pero no colores.
      if (gray(q)) { seen[q] = 1; queue.push(q); }
    }
  }
  if (region.length > 4000) for (const p of region) bg[p] = 1;
}
const out = Buffer.alloc(w * h * 4);
for (let p = 0; p < w * h; p++) {
  out[p * 4] = data[p * 3]; out[p * 4 + 1] = data[p * 3 + 1]; out[p * 4 + 2] = data[p * 3 + 2];
  out[p * 4 + 3] = bg[p] ? 0 : 255;
}
// Encoge el recorte ~3 px (quita el halo claro del cuadriculado) y suaviza el borde.
const mask = Buffer.alloc(w * h);
for (let p = 0; p < w * h; p++) mask[p] = out[p * 4 + 3];
const grown = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).blur(2.5).toColourspace('b-w').raw().toBuffer();
for (let p = 0; p < w * h; p++) mask[p] = grown[p] >= 250 ? 255 : 0; // solo queda lo que está lejos del fondo
const alpha = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).blur(1).toColourspace('b-w').raw().toBuffer();
if (alpha.length !== w * h) throw new Error('alpha size');
for (let p = 0; p < w * h; p++) out[p * 4 + 3] = alpha[p];
await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(output);
console.log('ok', output);
