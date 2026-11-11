import { gsap } from 'gsap';
import { prefersReducedMotion } from './motion';

export function startMascotMotion() {
  if (prefersReducedMotion()) return;

  // Saludo: pequeño vaivén de rotación al entrar la sección Ordenar.
  gsap.to('[data-mascot-wave]', {
    keyframes: { rotation: [0, -10, 8, -6, 4, 0] },
    duration: 1.4,
    ease: 'sine.inOut',
    scrollTrigger: { trigger: '.order__info', start: 'top 60%', once: true },
  });
}
