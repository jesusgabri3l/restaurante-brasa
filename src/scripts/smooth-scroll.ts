import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

export function startSmoothScroll() {
  if (prefersReducedMotion()) return;

  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Los enlaces ancla pasan por Lenis para que no peleen con el scroll suave.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector<HTMLElement>(link.getAttribute('href') ?? '');
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -40 });
    });
  });
}
