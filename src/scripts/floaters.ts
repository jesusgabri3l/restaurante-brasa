import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

export function startFloaters() {
  if (prefersReducedMotion()) return;
  const floaters = gsap.utils.toArray<HTMLElement>('[data-floater]');
  const stage = document.querySelector<HTMLElement>('[data-hero-stage]');
  if (!stage || floaters.length === 0) return;

  floaters.forEach((floater, index) => {
    const depth = Number(floater.dataset.depth);
    const spin = Number(floater.dataset.spin);

    // Entrada: llegan desde fuera/abajo con escala y giro, escalonados con el reveal de BRASA; luego giran lento.
    const fromLeft = parseFloat(floater.style.left) < 50;
    gsap.set(floater, { opacity: 0 });
    gsap
      .timeline({ delay: 0.3 + index * 0.1 })
      .fromTo(
        floater,
        { x: (fromLeft ? -1 : 1) * window.innerWidth * 0.3, y: window.innerHeight * 0.6, scale: 0.3, rotation: (fromLeft ? -1 : 1) * 160, opacity: 0 },
        { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
      )
      .to(floater, { rotation: spin * 4, duration: 60, ease: 'none', repeat: -1 });

    // Parallax con el mouse (x/y) y con el scroll (yPercent).
    const moveX = gsap.quickTo(floater, 'x', { duration: 0.8, ease: 'power3' });
    const moveY = gsap.quickTo(floater, 'y', { duration: 0.8, ease: 'power3' });
    stage.addEventListener('pointermove', (event) => {
      moveX((event.clientX / window.innerWidth - 0.5) * 60 * depth);
      moveY((event.clientY / window.innerHeight - 0.5) * 60 * depth);
    });

    gsap.to(floater, {
      yPercent: -60 * depth,
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top', end: '+=400%', scrub: true },
    });
  });

  ScrollTrigger.refresh();
}
