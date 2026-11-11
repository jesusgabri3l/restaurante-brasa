const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Cuántos cuadros hay en public/frames/desktop y /mobile (frame-0001.webp ... frame-NNNN.webp).
export const HERO_FRAME_COUNT = 198;

export const HERO_FRAME_FOLDERS = { desktop: 'desktop', mobile: 'mobile' } as const;
export const MOBILE_QUERY = '(max-width: 768px)';

export const heroFrameUrl = (device: keyof typeof HERO_FRAME_FOLDERS, index: number) =>
  `${BASE}/frames/${HERO_FRAME_FOLDERS[device]}/frame-${String(index + 1).padStart(4, '0')}.webp`;

export const HERO_SCROLL_LENGTH = '+=600%';

// Flotantes del hero: archivo en public/images/floaters, posición (% del hero), tamaño (vw) y profundidad del parallax.
export const HERO_FLOATERS = [
  { file: 'onion-blur.webp', x: 22, y: 8, size: 13, depth: 0.6, spin: 30 },
  { file: 'lettuce.webp', x: 86, y: 14, size: 10, depth: 0.4, spin: -40 },
  { file: 'lettuce-blur.webp', x: 8, y: 62, size: 14, depth: 1, spin: 45 },
  { file: 'onion.webp', x: 5, y: 78, size: 8, depth: 0.5, spin: -25 },
  { file: 'tomato-blur.webp', x: 82, y: 60, size: 16, depth: 1.2, spin: -35 },
  { file: 'bacon.webp', x: 72, y: 80, size: 8, depth: 0.7, spin: 20 },
] as const;

export const HERO_TITLE = 'BRASA';
export const HERO_TAGLINE = 'Las mejores hamburguesas de Barranquilla';
