import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  HERO_FRAME_COUNT,
  HERO_SCROLL_LENGTH,
  MOBILE_QUERY,
  heroFrameUrl,
} from '../config/hero';
import { prefersReducedMotion } from './motion';

const LAST_FRAME = HERO_FRAME_COUNT - 1;
const LOAD_STEP = 4;
const LOAD_CONCURRENCY = 6;
// Cuadros decodificados alrededor del actual. Los 198 decodificados pesan ~1 GB (1080x1080): Chrome los
// descartaba y drawImage los volvía a decodificar en el hilo principal en pleno scroll (el tirón).
const DECODED_RADIUS = 10;

// Se guarda el webp comprimido (~47 KB); createImageBitmap(blob) decodifica fuera del hilo principal.
const loadFrame = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error(url);
    return response.blob();
  });

// Orden de carga: primer y último cuadro, luego 1 de cada 4, luego el resto.
function frameLoadOrder() {
  const order = [0, LAST_FRAME];
  for (let i = LOAD_STEP; i < LAST_FRAME; i += LOAD_STEP) order.push(i);
  for (let i = 1; i < LAST_FRAME; i++) if (i % LOAD_STEP !== 0) order.push(i);
  return order;
}

export async function startHeroSequence() {
  const stage = document.querySelector<HTMLElement>('[data-hero-stage]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  const cta = document.querySelector<HTMLElement>('[data-hero-cta]');
  const tagline = document.querySelector<HTMLElement>('[data-hero-tagline]');
  const sparks = document.querySelector<SVGElement>('.hero__sparks');
  const context = canvas?.getContext('2d');
  if (!stage || !canvas || !context) return;

  const device = window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'desktop';
  const frames: (Blob | undefined)[] = new Array(HERO_FRAME_COUNT);
  const bitmaps = new Map<number, ImageBitmap>();
  const decoding = new Set<number>();
  const reducedMotion = prefersReducedMotion();
  let currentFrame = reducedMotion ? LAST_FRAME : 0;
  let drawnFrame = -1;

  const draw = () => {
    // Si el cuadro pedido aún no está decodificado, usa el decodificado más cercano.
    let index = -1;
    for (let distance = 0; distance <= DECODED_RADIUS * 2 && index < 0; distance++) {
      if (bitmaps.has(currentFrame - distance)) index = currentFrame - distance;
      else if (bitmaps.has(currentFrame + distance)) index = currentFrame + distance;
    }
    if (index < 0 || index === drawnFrame) return;
    drawnFrame = index;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmaps.get(index)!, 0, 0, canvas.width, canvas.height);
    // Los ingredientes entran por el borde superior: se difuminan en vez de salir de una raya.
    // Termina en 13%: el pan de arriba ya armado empieza en 15% del cuadro y queda opaco.
    const fade = context.createLinearGradient(0, 0, 0, canvas.height * 0.13);
    fade.addColorStop(0, 'rgb(0 0 0 / 0)');
    fade.addColorStop(1, '#000');
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = fade;
    // Todo el lienzo: destination-in borra lo que quede fuera del rectángulo (el degradado sigue opaco tras 13%).
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
  };

  const decodeAround = (center: number) => {
    bitmaps.forEach((bitmap, index) => {
      if (Math.abs(index - center) <= DECODED_RADIUS * 2 || index === drawnFrame) return;
      bitmap.close();
      bitmaps.delete(index);
    });
    for (let distance = 0; distance <= DECODED_RADIUS; distance++) {
      for (const index of [center + distance, center - distance]) {
        const blob = frames[index];
        if (!blob || bitmaps.has(index) || decoding.has(index)) continue;
        decoding.add(index);
        createImageBitmap(blob)
          .then((bitmap) => {
            if (Math.abs(index - currentFrame) > DECODED_RADIUS * 2) return bitmap.close();
            bitmaps.set(index, bitmap);
            if (Math.abs(index - currentFrame) < Math.abs(drawnFrame - currentFrame)) draw();
          })
          .catch(() => undefined)
          .finally(() => decoding.delete(index));
      }
    }
  };

  const decodeNow = async (index: number) => {
    bitmaps.set(index, await createImageBitmap(frames[index]!));
  };

  const showProgress = (progress: number) => {
    currentFrame = Math.round(progress * LAST_FRAME);
    // Se desvanece en el primer ~4% del scroll.
    if (tagline) tagline.style.opacity = String(Math.max(0, 1 - progress * 25));
    cta?.toggleAttribute('data-visible', progress > 0.94);
    sparks?.toggleAttribute('data-visible', progress > 0.97);
    decodeAround(currentFrame);
    draw();
  };

  frames[0] = await loadFrame(heroFrameUrl(device, 0));
  await decodeNow(0);
  canvas.width = bitmaps.get(0)!.width;
  canvas.height = bitmaps.get(0)!.height;

  if (reducedMotion) {
    frames[LAST_FRAME] = await loadFrame(heroFrameUrl(device, LAST_FRAME));
    await decodeNow(LAST_FRAME);
    if (tagline) tagline.style.opacity = '0';
    cta?.setAttribute('data-visible', '');
    sparks?.setAttribute('data-visible', '');
    draw();
    return;
  }

  showProgress(0);
  ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: HERO_SCROLL_LENGTH,
    pin: true,
    pinSpacer: stage.parentElement ?? undefined,
    scrub: true,
    onUpdate: (self) => showProgress(self.progress),
  });
  ScrollTrigger.refresh();

  // Varias descargas a la vez (antes era de a una: en 4G tardaba decenas de segundos en completar).
  const queue = frameLoadOrder();
  const worker = async () => {
    for (let index = queue.shift(); index !== undefined; index = queue.shift()) {
      frames[index] = await loadFrame(heroFrameUrl(device, index)).catch(() => undefined);
      if (Math.abs(index - currentFrame) <= DECODED_RADIUS) decodeAround(currentFrame);
    }
  };
  await Promise.all(Array.from({ length: LOAD_CONCURRENCY }, worker));
  decodeAround(currentFrame);
}
