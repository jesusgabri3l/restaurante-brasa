import { prefersReducedMotion } from './motion';

// Dos capas: semillas de ajonjolí y migas de pan que flotan.
const SEED_COUNT = 13;
const SEED_IMAGES = 11;
const CRUMB_COUNT = 9;
const MAX_DPR = 2;
const PARALLAX_RANGE = 28;

interface Seed {
  x: number;
  y: number;
  size: number;
  depth: number;
  angle: number;
  spin: number;
  speed: number;
  drift: number;
  image: HTMLImageElement;
  blur: number;
  alpha: number;
}

interface Crumb {
  x: number;
  y: number;
  size: number;
  depth: number;
  angle: number;
  spin: number;
  speed: number;
  drift: number;
  shape: [number, number][]; // contorno irregular en coordenadas -0.5..0.5
  alpha: number;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

export function startParticles() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-particles]');
  const context = canvas?.getContext('2d');
  if (!canvas || !context || prefersReducedMotion()) return;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const seedImages = Array.from({ length: SEED_IMAGES }, (_, i) => {
    const image = new Image();
    image.src = `${base}/images/floaters/seeds/seed-${i + 1}.webp`;
    return image;
  });
  let seeds: Seed[] = [];
  let crumbs: Crumb[] = [];
  let pointer = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0 };
  let isVisible = true;
  // Se dibuja en px CSS; el canvas se escala por DPR para que no se vea pixelado.
  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingQuality = 'high';
  };

  const createCrumb = (): Crumb => {
    const depth = random(0.4, 1);
    const points = 7;
    return {
      x: random(0, width),
      y: random(0, height),
      size: random(9, 17) * (0.6 + depth * 0.4),
      depth,
      angle: random(0, Math.PI * 2),
      spin: random(-0.006, 0.006),
      speed: random(0.06, 0.2) * depth,
      drift: random(-0.12, 0.12),
      shape: Array.from({ length: points }, (_, i) => {
        const radius = random(0.28, 0.5);
        const theta = (i / points) * Math.PI * 2;
        return [Math.cos(theta) * radius, Math.sin(theta) * radius * 0.8] as [number, number];
      }),
      alpha: depth < 0.55 ? 0.7 : 1,
    };
  };

  const createSeed = (): Seed => {
    const depth = random(0.3, 1);
    return {
      x: random(0, width),
      y: random(0, height),
      size: random(10, 22) * (0.55 + depth * 0.45),
      depth,
      angle: random(0, Math.PI * 2),
      spin: random(-0.004, 0.004),
      speed: random(0.05, 0.22) * depth,
      drift: random(-0.1, 0.1),
      image: seedImages[Math.floor(Math.random() * SEED_IMAGES)],
      // Las lejanas (poca profundidad) salen desenfocadas y más tenues.
      blur: depth < 0.55 ? random(1.5, 3) : 0,
      alpha: depth < 0.55 ? 0.6 : random(0.85, 1),
    };
  };

  const drawSeed = (s: Seed) => {
    if (!s.image.complete || !s.image.naturalWidth) return;
    context.save();
    context.translate(s.x + parallax.x * s.depth, s.y + parallax.y * s.depth);
    context.rotate(s.angle);
    context.globalAlpha = s.alpha;
    if (s.blur) context.filter = `blur(${s.blur * dpr}px)`;
    const height = s.size * (s.image.naturalHeight / s.image.naturalWidth);
    context.drawImage(s.image, -s.size / 2, -height / 2, s.size, height);
    context.restore();
  };

  const drawCrumb = (c: Crumb) => {
    context.save();
    context.translate(c.x + parallax.x * c.depth, c.y + parallax.y * c.depth);
    context.rotate(c.angle);
    context.scale(c.size, c.size);
    context.globalAlpha = c.alpha;
    const fill = context.createLinearGradient(-0.5, -0.5, 0.5, 0.5);
    fill.addColorStop(0, '#f3c36b');
    fill.addColorStop(0.55, '#c98a3c');
    fill.addColorStop(1, '#7a4219');
    context.beginPath();
    c.shape.forEach(([px, py], i) => (i ? context.lineTo(px, py) : context.moveTo(px, py)));
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.lineWidth = 0.05;
    context.strokeStyle = 'rgb(90 45 15 / 0.6)';
    context.stroke();
    // Brillo para que no se vea plana.
    context.beginPath();
    context.ellipse(-0.12, -0.14, 0.12, 0.06, -0.6, 0, Math.PI * 2);
    context.fillStyle = 'rgb(255 238 190 / 0.75)';
    context.fill();
    context.restore();
  };

  const tick = () => {
    requestAnimationFrame(tick);
    if (!isVisible) return;
    parallax.x += (pointer.x * PARALLAX_RANGE - parallax.x) * 0.05;
    parallax.y += (pointer.y * PARALLAX_RANGE - parallax.y) * 0.05;
    context.clearRect(0, 0, width, height);

    for (const s of seeds) {
      s.y -= s.speed;
      s.x += s.drift;
      s.angle += s.spin;
      if (s.y < -20) s.y = height + 20;
      if (s.x < -20) s.x = width + 20;
      if (s.x > width + 20) s.x = -20;
      drawSeed(s);
    }

    for (const c of crumbs) {
      c.y -= c.speed;
      c.x += c.drift;
      c.angle += c.spin;
      if (c.y < -20) c.y = height + 20;
      if (c.x < -20) c.x = width + 20;
      if (c.x > width + 20) c.x = -20;
      drawCrumb(c);
    }

  };

  resize();
  seeds = Array.from({ length: SEED_COUNT }, createSeed);
  crumbs = Array.from({ length: CRUMB_COUNT }, createCrumb);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX / window.innerWidth - 0.5, y: event.clientY / window.innerHeight - 0.5 };
  });
  new IntersectionObserver(([entry]) => (isVisible = entry.isIntersecting)).observe(canvas);
  requestAnimationFrame(tick);
}
