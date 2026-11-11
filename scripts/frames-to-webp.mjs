// Regenerar el hero desde los videos de fuentes/video:
//   ffmpeg -i fuentes/video/kling3-f1-f8.mp4 -vf fps=14.4 -start_number 1 fuentes/video/raw/frame-%04d.png
//   ffmpeg -i fuentes/video/kling3-f0-f1.mp4 -vf fps=12 -start_number 1 fuentes/video/raw-intro/frame-%04d.png
//   ../.venv-rembg/Scripts/python scripts/cut-frames.py  (y con: fuentes/video/raw-intro fuentes/video/cut-intro)
//   node scripts/frames-to-webp.mjs  -> luego HERO_FRAME_COUNT en src/config/hero.ts
// fuentes/video/cut/*.png -> public/frames/{desktop 1080, mobile 640}/frame-NNNN.webp
import sharp from 'sharp';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';

// Secuencia = tramo de entrada (pan cae + salsa, fuentes/video/cut-intro) + video principal (fuentes/video/cut).
// Del principal se salta: el cuadro 1 (repite el último de la entrada) y 44-50 (el tomate cae dos veces).
const SKIP = new Set([1, 44, 45, 46, 47, 48, 49, 50]);
const list = (dir, skip = new Set()) =>
  readdirSync(dir)
    .filter((f) => /^frame-\d{4}\.png$/.test(f) && !skip.has(Number(f.slice(6, 10))))
    .sort()
    .map((f) => `${dir}/${f}`);
// Cuadros de la entrada que deben quedar vacíos: escena sin pan, los modelos inventan manchas de fondo.
const BLANK = new Set(['fuentes/video/cut-intro/frame-0001.png', 'fuentes/video/cut-intro/frame-0002.png', 'fuentes/video/cut-intro/frame-0003.png', 'fuentes/video/cut-intro/frame-0004.png', 'fuentes/video/cut-intro/frame-0005.png', 'fuentes/video/cut-intro/frame-0006.png']);
const files = [...list('fuentes/video/cut-intro'), ...list('fuentes/video/cut', SKIP)];

for (const [dir, size] of [['desktop', 1080], ['mobile', 640]]) {
  rmSync(`public/frames/${dir}`, { recursive: true, force: true });
  mkdirSync(`public/frames/${dir}`, { recursive: true });
  for (const [i, f] of files.entries()) {
    const name = `frame-${String(i + 1).padStart(4, '0')}.webp`; // renumera sin huecos
    // rembg deja semitransparente lo que sale borroso por movimiento (el pan cayendo): se endurece el alfa.
    const { data, info } = await sharp(f).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) data[i] = BLANK.has(f) ? 0 : Math.max(0, Math.min(255, (data[i] - 25) * 2.4));
    await sharp(data, { raw: info }).webp({ quality: 75, alphaQuality: 85 }).toFile(`public/frames/${dir}/${name}`);
  }
}
console.log('frames:', files.length);
