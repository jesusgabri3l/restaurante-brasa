// Convierte los PNG originales de fuentes/ a los WebP de public/. Correr de nuevo si cambian las fuentes.
// Tamaños: menú 640 px y flotantes 500 px (nunca se muestran más grandes; más pesaba en Lighthouse móvil).
import sharp from 'sharp';
import { existsSync, readdirSync } from 'node:fs';

const T = { r: 0, g: 0, b: 0, alpha: 0 };

for (const f of readdirSync('fuentes/menu')) {
  const trimmed = await sharp(`fuentes/menu/${f}`).trim().toBuffer();
  await sharp(trimmed).resize(588, 588, { fit: 'contain', background: T }).extend({ top: 26, bottom: 26, left: 26, right: 26, background: T })
    .webp({ quality: 80, alphaQuality: 90 }).toFile(`public/images/menu/${f.replace('.png', '.webp')}`);
}

for (const name of ['tomato', 'onion', 'lettuce', 'bacon']) {
  const sharpImg = await sharp(`fuentes/floaters/${name}.png`).trim().resize(500, 500, { fit: 'inside' }).toBuffer();
  await sharp(sharpImg).webp({ quality: 82, alphaQuality: 90 }).toFile(`public/images/floaters/${name}.webp`);
  // Desenfoque horneado desde el recorte nítido, con margen para que el borde se difumine sin cortarse.
  const pad = 75;
  const padded = await sharp(sharpImg).extend({ top: pad, bottom: pad, left: pad, right: pad, background: T }).png().toBuffer();
  await sharp(padded).blur(14).webp({ quality: 75, alphaQuality: 80 }).toFile(`public/images/floaters/${name}-blur.webp`);
}

await sharp('fuentes/story/parrilla.png').resize(1600, 1000, { fit: 'cover' }).webp({ quality: 80 }).toFile('public/images/story/parrilla.webp');
if (existsSync('fuentes/story/cheddar-drip.png')) {
  await sharp('fuentes/story/cheddar-drip.png').trim().resize(2400, null).webp({ quality: 80, alphaQuality: 90 }).toFile('public/images/story/cheddar-drip.webp');
}
await sharp('fuentes/map.png').resize(1200, 900, { fit: 'cover' }).webp({ quality: 80 }).toFile('public/images/map.webp');
console.log('ok');
