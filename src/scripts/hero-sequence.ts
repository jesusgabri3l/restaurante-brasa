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

const loadFrame = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    // decode() antes de usarlo: así drawImage no decodifica en pleno scroll (tirones en iOS).
    image.decode().then(() => resolve(image), reject);
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
  const frames: (HTMLImageElement | undefined)[] = new Array(HERO_FRAME_COUNT);
  const reducedMotion = prefersReducedMotion();
  let currentFrame = reducedMotion ? LAST_FRAME : 0;

  const draw = () => {
    // Si el cuadro pedido aún no carga, usa el más cercano hacia atrás.
    let index = currentFrame;
    while (index > 0 && !frames[index]) index--;
    const frame = frames[index];
    if (!frame) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  };

  const showProgress = (progress: number) => {
    currentFrame = Math.round(progress * LAST_FRAME);
    // Se desvanece en el primer ~4% del scroll.
    if (tagline) tagline.style.opacity = String(Math.max(0, 1 - progress * 25));
    cta?.toggleAttribute('data-visible', progress > 0.94);
    sparks?.toggleAttribute('data-visible', progress > 0.97);
    draw();
  };

  const [firstFrame] = await Promise.all([loadFrame(heroFrameUrl(device, 0))]);
  frames[0] = firstFrame;
  canvas.width = firstFrame.naturalWidth;
  canvas.height = firstFrame.naturalHeight;

  if (reducedMotion) {
    frames[LAST_FRAME] = await loadFrame(heroFrameUrl(device, LAST_FRAME));
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
      if (index <= currentFrame) draw();
    }
  };
  await Promise.all(Array.from({ length: LOAD_CONCURRENCY }, worker));
  draw();
}
